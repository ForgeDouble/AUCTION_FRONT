//  src/pages/admin/AuctionAdminDashboard.tsx
import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  LayoutDashboard,Gavel,Siren,CalendarDays,Megaphone,Search,RefreshCw,ShieldCheck,UserCircle2,LogOut,Settings,ChevronLeft,ChevronRight,Plus,
  CheckCircle2,XCircle,Ban,Eye,Clock,Activity,Users,TrendingUp,AlertTriangle,FileText,
} from "lucide-react";

import { useAuth } from "@/hooks/useAuth";

type TabKey = "overview" | "auctions" | "reports" | "calendar" | "notices";

type ReportStatus = "대기" | "처리중" | "완료" | "반려";
type ReportSeverity = "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
type AuctionStatus = "NORMAL" | "HOT" | "ENDING" | "SUSPENDED";

interface OverviewStats {
  todayNewUsers: number;
  todayCreatedAuctions: number;
  todayEndedAuctions: number;
  todaySoldAuctions: number;
  totalBids: number;
  ongoingAuctions: number;
  reportsOpen: number;
  realtimeUsers: number;
  todayActiveUsers: number;
}

interface AuctionRow {
  id: string;
  title: string;
  sellerMasked: string;
  category: string;
  currentBid: number;
  bidCount: number;
  endsAt: string;
  status: AuctionStatus;
}

interface ReportRow {
  id: string;
  type: string;
  targetType: "PRODUCT" | "CHAT" | "USER" | "COMMENT";
  targetTitle: string;
  reporterMasked: string;
  createdAt: string;
  status: ReportStatus;
  severity: ReportSeverity;
  assignedTo?: string;
  description?: string;
  evidenceUrl?: string;
}

interface NoticeRow {
id: string;
pinned: boolean;
title: string;
body: string;
author: string;
createdAt: string;
acknowledged: boolean;
}

interface CalendarEventRow {
id: string;
date: string; // YYYY-MM-DD
time?: string; // HH:mm
title: string;
tag?: "운영" | "장애" | "정산" | "점검" | "기타";
}

function nowIso(): string {
return new Date().toISOString();
}

function formatKST(iso: string): string {
const d = new Date(iso);
const yyyy = d.getFullYear();
const mm = String(d.getMonth() + 1).padStart(2, "0");
const dd = String(d.getDate()).padStart(2, "0");
const hh = String(d.getHours()).padStart(2, "0");
const mi = String(d.getMinutes()).padStart(2, "0");
return `${yyyy}-${mm}-${dd} ${hh}:${mi}`;
}

function formatMoneyKRW(v: number): string {
return new Intl.NumberFormat("ko-KR").format(v);
}

function clamp(n: number, min: number, max: number): number {
return Math.max(min, Math.min(max, n));
}

// JWT payload만 “표시용”으로 파싱(검증 X)
function safeJwtPayload(token: string | null): Record<string, unknown> | null {
if (!token) return null;
const parts = token.split(".");
if (parts.length < 2) return null;
try {
const base64 = parts[1].replace(/-/g, "+").replace(/_/g, "/");
const padded = base64.padEnd(base64.length + (4 - (base64.length % 4)) % 4, "=");
const json = decodeURIComponent(
Array.from(atob(padded))
.map((c) => "%" + c.charCodeAt(0).toString(16).padStart(2, "0"))
.join("")
);
return JSON.parse(json) as Record<string, unknown>;
} catch {
return null;
}
}

function severityBadge(sev: ReportSeverity): { label: string; cls: string } {
const map: Record<ReportSeverity, { label: string; cls: string }> = {
LOW: { label: "LOW", cls: "bg-gray-100 text-gray-700 border-gray-200" },
MEDIUM: { label: "MEDIUM", cls: "bg-blue-50 text-blue-700 border-blue-200" },
HIGH: { label: "HIGH", cls: "bg-orange-50 text-orange-700 border-orange-200" },
CRITICAL: { label: "CRITICAL", cls: "bg-red-50 text-red-700 border-red-200" },
};
return map[sev];
}

function statusBadge(st: ReportStatus): { label: string; cls: string } {
const map: Record<ReportStatus, { label: string; cls: string }> = {
대기: { label: "대기", cls: "bg-yellow-50 text-yellow-800 border-yellow-200" },
처리중: { label: "처리중", cls: "bg-blue-50 text-blue-700 border-blue-200" },
완료: { label: "완료", cls: "bg-green-50 text-green-700 border-green-200" },
반려: { label: "반려", cls: "bg-gray-50 text-gray-700 border-gray-200" },
};
return map[st];
}

function auctionBadge(st: AuctionStatus): { label: string; cls: string } {
const map: Record<AuctionStatus, { label: string; cls: string }> = {
NORMAL: { label: "일반", cls: "bg-gray-50 text-gray-700 border-gray-200" },
HOT: { label: "HOT", cls: "bg-red-50 text-red-700 border-red-200" },
ENDING: { label: "마감임박", cls: "bg-orange-50 text-orange-700 border-orange-200" },
SUSPENDED: { label: "차단", cls: "bg-gray-200 text-gray-700 border-gray-300" },
};
return map[st];
}

function startOfMonth(d: Date): Date {
return new Date(d.getFullYear(), d.getMonth(), 1);
}
function endOfMonth(d: Date): Date {
return new Date(d.getFullYear(), d.getMonth() + 1, 0);
}
function yyyyMmDd(d: Date): string {
const y = d.getFullYear();
const m = String(d.getMonth() + 1).padStart(2, "0");
const dd = String(d.getDate()).padStart(2, "0");
return `${y}-${m}-${dd}`;
}

