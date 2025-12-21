import React, { useMemo } from "react";
import { Activity, AlertTriangle, CheckCircle2, Clock, FileText, Gavel, TrendingUp, Users } from "lucide-react";
import { useAdminStore } from "../AdminContext";
import { StatCard, SectionTitle } from "../components/AdminUi";
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

const AdminOverviewPage: React.FC = () => {
  const { stats, auctions, reports } = useAdminStore();

  const topAuctions = useMemo(() => auctions.slice(0, 5), [auctions]);

  const topReports = useMemo(() => {
    return reports
      .slice()
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .slice(0, 5);
  }, [reports]);

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <StatCard title="금일 신규가입" value={stats.todayNewUsers.toLocaleString()} icon={Users} hint="오늘 00:00 기준" />
        <StatCard title="금일 생성 경매" value={stats.todayCreatedAuctions.toLocaleString()} icon={Gavel} hint="오늘 생성" />
        <StatCard title="진행중 경매" value={stats.ongoingAuctions.toLocaleString()} icon={Clock} hint="현재 진행" />
        <StatCard title="신고(오픈)" value={stats.reportsOpen.toLocaleString()} icon={AlertTriangle} hint="대기/처리중" />
        <StatCard title="전체 입찰" value={stats.totalBids.toLocaleString()} icon={TrendingUp} hint="누적" />
        <StatCard title="금일 종료" value={stats.todayEndedAuctions.toLocaleString()} icon={CheckCircle2} hint="타임아웃 포함" />
        <StatCard title="금일 판매" value={stats.todaySoldAuctions.toLocaleString()} icon={FileText} hint="낙찰/결제 완료" />
        <StatCard title="실시간 접속" value={stats.realtimeUsers.toLocaleString()} icon={Activity} hint="웹/앱 합산" />
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
        <div className="bg-white border border-gray-100 rounded-2xl p-4 shadow-sm">
          <SectionTitle title="진행중 경매(상위)" right={<span className="text-[11px] text-gray-500">경매 탭에서 상세</span>} />
          <div className="space-y-2">
            {topAuctions.map((a) => {
              const b = auctionBadge(a.status);
              return (
                <div key={a.id} className="p-3 rounded-xl bg-gray-50 border border-gray-100 flex items-center justify-between gap-2">
                  <div className="min-w-0">
                    <div className="text-sm font-semibold text-gray-900 truncate">{a.title}</div>
                    <div className="text-[11px] text-gray-500">
                      {a.id} · {a.category} · {a.sellerMasked}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-sm font-bold text-gray-900">₩{money(a.currentBid)}</div>
                    <div className="text-[11px] text-gray-500">입찰 {a.bidCount} · {formatKST(a.endsAt)}</div>
                  </div>
                  <span className={"text-[11px] px-2 py-1 rounded-full border " + b.cls}>{b.label}</span>
                </div>
              );
            })}
          </div>
        </div>

        <div className="bg-white border border-gray-100 rounded-2xl p-4 shadow-sm">
          <SectionTitle title="최근 신고(상위)" right={<span className="text-[11px] text-gray-500">신고 탭에서 처리</span>} />
          <div className="space-y-2">
            {topReports.map((r) => (
              <div key={r.id} className="p-3 rounded-xl bg-gray-50 border border-gray-100">
                <div className="flex items-center justify-between">
                  <div className="text-sm font-semibold text-gray-900">{r.type}</div>
                  <div className="text-[11px] text-gray-400">#{r.id}</div>
                </div>
                <div className="mt-1 text-[11px] text-gray-500 truncate">{r.targetTitle}</div>
                <div className="mt-1 text-[11px] text-gray-500">{r.reporterMasked} · {formatKST(r.createdAt)}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminOverviewPage;
