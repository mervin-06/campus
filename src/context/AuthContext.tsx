import { createContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { apiRequest } from '../api/client';
import type { AuthResponse, AuthUser } from '../types';

interface AuthContextValue {
  user: AuthUser | null;
  token: string | null;
  loading: boolean;
  login: (payload: { name: string; registerNumber: string; password: string }) => Promise<void>;
  logout: () => void;
}

const storageKey = 'campusconnect-auth';

export const AuthContext = createContext<AuthContextValue>({
  user: null,
  token: null,
  loading: true,
  login: async () => undefined,
  logout: () => undefined
});

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const raw = localStorage.getItem(storageKey);

    if (!raw) {
      setLoading(false);
      return;
    }

    try {
      const parsed = JSON.parse(raw) as { user: AuthUser; token: string };
      setUser(parsed.user);
      setToken(parsed.token);
    } catch (_error) {
      localStorage.removeItem(storageKey);
    } finally {
      setLoading(false);
    }
  }, []);

  const login = async (payload: { name: string; registerNumber: string; password: string }) => {
    const response = await apiRequest<AuthResponse>(
      '/auth/login',
      {
        method: 'POST',
        body: JSON.stringify(payload)
      }
    );

    setUser(response.user);
    setToken(response.token);
    localStorage.setItem(storageKey, JSON.stringify(response));
  };

  const logout = () => {
    setUser(null);
    setToken(null);
    localStorage.removeItem(storageKey);
  };

  const value = useMemo(
    () => ({
      user,
      token,
      loading,
      login,
      logout
    }),
    [loading, token, user]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
