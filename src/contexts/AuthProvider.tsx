import { useState, useEffect, type ReactNode } from "react";
import { fetchLoginEmail } from "../api/authApi";
import { AuthContext, type Authority } from "./AuthContext";

type JwtPayload = {
  email?: string;
  uid?: number | string;
  nick?: string;
  purl?: string;
  authority?: string;
  exp?: number;
  iat?: number;
  sub?: string;
};

// payload 된 것들 푸는 코드 이를 통해서 한글 깨짐 방지
function decodeBase64UrlUtf8(input: string) {
  const base64 = input.replace(/-/g, "+").replace(/_/g, "/");
  const pad = "=".repeat((4 - (base64.length % 4)) % 4);
  const bin = atob(base64 + pad);

  const bytes = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) {
    bytes[i] = bin.charCodeAt(i);
  }

  return new TextDecoder("utf-8").decode(bytes);
}

function parseJwt(token: string): JwtPayload | null {
  try {
    const parts = token.split(".");
  if (parts.length < 2) return null;
    const json = decodeBase64UrlUtf8(parts[1]);
    return JSON.parse(json);
  } catch {
    return null;
  }
}

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [userId, setUserId] = useState<number | null>(null);
  const [nickname, setNickname] = useState<string | null>(null);
  const [profileImageUrl, setProfileImageUrl] = useState<string | null>(null);
  const [authority, setAuthority] = useState<Authority | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);

  const clearAuth = () => {
    setUserEmail(null);
    setUserId(null);
    setNickname(null);
    setProfileImageUrl(null);
    setAuthority(null);
    setIsAuthenticated(false);
    setLoading(false);
  };

  const checkAuth = async () => {
    try {
    const token = localStorage.getItem("accessToken");

      if (!token) {
        clearAuth();
        return;
      }

      const response = await fetchLoginEmail(token);
      const payload = parseJwt(token);

      const emailFromServer = response?.result ?? null;
      const emailFromToken = payload?.email ?? payload?.sub ?? null;

      setUserEmail(emailFromServer || emailFromToken);

      const uidRaw = payload?.uid;
      const uidNum =
        typeof uidRaw === "number"
          ? uidRaw
          : typeof uidRaw === "string"
          ? Number(uidRaw)
          : null;

      setUserId(Number.isFinite(uidNum as number) ? (uidNum as number) : null);
      setNickname(payload?.nick ?? null);
      setProfileImageUrl(payload?.purl ?? null);
      setAuthority((payload?.authority as Authority) ?? null);
      setIsAuthenticated(true);
    } catch (err) {
      console.error("인증 확인 실패:", err);
      localStorage.removeItem("accessToken");
      clearAuth();
    } finally {
      setLoading(false);
    }
  };

  const logout = () => {
    localStorage.removeItem("accessToken");
    clearAuth();
  };

  useEffect(() => {
    checkAuth();
  }, []);

  return (
    <AuthContext.Provider
      value={{
        userEmail,
        userId,
        nickname,
        profileImageUrl,
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
