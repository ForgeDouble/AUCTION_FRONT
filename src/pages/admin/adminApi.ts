import type {
AuctionRow,
CalendarEventRow,
NoticeRow,
AdminOverviewResponse,
ReportRow,
ReportSeverity,
ReportStatus,
} from "./adminTypes";

const BASE = import.meta.env.VITE_API_BASE as string | undefined;

function getToken(): string | null {
  return localStorage.getItem("accessToken");
}

type ApiError = { status: number; message: string };

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
    const msg = text?.trim() ? text : `HTTP ${res.status}`;
    throw { status: res.status, message: msg } satisfies ApiError;
  }

  if (res.status === 204) return undefined as unknown as T;
  return (await res.json()) as T;
}

export const adminApi = {
  // 개요 통계
  getOverview: () => request<AdminOverviewResponse>("/admin/overview"),

  // 경매
  getAuctions: () => request<AuctionRow[]>("/admin/auctions"),
  suspendAuction: (auctionId: string, reason: string) =>
  request<void>(`/admin/auctions/${encodeURIComponent(auctionId)}/suspend`, {
    method: "POST",
    body: JSON.stringify({ reason }),
  }),
  forceEndAuction: (auctionId: string, reason: string) =>
  request<void>(`/admin/auctions/${encodeURIComponent(auctionId)}/force-end`, {
    method: "POST",
    body: JSON.stringify({ reason }),
  }),

  // 신고
  getReports: (params: { q?: string; status?: ReportStatus | "ALL"; severity?: ReportSeverity | "ALL" }) => {
    const sp = new URLSearchParams();
    if (params.q) sp.set("q", params.q);
    if (params.status && params.status !== "ALL") sp.set("status", params.status);
    if (params.severity && params.severity !== "ALL") sp.set("severity", params.severity);
    const qs = sp.toString();
    return request<ReportRow[]>(`/admin/reports${qs ? `?${qs}` : ""}`);
  },
  assignReport: (reportId: string, assignee: string) =>
  request<void>(`/admin/reports/${encodeURIComponent(reportId)}/assign`, {
    method: "POST",
    body: JSON.stringify({ assignee }),
  }),
  resolveReport: (reportId: string, next: ReportStatus) =>
  request<void>(`/admin/reports/${encodeURIComponent(reportId)}/resolve`, {
    method: "POST",
    body: JSON.stringify({ status: next }),
  }),

  // 공지
  getNotices: () => request<NoticeRow[]>("/admin/notices"),
  addNotice: (title: string, body: string) =>
  request<NoticeRow>("/admin/notices", { method: "POST", body: JSON.stringify({ title, body }) }),
  ackNotice: (noticeId: string) =>
  request<void>(`/admin/notices/${encodeURIComponent(noticeId)}/ack, { method: "POST" }`),

  // 캘린더
  getEvents: () => request<CalendarEventRow[]>("/admin/calendar/events"),
  addEvent: (payload: Omit<CalendarEventRow, "id">) =>
  request<CalendarEventRow>("/admin/calendar/events", { method: "POST", body: JSON.stringify(payload) }),
};