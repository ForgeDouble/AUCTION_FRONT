// src/components/contexts/AuthProvider
import { useState, useEffect, type ReactNode } from "react";
import { fetchLoginEmail } from "../api/authApi";
import { AuthContext, type Authority } from "./AuthContext";

const BASE = import.meta.env.VITE_API_BASE;

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

type MeResult = {
  email?: string;
  userId?: number | string;
  uid?: number | string;
  id?: number | string;

  nickname?: string;
  profileImageUrl?: string;

  authority?: string;
};

function cacheBust(url: string) {
  const sep = url.includes("?") ? "&" : "?";
  return url + sep + "v=" + Date.now();
}

async function fetchMe(token: string): Promise<MeResult> {
  const res = await fetch(`${BASE}/user/detail`, {
    method: "GET",
    headers: { Authorization: `Bearer ${token}` },
  });

  if (!res.ok) {
    if (res.status === 401 || res.status === 403) throw new Error("AUTH_REQUIRED");
    const text = await res.text().catch(() => "");
    throw new Error(`내 정보 조회 실패 (${res.status}) ${text}`);
  }

  const json = await res.json().catch(() => null);
  return (json?.result ?? {}) as MeResult;
}

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
function toNumberOrNull(v: unknown): number | null {
  if (typeof v === "number") return Number.isFinite(v) ? v : null;
  if (typeof v === "string") {
    const n = Number(v);
    return Number.isFinite(n) ? n : null;
  }
  return null;
}

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [userId, setUserId] = useState<number | null>(null);
  const [nickname, setNickname] = useState<string | null>(null);
  const [profileImageUrl, setProfileImageUrl] = useState<string | null>(null);
  const [authority, setAuthority] = useState<Authority | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);

  const updateProfile = (patch: {
    nickname?: string | null;
    profileImageUrl?: string | null;
  }) => {
    if (patch.nickname !== undefined) setNickname(patch.nickname);
    if (patch.profileImageUrl !== undefined) setProfileImageUrl(patch.profileImageUrl);
  };

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
      const me = await fetchMe(token);

      const response = await fetchLoginEmail(token);
      const payload = parseJwt(token);

      const serverResult = response?.result;

      const emailFromServer =
        typeof serverResult === "string"
        ? serverResult
        : serverResult?.email ?? null;

      const emailFromToken = payload?.email ?? payload?.sub ?? null;

      setUserEmail(emailFromServer || me.email || emailFromToken || null);

      // const uidRaw = payload?.uid;
      // const uidNum =
      //   typeof uidRaw === "number"
      //     ? uidRaw
      //     : typeof uidRaw === "string"
      //     ? Number(uidRaw)
      //     : null;

      // setUserId(Number.isFinite(uidNum as number) ? (uidNum as number) : null);
      // setNickname(payload?.nick ?? null);
      // setProfileImageUrl(payload?.purl ?? null);
      // setAuthority((payload?.authority as Authority) ?? null);
      // setIsAuthenticated(true);
      const meId = toNumberOrNull(me.userId ?? me.uid ?? me.id);
      const tokenId = toNumberOrNull(payload?.uid);
      setUserId(meId ?? tokenId);

      setNickname(me.nickname ?? null);
      setProfileImageUrl(me.profileImageUrl ? cacheBust(me.profileImageUrl) : null);

      setAuthority(((me.authority ?? payload?.authority) as Authority) ?? null);

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
        updateProfile,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};
