// src/pages/mypage/publicProfile/UserProfilePage.tsx
import React, { useEffect, useMemo, useState, useRef } from "react";
import { useNavigate, useParams } from "react-router-dom";
import dayjs from "dayjs";
import {
  ChevronLeft,
  Siren,
  Search,
  RefreshCw,
  ShoppingBag,
  Clock,
  Gavel,
  MoreHorizontal,
  Filter,
  ArrowUpDown,
  Home,
  User,
} from "lucide-react";

// import placeholderImg from "@/assets/images/PlaceHolder.jpg";
import ReportModal from "@/components/report/ReportModal";
import {
  fetchPublicProfile,
  fetchProductsByTargetUser,
  type PublicProfileDto,
} from "./UserProfileApi";
import PublicProfileReviews from "./PublicProfileReviews";
import { fetchSeasonLatestForUser } from "@/components/season/seasonApi";
import type { SeasonUserAwardsDto } from "@/components/season/seasonTypes";
import SeasonAwardChips from "@/components/season/SeasonAwardChips";
import { handleApiError } from "@/errors/HandleApiError";
import { useModal } from "@/contexts/ModalContext";
import { fetchSellerReviewSummary } from "@/pages/mypage/reviews/reviewApi";
import type { ReviewSellerSummaryDto } from "@/pages/mypage/reviews/reviewTypes";
import { useAuth } from "@/hooks/useAuth";
type ProductRow = {
  productId: number;
  productName: string;
  productContent: string;
  price: number;
  status: "READY" | "PROCESSING" | "SELLED" | "NOTSELLED";
  previewImageUrl: string | null;
  categoryId: number | null;
  email: string;
  maxBidAmount: number;
  bidCount: number;
  createdAt: string;
};

function unwrap<T>(api: any): T {
  return (api?.result ?? api?.data ?? api?.body ?? api) as T;
}

function formatMoney(v: number) {
  try {
    return v.toLocaleString("ko-KR");
  } catch {
    return String(v);
  }
}

function statusBadge(s: ProductRow["status"]) {
  switch (s) {
    case "READY":
      return {
        label: "대기",
        cls: "bg-gray-100 text-gray-600 ring-1 ring-gray-200",
      };
    case "PROCESSING":
      return {
        label: "진행중",
        cls: "bg-[rgba(118,90,255,0.08)] text-[rgb(118,90,255)] ring-1 ring-[rgba(118,90,255,0.25)]",
      };
    case "SELLED":
      return {
        label: "낙찰",
        cls: "bg-indigo-50 text-indigo-700 ring-1 ring-indigo-200",
      };
    case "NOTSELLED":
      return {
        label: "유찰",
        cls: "bg-rose-50 text-rose-700 ring-1 ring-rose-200",
      };
    default:
      return { label: s, cls: "bg-gray-50 text-gray-500" };
  }
}

const BRAND_COLOR = "rgb(118,90,255)";
const BRAND_BG_SOFT = "rgba(118,90,255,0.08)";

type SectionKey = "PRODUCTS" | "REVIEWS";

