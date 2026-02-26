import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { useLineAuth } from './LineAuthContext';

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
  role: string;
  joined_at: string;
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

  return (
    <TripContext.Provider value={{
      trip, members, loading, noTrip, currentMember, memberNames,
      isConfirmed, isAdmin, refetch: fetchTrip,
    }}>
      {children}
    </TripContext.Provider>
  );
};
