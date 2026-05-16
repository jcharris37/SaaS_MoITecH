import { createContext } from 'react';

export interface User {
  id: number;
  name: string;
  email: string;
  slug: string;
  role: string;
  business_type?: string;
  logo_url?: string | null;
  theme_color?: string;
  business_nit?: string | null;
  business_address?: string | null;
  tax_rate?: number;
}

export interface AuthContextType {
  user: User | null;
  token: string | null;
  login: (token: string, user: User, refreshToken: string) => void;
  logout: () => void;
  loading: boolean;
  refreshUser: () => Promise<void>;
}

export const AuthContext = createContext<AuthContextType | undefined>(undefined);