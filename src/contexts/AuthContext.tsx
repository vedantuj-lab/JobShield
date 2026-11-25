import React, { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { apiRequest, setAuthToken, setUnauthorizedHandler } from '../services/api';
import type { AuthUser } from '../types/jobshield';

interface AuthContextValue {
  user: AuthUser | null;
  loading: boolean;
  demoResetVersion: number;
  loginWithToken: (user: AuthUser, token: string) => void;
  loginDemo: (role: 'STUDENT' | 'ADMIN') => Promise<AuthUser>;
  resetDemoData: () => Promise<void>;
  refreshUser: () => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [demoResetVersion, setDemoResetVersion] = useState<number>(0);

  const clearSession = useCallback(() => {
    setAuthToken(null);
    setUser(null);
  }, []);

  useEffect(() => {
    setUnauthorizedHandler(clearSession);
  }, [clearSession]);

  const loginWithToken = useCallback((nextUser: AuthUser, token: string) => {
    setAuthToken(token);
    setUser(nextUser);
  }, []);

  const loginDemo = useCallback(async (role: 'STUDENT' | 'ADMIN') => {
    const res = await apiRequest<{ user: AuthUser; token: string }>('/api/auth/demo-login', {
      method: 'POST',
      body: JSON.stringify({ role }),
    });
    setAuthToken(res.token);
    setUser(res.user);
    return res.user;
  }, []);

  const resetDemoData = useCallback(async () => {
    const res = await apiRequest<{ reset: boolean; user: AuthUser; token: string }>('/api/demo/reset', {
      method: 'POST',
    });
    setAuthToken(res.token);
    setUser(res.user);
    setDemoResetVersion((v) => v + 1);
  }, []);

  const refreshUser = useCallback(async () => {
    setLoading(true);
    try {
      const data = await apiRequest<{ user: AuthUser }>('/api/auth/me');
      setUser(data.user);
    } catch {
      clearSession();
    } finally {
      setLoading(false);
    }
  }, [clearSession]);

  const logout = useCallback(async () => {
    try {
      await apiRequest('/api/auth/logout', { method: 'POST' });
    } catch {
      // Clear local session regardless
    } finally {
      clearSession();
    }
  }, [clearSession]);

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        demoResetVersion,
        loginWithToken,
        loginDemo,
        resetDemoData,
        refreshUser,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider');
  return ctx;
}
