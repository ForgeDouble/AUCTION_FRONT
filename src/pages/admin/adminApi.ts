// src/pages/admin/adminApi.ts
import type {AuctionRow,CalendarEventRow,NoticeRow,OverviewStats,ReportRow,ReportSeverity,ReportStatus, } from "./adminTypes";

const BASE = (import.meta as any).env?.VITE_API_BASE;

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
    const err: ApiError = { status: res.status, message: msg };
    throw err;
  }

  // 204 No Content 대응
  if (res.status === 204) return undefined as unknown as T;
  return (await res.json()) as T;
}

/*
  여기서부터가 “백엔드와 매핑되는 실제 호출”
  네 백엔드 path가 다르면 아래만 수정하면 됨
*/
export const adminApi = {
  // 1) 개요 통계
  // 추천: GET /admin/overview
  getOverview: () => request<OverviewStats>("/admin/overview"),

  // 2) 경매 모니터링
  // 추천: GET /admin/auctions
  getAuctions: () => request<AuctionRow[]>("/admin/auctions"),

  // 추천: POST /admin/auctions/{id}/suspend
  suspendAuction: (auctionId: string, reason: string) =>
    request<void>(`/admin/auctions/${encodeURIComponent(auctionId)}/suspend`, {
      method: "POST",
      body: JSON.stringify({ reason }),
    }),

  // 추천: POST /admin/auctions/{id}/force-end
  forceEndAuction: (auctionId: string, reason: string) =>
    request<void>(`/admin/auctions/${encodeURIComponent(auctionId)}/force-end`, {
      method: "POST",
      body: JSON.stringify({ reason }),
    }),

  // 3) 신고
  // 추천: GET /admin/reports?status=&severity=&q=
  getReports: (params: {
    q?: string;
    status?: ReportStatus | "ALL";
    severity?: ReportSeverity | "ALL";
  }) => {
    const sp = new URLSearchParams();
    if (params.q) sp.set("q", params.q);
    if (params.status && params.status !== "ALL") sp.set("status", params.status);
    if (params.severity && params.severity !== "ALL") sp.set("severity", params.severity);
    const qs = sp.toString();
    return request<ReportRow[]>(`/admin/reports${qs ? `?${qs}` : ""}`);
  },

  // 추천: POST /admin/reports/{id}/assign
  assignReport: (reportId: string, assignee: string) =>
    request<void>(`/admin/reports/${encodeURIComponent(reportId)}/assign`, {
      method: "POST",
      body: JSON.stringify({ assignee }),
    }),

  // 추천: POST /admin/reports/{id}/resolve
  resolveReport: (reportId: string, next: ReportStatus) =>
    request<void>(`/admin/reports/${encodeURIComponent(reportId)}/resolve`, {
      method: "POST",
      body: JSON.stringify({ status: next }),
    }),

  // 4) 인수인계/공지
  // 추천: GET /admin/notices
  getNotices: () => request<NoticeRow[]>("/admin/notices"),

  // 추천: POST /admin/notices
  addNotice: (title: string, body: string) =>
    request<NoticeRow>("/admin/notices", {
      method: "POST",
      body: JSON.stringify({ title, body }),
    }),

  // 추천: POST /admin/notices/{id}/ack
  ackNotice: (noticeId: string) =>
    request<void>(`/admin/notices/${encodeURIComponent(noticeId)}/ack`, { method: "POST" }),

  // 5) 운영 캘린더
  // 추천: GET /admin/calendar/events
  getEvents: () => request<CalendarEventRow[]>("/admin/calendar/events"),

  // 추천: POST /admin/calendar/events
  addEvent: (payload: Omit<CalendarEventRow, "id">) =>
    request<CalendarEventRow>("/admin/calendar/events", {
      method: "POST",
      body: JSON.stringify(payload),
    }),
};
