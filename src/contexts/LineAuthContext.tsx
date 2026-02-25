import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';

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
const SESSION_KEY = 'line_session_token';

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
        localStorage.removeItem(SESSION_KEY);
        return null;
      }
      return await res.json();
    } catch {
      return null;
    }
  }, []);

  useEffect(() => {
    const init = async () => {
      const token = localStorage.getItem(SESSION_KEY);
      if (token) {
        const u = await fetchMe(token);
        setUser(u);
      }
      setLoading(false);
    };
    init();
  }, [fetchMe]);

  const logout = useCallback(async () => {
    const token = localStorage.getItem(SESSION_KEY);
    if (token) {
      try {
        await fetch(`${SUPABASE_URL}/functions/v1/auth-logout`, {
          method: 'POST',
          headers: { Authorization: `Bearer ${token}` },
        });
      } catch { /* best effort */ }
    }
    localStorage.removeItem(SESSION_KEY);
    setUser(null);
    window.location.href = '/';
  }, []);

  return (
    <LineAuthContext.Provider value={{ user, loading, isAuthenticated: !!user, logout }}>
      {children}
    </LineAuthContext.Provider>
  );
};
