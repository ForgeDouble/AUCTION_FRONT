// src/pages/mypage/publicProfile/UserProfileApi.ts
import type { ApiResponse } from "@/type/CommonType";
import { ApiError, UnauthorizedError, DataReadError } from "@/errors/Errors";

const BASE =
(import.meta.env.VITE_API_BASE as string | undefined) ?? "http://localhost:8080";

async function safeFetch(url: string, init: RequestInit, fallback: string) {
  let res: Response;
  try {
    res = await fetch(url, init);
  } catch (e: any) {
    throw new ApiError(0, "INTERNAL_SERVER_ERROR" as any, "요청이 차단되었거나 네트워크 오류입니다.", undefined);
  }

  if (!res.ok) {
    if (res.status === 401 || res.status === 403) throw new UnauthorizedError();
    throw new ApiError(res.status, "INTERNAL_SERVER_ERROR" as any, fallback, undefined);
  }
  return res;
}

async function throwApiError(res: Response, fallback: string): Promise<never> {
  const text = await res.text().catch(() => "");
  let json: any = null;

  try {
    json = text ? JSON.parse(text) : null;
  } catch {
    json = null;
  }

  const code =
    json?.errorCode ??
    json?.statusCode ??
    json?.code ??
    json?.result?.errorCode ??
    json?.result?.statusCode ??
    json?.result?.code;

  const message =
    json?.message ??
    json?.errorMessage ??
    json?.statusMessage ??
    json?.status_message ??
    json?.result?.message ??
    json?.result?.errorMessage ??
    json?.result?.statusMessage ??
    fallback;

  const additionalInfo = json?.additionalInfo ?? json?.result?.additionalInfo ?? undefined;

  if (res.status === 401) {
    throw new UnauthorizedError(additionalInfo);
  }
  if (res.status === 403 && !code) {
    throw new ApiError(
      403,
      "UNAUTHORIZED_ACCESS" as any,
      "권한이 없습니다.",
      additionalInfo
    );
  }

  const finalCode = (code ? String(code) : "INTERNAL_SERVER_ERROR") as any;
  const finalMessage = String(message || fallback);

  throw new ApiError(res.status, finalCode, finalMessage, additionalInfo);
}

async function request<T>(path: string, token: string, init?: RequestInit): Promise<T> {
  const url = `${BASE}${path}`;

  let res: Response;
  try {
    res = await fetch(url, {
      ...init,
      headers: {
        ...(init?.headers || {}),
        Accept: "application/json",
        ...(token
          ? { Authorization: token.startsWith("Bearer ") ? token : `Bearer ${token}` }
          : {}),
      },
    });
  } catch (e) {
    throw new DataReadError("network");
  }

  if (!res.ok) {
    await throwApiError(res, `HTTP ${res.status}`);
  }

  if (res.status === 204) return undefined as unknown as T;

  const text = await res.text().catch(() => "");
  try {
    return (text ? JSON.parse(text) : null) as T;
  } catch {
    throw new DataReadError("json");
  }
}

export type PublicProfileDto = {
  userId: number;
  nickname: string | null;
  profileImageUrl: string | null;
  createdAt: string;
  tradeCount: number;

  totalProducts: number;
  sellingProducts: number;
  endedProducts: number;

  reportable: boolean;
};

export async function fetchPublicProfile(token: string, userId: number) {
  return request<ApiResponse<PublicProfileDto>>(`/user/profile/${userId}`, token, { method: "GET" });
}

export type UserProductsQuery = {
  page?: number;
  size?: number;
  search?: string;
  statuses?: string[];
  sortBy?: string;
};

export async function fetchProductsByTargetUser(token: string, userId: number, query: UserProductsQuery = {}) {
  const params = new URLSearchParams();
  params.set("page", String(query.page ?? 0));
  params.set("size", String(query.size ?? 10));

  if (query.search && query.search.trim()) params.set("search", query.search.trim());
  if (query.sortBy) params.set("sortBy", query.sortBy);

  if (query.statuses && query.statuses.length > 0) {
    query.statuses.forEach((s) => params.append("statuses", s));
  }

  return request<any>(`/product/user/${userId}?${params.toString()}`, token, { method: "GET" });
}