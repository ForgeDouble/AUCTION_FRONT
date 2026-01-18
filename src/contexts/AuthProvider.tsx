// contexts/authprovider.tsx
import { useState, useEffect, type ReactNode } from "react";
import { fetchLoginEmail } from "../api/authApi";
import { AuthContext } from "./AuthContext";

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [authority, setAuthority] = useState<string | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);

  const checkAuth = async () => {
    try {
      const token = localStorage.getItem("accessToken");

      // 토큰이 없을 경우
      if (!token) {
        setUserEmail(null);
        setAuthority(null);
        setIsAuthenticated(false);
        setLoading(false);
        return;
      }

      // 토큰이 있을 경우
      const response = await fetchLoginEmail(token);
      console.log(response);
      setUserEmail(response.result.email);
      setAuthority(response.result.authority);
      setIsAuthenticated(true);
    } catch (err) {
      console.error("인증 확인 실패:", err);
      // 토큰이 만료되었거나 유효하지 않으면 제거
      localStorage.removeItem("accessToken");
      setUserEmail(null);
      setAuthority(null);
      setIsAuthenticated(false);
    } finally {
      setLoading(false);
    }
  };

  const logout = () => {
    localStorage.removeItem("accessToken");
    setUserEmail(null);
    setAuthority(null);
    setIsAuthenticated(false);
  };

  useEffect(() => {
    checkAuth();
  }, []);

  return (
    <AuthContext.Provider
      value={{
        userEmail,
        authority,
        isAuthenticated,
        loading,
        checkAuth,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};
