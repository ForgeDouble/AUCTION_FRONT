//  src/pages/admin/AdminContext.tsx
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
import {
  createMockAuctions,
  createMockEvents,
  createMockNotices,
  createMockReports,
  createMockStats,
} from "./adminMockData";

function nowIso(): string {
  return new Date().toISOString();
}

function clamp(n: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, n));
}

// 프로젝트에 useAuth 있으면 쓰고, 없으면 안전하게 fallback
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

  stats: OverviewStats;
  setStats: React.Dispatch<React.SetStateAction<OverviewStats>>;

  auctions: AuctionRow[];
  setAuctions: React.Dispatch<React.SetStateAction<AuctionRow[]>>;

  reports: ReportRow[];
  setReports: React.Dispatch<React.SetStateAction<ReportRow[]>>;

  notices: NoticeRow[];
  setNotices: React.Dispatch<React.SetStateAction<NoticeRow[]>>;

  events: CalendarEventRow[];
  setEvents: React.Dispatch<React.SetStateAction<CalendarEventRow[]>>;

  // actions
  suspendAuction: (auctionId: string) => void;
  forceEndAuction: (auctionId: string) => void;

  assignReport: (reportId: string, assignee: string) => void;
  resolveReport: (reportId: string, next: ReportStatus) => void;

  markNoticeAck: (noticeId: string) => void;
  addNotice: (title: string, body: string) => void;

  addEvent: (e: Omit<CalendarEventRow, "id">) => void;

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
  const [lastUpdatedAt, setLastUpdatedAt] = useState<string>(nowIso());

  const [stats, setStats] = useState<OverviewStats>(() => createMockStats());
  const [auctions, setAuctions] = useState<AuctionRow[]>(() => createMockAuctions());
  const [reports, setReports] = useState<ReportRow[]>(() => createMockReports());
  const [notices, setNotices] = useState<NoticeRow[]>(() => createMockNotices(profile.nick));
  const [events, setEvents] = useState<CalendarEventRow[]>(() => createMockEvents());

  const [reportStatusFilter, setReportStatusFilter] = useState<ReportStatus | "ALL">("ALL");
  const [reportSeverityFilter, setReportSeverityFilter] = useState<ReportSeverity | "ALL">("ALL");

  // 실시간 접속 샘플 흔들림 (백엔드 붙이면 제거)
  useEffect(() => {
    const t = window.setInterval(() => {
      setStats((s) => {
        const delta = Math.floor((Math.random() - 0.45) * 18);
        const next = clamp(s.realtimeUsers + delta, 0, 999999);
        return { ...s, realtimeUsers: next };
      });
    }, 2500);
    return () => window.clearInterval(t);
  }, []);

  const refreshAll = async (): Promise<void> => {
    // TODO: 백엔드 붙이면 여기서 fetch로 교체
    setLastUpdatedAt(nowIso());
  };

  const suspendAuction = (auctionId: string): void => {
    setAuctions((prev) => prev.map((a) => (a.id === auctionId ? { ...a, status: "SUSPENDED" } : a)));
  };

  const forceEndAuction = (auctionId: string): void => {
    setAuctions((prev) => prev.filter((a) => a.id !== auctionId));
    setStats((s) => ({
      ...s,
      todayEndedAuctions: s.todayEndedAuctions + 1,
      ongoingAuctions: Math.max(0, s.ongoingAuctions - 1),
    }));
  };

  const assignReport = (reportId: string, assignee: string): void => {
    setReports((prev) =>
      prev.map((r) =>
        r.id === reportId
          ? { ...r, assignedTo: assignee, status: r.status === "대기" ? "처리중" : r.status }
          : r
      )
    );
  };

  const resolveReport = (reportId: string, next: ReportStatus): void => {
    setReports((prev) => prev.map((r) => (r.id === reportId ? { ...r, status: next } : r)));
  };

  const markNoticeAck = (noticeId: string): void => {
    setNotices((prev) => prev.map((n) => (n.id === noticeId ? { ...n, acknowledged: true } : n)));
  };

  const addNotice = (title: string, body: string): void => {
    const n: NoticeRow = {
      id: "N-" + Math.floor(1000 + Math.random() * 9000),
      pinned: false,
      title: title.trim(),
      body: body.trim(),
      author: profile.nick,
      createdAt: nowIso(),
      acknowledged: false,
    };
    setNotices((prev) => [n, ...prev]);
  };

  const addEvent = (e: Omit<CalendarEventRow, "id">): void => {
    const newEvent: CalendarEventRow = {
      id: "E-" + Math.floor(1000 + Math.random() * 9000),
      ...e,
    };
    setEvents((prev) => [newEvent, ...prev]);
  };

  const pendingNoticesCount = useMemo(() => notices.filter((n) => !n.acknowledged).length, [notices]);
  const reportsOpenCount = useMemo(() => reports.filter((r) => r.status === "대기" || r.status === "처리중").length, [reports]);

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
