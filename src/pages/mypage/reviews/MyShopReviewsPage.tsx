// pages/mypage/reviews/MyShopReviewsPage.tsx
import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ChevronLeft, Star, Edit3, ShoppingBag, Clock, Tag, MessageSquare, ChevronRight, Store, X } from "lucide-react";
import { fetchMyPendingReviews, fetchMyReviews, fetchReviewDetail } from "./reviewApi";
import {
  REVIEW_TAG_LABEL,
  formatKST,
  unwrap,
  type PendingReviewRowDto,
  type ReviewListDto,
  type SpringPage,
  type ReviewTag,
  type ReviewDetailDto,
} from "./reviewTypes";
import ReviewWriteModal from "./ReviewWriteModal";

function isReviewTag(x: unknown): x is ReviewTag {
  return typeof x === "string" && x in REVIEW_TAG_LABEL;
}

type TabKey = "PENDING" | "MINE";

export default function MyShopReviewsPage() {
  const nav = useNavigate();
  const token = useMemo(() => localStorage.getItem("accessToken") ?? "", []);

  const [tab, setTab] = useState<TabKey>("PENDING");

  const [pPage, setPPage] = useState(0);
  const [pending, setPending] = useState<SpringPage<PendingReviewRowDto> | null>(null);

  const [mPage, setMPage] = useState(0);
  const [mine, setMine] = useState<SpringPage<ReviewListDto> | null>(null);

  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  
  const [writeOpen, setWriteOpen] = useState(false);
  const [writeTarget, setWriteTarget] = useState<PendingReviewRowDto | null>(null);

  const [detailOpen, setDetailOpen] = useState(false);
  const [detailId, setDetailId] = useState<number | null>(null);
  const [detail, setDetail] = useState<ReviewDetailDto | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [detailErr, setDetailErr] = useState<string | null>(null);

  const [lbOpen, setLbOpen] = useState(false);
  const [lbIndex, setLbIndex] = useState(0);
  function openDetail(id: number) {
    setDetailId(id);
    setDetailOpen(true);
  }
  const detailImageUrls = (detail?.images ?? [])
    .slice()
    .sort((a: any, b: any) => (a.position ?? 0) - (b.position ?? 0))
    .map((x: any) => x.url);
  function closeDetail() {
    setDetailOpen(false);
    setDetailId(null);
    setDetail(null);
    setDetailErr(null);
    setDetailLoading(false);
    setLbOpen(false);
    setLbIndex(0);
  }

  // 이미지 상세보기를 위한 라이트박스
  function openLightbox(index: number) {
    setLbIndex(index);
    setLbOpen(true);
  }

  async function loadPending() {
    setErr(null);
    setLoading(true);
    try {
      const res = await fetchMyPendingReviews(token, pPage, 10);
      const pageObj = unwrap<SpringPage<PendingReviewRowDto>>(res);
      setPending(pageObj);
    } catch (e: any) {
      const msg = String(e?.message ?? e);
      if (msg.includes("AUTH_REQUIRED")) {
        alert("로그인이 필요합니다.");
        nav("/login");
        return;
      }
      setErr(msg);
    } finally {
      setLoading(false);
    }
  }

  async function loadMine() {
    setErr(null);
    setLoading(true);
    try {
      const res = await fetchMyReviews(token, mPage, 10);
      const pageObj = unwrap<SpringPage<ReviewListDto>>(res);
      setMine(pageObj);
    } catch (e: any) {
      const msg = String(e?.message ?? e);
      if (msg.includes("AUTH_REQUIRED")) {
        alert("로그인이 필요합니다.");
        nav("/login");
        return;
      }
      setErr(msg);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (!token) {
      alert("로그인이 필요합니다.");
      nav("/login");
      return;
    }
  }, [token]);

  useEffect(() => {
    if (tab === "PENDING") loadPending();
  }, [tab, pPage]);

  useEffect(() => {
    if (tab === "MINE") loadMine();
  }, [tab, mPage]);

  useEffect(() => {
    if (!detailOpen || detailId == null) return;

    const ac = new AbortController();

    (async () => {
      setDetailLoading(true);
      setDetailErr(null);
      try {
        const res = await fetchReviewDetail(token, detailId, ac.signal);
        const dto = unwrap<ReviewDetailDto>(res);
        // const dto = unwrap(res);
        setDetail(dto);
      } catch (e: any) {
        const msg = String(e?.message ?? e);
        if (msg.includes("AUTH_REQUIRED")) {
          alert("로그인이 필요합니다.");
          nav("/login");
          return;
        }
        if (!ac.signal.aborted) setDetailErr(msg);
      } finally {
        if (!ac.signal.aborted) setDetailLoading(false);
      }
    })();

    return () => ac.abort();

  }, [detailOpen, detailId]);

  const pendingRows = pending?.content ?? [];
  const myRows = mine?.content ?? [];

  return (
    <div className="min-h-screen bg-[#F9FAFB] pb-20">
      <div className="sticky top-0 z-10 bg-white/80 backdrop-blur-md border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <button
            onClick={() => nav(-1)}
            className="flex items-center gap-2 text-gray-600 hover:text-gray-900 transition font-medium"
          >
            <ChevronLeft className="w-5 h-5" />
            <span className="text-sm">돌아가기</span>
          </button>
          <div className="font-bold text-gray-900 text-lg">내 상점 후기</div>
          <div className="w-20" />
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
        
        <div className="relative mb-8 bg-white rounded-3xl border border-gray-100 p-6 overflow-hidden">
          <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight">리뷰 관리</h1>
          
          <p className="text-gray-500 text-sm mt-1">
            낙찰받은 상품의 후기를 작성하거나, 내가 쓴 후기를 관리할 수 있습니다.
          </p>
        </div>

        <div className="flex items-center gap-8 border-b border-gray-200 mb-6">
          <TabButton 
            active={tab === "PENDING"} 
            onClick={() => { setTab("PENDING"); setPPage(0); }} 
            label="작성 대기" 
            count={pending?.totalElements}
          />
          <TabButton 
            active={tab === "MINE"} 
            onClick={() => { setTab("MINE"); setMPage(0); }} 
            label="내가 쓴 리뷰" 
            count={mine?.totalElements}
          />
        </div>

        <div className="animate-fade-in-up">
          {loading && (
             <div className="py-20 text-center">
             <div className="animate-spin w-8 h-8 border-4 border-[rgba(118,90,255,0.25)] border-t-[rgb(118,90,255)] rounded-full mx-auto mb-4" />
             <p className="text-gray-500 text-sm">정보를 불러오고 있습니다...</p>
           </div>
          )}

          {err && (
            <div className="mb-6 p-4 rounded-xl bg-rose-50 border border-rose-100 text-rose-600 text-sm font-medium text-center">
              {err}
            </div>
          )}

          {!loading && !err && (
            <>
              {tab === "PENDING" && (
                <div className="space-y-4">
                  {pendingRows.length === 0 ? (
                    <EmptyBox 
                      title="작성할 리뷰가 없습니다" 
                      desc="낙찰받은 상품의 거래가 완료되면 리뷰를 작성할 수 있습니다." 
                    />
                  ) : (
                    pendingRows.map((r) => (
                      <PendingReviewCard
                        key={r.productId}
                        data={r}
                        onReview={() => { setWriteTarget(r); setWriteOpen(true); }}
                        onViewProduct={() => nav(`/auction_detail/${r.productId}`)}
                        onViewSeller={() => {
                          const sellerUserId = (r as any).sellerUserId ?? (r as any).sellerId;
                          if (sellerUserId == null) return;
                          nav(`/user/profile/${sellerUserId}`);
                        }}
                      />
                    ))
                  )}

                  {pending && pending.totalPages > 1 && (
                    <Pager
                      page={pending.number}
                      totalPages={pending.totalPages}
                      onPrev={() => setPPage((p) => Math.max(0, p - 1))}
                      onNext={() => setPPage((p) => Math.min(pending.totalPages - 1, p + 1))}
                    />
                  )}
                </div>
              )}

              {tab === "MINE" && (
                <div className="space-y-4">
                  {myRows.length === 0 ? (
                    <EmptyBox 
                      title="작성한 리뷰가 없습니다" 
                      desc="소중한 거래 후기를 남겨보세요." 
                    />
                  ) : (
                    myRows.map((r) => (
                      <WrittenReviewCard
                        key={r.reviewId}
                        data={r}
                        onViewProduct={() => nav(`/auction_detail/${r.productId}`)}
                        onOpenDetail={() => openDetail(r.reviewId)}
                      />
                    ))
                  )}

                  {mine && mine.totalPages > 1 && (
                    <Pager
                      page={mine.number}
                      totalPages={mine.totalPages}
                      onPrev={() => setMPage((p) => Math.max(0, p - 1))}
                      onNext={() => setMPage((p) => Math.min(mine.totalPages - 1, p + 1))}
                    />
                  )}
                </div>
              )}
            </>
          )}
          <ReviewWriteModal
            open={writeOpen}
            token={token}
            target={writeTarget}
            onClose={() => setWriteOpen(false)}
            onSubmitted={async () => {
              setWriteOpen(false);
              setPPage(0);
              setMPage(0);
              setTab("MINE");
              try {
                const p = await fetchMyPendingReviews(token, 0, 10);
                setPending(p);
              } catch {}
              try {
                const m = await fetchMyReviews(token, 0, 10);
                setMine(m);
              } catch {}
            }}
          />

          <ReviewDetailModal
            open={detailOpen}
            loading={detailLoading}
            err={detailErr}
            data={detail}
            onClose={closeDetail}
            onGoProduct={(pid) => nav(`/auction_detail/${pid}`)}
            onGoSeller={(sid) => nav(`/user/profile/${sid}`)}
            onOpenLightbox={(idx) => openLightbox(idx)}
          />

          <Lightbox
            open={lbOpen}
            urls={detailImageUrls}
            index={lbIndex}
            setIndex={(v: any) => setLbIndex(typeof v === "number" ? v : v(lbIndex))}
            onClose={() => setLbOpen(false)}
          />
        </div>
      </div>
    </div>
    
  );
}

