import type {
AdminOverviewResponse,
AuctionRow,
CalendarEventRow,
NoticeCategory,
NoticeRow,
ReportRow,
ReportSeverity,
ReportStatus,
} from "./adminTypes";

const BASE = import.meta.env.VITE_API_BASE as string | undefined;

function getToken(): string | null {
return localStorage.getItem("accessToken");
}

type ApiError = { path: string; status: number; message: string };

function unwrapCommon<T>(json: any): T {
if (json && typeof json === "object") {
if ("data" in json) return json.data as T; // 혹시 data 형태인 경우
if ("result" in json) return json.result as T; // 네 백엔드 CommonResDto는 result
}
return json as T;
}

async function parseErrorMessage(res: Response): Promise<string> {
const text = await res.text().catch(() => "");
if (!text) return `HTTP ${res.status}`;
try {
const j = JSON.parse(text);
if (j?.error_message) return String(j.error_message);
if (j?.message) return String(j.message);
if (j?.status_message) return String(j.status_message);
return text;
} catch {
return text;
}
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
if (!BASE) throw new Error("VITE_API_BASE is not set");

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
const msg = await parseErrorMessage(res);
const err: ApiError = { path, status: res.status, message: msg };
throw err;
}

if (res.status === 204) return undefined as unknown as T;

const json = await res.json().catch(() => null);
return unwrapCommon<T>(json);
}

type NoticePageResponse = {
items: NoticeRow[];
page: number;
size: number;
totalElements: number;
totalPages: number;
};

export type NoticeListParams = {
category?: NoticeCategory;
pinned?: boolean;
q?: string;
from?: string; // YYYY-MM-DD
to?: string; // YYYY-MM-DD
page?: number;
size?: number;
};

export type NoticeCreatePayload = {
category?: NoticeCategory;
title: string;
content: string;
pinned?: boolean;
importance?: number;
};

export type NoticeUpdatePayload = {
category?: NoticeCategory;
title?: string;
content?: string;
pinned?: boolean;
importance?: number;
};

export const adminApi = {
// (다른 탭은 아직 백엔드 없을 수 있으니 그대로 두되, refreshAll에서 allSettled로 감쌀 예정)
getOverview: () => request<AdminOverviewResponse>("/admin/overview"),
getAuctions: () => request<AuctionRow[]>("/admin/auctions"),
getReports: (params: { q?: string; status?: ReportStatus | "ALL"; severity?: ReportSeverity | "ALL" }) => {
const sp = new URLSearchParams();
if (params.q) sp.set("q", params.q);
if (params.status && params.status !== "ALL") sp.set("status", params.status);
if (params.severity && params.severity !== "ALL") sp.set("severity", params.severity);
const qs = sp.toString();
return request<ReportRow[]>(`/admin/reports${qs ? `?${qs}` : ""}`);
},
getEvents: () => request<CalendarEventRow[]>("/admin/calendar/events"),

// 공지(Notice)
getNotices: async (params?: NoticeListParams): Promise<NoticePageResponse> => {
const p = params || {};
const sp = new URLSearchParams();
if (p.category) sp.set("category", p.category);
if (typeof p.pinned === "boolean") sp.set("pinned", String(p.pinned));
if (p.q) sp.set("q", p.q);
if (p.from) sp.set("from", p.from);
if (p.to) sp.set("to", p.to);
sp.set("page", String(p.page ?? 0));
sp.set("size", String(p.size ?? 20));

const qs = sp.toString();
return request<NoticePageResponse>(`/admin/notices${qs ? `?${qs}` : ""}`);


},

// 지금은 “필수 아님” (create 후 바로 detail 때리면 너처럼 500을 맞을 수 있어서)
getNoticeDetail: (id: number) => request<NoticeRow>(`/admin/notices/${id}`),

createNotice: (payload: NoticeCreatePayload) =>
request<number>("/admin/notices", { method: "POST", body: JSON.stringify(payload) }),

updateNotice: (id: number, payload: NoticeUpdatePayload) =>
request<void>(`/admin/notices/${id}`, { method: "PUT", body: JSON.stringify(payload) }),

deleteNotice: (id: number) =>
request<void>(`/admin/notices/${id}`, { method: "DELETE" }),
};