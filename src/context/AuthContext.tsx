import { createContext } from 'react';

export interface User {
  id: number;
  name: string;
  email: string;
  slug: string;
  role: string;
}

export interface AuthContextType {
  user: User | null;
  token: string | null;
  login: (token: string, user: User, refreshToken: string) => void;
  logout: () => void;
  loading: boolean;
}

export const AuthContext = createContext<AuthContextType | undefined>(undefined);