function TabButton({ active, onClick, label, count }: { active: boolean; onClick: () => void; label: string; count?: number }) {
  return (
    <button
      onClick={onClick}
      className={`pb-3 px-1 text-sm font-bold relative transition-colors flex items-center gap-1.5 ${
        active ? "text-[rgb(118,90,255)]" : "text-gray-400 hover:text-gray-600"
        
      }`}
    >
      <span>{label}</span>
      {/* {count !== undefined && (
        <span className={`px-1.5 py-0.5 rounded-full text-[10px] ${
          active ? "bg-violet-100 text-violet-700" : "bg-gray-100 text-gray-500"
        }`}>
          {count}
        </span>
      )} */}
      {active && (
        <div className="absolute bottom-0 left-0 w-full h-0.5 bg-[rgb(118,90,255)] rounded-t-full" />
      )}
    </button>
  );
}

function PendingReviewCard({ data, onReview, onViewProduct, onViewSeller,}: { data: PendingReviewRowDto; onReview: () => void; onViewProduct: () => void; onViewSeller: () => void;}) {
  return (
    <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm hover:shadow-md transition-shadow flex flex-col sm:flex-row sm:items-center justify-between gap-4 group">
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1">
          <span className="px-2 py-0.5 rounded-md bg-gray-100 text-gray-500 text-[10px] font-bold">
            거래완료
          </span>
          <span className="text-xs text-gray-400 flex items-center gap-1">
            <Clock className="w-3 h-3" />
            {formatKST(data.auctionEndTime)}
          </span>
        </div>
        
        <button
          type="button"
          onClick={onViewProduct}
          className="text-left font-bold text-gray-900 text-lg truncate hover:underline underline-offset-4 decoration-gray-300 hover:decoration-gray-900 transition-colors hover:text-[rgb(118,90,255)]"
          title="상품 상세로 이동"
        >
          {data.productName}
        </button>
        
        <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-gray-500">
          <button
            type="button"
            onClick={onViewSeller}
            title="판매자 공용 프로필 보기"
            className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-[rgb(118,90,255)] hover:underline underline-offset-4 decoration-gray-300 transition"
          >
            <Store className="w-3.5 h-3.5" /> 
            <span className="font-semibold text-gray-700"> {(data.sellerNick ?? "알 수 없음") + "님 상점"} </span>
          </button>
          <div className="w-px h-3 bg-gray-200" />
          <div className="flex items-center gap-1">
            <span className="font-semibold text-gray-900">{Number(data.winnerBidAmount ?? 0).toLocaleString()}</span>
            <span>원</span>
          </div>
        </div>
      </div>

      <button
        onClick={onReview}
        className="flex-shrink-0 flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-[rgb(118,90,255)] text-white text-sm font-bold hover:brightness-95 shadow-[0_10px_25px_-15px_rgba(118,90,255,0.45)] active:scale-95 transition-all shadow-sm hover:shadow-[0_10px_25px_-15px_rgba(118,90,255,0.35)]"
      >
        <Edit3 className="w-4 h-4" />
        리뷰 쓰기
      </button>
    </div>
  );
}

