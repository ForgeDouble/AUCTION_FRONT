// pages/mypage/publicProfile/PublicProfileReview.tsx
import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Star, Tag, X, Store, ChevronLeft, ChevronRight } from "lucide-react";
import placeholderImg from "@/assets/images/PlaceHolder.jpg";
import { fetchSellerReviews, fetchSellerReviewSummary, fetchReviewDetail } from "@/pages/mypage/reviews/reviewApi";
import {
  unwrap,
  REVIEW_TAG_LABEL,
  formatKST,
  type ReviewDetailDto,
  type ReviewListDto,
  type ReviewSellerSummaryDto,
  type SpringPage,
  type ReviewTag,
} from "@/pages/mypage/reviews/reviewTypes";

function isReviewTag(x: unknown): x is ReviewTag {
  return typeof x === "string" && x in REVIEW_TAG_LABEL;
}

export default function PublicProfileReviews(props: {
  token: string;
  sellerId: number;
}) {
  const { token, sellerId } = props;

  const [page, setPage] = useState(0);
  const [data, setData] = useState<SpringPage<ReviewListDto> | null>(null);
  const [summary, setSummary] = useState<ReviewSellerSummaryDto | null>(null);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const nav = useNavigate();

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

  function closeDetail() {
    setDetailOpen(false);
    setDetailId(null);
    setDetail(null);
    setDetailErr(null);
    setDetailLoading(false);
    setLbOpen(false);
    setLbIndex(0);
  }

  function openLightbox(index: number) {
    setLbIndex(index);
    setLbOpen(true);
  }

  const detailImageUrls = (detail?.images ?? [])
    .slice()
    .sort((a: any, b: any) => (a.position ?? 0) - (b.position ?? 0))
    .map((x: any) => x.url);

  const load = async () => {
    setErr(null);
    setLoading(true);
    try {
      const [p, s] = await Promise.all([
        fetchSellerReviews(token, sellerId, page, 10),
        fetchSellerReviewSummary(token, sellerId),
      ]);
      setData(p);
      setSummary(s);
    } catch (e: any) {
      setErr(String(e?.message ?? e));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!detailOpen || detailId == null) return;

    const ac = new AbortController();

    (async () => {
      setDetailLoading(true);
      setDetailErr(null);
      try {
        const res = await fetchReviewDetail(token, detailId, ac.signal);
        const dto = unwrap(res);
        setDetail(dto);
      } catch (e: any) {
        const msg = String(e?.message ?? e);
        if (!ac.signal.aborted) setDetailErr(msg);
      } finally {
        if (!ac.signal.aborted) setDetailLoading(false);
      }
    })();

    return () => ac.abort();
  }, [detailOpen, detailId, token]);


  useEffect(() => {
    if (!token) return;
    load();
  }, [token, sellerId, page]);

  if (!token) {
    return (
      <div className="bg-white rounded-3xl border border-gray-100 p-10 text-center text-sm text-gray-500">
        로그인이 필요합니다.
      </div>
    );
  }

  if (loading) {
    return (
      <div className="py-20 text-center">
        <div className="animate-spin w-8 h-8 border-4 border-[rgba(118,90,255,0.25)] border-t-[rgb(118,90,255)] rounded-full mx-auto mb-4" />
        <p className="text-gray-500 text-sm">리뷰를 불러오고 있습니다...</p>
      </div>
    );
  }

  if (err) {
    return (
      <div className="p-5 rounded-2xl bg-rose-50 border border-rose-100 text-rose-700 text-sm font-semibold">
        {err}
      </div>
    );
  }

  const rows = data?.content ?? [];
  return (
  <div className="space-y-4">
  {/* Summary */}
  <div className="bg-white rounded-3xl border border-gray-100 p-6 flex items-center justify-between">
    <div>
      <div className="text-sm font-bold text-gray-900">받은 리뷰</div>
        <div className="text-xs text-gray-500 mt-1">
          총 {summary?.reviewCount ?? 0}개
        </div>
      </div>
      <div className="flex items-center gap-2 bg-[rgba(118,90,255,0.08)] px-3 py-2 rounded-2xl">
        <Star className="w-4 h-4 text-[rgb(118,90,255)]" fill="currentColor" />
        <span className="font-extrabold text-[rgb(118,90,255)] text-sm">
          {(summary?.avgRating ?? 0).toFixed(1)}
        </span>
      </div>
    </div>

    {/* List */}
    {rows.length === 0 ? (
      <div className="bg-white rounded-3xl border border-gray-100 p-12 text-center text-gray-500 text-sm">
        아직 받은 리뷰가 없습니다.
      </div>
    ) : (
      rows.map((r) => (
        <ReviewCard
          key={r.reviewId}
          r={r}
          onOpenDetail={() => openDetail(r.reviewId)}
        />
      ))
    )}

    {/* Pager */}
    {data && data.totalPages > 1 && (
      <div className="mt-8 flex justify-center items-center gap-3">
        <button
          disabled={page === 0}
          onClick={() => setPage((p) => Math.max(0, p - 1))}
          className="px-4 py-2 rounded-xl bg-white border border-gray-200 text-sm font-medium text-gray-600 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition shadow-sm"
        >
          이전
        </button>
        <span className="text-sm font-bold text-gray-900 px-2">
          {page + 1} <span className="text-gray-400 font-normal">/</span> {data.totalPages}
        </span>
        <button
          disabled={page >= data.totalPages - 1}
          onClick={() => setPage((p) => Math.min(data.totalPages - 1, p + 1))}
          className="px-4 py-2 rounded-xl bg-white border border-gray-200 text-sm font-medium text-gray-600 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition shadow-sm"
        >
          다음
        </button>
      </div>
    )}
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
      setIndex={(v: any) =>
        setLbIndex(typeof v === "number" ? v : v(lbIndex))
      }
      onClose={() => setLbOpen(false)}
    />
  </div>
  
  );
  
}

