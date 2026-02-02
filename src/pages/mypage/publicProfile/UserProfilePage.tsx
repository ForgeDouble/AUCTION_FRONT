import React, { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import dayjs from "dayjs";
import { ChevronLeft, Siren, Search, RefreshCw } from "lucide-react";

import placeholderImg from "@/assets/images/PlaceHolder.jpg";
import ReportModal from "@/components/report/ReportModal";

import {
    fetchPublicProfile,
    fetchProductsByTargetUser,
    type PublicProfileDto,
} from "./UserProfileApi";

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
        return { label: "대기", cls: "bg-gray-100 text-gray-700 border-gray-200" };
        case "PROCESSING":
        return { label: "진행중", cls: "bg-emerald-50 text-emerald-700 border-emerald-100" };
        case "SELLED":
        return { label: "낙찰", cls: "bg-violet-50 text-violet-700 border-violet-100" };
        case "NOTSELLED":
        return { label: "유찰", cls: "bg-rose-50 text-rose-700 border-rose-100" };
        default:
        return { label: s, cls: "bg-gray-100 text-gray-700 border-gray-200" };
    }
}

const pillBase =
    "h-9 px-3 rounded-xl border text-[12px] font-semibold transition inline-flex items-center justify-center";
const inputBase =
    "h-10 w-full rounded-xl border border-gray-200 px-3 text-sm outline-none focus:ring-2 focus:ring-violet-200";

    export default function UserProfilePage() {
    const nav = useNavigate();
    const params = useParams();

    const targetUserId = useMemo(() => {
        const raw = params.userId;
        const n = raw ? Number(raw) : NaN;
        return Number.isFinite(n) ? n : null;
    }, [params.userId]);

    const token = useMemo(() => localStorage.getItem("accessToken") ?? "", []);

    const [loadingProfile, setLoadingProfile] = useState(false);
    const [profile, setProfile] = useState<PublicProfileDto | null>(null);

    const [loadingList, setLoadingList] = useState(false);
    const [rows, setRows] = useState<ProductRow[]>([]);
    const [totalPages, setTotalPages] = useState(0);
    const [totalElements, setTotalElements] = useState(0);

    const [page, setPage] = useState(0);
    const [size] = useState(12);

    const [search, setSearch] = useState("");
    const [statuses, setStatuses] = useState<Array<ProductRow["status"]>>(["READY", "PROCESSING"]);
    const [sortBy, setSortBy] = useState<"NEWEST" | "ENDING_SOON" | "MOST_BIDS" | "HIGHEST_BID">("NEWEST");


    const [reportOpen, setReportOpen] = useState(false);
    const [reportMode] = useState<"USER" | "PRODUCT">("USER");

    const reportable = Boolean(profile?.reportable);

    const loadProfile = async () => {
        if (!targetUserId) return;
        if (!token) {
            alert("로그인이 필요합니다.");
            nav("/login");
            return;
        }

        setLoadingProfile(true);
        try {
            const res = await fetchPublicProfile(token, targetUserId);
            const data = unwrap<PublicProfileDto>(res);
            setProfile(data);
        } catch (e: any) {
            const msg = String(e?.message ?? "");
            if (msg.includes("AUTH_REQUIRED") || msg.includes("401") || msg.includes("403")) {
                alert("로그인이 필요합니다.");
                nav("/login");
                return;
            }
            alert("프로필 조회 실패\n" + msg);
        } finally {
            setLoadingProfile(false);
        }
    };

    const loadList = async () => {
    if (!targetUserId) return;
    if (!token) return;

    setLoadingList(true);
    try {
    const res = await fetchProductsByTargetUser(token, targetUserId, {
        page,
        size,
        search,
        statuses,
        sortBy,
    });

    const payload = unwrap<any>(res);
    const pageObj = payload?.content ? payload : payload?.result ?? payload?.data ?? payload;

    setRows((pageObj?.content ?? []) as ProductRow[]);
    setTotalPages(Number(pageObj?.totalPages ?? 0));
    setTotalElements(Number(pageObj?.totalElements ?? 0));
    } catch (e: any) {
    alert("상품 목록 조회 실패\n" + String(e?.message ?? e));
    } finally {
    setLoadingList(false);
    }


    };

    useEffect(() => {
    if (!targetUserId) return;
    loadProfile();
    }, [targetUserId]);

    useEffect(() => {
    if (!targetUserId) return;
    loadList();
    }, [targetUserId, page, sortBy, statuses]);

    const applySearch = () => {
    setPage(0);
    loadList();
    };

    const toggleStatus = (s: ProductRow["status"]) => {
    setPage(0);
    setStatuses((prev) => {
    const has = prev.includes(s);
    const next = has ? prev.filter((x) => x !== s) : [...prev, s];
    return next.length === 0 ? ["READY", "PROCESSING"] : next;
    });
    };

    if (!targetUserId) {
    return (
    <div className="max-w-6xl mx-auto px-4 py-10">
    <div className="rounded-2xl border border-gray-200 bg-white p-6">
    <div className="text-[15px] font-extrabold text-gray-900">잘못된 접근</div>
    <div className="mt-1 text-[12px] text-gray-500">userId가 올바르지 않습니다.</div>
    <button
    className="mt-5 h-10 px-4 rounded-xl border border-gray-200 hover:bg-gray-50 text-sm font-semibold"
    onClick={() => nav(-1)}
    >
    돌아가기
    </button>
    </div>
    </div>
    );
    }

    return (
    <div className="max-w-6xl mx-auto px-4 py-8">
    {/* 상단 바 */}
    <div className="flex items-center justify-between mb-4">
    <button
    className="h-10 px-3 rounded-xl border border-gray-200 hover:bg-gray-50 inline-flex items-center gap-2 text-sm font-semibold"
    onClick={() => nav(-1)}
    >
    <ChevronLeft className="w-4 h-4" />
    뒤로
    </button>

        <button
        className={
            "h-10 px-3 rounded-xl border text-sm font-semibold inline-flex items-center gap-2 " +
            (reportable
            ? "border-red-200 bg-red-50 text-red-700 hover:bg-red-100"
            : "border-gray-200 bg-gray-100 text-gray-400 cursor-not-allowed")
        }
        onClick={() => {
            if (!reportable) return;
            setReportOpen(true);
        }}
        disabled={!reportable}
        title={reportable ? "유저 신고" : "본인은 신고할 수 없습니다"}
        >
        <Siren className="w-4 h-4" />
        신고하기
        </button>
    </div>

    {/* 프로필 카드 */}
    <div className="rounded-2xl border border-gray-200 bg-white p-5">
        <div className="flex items-start gap-4">
        <div className="w-[84px] h-[84px] rounded-2xl overflow-hidden border border-gray-200 bg-gray-50 shrink-0">
            <img
            src={profile?.profileImageUrl || placeholderImg}
            className="w-full h-full object-cover"
            alt="profile"
            loading="lazy"
            />
        </div>

        <div className="flex-1">
            <div className="flex items-center gap-2">
            <div className="text-[18px] font-extrabold text-gray-900">
                {loadingProfile ? "불러오는 중..." : profile?.nickname || "알 수 없음"}
            </div>
            <div className="text-[11px] text-gray-500">#{targetUserId}</div>
            </div>

            <div className="mt-1 text-[12px] text-gray-500">
            오픈일:{" "}
            {profile?.createdAt ? dayjs(profile.createdAt).format("YYYY-MM-DD") : "-"}
            </div>

            <div className="mt-3 grid grid-cols-2 sm:grid-cols-4 gap-2">
            <div className="rounded-2xl border border-gray-100 bg-gray-50 px-3 py-2">
                <div className="text-[11px] text-gray-500">거래(낙찰)</div>
                <div className="text-[15px] font-extrabold text-gray-900">
                {profile?.tradeCount ?? 0}
                </div>
            </div>
            <div className="rounded-2xl border border-gray-100 bg-gray-50 px-3 py-2">
                <div className="text-[11px] text-gray-500">총 등록</div>
                <div className="text-[15px] font-extrabold text-gray-900">
                {profile?.totalProducts ?? 0}
                </div>
            </div>
            <div className="rounded-2xl border border-gray-100 bg-gray-50 px-3 py-2">
                <div className="text-[11px] text-gray-500">판매중</div>
                <div className="text-[15px] font-extrabold text-gray-900">
                {profile?.sellingProducts ?? 0}
                </div>
            </div>
            <div className="rounded-2xl border border-gray-100 bg-gray-50 px-3 py-2">
                <div className="text-[11px] text-gray-500">종료</div>
                <div className="text-[15px] font-extrabold text-gray-900">
                {profile?.endedProducts ?? 0}
                </div>
            </div>
            </div>
        </div>

        <button
            className="h-10 px-3 rounded-xl border border-gray-200 hover:bg-gray-50 inline-flex items-center gap-2 text-sm font-semibold"
            onClick={() => {
            loadProfile();
            loadList();
            }}
            disabled={loadingProfile || loadingList}
            title="새로고침"
        >
            <RefreshCw className={"w-4 h-4 " + (loadingProfile || loadingList ? "animate-spin" : "")} />
            새로고침
        </button>
        </div>
    </div>

    {/* 필터 */}
    <div className="mt-5 rounded-2xl border border-gray-200 bg-white p-5">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-3 items-center">
        <div className="md:col-span-6">
            <div className="relative">
            <input
                className={inputBase + " pr-10"}
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="상품명 검색"
                onKeyDown={(e) => {
                if (e.key === "Enter") applySearch();
                }}
            />
            <button
                className="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-lg border border-gray-200 hover:bg-gray-50 flex items-center justify-center"
                onClick={applySearch}
                aria-label="search"
            >
                <Search className="w-4 h-4" />
            </button>
            </div>
        </div>

        <div className="md:col-span-3">
            <select
            className={inputBase}
            value={sortBy}
            onChange={(e) =>
                setSortBy(e.target.value as "NEWEST" | "ENDING_SOON" | "MOST_BIDS" | "HIGHEST_BID")
            }
            >
            <option value="NEWEST">최신순</option>
            <option value="ENDING_SOON">마감임박</option>
            <option value="MOST_BIDS">입찰많은순</option>
            <option value="HIGHEST_BID">최고가순</option>
            </select>
        </div>

        <div className="md:col-span-3 flex flex-wrap gap-2">
            {(["READY", "PROCESSING", "SELLED", "NOTSELLED"] as Array<ProductRow["status"]>).map(
            (s) => {
                const active = statuses.includes(s);
                const b = statusBadge(s);
                return (
                <button
                    key={s}
                    className={
                    pillBase +
                    " " +
                    (active
                        ? "border-violet-200 bg-violet-50 text-violet-700"
                        : "border-gray-200 bg-white text-gray-700 hover:bg-gray-50")
                    }
                    onClick={() => toggleStatus(s)}
                >
                    {b.label}
                </button>
                );
            }
            )}
        </div>
        </div>

        <div className="mt-3 text-[12px] text-gray-500">
        총 {totalElements.toLocaleString("ko-KR")}개
        </div>
    </div>

    {/* 리스트 */}
    <div className="mt-5">
        {loadingList ? (
        <div className="rounded-2xl border border-gray-200 bg-white p-8 text-center text-gray-500">
            불러오는 중...
        </div>
        ) : rows.length === 0 ? (
        <div className="rounded-2xl border border-gray-200 bg-white p-8 text-center text-gray-500">
            표시할 상품이 없습니다.
        </div>
        ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {rows.map((p) => {
            const b = statusBadge(p.status);
            const img = p.previewImageUrl || placeholderImg;
            const priceText = formatMoney(p.maxBidAmount && p.maxBidAmount > 0 ? p.maxBidAmount : p.price);

            return (
                <button
                key={p.productId}
                className="text-left rounded-2xl border border-gray-200 bg-white hover:shadow-sm transition overflow-hidden"
                onClick={() => nav(`/auction/${p.productId}`)}
                >
                <div className="w-full aspect-[16/10] bg-gray-50 border-b border-gray-100 overflow-hidden">
                    <img src={img} alt={p.productName} className="w-full h-full object-cover" loading="lazy" />
                </div>

                <div className="p-4">
                    <div className="flex items-center justify-between gap-2">
                    <div className="text-[14px] font-extrabold text-gray-900 line-clamp-1">
                        {p.productName}
                    </div>
                    <div className={"h-7 px-2 rounded-lg border text-[11px] font-bold " + b.cls}>
                        {b.label}
                    </div>
                    </div>

                    <div className="mt-1 text-[12px] text-gray-500 line-clamp-2">
                    {p.productContent}
                    </div>

                    <div className="mt-3 flex items-end justify-between">
                    <div>
                        <div className="text-[11px] text-gray-500">현재가</div>
                        <div className="text-[16px] font-extrabold text-gray-900">{priceText}원</div>
                    </div>
                    <div className="text-right">
                        <div className="text-[11px] text-gray-500">입찰</div>
                        <div className="text-[13px] font-bold text-gray-800">{p.bidCount}회</div>
                    </div>
                    </div>

                    <div className="mt-3 text-[11px] text-gray-500">
                    {p.createdAt ? dayjs(p.createdAt).format("YYYY-MM-DD HH:mm") : "-"}
                    </div>
                </div>
                </button>
            );
            })}
        </div>
        )}
    </div>

    {/* 페이징 */}
    <div className="mt-6 flex items-center justify-center gap-2">
        <button
        className={
            "h-10 px-4 rounded-xl border text-sm font-semibold " +
            (page <= 0 ? "border-gray-200 bg-gray-100 text-gray-400 cursor-not-allowed" : "border-gray-200 hover:bg-gray-50")
        }
        disabled={page <= 0}
        onClick={() => setPage((p) => Math.max(0, p - 1))}
        >
        이전
        </button>

        <div className="text-[12px] text-gray-600">
        {totalPages === 0 ? 0 : page + 1} / {totalPages}
        </div>

        <button
        className={
            "h-10 px-4 rounded-xl border text-sm font-semibold " +
            (page + 1 >= totalPages
            ? "border-gray-200 bg-gray-100 text-gray-400 cursor-not-allowed"
            : "border-gray-200 hover:bg-gray-50")
        }
        disabled={page + 1 >= totalPages}
        onClick={() => setPage((p) => p + 1)}
        >
        다음
        </button>
    </div>

    {/* 신고 모달 */}
    <ReportModal
        open={reportOpen}
        onClose={() => setReportOpen(false)}
        mode={reportMode}
        targetUserId={profile?.userId}
        targetUserName={profile?.nickname}
        onSubmitted={() => {
        // 신고 후 필요하면 여기서 UI 갱신 같은거 추가 가능
        }}
    />
    </div>


    );
}