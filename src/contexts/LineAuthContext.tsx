import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { clearStoredSessionToken, getStoredSessionToken, subscribeToSessionChanges } from '@/lib/session';
import { bootstrapLiffSession } from '@/lib/liff';

interface LineUser {
  id: string;
  line_sub: string;
  display_name: string | null;
  avatar_url: string | null;
}

interface LineAuthContextType {
  user: LineUser | null;
  loading: boolean;
  isAuthenticated: boolean;
  logout: () => Promise<void>;
}

const LineAuthContext = createContext<LineAuthContextType | undefined>(undefined);

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;

export const useLineAuth = () => {
  const context = useContext(LineAuthContext);
  if (!context) {
    throw new Error('useLineAuth must be used within a LineAuthProvider');
  }
  return context;
};

export const getLineLoginUrl = () => {
  return `${SUPABASE_URL}/functions/v1/auth-line-start`;
};

export const LineAuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<LineUser | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchMe = useCallback(async (token: string): Promise<LineUser | null> => {
    try {
      const res = await fetch(`${SUPABASE_URL}/functions/v1/auth-me`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) {
        clearStoredSessionToken();
        return null;
      }
      return await res.json();
    } catch {
      return null;
    }
  }, []);

  const syncUserFromSession = useCallback(async () => {
    setLoading(true);
    let token = getStoredSessionToken();
    if (!token) {
      token = await bootstrapLiffSession();
    }

    if (!token) {
      setUser(null);
      setLoading(false);
      return;
    }

    let u = await fetchMe(token);
    if (!u) {
      const liffToken = await bootstrapLiffSession();
      if (liffToken && liffToken !== token) {
        u = await fetchMe(liffToken);
      }
    }

    setUser(u);
    setLoading(false);
  }, [fetchMe]);

  useEffect(() => {
    syncUserFromSession();
    return subscribeToSessionChanges(syncUserFromSession);
  }, [syncUserFromSession]);

  const logout = useCallback(async () => {
    const token = getStoredSessionToken();
    if (token) {
      try {
        await fetch(`${SUPABASE_URL}/functions/v1/auth-logout`, {
          method: 'POST',
          headers: { Authorization: `Bearer ${token}` },
        });
      } catch { /* best effort */ }
    }
    clearStoredSessionToken();
    setUser(null);
    window.location.href = '/';
  }, []);

  return (
    <LineAuthContext.Provider value={{ user, loading, isAuthenticated: !!user, logout }}>
      {children}
    </LineAuthContext.Provider>
  );
};
