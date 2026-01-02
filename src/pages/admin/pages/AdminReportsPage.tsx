import React, { useEffect, useMemo, useState } from "react";
import {
  RefreshCw,
  CheckCircle2,
  XCircle,
  Ban,
  Unlock,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { useAdminStore } from "../AdminContext";
import { SectionTitle } from "../components/AdminUi";

type ReportCategory = "SPAM" | "AD" | "ABUSE" | "HATE" | "SCAM" | "OTHER";
type ReportStatus = "PENDING" | "ACCEPTED" | "REJECTED";

type GroupRow = {
  targetUserId: number;
  targetName?: string | null;
  targetNickname?: string | null;
  category: ReportCategory;
  pendingCount: number;
  acceptedCount: number;
  rejectedCount: number;
  viewOnly: boolean;
  suspendedUntil?: string | null;
  warning: number;
  lastReportedAt?: string | null;
};

type ReportItem = {
  id: number;
  status: ReportStatus;
  content?: string | null;
  createdAt?: string | null;
  reporterName?: string | null;
};

type PageRes<T> = {
  content: T[];
  totalPages: number;
  totalElements: number;
  number: number;
  size: number;
};

type BlockedProduct = {
  productId: number;
  productName: string;
  reportCount: number;
  blockedAt?: string | null;
  blockedReason?: string | null;
};

const BASE = import.meta.env.VITE_API_BASE as string | undefined;

function getToken(): string | null {
  return localStorage.getItem("accessToken");
}

type CommonResDto<T> = {
  status_code?: number;
  status_message?: string;
  result?: T;
  statusCode?: number;
  statusMessage?: string;
};

type GroupState = "NORMAL" | "VIEW_ONLY" | "SUSPENDED";

function categoryLabel(c: ReportCategory) {
  switch (c) {
    case "SPAM": return "스팸";
    case "AD": return "광고";
    case "ABUSE": return "욕설/비방";
    case "HATE": return "혐오";
    case "SCAM": return "사기";
    case "OTHER": return "기타";
    default: return String(c);
  }
}

function statusLabel(s: ReportStatus) {
  switch (s) {
    case "PENDING": return "접수";
    case "ACCEPTED": return "승인";
    case "REJECTED": return "기각";
    default: return String(s);
  }
}

function groupStateText(state: GroupState) {
  switch (state) {
    case "SUSPENDED": return "정지";
    case "VIEW_ONLY": return "제한";
    case "NORMAL": return "정상";
    default: return "정상";
  }
}

function unwrap<T>(raw: CommonResDto<T> | T): T {
  if (raw && typeof raw === "object" && "result" in (raw as any)) {
    return (raw as CommonResDto<T>).result as T;
  }
  return raw as T;
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
    throw new Error(text?.trim() ? text : `HTTP ${res.status}`);
  }
  if (res.status === 204) return undefined as unknown as T;
  return (await res.json()) as T;
}

