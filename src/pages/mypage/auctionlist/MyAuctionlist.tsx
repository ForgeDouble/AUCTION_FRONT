import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  Clock,
  Eye,
  Search,
  RefreshCw,
  Grid3X3,
  List as ListIcon,
  ChevronRight,
  XCircle,
} from "lucide-react";

import { useNavigate, useSearchParams } from "react-router-dom";
import type { PageInfo, ProductListDto } from "../MyPageDto";
import RenderPagination from "../components/RenderPagination";
import { useModal } from "@/contexts/ModalContext";
import { handleApiError } from "@/errors/HandleApiError";
import { useAuth } from "@/hooks/useAuth";
import { fetchProductsByUser } from "./MyAuctionlistApi";

type StatusFilter = "ALL" | "READY" | "PROCESSING" | "NOTSELLED" | "SELLED";
type SortKey = "NEWEST" | "ENDING_SOON" | "HIGHEST_BID" | "MOST_BIDS";
type ViewMode = "grid" | "list";

const STATUS_OPTIONS: { value: StatusFilter; label: string }[] = [
  { value: "ALL", label: "전체" },
  { value: "READY", label: "준비중" },
  { value: "PROCESSING", label: "진행중" },
  { value: "NOTSELLED", label: "유찰" },
  { value: "SELLED", label: "낙찰" },
];

const SORT_OPTIONS: { value: SortKey; label: string }[] = [
  { value: "NEWEST", label: "최신순" },
  { value: "ENDING_SOON", label: "마감임박순" },
  { value: "HIGHEST_BID", label: "현재가 높은순" },
  { value: "MOST_BIDS", label: "입찰 많은순" },
];

function statusAccent(status: string) {
  switch (status) {
    case "READY":
      return "bg-blue-400";
    case "PROCESSING":
      return "bg-emerald-400";
    case "NOTSELLED":
      return "bg-zinc-300";
    case "SELLED":
      return "bg-violet-400";
    default:
      return "bg-zinc-300";
  }
}

function priceLabelByStatus(status: string) {
  if (status === "READY") return "시작가";
  if (status === "SELLED") return "낙찰가";
  if (status === "NOTSELLED") return "기준가";
  return "현재가";
}

const SIZE_OPTIONS = [10, 20, 40];

function cn(...xs: Array<string | false | null | undefined>) {
  return xs.filter(Boolean).join(" ");
}

function safeNumber(v: string | null, fallback: number) {
  const n = Number(v);
  return Number.isFinite(n) ? n : fallback;
}

function formatPrice(price: number) {
  return new Intl.NumberFormat("ko-KR").format(price) + "원";
}

function isValidStatus(v: string | null): v is StatusFilter {
  return STATUS_OPTIONS.some((o) => o.value === v);
}

function isValidSort(v: string | null): v is SortKey {
  return SORT_OPTIONS.some((o) => o.value === v);
}

// 프론트 SortKey -> 백엔드 sortBy 매핑
function toApiSort(sort: SortKey) {
  switch (sort) {
    case "HIGHEST_BID":
      return "PRICE_DESC";
    case "MOST_BIDS":
      return "MOST_BIDS";
    case "ENDING_SOON":
      return "ENDING_SOON";
    case "NEWEST":
    default:
      return "NEWEST";
  }
}

function updateURLParams(
  searchParams: URLSearchParams,
  setSearchParams: (p: URLSearchParams) => void,
  params: Record<string, string | number | null | undefined>,
) {
  const next = new URLSearchParams(searchParams);
  Object.entries(params).forEach(([key, value]) => {
    const shouldDelete =
      value === null ||
      value === undefined ||
      value === "" ||
      (typeof value === "number" && !Number.isFinite(value));

    if (shouldDelete) next.delete(key);
    else next.set(key, String(value));
  });
  setSearchParams(next);
}

function getStatusBadge(status: string) {
  switch (status) {
    case "READY":
      return { text: "준비중", chip: "bg-blue-50 text-blue-700 ring-blue-100" };
    case "PROCESSING":
      return {
        text: "진행중",
        chip: "bg-emerald-50 text-emerald-700 ring-emerald-100",
      };
    case "NOTSELLED":
      return { text: "유찰", chip: "bg-zinc-50 text-zinc-600 ring-zinc-100" };
    case "SELLED":
      return {
        text: "낙찰",
        chip: "bg-violet-50 text-violet-700 ring-violet-100",
      };
    default:
      return {
        text: "알 수 없음",
        chip: "bg-zinc-50 text-zinc-600 ring-zinc-100",
      };
  }
}