export default function UserProfilePage() {
  const nav = useNavigate();
  const params = useParams();

  const targetUserId = useMemo(() => {
    const raw = params.userId;
    const n = raw ? Number(raw) : NaN;
    return Number.isFinite(n) ? n : null;
  }, [params.userId]);

  // const token = useMemo(() => localStorage.getItem("accessToken") ?? "", []);
  const [token, setToken] = useState(
    () => localStorage.getItem("accessToken") ?? "",
  );

  useEffect(() => {
    const sync = () => setToken(localStorage.getItem("accessToken") ?? "");
    sync();

    window.addEventListener("focus", sync);
    window.addEventListener("auth:changed", sync as any);

    return () => {
      window.removeEventListener("focus", sync);
      window.removeEventListener("auth:changed", sync as any);
    };
  }, []);
  // State
  const [loadingProfile, setLoadingProfile] = useState(false);
  const [profile, setProfile] = useState<PublicProfileDto | null>(null);

  const [loadingList, setLoadingList] = useState(false);
  const [rows, setRows] = useState<ProductRow[]>([]);
  const [totalPages, setTotalPages] = useState(0);
  const [totalElements, setTotalElements] = useState(0);

  const [page, setPage] = useState(0);
  const [size] = useState(12);

  const [search, setSearch] = useState("");
  const [statuses, setStatuses] = useState<Array<ProductRow["status"]>>([
    "READY",
    "PROCESSING",
    "SELLED",
    "NOTSELLED",
  ]);
  const [searchKey, setSearchKey] = useState(0);

  const [sortBy, setSortBy] = useState<
    "NEWEST" | "ENDING_SOON" | "MOST_BIDS" | "HIGHEST_BID"
  >("NEWEST");

  const [section, setSection] = useState<SectionKey>("PRODUCTS");

  const [reportOpen, setReportOpen] = useState(false);
  const reportMode = "USER";
  const reportable = Boolean(profile?.reportable);

  const [reviewCount, setReviewCount] = useState<number | undefined>(undefined);

  const openDays = useMemo(() => {
    if (!profile?.createdAt) return null;
    const days = dayjs().diff(dayjs(profile.createdAt), "day");
    return Math.max(0, days);
  }, [profile?.createdAt]);

  const [seasonAwards, setSeasonAwards] = useState<SeasonUserAwardsDto | null>(
    null,
  );
  const [seasonLoading, setSeasonLoading] = useState(false);

  const [listLoadErr, setListLoadErr] = useState<string | null>(null);

  const shownModalErrRef = useRef<string | null>(null);

  const [imgBroken, setImgBroken] = useState(false);
  function showErrorModalOnce(msg: string) {
    const m = String(msg ?? "").trim();
    if (!m) return;
    if (shownModalErrRef.current === m) return;
    shownModalErrRef.current = m;
    modal.showError(m);
  }
  const modal = useModal();

  const { logout } = useAuth();
  const loginPromptedRef = useRef(false);

  const forceReauth = () => {
    logout();
    setToken("");

    if (!loginPromptedRef.current) {
      loginPromptedRef.current = true;
      modal.showLogin("navigation");
    }
  };
  useEffect(() => {
    if (token) loginPromptedRef.current = false;
  }, [token]);

  function calcChipMax() {
    const w = window.innerWidth;
    if (w < 480) return 4;
    if (w < 768) return 6;
    if (w < 1024) return 8;
    return 10;
  }
  const [chipMax, setChipMax] = useState(calcChipMax());

  useEffect(() => {
    const onResize = () => setChipMax(calcChipMax());
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  function applyUiError(e: any) {
    console.error(e);

    const r = handleApiError(e);

    if (r.type === "REDIRECT" && r.to === "/404") {
      nav("/404");
      return;
    }

    if (r.type === "AUTH") {
      forceReauth();
      return;
    }

    if (r.type === "WARNING") {
      modal.showWarning(r.message);
      return;
    }

    if (r.type === "IGNORE") return;

    modal.showError((r as any).message ?? "오류가 발생했습니다.");
  }

  // API Calls
  const loadProfile = async () => {
    if (!targetUserId) return;

    const t = localStorage.getItem("accessToken") ?? "";
    if (t !== token) setToken(t);

    if (!t) {
      forceReauth();
      return;
    }

    setLoadingProfile(true);

    try {
      const res = await fetchPublicProfile(t, targetUserId);
      const data = unwrap<PublicProfileDto>(res);
      setProfile(data);
    } catch (e: any) {
      const r = handleApiError(e);

      if (r.type === "REDIRECT" && r.to === "/404") {
        nav("/404");
        return;
      }
      if (r.type === "AUTH") {
        forceReauth();
        return;
      }
      if (r.type === "WARNING") {
        modal.showWarning(r.message);
        return;
      }
      if (r.type === "IGNORE") return;

      modal.showError(
        "서버 내부에서 오류가 발생했습니다. 관리자에게 문의해주세요.",
      );
    } finally {
      setLoadingProfile(false);
    }
  };

  useEffect(() => {
    if (!token || !targetUserId) {
      setSeasonAwards(null);
      setSeasonLoading(false);
      return;
    }

    let mounted = true;
    (async () => {
      setSeasonLoading(true);
      try {
        const dto = await fetchSeasonLatestForUser(token, targetUserId);
        if (mounted) setSeasonAwards(dto);
      } catch (e: any) {
        if (mounted) setSeasonAwards(null);
        applyUiError(e);
      } finally {
        if (mounted) setSeasonLoading(false);
      }
    })();

    return () => {
      mounted = false;
    };
  }, [token, targetUserId]);

  useEffect(() => {
    if (!token || !targetUserId) {
      setReviewCount(undefined);
      return;
    }

    let mounted = true;

    (async () => {
      try {
        const res = await fetchSellerReviewSummary(token, targetUserId);
        const dto = unwrap<ReviewSellerSummaryDto>(res);
        const cnt = Number(dto?.reviewCount ?? 0);
        if (mounted) setReviewCount(Number.isFinite(cnt) ? cnt : 0);
      } catch {
        if (mounted) setReviewCount(undefined);
      }
    })();

    return () => {
      mounted = false;
    };
  }, [token, targetUserId]);

  const loadList = async () => {
    if (!targetUserId) return;

    const t = localStorage.getItem("accessToken") ?? "";
    if (t !== token) setToken(t);

    if (!t) {
      forceReauth();
      return;
    }

    setLoadingList(true);
    setListLoadErr(null);

    try {
      const res = await fetchProductsByTargetUser(t, targetUserId, {
        page,
        size,
        search,
        statuses,
        sortBy,
      });

      const payload = unwrap<any>(res);
      const pageObj = payload?.content
        ? payload
        : (payload?.result ?? payload?.data ?? payload);

      setRows((pageObj?.content ?? []) as ProductRow[]);
      setTotalPages(Number(pageObj?.totalPages ?? 0));
      setTotalElements(Number(pageObj?.totalElements ?? 0));
    } catch (e: any) {
      const r = handleApiError(e);

      if (r.type === "REDIRECT" && r.to === "/404") {
        nav("/404");
        return;
      }
      if (r.type === "AUTH") {
        forceReauth();
        return;
      }

      const msg = (r as any).message ?? "상품 목록을 불러올 수 없습니다.";
      setListLoadErr(msg);

      showErrorModalOnce(msg);
    } finally {
      setLoadingList(false);
    }
  };

  // 프로필 로드
  useEffect(() => {
    if (!targetUserId) return;
    if (!token) return;
    loadProfile();
  }, [targetUserId, token]);

  useEffect(() => {
    if (!targetUserId) return;
    if (!token) return;
    if (section !== "PRODUCTS") return;
    loadList();
  }, [targetUserId, token, page, sortBy, statuses, section, searchKey]);

  const applySearch = () => {
    if (section !== "PRODUCTS") return;
    setPage(0);
    setSearchKey((k) => k + 1);
  };

  const toggleStatus = (s: ProductRow["status"]) => {
    setPage(0);
    setStatuses((prev) => {
      const has = prev.includes(s);
      const next = has ? prev.filter((x) => x !== s) : [...prev, s];
      return next.length === 0 ? ["READY", "PROCESSING"] : next;
    });
  };

  // --- Render Helpers ---

  if (!targetUserId) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="bg-white p-8 rounded-3xl shadow-lg text-center max-w-md border border-gray-100">
          <Siren className="w-12 h-12 text-rose-500 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-gray-900">잘못된 접근</h2>
          <p className="text-gray-500 mt-2 text-sm">
            유저 정보가 올바르지 않습니다.
          </p>
          <button
            onClick={() => nav(-1)}
            className="mt-6 w-full py-3 rounded-xl bg-gray-900 text-white font-medium hover:bg-gray-800 transition"
          >
            돌아가기
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F9FAFB] pb-20">
      {/* Top Navigation Bar */}
      <div className="sticky top-0 z-10 bg-white/80 backdrop-blur-md border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <button
            onClick={() => nav(-1)}
            className="flex items-center gap-2 text-gray-600 hover:text-gray-900 transition font-medium"
          >
            <ChevronLeft className="w-5 h-5" />
            <span className="text-sm">돌아가기</span>
          </button>
          <div className="font-bold text-gray-900 text-lg opacity-0 sm:opacity-100 transition">
            {profile?.nickname}님의 프로필
          </div>
          <div className="w-20 flex justify-end">
            <button
              onClick={() => {
                loadProfile();
                if (section === "PRODUCTS") loadList();
              }}
              className="p-2 text-gray-400 hover:text-[rgb(118,90,255)] transition rounded-full hover:bg-[rgba(118,90,255,0.08)]"
            >
              <RefreshCw
                className={`w-5 h-5 ${loadingProfile ? "animate-spin" : ""}`}
              />
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
        <div className="relative bg-white rounded-[2rem] p-10 md:min-h-[360px] shadow-sm border border-gray-100 overflow-hidden mb-8 group">
          <div className="absolute top-0 right-0 w-64 h-64 bg-[rgba(118,90,255,0.14)] rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 group-hover:bg-[rgba(118,90,255,0.20)] transition-colors duration-700" />

          {reportable && (
            <button
              onClick={() => setReportOpen(true)}
              className="absolute top-6 right-6 flex items-center gap-1.5 text-gray-400 hover:text-red-500 transition-colors z-10"
              title="신고하기"
            >
              <Siren className="w-4 h-4" />
              <span className="text-xs font-semibold">신고하기</span>
            </button>
          )}

          <div className="relative z-0 flex flex-col md:flex-row md:items-start gap-8">
            {/* 프로필 임지ㅣ */}
            <div className="flex-shrink-0 pt-1">
              <div className="w-32 h-42 md:w-50 md:h-50 rounded-[2rem] overflow-hidden border-4 border-white shadow-lg ring-1 ring-gray-100 bg-white">
                {profile?.profileImageUrl && !imgBroken ? (
                  <img
                    src={profile.profileImageUrl}
                    alt="Profile"
                    className="w-full h-full object-cover"
                    onError={() => setImgBroken(true)}
                    loading="lazy"
                  />
                ) : (
                  <div className="w-full h-full grid place-items-center bg-gray-50">
                    <div className="w-21 h-21 rounded-2xl bg-white ring-1 ring-black/5 grid place-items-center shadow-sm">
                      <User className="w-14 h-14 text-gray-400" />
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* 나 소개 */}
            <div className="flex-1 min-w-0 pt-1">
              <div className="flex flex-col items-start gap-1">
                <div>
                  <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight flex items-center gap-2">
                    {loadingProfile ? "Loading..." : profile?.nickname}
                    {openDays !== null && openDays < 30 && (
                      <span className="px-2 py-0.5 rounded-full bg-yellow-100 text-yellow-700 text-xs font-bold tracking-wide">
                        NEW
                      </span>
                    )}
                  </h1>

                  <div className="mt-3 flex flex-wrap items-center gap-2">
                    <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[rgba(118,90,255,0.08)] text-[rgb(118,90,255)] text-xs font-bold">
                      <Home className="w-4 h-4" /> 오픈 {openDays}일차{" "}
                    </span>
                    {/* <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-gray-50 text-gray-600 text-xs font-semibold border border-gray-100"> ID #{targetUserId} </span> */}
                    <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-gray-50 text-gray-600 text-xs font-semibold border border-gray-100">
                      {" "}
                      최근 활동
                      <span className="text-gray-900 font-bold">집계 예정</span>
                    </span>
                  </div>
                </div>
              </div>

              <div className="mt-6 p-6 rounded-2xl bg-white border border-gray-100">
                <div className="flex items-center justify-between">
                  <div className="text-sm font-bold text-gray-900">
                    최근 활동
                  </div>
                  <div className="text-xs text-gray-400 font-semibold">
                    {" "}
                    {seasonAwards?.ym
                      ? `${seasonAwards.ym} 시즌`
                      : "집계 예정"}{" "}
                  </div>
                </div>
                <div className="mt-4">
                  {" "}
                  {seasonLoading ? (
                    <div className="flex items-center gap-2 text-xs text-gray-400">
                      {" "}
                      <div className="animate-spin w-4 h-4 border-2 border-[rgba(118,90,255,0.25)] border-t-[rgb(118,90,255)] rounded-full" />{" "}
                      시즌 정보를 불러오는 중...{" "}
                    </div>
                  ) : seasonAwards &&
                    (seasonAwards.titles?.length ?? 0) +
                      (seasonAwards.badges?.length ?? 0) >
                      0 ? (
                    <SeasonAwardChips
                      data={seasonAwards}
                      accent={BRAND_COLOR}
                      accentSoft={BRAND_BG_SOFT}
                      max={chipMax}
                    />
                  ) : (
                    <div className="text-xs text-gray-500">
                      {" "}
                      아직 집계된 시즌 결과가 없습니다.{" "}
                    </div>
                  )}{" "}
                </div>{" "}
              </div>
            </div>
          </div>

          <div className="mt-10 grid grid-cols-2 md:grid-cols-4 gap-4">
            <StatCard
              label="거래완료"
              value={profile?.tradeCount ?? 0}
              icon={<Gavel className="w-5 h-5 text-[rgb(118,90,255)]" />}
            />
            <StatCard
              label="총 등록상품"
              value={profile?.totalProducts ?? 0}
              icon={<ShoppingBag className="w-5 h-5 text-blue-500" />}
            />
            <StatCard
              label="판매 진행중"
              value={profile?.sellingProducts ?? 0}
              icon={<Clock className="w-5 h-5 text-emerald-500" />}
            />
            <StatCard
              label="판매 종료"
              value={profile?.endedProducts ?? 0}
              icon={<MoreHorizontal className="w-5 h-5 text-gray-400" />}
            />
          </div>
        </div>

        <div className="flex items-center gap-8 border-b border-gray-200 mb-8 px-2">
          <TabButton
            active={section === "PRODUCTS"}
            onClick={() => setSection("PRODUCTS")}
            label="판매 상품"
            count={profile?.totalProducts ?? 0}
          />
          <TabButton
            active={section === "REVIEWS"}
            onClick={() => setSection("REVIEWS")}
            label="받은 리뷰"
            count={reviewCount}
          />
        </div>

        {section === "PRODUCTS" && (
          <div className="animate-fade-in-up">
            <div className="flex flex-col md:flex-row gap-4 justify-between items-start md:items-center mb-6">
              <div className="relative w-full md:w-80">
                <input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && applySearch()}
                  placeholder="상품명을 검색해보세요"
                  className="w-full pl-11 pr-4 py-3 bg-white border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[rgba(118,90,255,0.25)] focus:border-[rgb(118,90,255)] transition shadow-sm"
                />
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              </div>

              <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
                <div className="flex items-center gap-2 mr-2">
                  <Filter className="w-4 h-4 text-gray-400" />
                  <span className="text-xs font-semibold text-gray-500">
                    상태필터
                  </span>
                </div>
                {(["READY", "PROCESSING", "SELLED", "NOTSELLED"] as const).map(
                  (s) => (
                    <button
                      key={s}
                      onClick={() => toggleStatus(s)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition border ${
                        statuses.includes(s)
                          ? "bg-[rgb(118,90,255)] text-white border-[rgb(118,90,255)] shadow-sm"
                          : "bg-white text-gray-600 border-gray-200 hover:bg-gray-50"
                      }`}
                    >
                      {statusBadge(s).label}
                    </button>
                  ),
                )}

                <div className="w-px h-6 bg-gray-200 mx-1 hidden md:block" />

                <div className="relative">
                  <select
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value as any)}
                    className="pl-3 pr-8 py-2 bg-white border border-gray-200 rounded-lg text-xs font-medium text-gray-700 focus:outline-none focus:ring-2 focus:ring-[rgba(118,90,255,0.25)] cursor-pointer appearance-none hover:bg-gray-50 transition"
                  >
                    <option value="NEWEST">최신순</option>
                    <option value="ENDING_SOON">마감임박</option>
                    <option value="MOST_BIDS">입찰많은순</option>
                    <option value="HIGHEST_BID">최고가순</option>
                  </select>
                  <ArrowUpDown className="absolute right-2.5 top-1/2 -translate-y-1/2 w-3 h-3 text-gray-400 pointer-events-none" />
                </div>
              </div>
            </div>
            {listLoadErr ? (
              <div className="py-20 text-center bg-white rounded-3xl border border-red-200 shadow-sm">
                <div className="text-red-700 font-bold mb-1">
                  상품 목록을 불러올 수 없습니다
                </div>
                <div className="text-sm text-red-600 whitespace-pre-line">
                  {listLoadErr}
                </div>
                <button
                  onClick={() => void loadList()}
                  className="mt-4 px-5 py-2 rounded-xl bg-red-600 hover:bg-red-700 text-white text-sm"
                >
                  다시 시도
                </button>
              </div>
            ) : loadingList ? (
              <div className="py-20 text-center">
                <div className="animate-spin w-8 h-8 border-4 border-[rgba(118,90,255,0.25)] border-t-[rgb(118,90,255)] rounded-full mx-auto mb-4" />
                <p className="text-gray-500 text-sm">
                  상품 정보를 불러오고 있습니다...
                </p>
              </div>
            ) : rows.length === 0 ? (
              <div className="py-20 text-center bg-white rounded-3xl border border-gray-100 shadow-sm">
                <div className="bg-gray-50 w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <Search className="w-8 h-8 text-gray-300" />
                </div>
                <h3 className="text-gray-900 font-bold mb-1">
                  검색 결과가 없습니다
                </h3>
                <p className="text-gray-500 text-sm">
                  다른 검색어나 필터를 시도해보세요.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {rows.map((p) => (
                  <ProductCard
                    key={p.productId}
                    product={p}
                    onClick={() => nav(`/auction_detail/${p.productId}`)}
                  />
                ))}
              </div>
            )}

            {totalPages > 0 && (
              <div className="mt-12 flex justify-center items-center gap-2">
                <button
                  disabled={page === 0}
                  onClick={() => setPage((p) => p - 1)}
                  className="px-4 py-2 rounded-xl bg-white border border-gray-200 text-sm font-medium text-gray-600 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition"
                >
                  이전
                </button>
                <span className="text-sm font-semibold text-gray-900 px-4">
                  {page + 1} / {totalPages}
                </span>
                <button
                  disabled={page >= totalPages - 1}
                  onClick={() => setPage((p) => p + 1)}
                  className="px-4 py-2 rounded-xl bg-white border border-gray-200 text-sm font-medium text-gray-600 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition"
                >
                  다음
                </button>
              </div>
            )}
          </div>
        )}

        {/* {section === "REVIEWS" && (
          <div className="animate-fade-in-up bg-white rounded-3xl border border-gray-100 p-12 text-center shadow-sm">
            <div className="w-16 h-16 bg-violet-50 rounded-2xl flex items-center justify-center mx-auto mb-6">
              <Star className="w-8 h-8 text-violet-500" fill="currentColor" />
            </div>
            <h3 className="text-xl font-bold text-gray-900 mb-2">리뷰 서비스 준비중</h3>
            <p className="text-gray-500 text-sm max-w-sm mx-auto leading-relaxed">
              사용자 간의 신뢰를 위한 리뷰 시스템을 개발하고 있습니다.<br/>
              조금만 기다려주세요!
            </p>
          </div>
        )} */}
        {section === "REVIEWS" && (
          <div className="animate-fade-in-up">
            {" "}
            <PublicProfileReviews token={token} sellerId={targetUserId} />{" "}
          </div>
        )}
      </div>

      <ReportModal
        open={reportOpen}
        onClose={() => setReportOpen(false)}
        mode={reportMode}
        targetUserId={profile?.userId}
        targetUserName={profile?.nickname}
        onSubmitted={() => {}}
      />
    </div>
  );
}

function StatCard({
  label,
  value,
  icon,
}: {
  label: string;
  value: number;
  icon: React.ReactNode;
}) {
  return (
    <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm flex items-center gap-4 hover:shadow-md transition-shadow group">
      <div className="w-12 h-12 rounded-xl bg-gray-50 group-hover:bg-[rgba(118,90,255,0.08)] flex items-center justify-center transition-colors">
        {icon}
      </div>
      <div>
        <div className="text-xs text-gray-500 font-medium mb-1">{label}</div>
        <div className="text-xl font-extrabold text-gray-900 tracking-tight">
          {value.toLocaleString()}
        </div>
      </div>
    </div>
  );
}

function TabButton({
  active,
  onClick,
  label,
  count,
}: {
  active: boolean;
  onClick: () => void;
  label: string;
  count?: number;
}) {
  return (
    <button
      onClick={onClick}
      className={`pb-4 px-2 text-sm font-bold relative transition-colors ${
        active ? "text-[rgb(118,90,255)]" : "text-gray-400 hover:text-gray-600"
      }`}
    >
      <span className="flex items-center gap-1.5">
        {label}
        {count !== undefined && (
          <span
            className={`px-1.5 py-0.5 rounded-full text-[10px] ${
              active
                ? "bg-[rgba(118,90,255,0.14)] text-[rgb(118,90,255)]"
                : "bg-gray-100 text-gray-500"
            }`}
          >
            {count}
          </span>
        )}
      </span>
      {active && (
        <div className="absolute bottom-0 left-0 w-full h-0.5 bg-[rgb(118,90,255)] rounded-t-full" />
      )}
    </button>
  );
}

function ProductCard({
  product,
  onClick,
}: {
  product: ProductRow;
  onClick: () => void;
}) {
  const badge = statusBadge(product.status);
  const price = formatMoney(
    product.maxBidAmount && product.maxBidAmount > 0
      ? product.maxBidAmount
      : product.price,
  );

  return (
    <div
      onClick={onClick}
      className="group bg-white rounded-3xl border border-gray-100 overflow-hidden cursor-pointer hover:shadow-xl hover:-translate-y-1 transition-all duration-300 flex flex-col h-full"
    >
      <div className="relative aspect-[4/3] overflow-hidden bg-gray-100">
        <img
          src={product.previewImageUrl || placeholderImg}
          alt={product.productName}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />

        <div className="absolute top-3 right-3">
          <span
            className={`px-2.5 py-1 rounded-lg text-[11px] font-bold backdrop-blur-md shadow-sm ${badge.cls}`}
          >
            {badge.label}
          </span>
        </div>
      </div>

      <div className="p-5 flex flex-col flex-1">
        <div className="flex-1">
          <h3 className="text-[15px] font-bold text-gray-900 line-clamp-1 mb-1 group-hover:text-[rgb(118,90,255)] transition-colors">
            {product.productName}
          </h3>
          <p className="text-xs text-gray-400 mb-4 line-clamp-2 min-h-[2.5em]">
            {product.productContent}
          </p>
        </div>

        <div className="pt-4 border-t border-dashed border-gray-100 flex items-end justify-between">
          <div>
            <span className="text-[10px] font-medium text-gray-400 block mb-0.5">
              현재가
            </span>
            <span className="text-lg font-extrabold text-gray-900 tracking-tight">
              {price}
              <span className="text-sm font-normal text-gray-500 ml-0.5">
                원
              </span>
            </span>
          </div>
          <div className="text-right">
            <span className="text-[10px] font-medium text-gray-400 block mb-0.5">
              입찰수
            </span>
            <span className="text-sm font-bold text-[rgb(118,90,255)] bg-[rgba(118,90,255,0.08)] px-2 py-0.5 rounded-md">
              {product.bidCount}건
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