function kst(iso?: string | null): string {
  if (!iso) return "-";
  const d = new Date(iso);
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  const hh = String(d.getHours()).padStart(2, "0");
  const mi = String(d.getMinutes()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd} ${hh}:${mi}`;
}

function asNum(v: any, def = 0): number {
  const n = Number(v);
  return Number.isFinite(n) ? n : def;
}

function normalizeGroup(x: any): GroupRow {
  return {
    targetUserId: asNum(x.targetUserId, 0),
    targetName: x.targetName ?? null,
    targetNickname: x.targetNickname ?? null,
    category: (x.category ?? "OTHER") as ReportCategory,
    pendingCount: asNum(x.pendingCount, 0),
    acceptedCount: asNum(x.acceptedCount, 0),
    rejectedCount: asNum(x.rejectedCount, 0),
    viewOnly: Boolean(x.viewOnly),
    suspendedUntil: x.suspendedUntil ?? null,
    warning: asNum(x.warning, 0),
    lastReportedAt: x.lastReportedAt ?? null,
  };
}

function normalizeReportItem(x: any): ReportItem {
  const reporterName =
    x?.reporter?.nickname ??
    x?.reporter?.name ??
    x?.reporterName ??
    x?.reporterNickname ??
    null;

  return {
    id: asNum(x.id, 0),
    status: (x.status ?? "PENDING") as ReportStatus,
    content: x.content ?? null,
    createdAt: x.createdAt ?? null,
    reporterName,
  };
}

function normalizeBlockedProduct(x: any): BlockedProduct {
  return {
    productId: asNum(x.productId, 0),
    productName: String(x.productName ?? ""),
    reportCount: asNum(x.reportCount, 0),
    blockedAt: x.blockedAt ?? null,
    blockedReason: x.blockedReason ?? null,
  };
}

function statusChip(st: ReportStatus) {
  if (st === "PENDING")   return { label: "접수", cls: "bg-yellow-50 text-yellow-800 border-yellow-200" };
  if (st === "ACCEPTED")  return { label: "승인", cls: "bg-green-50 text-green-700 border-green-200" };
  return { label: "기각", cls: "bg-gray-50 text-gray-700 border-gray-200" };
}

function groupStateLabel(g: GroupRow) {
  const now = Date.now();
  const suspended = g.suspendedUntil && new Date(g.suspendedUntil).getTime() > now;

  if (suspended) return { label: "정지", cls: "bg-red-50 text-red-700 border-red-200" };
  if (g.viewOnly) return { label: "제한", cls: "bg-violet-50 text-violet-700 border-violet-200" };
  return { label: "정상", cls: "bg-gray-50 text-gray-700 border-gray-200" };
}

const controlBase =
  "h-9 px-3 rounded-xl border border-gray-200 bg-white text-sm text-gray-800 outline-none focus:ring-2 focus:ring-violet-200";
const miniChipBase =
  "inline-flex items-center gap-1 px-2 py-0.5 rounded-full border text-[11px] leading-none";

const AdminReportsPage: React.FC = () => {
  const { query } = useAdminStore();

  const [groups, setGroups] = useState<GroupRow[]>([]);
  const [loadingGroups, setLoadingGroups] = useState(false);

  const [statusFilter, setStatusFilter] = useState<ReportStatus | "ALL">("ALL");
  const [categoryFilter, setCategoryFilter] = useState<ReportCategory | "ALL">("ALL");
  const [minPending, setMinPending] = useState<number>(0);

  const [selectedKey, setSelectedKey] = useState<string>("");
  const selected = useMemo(() => {
    const found = groups.find((g) => `${g.targetUserId}:${g.category}` === selectedKey);
    return found ?? null;
  }, [groups, selectedKey]);

  const [adminContent, setAdminContent] = useState<string>("");
  const [suspendDays, setSuspendDays] = useState<number>(0);

  const [detailPage, setDetailPage] = useState(0);
  const [detailSize] = useState(10);
  const [detail, setDetail] = useState<PageRes<ReportItem>>({
    content: [],
    totalPages: 1,
    totalElements: 0,
    number: 0,
    size: detailSize,
  });
  const [loadingDetail, setLoadingDetail] = useState(false);

  const [blocked, setBlocked] = useState<BlockedProduct[]>([]);
  const [loadingBlocked, setLoadingBlocked] = useState(false);

  const fetchGroups = async () => {
    setLoadingGroups(true);
    try {
      const sp = new URLSearchParams();
      if (categoryFilter !== "ALL") sp.set("category", categoryFilter);
      if (statusFilter !== "ALL") sp.set("status", statusFilter);
      if (minPending > 0) sp.set("minPending", String(minPending));

      const raw = await request<CommonResDto<any>>(`/report/admin/groups?${sp.toString()}`);
      const list = unwrap<any>(raw);
      const normalized = Array.isArray(list) ? list.map(normalizeGroup) : [];

      setGroups(normalized);

      // 선택 자동 세팅(최초/필터 변경 시)
      if (!selectedKey && normalized[0]) {
        setSelectedKey(`${normalized[0].targetUserId}:${normalized[0].category}`);
      } else {
        // 기존 선택이 필터로 사라졌으면 첫 항목으로
        const still = normalized.some((g) => `${g.targetUserId}:${g.category}` === selectedKey);
        if (!still && normalized[0]) setSelectedKey(`${normalized[0].targetUserId}:${normalized[0].category}`);
      }
    } catch (e) {
      console.error(e);
      setGroups([]);
    } finally {
      setLoadingGroups(false);
    }
  };

  const fetchDetail = async (pg: number) => {
    if (!selected) return;
    setLoadingDetail(true);
    try {
      const raw = await request<CommonResDto<any>>(
        `/report/admin/groups/${selected.targetUserId}/${selected.category}?page=${pg}&size=${detailSize}`
      );
      const page = unwrap<any>(raw);

      const content = Array.isArray(page?.content) ? page.content.map(normalizeReportItem) : [];
      setDetail({
        content,
        totalPages: asNum(page?.totalPages, 1),
        totalElements: asNum(page?.totalElements, content.length),
        number: asNum(page?.number, pg),
        size: asNum(page?.size, detailSize),
      });
      setDetailPage(asNum(page?.number, pg));
    } catch (e) {
      console.error(e);
      setDetail({ content: [], totalPages: 1, totalElements: 0, number: pg, size: detailSize });
    } finally {
      setLoadingDetail(false);
    }
  };

  const fetchBlocked = async () => {
    setLoadingBlocked(true);
    try {
      const raw = await request<CommonResDto<any>>(`/report/product/admin/blocked`);
      const list = unwrap<any>(raw);
      const normalized = Array.isArray(list) ? list.map(normalizeBlockedProduct) : [];
      setBlocked(normalized);
    } catch (e) {
      console.error(e);
      setBlocked([]);
    } finally {
      setLoadingBlocked(false);
    }
  };

  useEffect(() => {
    void fetchGroups();
    void fetchBlocked();
    // 필터 변경 시 상세 페이지는 0으로
    setDetailPage(0);
  }, [statusFilter, categoryFilter, minPending]);

  useEffect(() => {
    // 선택 바뀌면 상세 다시 로드
    setAdminContent("");
    setSuspendDays(0);
    setDetailPage(0);
    void fetchDetail(0);
  }, [selectedKey]);

  // 상단 검색(query)은 그룹 목록에서만 클라이언트 필터링 (백엔드에 q 없음)
  const filteredGroups = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return groups;

    return groups.filter((g) => {
      const name = `${g.targetName ?? ""}`.toLowerCase();
      const nick = `${g.targetNickname ?? ""}`.toLowerCase();
      const id = String(g.targetUserId);
      return name.includes(q) || nick.includes(q) || id.includes(q) || g.category.toLowerCase().includes(q);
    });
  }, [groups, query]);

  const onResolve = async (accept: boolean) => {
    if (!selected) return;

    try {
      await request<CommonResDto<void>>(
        `/report/admin/resolve/${selected.targetUserId}/${selected.category}`,
        {
          method: "POST",
          body: JSON.stringify({
            accept,
            adminContent: adminContent?.trim() ? adminContent.trim() : null,
            suspendDays: accept ? suspendDays : null,
          }),
        }
      );

      await fetchGroups();
      await fetchDetail(0);
    } catch (e) {
      console.error(e);
      alert("처리에 실패했습니다. 서버 응답을 확인하세요.");
    }
  };

  const onSuspendNow = async () => {
    if (!selected) return;
    const days = window.prompt("정지 일수(days)를 입력하세요", "3");
    if (!days) return;

    try {
      const sp = new URLSearchParams();
      sp.set("targetUserId", String(selected.targetUserId));
      sp.set("days", String(Number(days)));
      if (adminContent?.trim()) sp.set("reason", adminContent.trim());

      await request<CommonResDto<void>>(`/report/admin/suspend?${sp.toString()}`, { method: "POST" });
      await fetchGroups();
      await fetchDetail(0);
    } catch (e) {
      console.error(e);
      alert("즉시 정지에 실패했습니다.");
    }
  };

  const onLiftAll = async () => {
    if (!selected) return;

    try {
      const sp = new URLSearchParams();
      sp.set("targetUserId", String(selected.targetUserId));
      if (adminContent?.trim()) sp.set("reason", adminContent.trim());

      await request<CommonResDto<void>>(`/report/admin/lift?${sp.toString()}`, { method: "POST" });
      await fetchGroups();
      await fetchDetail(0);
    } catch (e) {
      console.error(e);
      alert("제재 해제에 실패했습니다.");
    }
  };

  const goDetailPage = (pg: number) => {
    const next = Math.max(0, Math.min(pg, Math.max(1, detail.totalPages) - 1));
    void fetchDetail(next);
  };

  return (
    <div className="grid grid-cols-1 xl:grid-cols-[420px_1fr] gap-4">
      {/* LEFT */}
      <div className="bg-white border border-gray-100 rounded-2xl p-4 shadow-sm">
        <SectionTitle
          title="신고 그룹"
          sub = "유저 × 카테고리 단위로 묶어서 처리"
          right={
            <button
              onClick={() => {
                void fetchGroups();
                void fetchBlocked();
              }}
              className="h-9 px-3 rounded-xl border border-gray-200 hover:bg-gray-50 text-sm flex items-center gap-2"
              title="새로고침"
            >
              <RefreshCw className="w-4 h-4" />
              <span className="hidden sm:inline">새로고침</span>
            </button>
          }
        />

        {/* filters */}
        <div className="mt-3 flex flex-wrap items-center gap-2">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as any)}
            className={controlBase + " w-[140px] text-[13px]"}
          >
            <option value="ALL">상태 전체</option>
            <option value="PENDING">접수</option>
            <option value="ACCEPTED">승인</option>
            <option value="REJECTED">기각</option>
          </select>

          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value as any)}
            className={controlBase + " w-[160px] text-[13px]"}
          >
            <option value="ALL">카테고리 전체</option>
            <option value="SPAM">SPAM</option>
            <option value="AD">AD</option>
            <option value="ABUSE">ABUSE</option>
            <option value="HATE">HATE</option>
            <option value="SCAM">SCAM</option>
            <option value="OTHER">OTHER</option>
          </select>

          <div className="flex items-center gap-2">
            <div className="text-[11px] text-gray-500 whitespace-nowrap">minPending</div>
            <input
              type="number"
              min={0}
              value={minPending}
              onChange={(e) => setMinPending(asNum(e.target.value, 0))}
              className={controlBase + " w-[90px] px-2 text-[13px]"}
            />
          </div>
        </div>

        {/* list */}
        <div className="mt-3 space-y-2">
          {loadingGroups ? (
            <div className="py-10 text-center text-gray-500 text-sm">불러오는 중...</div>
          ) : filteredGroups.length === 0 ? (
            <div className="py-10 text-center text-gray-500 text-sm">표시할 그룹이 없습니다.</div>
          ) : (
            filteredGroups.map((g) => {
              const key = `${g.targetUserId}:${g.category}`;
              const active = key === selectedKey;
              const st = groupStateLabel(g);

              return (
                <button
                  key={key}
                  onClick={() => setSelectedKey(key)}
                  className={
                    "w-full text-left p-3 rounded-xl border transition " +
                    (active ? "bg-violet-50 border-violet-200" : "bg-gray-50 border-gray-100 hover:bg-gray-100")
                  }
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <div className="text-sm font-semibold text-gray-900 truncate">
                          {g.targetNickname?.trim() ? g.targetNickname : g.targetName?.trim() ? g.targetName : `유저${g.targetUserId}`}
                        </div>
                        <div className="text-[11px] text-gray-400 shrink-0">#{g.targetUserId}</div>
                      </div>
                      <div className="mt-1 text-[11px] text-gray-500">
                        {kst(g.lastReportedAt)}
                      </div>
                    </div>

                    <div className="shrink-0 flex flex-col items-end gap-2">
                      <span className={miniChipBase + " " + st.cls}>{st.label}</span>
                      <span className={miniChipBase + " bg-white text-gray-700 border-gray-200"}>{categoryLabel(g.category)}</span>
                    </div>
                  </div>

                  <div className="mt-2 flex items-center gap-2 text-[11px] text-gray-600">
                    <span className={miniChipBase + " bg-blue-50 text-blue-700 border-blue-200"}>
                      접수 <b className="font-semibold">{g.pendingCount}</b>
                    </span>
                    <span className={miniChipBase + " bg-green-50 text-green-700 border-green-200"}>
                      승인 <b className="font-semibold">{g.acceptedCount}</b>
                    </span>
                    <span className={miniChipBase + " bg-gray-50 text-gray-700 border-gray-200"}>
                      기각 <b className="font-semibold">{g.rejectedCount}</b>
                    </span>
                  </div>
                </button>
              );
            })
          )}
        </div>
      </div>

      {/* RIGHT */}
      <div className="space-y-4">
        <div className="bg-white border border-gray-100 rounded-2xl p-4 shadow-sm">
          <SectionTitle title="신고 상세 / 처리(그룹 단위)" />

          {!selected ? (
            <div className="py-10 text-center text-gray-500 text-sm">그룹을 선택하세요.</div>
          ) : (
            <div className="mt-3 space-y-3">
              {/* summary */}
              <div className="p-3 rounded-xl bg-gray-50 border border-gray-100">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <div className="text-sm font-bold text-gray-900 truncate">
                        {selected.targetNickname?.trim()
                          ? selected.targetNickname
                          : selected.targetName?.trim()
                          ? selected.targetName
                          : `유저${selected.targetUserId}`}
                      </div>
                      <div className="text-[11px] text-gray-400 shrink-0">#{selected.targetUserId}</div>
                    </div>

                    <div className="mt-2 flex flex-wrap items-center gap-2">
                      <span className={miniChipBase + " bg-blue-50 text-blue-700 border-blue-200"}>
                        접수 <b className="font-semibold">{selected.pendingCount}</b>
                      </span>
                      <span className={miniChipBase + " bg-green-50 text-green-700 border-green-200"}>
                        승인 <b className="font-semibold">{selected.acceptedCount}</b>
                      </span>
                      <span className={miniChipBase + " bg-gray-50 text-gray-700 border-gray-200"}>
                        기각 <b className="font-semibold">{selected.rejectedCount}</b>
                      </span>
                      <span className={miniChipBase + " bg-white text-gray-700 border-gray-200"}>
                        {kst(selected.lastReportedAt)}
                      </span>
                    </div>

                    <div className="mt-2 text-[12px] text-gray-700">
                      상태:{" "}
                      <span className={"font-semibold " + groupStateLabel(selected).cls.replace("bg-", "text-").replace("border-", "")}>
                        {groupStateLabel(selected).label}
                      </span>
                      {selected.suspendedUntil ? (
                        <span className="text-[11px] text-gray-500"> · until {kst(selected.suspendedUntil)}</span>
                      ) : null}
                      <span className="text-[11px] text-gray-500"> · warning {selected.warning}</span>
                    </div>
                  </div>

                  <span className={miniChipBase + " bg-white text-gray-700 border-gray-200 shrink-0"}>
                    {categoryLabel(selected.category)}
                  </span>
                </div>
              </div>

              {/* actions */}
              <div className="p-3 rounded-xl bg-white border border-gray-100">
                <div className="text-xs font-semibold text-gray-900">조치</div>

                <div className="mt-2 grid grid-cols-1 lg:grid-cols-[1fr_240px] gap-3">
                  <div>
                    <div className="text-[11px] text-gray-500 mb-1">운영 메모(adminContent)</div>
                    <textarea
                      value={adminContent}
                      onChange={(e) => setAdminContent(e.target.value)}
                      className="w-full min-h-[110px] px-3 py-2 rounded-xl border border-gray-200 text-sm outline-none focus:ring-2 focus:ring-violet-200"
                      placeholder="승인/기각/정지 이유를 작성하시오."
                    />
                  </div>

                  <div className="space-y-2">
                    <div>
                      <div className="text-[11px] text-gray-500 mb-1">승인 시 정지일수(suspendDays)</div>
                      <input
                        type="number"
                        min={0}
                        value={suspendDays}
                        onChange={(e) => setSuspendDays(asNum(e.target.value, 0))}
                        className={controlBase + " w-full"}
                      />
                      <div className="mt-1 text-[11px] text-gray-500">0이면 경고만 증가(정지 없음)</div>
                    </div>

                    <button
                      onClick={() => void onResolve(true)}
                      className="h-9 w-full rounded-xl bg-green-600 hover:bg-green-700 text-white text-sm flex items-center justify-center gap-2"
                    >
                      <CheckCircle2 className="w-4 h-4" />
                      승인(ACCEPT)
                    </button>

                    <button
                      onClick={() => void onResolve(false)}
                      className="h-9 w-full rounded-xl bg-gray-800 hover:bg-gray-900 text-white text-sm flex items-center justify-center gap-2"
                    >
                      <XCircle className="w-4 h-4" />
                      기각(REJECT)
                    </button>

                    <button
                      onClick={() => void onSuspendNow()}
                      className="h-9 w-full rounded-xl border border-gray-200 hover:bg-gray-50 text-sm flex items-center justify-center gap-2"
                    >
                      <Ban className="w-4 h-4" />
                      즉시 정지
                    </button>

                    <button
                      onClick={() => void onLiftAll()}
                      className="h-9 w-full rounded-xl border border-gray-200 hover:bg-gray-50 text-sm flex items-center justify-center gap-2"
                    >
                      <Unlock className="w-4 h-4" />
                      제재 해제
                    </button>
                  </div>
                </div>

                <div className="mt-3 pt-3 border-t border-gray-100 text-[11px] text-gray-500 leading-relaxed">
                  운영 팁: 그룹 단위 승인/기각 시 Redis 카운터 이동 + 사용자 상태(viewOnly/정지/경고)가 같이 반영되도록 설계되어 있어요.
                </div>
              </div>

              {/* detail list */}
              <div className="p-3 rounded-xl bg-white border border-gray-100">
                <div className="flex items-center justify-between gap-2">
                  <div className="text-xs font-semibold text-gray-900">그룹 상세 신고 리스트</div>
                  <button
                    onClick={() => void fetchDetail(detailPage)}
                    className="h-9 px-3 rounded-xl border border-gray-200 hover:bg-gray-50 text-sm flex items-center gap-2"
                  >
                    <RefreshCw className="w-4 h-4" />
                    새로고침
                  </button>
                </div>

                <div className="mt-3 space-y-2">
                  {loadingDetail ? (
                    <div className="py-8 text-center text-gray-500 text-sm">불러오는 중...</div>
                  ) : detail.content.length === 0 ? (
                    <div className="py-8 text-center text-gray-500 text-sm">상세 신고가 없습니다.</div>
                  ) : (
                    detail.content.map((r) => {
                      const st = statusChip(r.status);
                      return (
                        <div key={r.id} className="p-3 rounded-xl bg-gray-50 border border-gray-100">
                          <div className="flex items-start justify-between gap-3">
                            <div className="min-w-0">
                              <div className="flex items-center gap-2">
                                <div className="text-sm font-semibold text-gray-900">#{r.id}</div>
                                <span className={miniChipBase + " " + st.cls}>{st.label}</span>
                              </div>
                              <div className="mt-1 text-[11px] text-gray-500">
                                신고자: {r.reporterName ?? "-"} · 생성 {kst(r.createdAt)}
                              </div>
                            </div>
                          </div>

                          <div className="mt-2 text-sm text-gray-800 whitespace-pre-wrap break-words">
                            {r.content?.trim() ? r.content : "(내용 없음)"}
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>

                <div className="mt-3 flex items-center justify-between text-[11px] text-gray-500">
                  <div>
                    page {detailPage + 1} / {Math.max(1, detail.totalPages)} · total {detail.totalElements}
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => goDetailPage(detailPage - 1)}
                      disabled={detailPage <= 0}
                      className={
                        "h-9 px-3 rounded-xl border text-sm flex items-center gap-2 " +
                        (detailPage <= 0 ? "border-gray-200 text-gray-300" : "border-gray-200 hover:bg-gray-50 text-gray-700")
                      }
                    >
                      <ChevronLeft className="w-4 h-4" />
                      이전
                    </button>
                    <button
                      onClick={() => goDetailPage(detailPage + 1)}
                      disabled={detailPage >= Math.max(1, detail.totalPages) - 1}
                      className={
                        "h-9 px-3 rounded-xl border text-sm flex items-center gap-2 " +
                        (detailPage >= Math.max(1, detail.totalPages) - 1
                          ? "border-gray-200 text-gray-300"
                          : "border-gray-200 hover:bg-gray-50 text-gray-700")
                      }
                    >
                      다음
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* blocked products */}
        <div className="bg-white border border-gray-100 rounded-2xl p-4 shadow-sm">
          <SectionTitle
            title="차단 상품(신고 임계치 초과)"
            right={
              <button
                onClick={() => void fetchBlocked()}
                className="h-9 px-3 rounded-xl border border-gray-200 hover:bg-gray-50 text-sm flex items-center gap-2"
              >
                <RefreshCw className="w-4 h-4" />
                새로고침
              </button>
            }
          />

          <div className="mt-3">
            {loadingBlocked ? (
              <div className="py-10 text-center text-gray-500 text-sm">불러오는 중...</div>
            ) : blocked.length === 0 ? (
              <div className="py-10 text-center text-gray-500 text-sm">차단된 상품이 없습니다.</div>
            ) : (
              <div className="space-y-2">
                {blocked.map((p) => (
                  <div key={p.productId} className="p-3 rounded-xl bg-gray-50 border border-gray-100">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <div className="text-sm font-semibold text-gray-900 truncate">{p.productName}</div>
                        <div className="mt-1 text-[11px] text-gray-500">
                          productId {p.productId} · count {p.reportCount} · blockedAt {kst(p.blockedAt)}
                        </div>
                        {p.blockedReason ? (
                          <div className="mt-2 text-sm text-gray-800 whitespace-pre-wrap break-words">{p.blockedReason}</div>
                        ) : null}
                      </div>

                      <button
                        onClick={async () => {
                          const reason = window.prompt("해제 사유(선택)", "") ?? "";
                          try {
                            await request<CommonResDto<void>>(`/report/product/admin/lift`, {
                              method: "POST",
                              body: JSON.stringify({
                                productId: p.productId,
                                reason: reason.trim() ? reason.trim() : null,
                                resetCounter: true,
                              }),
                            });
                            await fetchBlocked();
                          } catch (e) {
                            console.error(e);
                            alert("차단 해제 실패");
                          }
                        }}
                        className="h-9 px-3 rounded-xl border border-gray-200 hover:bg-gray-50 text-sm shrink-0"
                      >
                        차단 해제
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminReportsPage;
