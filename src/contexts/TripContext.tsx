import React, { createContext, useContext, useEffect, useState, useCallback, useRef, useMemo } from 'react';
import { useLocation } from 'react-router-dom';
import { useLineAuth } from './LineAuthContext';
import { supabase } from '@/integrations/supabase/client';
import { getStoredSessionToken } from '@/lib/session';

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;

export interface Trip {
  id: string;
  name: string;
  start_date: string;
  end_date: string;
  capacity_total: number;
  status: string;
  created_by_user_id: string;
  confirmed_at: string | null;
  destination_country_code: string | null;
  default_expense_currency: string | null;
}

export interface TripMember {
  id: string;
  user_id: string;
  display_name: string;
  display_name_norm: string;
  role: string;
  joined_at: string;
  avatar_url?: string | null;
}

function normalizeDisplayName(name: string): string {
  return name.trim().toLowerCase().replace(/\s+/g, " ");
}

interface TripContextType {
  trip: Trip | null;
  members: TripMember[];
  loading: boolean;
  noTrip: boolean;
  effectiveTripId: string | null;
  persistedActiveTripId: string | null;
  isTripOverrideActive: boolean;
  tripSwitchingToId: string | null;
  isTripSwitching: boolean;
  currentMember: TripMember | null;
  memberNames: string[];
  isConfirmed: boolean;
  isAdmin: boolean;
  refetch: () => Promise<void>;
  beginTripSwitch: (tripId: string) => void;
  clearTripSwitch: () => void;
  getAvatarForName: (name: string) => string | null;
}

const TripContext = createContext<TripContextType | undefined>(undefined);

export const useTrip = () => {
  const ctx = useContext(TripContext);
  if (!ctx) throw new Error('useTrip must be used within TripProvider');
  return ctx;
};

