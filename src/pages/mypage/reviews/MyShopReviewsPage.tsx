import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { 
  ChevronLeft, 
  Star, 
  Edit3, 
  ShoppingBag, 
  User, 
  Clock, 
  Tag, 
  MessageSquare,
  ChevronRight
} from "lucide-react";
import { fetchMyPendingReviews, fetchMyReviews } from "./reviewApi";
import { 
  REVIEW_TAG_LABEL, 
  formatKST, 
  unwrap, 
  type PendingReviewRowDto, 
  type ReviewListDto, 
  type SpringPage 
} from "./reviewTypes";
import ReviewWriteModal from "./ReviewWriteModal";

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

  const pendingRows = pending?.content ?? [];
  const myRows = mine?.content ?? [];

  return (
    <div className="min-h-screen bg-[#F9FAFB] pb-20">
      <div className="sticky top-0 z-10 bg-white/80 backdrop-blur-md border-b border-gray-100">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
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

      <div className="max-w-3xl mx-auto px-4 sm:px-6 py-8">
        
        <div className="mb-8">
          <h1 className="text-2xl font-extrabold text-gray-900">리뷰 관리</h1>
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
             <div className="animate-spin w-8 h-8 border-4 border-violet-200 border-t-violet-600 rounded-full mx-auto mb-4" />
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
                      <PendingReviewCard key={r.productId} data={r} onReview={() => {setWriteTarget(r); setWriteOpen(true);}} />
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
                      <WrittenReviewCard key={r.reviewId} data={r} onViewProduct={() => nav(`/auction_detail/${r.productId}`)} />
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
        active ? "text-violet-600" : "text-gray-400 hover:text-gray-600"
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
      {active && <div className="absolute bottom-0 left-0 w-full h-0.5 bg-violet-600 rounded-t-full" />}
    </button>
  );
}

function PendingReviewCard({ data, onReview }: { data: PendingReviewRowDto; onReview: () => void }) {
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
        
        <h3 className="font-bold text-gray-900 text-lg truncate group-hover:text-violet-600 transition-colors">
          {data.productName}
        </h3>
        
        <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-gray-500">
          <div className="flex items-center gap-1">
            <User className="w-3.5 h-3.5" />
            <span>{data.sellerNick ?? "알 수 없음"}</span>
          </div>
          <div className="w-px h-3 bg-gray-200" />
          <div className="flex items-center gap-1">
            <span className="font-semibold text-gray-900">{Number(data.winnerBidAmount ?? 0).toLocaleString()}</span>
            <span>원</span>
          </div>
        </div>
      </div>

      <button
        onClick={onReview}
        className="flex-shrink-0 flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-violet-600 text-white text-sm font-bold hover:bg-violet-700 active:scale-95 transition-all shadow-sm hover:shadow-violet-200"
      >
        <Edit3 className="w-4 h-4" />
        리뷰 쓰기
      </button>
    </div>
  );
}

function WrittenReviewCard({ data, onViewProduct }: { data: ReviewListDto; onViewProduct: () => void }) {
  return (
    <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-1 bg-violet-50 px-2 py-1 rounded-lg">
          <Star className="w-4 h-4 text-violet-600" fill="currentColor" />
          <span className="font-extrabold text-violet-700 text-sm">{Number(data.rating ?? 0).toFixed(1)}</span>
        </div>
        <div className="text-xs text-gray-400 font-medium">
          {formatKST(data.createdAt)}
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
        <div className="flex flex-wrap gap-2">
          {data.tags.slice(0, 8).map((t) => (
            <span
              key={t}
              className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-white border border-gray-200 text-xs font-medium text-gray-600 shadow-sm"
            >
              <Tag className="w-3 h-3 text-gray-400" />
              {REVIEW_TAG_LABEL[t]}
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