function WrittenReviewCard({ data, onViewProduct, onOpenDetail, }: { data: ReviewListDto; onViewProduct: () => void; onOpenDetail: () => void; }) {
  return (
    <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-1 bg-violet-50 px-2 py-1 rounded-lg">
          <Star className="w-4 h-4 text-violet-600" fill="currentColor" />
          <span className="font-extrabold text-[rgb(118,90,255)] text-sm">{Number(data.rating ?? 0).toFixed(1)}</span>
        </div>

        <div className="flex items-center gap-2">
          <div className="text-xs text-gray-400 font-medium">
            {formatKST(data.createdAt)}
          </div>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onOpenDetail();
            }}
            className="px-2.5 py-1 rounded-lg bg-gray-100 text-xs font-bold text-gray-600 hover:bg-gray-200 transition"
          >
            상세
          </button>
        </div>
      </div>


      <div className="flex items-center gap-2 mb-4 text-sm text-gray-500 hover:text-gray-900 transition-colors cursor-pointer w-fit" onClick={onViewProduct}>
        <ShoppingBag className="w-4 h-4" />
        <span className="font-semibold underline decoration-gray-300 underline-offset-2 hover:decoration-gray-900">
          {data.productName}
        </span>
        <ChevronRight className="w-3 h-3 text-gray-300" />
      </div>

      {data.content && (
        <div className="bg-gray-50 p-4 rounded-xl text-gray-700 text-sm leading-relaxed mb-4">
          {data.content}
        </div>
      )}

      {data.tags && data.tags.length > 0 && (
        <div className="flex flex-wrap gap-2.5">
          {data.tags.slice(0, 8).map((t) => (
            <span
              key={t}
              className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-[rgba(118,90,255,0.08)] border border-[rgba(118,90,255,0.25)] text-xs font-semibold text-gray-800 shadow-sm hover:bg-[rgba(118,90,255,0.12)] hover:border-[rgba(118,90,255,0.35)] transition"
            >
              <Tag className="w-3 h-3 text-[rgb(118,90,255)]" />
              {isReviewTag(t) ? REVIEW_TAG_LABEL[t] : String(t)}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}

function EmptyBox({ title, desc }: { title: string; desc: string }) {
  return (
    <div className="py-20 text-center bg-white rounded-3xl border border-gray-100 shadow-sm flex flex-col items-center justify-center">
      <div className="w-16 h-16 bg-gray-50 rounded-2xl flex items-center justify-center mb-4">
        <MessageSquare className="w-8 h-8 text-gray-300" />
      </div>
      <div className="text-gray-900 font-bold text-lg mb-1">{title}</div>
      <div className="text-gray-500 text-sm">{desc}</div>
    </div>
  );
}

function Pager(props: { page: number; totalPages: number; onPrev: () => void; onNext: () => void }) {
  const { page, totalPages, onPrev, onNext } = props;
  return (
    <div className="mt-8 flex justify-center items-center gap-3">
      <button
        disabled={page === 0}
        onClick={onPrev}
        className="px-4 py-2 rounded-xl bg-white border border-gray-200 text-sm font-medium text-gray-600 hover:bg-gray-50 hover:text-gray-900 disabled:opacity-50 disabled:cursor-not-allowed transition shadow-sm"
      >
        이전
      </button>
      <span className="text-sm font-bold text-gray-900 px-2">
        {page + 1} <span className="text-gray-400 font-normal">/</span> {totalPages}
      </span>
      <button 
        disabled={page >= totalPages - 1}
        onClick={onNext}
        className="px-4 py-2 rounded-xl bg-white border border-gray-200 text-sm font-medium text-gray-600 hover:bg-gray-50 hover:text-gray-900 disabled:opacity-50 disabled:cursor-not-allowed transition shadow-sm"
      >
        다음
      </button>
    </div>
  );
}

function ReviewDetailModal(props: {
  open: boolean;
  loading: boolean;
  err: string | null;
  data: any | null;
  onClose: () => void;
  onGoProduct: (productId: number) => void;
  onGoSeller: (sellerId: number) => void;
  onOpenLightbox: (index: number) => void;
}) {
  const { open, loading, err, data, onClose, onGoProduct, onGoSeller, onOpenLightbox } = props;

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [open]);

  if (!open) return null;

  const images = (data?.images ?? [])
    .slice()
    .sort((a: any, b: any) => (a.position ?? 0) - (b.position ?? 0));

  const MAX_SLOTS = 12; // 6 x 2
  const thumbs = images.slice(0, MAX_SLOTS);
  const extra = Math.max(0, images.length - MAX_SLOTS);
  const placeholders = Math.max(0, MAX_SLOTS - thumbs.length);
  return (
    <div className="fixed inset-0 z-50">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />

      <div
        className="absolute inset-0 flex items-center justify-center p-4"
        onClick={onClose}
      >
        <div
          className="w-[min(92vw,720px)] max-h-[88vh] overflow-hidden bg-white rounded-3xl shadow-2xl border border-gray-100"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="sticky top-0 bg-white/90 backdrop-blur border-b border-gray-100 px-5 py-4 flex items-center justify-between">
            <div className="min-w-0">
              <div className="text-xs text-gray-400 font-bold">리뷰 상세</div>
              <div className="font-extrabold text-gray-900 truncate">
                {data?.productName ?? (loading ? "불러오는 중..." : "리뷰")}
              </div>
            </div>

            <button
              type="button"
              onClick={onClose}
              className="w-9 h-9 rounded-xl bg-gray-100 hover:bg-gray-200 transition flex items-center justify-center"
              aria-label="닫기"
            >
              <X className="w-5 h-5 text-gray-700" />
            </button>
          </div>

          <div className="p-5 overflow-y-auto max-h-[calc(88vh-72px)]">
            {loading && (
              <div className="py-12 text-center text-sm text-gray-500">
                불러오는 중...
              </div>
            )}

            {!loading && err && (
              <div className="mb-4 p-4 rounded-xl bg-rose-50 border border-rose-100 text-rose-700 text-sm font-bold">
                {err}
              </div>
            )}

            {!loading && !err && data && (
              <>
                <div className="flex items-center justify-between gap-3 mb-4">
                  <div className="flex items-center gap-2 bg-[rgba(118,90,255,0.08)] px-3 py-2 rounded-2xl">
                    <Star className="w-5 h-5 text-[rgb(118,90,255)]" fill="currentColor" />
                    <span className="text-[rgb(118,90,255)] font-extrabold">
                      {Number(data.rating ?? 0).toFixed(1)}
                    </span>
                  </div>
                  <div className="text-xs text-gray-400 font-semibold">
                    {formatKST(data.createdAt)}
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mb-5">
                  <button 
                    type="button" 
                    onClick={() => onGoProduct(data.productId)} 
                    className="
                      w-full inline-flex items-center justify-center gap-2
                      px-4 py-2.5 rounded-2xl
                      bg-[rgb(118,90,255)] text-white text-sm font-extrabold shadow-[0_10px_25px_-15px_rgba(118,90,255,0.45)]
                      hover:brightness-95 active:scale-[0.98]
                      transition-all
                      focus-visible:outline-none 
                      focus-visible:ring-2 focus-visible:ring-[rgba(118,90,255,0.35)] focus-visible:ring-offset-2
                    " 
                  > 
                    상품으로 이동 
                  </button>

                  <button
                    type="button"
                    onClick={() => onGoSeller(data.sellerId)}
                    className="
                      w-full inline-flex items-center justify-center gap-2
                      px-4 py-2.5 rounded-2xl
                      bg-white border border-[rgba(118,90,255,0.35)]
                      text-[rgb(118,90,255)] text-sm font-extrabold
                      shadow-sm
                      hover:bg-[rgba(118,90,255,0.08)] hover:border-[rgba(118,90,255,0.45)]
                      active:scale-[0.98]
                      transition-all
                      focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[rgba(118,90,255,0.25)] focus-visible:ring-offset-2
                    "
                  >
                    <Store className="w-4 h-4 text-[rgb(118,90,255)]" />
                    <span className="min-w-0 truncate">{data.sellerNick}님 상점</span>
                  </button>
                </div>

                {data.content ? (
                  <div className="bg-gray-50 p-4 rounded-2xl text-gray-800 text-sm leading-relaxed mb-5">
                    {data.content}
                  </div>
                ) : (
                  <div className="bg-gray-50 p-4 rounded-2xl text-gray-400 text-sm mb-5">
                    작성된 내용이 없습니다.
                  </div>
                )}

                {data.tags && data.tags.length > 0 && (
                  <div className="flex flex-wrap gap-2.5 mb-5">
                    {data.tags.slice(0, 10).map((t: any) => (
                      <span
                        key={t}
                        className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg
                                  bg-[rgba(118,90,255,0.10)] border border-[rgba(118,90,255,0.30)]
                                  text-xs font-semibold text-gray-900"
                      >
                        <Tag className="w-3 h-3 text-[rgb(118,90,255)]" />
                        {REVIEW_TAG_LABEL[t]}
                      </span>
                    ))}
                  </div>
                )}

                {images.length > 0 && (
                  <button
                    type="button"
                    onClick={() => onOpenLightbox(0)}
                    className="text-xs font-bold text-[rgb(118,90,255)] hover:underline underline-offset-4"
                  >
                    전체 보기
                  </button>
                )}
                <div className="grid grid-cols-6 grid-rows-2 gap-2 h-[240px]"> {thumbs.map((img: any, idx: number) => ( <button key={img.id} type="button" onClick={() => onOpenLightbox(idx)} className="relative rounded-2xl overflow-hidden border border-gray-100 bg-gray-50 group" aria-label="이미지 확대 보기" > <img src={img.url} className="w-full h-full object-cover group-hover:scale-[1.02] transition" />
                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition" />

                    {extra > 0 && idx === MAX_SLOTS - 1 && (
                      <div className="absolute inset-0 bg-black/45 flex items-center justify-center">
                        <div className="px-3 py-1.5 rounded-full bg-black/35 text-white text-xs font-extrabold">
                          +{extra}
                        </div>
                      </div>
                    )}
                  </button>
                ))}

                {Array.from({ length: placeholders }).map((_, i) => (
                  <div
                    key={`ph-${i}`}
                    className="rounded-2xl border border-dashed border-gray-200 bg-gray-50"
                  />
                ))}
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function Lightbox(props: {
  open: boolean;
  urls: string[];
  index: number;
  setIndex: (v: number) => void;
  onClose: () => void;
}) {
  const { open, urls, index, setIndex, onClose } = props;

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
      if (e.key === "ArrowLeft") setIndex((index - 1 + urls.length) % urls.length);
      if (e.key === "ArrowRight") setIndex((index + 1) % urls.length);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, index, urls.length, onClose, setIndex]);

  if (!open || urls.length === 0) return null;

  const prev = () => setIndex((index - 1 + urls.length) % urls.length);
  const next = () => setIndex((index + 1) % urls.length);

  return (
    <div className="fixed inset-0 z-[60]">
      <div className="absolute inset-0 bg-black/80" onClick={onClose} />

      <div className="absolute inset-0 flex items-center justify-center p-4" onClick={onClose}>
        <div className="relative w-[min(96vw,980px)] max-h-[90vh]" onClick={(e) => e.stopPropagation()}>
          <img
            src={urls[index]}
            className="w-full max-h-[90vh] object-contain rounded-2xl shadow-2xl"
          />

          <button
            type="button"
            onClick={onClose}
            className = "absolute top-3 right-3 w-10 h-10 rounded-xl bg-black/45 hover:bg-black/60 border border-white/20 backdrop-blur transition flex items-center justify-center shadow-lg"
            aria-label="닫기"
          >
            <X className="w-6 h-6 text-white" />
          </button>

          {urls.length > 1 && (
            <>
              <button
                type="button"
                onClick={prev}
                className="absolute left-3 top-1/2 -translate-y-1/2 w-11 h-11 rounded-2xl bg-black/45 hover:bg-black/60 border border-white/20 backdrop-blur transition flex items-center justify-center shadow-lg"
                aria-label="이전 이미지"
              >
                <ChevronLeft className="w-7 h-7 text-white" />
              </button>

              <button
                type="button"
                onClick={next}
                className="absolute right-3 top-1/2 -translate-y-1/2 w-11 h-11 rounded-2xl bg-black/45 hover:bg-black/60 border border-white/20 backdrop-blur transition flex items-center justify-center shadow-lg"
                aria-label="다음 이미지"
              >
                <ChevronRight className="w-7 h-7 text-white" />
              </button>

              <div className = "absolute bottom-3 left-1/2 -translate-x-1/2 px-3 py-1.5 rounded-full bg-black/45 border border-white/20 backdrop-blur text-white text-xs font-bold shadow-lg">
                {index + 1} / {urls.length}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );

}