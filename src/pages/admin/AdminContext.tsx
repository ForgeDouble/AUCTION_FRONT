// src/pages/admin/AdminContext.tsx
import React, { createContext, useContext, useEffect, useMemo, useState } from "react";
import type {
  AdminOverviewResponse,
  AuctionRow,
  CalendarEventRow,
  NoticeRow,
  NoticeCategory,
  AdminReportGroupRow,
  ReportCategory,
  SpringPage,
  AdminReportItemRow,
  BlockedProductRow,
  CategoryDistributionRow,
} from "./adminTypes";
import { adminApi } from "./adminApi";
import { createMockAuctions, createMockReportGroups, createMockStats } from "./adminMockData";

function nowIso(): string {
  return new Date().toISOString();
}

// function clamp(n: number, min: number, max: number): number {
//   return Math.max(min, Math.min(max, n));
// }

function safeGetAdminProfile(): { email: string; nick: string; role: string } {
  const token = localStorage.getItem("accessToken");
  const fallback = { email: "admin@example.com", nick: "관리자", role: "ADMIN" };
  if (!token) return fallback;

  const parts = token.split(".");
  if (parts.length < 2) return fallback;

  try {
    const base64 = parts[1].replace(/-/g, "+").replace(/_/g, "/");
    const padded = base64.padEnd(base64.length + (4 - (base64.length % 4)) % 4, "=");
    const json = decodeURIComponent(
      Array.from(atob(padded))
        .map((c) => "%" + c.charCodeAt(0).toString(16).padStart(2, "0"))
        .join("")
    );
    const payload = JSON.parse(json) as Record<string, unknown>;

    const email = typeof payload.email === "string" ? payload.email : fallback.email;
    const nick = typeof payload.nick === "string" ? payload.nick : fallback.nick;
    const role = typeof payload.authority === "string" ? payload.authority : fallback.role;

    return { email, nick, role };
  } catch {
    return fallback;
  }
}

export interface AdminStore {
  adminEmail: string;
  adminNick: string;
  adminRole: string;

  query: string;
  setQuery: (v: string) => void;

  lastUpdatedAt: string;
  refreshAll: () => Promise<void>;

  stats: AdminOverviewResponse;
  setStats: React.Dispatch<React.SetStateAction<AdminOverviewResponse>>;

  auctions: AuctionRow[];
  setAuctions: React.Dispatch<React.SetStateAction<AuctionRow[]>>;

  // 신고(유저)
  reportGroups: AdminReportGroupRow[];
  setReportGroups: React.Dispatch<React.SetStateAction<AdminReportGroupRow[]>>;

  fetchGroupReports: (targetUserId: number, category: ReportCategory, page: number, size: number) => Promise<SpringPage<AdminReportItemRow>>;
  resolveReportGroup: (targetUserId: number, category: ReportCategory, payload: { accept: boolean; adminContent?: string; suspendDays?: number }) => Promise<void>;
  adminSuspendUser: (targetUserId: number, days: number, reason?: string) => Promise<void>;
  adminLiftAll: (targetUserId: number, reason?: string) => Promise<void>;

  // 신고(상품)
  blockedProducts: BlockedProductRow[];
  setBlockedProducts: React.Dispatch<React.SetStateAction<BlockedProductRow[]>>;
  refreshBlockedProducts: () => Promise<void>;
  liftBlockedProduct: (payload: { productId: number; reason?: string; resetCounter?: boolean }) => Promise<void>;

  // 공지(인수인계)
  notices: NoticeRow[];
  setNotices: React.Dispatch<React.SetStateAction<NoticeRow[]>>;

  noticePage: number;
  noticeSize: number;
  noticeTotalPages: number;
  noticeTotalElements: number;
  goNoticePage: (page: number) => void;

  addNotice: (payload: {
    category: NoticeCategory;
    title: string;
    content: string;
    pinned?: boolean;
    importance?: number;
  }) => void;
  updateNotice: (
    id: number,
    payload: {
      category?: NoticeCategory;
      title?: string;
      content?: string;
      pinned?: boolean;
      importance?: number;
    }
  ) => void;
  deleteNotice: (id: number) => void;

  // 캘린더
  events: CalendarEventRow[];
  setEvents: React.Dispatch<React.SetStateAction<CalendarEventRow[]>>;
  refreshEvents: () => Promise<void>;
  addEvent: (e: Omit<CalendarEventRow, "id">) => Promise<void>;
  updateEvent: (id: string, payload: Partial<Omit<CalendarEventRow, "id">>) => Promise<void>;
  deleteEvent: (id: string) => Promise<void>;
  moveEventDate: (id: string, newDate: string) => Promise<void>;

  // 뱃지 관련(카운팅)
  noticesCount: number;
  pinnedNoticesCount: number;
  reportsOpenCount: number;

  // 경매 조치
  suspendAuction: (auctionId: string) => void;
  forceEndAuction: (auctionId: string) => void;