function ReviewCard({ r, onOpenDetail }: { r: ReviewListDto; onOpenDetail: () => void }) {
  const thumb = r.firstImageUrl || null;

  return (
    <div className="bg-white rounded-3xl border border-gray-100 p-6 shadow-sm hover:shadow-md transition-shadow">
      <div className="flex gap-4">
      {/* ✅ firstImageUrl 썸네일 */}
        <div className="w-24 h-24 rounded-2xl overflow-hidden bg-gray-100 flex-shrink-0">
          <img
            src={thumb ?? placeholderImg}
            alt="review thumb"
            className="w-full h-full object-cover"
          />
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-2 min-w-0">
              <div className="w-8 h-8 rounded-full bg-gray-100 overflow-hidden flex-shrink-0">
                {r.reviewerProfileImageUrl ? (
                  <img
                    src={r.reviewerProfileImageUrl}
                    alt="reviewer"
                    className="w-full h-full object-cover"
                  />
                ) : null}
              </div>
              <div className="min-w-0">
                <div className="text-sm font-extrabold text-gray-900 truncate">
                  {r.reviewerNick}
                </div>
                <div className="text-[11px] text-gray-400">{formatKST(r.createdAt)}</div>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <div className="flex items-center gap-1 bg-[rgba(118,90,255,0.08)] px-2 py-1 rounded-xl">
                <Star className="w-4 h-4 text-[rgb(118,90,255)]" fill="currentColor" />
                <span className="font-extrabold text-[rgb(118,90,255)] text-sm">
                  {Number(r.rating ?? 0).toFixed(1)}
                </span>
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

          {r.content ? (
            <div className="mt-3 text-sm text-gray-700 bg-gray-50 rounded-2xl p-4 leading-relaxed">
              {r.content}
            </div>
          ) : (
            <div className="mt-3 text-sm text-gray-400">내용 없음</div>
          )}

          {r.tags?.length ? (
            <div className="mt-3 flex flex-wrap gap-2.5">
              {r.tags.slice(0, 8).map((t) => (
                <span
                  key={String(t)}
                  className="
                    inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg
                    bg-[rgba(118,90,255,0.08)] border border-[rgba(118,90,255,0.25)]
                    text-xs font-semibold text-gray-800 shadow-sm
                    hover:bg-[rgba(118,90,255,0.12)] hover:border-[rgba(118,90,255,0.35)]
                    hover:shadow-md hover:-translate-y-0.3
                    transition-all cursor-default select-none
                  "
                >
                  <Tag className="w-3 h-3 text-[rgb(118,90,255)]" />
                  {isReviewTag(t) ? REVIEW_TAG_LABEL[t] : String(t)}
                </span>
              ))}
            </div>
          ) : null}
        </div>
      </div>
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
                        {isReviewTag(t) ? REVIEW_TAG_LABEL[t] : String(t)}
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