// src/api/reportApi.ts
import { apiFetch } from "@/api/ApiClient";

export type ReportCategory = "SPAM" | "AD" | "ABUSE" | "HATE" | "SCAM" | "OTHER";
export type ReportTargetType = "USER" | "PRODUCT";

type CommonResDto<T> = {
  status_code?: number;
  status_message?: string;
  result?: T;

  statusCode?: number;
  statusMessage?: string;
};

const BASE = (import.meta as any).env?.VITE_API_BASE ?? "";

function getToken(): string | null {
  return localStorage.getItem("accessToken");
}

function unwrap<T>(raw: any): T {
  if (raw && typeof raw === "object" && "result" in raw) return raw.result as T;
  return raw as T;
}

function headersWithAuth() {
  const token = getToken();
  return {
    Accept: "application/json",
    "Content-Type": "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
}

export async function createUserReport(payload: {
  targetId: number;
  category: ReportCategory;
  content?: string | null;
  targetType?: ReportTargetType;
}): Promise<void> {
  const raw = await apiFetch<CommonResDto<any>>(BASE + "/report/create", {
    method: "POST",
    headers: headersWithAuth(),
    credentials: "include",
    body: JSON.stringify({
      ...payload,
      targetType: payload.targetType ?? "USER",
      content: payload.content ?? null,
    }),
  });
  unwrap(raw);
}

export async function createProductReport(payload: {
  productId: number;
  category: ReportCategory;
  content?: string | null;
}): Promise<void> {
  const raw = await apiFetch<CommonResDto<any>>(BASE + "/report/product/create", {
    method: "POST",
    headers: headersWithAuth(),
    credentials: "include",
    body: JSON.stringify({
      productId: payload.productId,
      category: payload.category,
      content: payload.content ?? null,
    }),
  });
  unwrap(raw);
}