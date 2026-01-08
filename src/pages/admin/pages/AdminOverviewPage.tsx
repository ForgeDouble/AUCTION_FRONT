//  src/pages/admin/pages/AdminOverviewPage.tsx
import React, { useMemo } from "react";
import { Activity, AlertTriangle, CheckCircle2, Clock, FileText, Gavel, TrendingUp, Users, Wallet } from "lucide-react";
import { useAdminStore } from "../AdminContext";
import { StatCard, SectionTitle } from "../components/AdminUi";
import { auctionBadge, categoryBadge, pendingRiskBadge } from "../components/badges";
import { SimpleDonutChart, SimpleMultiLineChart, type DonutSegment, type MultiLineSeries } from "../components/AdminCharts";

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
  const { stats, auctions, reportGroups, categoryDistribution, todayActiveHours  } = useAdminStore();

  const topAuctions = useMemo(() => auctions.slice(0, 5), [auctions]);

  const topReportGroups = useMemo(() => {
    return reportGroups
      .slice()
      .sort((a, b) => {
        const at = a.lastReportedAt ? new Date(a.lastReportedAt).getTime() : 0;
        const bt = b.lastReportedAt ? new Date(b.lastReportedAt).getTime() : 0;
        return bt - at;
      })
      .slice(0, 5);
  }, [reportGroups]);

  // 최근 7일 생성/종료 샘플(더미)
  const auctionTrendSeries: MultiLineSeries[] = useMemo(() => {
    const labels = ["12/15", "12/16", "12/17", "12/18", "12/19", "12/20", "12/21"];
    const created = [48, 55, 42, 23, 61, 44, 39];
    const ended = [52, 47, 51, 18, 39, 58, 41];

    return [
      {
        name: "생성",
        colorClass: "text-violet-600",
        points: labels.map((l, i) => ({ label: l, value: created[i] })),
      },
      {
        name: "종료",
        colorClass: "text-blue-600",
        points: labels.map((l, i) => ({ label: l, value: ended[i] })),
      },
    ];
  }, []);

  // 카테고리 분포 샘플(도넛 차트)
  const categorySegments: DonutSegment[] = useMemo(() => {
    const base = [
      { label: "전자제품", colorClass: "text-violet-600" },
      { label: "패션/잡화", colorClass: "text-blue-600" },
      { label: "생활/가전", colorClass: "text-emerald-600" },
      { label: "취미/레저", colorClass: "text-orange-600" },
      { label: "컬렉터블", colorClass: "text-pink-600" },
      { label: "자동차/오토바이", colorClass: "text-gray-700" },
      { label: "도서/음반/영화", colorClass: "text-indigo-600" },
    ];

    const map = new Map<string, number>();
    for (const row of categoryDistribution) {
      if (!row?.category) continue;
      map.set(row.category, Number(row.count ?? 0));
    }
    return base.map((b) => ({
      label: b.label,
      value: map.get(b.label) ?? 0,
      colorClass: b.colorClass,
    }));
  }, [categoryDistribution]);

  // 금일 사용자 주 사용 시간대 (선 차트)
  const todayActiveHourLine: MultiLineSeries[] = useMemo(() => {
    const labels = ["00", "03", "06", "09", "12", "15", "18", "21"];
    const starts = [0, 3, 6, 9, 12, 15, 18, 21];

    const map = new Map<number, number>();
    for (const row of todayActiveHours ?? []) {
      const h = Number(row.hour);
      const c = Number(row.count ?? 0);
      if (!Number.isFinite(h)) continue;
      map.set(h, (map.get(h) ?? 0) + (Number.isFinite(c) ? c : 0));
    }

    const bucketValue = (start: number) => {
      let sum = 0;
      for (let h = start; h < start + 3; h++) {
        sum += map.get(h) ?? 0;
      }
      return sum;
    };

    const points = starts.map((s, i) => ({
      label: labels[i],
      value: bucketValue(s),
    }));

    return [
      {
        name: "접속/활동",
        colorClass: "text-violet-600",
        points,
      },
    ];
  }, [todayActiveHours]);


  // 월별 거래 금액(샘플) + 평균 표시
  const monthlyTradeSeries: MultiLineSeries[] = useMemo(() => {
    const labels = ["7월", "8월", "9월", "10월", "11월", "12월"];
    const amount = [860000000, 940000000, 910000000, 980000000, 1100000000, 920000000];
    return [
      {
        name: "월 거래 금액",
        colorClass: "text-emerald-600",
        points: labels.map((l, i) => ({ label: l, value: amount[i] })),
      },
    ];
  }, []);

  return (
    <div className="space-y-4">
      {/* KPI */}
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

      {/* ✅ 거래 금액 모니터링(아직 연결 안됨)  */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
        <div className="bg-white border border-gray-100 rounded-2xl p-4 shadow-sm">
          <SectionTitle title="거래 금액 모니터링" right={<span className="text-[11px] text-gray-500">샘플(백엔드 연결 예정)</span>} />
          <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="p-3 rounded-xl bg-gray-50 border border-gray-100">
              <div className="flex items-center justify-between">
                <div className="text-[11px] text-gray-500">금일 총 거래 금액(GMV)</div>
                <Wallet className="w-4 h-4 text-gray-500" />
              </div>
              <div className="mt-1 text-xl font-black text-gray-900">₩{money(stats.todayTradeAmount)}</div>
              <div className="mt-1 text-[11px] text-gray-500">결제 완료 기준(취소 제외)</div>
            </div>

            <div className="p-3 rounded-xl bg-gray-50 border border-gray-100">
              <div className="flex items-center justify-between">
                <div className="text-[11px] text-gray-500">월별 평균 거래 금액</div>
                <TrendingUp className="w-4 h-4 text-gray-500" />
              </div>
              <div className="mt-1 text-xl font-black text-gray-900">₩{money(stats.monthlyAvgTradeAmount)}</div>
              <div className="mt-1 text-[11px] text-gray-500">최근 6개월 평균</div>
            </div>
          </div>
        </div>

        {/*✅ 월별 거래 금액 추이(아직 연결 안됨) */}
        <div className="bg-white border border-gray-100 rounded-2xl p-4 shadow-sm xl:col-span-2">
          <SectionTitle title="월별 거래 금액 추이" right={<span className="text-[11px] text-gray-500">최근 6개월(샘플)</span>} />
          <SimpleMultiLineChart series={monthlyTradeSeries} height={190} yLabel="KRW" />
        </div>
      </div>

      {/*✅ 그래프 섹션(아직 연결 안됨) */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
        <div className="bg-white border border-gray-100 rounded-2xl p-4 shadow-sm">
          <SectionTitle title="최근 7일 경매 생성/종료 추이" right={<span className="text-[11px] text-gray-500">(샘플)</span>} />
          <SimpleMultiLineChart series={auctionTrendSeries} height={190} yLabel="count" />
        </div>

        <div className="bg-white border border-gray-100 rounded-2xl p-4 shadow-sm">
          <SectionTitle title="카테고리 분포 (원형)" right={<span className="text-[11px] text-gray-500">  </span>} />
          <SimpleDonutChart segments={categorySegments} size={180} thickness={16} />
        </div>
      </div>

      {/*✅ 금일 사용 시간대(선형) . (아직 연결 안됨) */}
      <div className="bg-white border border-gray-100 rounded-2xl p-4 shadow-sm">
        <SectionTitle title="금일 사용자 주 사용 시간대" right={<span className="text-[11px] text-gray-500">시간대별 접속/활동</span>} />
        <SimpleMultiLineChart series={todayActiveHourLine} height={190} yLabel="users" />
      </div>

      {/* 진행중인 경매 상위*/}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
        <div className="bg-white border border-gray-100 rounded-2xl p-4 shadow-sm">
          <SectionTitle title="진행중 경매(상위)" right={<span className="text-[11px] text-gray-500">경매 탭에서 상세</span>} />

          <div className="space-y-2">
            {topAuctions.map((a) => {
              const b = auctionBadge(a.status);

              return (
                <div
                  key={a.id}
                  className="
                    p-3 rounded-xl bg-gray-50 border border-gray-100
                    flex items-center gap-3
                  "
                >
                  {/* ✅ LEFT: 제목/서브 (가변, 하지만 truncate 되도록) */}
                  <div className="min-w-0 flex-1">
                    <div className="text-sm font-semibold text-gray-900 truncate whitespace-nowrap">
                      {a.title}
                    </div>

                    <div className="text-[11px] text-gray-500 truncate whitespace-nowrap">
                      {a.id} · {a.category} · {a.sellerMasked}
                    </div>
                  </div>

                  {/* ✅ MIDDLE: 가격/메타 (고정폭 + 줄바꿈 금지) */}
                  <div className="w-[220px] text-right flex-none">
                    <div className="text-sm font-bold text-gray-900 truncate whitespace-nowrap">
                      ₩{money(a.currentBid)}
                    </div>

                    <div className="text-[11px] text-gray-500 truncate whitespace-nowrap">
                      입찰 {a.bidCount} · {formatKST(a.endsAt)}
                    </div>
                  </div>

                  {/* ✅ RIGHT: 뱃지 (고정) */}
                  <div className="flex-none">
                    <span className={"text-[11px] px-2 py-1 rounded-full border whitespace-nowrap " + b.cls}>
                      {b.label}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="bg-white border border-gray-100 rounded-2xl p-4 shadow-sm">
          <SectionTitle title="최근 신고(상위)" right={<span className="text-[11px] text-gray-500">신고 탭에서 처리</span>} />
          <div className="space-y-2">
            {topReportGroups.map((g) => {
              const cat = categoryBadge(g.category);
              const risk = pendingRiskBadge(g.pendingCount);
              return (
                <div key={`${g.targetUserId}-${g.category}`} className="p-3 rounded-xl bg-gray-50 border border-gray-100">
                  <div className="flex items-center justify-between">
                    <div className="text-sm font-semibold text-gray-900">
                      {(g.targetNickname && g.targetNickname.trim()) ? g.targetNickname : (g.targetName || "대상 유저")}
                      <span className="text-[11px] text-gray-400 ml-2">#{g.targetUserId}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className={"text-[11px] px-2 py-0.5 rounded-full border " + cat.cls}>{cat.label}</span>
                      <span className={"text-[11px] px-2 py-0.5 rounded-full border " + risk.cls}>{risk.label}</span>
                    </div>
                  </div>

                  <div className="mt-1 text-[11px] text-gray-500">
                    P {g.pendingCount} / A {g.acceptedCount} / R {g.rejectedCount} ·  {formatKST(g.lastReportedAt || "")}
                  </div>
                </div>
              );
            })}

          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminOverviewPage;