const AuctionAdminDashboard: React.FC = () => {
const [tab, setTab] = useState<TabKey>("overview");
const [query, setQuery] = useState<string>("");
const [lastUpdatedAt, setLastUpdatedAt] = useState<string>(nowIso());

// Auth
const auth = (() => {
try {
return useAuth();
} catch {
return null as unknown as ReturnType<typeof useAuth>;
}
})();

const token = useMemo(() => localStorage.getItem("accessToken"), []);
const payload = useMemo(() => safeJwtPayload(token), [token]);

const adminEmail = useMemo(() => {
const fromHook = auth?.userEmail;
if (fromHook) return fromHook;
const fromToken = payload?.email;
if (typeof fromToken === "string") return fromToken;
return "admin@example.com";
}, [auth, payload]);

const adminNick = useMemo(() => {
const v = payload?.nick;
if (typeof v === "string" && v.trim()) return v;
return "관리자";
}, [payload]);

const adminRole = useMemo(() => {
const v = payload?.authority;
if (typeof v === "string" && v.trim()) return v;
return "ADMIN";
}, [payload]);

// ===== 샘플 데이터(백엔드 연동 전) =====
const [stats, setStats] = useState<OverviewStats>({
todayNewUsers: 48,
todayCreatedAuctions: 23,
todayEndedAuctions: 18,
todaySoldAuctions: 14,
totalBids: 1247,
ongoingAuctions: 156,
reportsOpen: 7,
realtimeUsers: 342,
todayActiveUsers: 1523,
});

const [auctions, setAuctions] = useState<AuctionRow[]>([
{
id: "A-1001",
title: "삼성 갤럭시 Z Fold 5",
sellerMasked: "seller***",
category: "전자제품",
currentBid: 1850000,
bidCount: 45,
endsAt: new Date(Date.now() + 2 * 60 * 60 * 1000 + 30 * 60 * 1000).toISOString(),
status: "HOT",
},
{
id: "A-1002",
title: "맥북 프로 14인치 M3",
sellerMasked: "apple***",
category: "전자제품",
currentBid: 2340000,
bidCount: 38,
endsAt: new Date(Date.now() + 5 * 60 * 60 * 1000 + 12 * 60 * 1000).toISOString(),
status: "HOT",
},
{
id: "A-1003",
title: "소니 A7M4 풀프레임",
sellerMasked: "camera***",
category: "전자제품",
currentBid: 2890000,
bidCount: 52,
endsAt: new Date(Date.now() + 30 * 60 * 1000).toISOString(),
status: "ENDING",
},
{
id: "A-1004",
title: "의류 랜덤 박스(브랜드 혼합)",
sellerMasked: "fashion***",
category: "의류/패션",
currentBid: 120000,
bidCount: 9,
endsAt: new Date(Date.now() + 9 * 60 * 60 * 1000).toISOString(),
status: "NORMAL",
},
]);

const [reports, setReports] = useState<ReportRow[]>([
{
id: "R-2001",
type: "부적절한 상품",
targetType: "PRODUCT",
targetTitle: "아이폰 14 Pro(박스 미개봉)",
reporterMasked: "user***",
createdAt: new Date(Date.now() - 10 * 60 * 1000).toISOString(),
status: "대기",
severity: "HIGH",
assignedTo: "",
description: "금지 품목 의심. 상세 설명이 과도하게 모호합니다.",
evidenceUrl: "",
},
{
id: "R-2002",
type: "사기 의심",
targetType: "USER",
targetTitle: "seller*** (판매자 계정)",
reporterMasked: "buyer***",
createdAt: new Date(Date.now() - 25 * 60 * 1000).toISOString(),
status: "처리중",
severity: "CRITICAL",
assignedTo: "ops-1",
description: "동일 사진 반복 / 외부 연락 유도 문구가 있음.",
evidenceUrl: "",
},
{
id: "R-2003",
type: "욕설/비방",
targetType: "CHAT",
targetTitle: "채팅방 A-1004",
reporterMasked: "seller***",
createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
status: "대기",
severity: "MEDIUM",
assignedTo: "",
description: "채팅 내 비방/욕설 포함",
evidenceUrl: "",
},
{
id: "R-2004",
type: "허위 정보",
targetType: "PRODUCT",
targetTitle: "LG 그램 17인치(상태 S급)",
reporterMasked: "user2***",
createdAt: new Date(Date.now() - 3 * 60 * 60 * 1000).toISOString(),
status: "완료",
severity: "LOW",
assignedTo: "ops-2",
description: "설명과 사진 불일치. 판매글 수정 안내 및 경고 처리 완료.",
evidenceUrl: "",
},
]);

const [selectedReportId, setSelectedReportId] = useState<string>("R-2001");

const [notices, setNotices] = useState<NoticeRow[]>([
{
id: "N-3001",
pinned: true,
title: "인수인계: 신고 처리 기준(12/18 업데이트)",
body:
"CRITICAL은 즉시 임시차단 후 증빙 확보 → 30분 내 1차 판정. HIGH는 2시간 내 처리. 채팅 신고는 채팅 로그 보존(7일) 확인 후 조치.",
author: "lead-admin",
createdAt: new Date(Date.now() - 6 * 60 * 60 * 1000).toISOString(),
acknowledged: false,
},
{
id: "N-3002",
pinned: false,
title: "정산 점검 일정",
body: "매일 02:10~02:20 정산 배치. 해당 시간대 결제/정산 지표 변동은 정상 범주.",
author: "ops-1",
createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
acknowledged: true,
},
]);

const [calendarAnchor, setCalendarAnchor] = useState<Date>(() => new Date());
const [events, setEvents] = useState<CalendarEventRow[]>([
{ id: "E-4001", date: yyyyMmDd(new Date()), time: "10:30", title: "운영: 신고 처리 회의", tag: "운영" },
{ id: "E-4002", date: yyyyMmDd(new Date()), time: "14:00", title: "점검: 검색 인덱스 점검", tag: "점검" },
]);

const [eventModalOpen, setEventModalOpen] = useState<boolean>(false);
const [eventDraft, setEventDraft] = useState<{ date: string; time: string; title: string; tag: CalendarEventRow["tag"] }>({
date: yyyyMmDd(new Date()),
time: "10:00",
title: "",
tag: "기타",
});

// “실시간 접속자” 샘플 흔들림(백엔드 연결하면 제거)
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
// TODO: 백엔드 연동 시 여기서 /admin/metrics 등 fetch
setLastUpdatedAt(nowIso());
};

// ===== 검색/필터 =====
const filteredAuctions = useMemo(() => {
const q = query.trim().toLowerCase();
if (!q) return auctions;
return auctions.filter((a) => {
return (
a.id.toLowerCase().includes(q) ||
a.title.toLowerCase().includes(q) ||
a.sellerMasked.toLowerCase().includes(q) ||
a.category.toLowerCase().includes(q)
);
});
}, [auctions, query]);

const [reportStatusFilter, setReportStatusFilter] = useState<ReportStatus | "ALL">("ALL");
const [reportSeverityFilter, setReportSeverityFilter] = useState<ReportSeverity | "ALL">("ALL");

const filteredReports = useMemo(() => {
const q = query.trim().toLowerCase();
return reports.filter((r) => {
if (reportStatusFilter !== "ALL" && r.status !== reportStatusFilter) return false;
if (reportSeverityFilter !== "ALL" && r.severity !== reportSeverityFilter) return false;
if (!q) return true;
return (
r.id.toLowerCase().includes(q) ||
r.type.toLowerCase().includes(q) ||
r.targetTitle.toLowerCase().includes(q) ||
r.reporterMasked.toLowerCase().includes(q)
);
});
}, [reports, query, reportStatusFilter, reportSeverityFilter]);

const selectedReport = useMemo(() => {
return reports.find((r) => r.id === selectedReportId) || reports[0] || null;
}, [reports, selectedReportId]);

