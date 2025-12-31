import React, { createContext, useContext, useEffect, useMemo, useState } from "react";
import type {
AdminOverviewResponse,
AuctionRow,
CalendarEventRow,
NoticeRow,
ReportRow,
ReportSeverity,
ReportStatus,
} from "./adminTypes";
import { adminApi, type NoticeCreatePayload, type NoticeUpdatePayload } from "./adminApi";
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

// 공지(Notice)
addNotice: (payload: NoticeCreatePayload) => void;
updateNotice: (noticeId: number, payload: NoticeUpdatePayload) => void;
deleteNotice: (noticeId: number) => void;

addEvent: (e: Omit<CalendarEventRow, "id">) => void;

reportsOpenCount: number;

reportStatusFilter: ReportStatus | "ALL";
setReportStatusFilter: (v: ReportStatus | "ALL") => void;

reportSeverityFilter: ReportSeverity | "ALL";
setReportSeverityFilter: (v: ReportSeverity | "ALL") => void;

noticesCount: number;
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

// 다른 탭은 아직 백엔드 없을 수 있으니 mock 유지
const [stats, setStats] = useState<AdminOverviewResponse>(() => createMockStats());
const [auctions, setAuctions] = useState<AuctionRow[]>(() => createMockAuctions());
const [reports, setReports] = useState<ReportRow[]>(() => createMockReports());
const [events, setEvents] = useState<CalendarEventRow[]>(() => createMockEvents());

// 공지(Notice)는 mock 제거: 빈 배열로 시작
const [notices, setNotices] = useState<NoticeRow[]>(() => []);

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
// 공지 포함해서 “각 API별로 성공한 것만 반영” (전체 실패로 묶지 않기)
const tasks = await Promise.allSettled([
adminApi.getOverview(),
adminApi.getAuctions(),
adminApi.getReports({ status: reportStatusFilter, severity: reportSeverityFilter }),
adminApi.getEvents(),
adminApi.getNotices({ page: 0, size: 50 }),
]);

const [ov, auct, rep, ev, notiPage] = tasks;

if (ov.status === "fulfilled") setStats(ov.value);
if (auct.status === "fulfilled") setAuctions(auct.value);
if (rep.status === "fulfilled") setReports(rep.value);
if (ev.status === "fulfilled") setEvents(ev.value);

// 공지는 “실 API only”
if (notiPage.status === "fulfilled") {
  setNotices(notiPage.value.items ?? []);
} else {
  // 공지만큼은 mock으로 되돌리지 않음 (빈 배열 유지/기존 유지)
  console.warn("[Admin] notices fetch failed", notiPage.reason);
}

setLastUpdatedAt(nowIso());


};

useEffect(() => {
void refreshAll();
}, [reportStatusFilter, reportSeverityFilter]);

// 아래 두 개는 기존 코드 유지(네 백엔드 상황에 맞춰 그대로 두거나 나중에 연결)
const suspendAuction = (auctionId: string): void => {
(async () => {
const reason = window.prompt("임시차단 사유를 입력하세요") || "";
if (!reason.trim()) return;
try {
await adminApi.suspendAuction?.(auctionId, reason.trim());
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
await adminApi.forceEndAuction?.(auctionId, reason.trim());
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
await adminApi.assignReport?.(reportId, assignee);
setReports((prev) =>
prev.map((r) => (r.id === reportId ? { ...r, assignedTo: assignee, status: r.status === "대기" ? "처리중" : r.status } : r))
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
await adminApi.resolveReport?.(reportId, next);
setReports((prev) => prev.map((r) => (r.id === reportId ? { ...r, status: next } : r)));
} catch (e) {
console.error(e);
alert("신고 처리에 실패했습니다.");
}
})();
};

// 공지: create 후 detail을 때리지 말고 “목록 refresh”로 끝내기 (너가 겪는 500 회피)
const addNotice = (payload: NoticeCreatePayload): void => {
(async () => {
try {
await adminApi.createNotice(payload);
const page = await adminApi.getNotices({ page: 0, size: 50 });
setNotices(page.items ?? []);
} catch (e) {
console.error(e);
alert("공지 등록에 실패했습니다. 서버 로그/응답을 확인하세요.");
}
})();
};

const updateNotice = (noticeId: number, payload: NoticeUpdatePayload): void => {
(async () => {
try {
await adminApi.updateNotice(noticeId, payload);
// 성공 시 로컬 갱신(또는 refresh)
setNotices((prev) =>
prev.map((n) =>
n.id === noticeId
? {
...n,
category: payload.category ?? n.category,
title: payload.title ?? n.title,
content: payload.content ?? n.content,
pinned: typeof payload.pinned === "boolean" ? payload.pinned : n.pinned,
importance: typeof payload.importance === "number" ? payload.importance : n.importance,
updatedAt: nowIso(),
}
: n
)
);
} catch (e) {
console.error(e);
alert("공지 수정에 실패했습니다.");
}
})();
};

const deleteNotice = (noticeId: number): void => {
(async () => {
try {
await adminApi.deleteNotice(noticeId);
setNotices((prev) => prev.filter((n) => n.id !== noticeId));
} catch (e) {
console.error(e);
alert("공지 삭제에 실패했습니다.");
}
})();
};

const addEvent = (e: Omit<CalendarEventRow, "id">): void => {
(async () => {
try {
const created = await adminApi.addEvent?.(e);
if (created) setEvents((prev) => [created, ...prev]);
} catch (err) {
console.error(err);
alert("일정 추가에 실패했습니다.");
}
})();
};

const reportsOpenCount = useMemo(
() => reports.filter((r) => r.status === "대기" || r.status === "처리중").length,
[reports]
);

const noticesCount = useMemo(() => notices.length, [notices]);

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

addNotice,
updateNotice,
deleteNotice,

addEvent,

reportsOpenCount,

reportStatusFilter,
setReportStatusFilter,

reportSeverityFilter,
setReportSeverityFilter,

noticesCount,


};

return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
};