import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import { useTrip } from "@/contexts/TripContext";
import { getStoredSessionToken } from "@/lib/session";

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;

interface TripAdminActionOptions {
  onStarted?: () => void | Promise<void>;
  onCancelled?: () => void | Promise<void>;
}

export const useTripAdminActions = (options: TripAdminActionOptions = {}) => {
  const { trip, refetch } = useTrip();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [starting, setStarting] = useState(false);
  const [cancelling, setCancelling] = useState(false);

  const startTrip = async () => {
    if (!trip) return false;

    setStarting(true);
    try {
      const token = getStoredSessionToken();
      const res = await fetch(`${SUPABASE_URL}/functions/v1/confirm-trip`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ trip_id: trip.id }),
      });
      const data = await res.json();

      if (!res.ok) {
        const messages: Record<string, string> = {
          capacity_not_full: data.message || "สมาชิกยังไม่ครบ",
          forbidden: "เฉพาะแอดมินเท่านั้น",
          invalid_status: "ทริปไม่ได้อยู่ในสถานะเปิด",
        };
        toast({
          title: "ไม่สามารถเริ่มทริปได้",
          description: messages[data.code] || data.message,
          variant: "destructive",
        });
        return false;
      }

      toast({ title: "สำเร็จ", description: "เริ่มทริปเรียบร้อย" });
      await refetch();
      await options.onStarted?.();
      return true;
    } catch {
      toast({ title: "ข้อผิดพลาด", description: "เกิดข้อผิดพลาด", variant: "destructive" });
      return false;
    } finally {
      setStarting(false);
    }
  };

  const cancelTrip = async () => {
    if (!trip) return false;

    setCancelling(true);
    try {
      const token = getStoredSessionToken();
      const res = await fetch(`${SUPABASE_URL}/functions/v1/cancel-trip`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ trip_id: trip.id }),
      });
      const data = await res.json();

      if (!res.ok) {
        toast({
          title: "ยกเลิกทริปไม่สำเร็จ",
          description: data.message || "เกิดข้อผิดพลาด",
          variant: "destructive",
        });
        return false;
      }

      toast({ title: "ยกเลิกทริปแล้ว", description: "ทริปถูกยกเลิกเรียบร้อย" });
      await refetch();
      await options.onCancelled?.();
      navigate("/trip/new");
      return true;
    } catch {
      toast({ title: "ข้อผิดพลาด", description: "เกิดข้อผิดพลาด", variant: "destructive" });
      return false;
    } finally {
      setCancelling(false);
    }
  };

  return {
    starting,
    cancelling,
    startTrip,
    cancelTrip,
  };
};
