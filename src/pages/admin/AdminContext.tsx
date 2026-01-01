// src/pages/admin/AdminContext.tsx
import React, { createContext, useContext, useEffect, useMemo, useState } from "react";
import type {
  AdminOverviewResponse,
  AuctionRow,
  CalendarEventRow,
  NoticeRow,
  NoticeCategory,
  ReportRow,
  ReportSeverity,
  ReportStatus,
} from "./adminTypes";
import { adminApi } from "./adminApi";
import { createMockAuctions, createMockEvents, createMockReports, createMockStats } from "./adminMockData";

function nowIso(): string {
  return new Date().toISOString();
}

function clamp(n: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, n));
}

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
  noticesCount: number;
  query: string;

  noticePage: number;
  noticeSize: number;
  noticeTotalPages: number;
  noticeTotalElements: number;
  goNoticePage: (page: number) => void;

  setQuery: (v: string) => void;

  lastUpdatedAt: string;
  refreshAll: () => Promise<void>;

  stats: AdminOverviewResponse;
  setStats: React.Dispatch<React.SetStateAction<AdminOverviewResponse>>;

  auctions: AuctionRow[];
  setAuctions: React.Dispatch<React.SetStateAction<AuctionRow[]>>;

  reports: ReportRow[];
  setReports: React.Dispatch<React.SetStateAction<ReportRow[]>>;

  
  notices: NoticeRow[];
  setNotices: React.Dispatch<React.SetStateAction<NoticeRow[]>>;

  events: CalendarEventRow[];
  setEvents: React.Dispatch<React.SetStateAction<CalendarEventRow[]>>;

  suspendAuction: (auctionId: string) => void;
  forceEndAuction: (auctionId: string) => void;

  assignReport: (reportId: string, assignee: string) => void;
  resolveReport: (reportId: string, next: ReportStatus) => void;

  
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

  addEvent: (e: Omit<CalendarEventRow, "id">) => void;

  pinnedNoticesCount: number;
  reportsOpenCount: number;

  reportStatusFilter: ReportStatus | "ALL";
  setReportStatusFilter: (v: ReportStatus | "ALL") => void;

  reportSeverityFilter: ReportSeverity | "ALL";
  setReportSeverityFilter: (v: ReportSeverity | "ALL") => void;
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

  const [stats, setStats] = useState<AdminOverviewResponse>(() => createMockStats());
  const [auctions, setAuctions] = useState<AuctionRow[]>(() => createMockAuctions());
  const [reports, setReports] = useState<ReportRow[]>(() => createMockReports());

  const [notices, setNotices] = useState<NoticeRow[]>([]);

  const [noticePage, setNoticePage] = useState(0);
  const [noticeSize, setNoticeSize] = useState(10);
  const [noticeTotalPages, setNoticeTotalPages] = useState(1);
  const [noticeTotalElements, setNoticeTotalElements] = useState(0);

  const [events, setEvents] = useState<CalendarEventRow[]>(() => createMockEvents());

  const [reportStatusFilter, setReportStatusFilter] = useState<ReportStatus | "ALL">("ALL");
  const [reportSeverityFilter, setReportSeverityFilter] = useState<ReportSeverity | "ALL">("ALL");

  const USE_MOCK_JITTER = true;

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

  const refreshAll = async (): Promise<void> => {
    const results = await Promise.allSettled([
      adminApi.getOverview(),
      adminApi.getAuctions(),
      adminApi.getReports({ status: reportStatusFilter, severity: reportSeverityFilter }),

      adminApi.getEvents(),
    ]);

    const [ovR, auctR, repR, evR] = results;

    if (ovR.status === "fulfilled") setStats(ovR.value);
    if (auctR.status === "fulfilled") setAuctions(auctR.value);
    if (repR.status === "fulfilled") setReports(repR.value);
    if (evR.status === "fulfilled") setEvents(evR.value);

    await fetchNoticesPage(noticePage, noticeSize);
    setLastUpdatedAt(nowIso());
    
  };

  useEffect(() => {
    void refreshAll();
  }, [reportStatusFilter, reportSeverityFilter]);

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

  const assignReport = (reportId: string, assignee: string): void => {
    (async () => {
      try {
        await adminApi.assignReport(reportId, assignee);
        setReports((prev) =>
          prev.map((r) =>
            r.id === reportId ? { ...r, assignedTo: assignee, status: r.status === "대기" ? "처리중" : r.status } : r
          )
        );
      } catch (e) {
        console.error(e);
        alert("신고 배정에 실패했습니다.");
      }
    })();
  };

  const resolveReport = (reportId: string, next: ReportStatus): void => {
    (async () => {
      try {
        await adminApi.resolveReport(reportId, next);
        setReports((prev) => prev.map((r) => (r.id === reportId ? { ...r, status: next } : r)));
      } catch (e) {
        console.error(e);
        alert("신고 처리에 실패했습니다.");
      }
    })();
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

  const addEvent = (e: Omit<CalendarEventRow, "id">): void => {
    (async () => {
      try {
        const created = await adminApi.addEvent(e);
        setEvents((prev) => [created, ...prev]);
      } catch (err) {
        console.error(err);
        alert("일정 추가에 실패했습니다.");
      }
    })();
  };

  const pinnedNoticesCount = useMemo(() => notices.filter((n) => n.pinned).length, [notices]);
  const reportsOpenCount = useMemo(
    () => reports.filter((r) => r.status === "대기" || r.status === "처리중").length,
    [reports]
  );
  const goNoticePage = (page: number) => {
    const pg = Math.max(0, Math.min(page, noticeTotalPages - 1));
    void fetchNoticesPage(pg, noticeSize);
  };

  const noticesCount = useMemo(() => noticeTotalElements, [noticeTotalElements]);
  const value: AdminStore = {
    adminEmail: profile.email,
    adminNick: profile.nick,
    adminRole: profile.role,

    noticePage,
    noticeSize,
    noticeTotalPages,
    noticeTotalElements,
    goNoticePage,

    query,
    setQuery,

    lastUpdatedAt,
    refreshAll,

    stats,
    setStats,

    auctions,
    setAuctions,

    reports,
    setReports,

    notices,
    setNotices,

    events,
    setEvents,

    suspendAuction,
    forceEndAuction,

    assignReport,
    resolveReport,
    noticesCount,
    addNotice,
    updateNotice,
    deleteNotice,

    addEvent,

    pinnedNoticesCount,
    reportsOpenCount,

    reportStatusFilter,
    setReportStatusFilter,

    reportSeverityFilter,
    setReportSeverityFilter,
    
  };

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
};