// ===== 액션(샘플) =====
const markNoticeAck = (id: string): void => {
setNotices((prev) => prev.map((n) => (n.id === id ? { ...n, acknowledged: true } : n)));
};

const addNotice = (title: string, body: string): void => {
const n: NoticeRow = {
id: "N-" + Math.floor(1000 + Math.random() * 9000),
pinned: false,
title: title.trim(),
body: body.trim(),
author: adminNick,
createdAt: nowIso(),
acknowledged: false,
};
setNotices((prev) => [n, ...prev]);
};

const assignReport = (id: string, assignee: string): void => {
setReports((prev) => prev.map((r) => (r.id === id ? { ...r, assignedTo: assignee, status: r.status === "대기" ? "처리중" : r.status } : r)));
};

const resolveReport = (id: string, next: ReportStatus): void => {
setReports((prev) => prev.map((r) => (r.id === id ? { ...r, status: next } : r)));
};

const suspendAuction = (auctionId: string): void => {
setAuctions((prev) => prev.map((a) => (a.id === auctionId ? { ...a, status: "SUSPENDED" } : a)));
};

const forceEndAuction = (auctionId: string): void => {
// 실제로는 서버에서 종료 처리 후 목록 리프레시
setAuctions((prev) => prev.filter((a) => a.id !== auctionId));
setStats((s) => ({
...s,
todayEndedAuctions: s.todayEndedAuctions + 1,
ongoingAuctions: Math.max(0, s.ongoingAuctions - 1),
}));
};

const addEvent = (): void => {
if (!eventDraft.title.trim()) return;
const e: CalendarEventRow = {
id: "E-" + Math.floor(1000 + Math.random() * 9000),
date: eventDraft.date,
time: eventDraft.time.trim() || undefined,
title: eventDraft.title.trim(),
tag: eventDraft.tag || "기타",
};
setEvents((prev) => [e, ...prev]);
setEventDraft({ date: eventDraft.date, time: "10:00", title: "", tag: "기타" });
setEventModalOpen(false);
};

// ===== 캘린더 계산 =====
const calStart = useMemo(() => startOfMonth(calendarAnchor), [calendarAnchor]);
const calEnd = useMemo(() => endOfMonth(calendarAnchor), [calendarAnchor]);

const monthLabel = useMemo(() => {
const y = calStart.getFullYear();
const m = calStart.getMonth() + 1;
return `${y}년 ${m}월`;
}, [calStart]);

const calendarDays = useMemo(() => {
// 월 시작 요일만큼 앞쪽 빈 칸 포함한 6주(42칸) 구성
const firstDow = calStart.getDay(); // 0=일
const totalDays = calEnd.getDate();
const cells: Array<{ date: string | null; inMonth: boolean }> = [];

for (let i = 0; i < firstDow; i += 1) cells.push({ date: null, inMonth: false });

for (let day = 1; day <= totalDays; day += 1) {
  const d = new Date(calStart.getFullYear(), calStart.getMonth(), day);
  cells.push({ date: yyyyMmDd(d), inMonth: true });
}

while (cells.length < 42) cells.push({ date: null, inMonth: false });
return cells;


}, [calStart, calEnd]);

const eventsByDate = useMemo(() => {
const map = new Map<string, CalendarEventRow[]>();
for (const e of events) {
if (!map.has(e.date)) map.set(e.date, []);
map.get(e.date)!.push(e);
}
// 시간순 정렬
for (const [k, v] of map.entries()) {
v.sort((a, b) => (a.time || "99:99").localeCompare(b.time || "99:99"));
map.set(k, v);
}
return map;
}, [events]);

// ===== UI 컴포넌트 =====
const SidebarItem: React.FC<{
active: boolean;
icon: React.ElementType;
label: string;
onClick: () => void;
badge?: number;
}> = ({ active, icon: Icon, label, onClick, badge }) => {
return (
<button
onClick={onClick}
className={
"w-full flex items-center justify-between gap-2 px-3 py-2 rounded-lg text-sm transition " +
(active ? "bg-violet-600 text-white" : "text-gray-700 hover:bg-gray-100")
}
>
<span className="flex items-center gap-2">
<Icon className={"w-4 h-4 " + (active ? "text-white" : "text-gray-500")} />
<span className="font-medium">{label}</span>
</span>
{typeof badge === "number" && badge > 0 && (
<span className={"text-xs px-2 py-0.5 rounded-full " + (active ? "bg-white/20 text-white" : "bg-pink-600 text-white")}>
{badge}
</span>
)}
</button>
);
};

const StatCard: React.FC<{
title: string;
value: string;
icon: React.ElementType;
hint?: string;
}> = ({ title, value, icon: Icon, hint }) => {
return (
<div className="bg-white border border-gray-100 rounded-xl p-4 shadow-sm">
<div className="flex items-center justify-between">
<div className="text-xs text-gray-500">{title}</div>
<div className="w-8 h-8 rounded-lg bg-gray-50 flex items-center justify-center">
<Icon className="w-4 h-4 text-gray-600" />
</div>
</div>
<div className="mt-2 text-xl font-bold text-gray-900">{value}</div>
{hint && <div className="mt-1 text-[11px] text-gray-500">{hint}</div>}
</div>
);
};

const SectionTitle: React.FC<{ title: string; right?: React.ReactNode }> = ({ title, right }) => {
return (
<div className="flex items-center justify-between mb-3">
<div className="text-sm font-semibold text-gray-900">{title}</div>
{right ? <div>{right}</div> : null}
</div>
);
};

const pendingNotices = useMemo(() => notices.filter((n) => !n.acknowledged).length, [notices]);

// ===== 공지 작성(간단) =====
const noticeTitleRef = useRef<HTMLInputElement | null>(null);
const noticeBodyRef = useRef<HTMLTextAreaElement | null>(null);

const submitNotice = (): void => {
const t = noticeTitleRef.current?.value || "";
const b = noticeBodyRef.current?.value || "";
if (!t.trim() || !b.trim()) return;
addNotice(t, b);
if (noticeTitleRef.current) noticeTitleRef.current.value = "";
if (noticeBodyRef.current) noticeBodyRef.current.value = "";
};

// ===== 상단 검색 placeholder =====
const searchPlaceholder = useMemo(() => {
if (tab === "auctions") return "경매 ID/제목/판매자/카테고리 검색";
if (tab === "reports") return "신고 ID/유형/대상/신고자 검색";
if (tab === "notices") return "공지 제목 검색";
if (tab === "calendar") return "일정 제목 검색(현재는 목록에서만 활용)";
return "검색";
}, [tab]);