  // 카테고리 확인용(overview)
  categoryDistribution: CategoryDistributionRow[];
  setCategoryDistribution: React.Dispatch<React.SetStateAction<CategoryDistributionRow[]>>;
}

const Ctx = createContext<AdminStore | null>(null);

export function useAdminStore(): AdminStore {
  const v = useContext(Ctx);
  if (!v) throw new Error("useAdminStore must be used within AdminProvider");
  return v;
}

export const AdminProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const profile = useMemo(() => safeGetAdminProfile(), []);
  const [query, setQuery] = useState<string>("");
  const [lastUpdatedAt, setLastUpdatedAt] = useState<string>(nowIso());

  // 옥션 관련 더미
  const [stats, setStats] = useState<AdminOverviewResponse>(() => createMockStats());
  const [auctions, setAuctions] = useState<AuctionRow[]>(() => createMockAuctions());
  
  // 신고 관련 더미
  const [reportGroups, setReportGroups] = useState<AdminReportGroupRow[]>(() => createMockReportGroups());

  // 캘린더 관련 더미
  const [events, setEvents] = useState<CalendarEventRow[]>([]);
  
  const [notices, setNotices] = useState<NoticeRow[]>([]);
  const [noticePage, setNoticePage] = useState(0);
  const [noticeSize, setNoticeSize] = useState(10);
  const [noticeTotalPages, setNoticeTotalPages] = useState(1);
  const [noticeTotalElements, setNoticeTotalElements] = useState(0);

  const [blockedProducts, setBlockedProducts] = useState<BlockedProductRow[]>([]);

  const [categoryDistribution, setCategoryDistribution] = useState<CategoryDistributionRow[]>([]);

  useEffect(() => {
    const t = window.setTimeout(() => {
      void fetchNoticesPage(0, noticeSize);
    }, 250);
    return () => window.clearTimeout(t);
  }, [query]);

  const fetchNoticesPage = async (pg: number, sz: number): Promise<void> => {
    const qv = query.trim();

    const res = await adminApi.getNoticesPage({
      page: pg,
      size: sz,
      q: qv ? qv : undefined,
    });

    setNotices(res.items);
    setNoticePage(res.page);
    setNoticeSize(res.size);
    setNoticeTotalPages(Math.max(1, res.totalPages));
    setNoticeTotalElements(res.totalElements);
  };
  const refreshBlockedProducts = async (): Promise<void> => {
    try {
      const list = await adminApi.getBlockedProducts();
      setBlockedProducts(list);
    } catch (e) {
      console.error(e);
    }
  };
  const refreshEvents = async (): Promise<void> => {
    try {
      const list = await adminApi.getEvents();
      setEvents(list);
    } catch (e) {
      console.error(e);
    }
  };

  const refreshAll = async (): Promise<void> => {
    const results = await Promise.allSettled([
      adminApi.getOverview(),
      adminApi.getAuctions(),
      adminApi.getReportGroups(),
      adminApi.getBlockedProducts(),
      adminApi.getEvents(),
      adminApi.getCategoryDistribution(),
    ]);

    const [ovR, auctR, groupR, blockedR, evR, catR] = results;

    if (ovR.status === "fulfilled") setStats(ovR.value);
    if (auctR.status === "fulfilled") setAuctions(auctR.value);
    if (groupR.status === "fulfilled") setReportGroups(groupR.value);
    if (blockedR.status === "fulfilled") setBlockedProducts(blockedR.value);
    if (evR.status === "fulfilled") setEvents(evR.value);
    if (catR.status === "fulfilled") setCategoryDistribution(catR.value);

    await fetchNoticesPage(noticePage, noticeSize);
    setLastUpdatedAt(nowIso());
    
  };

  useEffect(() => {
    void refreshAll();
  }, []);

  const suspendAuction = (auctionId: string): void => {
    (async () => {
      const reason = window.prompt("임시차단 사유를 입력하세요") || "";
      if (!reason.trim()) return;

      try {
        await adminApi.suspendAuction(auctionId, reason.trim());
        setAuctions((prev) => prev.map((a) => (a.id === auctionId ? { ...a, status: "SUSPENDED" } : a)));
      } catch (e) {
        console.error(e);
        alert("임시차단에 실패했습니다. 서버 로그/응답을 확인하세요.");
      }
    })();
  };

  const forceEndAuction = (auctionId: string): void => {
    (async () => {
      const reason = window.prompt("강제종료 사유를 입력하세요") || "";
      if (!reason.trim()) return;

      try {
        await adminApi.forceEndAuction(auctionId, reason.trim());
        setAuctions((prev) => prev.filter((a) => a.id !== auctionId));
        setStats((s) => ({
          ...s,
          todayEndedAuctions: s.todayEndedAuctions + 1,
          ongoingAuctions: Math.max(0, s.ongoingAuctions - 1),
        }));
      } catch (e) {
        console.error(e);
        alert("강제종료에 실패했습니다. 서버 로그/응답을 확인하세요.");
      }
    })();
  };

 const fetchGroupReports: AdminStore["fetchGroupReports"] = async (targetUserId, category, page, size) => {
    return await adminApi.getGroupReports(targetUserId, category, page, size);
  };

  const resolveReportGroup: AdminStore["resolveReportGroup"] = async (targetUserId, category, payload) => {
    await adminApi.resolveReportGroup(targetUserId, category, payload);
    const refreshed = await adminApi.getReportGroups();
    setReportGroups(refreshed);
  };

  const adminSuspendUser: AdminStore["adminSuspendUser"] = async (targetUserId, days, reason) => {
    await adminApi.adminSuspendUser(targetUserId, days, reason);
    const refreshed = await adminApi.getReportGroups();
    setReportGroups(refreshed);
  };

  const adminLiftAll: AdminStore["adminLiftAll"] = async (targetUserId, reason) => {
    await adminApi.adminLiftAll(targetUserId, reason);
    const refreshed = await adminApi.getReportGroups();
    setReportGroups(refreshed);
  };

  const liftBlockedProduct: AdminStore["liftBlockedProduct"] = async (payload) => {
    await adminApi.liftBlockedProduct(payload);
    await refreshBlockedProducts();
  };

  const addNotice: AdminStore["addNotice"] = (payload) => {
    (async () => {
      try {
        await adminApi.createNotice(payload);
        await fetchNoticesPage(0, noticeSize);
      } catch (e) {
        console.error(e);
        alert("공지 등록에 실패했습니다.");
      }
    })();
  };
  const updateNotice: AdminStore["updateNotice"] = (id, payload) => {
    (async () => {
      try {
        await adminApi.updateNotice(id, payload);
        await fetchNoticesPage(noticePage, noticeSize);
      } catch (e) {
        console.error(e);
        alert("공지 수정에 실패했습니다.");
      }
    })();
  };
  const deleteNotice: AdminStore["deleteNotice"] = (id) => {
    (async () => {
      try {
        await adminApi.deleteNotice(id);

        const nextPage = noticePage > 0 && notices.length === 1 ? noticePage - 1 : noticePage;
        await fetchNoticesPage(nextPage, noticeSize);
      } catch (e) {
        console.error(e);
        alert("공지 삭제에 실패했습니다.");
      }
    })();
  };
  const addEvent: AdminStore["addEvent"] = async (e) => {
    const payload = {
      date: e.date,
      time: e.time,
      title: e.title,
      tag: e.tag ?? "기타",
      memo: (e as any).memo ?? null,
    };
    const created = await adminApi.addEvent(payload as any);
    setEvents((prev) => [created, ...prev]);
  };

  const updateEvent: AdminStore["updateEvent"] = async (id, payload) => {
    const updated = await adminApi.updateEvent(id, payload as any);
    setEvents((prev) => prev.map((x) => (x.id === id ? updated : x)));
  };

  const deleteEvent: AdminStore["deleteEvent"] = async (id) => {
    await adminApi.deleteEvent(id);
    setEvents((prev) => prev.filter((x) => x.id !== id));
  };

  const moveEventDate: AdminStore["moveEventDate"] = async (id, newDate) => {
    await adminApi.moveEventDate(id, newDate);
    setEvents((prev) => prev.map((e) => (e.id === id ? { ...e, date: newDate } : e)));
  };

  const goNoticePage = (page: number) => {
    const pg = Math.max(0, Math.min(page, noticeTotalPages - 1));
    void fetchNoticesPage(pg, noticeSize);
  };

  // 뱃지 관련 카운팅 함수
  const pinnedNoticesCount = useMemo(() => notices.filter((n) => n.pinned).length, [notices]);
  const noticesCount = useMemo(() => noticeTotalElements, [noticeTotalElements]);

  const reportsOpenCount = useMemo(() => {
    return reportGroups.reduce((acc, g) => acc + (g.pendingCount || 0), 0);
  }, [reportGroups]);
  
  const value: AdminStore = {
    adminEmail: profile.email,
    adminNick: profile.nick,
    adminRole: profile.role,

    query,
    setQuery,

    lastUpdatedAt,
    refreshAll,

    stats,
    setStats,

    auctions,
    setAuctions,

    reportGroups,
    setReportGroups,

    fetchGroupReports,
    resolveReportGroup,
    adminSuspendUser,
    adminLiftAll,

    blockedProducts,
    setBlockedProducts,
    refreshBlockedProducts,
    liftBlockedProduct,

    notices,
    setNotices,

    noticePage,
    noticeSize,
    noticeTotalPages,
    noticeTotalElements,
    goNoticePage,

    addNotice,
    updateNotice,
    deleteNotice,

    events,
    setEvents,
    refreshEvents,
    addEvent,
    updateEvent,
    deleteEvent,
    moveEventDate,

    noticesCount,
    pinnedNoticesCount,
    reportsOpenCount,

    suspendAuction,
    forceEndAuction,

    categoryDistribution,
    setCategoryDistribution,
  };

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
};