function parseTime(iso?: string | null) {
  if (!iso) return null;
  const t = new Date(iso).getTime();
  return Number.isFinite(t) ? t : null;
}

function formatDuration(ms: number) {
  if (ms <= 0) return "0분";
  const totalMin = Math.floor(ms / 60000);
  const h = Math.floor(totalMin / 60);
  const m = totalMin % 60;
  if (h > 0) return `${h}시간 ${m}분`;
  return `${m}분`;
}

const PlaceholderImg = () => (
  <div className="w-full h-44 rounded-2xl bg-gradient-to-b from-zinc-50 to-white ring-1 ring-black/5 grid place-items-center">
    <span className="text-zinc-300 text-sm font-semibold">No Image</span>
  </div>
);

function TimePill({
  status,
  auctionEndTime,
  auctionDuration, // 새로 추가: 경매 지속 시간 (분 단위)
}: {
  status: string;
  auctionEndTime?: string | null;
  auctionDuration?: number | null; // 분 단위
}) {
  const now = Date.now();
  const et = parseTime(auctionEndTime);

  if (status === "READY" && et && auctionDuration) {
    // 종료시간에서 경매 지속시간을 빼서 시작시간 계산
    const st = et - auctionDuration * 60 * 1000;
    const left = st - now;
    return (
      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-extrabold bg-blue-50 text-blue-700 ring-1 ring-blue-100">
        <Clock className="w-3.5 h-3.5" />
        {left > 0 ? `시작 ${formatDuration(left)} 전` : "곧 시작"}
      </span>
    );
  }

  if (status === "PROCESSING" && et) {
    const left = et - now;
    const urgent = left > 0 && left <= 10 * 60 * 1000;
    return (
      <span
        className={cn(
          "inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-extrabold ring-1",
          urgent
            ? "bg-rose-50 text-rose-700 ring-rose-100"
            : "bg-emerald-50 text-emerald-700 ring-emerald-100",
        )}
      >
        <Clock className="w-3.5 h-3.5" />
        {left > 0 ? `마감 ${formatDuration(left)} 전` : "마감됨"}
      </span>
    );
  }

  return null;
}

function TinyChip({ children }: { children: React.ReactNode }) {
  return (
    <span className="inline-flex items-center px-2.5 h-8 rounded-full bg-white/70 backdrop-blur ring-1 ring-black/5 text-xs font-bold text-zinc-700">
      {children}
    </span>
  );
}

function ViewToggle({
  mode,
  onChange,
}: {
  mode: ViewMode;
  onChange: (m: ViewMode) => void;
}) {
  return (
    <div className="inline-flex items-center rounded-2xl bg-white/70 ring-1 ring-black/5 p-1">
      <button
        type="button"
        onClick={() => onChange("grid")}
        className={cn(
          "inline-flex items-center gap-2 px-3 h-9 rounded-xl text-sm font-extrabold transition",
          mode === "grid"
            ? "bg-[rgb(118,90,255)] text-white"
            : "text-zinc-700 hover:bg-white",
        )}
        title="그리드"
      >
        <Grid3X3 className="w-4 h-4" />
      </button>
      <button
        type="button"
        onClick={() => onChange("list")}
        className={cn(
          "inline-flex items-center gap-2 px-3 h-9 rounded-xl text-sm font-extrabold transition",
          mode === "list"
            ? "bg-[rgb(118,90,255)] text-white"
            : "text-zinc-700 hover:bg-white",
        )}
        title="리스트"
      >
        <ListIcon className="w-4 h-4" />
      </button>
    </div>
  );
}

