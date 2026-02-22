import type {
  AuctionRow,
  CalendarEventRow,
  NoticeCategory,
  NoticeRow,
  AdminOverviewResponse,
  AdminReportGroupRow,
  AdminReportItemRow,
  BackendReportStatus,
  ReportCategory,
  SpringPage,
  BlockedProductRow,
  CategoryDistributionRow,
  ActiveHourBucketRow,
  AuctionTrendRow,
  MonthlyTradeRow,
  AdminUserRow,
  AdminUserCreateReq,
  Authority,
  AdminUserPageRes,
  AdminUserCounts,
  AdminChatRoomRow,
  AdminChatMessageRow,
  AdminChatCreateGroupReq,
  AdminChatMemberRow,
  AdminChatInviteReq,
} from "./adminTypes";
import { ApiError, UnauthorizedError } from "@/errors/Errors";

const BASE = import.meta.env.VITE_API_BASE as string | undefined;

function getToken(): string | null {
  return localStorage.getItem("accessToken");
}

// type ApiError = { status: number; message: string };

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

type ExtendSessionRes = {
  accessToken: string;
  expiresInSec: number;
};

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

  const additionalInfo =
  json?.additionalInfo ??
  json?.result?.additionalInfo ??
  undefined;

  if (res.status === 401) {
    throw new UnauthorizedError(additionalInfo);
  }
  if (res.status === 403 && !code) {
    throw new ApiError(
      403,
      "UNAUTHORIZED_ACCESS" as any,
      "권한이 없습니다. ADMIN/INQUIRY 계정인지 확인해 주세요.",
      additionalInfo
    );
  }
  const finalCode = (code ? String(code) : "INTERNAL_SERVER_ERROR") as any;
  const finalMessage = String(message || fallback);

  throw new ApiError(res.status, finalCode, finalMessage, additionalInfo);
}


