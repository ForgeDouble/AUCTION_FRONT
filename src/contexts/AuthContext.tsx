// src/components/contexts/AuthContext/tsx
import { createContext } from "react";

export type Authority = "USER" | "ADMIN" | "INQUIRY" | string;

export interface AuthContextType {
  userEmail: string | null;
  userId: number | null;
  nickname: string | null;
  profileImageUrl: string | null;
  authority: Authority | null;
  isAuthenticated: boolean;
  loading: boolean;
  checkAuth: () => Promise<void>;

  logout: () => void;

  updateProfile: (patch: {
    nickname?: string | null;
    profileImageUrl?: string | null;
  }) => void;
}

export const AuthContext = createContext<AuthContextType>({
  userEmail: null,
  userId: null,
  nickname: null,
  profileImageUrl: null,
  authority: null,
  isAuthenticated: false,
  loading: true,
  checkAuth: async () => {},

  logout: () => {},

  updateProfile: () => {},
});