const MyAuctionlist = () => {
  const { showLogin } = useModal();
  const { logout } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();

  const [products, setProducts] = useState<ProductListDto[]>([]);
  const [pageInfo, setPageInfo] = useState<PageInfo>({
    totalElements: 0,
    totalPages: 0,
    currentPage: 0,
    size: 10,
  });
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string>("");

  // URL -> applied
  const appliedPage = safeNumber(searchParams.get("page"), 0);

  const appliedSizeRaw = safeNumber(searchParams.get("size"), 10);
  const appliedSize = SIZE_OPTIONS.includes(appliedSizeRaw)
    ? appliedSizeRaw
    : 10;

  const statusRaw = searchParams.get("status");
  const appliedStatus: StatusFilter = isValidStatus(statusRaw)
    ? statusRaw
    : "ALL";

  const sortRaw = searchParams.get("sortBy") ?? searchParams.get("sort");
  const appliedSort: SortKey = isValidSort(sortRaw) ? sortRaw : "NEWEST";

  const appliedSearch = (
    searchParams.get("search") ??
    searchParams.get("q") ??
    ""
  ).trim();

  // view: 기본 grid, list만 URL에 남김
  const appliedView: ViewMode =
    searchParams.get("view") === "list" ? "list" : "grid";

  // 검색 입력은 엔터/버튼으로만 반영
  const [qInput, setQInput] = useState(appliedSearch);
  useEffect(() => setQInput(appliedSearch), [appliedSearch]);

  const loadProductsByUser = useCallback(
    async (
      page: number,
      size: number,
      status: StatusFilter,
      sort: SortKey,
      search: string,
    ) => {
      try {
        setLoading(true);

        const token = localStorage.getItem("accessToken");
        if (!token) {
          showLogin("confirm");
          logout();
          return;
        }

        const statuses = status === "ALL" ? undefined : [status];

        const data = await fetchProductsByUser(token, {
          page,
          size,
          search: search || undefined,
          statuses,
          sortBy: toApiSort(sort),
        });

        const res = data?.result ?? data;

        setProducts(res?.content ?? []);
        setPageInfo({
          totalElements: Number(res?.totalElements) || 0,
          totalPages: Number(res?.totalPages) || 0,
          currentPage: page,
          size: Number(res?.size) || size,
        });
      } catch (error: unknown) {
        const result = handleApiError(error);
        console.log(error);
        console.error(result);

        switch (result.type) {
          case "AUTH":
            showLogin("confirm");
            logout();
            break;
          default:
            setError("경매 목록을 조회하지 못했습니다");
        }
      } finally {
        setLoading(false);
      }
    },
    [showLogin, logout],
  );

  useEffect(() => {
    loadProductsByUser(
      appliedPage,
      appliedSize,
      appliedStatus,
      appliedSort,
      appliedSearch,
    );
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, [appliedPage, appliedSize, appliedStatus, appliedSort, appliedSearch]);

  // 백엔드가 필터를 이미 적용해주면 그대로, 아니라면 UI에서도 최소 필터만 한번 더
  const visibleProducts = useMemo(() => {
    let list = [...(products || [])];

    if (appliedStatus !== "ALL")
      list = list.filter((p: ProductListDto) => p.status === appliedStatus);

    if (appliedSearch.length > 0) {
      const q = appliedSearch.toLowerCase();
      list = list.filter((p: ProductListDto) => {
        const name = String(p.productName ?? "").toLowerCase();
        const content = String(p.productContent ?? "").toLowerCase();
        return name.includes(q) || content.includes(q);
      });
    }

    return list;
  }, [products, appliedStatus, appliedSearch]);

  const handlePageChange = (newPage: number) => {
    if (loading) return;
    if (Number.isNaN(newPage) || newPage < 0 || newPage >= pageInfo.totalPages)
      return;
    updateURLParams(searchParams, setSearchParams, { page: newPage });
  };

  const applySearch = () => {
    updateURLParams(searchParams, setSearchParams, {
      search: qInput.trim() ? qInput.trim() : null,
      q: null,
      page: 0,
    });
  };

  const resetFilters = () => {
    updateURLParams(searchParams, setSearchParams, {
      page: 0,
      size: 10,
      status: null,
      sortBy: null,
      sort: null,
      search: null,
      q: null,
      view: null,
    });
  };

  const hasActiveFilter =
    appliedStatus !== "ALL" ||
    appliedSort !== "NEWEST" ||
    !!appliedSearch ||
    appliedSize !== 10;

  const onChangeView = (m: ViewMode) => {
    updateURLParams(searchParams, setSearchParams, {
      view: m === "grid" ? null : "list",
    });
  };

  return (
    <div
      className="min-h-screen pt-20 pb-28"
      style={{
        backgroundImage:
          "radial-gradient(1100px circle at 15% 0%, rgba(118,90,255,0.12), transparent 45%), radial-gradient(900px circle at 85% 15%, rgba(16,185,129,0.10), transparent 45%), linear-gradient(to bottom, rgba(250,250,250,1), rgba(248,249,252,1))",
      }}
    >
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="rounded-[26px] bg-white/70 backdrop-blur-xl ring-1 ring-black/5 shadow-sm">
          <div className="p-7 md:p-9">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h2 className="text-3xl font-extrabold tracking-tight text-zinc-900">
                  경매 상품
                </h2>
                <br />
                <p className="mt-2 text-sm text-zinc-500">
                  총 {pageInfo.totalElements}개
                  <span className="ml-2 text-zinc-400">
                    (현재 페이지 {products.length}개 · 표시{" "}
                    {visibleProducts.length}개)
                  </span>
                </p>

                <div className="mt-3 flex flex-wrap gap-2">
                  {appliedStatus !== "ALL" && (
                    <TinyChip>
                      {STATUS_OPTIONS.find((x) => x.value === appliedStatus)
                        ?.label ?? appliedStatus}
                    </TinyChip>
                  )}
                  {appliedSearch && <TinyChip>검색: {appliedSearch}</TinyChip>}
                  {appliedSort !== "NEWEST" && (
                    <TinyChip>
                      {SORT_OPTIONS.find((x) => x.value === appliedSort)
                        ?.label ?? appliedSort}
                    </TinyChip>
                  )}
                  {appliedSize !== 10 && <TinyChip>{appliedSize}개씩</TinyChip>}
                </div>
              </div>
            </div>

            <div className="mt-6 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
              {/* Search */}
              <div className="w-full lg:flex-1">
                <div className="flex items-center gap-2">
                  <div className="relative flex-1">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
                    <input
                      value={qInput}
                      onChange={(e) => setQInput(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") applySearch();
                      }}
                      placeholder="상품명/내용 검색"
                      className="w-full h-11 pl-11 pr-4 rounded-2xl bg-white/70 border border-black/5 text-sm text-zinc-800 outline-none focus:ring-2 focus:ring-[#765AFF]/20 focus:border-[#765AFF]/30"
                    />
                  </div>
                  <button
                    type="button"
                    onClick={applySearch}
                    className="h-11 px-5 rounded-2xl bg-[#765AFF] text-white text-sm font-extrabold hover:bg-[#6348e6] transition shadow-sm"
                  >
                    검색
                  </button>
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 flex-wrap">
                <select
                  value={appliedStatus}
                  onChange={(e) => {
                    const v = e.target.value as StatusFilter;
                    updateURLParams(searchParams, setSearchParams, {
                      status: v === "ALL" ? null : v,
                      page: 0,
                    });
                  }}
                  className="h-11 w-28 px-3 rounded-2xl bg-white/70 border border-black/5 text-sm text-zinc-800 outline-none focus:ring-2 focus:ring-[#765AFF]/20 focus:border-[#765AFF]/30"
                  title="상태"
                >
                  {STATUS_OPTIONS.map((o) => (
                    <option key={o.value} value={o.value}>
                      {o.label}
                    </option>
                  ))}
                </select>
                <select
                  value={appliedSort}
                  onChange={(e) => {
                    const v = e.target.value as SortKey;
                    updateURLParams(searchParams, setSearchParams, {
                      sortBy: v === "NEWEST" ? null : v,
                      sort: null,
                      page: 0,
                    });
                  }}
                  className="h-11 w-32 px-3 rounded-2xl bg-white/70 border border-black/5 text-sm text-zinc-800 outline-none focus:ring-2 focus:ring-[#765AFF]/20 focus:border-[#765AFF]/30"
                  title="정렬"
                >
                  {SORT_OPTIONS.map((o) => (
                    <option key={o.value} value={o.value}>
                      {o.label}
                    </option>
                  ))}
                </select>

                <select
                  value={appliedSize}
                  onChange={(e) => {
                    const v = Number(e.target.value);
                    updateURLParams(searchParams, setSearchParams, {
                      size: v,
                      page: 0,
                    });
                  }}
                  className="h-11 w-24 px-3 rounded-2xl bg-white/70 border border-black/5 text-sm text-zinc-800 outline-none focus:ring-2 focus:ring-[#765AFF]/20 focus:border-[#765AFF]/30"
                  title="개수"
                >
                  {SIZE_OPTIONS.map((n) => (
                    <option key={n} value={n}>
                      {n}개
                    </option>
                  ))}
                </select>

                <ViewToggle mode={appliedView} onChange={onChangeView} />

                <button
                  type="button"
                  onClick={resetFilters}
                  disabled={!hasActiveFilter}
                  className={cn(
                    "inline-flex items-center justify-center h-11 w-11 rounded-2xl border transition",
                    hasActiveFilter
                      ? "bg-white/70 border-black/5 text-zinc-700 hover:bg-white"
                      : "bg-zinc-100/60 border-transparent text-zinc-400 cursor-not-allowed",
                  )}
                  title="초기화"
                >
                  <RefreshCw className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-5">
          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {Array.from({ length: 6 }).map((_, i) => (
                <div
                  key={i}
                  className="rounded-3xl bg-white/70 backdrop-blur ring-1 ring-black/5 p-4 shadow-sm"
                >
                  <div className="w-full h-44 rounded-2xl bg-zinc-100 animate-pulse" />
                  <div className="mt-4 space-y-2">
                    <div className="h-4 bg-zinc-100 rounded animate-pulse w-3/4" />
                    <div className="h-4 bg-zinc-100 rounded animate-pulse w-1/2" />
                    <div className="h-10 bg-zinc-100 rounded-2xl animate-pulse w-full mt-3" />
                  </div>
                </div>
              ))}
            </div>
          ) : error ? (
            <div className="rounded-3xl bg-white/70 backdrop-blur ring-1 ring-black/5 shadow-sm p-12 text-center">
              <div className="mx-auto w-14 h-14 rounded-3xl bg-red-50 ring-1 ring-red-100 grid place-items-center">
                <XCircle className="w-10 h-10 text-red-500" />
              </div>
              <p className="mt-5 text-zinc-900 font-extrabold text-xl">
                경매 목록을 조회하지 못했습니다
              </p>
              <p className="mt-2 text-sm text-zinc-500">
                잠시 후 다시 시도해주세요.
              </p>
              <button
                type="button"
                onClick={() =>
                  loadProductsByUser(
                    appliedPage,
                    appliedSize,
                    appliedStatus,
                    appliedSort,
                    appliedSearch,
                  )
                }
                className="mt-6 inline-flex items-center gap-2 px-5 h-11 rounded-2xl bg-zinc-900 text-white text-sm font-extrabold hover:bg-zinc-800 transition"
              >
                <RefreshCw className="w-4 h-4" />
                다시 시도
              </button>
            </div>
          ) : visibleProducts.length === 0 ? (
            <div className="rounded-3xl bg-white/70 backdrop-blur ring-1 ring-black/5 shadow-sm p-12 text-center">
              <div className="mx-auto w-14 h-14 rounded-3xl bg-white/80 ring-1 ring-black/5 grid place-items-center">
                <Search className="w-6 h-6 text-zinc-400" />
              </div>
              <p className="mt-5 text-zinc-900 font-extrabold text-xl">
                조건에 맞는 경매가 없습니다
              </p>
              <p className="mt-2 text-sm text-zinc-500">
                검색어 또는 상태/정렬을 바꿔보세요.
              </p>
              <button
                type="button"
                onClick={resetFilters}
                className="mt-6 inline-flex items-center gap-2 px-5 h-11 rounded-2xl bg-zinc-900 text-white text-sm font-extrabold hover:bg-zinc-800 transition"
              >
                <RefreshCw className="w-4 h-4" />
                전체 보기
              </button>
            </div>
          ) : (
            <>
              {/* GRID */}
              {appliedView === "grid" && (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {visibleProducts.map((product) => {
                    const badge = getStatusBadge(product.status);
                    const isClickable = product.status !== "READY";

                    return (
                      <div
                        key={product.productId}
                        onClick={(e) => {
                          e.stopPropagation();
                          if (isClickable)
                            navigate(`/auction_detail/${product.productId}`);
                        }}
                        className={cn(
                          "group rounded-3xl bg-white/70 backdrop-blur ring-1 ring-black/5 shadow-sm transition",
                          "hover:shadow-md hover:-translate-y-[1px]",
                          isClickable
                            ? "cursor-pointer"
                            : "opacity-90 cursor-not-allowed",
                        )}
                      >
                        <div className="p-4">
                          <div className="relative overflow-hidden rounded-2xl ring-1 ring-black/5">
                            {product.previewImageUrl ? (
                              <img
                                src={product.previewImageUrl}
                                alt={product.productName}
                                className="w-full h-44 object-cover transition-transform duration-300 group-hover:scale-[1.03]"
                              />
                            ) : (
                              <PlaceholderImg />
                            )}

                            <div className="absolute top-3 left-3">
                              <TimePill
                                status={product.status}
                                auctionDuration={60}
                                auctionEndTime={product.auctionEndTime}
                              />
                            </div>

                            <div
                              className={cn(
                                "absolute top-3 right-3 px-3 py-1 rounded-full text-xs font-extrabold ring-1 shadow-sm",
                                badge.chip,
                              )}
                            >
                              {badge.text}
                            </div>

                            {(product.status === "READY" ||
                              product.status === "NOTSELLED" ||
                              product.status === "SELLED") && (
                              <div className="absolute inset-0 bg-black/25 flex items-center justify-center">
                                <div className="text-center">
                                  {product.status === "READY" ? (
                                    <>
                                      <Clock className="h-8 w-8 text-white mx-auto mb-2" />
                                      <span className="text-white text-lg font-extrabold">
                                        준비중
                                      </span>
                                    </>
                                  ) : (
                                    <>
                                      <Eye className="h-8 w-8 text-white mx-auto mb-2" />
                                      <span className="text-white text-lg font-extrabold">
                                        {badge.text}
                                      </span>
                                    </>
                                  )}
                                </div>
                              </div>
                            )}
                          </div>

                          <h3 className="mt-4 text-zinc-900 font-extrabold line-clamp-2 text-base">
                            {product.productName}
                          </h3>

                          <div className="mt-3 grid grid-cols-2 gap-3">
                            <div className="rounded-2xl bg-white/60 ring-1 ring-black/5 p-3">
                              <p className="text-xs font-bold text-zinc-500">
                                {product.status === "SELLED"
                                  ? "낙찰가"
                                  : "현재가"}
                              </p>
                              <p
                                className={cn(
                                  "mt-1 text-lg font-extrabold",
                                  product.status === "SELLED"
                                    ? "text-violet-700"
                                    : product.status === "NOTSELLED"
                                      ? "text-zinc-400"
                                      : "text-emerald-700",
                                )}
                              >
                                {(product.latestBidAmount ?? 0) === 0
                                  ? "입찰 없음"
                                  : formatPrice(product.latestBidAmount ?? 0)}
                              </p>
                            </div>

                            <div className="rounded-2xl bg-white/60 ring-1 ring-black/5 p-3">
                              <p className="text-xs font-bold text-zinc-500">
                                입찰 수
                              </p>
                              <p className="mt-1 text-lg font-extrabold text-zinc-900">
                                {Math.max(0, (product.bidCount ?? 0) - 1)}건
                              </p>
                            </div>
                          </div>

                          <div className="mt-4 flex items-center justify-between text-xs text-zinc-400">
                            <span>#{product.productId}</span>
                            <span
                              className={cn(
                                isClickable
                                  ? "text-[#765AFF]"
                                  : "text-zinc-400",
                              )}
                            >
                              {isClickable ? "상세보기" : "대기중"}
                            </span>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              {/* LIST */}
              {appliedView === "list" && (
                <div className="rounded-3xl bg-white/70 backdrop-blur ring-1 ring-black/5 shadow-sm overflow-hidden">
                  {visibleProducts.map((product, idx: number) => {
                    const badge = getStatusBadge(product.status);
                    const isClickable = product.status !== "READY";
                    const bids = Math.max(0, (product.bidCount ?? 0) - 1);

                    const priceLabel = priceLabelByStatus(product.status);
                    const priceText =
                      (product.latestBidAmount ?? 0) === 0
                        ? "입찰 없음"
                        : formatPrice(product.latestBidAmount ?? 0);

                    const priceClass =
                      product.status === "SELLED"
                        ? "text-violet-700"
                        : product.status === "NOTSELLED"
                          ? "text-zinc-400"
                          : product.status === "READY"
                            ? "text-blue-700"
                            : "text-emerald-700";

                    return (
                      <div
                        key={product.productId}
                        onClick={(e) => {
                          e.stopPropagation();
                          if (isClickable)
                            navigate(`/auction_detail/${product.productId}`);
                        }}
                        className={cn(
                          "relative flex items-center gap-4 px-5 py-4 transition",
                          idx !== visibleProducts.length - 1 &&
                            "border-b border-black/5",
                          isClickable
                            ? "cursor-pointer hover:bg-white/60"
                            : "cursor-not-allowed opacity-75",
                        )}
                      >
                        {/* 왼쪽 상태 accent bar */}
                        <div
                          className={cn(
                            "absolute left-0 top-0 bottom-0 w-1",
                            statusAccent(product.status),
                          )}
                        />

                        {/* 썸네일 */}
                        <div className="w-28 h-20 shrink-0 rounded-2xl overflow-hidden ring-1 ring-black/5 bg-white">
                          {product.previewImageUrl ? (
                            <img
                              src={product.previewImageUrl}
                              alt={product.productName}
                              className="w-full h-full object-contain bg-zinc-50 p-2"
                              loading="lazy"
                            />
                          ) : (
                            <div className="w-full h-full bg-zinc-50 grid place-items-center">
                              <span className="text-[11px] font-bold text-zinc-300">
                                No Image
                              </span>
                            </div>
                          )}
                        </div>

                        {/* 가운데 정보 */}
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2 min-w-0">
                            <span
                              className={cn(
                                "inline-flex items-center px-2.5 py-1 rounded-full text-[11px] font-extrabold ring-1 ring-black/5",
                                badge.chip,
                              )}
                            >
                              {badge.text}
                            </span>

                            <h3 className="min-w-0 text-zinc-900 font-extrabold text-base truncate">
                              {product.productName}
                            </h3>
                          </div>

                          <div className="mt-2 flex flex-wrap items-center gap-2 text-xs text-zinc-500">
                            <span className="text-zinc-400">
                              #{product.productId}
                            </span>
                            <span className="text-zinc-300">•</span>
                            <span>입찰 {bids}건</span>

                            {(product.status === "READY" ||
                              product.status === "PROCESSING") && (
                              <>
                                <span className="text-zinc-300">•</span>
                                <TimePill
                                  status={product.status}
                                  auctionDuration={60}
                                  auctionEndTime={product.auctionEndTime}
                                />
                              </>
                            )}
                          </div>
                        </div>

                        {/* 오른쪽 가격 + 액션 */}
                        <div className="flex items-center gap-4">
                          <div className="text-right">
                            <div className="text-[11px] font-bold text-zinc-500">
                              {priceLabel}
                            </div>
                            <div
                              className={cn(
                                "text-lg font-extrabold tabular-nums",
                                priceClass,
                              )}
                            >
                              {priceText}
                            </div>
                          </div>

                          <button
                            type="button"
                            disabled={!isClickable}
                            className={cn(
                              "w-10 h-10 rounded-full ring-1 ring-black/5 grid place-items-center transition",
                              isClickable
                                ? "bg-white/70 text-zinc-800 hover:bg-zinc-900 hover:text-white"
                                : "bg-zinc-100/60 text-zinc-400 cursor-not-allowed",
                            )}
                            title={isClickable ? "상세보기" : "대기중"}
                            onClick={(e) => {
                              e.stopPropagation();
                              if (isClickable)
                                navigate(
                                  `/auction_detail/${product.productId}`,
                                );
                            }}
                          >
                            <ChevronRight className="w-5 h-5" />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              <div className="mt-7">
                <RenderPagination
                  currentPage={pageInfo.currentPage}
                  totalPages={pageInfo.totalPages}
                  onPageChange={handlePageChange}
                  loading={loading}
                />
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default MyAuctionlist;
