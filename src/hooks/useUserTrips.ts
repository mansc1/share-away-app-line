import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useToast } from "@/components/ui/use-toast";
import { useTrip } from "@/contexts/TripContext";
import { getStoredSessionToken } from "@/lib/session";

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const SETTLE_TIMEOUT_MS = 4000;
const RETRY_TIMEOUT_MS = 1800;
const POLL_INTERVAL_MS = 120;

export interface UserTripSummary {
  id: string;
  name: string;
  start_date: string;
  end_date: string;
  status: string;
  capacity_total: number;
  role: string;
  member_count: number;
  created_at: string | null;
  is_active: boolean;
}

function getAuthHeaders() {
  const token = getStoredSessionToken();
  return token ? { Authorization: `Bearer ${token}` } : {};
}

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

export const useUserTrips = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { toast } = useToast();
  const {
    refetch: refetchTripContext,
    effectiveTripId,
    persistedActiveTripId,
    isTripOverrideActive,
    beginTripSwitch,
    clearTripSwitch,
  } = useTrip();
  const [trips, setTrips] = useState<UserTripSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [switchingTripId, setSwitchingTripId] = useState<string | null>(null);
  const [switchError, setSwitchError] = useState<string | null>(null);
  const tripStateRef = useRef({
    effectiveTripId,
    persistedActiveTripId,
    isTripOverrideActive,
  });

  useEffect(() => {
    tripStateRef.current = {
      effectiveTripId,
      persistedActiveTripId,
      isTripOverrideActive,
    };
  }, [effectiveTripId, persistedActiveTripId, isTripOverrideActive]);

  const fetchTrips = useCallback(async () => {
    if (!getStoredSessionToken()) {
      setTrips([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    try {
      const res = await fetch(`${SUPABASE_URL}/functions/v1/get-user-trips`, {
        headers: { ...getAuthHeaders() },
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to load trips");
      }
      setTrips(data.trips || []);
    } catch (error) {
      console.error("fetchTrips error:", error);
      toast({
        title: "ข้อผิดพลาด",
        description: "ไม่สามารถโหลดรายการทริปได้",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    fetchTrips();
  }, [fetchTrips]);

  const navigateWithoutTripOverride = useCallback(() => {
    if (location.pathname !== "/app") return;

    const params = new URLSearchParams(location.search);
    if (!params.has("trip")) return;

    params.delete("trip");
    const nextSearch = params.toString();
    navigate(
      {
        pathname: "/app",
        search: nextSearch ? `?${nextSearch}` : "",
      },
      { replace: true },
    );
  }, [location.pathname, location.search, navigate]);

  const isSettled = useCallback((tripId: string) => {
    const state = tripStateRef.current;
    return (
      state.persistedActiveTripId === tripId &&
      state.effectiveTripId === tripId &&
      !state.isTripOverrideActive
    );
  }, []);

  const waitForSettlement = useCallback(async (tripId: string) => {
    const waitFor = async (timeoutMs: number) => {
      const deadline = Date.now() + timeoutMs;
      while (Date.now() < deadline) {
        if (isSettled(tripId)) return true;
        await sleep(POLL_INTERVAL_MS);
      }
      return false;
    };

    if (await waitFor(SETTLE_TIMEOUT_MS)) return true;
    await refetchTripContext();
    return waitFor(RETRY_TIMEOUT_MS);
  }, [isSettled, refetchTripContext]);

  const setActiveTrip = useCallback(async (tripId: string) => {
    if (!getStoredSessionToken()) {
      setSwitchError("ยังไม่ได้เข้าสู่ระบบ");
      return false;
    }

    setSwitchError(null);
    setSwitchingTripId(tripId);
    beginTripSwitch(tripId);

    try {
      const res = await fetch(`${SUPABASE_URL}/functions/v1/set-active-trip`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...getAuthHeaders(),
        },
        body: JSON.stringify({ trip_id: tripId }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to switch trip");
      }

      navigateWithoutTripOverride();
      await refetchTripContext();
      const settled = await waitForSettlement(tripId);

      if (!settled) {
        setSwitchError("ระบบยังไม่ยืนยันทริปใหม่ ลองอีกครั้งได้เลย");
        toast({
          title: "สลับทริปไม่สำเร็จ",
          description: "ระบบยังยืนยันบริบททริปใหม่ไม่ได้ หรือคุณไม่มีสิทธิ์เข้าถึงทริปนี้แล้ว",
          variant: "destructive",
        });
        return false;
      }

      await fetchTrips();
      return true;
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "สลับทริปไม่สำเร็จ";
      console.error("setActiveTrip error:", error);
      setSwitchError(message);
      toast({
        title: "สลับทริปไม่สำเร็จ",
        description: message,
        variant: "destructive",
      });
      return false;
    } finally {
      clearTripSwitch();
      setSwitchingTripId(null);
    }
  }, [beginTripSwitch, clearTripSwitch, fetchTrips, navigateWithoutTripOverride, refetchTripContext, toast, waitForSettlement]);

  const currentPersistedTrip = useMemo(
    () => trips.find((trip) => trip.id === persistedActiveTripId) ?? null,
    [persistedActiveTripId, trips],
  );

  const currentEffectiveTrip = useMemo(
    () => trips.find((trip) => trip.id === effectiveTripId) ?? null,
    [effectiveTripId, trips],
  );

  return {
    trips,
    loading,
    switchingTripId,
    switchError,
    currentPersistedTrip,
    currentEffectiveTrip,
    refetch: fetchTrips,
    setActiveTrip,
  };
};
