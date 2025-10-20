import { createContext } from "react";

export interface AuthContextType {
  userEmail: string | null;
  isAuthenticated: boolean;
  loading: boolean;
  checkAuth: () => Promise<void>;
  logout: () => void;
}

export const AuthContext = createContext<AuthContextType>({
  userEmail: null,
  isAuthenticated: false,
  loading: true,
  checkAuth: async () => {},
  logout: () => {},
});
