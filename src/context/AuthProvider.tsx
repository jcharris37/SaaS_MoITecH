import React, { useState, useEffect, useCallback } from 'react';
import { AuthContext } from './AuthContext';
import type { User } from './AuthContext';
import { apiFetch, saveTokens, clearTokens, logout as apiLogout } from '../services/api';

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchUser = useCallback(async (storedToken: string) => {
    const res = await apiFetch('/api/me', { headers: { Authorization: `Bearer ${storedToken}` } });
    if (!res.ok) throw new Error('Token inválido');
    return res.json() as Promise<User>;
  }, []);

  useEffect(() => {
    const initAuth = async () => {
      const storedToken = localStorage.getItem('token');
      if (!storedToken) { setLoading(false); return; }
      try {
        const userData = await fetchUser(storedToken);
        setUser(userData);
        setToken(storedToken);
      } catch {
        clearTokens(); setUser(null); setToken(null);
      } finally {
        setLoading(false);
      }
    };
    initAuth();
  }, [fetchUser]);

  const login = (newToken: string, newUser: User, refreshToken: string) => {
    saveTokens(newToken, refreshToken ?? '');
    setToken(newToken);
    setUser(newUser);
  };

  const logout = async () => {
    await apiLogout();
    setUser(null);
    setToken(null);
  };

  const refreshUser = useCallback(async () => {
    const storedToken = localStorage.getItem('token');
    if (!storedToken) return;
    try {
      const userData = await fetchUser(storedToken);
      setUser(userData);
    } catch { /* silently fail */ }
  }, [fetchUser]);

  return (
    <AuthContext.Provider value={{ user, token, login, logout, loading, refreshUser }}>
      {children}
    </AuthContext.Provider>
  );
};