export const TripProvider = ({ children }: { children: React.ReactNode }) => {
  const { user, isAuthenticated, loading: authLoading } = useLineAuth();
  const location = useLocation();
  const [trip, setTrip] = useState<Trip | null>(null);
  const [members, setMembers] = useState<TripMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [noTrip, setNoTrip] = useState(false);
  const [persistedActiveTripId, setPersistedActiveTripId] = useState<string | null>(null);
  const [tripSwitchingToId, setTripSwitchingToId] = useState<string | null>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const tripRef = useRef<Trip | null>(null);
  const membersRef = useRef<TripMember[]>([]);
  const overrideTripId = useMemo(() => {
    if (location.pathname !== '/app') return null;
    const params = new URLSearchParams(location.search);
    return params.get('trip');
  }, [location.pathname, location.search]);
  const isTripOverrideActive = !!overrideTripId;
  const effectiveTripId = trip?.id ?? null;

  const getToken = () => getStoredSessionToken();

  useEffect(() => {
    tripRef.current = trip;
  }, [trip]);

  useEffect(() => {
    membersRef.current = members;
  }, [members]);

  const fetchTrip = useCallback(async () => {
    const token = getToken();
    if (!token) {
      setTrip(null);
      setMembers([]);
      setNoTrip(false);
      setPersistedActiveTripId(null);
      setLoading(false);
      return;
    }

    setLoading(true);

    try {
      const res = await fetch(`${SUPABASE_URL}/functions/v1/get-active-trip`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      setPersistedActiveTripId(data.trip?.id ?? null);
      let resolvedTrip = data.trip ?? null;

      if (overrideTripId && overrideTripId !== resolvedTrip?.id) {
        const overrideRes = await fetch(`${SUPABASE_URL}/functions/v1/get-trip-by-id`, {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ trip_id: overrideTripId }),
        });

        if (overrideRes.ok) {
          const overrideData = await overrideRes.json();
          resolvedTrip = overrideData.trip ?? resolvedTrip;
        }
      }

      if (!resolvedTrip) {
        if (tripSwitchingToId && tripRef.current) {
          setTrip(tripRef.current);
          setMembers(membersRef.current);
          setNoTrip(false);
          setLoading(false);
          return;
        }
        setTrip(null);
        setMembers([]);
        setNoTrip(true);
        setLoading(false);
        return;
      }

      setTrip(resolvedTrip);
      setNoTrip(false);

      const membersRes = await fetch(`${SUPABASE_URL}/functions/v1/get-trip-members`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ trip_id: resolvedTrip.id }),
      });
      const membersData = await membersRes.json();
      setMembers(membersData.members || []);
    } catch (err) {
      console.error('TripContext fetch error:', err);
    } finally {
      setLoading(false);
    }
  }, [overrideTripId, tripSwitchingToId]);

  const debouncedRefetch = useCallback(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      fetchTrip();
    }, 300);
  }, [fetchTrip]);

  // Realtime subscription keyed on trip.id — only re-subscribes when trip actually changes
  const activeTripId = trip?.id ?? null;

  useEffect(() => {
    if (!isAuthenticated || !user?.id) return;

    const channel = supabase
      .channel(`user-active-trip-${user.id}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'user_active_trip',
          filter: `user_id=eq.${user.id}`,
        },
        () => {
          debouncedRefetch();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [isAuthenticated, user?.id, debouncedRefetch]);

  useEffect(() => {
    if (!isAuthenticated || !activeTripId) return;

    const channel = supabase
      .channel(`trip-members-${activeTripId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'trip_members',
          filter: `trip_id=eq.${activeTripId}`,
        },
        () => {
          debouncedRefetch();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [isAuthenticated, activeTripId, debouncedRefetch]);

  useEffect(() => {
    if (!isAuthenticated || !activeTripId) return;

    const channel = supabase
      .channel(`trip-${activeTripId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'trips',
          filter: `id=eq.${activeTripId}`,
        },
        () => {
          debouncedRefetch();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [isAuthenticated, activeTripId, debouncedRefetch]);

  useEffect(() => {
    if (authLoading) {
      setLoading(true);
      return;
    }

    if (isAuthenticated) {
      fetchTrip();
    } else {
      setTrip(null);
      setMembers([]);
      setNoTrip(false);
      setPersistedActiveTripId(null);
      setTripSwitchingToId(null);
      setLoading(false);
    }
  }, [authLoading, isAuthenticated, fetchTrip]);

  const currentMember = user
    ? members.find(m => m.user_id === user.id) ?? null
    : null;

  const memberNames = members.map(m => m.display_name);
  const isConfirmed = trip?.status === 'confirmed';
  const isAdmin = currentMember?.role === 'admin';
  const beginTripSwitch = useCallback((tripId: string) => {
    setTripSwitchingToId(tripId);
  }, []);
  const clearTripSwitch = useCallback(() => {
    setTripSwitchingToId(null);
  }, []);

  const memberAvatarsNorm = useMemo(() => {
    const map: Record<string, string> = {};
    members.forEach((m) => {
      const key = normalizeDisplayName(m.display_name || "");
      if (key && m.avatar_url) map[key] = m.avatar_url;
    });
    return map;
  }, [members]);

  const getAvatarForName = useCallback((name: string): string | null => {
    const key = normalizeDisplayName(name || "");
    return memberAvatarsNorm[key] || null;
  }, [memberAvatarsNorm]);

  return (
    <TripContext.Provider value={{
      trip,
      members,
      loading,
      noTrip,
      effectiveTripId,
      persistedActiveTripId,
      isTripOverrideActive,
      tripSwitchingToId,
      isTripSwitching: !!tripSwitchingToId,
      currentMember,
      memberNames,
      isConfirmed,
      isAdmin,
      refetch: fetchTrip,
      beginTripSwitch,
      clearTripSwitch,
      getAvatarForName,
    }}>
      {children}
    </TripContext.Provider>
  );
};
