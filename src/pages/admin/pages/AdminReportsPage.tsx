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
type ReportMode = "USER" | "PRODUCT";

type UserGroupRow = {
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

type ProductGroupRow = {
  productId: number;
  productName?: string | null;
  category: ReportCategory;
  pendingCount: number;
  acceptedCount: number;
  rejectedCount: number;
  blocked: boolean;
  blockedAt?: string | null;
  blockedReason?: string | null;
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

function asNum(v: any, def = 0): number {
  const n = Number(v);
  return Number.isFinite(n) ? n : def;
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

function categoryLabel(c: ReportCategory) {
  switch (c) {
    case "SPAM":
      return "스팸";
    case "AD":
      return "광고";
    case "ABUSE":
      return "욕설/비방";
    case "HATE":
      return "혐오";
    case "SCAM":
      return "사기";
    case "OTHER":
      return "기타";
    default:
      return String(c);
  }
}

function normalizeUserGroup(x: any): UserGroupRow {
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

function normalizeProductGroup(x: any): ProductGroupRow {
  return {
    productId: asNum(x.productId, 0),
    productName: x.productName ?? null,
    category: (x.category ?? "OTHER") as ReportCategory,
    pendingCount: asNum(x.pendingCount, 0),
    acceptedCount: asNum(x.acceptedCount, 0),
    rejectedCount: asNum(x.rejectedCount, 0),
    blocked: Boolean(x.blocked),
    blockedAt: x.blockedAt ?? null,
    blockedReason: x.blockedReason ?? null,
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
  if (st === "PENDING") {
    return { label: "접수", cls: "bg-yellow-50 text-yellow-800 border-yellow-200" };
  }
  if (st === "ACCEPTED") {
    return { label: "승인", cls: "bg-green-50 text-green-700 border-green-200" };
  }
  return { label: "기각", cls: "bg-gray-50 text-gray-700 border-gray-200" };
}

function userStateChip(g: UserGroupRow) {
  const now = Date.now();
  const suspended = g.suspendedUntil && new Date(g.suspendedUntil).getTime() > now;
  if (suspended) return { label: "정지", cls: "bg-red-50 text-red-700 border-red-200" };
  if (g.viewOnly) {
    return {
      label: "제한",
      cls: "bg-[rgb(118_90_255)]/10 text-[rgb(118_90_255)] border-[rgb(118_90_255)]/20",
    };
  }
  return { label: "정상", cls: "bg-gray-50 text-gray-700 border-gray-200" };
}

function productStateChip(g: ProductGroupRow) {
  if (g.blocked) return { label: "차단", cls: "bg-red-50 text-red-700 border-red-200" };
  return { label: "정상", cls: "bg-gray-50 text-gray-700 border-gray-200" };
}

const controlBase =
  "h-9 px-3 rounded-xl border border-gray-200 bg-white text-sm text-gray-800 outline-none focus:ring-2 focus:ring-[rgb(118_90_255)]/25";
const miniChipBase =
  "inline-flex items-center gap-1 px-2 py-0.5 rounded-full border text-[11px] leading-none";

const AdminReportsPage: React.FC = () => {
  const { query } = useAdminStore();

  const [mode, setMode] = useState<ReportMode>("USER");

  const [userGroups, setUserGroups] = useState<UserGroupRow[]>([]);
  const [productGroups, setProductGroups] = useState<ProductGroupRow[]>([]);
  const [loadingGroups, setLoadingGroups] = useState(false);

  const [statusFilter, setStatusFilter] = useState<ReportStatus | "ALL">("ALL");
  const [categoryFilter, setCategoryFilter] = useState<ReportCategory | "ALL">("ALL");
  const [minPending, setMinPending] = useState<number>(0);

  const [selectedKey, setSelectedKey] = useState("");
  const [adminContent, setAdminContent] = useState("");
  const [suspendDays, setSuspendDays] = useState(0);

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

  const selectedUser = useMemo(() => {
    if (mode !== "USER") return null;
    return userGroups.find((g) => `USER:${g.targetUserId}:${g.category}` === selectedKey) ?? null;
  }, [mode, selectedKey, userGroups]);

  const selectedProduct = useMemo(() => {
    if (mode !== "PRODUCT") return null;
    return productGroups.find((g) => `PRODUCT:${g.productId}:${g.category}` === selectedKey) ?? null;
  }, [mode, selectedKey, productGroups]);

  const fetchUserGroups = async () => {
    const sp = new URLSearchParams();
    if (categoryFilter !== "ALL") sp.set("category", categoryFilter);
    if (statusFilter !== "ALL") sp.set("status", statusFilter);
    if (minPending > 0) sp.set("minPending", String(minPending));

    const raw = await request<CommonResDto<any>>(`/report/admin/groups?${sp.toString()}`);
    const list = unwrap<any>(raw);
    return Array.isArray(list) ? list.map(normalizeUserGroup) : [];
  };

  const fetchProductGroups = async () => {
    const sp = new URLSearchParams();
    if (categoryFilter !== "ALL") sp.set("category", categoryFilter);
    if (statusFilter !== "ALL") sp.set("status", statusFilter);
    if (minPending > 0) sp.set("minPending", String(minPending));

    const raw = await request<CommonResDto<any>>(`/report/product/admin/groups?${sp.toString()}`);
    const list = unwrap<any>(raw);
    return Array.isArray(list) ? list.map(normalizeProductGroup) : [];
  };

  const fetchGroups = async () => {
    setLoadingGroups(true);
    try {
      if (mode === "USER") {
        const rows = await fetchUserGroups();
        setUserGroups(rows);
        if (rows.length > 0) {
          const stillExists = rows.some((g) => `USER:${g.targetUserId}:${g.category}` === selectedKey);
          if (!stillExists) {
            setSelectedKey(`USER:${rows[0].targetUserId}:${rows[0].category}`);
          }
        } else {
          setSelectedKey("");
        }
      } else {
        const rows = await fetchProductGroups();
        setProductGroups(rows);
        if (rows.length > 0) {
          const stillExists = rows.some((g) => `PRODUCT:${g.productId}:${g.category}` === selectedKey);
          if (!stillExists) {
            setSelectedKey(`PRODUCT:${rows[0].productId}:${rows[0].category}`);
          }
        } else {
          setSelectedKey("");
        }
      }
    } catch (e) {
      console.error(e);
      if (mode === "USER") setUserGroups([]);
      else setProductGroups([]);
      setSelectedKey("");
    } finally {
      setLoadingGroups(false);
    }
  };

  const fetchDetail = async (page: number) => {
    setLoadingDetail(true);
    try {
      if (mode === "USER" && selectedUser) {
        const raw = await request<CommonResDto<any>>(
          `/report/admin/groups/${selectedUser.targetUserId}/${selectedUser.category}?page=${page}&size=${detailSize}`,
        );
        const res = unwrap<any>(raw);
        const content = Array.isArray(res?.content) ? res.content.map(normalizeReportItem) : [];
        setDetail({
          content,
          totalPages: asNum(res?.totalPages, 1),
          totalElements: asNum(res?.totalElements, content.length),
          number: asNum(res?.number, page),
          size: asNum(res?.size, detailSize),
        });
        setDetailPage(asNum(res?.number, page));
      } else if (mode === "PRODUCT" && selectedProduct) {
        const raw = await request<CommonResDto<any>>(
          `/report/product/admin/groups/${selectedProduct.productId}/${selectedProduct.category}?page=${page}&size=${detailSize}`,
        );
        const res = unwrap<any>(raw);
        const content = Array.isArray(res?.content) ? res.content.map(normalizeReportItem) : [];
        setDetail({
          content,
          totalPages: asNum(res?.totalPages, 1),
          totalElements: asNum(res?.totalElements, content.length),
          number: asNum(res?.number, page),
          size: asNum(res?.size, detailSize),
        });
        setDetailPage(asNum(res?.number, page));
      } else {
        setDetail({
          content: [],
          totalPages: 1,
          totalElements: 0,
          number: 0,
          size: detailSize,
        });
      }
    } catch (e) {
      console.error(e);
      setDetail({
        content: [],
        totalPages: 1,
        totalElements: 0,
        number: page,
        size: detailSize,
      });
    } finally {
      setLoadingDetail(false);
    }
  };

  const fetchBlocked = async () => {
    setLoadingBlocked(true);
    try {
      const raw = await request<CommonResDto<any>>(`/report/product/admin/blocked`);
      const list = unwrap<any>(raw);
      setBlocked(Array.isArray(list) ? list.map(normalizeBlockedProduct) : []);
    } catch (e) {
      console.error(e);
      setBlocked([]);
    } finally {
      setLoadingBlocked(false);
    }
  };

  useEffect(() => {
    setSelectedKey("");
    setAdminContent("");
    setSuspendDays(0);
    setDetailPage(0);
    void fetchGroups();
    void fetchBlocked();
  }, [mode, statusFilter, categoryFilter, minPending]);

  useEffect(() => {
    setAdminContent("");
    setSuspendDays(0);
    setDetailPage(0);
    void fetchDetail(0);
  }, [selectedKey, mode]);

  const filteredUserGroups = useMemo(() => {
    const q = query.trim().toLowerCase();
    const rows = !q
      ? userGroups
      : userGroups.filter((g) => {
          const name = `${g.targetName ?? ""}`.toLowerCase();
          const nick = `${g.targetNickname ?? ""}`.toLowerCase();
          const id = String(g.targetUserId);
          return name.includes(q) || nick.includes(q) || id.includes(q) || g.category.toLowerCase().includes(q);
        });

    return [...rows].sort((a, b) => {
      if (b.pendingCount !== a.pendingCount) return b.pendingCount - a.pendingCount;
      return new Date(b.lastReportedAt ?? 0).getTime() - new Date(a.lastReportedAt ?? 0).getTime();
    });
  }, [userGroups, query]);

  const filteredProductGroups = useMemo(() => {
    const q = query.trim().toLowerCase();
    const rows = !q
      ? productGroups
      : productGroups.filter((g) => {
          const name = `${g.productName ?? ""}`.toLowerCase();
          const id = String(g.productId);
          return name.includes(q) || id.includes(q) || g.category.toLowerCase().includes(q);
        });

    return [...rows].sort((a, b) => {
      if (b.pendingCount !== a.pendingCount) return b.pendingCount - a.pendingCount;
      return new Date(b.lastReportedAt ?? 0).getTime() - new Date(a.lastReportedAt ?? 0).getTime();
    });
  }, [productGroups, query]);

  const visibleGroups = mode === "USER" ? filteredUserGroups : filteredProductGroups;

  const summary = useMemo(() => {
    if (mode === "USER") {
      return {
        totalGroups: filteredUserGroups.length,
        pendingGroups: filteredUserGroups.filter((g) => g.pendingCount > 0).length,
        pendingReports: filteredUserGroups.reduce((acc, cur) => acc + cur.pendingCount, 0),
      };
    }
    return {
      totalGroups: filteredProductGroups.length,
      pendingGroups: filteredProductGroups.filter((g) => g.pendingCount > 0).length,
      pendingReports: filteredProductGroups.reduce((acc, cur) => acc + cur.pendingCount, 0),
    };
  }, [mode, filteredUserGroups, filteredProductGroups]);

  const onResolve = async (accept: boolean) => {
    try {
      if (mode === "USER" && selectedUser) {
        await request<CommonResDto<void>>(`/report/admin/resolve/${selectedUser.targetUserId}/${selectedUser.category}`, {
          method: "POST",
          body: JSON.stringify({
            accept,
            adminContent: adminContent?.trim() ? adminContent.trim() : null,
            suspendDays: accept ? suspendDays : null,
          }),
        });
      } else if (mode === "PRODUCT" && selectedProduct) {
        await request<CommonResDto<void>>(
          `/report/product/admin/resolve/${selectedProduct.productId}/${selectedProduct.category}`,
          {
            method: "POST",
            body: JSON.stringify({
              accept,
              adminContent: adminContent?.trim() ? adminContent.trim() : null,
            }),
          },
        );
      } else {
        return;
      }

      await fetchGroups();
      await fetchDetail(0);
      if (mode === "PRODUCT") await fetchBlocked();
    } catch (e) {
      console.error(e);
      alert("처리에 실패했습니다. 서버 응답을 확인하세요.");
    }
  };

  const onSuspendNow = async () => {
    if (!selectedUser) return;
    const days = window.prompt("정지 일수(days)를 입력하세요", "3");
    if (!days) return;

    try {
      const sp = new URLSearchParams();
      sp.set("targetUserId", String(selectedUser.targetUserId));
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
    if (!selectedUser) return;

    try {
      const sp = new URLSearchParams();
      sp.set("targetUserId", String(selectedUser.targetUserId));
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

  const liftBlockedProduct = async (productId: number) => {
    const reason = window.prompt("해제 사유(선택)", "") ?? "";
    try {
      await request<CommonResDto<void>>(`/report/product/admin/lift`, {
        method: "POST",
        body: JSON.stringify({
          productId,
          reason: reason.trim() ? reason.trim() : null,
          resetCounter: true,
        }),
      });
      await fetchBlocked();
      await fetchGroups();
    } catch (e) {
      console.error(e);
      alert("차단 해제 실패");
    }
  };

  return (
    <div className="grid grid-cols-1 xl:grid-cols-[420px_1fr] gap-4">
      <div className="bg-white border border-gray-100 rounded-2xl p-4 shadow-sm">
        <SectionTitle
          title="신고 그룹"
          sub={mode === "USER" ? "유저 × 카테고리" : "상품 × 카테고리"}
          right={
            <button
              onClick={() => {
                void fetchGroups();
                if (mode === "PRODUCT") void fetchBlocked();
              }}
              className="h-9 px-3 rounded-xl border border-gray-200 hover:bg-gray-50 text-sm flex items-center gap-2"
              title="새로고침"
            >
              <RefreshCw className="w-4 h-4" />
              <span className="hidden sm:inline">새로고침</span>
            </button>
          }
        />

        <div className="mt-3 flex items-center gap-2">
          <button
            onClick={() => setMode("USER")}
            className={
              "px-3 py-2 rounded-xl border text-sm font-semibold " +
              (mode === "USER"
                ? "bg-[rgb(118_90_255)] text-white border-[rgb(118_90_255)]"
                : "bg-white text-gray-700 border-gray-200 hover:bg-gray-50")
            }
          >
            유저 신고
          </button>

          <button
            onClick={() => setMode("PRODUCT")}
            className={
              "px-3 py-2 rounded-xl border text-sm font-semibold " +
              (mode === "PRODUCT"
                ? "bg-[rgb(118_90_255)] text-white border-[rgb(118_90_255)]"
                : "bg-white text-gray-700 border-gray-200 hover:bg-gray-50")
            }
          >
            상품 신고
          </button>
        </div>

        <div className="mt-3 grid grid-cols-3 gap-2">
          <div className="p-3 rounded-xl bg-gray-50 border border-gray-100">
            <div className="text-[11px] text-gray-500">그룹 수</div>
            <div className="mt-1 text-lg font-extrabold text-gray-900">{summary.totalGroups}</div>
          </div>
          <div className="p-3 rounded-xl bg-blue-50 border border-blue-100">
            <div className="text-[11px] text-blue-700">미처리 그룹</div>
            <div className="mt-1 text-lg font-extrabold text-blue-900">{summary.pendingGroups}</div>
          </div>
          <div className="p-3 rounded-xl bg-yellow-50 border border-yellow-100">
            <div className="text-[11px] text-yellow-700">미처리 신고</div>
            <div className="mt-1 text-lg font-extrabold text-yellow-900">{summary.pendingReports}</div>
          </div>
        </div>

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

        <div className="mt-3 text-[11px] text-gray-500">
          정렬 기준: 미처리 신고 수 많은 순 → 최근 신고 순
        </div>

        <div className="mt-3 space-y-2 max-h-[720px] overflow-y-auto pr-1">
          {loadingGroups ? (
            <div className="py-10 text-center text-gray-500 text-sm">불러오는 중...</div>
          ) : visibleGroups.length === 0 ? (
            <div className="py-10 text-center text-gray-500 text-sm">표시할 그룹이 없습니다.</div>
          ) : mode === "USER" ? (
            filteredUserGroups.map((g) => {
              const key = `USER:${g.targetUserId}:${g.category}`;
              const active = key === selectedKey;
              const st = userStateChip(g);

              return (
                <button
                  key={key}
                  onClick={() => setSelectedKey(key)}
                  className={
                    "w-full text-left p-3 rounded-xl border transition " +
                    (active
                      ? "bg-[rgb(118_90_255)]/10 border-[rgb(118_90_255)]/20"
                      : "bg-gray-50 border-gray-100 hover:bg-gray-100")
                  }
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <div className="text-sm font-semibold text-gray-900 truncate">
                          {g.targetNickname?.trim()
                            ? g.targetNickname
                            : g.targetName?.trim()
                              ? g.targetName
                              : `유저${g.targetUserId}`}
                        </div>
                        <div className="text-[11px] text-gray-400 shrink-0">#{g.targetUserId}</div>
                      </div>
                      <div className="mt-1 text-[11px] text-gray-500">{kst(g.lastReportedAt)}</div>
                    </div>

                    <div className="shrink-0 flex flex-col items-end gap-2">
                      <span className={miniChipBase + " " + st.cls}>{st.label}</span>
                      <span className={miniChipBase + " bg-white text-gray-700 border-gray-200"}>
                        {categoryLabel(g.category)}
                      </span>
                    </div>
                  </div>

                  <div className="mt-2 flex items-center gap-2 text-[11px] text-gray-600 flex-wrap">
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
          ) : (
            filteredProductGroups.map((g) => {
              const key = `PRODUCT:${g.productId}:${g.category}`;
              const active = key === selectedKey;
              const st = productStateChip(g);

              return (
                <button
                  key={key}
                  onClick={() => setSelectedKey(key)}
                  className={
                    "w-full text-left p-3 rounded-xl border transition " +
                    (active
                      ? "bg-[rgb(118_90_255)]/10 border-[rgb(118_90_255)]/20"
                      : "bg-gray-50 border-gray-100 hover:bg-gray-100")
                  }
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <div className="text-sm font-semibold text-gray-900 truncate">
                          {g.productName?.trim() ? g.productName : `상품${g.productId}`}
                        </div>
                        <div className="text-[11px] text-gray-400 shrink-0">#{g.productId}</div>
                      </div>
                      <div className="mt-1 text-[11px] text-gray-500">{kst(g.lastReportedAt)}</div>
                    </div>

                    <div className="shrink-0 flex flex-col items-end gap-2">
                      <span className={miniChipBase + " " + st.cls}>{st.label}</span>
                      <span className={miniChipBase + " bg-white text-gray-700 border-gray-200"}>
                        {categoryLabel(g.category)}
                      </span>
                    </div>
                  </div>

                  <div className="mt-2 flex items-center gap-2 text-[11px] text-gray-600 flex-wrap">
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

      <div className="space-y-4">
        <div className="bg-white border border-gray-100 rounded-2xl p-4 shadow-sm">
          <SectionTitle
            title={mode === "USER" ? "유저 신고 상세 / 처리" : "상품 신고 상세 / 처리"}
          />

          {mode === "USER" && !selectedUser ? (
            <div className="py-10 text-center text-gray-500 text-sm">그룹을 선택하세요.</div>
          ) : mode === "PRODUCT" && !selectedProduct ? (
            <div className="py-10 text-center text-gray-500 text-sm">그룹을 선택하세요.</div>
          ) : (
            <div className="mt-3 space-y-3">
              {mode === "USER" && selectedUser && (
                <div className="p-3 rounded-xl bg-gray-50 border border-gray-100">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <div className="text-sm font-bold text-gray-900 truncate">
                          {selectedUser.targetNickname?.trim()
                            ? selectedUser.targetNickname
                            : selectedUser.targetName?.trim()
                              ? selectedUser.targetName
                              : `유저${selectedUser.targetUserId}`}
                        </div>
                        <div className="text-[11px] text-gray-400 shrink-0">#{selectedUser.targetUserId}</div>
                      </div>

                      <div className="mt-2 flex flex-wrap items-center gap-2">
                        <span className={miniChipBase + " bg-blue-50 text-blue-700 border-blue-200"}>
                          접수 <b className="font-semibold">{selectedUser.pendingCount}</b>
                        </span>
                        <span className={miniChipBase + " bg-green-50 text-green-700 border-green-200"}>
                          승인 <b className="font-semibold">{selectedUser.acceptedCount}</b>
                        </span>
                        <span className={miniChipBase + " bg-gray-50 text-gray-700 border-gray-200"}>
                          기각 <b className="font-semibold">{selectedUser.rejectedCount}</b>
                        </span>
                      </div>

                      <div className="mt-2 text-[12px] text-gray-700">
                        상태 <b>{userStateChip(selectedUser).label}</b>
                        {selectedUser.suspendedUntil ? (
                          <span className="text-[11px] text-gray-500"> · until {kst(selectedUser.suspendedUntil)}</span>
                        ) : null}
                        <span className="text-[11px] text-gray-500"> · warning {selectedUser.warning}</span>
                      </div>
                    </div>

                    <span className={miniChipBase + " bg-white text-gray-700 border-gray-200 shrink-0"}>
                      {categoryLabel(selectedUser.category)}
                    </span>
                  </div>
                </div>
              )}

              {mode === "PRODUCT" && selectedProduct && (
                <div className="p-3 rounded-xl bg-gray-50 border border-gray-100">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <div className="text-sm font-bold text-gray-900 truncate">
                          {selectedProduct.productName?.trim() ? selectedProduct.productName : `상품${selectedProduct.productId}`}
                        </div>
                        <div className="text-[11px] text-gray-400 shrink-0">#{selectedProduct.productId}</div>
                      </div>

                      <div className="mt-2 flex flex-wrap items-center gap-2">
                        <span className={miniChipBase + " bg-blue-50 text-blue-700 border-blue-200"}>
                          접수 <b className="font-semibold">{selectedProduct.pendingCount}</b>
                        </span>
                        <span className={miniChipBase + " bg-green-50 text-green-700 border-green-200"}>
                          승인 <b className="font-semibold">{selectedProduct.acceptedCount}</b>
                        </span>
                        <span className={miniChipBase + " bg-gray-50 text-gray-700 border-gray-200"}>
                          기각 <b className="font-semibold">{selectedProduct.rejectedCount}</b>
                        </span>
                      </div>

                      <div className="mt-2 text-[12px] text-gray-700">
                        상태 <b>{productStateChip(selectedProduct).label}</b>
                        {selectedProduct.blockedAt ? (
                          <span className="text-[11px] text-gray-500"> · blockedAt {kst(selectedProduct.blockedAt)}</span>
                        ) : null}
                      </div>

                      {selectedProduct.blockedReason ? (
                        <div className="mt-2 text-[12px] text-gray-700 whitespace-pre-wrap break-words">
                          차단 사유: {selectedProduct.blockedReason}
                        </div>
                      ) : null}
                    </div>

                    <span className={miniChipBase + " bg-white text-gray-700 border-gray-200 shrink-0"}>
                      {categoryLabel(selectedProduct.category)}
                    </span>
                  </div>
                </div>
              )}

              <div className="p-3 rounded-xl bg-white border border-gray-100">
                <div className="text-xs font-semibold text-gray-900">조치</div>

                <div
                  className={
                    mode === "USER"
                      ? "mt-2 grid grid-cols-1 lg:grid-cols-[1fr_240px] gap-3"
                      : "mt-2 grid grid-cols-1 lg:grid-cols-[1fr_220px] gap-3"
                  }
                >
                  <div>
                    <div className="text-[11px] text-gray-500 mb-1">운영 메모(adminContent)</div>
                    <textarea
                      value={adminContent}
                      onChange={(e) => setAdminContent(e.target.value)}
                      className="w-full min-h-[110px] px-3 py-2 rounded-xl border border-gray-200 text-sm outline-none focus:ring-2 focus:ring-[rgb(118_90_255)]/25"
                      placeholder={mode === "USER" ? "승인/기각/정지 이유를 작성하세요." : "상품 신고 승인/기각 사유를 작성하세요."}
                    />
                  </div>

                  <div className="space-y-2">
                    {mode === "USER" && (
                      <div>
                        <div className="text-[11px] text-gray-500 mb-1">승인 시 정지일수</div>
                        <input
                          type="number"
                          min={0}
                          value={suspendDays}
                          onChange={(e) => setSuspendDays(asNum(e.target.value, 0))}
                          className={controlBase + " w-full"}
                        />
                        <div className="mt-1 text-[11px] text-gray-500">0이면 경고만 증가</div>
                      </div>
                    )}

                    <button
                      onClick={() => void onResolve(true)}
                      className="h-9 w-full rounded-xl bg-green-600 hover:bg-green-700 text-white text-sm flex items-center justify-center gap-2"
                    >
                      <CheckCircle2 className="w-4 h-4" />
                      승인
                    </button>

                    <button
                      onClick={() => void onResolve(false)}
                      className="h-9 w-full rounded-xl bg-gray-800 hover:bg-gray-900 text-white text-sm flex items-center justify-center gap-2"
                    >
                      <XCircle className="w-4 h-4" />
                      기각
                    </button>

                    {mode === "USER" && (
                      <>
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
                      </>
                    )}

                    {mode === "PRODUCT" && selectedProduct?.blocked && (
                      <button
                        onClick={() => void liftBlockedProduct(selectedProduct.productId)}
                        className="h-9 w-full rounded-xl border border-gray-200 hover:bg-gray-50 text-sm flex items-center justify-center gap-2"
                      >
                        <Unlock className="w-4 h-4" />
                        상품 차단 해제
                      </button>
                    )}
                  </div>
                </div>
              </div>

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

        {mode === "PRODUCT" && (
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
                            <div className="mt-2 text-sm text-gray-800 whitespace-pre-wrap break-words">
                              {p.blockedReason}
                            </div>
                          ) : null}
                        </div>

                        <button
                          onClick={() => void liftBlockedProduct(p.productId)}
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
        )}
      </div>
    </div>
  );
};

export default AdminReportsPage;