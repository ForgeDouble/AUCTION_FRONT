// src/pages/admin/AdminContext.tsx
import React, { createContext, useContext, useEffect, useMemo, useState } from "react";
import type {
  AuctionRow,
  CalendarEventRow,
  NoticeRow,
  OverviewStats,
  ReportRow,
  ReportSeverity,
  ReportStatus,
} from "./adminTypes";
import { adminApi } from "./adminApi";

function nowIso(): string {
  return new Date().toISOString();
}

// 표시용 JWT payload 파싱(검증 X)
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

const EMPTY_STATS: OverviewStats = {
  todayNewUsers: 0,
  todayCreatedAuctions: 0,
  todayEndedAuctions: 0,
  todaySoldAuctions: 0,
  totalBids: 0,
  ongoingAuctions: 0,
  reportsOpen: 0,
  realtimeUsers: 0,
  todayActiveUsers: 0,
  todayTradeAmount: 0,
  monthlyAvgTradeAmount: 0,
};

export interface AdminStore {
  adminEmail: string;
  adminNick: string;
  adminRole: string;

  loading: boolean;
  error: string | null;

  query: string;
  setQuery: (v: string) => void;

  lastUpdatedAt: string;
  refreshAll: () => Promise<void>;

  stats: OverviewStats;

  auctions: AuctionRow[];
  reports: ReportRow[];
  notices: NoticeRow[];
  events: CalendarEventRow[];

  suspendAuction: (auctionId: string, reason?: string) => Promise<void>;
  forceEndAuction: (auctionId: string, reason?: string) => Promise<void>;

  assignReport: (reportId: string, assignee: string) => Promise<void>;
  resolveReport: (reportId: string, next: ReportStatus) => Promise<void>;

  markNoticeAck: (noticeId: string) => Promise<void>;
  addNotice: (title: string, body: string) => Promise<void>;

  addEvent: (e: Omit<CalendarEventRow, "id">) => Promise<void>;

  pendingNoticesCount: number;
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
  const [lastUpdatedAt, setLastUpdatedAt] = useState<string>("");

  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const [stats, setStats] = useState<OverviewStats>(EMPTY_STATS);
  const [auctions, setAuctions] = useState<AuctionRow[]>([]);
  const [reports, setReports] = useState<ReportRow[]>([]);
  const [notices, setNotices] = useState<NoticeRow[]>([]);
  const [events, setEvents] = useState<CalendarEventRow[]>([]);

  const [reportStatusFilter, setReportStatusFilter] = useState<ReportStatus | "ALL">("ALL");
  const [reportSeverityFilter, setReportSeverityFilter] = useState<ReportSeverity | "ALL">("ALL");

  const refreshAll = async (): Promise<void> => {
    setLoading(true);
    setError(null);

    try {
      const [s, a, n, e, r] = await Promise.all([
        adminApi.getOverview(),
        adminApi.getAuctions(),
        adminApi.getNotices(),
        adminApi.getEvents(),
        adminApi.getReports({ q: query, status: reportStatusFilter, severity: reportSeverityFilter }),
      ]);

      setStats(s);
      setAuctions(a);
      setNotices(n);
      setEvents(e);
      setReports(r);

      setLastUpdatedAt(nowIso());
    } catch (err: any) {
      const msg =
        typeof err?.message === "string"
          ? err.message
          : "관리자 API 호출에 실패했습니다. (CORS/토큰/권한/URL 확인)";
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    refreshAll();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // actions: optimistic + 실패 롤백
  const suspendAuction = async (auctionId: string, reason?: string): Promise<void> => {
    const prev = auctions;
    setAuctions((p) => p.map((a) => (a.id === auctionId ? { ...a, status: "SUSPENDED" } : a)));

    try {
      await adminApi.suspendAuction(auctionId, reason || "관리자 임시차단");
    } catch (e) {
      setAuctions(prev);
      throw e;
    }
  };

  const forceEndAuction = async (auctionId: string, reason?: string): Promise<void> => {
    const prevA = auctions;
    const prevS = stats;

    setAuctions((p) => p.filter((a) => a.id !== auctionId));
    setStats((s) => ({
      ...s,
      todayEndedAuctions: s.todayEndedAuctions + 1,
      ongoingAuctions: Math.max(0, s.ongoingAuctions - 1),
    }));

    try {
      await adminApi.forceEndAuction(auctionId, reason || "관리자 강제종료");
    } catch (e) {
      setAuctions(prevA);
      setStats(prevS);
      throw e;
    }
  };

  const assignReport = async (reportId: string, assignee: string): Promise<void> => {
    const prev = reports;
    setReports((p) =>
      p.map((r) =>
        r.id === reportId
          ? { ...r, assignedTo: assignee, status: r.status === "대기" ? "처리중" : r.status }
          : r
      )
    );
    try {
      await adminApi.assignReport(reportId, assignee);
    } catch (e) {
      setReports(prev);
      throw e;
    }
  };

  const resolveReport = async (reportId: string, next: ReportStatus): Promise<void> => {
    const prev = reports;
    setReports((p) => p.map((r) => (r.id === reportId ? { ...r, status: next } : r)));
    try {
      await adminApi.resolveReport(reportId, next);
    } catch (e) {
      setReports(prev);
      throw e;
    }
  };

  const markNoticeAck = async (noticeId: string): Promise<void> => {
    const prev = notices;
    setNotices((p) => p.map((n) => (n.id === noticeId ? { ...n, acknowledged: true } : n)));
    try {
      await adminApi.ackNotice(noticeId);
    } catch (e) {
      setNotices(prev);
      throw e;
    }
  };

  const addNotice = async (title: string, body: string): Promise<void> => {
    const created = await adminApi.addNotice(title, body);
    setNotices((p) => [created, ...p]);
  };

  const addEvent = async (e: Omit<CalendarEventRow, "id">): Promise<void> => {
    const created = await adminApi.addEvent(e);
    setEvents((p) => [created, ...p]);
  };

  const pendingNoticesCount = useMemo(() => notices.filter((n) => !n.acknowledged).length, [notices]);
  const reportsOpenCount = useMemo(
    () => reports.filter((r) => r.status === "대기" || r.status === "처리중").length,
    [reports]
  );

  const value: AdminStore = {
    adminEmail: profile.email,
    adminNick: profile.nick,
    adminRole: profile.role,

    loading,
    error,

    query,
    setQuery,

    lastUpdatedAt,
    refreshAll,

    stats,
    auctions,
    reports,
    notices,
    events,

    suspendAuction,
    forceEndAuction,
    assignReport,
    resolveReport,
    markNoticeAck,
    addNotice,
    addEvent,

    pendingNoticesCount,
    reportsOpenCount,

    reportStatusFilter,
    setReportStatusFilter,
    reportSeverityFilter,
    setReportSeverityFilter,
  };

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
};
