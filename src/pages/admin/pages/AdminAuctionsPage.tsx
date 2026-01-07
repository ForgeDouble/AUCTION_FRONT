//  src/pages/admin/pages/AdminAuctionsPage.tsx
import React, { useEffect, useMemo, useState } from "react";
import { Ban, Eye, XCircle } from "lucide-react";
import { useAdminStore } from "../AdminContext";
import { SectionTitle } from "../components/AdminUi";
import { auctionBadge } from "../components/badges";
import { useLocation, useNavigate } from "react-router-dom";

function formatKST(iso: string): string {
  const d = new Date(iso);
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  const hh = String(d.getHours()).padStart(2, "0");
  const mi = String(d.getMinutes()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd} ${hh}:${mi}`;
}

function money(v: number): string {
  return new Intl.NumberFormat("ko-KR").format(v);
}

const AdminAuctionsPage: React.FC = () => {
  const { auctions, query, suspendAuction, forceEndAuction } = useAdminStore();

  const navigate = useNavigate();
  const location = useLocation();

  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = useState(10);

  const filtered = useMemo(() => {
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

  useEffect(() => {
    setPage(0);
  }, [query, auctions]);

  const totalItems = filtered.length;
  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));
  const safePage = Math.min(page, totalPages - 1);

  const pageList = useMemo(() => {
    const windowSize = 5;
    let start = Math.max(0, safePage - Math.floor(windowSize / 2));
    let end = Math.min(totalPages - 1, start + windowSize - 1);
    start = Math.max(0, end - windowSize + 1);

    const arr: number[] = [];
    for (let i = start; i <= end; i++) arr.push(i);
    return arr;
  }, [safePage, totalPages]);

  const paged = useMemo(() => {
    const start = safePage * pageSize;
    return filtered.slice(start, start + pageSize);
  }, [filtered, safePage, pageSize]);

  const btnBase = "px-2 py-2 rounded-xl border border-gray-200";
  const btnAble = "hover:bg-gray-50";
  const btnDisabled = "opacity-40 cursor-not-allowed";

  // const openDetailPopup = (productId: string | number) => {
  //   navigate(`/auction_detail/${productId}`, {
  //     state: { backgroundLocation: location },
  //   });
  // };



  return (
    <div className="bg-white border border-gray-100 rounded-2xl p-4 shadow-sm">
      <SectionTitle
        title="경매 모니터링"
        right={<span className="text-[11px] text-gray-500">검색은 상단에서</span>}
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
            {paged.map((a) => {
              const b = auctionBadge(a.status);

              const status = String(a.status);
              const isEnded = status === "SELLED" || status === "NOTSELLED";

              const isBlocked =
                status === "BLOCKED" ||
                Boolean((a as any).blocked) ||
                Boolean((a as any).isBlocked);

              const disableActions = isEnded || isBlocked;

              return (
                <tr key={a.id} className="border-b border-gray-50 hover:bg-gray-50">
                  <td className="py-3 pr-2 text-[12px] text-gray-600">{a.id}</td>
                  <td className="py-3 pr-2">
                    <div className="font-semibold text-gray-900">{a.title}</div>
                  </td>
                  <td className="py-3 pr-2 text-gray-700">{a.sellerMasked}</td>
                  <td className="py-3 pr-2 text-gray-700">{a.category}</td>

                  <td className="py-3 pr-2 text-right font-bold text-gray-900">
                    ₩ {money(a.currentBid)}
                  </td>

                  <td className="py-3 pr-2 text-right text-gray-700">{a.bidCount}</td>
                  <td className="py-3 pr-2 text-gray-700">{formatKST(a.endsAt)}</td>
                  <td className="py-3 pr-2">
                    <span
                      className={
                        "text-[11px] px-2 py-1 rounded-full border " +
                        (b?.cls ?? "border-gray-200 text-gray-600")
                      }
                    >
                      {b?.label ?? "UNKNOWN"}
                    </span>
                  </td>

                  <td className="py-3 text-right">
                    <div className="inline-flex items-center gap-2">
                      {/* 보기 */}
                      <button
                        type="button"
                        onClick={() =>
                          navigate(`/auction_detail/${a.id}`, {
                            state: { backgroundLocation: location },
                          })
                        }
                        className={btnBase + " " + btnAble}
                        title="보기"
                      >
                        <Eye className="w-4 h-4 text-gray-700" />
                      </button>

                      {/* 임시차단 : 종료/차단이면 비활성 */}
                      <button
                        type="button"
                        onClick={() => suspendAuction(a.id)}
                        disabled={disableActions}
                        className={btnBase + " " + (disableActions ? btnDisabled : btnAble)}
                        title={isBlocked ? "이미 차단된 경매" : isEnded ? "종료된 경매" : "임시차단"}
                      >
                        <Ban className="w-4 h-4 text-gray-700" />
                      </button>

                      {/* 강제종료 : 종료/차단이면 비활성 */}
                      <button
                        type="button"
                        onClick={() => forceEndAuction(a.id)}
                        disabled={disableActions}
                        className={btnBase + " " + (disableActions ? btnDisabled : btnAble)}
                        title={isBlocked ? "이미 차단된 경매" : isEnded ? "종료된 경매" : "강제종료"}
                      >
                        <XCircle className="w-4 h-4 text-gray-700" />
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}

            {paged.length === 0 && (
              <tr>
                <td colSpan={9} className="py-10 text-center text-gray-500">
                  검색 결과가 없습니다.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* ====== 페이징 처리 ====== */}
      {totalItems > 0 && (
        <div className="mt-4 flex items-center justify-between">
          <div className="text-[12px] text-gray-600">
            총 {totalItems}개 · {safePage + 1}/{totalPages} 페이지
          </div>

          <div className="flex items-center gap-2">
            <select
              className="h-8 rounded-lg border border-gray-200 px-2 text-[12px]"
              value={pageSize}
              onChange={(e) => {
                setPageSize(Number(e.target.value));
                setPage(0);
              }}
            >
              <option value={10}>10개</option>
              <option value={20}>20개</option>
              <option value={50}>50개</option>
              <option value={100}>100개</option>
            </select>

            <button
              type="button"
              disabled={safePage === 0}
              onClick={() => setPage(0)}
              className={
                "h-8 px-3 rounded-lg border text-[12px] " +
                (safePage === 0 ? "opacity-40 cursor-not-allowed border-gray-200" : "border-gray-200 hover:bg-gray-50")
              }
            >
              처음
            </button>

            <button
              type="button"
              disabled={safePage === 0}
              onClick={() => setPage((p) => Math.max(0, p - 1))}
              className={
                "h-8 px-3 rounded-lg border text-[12px] " +
                (safePage === 0 ? "opacity-40 cursor-not-allowed border-gray-200" : "border-gray-200 hover:bg-gray-50")
              }
            >
              이전
            </button>

            {pageList.map((p) => (
              <button
                key={p}
                type="button"
                onClick={() => setPage(p)}
                className={
                  "min-w-[32px] h-8 px-2 rounded-lg border text-[12px] " +
                  (p === safePage
                    ? "bg-gray-900 text-white border-gray-900"
                    : "border-gray-200 text-gray-700 hover:bg-gray-50")
                }
              >
                {p + 1}
              </button>
            ))}

            <button
              type="button"
              disabled={safePage >= totalPages - 1}
              onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
              className={
                "h-8 px-3 rounded-lg border text-[12px] " +
                (safePage >= totalPages - 1
                  ? "opacity-40 cursor-not-allowed border-gray-200"
                  : "border-gray-200 hover:bg-gray-50")
              }
            >
              다음
            </button>

            <button
              type="button"
              disabled={safePage >= totalPages - 1}
              onClick={() => setPage(totalPages - 1)}
              className={
                "h-8 px-3 rounded-lg border text-[12px] " +
                (safePage >= totalPages - 1
                  ? "opacity-40 cursor-not-allowed border-gray-200"
                  : "border-gray-200 hover:bg-gray-50")
              }
            >
              끝
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminAuctionsPage;