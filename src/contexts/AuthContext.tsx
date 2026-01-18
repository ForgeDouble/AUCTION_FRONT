import { createContext } from "react";

export interface AuthContextType {
  userEmail: string | null;
  authority: string | null;
  isAuthenticated: boolean;
  loading: boolean;
  checkAuth: () => Promise<void>;
  logout: () => void;
}

export const AuthContext = createContext<AuthContextType>({
  userEmail: null,
  authority: null,
  isAuthenticated: false,
  loading: true,
  checkAuth: async () => {},
  logout: () => {},
});
