//  src/pages/admin/pages/AdminAuctionsPage.tsx
import React, { useMemo } from "react";
import { Ban, Eye, XCircle } from "lucide-react";
import { useAdminStore } from "../AdminContext";
import { SectionTitle } from "../components/AdminUi";
import { auctionBadge } from "../components/badges";

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

  return (
    <div className="bg-white border border-gray-100 rounded-2xl p-4 shadow-sm">
      <SectionTitle title="경매 모니터링" right={<span className="text-[11px] text-gray-500">검색은 상단에서</span>} />

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
            {filtered.map((a) => {
              const b = auctionBadge(a.status);
              return (
                <tr key={a.id} className="border-b border-gray-50 hover:bg-gray-50">
                  <td className="py-3 pr-2 text-[12px] text-gray-600">{a.id}</td>
                  <td className="py-3 pr-2">
                    <div className="font-semibold text-gray-900">{a.title}</div>
                  </td>
                  <td className="py-3 pr-2 text-gray-700">{a.sellerMasked}</td>
                  <td className="py-3 pr-2 text-gray-700">{a.category}</td>
                  <td className="py-3 pr-2 text-right font-bold text-gray-900">₩{money(a.currentBid)}</td>
                  <td className="py-3 pr-2 text-right text-gray-700">{a.bidCount}</td>
                  <td className="py-3 pr-2 text-gray-700">{formatKST(a.endsAt)}</td>
                  <td className="py-3 pr-2">
                    <span className={"text-[11px] px-2 py-1 rounded-full border " + b.cls}>{b.label}</span>
                  </td>
                  <td className="py-3 text-right">
                    <div className="inline-flex items-center gap-2">
                      <button className="px-2 py-2 rounded-xl border border-gray-200 hover:bg-gray-50" title="보기">
                        <Eye className="w-4 h-4 text-gray-700" />
                      </button>
                      <button
                        onClick={() => suspendAuction(a.id)}
                        className="px-2 py-2 rounded-xl border border-gray-200 hover:bg-gray-50"
                        title="임시차단"
                      >
                        <Ban className="w-4 h-4 text-gray-700" />
                      </button>
                      <button
                        onClick={() => forceEndAuction(a.id)}
                        className="px-2 py-2 rounded-xl border border-gray-200 hover:bg-gray-50"
                        title="강제종료"
                      >
                        <XCircle className="w-4 h-4 text-gray-700" />
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
            {filtered.length === 0 && (
              <tr>
                <td colSpan={9} className="py-10 text-center text-gray-500">
                  검색 결과가 없습니다.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default AdminAuctionsPage;
