import type {
  AuctionRow,
  CalendarEventRow,
  NoticeCategory,
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

// 서버 CommonResDto 대응
type CommonResDto<T> = {
  status_code?: number;
  status_message?: string;
  result?: T;

  statusCode?: number;
  statusMessage?: string;
};
type NoticePageResponse = {
  items: any[];
  page: number;
  size: number;
  totalElements: number;
  totalPages: number;
};

export type NoticePage = {
  items: NoticeRow[];
  page: number;
  size: number;
  totalElements: number;
  totalPages: number;
};



function unwrap<T>(raw: CommonResDto<T> | T): T {
  if (raw && typeof raw === "object" && "result" in (raw as any)) {
    return (raw as CommonResDto<T>).result as T;
  }
  return raw as T;
}

// type NoticePage = {
//   items: any[];
//   page: number;
//   size: number;
//   totalElements: number;
//   totalPages: number;
// };

function normalizeNotice(x: any) {
  // 베이스 값
  // const category = (x.category ?? "ETC") as any;
  // const content = String(x.content ?? x.body ?? "");
  // const authorNickname = String(x.authorNickname ?? x.author ?? "");

  const createdAt = String(x.createdAt ?? new Date().toISOString());
  // const updatedAt = String(x.updatedAt ?? x.createdAt ?? createdAt);

  return {
    id: Number(x.id),
    category: (x.noticeCategory ?? x.category ?? "HANDOVER") as any,

    title: String(x.title ?? ""),
    content: String(x.content ?? x.body ?? ""),

    pinned: Boolean(x.pinned),
    importance: Number(x.importance ?? 50),

    authorUserId: Number(x.authorUserId ?? 0),
    authorEmail: String(x.authorEmail ?? ""),
    authorNickname: String(x.authorNickname ?? x.author ?? ""),

    createdAt: String(x.createdAt ?? new Date().toISOString()),
    updatedAt: String(x.updatedAt ?? x.createdAt ?? new Date().toISOString()),
  };
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const token = getToken();

  const res = await fetch((BASE ?? "") + path, {
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
  getNoticesPage: async (params?: { page?: number; size?: number; category?: string; pinned?: boolean; q?: string }) => {
    const sp = new URLSearchParams();
    sp.set("page", String(params?.page ?? 0));
    sp.set("size", String(params?.size ?? 10));

    if (params?.category) sp.set("category", params.category);
    if (typeof params?.pinned === "boolean") sp.set("pinned", String(params.pinned));
    if (params?.q) sp.set("q", params.q);

    const raw = await request<CommonResDto<NoticePageResponse>>(`/admin/notices?${sp.toString()}`);
    const pageRes = unwrap<NoticePageResponse>(raw);

    return {
      items: (pageRes.items ?? []).map(normalizeNotice),
      page: pageRes.page ?? 0,
      size: pageRes.size ?? (params?.size ?? 10),
      totalElements: pageRes.totalElements ?? 0,
      totalPages: pageRes.totalPages ?? 1,
    } as NoticePage;
  },


  getOverview: () =>
    request<CommonResDto<AdminOverviewResponse>>("/admin/overview").then((r) => unwrap<AdminOverviewResponse>(r)),

  getAuctions: () =>
    request<CommonResDto<AuctionRow[]>>("/admin/auctions").then((r) => unwrap<AuctionRow[]>(r)),

  suspendAuction: (auctionId: string, reason: string) =>
    request<CommonResDto<void>>(`/admin/auctions/${encodeURIComponent(auctionId)}/suspend`, {
      method: "POST",
      body: JSON.stringify({ reason }),
    }).then((r) => unwrap<void>(r)),

  forceEndAuction: (auctionId: string, reason: string) =>
    request<CommonResDto<void>>(`/admin/auctions/${encodeURIComponent(auctionId)}/force-end`, {
      method: "POST",
      body: JSON.stringify({ reason }),
    }).then((r) => unwrap<void>(r)),

  getReports: (params: { q?: string; status?: ReportStatus | "ALL"; severity?: ReportSeverity | "ALL" }) => {
    const sp = new URLSearchParams();
    if (params.q) sp.set("q", params.q);
    if (params.status && params.status !== "ALL") sp.set("status", params.status);
    if (params.severity && params.severity !== "ALL") sp.set("severity", params.severity);
    const qs = sp.toString();

    return request<CommonResDto<ReportRow[]>>(`/admin/reports${qs ? `?${qs}` : ""}`).then((r) => unwrap<ReportRow[]>(r));
  },

  assignReport: (reportId: string, assignee: string) =>
    request<CommonResDto<void>>(`/admin/reports/${encodeURIComponent(reportId)}/assign`, {
      method: "POST",
      body: JSON.stringify({ assignee }),
    }).then((r) => unwrap<void>(r)),

  resolveReport: (reportId: string, next: ReportStatus) =>
    request<CommonResDto<void>>(`/admin/reports/${encodeURIComponent(reportId)}/resolve`, {
      method: "POST",
      body: JSON.stringify({ status: next }),
    }).then((r) => unwrap<void>(r)),

  // 공지 목록(페이지)
  getNotices: async (params?: { page?: number; size?: number; category?: string; pinned?: boolean; q?: string }) => {
    const sp = new URLSearchParams();
    sp.set("page", String(params?.page ?? 0));
    sp.set("size", String(params?.size ?? 50));
    if (params?.category) sp.set("category", params.category);
    if (typeof params?.pinned === "boolean") sp.set("pinned", String(params.pinned));
    if (params?.q) sp.set("q", params.q);

    const data = await request<CommonResDto<NoticePageResponse> | NoticePageResponse>(`/admin/notices?${sp.toString()}`);
    const page = unwrap<NoticePageResponse>(data);

    const items = Array.isArray(page?.items) ? page.items : [];
    return items.map(normalizeNotice);
  },


  createNotice: (payload: {
    category: NoticeCategory;
    title: string;
    content: string;
    pinned?: boolean;
    importance?: number;
  }) =>
    request<CommonResDto<number>>("/admin/notices", {
      method: "POST",
      body: JSON.stringify(payload),
    }).then((r) => Number(unwrap<number>(r))),

  getNoticeDetail: (id: number) =>
    request<CommonResDto<any>>(`/admin/notices/${id}`)
      .then((r) => unwrap<any>(r))
      .then(normalizeNotice),

  updateNotice: (
    id: number,
    payload: {
      category?: NoticeCategory;
      title?: string;
      content?: string;
      pinned?: boolean;
      importance?: number;
    }
  ) =>
    request<CommonResDto<void>>(`/admin/notices/${id}`, {
      method: "PUT",
      body: JSON.stringify(payload),
    }).then((r) => unwrap<void>(r)),

  deleteNotice: (id: number) =>
    request<CommonResDto<void>>(`/admin/notices/${id}`, { method: "DELETE" }).then((r) => unwrap<void>(r)),

  // 캘린더
  getEvents: () =>
    request<CommonResDto<CalendarEventRow[]>>("/admin/calendar/events").then((r) => unwrap<CalendarEventRow[]>(r)),

  addEvent: (payload: Omit<CalendarEventRow, "id">) =>
    request<CommonResDto<CalendarEventRow>>("/admin/calendar/events", {
      method: "POST",
      body: JSON.stringify(payload),
    }).then((r) => unwrap<CalendarEventRow>(r)),
};