const filteredNotices = useMemo(() => {
const q = query.trim().toLowerCase();
if (!q) return notices;
return notices.filter((n) => n.title.toLowerCase().includes(q) || n.body.toLowerCase().includes(q));
}, [notices, query]);

const filteredEvents = useMemo(() => {
const q = query.trim().toLowerCase();
if (!q) return events;
return events.filter((e) => e.title.toLowerCase().includes(q));
}, [events, query]);

return (
<div className="min-h-screen bg-gray-50">
{/* Top Header */}
<div className="sticky top-0 z-20 bg-white border-b border-gray-200">
<div className="max-w-[1600px] mx-auto px-4 py-3 flex items-center justify-between gap-3">
<div className="flex items-center gap-3">
<div className="w-9 h-9 rounded-xl bg-violet-600 flex items-center justify-center">
<ShieldCheck className="w-5 h-5 text-white" />
</div>
<div>
<div className="text-sm font-bold text-gray-900">경매 관리자</div>
<div className="text-[11px] text-gray-500">실시간 모니터링 / 신고 / 운영 일정</div>
</div>
</div>

      <div className="flex-1 flex items-center gap-2 max-w-[720px]">
        <div className="flex items-center gap-2 bg-gray-100 rounded-xl px-3 py-2 w-full">
          <Search className="w-4 h-4 text-gray-500" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={searchPlaceholder}
            className="bg-transparent outline-none text-sm text-gray-800 w-full"
          />
        </div>
      </div>

      <div className="flex items-center gap-2">
        <div className="hidden md:flex items-center gap-2 px-3 py-2 rounded-xl bg-green-50 border border-green-100">
          <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
          <span className="text-xs font-semibold text-green-700">SYSTEM OK</span>
        </div>

        <button
          onClick={refreshAll}
          className="px-3 py-2 rounded-xl bg-white border border-gray-200 hover:bg-gray-50 text-sm flex items-center gap-2"
          title="새로고침"
        >
          <RefreshCw className="w-4 h-4 text-gray-700" />
          <span className="hidden md:inline">Refresh</span>
        </button>

        <button
          onClick={() => setTab("notices")}
          className="px-3 py-2 rounded-xl bg-white border border-gray-200 hover:bg-gray-50 text-sm flex items-center gap-2"
          title="공지/인수인계"
        >
          <Megaphone className="w-4 h-4 text-gray-700" />
          {pendingNotices > 0 ? (
            <span className="text-xs px-2 py-0.5 rounded-full bg-pink-600 text-white">{pendingNotices}</span>
          ) : (
            <span className="hidden md:inline text-gray-700">공지</span>
          )}
        </button>

        <div className="flex items-center gap-2 pl-2 border-l border-gray-200">
          <div className="w-9 h-9 rounded-full bg-gray-100 flex items-center justify-center overflow-hidden">
            <UserCircle2 className="w-6 h-6 text-gray-600" />
          </div>
          <div className="hidden md:block leading-tight">
            <div className="text-xs font-semibold text-gray-900">{adminNick}</div>
            <div className="text-[11px] text-gray-500">{adminRole}</div>
          </div>
        </div>
      </div>
    </div>

    <div className="max-w-[1600px] mx-auto px-4 pb-2">
      <div className="text-[11px] text-gray-500">Last updated: {formatKST(lastUpdatedAt)}</div>
    </div>
  </div>

  {/* Layout */}
  <div className="max-w-[1600px] mx-auto px-4 py-4 grid grid-cols-1 lg:grid-cols-[280px_1fr] gap-4">
    {/* Sidebar */}
    <div className="bg-white border border-gray-100 rounded-2xl p-3 shadow-sm h-fit">
      <div className="flex items-center gap-3 p-2 rounded-xl bg-gray-50 border border-gray-100">
        <div className="w-10 h-10 rounded-xl bg-violet-600 flex items-center justify-center">
          <UserCircle2 className="w-6 h-6 text-white" />
        </div>
        <div className="min-w-0">
          <div className="text-sm font-bold text-gray-900 truncate">{adminNick}</div>
          <div className="text-[11px] text-gray-500 truncate">{adminEmail}</div>
          <div className="text-[11px] text-gray-500">Role: {adminRole}</div>
        </div>
      </div>

      <div className="mt-3 space-y-1">
        <SidebarItem active={tab === "overview"} icon={LayoutDashboard} label="개요" onClick={() => setTab("overview")} />
        <SidebarItem active={tab === "auctions"} icon={Gavel} label="경매 모니터링" onClick={() => setTab("auctions")} />
        <SidebarItem active={tab === "reports"} icon={Siren} label="신고 관리" onClick={() => setTab("reports")} badge={stats.reportsOpen} />
        <SidebarItem active={tab === "calendar"} icon={CalendarDays} label="운영 캘린더" onClick={() => setTab("calendar")} />
        <SidebarItem active={tab === "notices"} icon={Megaphone} label="인수인계/공지" onClick={() => setTab("notices")} badge={pendingNotices} />
      </div>

      <div className="mt-3 pt-3 border-t border-gray-100 flex items-center gap-2">
        <button className="flex-1 px-3 py-2 rounded-xl border border-gray-200 hover:bg-gray-50 text-sm flex items-center justify-center gap-2">
          <Settings className="w-4 h-4" />
          설정
        </button>
        <button className="flex-1 px-3 py-2 rounded-xl border border-gray-200 hover:bg-gray-50 text-sm flex items-center justify-center gap-2">
          <LogOut className="w-4 h-4" />
          로그아웃
        </button>
      </div>

      <div className="mt-3 p-3 rounded-xl bg-violet-50 border border-violet-100">
        <div className="text-xs font-semibold text-violet-900">운영 체크</div>
        <div className="mt-2 grid grid-cols-2 gap-2 text-[11px] text-violet-900">
          <div className="flex items-center gap-2">
            <Activity className="w-4 h-4" />
            <span>실시간: {stats.realtimeUsers.toLocaleString()}</span>
          </div>
          <div className="flex items-center gap-2">
            <Users className="w-4 h-4" />
            <span>금일: {stats.todayActiveUsers.toLocaleString()}</span>
          </div>
        </div>
      </div>
    </div>

    {/* Main */}
    <div className="space-y-4">
      {/* OVERVIEW */}
      {tab === "overview" && (
        <div className="space-y-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <StatCard title="금일 신규가입" value={stats.todayNewUsers.toLocaleString()} icon={Users} hint="오늘 00:00 기준" />
            <StatCard title="금일 생성 경매" value={stats.todayCreatedAuctions.toLocaleString()} icon={Gavel} hint="오늘 생성된 게시" />
            <StatCard title="진행중 경매" value={stats.ongoingAuctions.toLocaleString()} icon={Clock} hint="현재 진행" />
            <StatCard title="신고(오픈)" value={stats.reportsOpen.toLocaleString()} icon={AlertTriangle} hint="대기/처리중" />
            <StatCard title="전체 입찰" value={stats.totalBids.toLocaleString()} icon={TrendingUp} hint="누적" />
            <StatCard title="금일 종료" value={stats.todayEndedAuctions.toLocaleString()} icon={CheckCircle2} hint="타임아웃 포함" />
            <StatCard title="금일 판매" value={stats.todaySoldAuctions.toLocaleString()} icon={FileText} hint="낙찰/결제 완료" />
            <StatCard title="실시간 접속" value={stats.realtimeUsers.toLocaleString()} icon={Activity} hint="웹/앱 합산" />
          </div>

          <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
            <div className="bg-white border border-gray-100 rounded-2xl p-4 shadow-sm">
              <SectionTitle
                title="진행중 경매(상위)"
                right={<span className="text-[11px] text-gray-500">검색: 경매 탭에서 상세</span>}
              />
              <div className="space-y-2">
                {auctions.slice(0, 5).map((a) => {
                  const b = auctionBadge(a.status);
                  return (
                    <div key={a.id} className="p-3 rounded-xl bg-gray-50 border border-gray-100 flex items-center justify-between gap-2">
                      <div className="min-w-0">
                        <div className="text-sm font-semibold text-gray-900 truncate">{a.title}</div>
                        <div className="text-[11px] text-gray-500">
                          {a.id} · {a.category} · {a.sellerMasked}
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-sm font-bold text-gray-900">₩{formatMoneyKRW(a.currentBid)}</div>
                        <div className="text-[11px] text-gray-500">입찰 {a.bidCount} · {formatKST(a.endsAt)}</div>
                      </div>
                      <span className={"text-[11px] px-2 py-1 rounded-full border " + b.cls}>{b.label}</span>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="bg-white border border-gray-100 rounded-2xl p-4 shadow-sm">
              <SectionTitle
                title="최근 신고(상위)"
                right={
                  <button
                    onClick={() => setTab("reports")}
                    className="text-xs px-3 py-2 rounded-xl border border-gray-200 hover:bg-gray-50"
                  >
                    신고 관리로 →
                  </button>
                }
              />
              <div className="space-y-2">
                {reports
                  .slice()
                  .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
                  .slice(0, 5)
                  .map((r) => {
                    const sb = statusBadge(r.status);
                    const sev = severityBadge(r.severity);
                    return (
                      <button
                        key={r.id}
                        onClick={() => {
                          setSelectedReportId(r.id);
                          setTab("reports");
                        }}
                        className="w-full text-left p-3 rounded-xl bg-gray-50 border border-gray-100 hover:bg-gray-100 transition flex items-start justify-between gap-2"
                      >
                        <div className="min-w-0">
                          <div className="flex items-center gap-2">
                            <span className={"text-[11px] px-2 py-0.5 rounded-full border " + sev.cls}>{sev.label}</span>
                            <span className={"text-[11px] px-2 py-0.5 rounded-full border " + sb.cls}>{sb.label}</span>
                          </div>
                          <div className="mt-1 text-sm font-semibold text-gray-900 truncate">{r.type}</div>
                          <div className="text-[11px] text-gray-500 truncate">{r.targetTitle}</div>
                          <div className="text-[11px] text-gray-500">{r.reporterMasked} · {formatKST(r.createdAt)}</div>
                        </div>
                        <div className="text-[11px] text-gray-400">#{r.id}</div>
                      </button>
                    );
                  })}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* AUCTIONS */}
      {tab === "auctions" && (
        <div className="bg-white border border-gray-100 rounded-2xl p-4 shadow-sm">
          <SectionTitle
            title="경매 모니터링"
            right={
              <div className="text-[11px] text-gray-500">
                액션은 샘플 상태 변경(백엔드 연결 시 실제 API 호출)
              </div>
            }
          />

          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-[11px] text-gray-500 border-b border-gray-100">
                  <th className="text-left py-2 pr-2">ID</th>
                  <th className="text-left py-2 pr-2">제목</th>
                  <th className="text-left py-2 pr-2">판매자</th>
                  <th className="text-left py-2 pr-2">카테고리</th>
                  <th className="text-right py-2 pr-2">현재가</th>
                  <th className="text-right py-2 pr-2">입찰</th>
                  <th className="text-left py-2 pr-2">종료</th>
                  <th className="text-left py-2 pr-2">상태</th>
                  <th className="text-right py-2">조치</th>
                </tr>
              </thead>
              <tbody>
                {filteredAuctions.map((a) => {
                  const b = auctionBadge(a.status);
                  return (
                    <tr key={a.id} className="border-b border-gray-50 hover:bg-gray-50">
                      <td className="py-3 pr-2 text-[12px] text-gray-600">{a.id}</td>
                      <td className="py-3 pr-2">
                        <div className="font-semibold text-gray-900">{a.title}</div>
                      </td>
                      <td className="py-3 pr-2 text-gray-700">{a.sellerMasked}</td>
                      <td className="py-3 pr-2 text-gray-700">{a.category}</td>
                      <td className="py-3 pr-2 text-right font-bold text-gray-900">₩{formatMoneyKRW(a.currentBid)}</td>
                      <td className="py-3 pr-2 text-right text-gray-700">{a.bidCount}</td>
                      <td className="py-3 pr-2 text-gray-700">{formatKST(a.endsAt)}</td>
                      <td className="py-3 pr-2">
                        <span className={"text-[11px] px-2 py-1 rounded-full border " + b.cls}>{b.label}</span>
                      </td>
                      <td className="py-3 text-right">
                        <div className="inline-flex items-center gap-2">
                          <button className="px-2 py-2 rounded-xl border border-gray-200 hover:bg-gray-50" title="보기">
                            <Eye className="w-4 h-4 text-gray-700" />
                          </button>
                          <button
                            onClick={() => suspendAuction(a.id)}
                            className="px-2 py-2 rounded-xl border border-gray-200 hover:bg-gray-50"
                            title="임시차단"
                          >
                            <Ban className="w-4 h-4 text-gray-700" />
                          </button>
                          <button
                            onClick={() => forceEndAuction(a.id)}
                            className="px-2 py-2 rounded-xl border border-gray-200 hover:bg-gray-50"
                            title="강제종료"
                          >
                            <XCircle className="w-4 h-4 text-gray-700" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
                {filteredAuctions.length === 0 && (
                  <tr>
                    <td colSpan={9} className="py-10 text-center text-gray-500">
                      검색 결과가 없습니다.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-3">
            <div className="p-3 rounded-xl bg-gray-50 border border-gray-100">
              <div className="text-xs font-semibold text-gray-900">관리자 모니터링 체크리스트</div>
              <ul className="mt-2 text-[12px] text-gray-700 space-y-1 list-disc pl-5">
                <li>마감임박 + 급상승(HOT) 경매 수동 확인</li>
                <li>입찰 폭주(초당 N건) 감지 시 Rate Limit/락 상태 확인</li>
                <li>신고 CRITICAL 우선 처리(임시차단 → 증빙)</li>
              </ul>
            </div>
            <div className="p-3 rounded-xl bg-gray-50 border border-gray-100">
              <div className="text-xs font-semibold text-gray-900">권장 지표(추가 예정)</div>
              <ul className="mt-2 text-[12px] text-gray-700 space-y-1 list-disc pl-5">
                <li>결제 실패율 / 낙찰 후 미결제율</li>
                <li>신고 처리 SLA(평균/95p)</li>
                <li>Redis Lock 충돌률, Lua 실패 코드 비율</li>
              </ul>
            </div>
            <div className="p-3 rounded-xl bg-gray-50 border border-gray-100">
              <div className="text-xs font-semibold text-gray-900">운영 액션(백엔드 연동 시)</div>
              <ul className="mt-2 text-[12px] text-gray-700 space-y-1 list-disc pl-5">
                <li>경매 차단/해제(사유 기록 필수)</li>
                <li>강제 종료/환불 플래그</li>
                <li>판매자 제재(기간정지/뷰온리)</li>
              </ul>
            </div>
          </div>
        </div>
      )}

      {/* REPORTS */}
      {tab === "reports" && (
        <div className="grid grid-cols-1 xl:grid-cols-[420px_1fr] gap-4">
          <div className="bg-white border border-gray-100 rounded-2xl p-4 shadow-sm">
            <SectionTitle
              title="신고 리스트"
              right={
                <div className="flex items-center gap-2">
                  <select
                    value={reportStatusFilter}
                    onChange={(e) => setReportStatusFilter(e.target.value as ReportStatus | "ALL")}
                    className="text-xs border border-gray-200 rounded-xl px-2 py-2 bg-white"
                  >
                    <option value="ALL">상태 전체</option>
                    <option value="대기">대기</option>
                    <option value="처리중">처리중</option>
                    <option value="완료">완료</option>
                    <option value="반려">반려</option>
                  </select>

                  <select
                    value={reportSeverityFilter}
                    onChange={(e) => setReportSeverityFilter(e.target.value as ReportSeverity | "ALL")}
                    className="text-xs border border-gray-200 rounded-xl px-2 py-2 bg-white"
                  >
                    <option value="ALL">심각도 전체</option>
                    <option value="LOW">LOW</option>
                    <option value="MEDIUM">MEDIUM</option>
                    <option value="HIGH">HIGH</option>
                    <option value="CRITICAL">CRITICAL</option>
                  </select>
                </div>
              }
            />

            <div className="space-y-2">
              {filteredReports
                .slice()
                .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
                .map((r) => {
                  const sb = statusBadge(r.status);
                  const sev = severityBadge(r.severity);
                  const active = selectedReportId === r.id;
                  return (
                    <button
                      key={r.id}
                      onClick={() => setSelectedReportId(r.id)}
                      className={
                        "w-full text-left p-3 rounded-xl border transition " +
                        (active ? "bg-violet-50 border-violet-200" : "bg-gray-50 border-gray-100 hover:bg-gray-100")
                      }
                    >
                      <div className="flex items-center justify-between gap-2">
                        <div className="text-sm font-semibold text-gray-900 truncate">{r.type}</div>
                        <div className="text-[11px] text-gray-400">#{r.id}</div>
                      </div>

                      <div className="mt-1 text-[11px] text-gray-500 truncate">{r.targetTitle}</div>

                      <div className="mt-2 flex items-center gap-2">
                        <span className={"text-[11px] px-2 py-0.5 rounded-full border " + sev.cls}>{sev.label}</span>
                        <span className={"text-[11px] px-2 py-0.5 rounded-full border " + sb.cls}>{sb.label}</span>
                        <span className="text-[11px] text-gray-500">{r.reporterMasked}</span>
                        <span className="text-[11px] text-gray-500">{formatKST(r.createdAt)}</span>
                      </div>
                    </button>
                  );
                })}

              {filteredReports.length === 0 && (
                <div className="py-10 text-center text-gray-500">검색 결과가 없습니다.</div>
              )}
            </div>
          </div>

          <div className="bg-white border border-gray-100 rounded-2xl p-4 shadow-sm">
            <SectionTitle
              title="신고 상세 / 처리"
              right={
                selectedReport ? (
                  <div className="text-[11px] text-gray-500">SLA: CRITICAL 30분 / HIGH 2시간 / MEDIUM 6시간</div>
                ) : null
              }
            />

            {!selectedReport && <div className="py-10 text-center text-gray-500">신고를 선택하세요.</div>}

            {selectedReport && (
              <div className="space-y-3">
                <div className="p-3 rounded-xl bg-gray-50 border border-gray-100">
                  <div className="flex items-center justify-between gap-2">
                    <div className="text-sm font-bold text-gray-900">{selectedReport.type}</div>
                    <div className="text-[11px] text-gray-400">#{selectedReport.id}</div>
                  </div>
                  <div className="mt-1 text-[12px] text-gray-700">
                    대상: <span className="font-semibold">{selectedReport.targetType}</span> · {selectedReport.targetTitle}
                  </div>
                  <div className="mt-1 text-[12px] text-gray-700">
                    신고자: {selectedReport.reporterMasked} · 생성: {formatKST(selectedReport.createdAt)}
                  </div>

                  <div className="mt-2 flex items-center gap-2">
                    <span className={"text-[11px] px-2 py-1 rounded-full border " + severityBadge(selectedReport.severity).cls}>
                      {severityBadge(selectedReport.severity).label}
                    </span>
                    <span className={"text-[11px] px-2 py-1 rounded-full border " + statusBadge(selectedReport.status).cls}>
                      {statusBadge(selectedReport.status).label}
                    </span>
                    <span className="text-[11px] text-gray-500">
                      담당: {selectedReport.assignedTo && selectedReport.assignedTo.trim() ? selectedReport.assignedTo : "미배정"}
                    </span>
                  </div>
                </div>

                <div className="p-3 rounded-xl bg-white border border-gray-100">
                  <div className="text-xs font-semibold text-gray-900">내용</div>
                  <div className="mt-2 text-sm text-gray-800 whitespace-pre-wrap break-words">
                    {selectedReport.description || "내용이 없습니다."}
                  </div>
                </div>

                <div className="p-3 rounded-xl bg-white border border-gray-100">
                  <div className="text-xs font-semibold text-gray-900">조치</div>

                  <div className="mt-2 flex flex-wrap gap-2">
                    <button
                      onClick={() => assignReport(selectedReport.id, adminNick)}
                      className="px-3 py-2 rounded-xl border border-gray-200 hover:bg-gray-50 text-sm flex items-center gap-2"
                    >
                      <UserCircle2 className="w-4 h-4" />
                      내게 배정
                    </button>

                    <button
                      onClick={() => resolveReport(selectedReport.id, "완료")}
                      className="px-3 py-2 rounded-xl bg-green-600 hover:bg-green-700 text-white text-sm flex items-center gap-2"
                    >
                      <CheckCircle2 className="w-4 h-4" />
                      완료 처리
                    </button>

                    <button
                      onClick={() => resolveReport(selectedReport.id, "반려")}
                      className="px-3 py-2 rounded-xl bg-gray-700 hover:bg-gray-800 text-white text-sm flex items-center gap-2"
                    >
                      <XCircle className="w-4 h-4" />
                      반려
                    </button>

                    <button
                      onClick={() => {
                        // 신고 대상이 상품이면 해당 경매 차단 샘플
                        const targetAuction = auctions.find((a) => selectedReport.targetTitle.includes(a.title));
                        if (targetAuction) suspendAuction(targetAuction.id);
                        resolveReport(selectedReport.id, "처리중");
                      }}
                      className="px-3 py-2 rounded-xl border border-gray-200 hover:bg-gray-50 text-sm flex items-center gap-2"
                    >
                      <Ban className="w-4 h-4" />
                      관련 경매 차단(샘플)
                    </button>
                  </div>

                  <div className="mt-3 text-[11px] text-gray-500">
                    운영 팁: “차단/제재”는 사유 기록 + 증빙(스크린샷/로그) 링크 필수로 남기는 것을 권장.
                  </div>
                </div>

                <div className="p-3 rounded-xl bg-violet-50 border border-violet-100">
                  <div className="text-xs font-semibold text-violet-900">추가로 관리자에게 필요한 것(추천)</div>
                  <ul className="mt-2 text-[12px] text-violet-900 space-y-1 list-disc pl-5">
                    <li>신고 처리 로그(누가/언제/무슨 사유로 조치했는지)</li>
                    <li>재신고/반복 신고자 탐지(악성 신고)</li>
                    <li>대상 사용자/상품의 “이력(신고 누적/경고/정지)” 팝오버</li>
                  </ul>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* CALENDAR */}
      {tab === "calendar" && (
        <div className="bg-white border border-gray-100 rounded-2xl p-4 shadow-sm">
          <SectionTitle
            title="운영 캘린더"
            right={
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setCalendarAnchor((d) => new Date(d.getFullYear(), d.getMonth() - 1, 1))}
                  className="px-2 py-2 rounded-xl border border-gray-200 hover:bg-gray-50"
                  title="이전 달"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>

                <div className="text-sm font-semibold text-gray-900 w-[120px] text-center">{monthLabel}</div>

                <button
                  onClick={() => setCalendarAnchor((d) => new Date(d.getFullYear(), d.getMonth() + 1, 1))}
                  className="px-2 py-2 rounded-xl border border-gray-200 hover:bg-gray-50"
                  title="다음 달"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>

                <button
                  onClick={() => setEventModalOpen(true)}
                  className="px-3 py-2 rounded-xl bg-violet-600 hover:bg-violet-700 text-white text-sm flex items-center gap-2"
                >
                  <Plus className="w-4 h-4" />
                  일정 추가
                </button>
              </div>
            }
          />

          <div className="grid grid-cols-7 gap-2 text-[11px] text-gray-500 mb-2">
            <div className="text-center">일</div>
            <div className="text-center">월</div>
            <div className="text-center">화</div>
            <div className="text-center">수</div>
            <div className="text-center">목</div>
            <div className="text-center">금</div>
            <div className="text-center">토</div>
          </div>

          <div className="grid grid-cols-7 gap-2">
            {calendarDays.map((c, idx) => {
              const dayEvents = c.date ? eventsByDate.get(c.date) || [] : [];
              const isToday = c.date === yyyyMmDd(new Date());
              return (
                <div
                  key={idx}
                  className={
                    "min-h-[90px] rounded-xl border p-2 " +
                    (c.inMonth ? "bg-white border-gray-100" : "bg-gray-50 border-gray-100") +
                    (isToday ? " ring-2 ring-violet-200" : "")
                  }
                >
                  <div className="flex items-center justify-between">
                    <div className={"text-xs font-semibold " + (c.inMonth ? "text-gray-900" : "text-gray-400")}>
                      {c.date ? Number(c.date.slice(-2)) : ""}
                    </div>
                    {dayEvents.length > 0 && (
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-violet-50 border border-violet-100 text-violet-700">
                        {dayEvents.length}
                      </span>
                    )}
                  </div>

                  <div className="mt-2 space-y-1">
                    {dayEvents.slice(0, 2).map((e) => (
                      <div key={e.id} className="text-[11px] text-gray-700 truncate">
                        {e.time ? `${e.time} ` : ""}{e.title}
                      </div>
                    ))}
                    {dayEvents.length > 2 && (
                      <div className="text-[10px] text-gray-400">+{dayEvents.length - 2} more</div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          <div className="mt-4 grid grid-cols-1 lg:grid-cols-2 gap-3">
            <div className="p-3 rounded-xl bg-gray-50 border border-gray-100">
              <div className="text-xs font-semibold text-gray-900">다가오는 일정(검색 반영)</div>
              <div className="mt-2 space-y-2">
                {filteredEvents
                  .slice()
                  .sort((a, b) => (a.date + (a.time || "")).localeCompare(b.date + (b.time || "")))
                  .slice(0, 8)
                  .map((e) => (
                    <div key={e.id} className="p-2 rounded-xl bg-white border border-gray-100 flex items-center justify-between gap-2">
                      <div className="min-w-0">
                        <div className="text-sm font-semibold text-gray-900 truncate">{e.title}</div>
                        <div className="text-[11px] text-gray-500">{e.date} {e.time || ""} · {e.tag || "기타"}</div>
                      </div>
                    </div>
                  ))}
                {filteredEvents.length === 0 && <div className="text-sm text-gray-500 py-4">일정이 없습니다.</div>}
              </div>
            </div>

            <div className="p-3 rounded-xl bg-gray-50 border border-gray-100">
              <div className="text-xs font-semibold text-gray-900">운영 캘린더에 보통 넣는 것(추천)</div>
              <ul className="mt-2 text-[12px] text-gray-700 space-y-1 list-disc pl-5">
                <li>정산 배치/점검 시간</li>
                <li>DB/Redis/MQ 유지보수</li>
                <li>CS 피크 예상일(프로모션)</li>
                <li>약관/정책 변경 예정</li>
              </ul>
            </div>
          </div>

          {/* Event Modal */}
          {eventModalOpen && (
            <div className="fixed inset-0 z-50 bg-black/30 flex items-center justify-center p-4">
              <div className="w-full max-w-[520px] bg-white rounded-2xl border border-gray-100 shadow-lg p-4">
                <div className="flex items-center justify-between">
                  <div className="text-sm font-bold text-gray-900">일정 추가</div>
                  <button
                    onClick={() => setEventModalOpen(false)}
                    className="px-2 py-2 rounded-xl border border-gray-200 hover:bg-gray-50"
                  >
                    <XCircle className="w-4 h-4" />
                  </button>
                </div>

                <div className="mt-3 grid grid-cols-1 md:grid-cols-2 gap-2">
                  <div>
                    <div className="text-[11px] text-gray-500 mb-1">날짜</div>
                    <input
                      type="date"
                      value={eventDraft.date}
                      onChange={(e) => setEventDraft((d) => ({ ...d, date: e.target.value }))}
                      className="w-full px-3 py-2 rounded-xl border border-gray-200 text-sm"
                    />
                  </div>
                  <div>
                    <div className="text-[11px] text-gray-500 mb-1">시간</div>
                    <input
                      type="time"
                      value={eventDraft.time}
                      onChange={(e) => setEventDraft((d) => ({ ...d, time: e.target.value }))}
                      className="w-full px-3 py-2 rounded-xl border border-gray-200 text-sm"
                    />
                  </div>

                  <div className="md:col-span-2">
                    <div className="text-[11px] text-gray-500 mb-1">제목</div>
                    <input
                      value={eventDraft.title}
                      onChange={(e) => setEventDraft((d) => ({ ...d, title: e.target.value }))}
                      placeholder="예) 운영: 신고 처리 회의"
                      className="w-full px-3 py-2 rounded-xl border border-gray-200 text-sm"
                    />
                  </div>

                  <div className="md:col-span-2">
                    <div className="text-[11px] text-gray-500 mb-1">태그</div>
                    <select
                      value={eventDraft.tag}
                      onChange={(e) => setEventDraft((d) => ({ ...d, tag: e.target.value as CalendarEventRow["tag"] }))}
                      className="w-full px-3 py-2 rounded-xl border border-gray-200 text-sm bg-white"
                    >
                      <option value="운영">운영</option>
                      <option value="장애">장애</option>
                      <option value="정산">정산</option>
                      <option value="점검">점검</option>
                      <option value="기타">기타</option>
                    </select>
                  </div>
                </div>

                <div className="mt-4 flex items-center justify-end gap-2">
                  <button
                    onClick={() => setEventModalOpen(false)}
                    className="px-3 py-2 rounded-xl border border-gray-200 hover:bg-gray-50 text-sm"
                  >
                    취소
                  </button>
                  <button
                    onClick={addEvent}
                    className="px-3 py-2 rounded-xl bg-violet-600 hover:bg-violet-700 text-white text-sm"
                  >
                    저장
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* NOTICES */}
      {tab === "notices" && (
        <div className="grid grid-cols-1 xl:grid-cols-[1fr_420px] gap-4">
          <div className="bg-white border border-gray-100 rounded-2xl p-4 shadow-sm">
            <SectionTitle title="인수인계 / 공지" right={<span className="text-[11px] text-gray-500">검색 반영됨</span>} />

            <div className="space-y-2">
              {filteredNotices
                .slice()
                .sort((a, b) => {
                  if (a.pinned !== b.pinned) return a.pinned ? -1 : 1;
                  return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
                })
                .map((n) => (
                  <div key={n.id} className="p-3 rounded-xl bg-gray-50 border border-gray-100">
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2 min-w-0">
                        {n.pinned && <span className="text-[10px] px-2 py-0.5 rounded-full bg-violet-100 text-violet-700">PIN</span>}
                        {!n.acknowledged && <span className="text-[10px] px-2 py-0.5 rounded-full bg-pink-600 text-white">NEW</span>}
                        <div className="text-sm font-semibold text-gray-900 truncate">{n.title}</div>
                      </div>
                      <div className="text-[11px] text-gray-400">{formatKST(n.createdAt)}</div>
                    </div>

                    <div className="mt-2 text-sm text-gray-800 whitespace-pre-wrap break-words">{n.body}</div>

                    <div className="mt-2 flex items-center justify-between">
                      <div className="text-[11px] text-gray-500">by {n.author}</div>
                      <div className="flex items-center gap-2">
                        {!n.acknowledged ? (
                          <button
                            onClick={() => markNoticeAck(n.id)}
                            className="px-3 py-2 rounded-xl bg-violet-600 hover:bg-violet-700 text-white text-sm"
                          >
                            확인
                          </button>
                        ) : (
                          <span className="text-[11px] text-green-600 flex items-center gap-1">
                            <CheckCircle2 className="w-4 h-4" />
                            확인됨
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                ))}

              {filteredNotices.length === 0 && <div className="py-10 text-center text-gray-500">공지 검색 결과가 없습니다.</div>}
            </div>
          </div>

          <div className="bg-white border border-gray-100 rounded-2xl p-4 shadow-sm">
            <SectionTitle title="공지 작성(관리자 인수인계)" />

            <div className="space-y-2">
              <div>
                <div className="text-[11px] text-gray-500 mb-1">제목</div>
                <input
                  ref={noticeTitleRef}
                  className="w-full px-3 py-2 rounded-xl border border-gray-200 text-sm"
                  placeholder="예) 장애 대응 가이드 / 신고 처리 기준"
                />
              </div>

              <div>
                <div className="text-[11px] text-gray-500 mb-1">내용</div>
                <textarea
                  ref={noticeBodyRef}
                  className="w-full px-3 py-2 rounded-xl border border-gray-200 text-sm min-h-[160px]"
                  placeholder="인수인계 포인트, 체크리스트, 링크 등을 적어두세요."
                />
              </div>

              <button
                onClick={submitNotice}
                className="w-full px-3 py-2 rounded-xl bg-violet-600 hover:bg-violet-700 text-white text-sm"
              >
                등록
              </button>

              <div className="p-3 rounded-xl bg-gray-50 border border-gray-100">
                <div className="text-xs font-semibold text-gray-900">관리자 페이지에 보통 추가하는 공지 기능(추천)</div>
                <ul className="mt-2 text-[12px] text-gray-700 space-y-1 list-disc pl-5">
                  <li>공지 템플릿(장애/정산/정책 변경)</li>
                  <li>확인자 목록(누가 읽었는지)</li>
                  <li>링크 첨부(런북/대시보드/로그)</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  </div>
</div>


);
};

export default AuctionAdminDashboard;