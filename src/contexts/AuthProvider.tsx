import { useState, useEffect, type ReactNode } from "react";
import { fetchLoginEmail } from "../api/authApi";
import { AuthContext } from "./AuthContext";

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);

  const checkAuth = async () => {
    try {
      const response = await fetchLoginEmail();
      console.log(response);
      setUserEmail(response.result);
      setIsAuthenticated(true);
    } catch (err) {
      setUserEmail(null);
      setIsAuthenticated(false);
    } finally {
      setLoading(false);
    }
  };

  const logout = () => {
    setUserEmail(null);
    setIsAuthenticated(false);
  };

  useEffect(() => {
    checkAuth();
  }, []);

  return (
    <AuthContext.Provider
      value={{ userEmail, isAuthenticated, loading, checkAuth, logout }}
    >
      {children}
    </AuthContext.Provider>
  );
};
