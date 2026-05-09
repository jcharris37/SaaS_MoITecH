import React, { useState, useEffect } from 'react';
import { AuthContext } from './AuthContext';
import type { User } from './AuthContext';
import { apiFetch, saveTokens, clearTokens, logout as apiLogout } from '../services/api';

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null); // 🔥 IMPORTANTE
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const initAuth = async () => {
      const storedToken = localStorage.getItem('token');

      if (!storedToken) {
        setLoading(false);
        return;
      }

      try {
        const res = await apiFetch(`/api/me`, {
          headers: {
            Authorization: `Bearer ${storedToken}`,
          },
        });

        if (!res.ok) {
          throw new Error('Token inválido');
        }

        const userData = await res.json();

        setUser(userData);
        setToken(storedToken);

      } catch (error) {
        console.error('Error auth:', error);
        clearTokens();
        setUser(null);
        setToken(null);
      } finally {
        setLoading(false);
      }
    };

    initAuth();
  }, []);

  const login = (newToken: string, newUser: User, refreshToken: string) => {
    saveTokens(newToken, refreshToken ?? ' ');
    setToken(newToken);
    setUser(newUser);
  };

  const logout = async () => {
    await apiLogout(); 
    setUser(null);
    setToken(null);
  };

  return (
    <AuthContext.Provider value={{ user, token, login, logout, loading }}>
      {children}
    </AuthContext.Provider>
  );
};