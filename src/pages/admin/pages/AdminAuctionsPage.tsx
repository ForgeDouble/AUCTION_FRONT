// src/pages/admin/pages/AdminAuctionsPage.tsx
import React, { useEffect, useMemo, useRef } from "react";
import { Ban, Eye, XCircle } from "lucide-react";
import { useAdminStore } from "../AdminContext";
import { SectionTitle } from "../components/AdminUi";
import { auctionBadge } from "../components/badges";
import { useLocation, useNavigate, useSearchParams } from "react-router-dom";

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

function readInt(sp: URLSearchParams, key: string, fallback: number) {
  const raw = sp.get(key);
  const n = raw ? parseInt(raw, 10) : NaN;
  return Number.isFinite(n) ? n : fallback;
}

function clamp(n: number, min: number, max: number) {
  return Math.max(min, Math.min(max, n));
}

function toBool(v: any): boolean {
  if (v === true) return true;
  if (v === false) return false;
  if (v === 1 || v === "1") return true;
  if (v === 0 || v === "0") return false;
  if (typeof v === "string") {
    const s = v.trim().toLowerCase();
    if (s === "true" || s === "y" || s === "yes") return true;
    if (s === "false" || s === "n" || s === "no" || s === "") return false;
  }
  return false;
}

const AdminAuctionsPage: React.FC = () => {
  const {
    auctions,
    query,
    suspendAuction,
    forceEndAuction,

    auctionsPage,
    auctionsTotalPages,
    auctionsTotalElements,
    setAuctionsPagingFromUrl,
  } = useAdminStore();

  const navigate = useNavigate();
  const location = useLocation();
  const [sp, setSp] = useSearchParams();

  useEffect(() => {
    const hasPage = sp.has("page");
    const hasSize = sp.has("size");
    if (hasPage && hasSize) return;

    const next = new URLSearchParams(sp);
    if (!hasPage) next.set("page", "1");
    if (!hasSize) next.set("size", "10");
    setSp(next, { replace: true });
  }, [sp, setSp]);

  const page1 = useMemo(() => clamp(readInt(sp, "page", 1), 1, 9999), [sp]);
  const page0 = page1 - 1;

  const pageSize = useMemo(() => clamp(readInt(sp, "size", 10), 10, 100), [sp]);
  const prevQueryRef = useRef(query);
  
  useEffect(() => {
    setAuctionsPagingFromUrl(page1, pageSize);
  }, [page1, pageSize, setAuctionsPagingFromUrl]);


  useEffect(() => {
    const prev = prevQueryRef.current;
    prevQueryRef.current = query;

    if (prev === query) return;

    if ((sp.get("page") ?? "1") === "1") return;
    const next = new URLSearchParams(sp);
    next.set("page", "1");
    setSp(next, { replace: true });
  }, [query, sp, setSp]);

  const setPage0 = (next0: number) => {
    const next = new URLSearchParams(sp);
    next.set("page", String(next0 + 1));
    next.set("size", String(pageSize));
    setSp(next, { replace: true });
  };

  const setSize = (nextSize: number) => {
    const next = new URLSearchParams(sp);
    next.set("size", String(nextSize));
    next.set("page", "1");
    setSp(next, { replace: true });
  };


  const hasMeta = !!auctionsPage;
  const totalPages = hasMeta ? Math.max(1, auctionsTotalPages || 1) : Math.max(1, page0 + 1);
  const safePage0 = hasMeta ? clamp(page0, 0, totalPages - 1) : page0;


  useEffect(() => {
    if (!hasMeta) return;
    if (safePage0 === page0) return;

    const next = new URLSearchParams(sp);
    next.set("page", String(safePage0 + 1));
    setSp(next, { replace: true });
  }, [hasMeta, page0, safePage0, sp, setSp]);

  const pageList = useMemo(() => {
    const windowSize = 5;
    let start = Math.max(0, safePage0 - Math.floor(windowSize / 2));
    let end = Math.min(totalPages - 1, start + windowSize - 1);
    start = Math.max(0, end - windowSize + 1);

    const arr: number[] = [];
    for (let i = start; i <= end; i++) arr.push(i);
    return arr;
  }, [safePage0, totalPages]);

  const btnBase = "px-2 py-2 rounded-xl border border-gray-200";
  const btnAble = "hover:bg-gray-50";
  const btnDisabled = "opacity-40 cursor-not-allowed";

  return (
    <div className="bg-white border border-gray-100 rounded-2xl p-4 shadow-sm">
      <SectionTitle title="경매 모니터링" right={<span className="text-[11px] text-gray-500">검색은 상단에서</span>} />

      <div className="overflow-x-auto">
        <table className="w-full text-sm table-fixed min-w-[980px]">

    <colgroup>
      <col className="w-[50px]" />   {/* ID */}
      <col className="w-[320px]" />  {/* 제목 */}
      <col className="w-[110px]" />  {/* 판매자 */}
      <col className="w-[140px]" />  {/* 카테고리 */}
      <col className="w-[120px]" />  {/* 현재가 */}
      <col className="w-[70px]" />   {/* 입찰 */}
      <col className="w-[150px]" />  {/* 종료 */}
      <col className="w-[90px]" />   {/* 상태 */}
      <col className="w-[130px]" />  {/* 조치 */}
    </colgroup>
          
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
            {auctions.map((a) => {
              const b = auctionBadge(a.status);

              const status = String(a.status);
              const isEnded = status === "SELLED" || status === "NOTSELLED";

              const rawBlocked = (a as any).blocked ?? (a as any).isBlocked;
              const blockedFlag = toBool(rawBlocked);
              const isBlocked = status === "BLOCKED" || blockedFlag;

              const disableActions = isEnded || isBlocked;

              return (
                <tr key={a.id} className="border-b border-gray-50 hover:bg-gray-50">
                  <td className="py-3 pr-2 text-[12px] text-gray-600 ">{a.id}</td>

                  <td className="py-3 pr-2">
                    <div className="font-semibold text-gray-900">{a.title}</div>
                  </td>

                  <td className="py-3 pr-2 text-gray-700">{a.sellerMasked}</td>
                  <td className="py-3 pr-2 text-gray-700">{a.category}</td>

                  <td className="py-3 pr-2 text-right font-bold text-gray-900">₩ {money(a.currentBid)}</td>
                  <td className="py-3 pr-2 text-right text-gray-700">{a.bidCount}</td>
                  <td className="py-3 pr-2 text-gray-700">{formatKST(a.endsAt)}</td>

                  <td className="py-3 pr-2">
                    <span className={"text-[11px] px-2 py-1 rounded-full border " + (b?.cls ?? "border-gray-200 text-gray-600")}>
                      {b?.label ?? "UNKNOWN"}
                    </span>
                  </td>

                  <td className="py-3 text-right">
                    <div className="inline-flex items-center gap-2">
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

                      <button
                        type="button"
                        onClick={() => suspendAuction(String(a.id))}
                        disabled={disableActions}
                        className={btnBase + " " + (disableActions ? btnDisabled : btnAble)}
                        title={isBlocked ? "이미 차단된 경매" : isEnded ? "종료된 경매" : "임시차단"}
                      >
                        <Ban className="w-4 h-4 text-gray-700" />
                      </button>

                      <button
                        type="button"
                        onClick={() => forceEndAuction(String(a.id))}
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

            {auctions.length === 0 && (
              <tr>
                <td colSpan={9} className="py-10 text-center text-gray-500">
                  검색 결과가 없습니다.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* paging ui (서버 total 기반) */}
      {auctionsTotalElements > 0 && (
        <div className="mt-4 flex items-center justify-between">
          <div className="text-[12px] text-gray-600">
            총 {auctionsTotalElements}개 · {safePage0 + 1}/{totalPages} 페이지
          </div>

          <div className="flex items-center gap-2">
            <select className="h-8 rounded-lg border border-gray-200 px-2 text-[12px]" value={pageSize} onChange={(e) => setSize(Number(e.target.value))}>
              <option value={10}>10개</option>
              <option value={20}>20개</option>
              <option value={50}>50개</option>
              <option value={100}>100개</option>
            </select>

            <button
              type="button"
              disabled={safePage0 === 0}
              onClick={() => setPage0(0)}
              className={"h-8 px-3 rounded-lg border text-[12px] " + (safePage0 === 0 ? "opacity-40 cursor-not-allowed border-gray-200" : "border-gray-200 hover:bg-gray-50")}
            >
              처음
            </button>

            <button
              type="button"
              disabled={safePage0 === 0}
              onClick={() => setPage0(Math.max(0, safePage0 - 1))}
              className={"h-8 px-3 rounded-lg border text-[12px] " + (safePage0 === 0 ? "opacity-40 cursor-not-allowed border-gray-200" : "border-gray-200 hover:bg-gray-50")}
            >
              이전
            </button>

            {pageList.map((p0) => (
              <button
                key={p0}
                type="button"
                onClick={() => setPage0(p0)}
                className={"min-w-[32px] h-8 px-2 rounded-lg border text-[12px] " + (p0 === safePage0 ? "bg-gray-900 text-white border-gray-900" : "border-gray-200 text-gray-700 hover:bg-gray-50")}
              >
                {p0 + 1}
              </button>
            ))}

            <button
              type="button"
              disabled={safePage0 >= totalPages - 1}
              onClick={() => setPage0(Math.min(totalPages - 1, safePage0 + 1))}
              className={"h-8 px-3 rounded-lg border text-[12px] " + (safePage0 >= totalPages - 1 ? "opacity-40 cursor-not-allowed border-gray-200" : "border-gray-200 hover:bg-gray-50")}
            >
              다음
            </button>

            <button
              type="button"
              disabled={safePage0 >= totalPages - 1}
              onClick={() => setPage0(totalPages - 1)}
              className={"h-8 px-3 rounded-lg border text-[12px] " + (safePage0 >= totalPages - 1 ? "opacity-40 cursor-not-allowed border-gray-200" : "border-gray-200 hover:bg-gray-50")}
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
