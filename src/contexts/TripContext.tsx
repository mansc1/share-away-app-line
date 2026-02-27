import React, { createContext, useContext, useEffect, useState, useCallback, useRef, useMemo } from 'react';
import { useLineAuth } from './LineAuthContext';
import { supabase } from '@/integrations/supabase/client';

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const SESSION_KEY = 'line_session_token';

export interface Trip {
  id: string;
  name: string;
  start_date: string;
  end_date: string;
  capacity_total: number;
  status: string;
  created_by_user_id: string;
  confirmed_at: string | null;
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
  currentMember: TripMember | null;
  memberNames: string[];
  isConfirmed: boolean;
  isAdmin: boolean;
  refetch: () => Promise<void>;
  getAvatarForName: (name: string) => string | null;
}

const TripContext = createContext<TripContextType | undefined>(undefined);

export const useTrip = () => {
  const ctx = useContext(TripContext);
  if (!ctx) throw new Error('useTrip must be used within TripProvider');
  return ctx;
};

export const TripProvider = ({ children }: { children: React.ReactNode }) => {
  const { user, isAuthenticated } = useLineAuth();
  const [trip, setTrip] = useState<Trip | null>(null);
  const [members, setMembers] = useState<TripMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [noTrip, setNoTrip] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const getToken = () => localStorage.getItem(SESSION_KEY);

  const fetchTrip = useCallback(async () => {
    const token = getToken();
    if (!token) { setLoading(false); return; }

    try {
      const res = await fetch(`${SUPABASE_URL}/functions/v1/get-active-trip`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();

      if (!data.trip) {
        setTrip(null);
        setMembers([]);
        setNoTrip(true);
        setLoading(false);
        return;
      }

      setTrip(data.trip);
      setNoTrip(false);

      // Fetch members
      const membersRes = await fetch(`${SUPABASE_URL}/functions/v1/get-trip-members`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ trip_id: data.trip.id }),
      });
      const membersData = await membersRes.json();
      setMembers(membersData.members || []);
    } catch (err) {
      console.error('TripContext fetch error:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  const debouncedRefetch = useCallback(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      fetchTrip();
    }, 300);
  }, [fetchTrip]);

  // Realtime subscription keyed on trip.id — only re-subscribes when trip actually changes
  const activeTripId = trip?.id ?? null;

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
    if (isAuthenticated) {
      fetchTrip();
    } else {
      setLoading(false);
    }
  }, [isAuthenticated, fetchTrip]);

  const currentMember = user
    ? members.find(m => m.user_id === user.id) ?? null
    : null;

  const memberNames = members.map(m => m.display_name);
  const isConfirmed = trip?.status === 'confirmed';
  const isAdmin = currentMember?.role === 'admin';

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
      trip, members, loading, noTrip, currentMember, memberNames,
      isConfirmed, isAdmin, refetch: fetchTrip, getAvatarForName,
    }}>
      {children}
    </TripContext.Provider>
  );
};
