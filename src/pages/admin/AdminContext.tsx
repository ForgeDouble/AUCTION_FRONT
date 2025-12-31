import React, { createContext, useContext, useEffect, useMemo, useState } from "react";
import type { AdminOverviewResponse, AuctionRow, CalendarEventRow, NoticeRow, ReportRow, ReportSeverity, ReportStatus, } from "./adminTypes";
import { adminApi } from "./adminApi";
import { createMockAuctions, createMockEvents, createMockNotices, createMockReports, createMockStats } from "./adminMockData";

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

  query: string;
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

  const [stats, setStats] = useState<AdminOverviewResponse>(() => createMockStats());
  const [auctions, setAuctions] = useState<AuctionRow[]>(() => createMockAuctions());
  const [reports, setReports] = useState<ReportRow[]>(() => createMockReports());
  const [notices, setNotices] = useState<NoticeRow[]>(() => createMockNotices(profile.nick));
  const [events, setEvents] = useState<CalendarEventRow[]>(() => createMockEvents());

  const [reportStatusFilter, setReportStatusFilter] = useState<ReportStatus | "ALL">("ALL");
  const [reportSeverityFilter, setReportSeverityFilter] = useState<ReportSeverity | "ALL">("ALL");


  const USE_MOCK_JITTER = true;

  useEffect(() => {
    if (!USE_MOCK_JITTER) return;
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
    try {
      const [ov, auct, rep, noti, ev] = await Promise.all([
      adminApi.getOverview(),
      adminApi.getAuctions(),
      adminApi.getReports({ status: reportStatusFilter, severity: reportSeverityFilter }),
      adminApi.getNotices(),
      adminApi.getEvents(),
      ]);
        setStats(ov);
        setAuctions(auct);
        setReports(rep);
        setNotices(noti);
        setEvents(ev);
        setLastUpdatedAt(nowIso());
    } catch (e: any) {
      console.error("[Admin] refreshAll failed", e);
      setStats(createMockStats());
      setAuctions(createMockAuctions());
      setReports(createMockReports());
      setNotices(createMockNotices(profile.nick));
      setEvents(createMockEvents());
      setLastUpdatedAt(nowIso());
    }


  };

  // 최초 1회 로딩
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

  const markNoticeAck = (noticeId: string): void => {
    (async () => {
      try {
        await adminApi.ackNotice(noticeId);
        setNotices((prev) => prev.map((n) => (n.id === noticeId ? { ...n, acknowledged: true } : n)));
      } catch (e) {
        console.error(e);
        alert("공지 확인 처리에 실패했습니다.");
      }
    })();
  };

  const addNotice = (title: string, body: string): void => {
    (async () => {
      try {
        const created = await adminApi.addNotice(title.trim(), body.trim());
        setNotices((prev) => [created, ...prev]);
      } catch (e) {
        console.error(e);
        alert("공지 등록에 실패했습니다.");
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