async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const token = getToken();

  let res: Response;
  try {
    res = await fetch((BASE ?? "") + path, {
      ...init,
      headers: {
        ...(init?.headers || {}),
        Accept: "application/json",
        "Content-Type": "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
    });
  } catch (e) {
    throw new ApiError(
      0,
      "NETWORK_ERROR" as any,
      "네트워크 오류가 발생했습니다. 연결 상태를 확인해 주세요.",
      undefined
    );
  }

  if (!res.ok) {
    await throwApiError(res, `HTTP ${res.status}`);
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

function normalizeReportGroup(x: any): AdminReportGroupRow {
  return {
    targetUserId: Number(x.targetUserId ?? x.targetId ?? 0),
    targetName: x.targetName ?? null,
    targetNickname: x.targetNickname ?? null,
    category: (x.category ?? "OTHER") as ReportCategory,

    pendingCount: Number(x.pendingCount ?? 0),
    acceptedCount: Number(x.acceptedCount ?? 0),
    rejectedCount: Number(x.rejectedCount ?? 0),

    viewOnly: Boolean(x.viewOnly),
    suspendedUntil: x.suspendedUntil ? String(x.suspendedUntil) : null,
    warning: Number(x.warning ?? 0),

    lastReportedAt: x.lastReportedAt ? String(x.lastReportedAt) : null,
  };
}

function normalizeReportItem(x: any): AdminReportItemRow {
  return {
    id: Number(x.id ?? 0),
    status: (x.status ?? "PENDING") as BackendReportStatus,

    content: x.content ?? null,

    createdAt: x.createdAt ? String(x.createdAt) : null,
    processedAt: x.processedAt ? String(x.processedAt) : null,
    adminContent: x.adminContent ?? null,

    reporterId: x.reporterId != null ? Number(x.reporterId) : null,
    reporterName: x.reporterName ?? null,
    reporterNickname: x.reporterNickname ?? null,
  };
}

function normalizeBlockedProduct(x: any): BlockedProductRow {
  return {
    productId: Number(x.productId ?? 0),
    productName: String(x.productName ?? ""),
    reportCount: Number(x.reportCount ?? 0),
    blockedAt: x.blockedAt ? String(x.blockedAt) : null,
    blockedReason: x.blockedReason ? String(x.blockedReason) : null,
  };
}

function normalizeCategoryDistribution(x: any): CategoryDistributionRow {
  return {
    category: String(x.category ?? x.categoryName ?? x.name ?? ""),
    count: Number(x.count ?? x.value ?? 0),
  };
}

function normalizeActiveHourBucket(x: any): ActiveHourBucketRow {
  const h = String(x.hour ?? x.label ?? "00").padStart(2, "0");
  return {
    hour: h,
    count: Number(x.count ?? x.value ?? 0),
  };
}


// async function request<T>(path: string, init?: RequestInit): Promise<T> {
//   const token = getToken();

//   const res = await fetch((BASE ?? "") + path, {
//     ...init,
//     headers: {
//       ...(init?.headers || {}),
//       "Content-Type": "application/json",
//       ...(token ? { Authorization: `Bearer ${token}` } : {}),
//     },
//   });

//   if (!res.ok) {
//     const text = await res.text().catch(() => "");
//     const msg = text?.trim() ? text : `HTTP ${res.status}`;
//     throw { status: res.status, message: msg } satisfies ApiError;
//   }

//   if (res.status === 204) return undefined as unknown as T;
//   return (await res.json()) as T;
// }

// 관리자 유저 생성 관련 
function normalizeAdminUser(x: any): AdminUserRow {
  return {
    userId: Number(x.userId ?? x.id ?? 0),
    email: String(x.email ?? ""),
    name: String(x.name ?? ""),

    nickname: x.nickname != null ? String(x.nickname) : null,
    authority: String(x.authority ?? "USER").toUpperCase() as Authority,

    phone: x.phone != null ? String(x.phone) : null,
    profileImageUrl: x.profileImageUrl != null ? String(x.profileImageUrl) : null,

    warning: x.warning != null ? Number(x.warning) : null,
    suspendedUntil: x.suspendedUntil ? String(x.suspendedUntil) : null,
    viewOnly: x.viewOnly != null ? Boolean(x.viewOnly) : null,

    createdAt: x.createdAt ? String(x.createdAt) : null,
  };
}

function parseAuthorityFromAny(x: any): Authority {
  const pick =
    x?.authority ??
    x?.role ??
    x?.userRole ??
    x?.userAuthority ??
    x?.auth ??
    x?.grant;

  let raw = pick;

  if (raw && typeof raw === "object") {
    raw =
      raw.name ??
      raw.value ??
      raw.code ??
      raw.authority ??
      raw.role ??
      raw.type ??
      "";
  }

  const cleaned = String(raw ?? "USER")
    .trim()
    .toUpperCase()
    .replace(/^ROLE_/, "");

  if (cleaned.includes("ADMIN")) return "ADMIN";
  if (cleaned.includes("INQUIRY")) return "INQUIRY";
  return "USER";
}

function normalizeUser(x: any): AdminUserRow {
  const authority = parseAuthorityFromAny(x);

  return {
    userId: Number(x.userId ?? x.id ?? 0),
    email: String(x.email ?? ""),
    name: String(x.name ?? ""),
    nickname: x.nickname != null ? String(x.nickname) : null,
    phone: x.phone != null ? String(x.phone).replace(/\D/g, "") : null,
    authority,

    viewOnly: Boolean(x.viewOnly ?? false),
    suspendedUntil: x.suspendedUntil ? String(x.suspendedUntil) : null,
    delYn: (x.delYn ?? "N") as any,
    profileImageUrl: x.profileImageUrl ? String(x.profileImageUrl) : null,
  };
}

function formatRoomNameFallback(x: any): string {
  return String(x.roomName ?? x.name ?? x.title ?? "채팅방");
}

function normalizeChatRoom(x: any): AdminChatRoomRow {
  const roomTypeRaw = String(x.roomType ?? x.type ?? x.room_type ?? "").trim();

  return {
    id: String(x.id ?? x.roomId ?? ""),
    roomName: formatRoomNameFallback(x),
    roomType: (roomTypeRaw ? roomTypeRaw.toUpperCase() : undefined) as any,
    adminChat: Boolean(x.adminChat ?? false),
    participantIds: Array.isArray(x.participantIds) ? x.participantIds.map(String) : undefined,
    recentText: x.recentText != null ? String(x.recentText) : null,
    recentTime: x.recentTime != null ? String(x.recentTime) : null,
    unread: x.unread != null ? Number(x.unread) : 0,
    // roomKey: x.roomKey ?? null,
    // canRename: Boolean(x.canRename)
  };
}

function normalizeChatMessage(x: any): AdminChatMessageRow {
  return {
    id: String(x.id ?? ""),
    roomId: String(x.roomId ?? ""),
    senderId: String(x.senderId ?? x.senderEmail ?? ""),
    messageType: String(x.messageType ?? "TALK").toUpperCase() as any,
    message: x.message != null ? String(x.message) : null,
    files: Array.isArray(x.files)
      ? x.files.map((f: any) => ({ fileName: String(f.fileName ?? ""), fileUrl: String(f.fileUrl ?? "") }))
      : [],
    createdAt: x.createdAt != null ? String(x.createdAt) : null,

    sender: x.sender
      ? {
          userId: x.sender.userId != null ? Number(x.sender.userId) : undefined,
          email: String(x.sender.email ?? ""),
          nickname: x.sender.nickname != null ? String(x.sender.nickname) : null,
          authority: parseAuthorityFromAny(x.sender),
          profileImageUrl: x.sender.profileImageUrl != null ? String(x.sender.profileImageUrl) : null,
        }
      : null,
  };
}
function normalizeMember(x: any): AdminChatMemberRow {
  return {
    userId: x.userId != null ? Number(x.userId) : undefined,
    email: String(x.email ?? ""),
    nickname: x.nickname != null ? String(x.nickname) : null,
    authority: parseAuthorityFromAny(x),
    profileImageUrl: x.profileImageUrl != null ? String(x.profileImageUrl) : null,
  };
}

export const adminApi = {
  
  getOverview: () =>
    request<CommonResDto<AdminOverviewResponse>>("/admin/overview").then((r) => unwrap<AdminOverviewResponse>(r)),

  // getAuctions: () =>
  //   request<CommonResDto<AuctionRow[]>>("/admin/auctions").then((r) => unwrap<AuctionRow[]>(r)),
  getAuctionsPage: (params?: { page?: number; size?: number }) => {
    const sp = new URLSearchParams();
    sp.set("page", String(params?.page ?? 0));
    sp.set("size", String(params?.size ?? 20));

    return request<CommonResDto<SpringPage<AuctionRow>>>(`/admin/auctions?${sp.toString()}`)
      .then((r) => unwrap<SpringPage<AuctionRow>>(r));
  },

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

  // 신고(유저) - 그룹 목록
  getReportGroups: async () => {
    const raw = await request<CommonResDto<any[]>>("/report/admin/groups");
    const arr = unwrap<any[]>(raw) ?? [];
    return arr.map(normalizeReportGroup);
  },

  // 신고(유저) - 그룹 상세(페이지)
  getGroupReports: async (targetUserId: number, category: ReportCategory, page = 0, size = 20) => {
    const sp = new URLSearchParams();
    sp.set("page", String(page));
    sp.set("size", String(size));

    const raw = await request<CommonResDto<SpringPage<any>>>(`/report/admin/groups/${targetUserId}/${category}?${sp.toString()}`);
    const pg = unwrap<SpringPage<any>>(raw);

    return {
      ...pg,
      content: (pg.content ?? []).map(normalizeReportItem),
    } as SpringPage<AdminReportItemRow>;
  },

  // 신고(유저) - 그룹 처리(승인/기각)
  resolveReportGroup: (targetUserId: number, category: ReportCategory, payload: { accept: boolean; adminContent?: string; suspendDays?: number }) =>
    request<CommonResDto<void>>(`/report/admin/resolve/${targetUserId}/${category}`, {
      method: "POST",
      body: JSON.stringify(payload),
    }).then((r) => unwrap<void>(r)),

  // 관리자 즉시 정지/해제
  adminSuspendUser: (targetUserId: number, days: number, reason?: string) => {
    const sp = new URLSearchParams();
    sp.set("targetUserId", String(targetUserId));
    sp.set("days", String(days));
    if (reason && reason.trim()) sp.set("reason", reason.trim());

    return request<CommonResDto<void>>(`/report/admin/suspend?${sp.toString()}`, { method: "POST" }).then((r) => unwrap<void>(r));
  },

  adminLiftAll: (targetUserId: number, reason?: string) => {
    const sp = new URLSearchParams();
    sp.set("targetUserId", String(targetUserId));
    if (reason && reason.trim()) sp.set("reason", reason.trim());

    return request<CommonResDto<void>>(`/report/admin/lift?${sp.toString()}`, { method: "POST" }).then((r) => unwrap<void>(r));
  },

  // 상품 신고 운영(차단 목록/해제)
  getBlockedProducts: async () => {
    const raw = await request<CommonResDto<any[]>>("/report/product/admin/blocked");
    const arr = unwrap<any[]>(raw) ?? [];
    return arr.map(normalizeBlockedProduct);
  },

  liftBlockedProduct: (payload: { productId: number; reason?: string; resetCounter?: boolean }) =>
    request<CommonResDto<void>>("/report/product/admin/lift", {
      method: "POST",
      body: JSON.stringify(payload),
    }).then((r) => unwrap<void>(r)),
  
  // 공지(페이지)
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

  // 공지 목록(리스트)
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
  getCategoryDistribution: async () => {
    const raw = await request<CommonResDto<any[]>>("/admin/category-distribution");
    const arr = unwrap<any[]>(raw) ?? [];
    return arr.map(normalizeCategoryDistribution);
  },

  getTodayActiveHours: async () => {
    const raw = await request<CommonResDto<any[]>>("/admin/metrics/active-hours");
    const arr = unwrap<any[]>(raw) ?? [];
    return arr.map(normalizeActiveHourBucket);
  },

  // 최근 7일 경매 생성 종료 (메인)
  getAuctionTrend: async (days = 7) => {
    const sp = new URLSearchParams();
    sp.set("days", String(days));

    const raw = await request<CommonResDto<any[]>>(`/admin/metrics/auction-trend?${sp.toString()}`);
    const arr = unwrap<any[]>(raw) ?? [];

    return arr.map((x) => ({
      date: String(x.date ?? ""),
      created: Number(x.created ?? 0),
      ended: Number(x.ended ?? 0),
    })) as AuctionTrendRow[];
  },

  // 월별 경매 값 추이 (메인)
  getMonthlyTrade: async (months = 6) => {
    const sp = new URLSearchParams();
    sp.set("months", String(months));

    const raw = await request<CommonResDto<any[]>>(`/admin/metrics/trade-monthly?${sp.toString()}`);
    const arr = unwrap<any[]>(raw) ?? [];

    return arr.map((x) => ({
      ym: String(x.ym ?? ""),
      amount: Number(x.amount ?? 0),
    })) as MonthlyTradeRow[];
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

  updateEvent: (eventId: string, payload: Omit<CalendarEventRow, "id">) =>
    request<CommonResDto<CalendarEventRow>>(`/admin/calendar/events/${encodeURIComponent(eventId)}`, {
      method: "PUT",
      body: JSON.stringify(payload),
  }).then((r) => unwrap<CalendarEventRow>(r)),

  deleteEvent: (eventId: string) =>
    request<CommonResDto<void>>(`/admin/calendar/events/${encodeURIComponent(eventId)}`, {
      method: "DELETE",
  }).then((r) => unwrap<void>(r)),

  moveEventDate: (id: string, newDate: string) =>
    request<CommonResDto<CalendarEventRow>>(`/admin/calendar/events/${encodeURIComponent(id)}/date`, {
      method: "PATCH",
      body: JSON.stringify({ date: newDate }),
  }).then((r) => unwrap<CalendarEventRow>(r)),

  extendAdminSession: () =>
    request<CommonResDto<ExtendSessionRes>>("/user/extend", {
      method: "POST",
    }).then((r) => unwrap<ExtendSessionRes>(r)),

  getUsers: async (): Promise<AdminUserRow[]> => {
    const raw = await request<CommonResDto<any[]>>("/user/list");
    const arr = unwrap<any[]>(raw) ?? [];
    return arr.map(normalizeUser);
  },

  createAdminUser: (payload: AdminUserCreateReq) =>
    request<CommonResDto<void>>("/user/admin/create", {
      method: "POST",
      body: JSON.stringify(payload),
    }).then((r) => unwrap<void>(r)),

  createInquiryUser: (payload: AdminUserCreateReq) =>
    request<CommonResDto<void>>("/user/inquiry/create", {
      method: "POST",
      body: JSON.stringify(payload),
    }).then((r) => unwrap<void>(r)),

    

  getUsersPage: async (params?: { page?: number; size?: number; role?: "ALL" | Authority; q?: string }) => {
    const sp = new URLSearchParams();
    sp.set("page", String(params?.page ?? 0));
    sp.set("size", String(params?.size ?? 10));

    if (params?.role && params.role !== "ALL") sp.set("role", params.role);
    if (params?.q && params.q.trim()) sp.set("q", params.q.trim());

    const raw = await request<CommonResDto<any>>(`/user/admin/page?${sp.toString()}`);
    const dto = unwrap<any>(raw);

    const items = (dto?.items ?? dto?.content ?? dto?.data ?? []).map(normalizeUser);

    const toNum = (v: any) => {
      const n = Number(v);
      return Number.isFinite(n) ? n : 0;
    };

    const pickCount = (obj: any, keys: string[]) => {
      for (const k of keys) {
        if (obj && obj[k] != null) return toNum(obj[k]);
      }
      return undefined;
    };

    const countsObj = dto?.counts ?? dto?.count ?? dto?.roleCounts ?? null;

    const adminVal =
      pickCount(countsObj, ["ADMIN", "admin", "ROLE_ADMIN", "roleAdmin", "adminCount"]) ??
      pickCount(dto, ["adminCount", "ADMIN_COUNT", "roleAdminCount", "ROLE_ADMIN_COUNT"]);

    const inquiryVal =
      pickCount(countsObj, ["INQUIRY", "inquiry", "ROLE_INQUIRY", "roleInquiry", "inquiryCount"]) ??
      pickCount(dto, ["inquiryCount", "INQUIRY_COUNT", "roleInquiryCount", "ROLE_INQUIRY_COUNT"]);

    const userVal =
      pickCount(countsObj, ["USER", "user", "ROLE_USER", "roleUser", "userCount"]) ??
      pickCount(dto, ["userCount", "USER_COUNT", "roleUserCount", "ROLE_USER_COUNT"]);

    const counts =
      adminVal != null || inquiryVal != null || userVal != null
        ? {
            ADMIN: adminVal ?? 0,
            INQUIRY: inquiryVal ?? 0,
            USER: userVal ?? 0,
          }
        : undefined;

    return {
      items,
      page: toNum(dto?.page ?? dto?.number ?? 0),
      size: toNum(dto?.size ?? 10),
      totalElements: toNum(dto?.totalElements ?? dto?.total ?? 0),
      totalPages: Math.max(1, toNum(dto?.totalPages ?? 1)),
      counts,
    } as AdminUserPageRes;
  },

  openAdminLounge: () =>
    request<CommonResDto<string>>("/chat/room/admin/lounge", { method: "POST" }).then((r) => String(unwrap<string>(r))),

  getMyChatRooms: async (): Promise<AdminChatRoomRow[]> => {
    const raw = await request<CommonResDto<any[]>>("/chat/room/my");
    const list = unwrap<any[]>(raw) ?? [];
    return list.map(normalizeChatRoom);
  },

  enterChatRoom: (roomId: string) =>
    request<CommonResDto<void>>(`/chat/room/enter?roomId=${encodeURIComponent(roomId)}`, { method: "POST" }).then((r) =>
      unwrap<void>(r)
    ),

  leaveChatRoom: (roomId: string) =>
    request<CommonResDto<void>>(`/chat/room/${encodeURIComponent(roomId)}/leave`, { method: "POST" }).then((r) =>
      unwrap<void>(r)
    ),

  getChatRoomMembers: async (roomId: string): Promise<AdminChatMemberRow[]> => {
    const raw = await request<CommonResDto<any[]>>(`/chat/room/${encodeURIComponent(roomId)}/members`);
    const list = unwrap<any[]>(raw) ?? [];
    return list.map(normalizeMember);
  },

  listAdminMembers: async (): Promise<AdminChatMemberRow[]> => {
    const raw = await request<CommonResDto<any[]>>("/chat/room/members/admin");
    const list = unwrap<any[]>(raw) ?? [];
    return list.map(normalizeMember);
  },

  listInquiryMembers: async (): Promise<AdminChatMemberRow[]> => {
    const raw = await request<CommonResDto<any[]>>("/chat/room/members/inquiry");
    const list = unwrap<any[]>(raw) ?? [];
    return list.map(normalizeMember);
  },

  createStaffGroupRoom: (payload: AdminChatCreateGroupReq) =>
    request<CommonResDto<string>>("/chat/room/staff/group", {
      method: "POST",
      body: JSON.stringify(payload),
    }).then((r) => String(unwrap<string>(r))),

  inviteStaffToRoom: (roomId: string, payload: AdminChatInviteReq) =>
    request<CommonResDto<void>>(`/chat/room/${encodeURIComponent(roomId)}/invite`, {
      method: "POST",
      body: JSON.stringify(payload),
    }).then((r) => unwrap<void>(r)),

  getRecentChatMessages: async (roomId: string, size = 50): Promise<AdminChatMessageRow[]> => {
    const raw = await request<CommonResDto<any[]>>(
      `/chat/message/recent?roomId=${encodeURIComponent(roomId)}&size=${encodeURIComponent(String(size))}`
    );
    const list = unwrap<any[]>(raw) ?? [];

    const normalized = list.map(normalizeChatMessage);
    return normalized.slice().reverse();
  },

  sendChatMessage: (payload: { roomId: string; messageType: "TALK" | "IMAGE" | "FILE"; message: string; files?: any[] }) =>
    request<CommonResDto<void>>("/chat/message/send", {
      method: "POST",
      body: JSON.stringify(payload),
    }).then((r) => unwrap<void>(r)),

  uploadChatFile: async (file: File) => {
    const token = localStorage.getItem("accessToken");
    if (!token) throw new Error("token missing");

    const base = import.meta.env.VITE_API_BASE as string;
    const fd = new FormData();
    fd.append("file", file);

    const res = await fetch(`${base}/chat/file/upload`, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}` },
    body: fd,
    });

    const json = await res.json().catch(() => ({} as any));
    if (!res.ok) throw new Error(json?.statusMessage ?? json?.status_message ?? json?.message ?? "upload failed");

    const payload = (json?.data ?? json?.result ?? json?.payload ?? json) as any;
    return {
    fileName: String(payload?.fileName ?? payload?.file_name ?? file.name),
    fileUrl: String(payload?.fileUrl ?? payload?.file_url ?? ""),
    };
  },

  uploadChatFiles: async (files: File[]) => {
    return Promise.all(files.map((f) => adminApi.uploadChatFile(f)));
  }, 
  
  renameChatRoomTitle: (roomId: string, title: string) =>
  request<CommonResDto<void>>(`/chat/room/${encodeURIComponent(roomId)}/title`, {
    method: "PATCH",
    body: JSON.stringify({ title: String(title ?? "").trim() }),
  }).then((r) => unwrap<void>(r)),

  updateMyNickname: (nickname: string) =>
  request<CommonResDto<void>>("/user/nickname", {
    method: "PUT",
    body: JSON.stringify({ nickname: String(nickname ?? "").trim() }),
  }).then((r) => unwrap<void>(r)),

  uploadAdminProfileImage: async (file: File): Promise<string> => {
    const token = localStorage.getItem("accessToken");
    if (!token) throw new Error("token missing");

    const base = (import.meta.env.VITE_API_BASE as string | undefined) ?? "";
    const urlBase = base.replace(/\/$/, "");

    const fd = new FormData();
    fd.append("file", file);

    const res = await fetch(`${urlBase}/user/image`, {
      method: "POST",
      headers: { Authorization: `Bearer ${token}` },
      body: fd,
    });

    const json = await res.json().catch(() => ({} as any));
    if (!res.ok) {
      throw new Error(json?.statusMessage ?? json?.status_message ?? json?.message ?? "upload failed");
    }

    const payload = (json?.result ?? json?.data ?? json) as any;
    const url = String(payload?.url ?? "");
    if (!url) throw new Error("profile image url missing in response");
    return url;
  },

  deleteMyProfileImage: () =>
    request<CommonResDto<void>>("/user/image/delete", { method: "DELETE" }).then((r) => unwrap<void>(r)),

  getMyDetail: () =>
    request<CommonResDto<any>>("/user/detail").then((r) => unwrap<any>(r)),
};




