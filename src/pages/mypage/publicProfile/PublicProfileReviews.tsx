import React, { useEffect, useState } from "react";
import { Star, Tag } from "lucide-react";
import placeholderImg from "@/assets/images/PlaceHolder.jpg";
import { fetchSellerReviews, fetchSellerReviewSummary } from "@/pages/mypage/reviews/reviewApi";
import {
REVIEW_TAG_LABEL,
formatKST,
type ReviewListDto,
type ReviewSellerSummaryDto,
type SpringPage,
} from "@/pages/mypage/reviews/reviewTypes";

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
<div className="animate-spin w-8 h-8 border-4 border-violet-200 border-t-violet-600 rounded-full mx-auto mb-4" />
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
<div className="flex items-center gap-2 bg-violet-50 px-3 py-2 rounded-2xl">
<Star className="w-4 h-4 text-violet-600" fill="currentColor" />
<span className="font-extrabold text-violet-700 text-sm">
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
    rows.map((r) => <ReviewCard key={r.reviewId} r={r} />)
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
</div>


);
}

function ReviewCard({ r }: { r: ReviewListDto }) {
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

        <div className="flex items-center gap-1 bg-violet-50 px-2 py-1 rounded-xl">
          <Star className="w-4 h-4 text-violet-600" fill="currentColor" />
          <span className="font-extrabold text-violet-700 text-sm">
            {Number(r.rating ?? 0).toFixed(1)}
          </span>
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
        <div className="mt-3 flex flex-wrap gap-2">
          {r.tags.slice(0, 8).map((t) => (
            <span
              key={t}
              className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-white border border-gray-200 text-xs font-semibold text-gray-600"
            >
              <Tag className="w-3 h-3 text-gray-400" />
              {REVIEW_TAG_LABEL[t as any] ?? t}
            </span>
          ))}
        </div>
      ) : null}
    </div>
  </div>
</div>


);
}