// src/api/reportApi.ts
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

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const token = getToken();

  const res = await fetch(BASE + path, {
    ...init,
    headers: {
      ...(init?.headers || {}),
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
  });

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(text?.trim() ? text : `HTTP ${res.status}`);
  }
  if (res.status === 204) return undefined as unknown as T;
  return (await res.json()) as T;
}

function unwrap<T>(raw: CommonResDto<T> | T): T {
  if (raw && typeof raw === "object" && "result" in (raw as any)) {
    return (raw as CommonResDto<T>).result as T;
  }
  return raw as T;
}

export async function createUserReport(payload: {
  targetId: number;
  category: ReportCategory;
  content?: string | null;
  targetType?: ReportTargetType;
}): Promise<void> {
  const raw = await request<CommonResDto<any>>("/report/create", {
    method: "POST",
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
  content?: string | null;
}): Promise<void> {
  const raw = await request<CommonResDto<any>>("/report/product/create", {
    method: "POST",
    body: JSON.stringify({
      productId: payload.productId,
      content: payload.content ?? null,
    }),
  });
  unwrap(raw);
}
