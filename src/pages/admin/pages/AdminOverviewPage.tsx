// src/pages/admin/pages/AdminOverviewPage.tsx
import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  Activity,
  AlertTriangle,
  CheckCircle2,
  Clock,
  FileText,
  Gavel,
  TrendingUp,
  Users,
  Wallet,
  AlertCircle,
} from "lucide-react";
import { useAdminStore } from "../AdminContext";
import { StatCard, SectionTitle } from "../components/AdminUi";
import { auctionBadge, categoryBadge, pendingRiskBadge } from "../components/badges";
import {
  SimpleDonutChart,
  SimpleMultiLineChart,
  type DonutSegment,
  type MultiLineSeries,
} from "../components/AdminCharts";
import { useNavigate } from "react-router-dom";

import { adminApi } from "../adminApi";
import { applyUiError } from "@/hooks/applyUiError";
import { useModal } from "@/contexts/ModalContext";
import { useAuth } from "@/hooks/useAuth";
import type { ErrorState } from "@/errors/ErrorDto";
import type {
  AuctionRow,
  AdminReportGroupRow,
  CategoryDistributionRow,
  ActiveHourBucketRow,
  AuctionTrendRow,
  MonthlyTradeRow,
} from "../adminTypes";

function formatKST(iso: string): string {
  if (!iso) return "-";
  const d = new Date(iso);
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  const hh = String(d.getHours()).padStart(2, "0");
  const mi = String(d.getMinutes()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd} ${hh}:${mi}`;
}

const fmtMillionKRW1 = (v: number) => {
  const m = v / 1_000_000;
  return `${m.toFixed(1)}`;
};

function money(v: number): string {
  return new Intl.NumberFormat("ko-KR").format(v);
}

function normalizeAdminMsg(msg?: string) {
  const fallback = "요청 처리 중 오류가 발생했습니다.\n잠시 후 다시 시도해 주세요.";
  const m = (msg ?? "").trim();
  if (!m) return fallback;
  if (m.includes("관리자에게 문의")) return fallback;
  return m;
}

function AdminInlineErrorBox(props: {
  title?: string;
  message: string;
  onRetry?: () => void;
}) {
  const { title = "데이터를 불러올 수 없습니다", message, onRetry } = props;

  return (
    <div className="bg-red-50 border border-red-200 rounded-2xl p-8 text-center">
      <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-3" />
      <p className="text-red-700 font-medium mb-1">{title}</p>
      <p className="text-sm text-red-600 whitespace-pre-line">{message}</p>
      {onRetry && (
        <button
          onClick={onRetry}
          className="mt-4 px-6 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors cursor-pointer"
        >
          다시 시도
        </button>
      )}
    </div>
  );
}

const AdminOverviewPage: React.FC = () => {
  const navigate = useNavigate();
  const { showLogin } = useModal();
  const { logout } = useAuth();

  const {
    stats,
    setStats,
    lastUpdatedAt,
    rtConnected,
    adminRole,
  } = useAdminStore();

  const roleUpper = String(adminRole ?? "").toUpperCase();
  const canViewReports = roleUpper.includes("ADMIN");
  const canViewTrade = roleUpper.includes("ADMIN");

  const [overviewErr, setOverviewErr] = useState("");

  const [topAuctionsErr, setTopAuctionsErr] = useState("");
  const [reportsErr, setReportsErr] = useState("");
  const [catErr, setCatErr] = useState("");
  const [hoursErr, setHoursErr] = useState("");
  const [trendErr, setTrendErr] = useState("");
  const [tradeErr, setTradeErr] = useState("");

  const [loading, setLoading] = useState(false);

  const [topAuctionsData, setTopAuctionsData] = useState<AuctionRow[]>([]);
  const [reportGroupsData, setReportGroupsData] = useState<AdminReportGroupRow[]>([]);
  const [categoryDistributionData, setCategoryDistributionData] = useState<CategoryDistributionRow[]>([]);
  const [todayActiveHoursData, setTodayActiveHoursData] = useState<ActiveHourBucketRow[]>([]);
  const [auctionTrendRowsData, setAuctionTrendRowsData] = useState<AuctionTrendRow[]>([]);
  const [monthlyTradeRowsData, setMonthlyTradeRowsData] = useState<MonthlyTradeRow[]>([]);

  const authGuardRef = useRef(false);

  const makeInlineDeps = useCallback(
    (setErr: (m: string) => void) => ({
      showLogin: (mode?: "navigation" | "confirm") => {
        if (authGuardRef.current) return;
        authGuardRef.current = true;
        showLogin(mode ?? "confirm");
      },
      showWarning: (m: string) => setErr(normalizeAdminMsg(m)),
      showError: (m?: string) => setErr(normalizeAdminMsg(m)),
      logout: () => logout(),
      setErrorState: (s: ErrorState | null) => {
        if (!s) return;
        setErr(normalizeAdminMsg(s.message));
      },
      navigate: (_to: string) => {
        setErr("요청을 처리할 수 없습니다.\n잠시 후 다시 시도해 주세요.");
      },
    }),
    [showLogin, logout]
  );

  const loadAll = useCallback(async () => {
    setLoading(true);
    authGuardRef.current = false;

    setOverviewErr("");
    setTopAuctionsErr("");
    setReportsErr("");
    setCatErr("");
    setHoursErr("");
    setTrendErr("");
    setTradeErr("");

    // 1) 핵심(overview) 실패하면 페이지 전체를 막아야 하니까 먼저 단독 try/catch
    try {
      const ov = await adminApi.getOverview();
      setStats(ov);
    } catch (e) {
      applyUiError(e, makeInlineDeps(setOverviewErr));
      setLoading(false);
      return;
    }

    // 2) 나머지는 섹션별로 실패 허용
    try {
      const pg = await adminApi.getAuctionsPage({ page: 0, size: 5 });
      setTopAuctionsData(Array.isArray(pg?.content) ? pg.content : []);
    } catch (e) {
      applyUiError(e, makeInlineDeps(setTopAuctionsErr));
      setTopAuctionsData([]);
    }

    if (canViewReports) {
      try {
        const groups = await adminApi.getReportGroups();
        setReportGroupsData(groups ?? []);
      } catch (e) {
        applyUiError(e, makeInlineDeps(setReportsErr));
        setReportGroupsData([]);
      }
    } else {
      setReportGroupsData([]);
    }

    try {
      const list = await adminApi.getCategoryDistribution();
      setCategoryDistributionData(list ?? []);
    } catch (e) {
      applyUiError(e, makeInlineDeps(setCatErr));
      setCategoryDistributionData([]);
    }

    try {
      const list = await adminApi.getTodayActiveHours();
      setTodayActiveHoursData(list ?? []);
    } catch (e) {
      applyUiError(e, makeInlineDeps(setHoursErr));
      setTodayActiveHoursData([]);
    }

    try {
      const list = await adminApi.getAuctionTrend(7);
      setAuctionTrendRowsData(list ?? []);
    } catch (e) {
      applyUiError(e, makeInlineDeps(setTrendErr));
      setAuctionTrendRowsData([]);
    }

    if (canViewTrade) {
      try {
        const list = await adminApi.getMonthlyTrade(6);
        setMonthlyTradeRowsData(list ?? []);
      } catch (e) {
        applyUiError(e, makeInlineDeps(setTradeErr));
        setMonthlyTradeRowsData([]);
      }
    } else {
      setMonthlyTradeRowsData([]);
    }

    setLoading(false);
  }, [canViewReports, canViewTrade, makeInlineDeps, setStats]);

  useEffect(() => {
    loadAll();
  }, [loadAll]);

  // ✅ “Home처럼” 핵심 실패면 내부 요소 전부 숨기고 에러 박스만
  if (overviewErr) {
    return (
      <AdminInlineErrorBox
        title="관리자 대시보드 데이터를 불러올 수 없습니다"
        message={overviewErr}
        onRetry={loadAll}
      />
    );
  }

  const topAuctions = useMemo(() => (topAuctionsData ?? []).slice(0, 5), [topAuctionsData]);

  const topReportGroups = useMemo(() => {
    return (reportGroupsData ?? [])
      .slice()
      .sort((a, b) => {
        const at = a.lastReportedAt ? new Date(a.lastReportedAt).getTime() : 0;
        const bt = b.lastReportedAt ? new Date(b.lastReportedAt).getTime() : 0;
        return bt - at;
      })
      .slice(0, 5);
  }, [reportGroupsData]);

  // 최근 7일 생성/종료
  const auctionTrendSeries: MultiLineSeries[] = useMemo(() => {
    const toLabel = (dateStr: string) => {
      const d = new Date(dateStr + "T00:00:00");
      const mm = String(d.getMonth() + 1).padStart(2, "0");
      const dd = String(d.getDate()).padStart(2, "0");
      return `${mm}/${dd}`;
    };

    const rows = Array.isArray(auctionTrendRowsData) ? auctionTrendRowsData : [];
    const labels = rows.map((r) => toLabel(r.date));

    return [
      {
        name: "생성",
        colorClass: "text-violet-600",
        points: rows.map((r, i) => ({ label: labels[i], value: Number(r.created ?? 0) })),
      },
      {
        name: "종료",
        colorClass: "text-blue-600",
        points: rows.map((r, i) => ({ label: labels[i], value: Number(r.ended ?? 0) })),
      },
    ];
  }, [auctionTrendRowsData]);

  // 카테고리 분포(도넛)
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
    for (const row of categoryDistributionData ?? []) {
      if (!row?.category) continue;
      map.set(row.category, Number(row.count ?? 0));
    }

    return base.map((b) => ({
      label: b.label,
      value: map.get(b.label) ?? 0,
      colorClass: b.colorClass,
    }));
  }, [categoryDistributionData]);

  // 금일 사용자 주 사용 시간대 (선형)
  const todayActiveHourLine: MultiLineSeries[] = useMemo(() => {
    const labels = ["00", "03", "06", "09", "12", "15", "18", "21"];
    const starts = [0, 3, 6, 9, 12, 15, 18, 21];

    const map = new Map<number, number>();
    for (const row of todayActiveHoursData ?? []) {
      const h = Number(row.hour);
      const c = Number(row.count ?? 0);
      if (!Number.isFinite(h)) continue;
      map.set(h, (map.get(h) ?? 0) + (Number.isFinite(c) ? c : 0));
    }

    const bucketValue = (start: number) => {
      let sum = 0;
      for (let h = start; h < start + 3; h++) sum += map.get(h) ?? 0;
      return sum;
    };

    const points = starts.map((s, i) => ({ label: labels[i], value: bucketValue(s) }));

    return [
      {
        name: "접속/활동",
        colorClass: "text-violet-600",
        points,
      },
    ];
  }, [todayActiveHoursData]);

  // 월별 거래 금액
  const monthlyTradeSeries: MultiLineSeries[] = useMemo(() => {
    if (!canViewTrade) {
      return [{ name: "월 거래 금액", colorClass: "text-emerald-600", points: [] }];
    }
    const rows = Array.isArray(monthlyTradeRowsData) ? monthlyTradeRowsData : [];

    const labelOf = (ym: string) => {
      const mm = Number(String(ym).split("-")[1] ?? 0);
      return mm ? `${mm}월` : ym;
    };

    return [
      {
        name: "월 거래 금액",
        colorClass: "text-emerald-600",
        points: rows.map((r) => ({ label: labelOf(r.ym), value: Number(r.amount ?? 0) })),
      },
    ];
  }, [monthlyTradeRowsData, canViewTrade]);

  const rightLinkCls =
    "text-[11px] text-gray-500 hover:text-gray-900 hover:underline cursor-pointer select-none";

  return (
    <div className="space-y-4">
      {/* 로딩(원하면 스켈레톤으로 교체) */}
      {loading && (
        <div className="bg-white border border-gray-100 rounded-2xl p-4 shadow-sm text-sm text-gray-500">
          불러오는 중...
        </div>
      )}

      {/* 헤더: ON/OFF + Last */}
      <div className="flex items-center justify-between">
        <div className="text-sm font-bold text-gray-900">실시간 모니터링</div>

        <div className="flex items-center gap-2">
          <span
            className={
              "text-[11px] px-2 py-0.5 rounded-full border " +
              (rtConnected
                ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                : "bg-gray-100 text-gray-600 border-gray-200")
            }
          >
            {rtConnected ? "ON" : "OFF"}
          </span>
          <span className="text-[11px] text-gray-500">Last: {formatKST(lastUpdatedAt)}</span>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <StatCard
          title="실시간 접속자"
          value={Number(stats.realtimeUsers ?? 0).toLocaleString()}
          icon={Activity}
          hint="최근 5분 활동 기준"
        />
        <StatCard
          title="진행중 경매"
          value={Number(stats.ongoingAuctions ?? 0).toLocaleString()}
          icon={Clock}
          hint="현재 진행"
        />
        <StatCard
          title="금일 활동 유저"
          value={Number(stats.todayActiveUsers ?? 0).toLocaleString()}
          icon={Users}
          hint="오늘 00:00~"
        />
        <StatCard
          title="금일 생성 경매"
          value={Number(stats.todayCreatedAuctions ?? 0).toLocaleString()}
          icon={Gavel}
          hint="오늘 생성"
        />

        <div className={"relative " + (!canViewReports ? "opacity-70 grayscale" : "")}>
          <StatCard
            title="신고(오픈)"
            value={canViewReports ? Number(stats.reportsOpen ?? 0).toLocaleString() : "—"}
            icon={AlertTriangle}
            hint={canViewReports ? "대기/처리중" : "ADMIN 전용"}
          />
          {!canViewReports && (
            <div className="absolute inset-0 rounded-2xl bg-gray-50/70 backdrop-blur-[1px] flex items-center justify-center pointer-events-none">
              <div className="text-sm font-semibold text-gray-500">권한이 없습니다</div>
            </div>
          )}
        </div>

        <StatCard
          title="전체 입찰"
          value={Number(stats.totalBids ?? 0).toLocaleString()}
          icon={TrendingUp}
          hint="누적"
        />

        <StatCard
          title="금일 종료"
          value={Number(stats.todayEndedAuctions ?? 0).toLocaleString()}
          icon={CheckCircle2}
          hint="타임아웃 포함"
        />

        <StatCard
          title="금일 판매"
          value={Number(stats.todaySoldAuctions ?? 0).toLocaleString()}
          icon={FileText}
          hint="낙찰/결제 완료"
        />
      </div>

      {/* 거래 금액 모니터링 */}
      <div className="relative rounded-2xl overflow-hidden">
        <div className={canViewTrade ? "" : "opacity-60 grayscale"}>
          <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
            <div className="bg-white border border-gray-100 rounded-2xl p-4 shadow-sm">
              <SectionTitle title="거래 금액 모니터링" right={null} />
              <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="p-3 rounded-xl bg-gray-50 border border-gray-100">
                  <div className="flex items-center justify-between">
                    <div className="text-[11px] text-gray-500">금일 총 거래 금액(GMV)</div>
                    <Wallet className="w-4 h-4 text-gray-500" />
                  </div>
                  <div className="mt-1 text-xl font-black text-gray-900">
                    {canViewTrade ? `₩${money(Number(stats.todayTradeAmount ?? 0))}` : "—"}
                  </div>
                  <div className="mt-1 text-[11px] text-gray-500">
                    {canViewTrade ? "결제 완료 기준(취소 제외)" : "ADMIN 전용"}
                  </div>
                </div>

                <div className="p-3 rounded-xl bg-gray-50 border border-gray-100">
                  <div className="flex items-center justify-between">
                    <div className="text-[11px] text-gray-500">월별 평균 거래 금액</div>
                    <TrendingUp className="w-4 h-4 text-gray-500" />
                  </div>
                  <div className="mt-1 text-xl font-black text-gray-900">
                    {canViewTrade ? `₩${money(Number(stats.monthlyAvgTradeAmount ?? 0))}` : "—"}
                  </div>
                  <div className="mt-1 text-[11px] text-gray-500">
                    {canViewTrade ? "최근 6개월 평균" : "ADMIN 전용"}
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-white border border-gray-100 rounded-2xl p-4 shadow-sm xl:col-span-2">
              <SectionTitle title="월별 거래 금액 추이" right={<span className="text-[11px] text-gray-500">최근 6개월</span>} />

              {canViewTrade && tradeErr ? (
                <AdminInlineErrorBox title="월별 거래 금액을 불러올 수 없습니다" message={tradeErr} onRetry={loadAll} />
              ) : (
                <>
                  <SimpleMultiLineChart
                    series={monthlyTradeSeries}
                    height={190}
                    yLabel="KRW"
                    valueLabelMode="all"
                    valueFormatter={fmtMillionKRW1}
                  />
                  <div className="mt-1 text-right text-[11px] text-gray-400">단위: 백만원</div>
                </>
              )}
            </div>
          </div>
        </div>

        {!canViewTrade && (
          <div className="absolute inset-0 bg-gray-50/70 backdrop-blur-[1px] flex items-center justify-center pointer-events-none">
            <div className="text-sm font-semibold text-gray-500">권한이 없습니다</div>
          </div>
        )}
      </div>

      {/* 7일 추이 + 카테고리 분포 */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
        <div className="bg-white border border-gray-100 rounded-2xl p-4 shadow-sm">
          <SectionTitle title="최근 7일 경매 생성 / 종료 추이" right={<span className="text-[11px] text-gray-500"></span>} />
          <br />
          {trendErr ? (
            <AdminInlineErrorBox title="경매 추이를 불러올 수 없습니다" message={trendErr} onRetry={loadAll} />
          ) : (
            <SimpleMultiLineChart series={auctionTrendSeries} height={190} yLabel="count" />
          )}
        </div>

        <div className="bg-white border border-gray-100 rounded-2xl p-4 shadow-sm">
          <SectionTitle title="카테고리 분포" right={<span className="text-[11px] text-gray-500"></span>} />
          <br />
          {catErr ? (
            <AdminInlineErrorBox title="카테고리 분포를 불러올 수 없습니다" message={catErr} onRetry={loadAll} />
          ) : (
            <SimpleDonutChart segments={categorySegments} size={180} thickness={16} />
          )}
        </div>
      </div>

      {/* 금일 사용 시간대 */}
      <div className="bg-white border border-gray-100 rounded-2xl p-4 shadow-sm">
        <SectionTitle title="금일 사용자 사용 시간대" right={<span className="text-[11px] text-gray-500"></span>} />
        {hoursErr ? (
          <AdminInlineErrorBox title="사용 시간대를 불러올 수 없습니다" message={hoursErr} onRetry={loadAll} />
        ) : (
          <SimpleMultiLineChart series={todayActiveHourLine} height={190} yLabel="" />
        )}
      </div>

      {/* 진행중 경매/신고 상위 */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
        <div className="bg-white border border-gray-100 rounded-2xl p-4 shadow-sm">
          <SectionTitle
            title="진행중 경매(상위)"
            right={
              <button
                type="button"
                className={rightLinkCls}
                onClick={() => navigate("/admin/auctions?page=1&size=10")}
              >
                경매 탭에서 상세
              </button>
            }
          />

          {topAuctionsErr ? (
            <AdminInlineErrorBox title="경매 목록을 불러올 수 없습니다" message={topAuctionsErr} onRetry={loadAll} />
          ) : (
            <div className="space-y-2">
              {topAuctions.map((a) => {
                const b = auctionBadge(a.status);
                return (
                  <div key={a.id} className="p-3 rounded-xl bg-gray-50 border border-gray-100 flex items-center gap-3">
                    <div className="min-w-0 flex-1">
                      <div className="text-sm font-semibold text-gray-900 truncate whitespace-nowrap">{a.title}</div>
                      <div className="text-[11px] text-gray-500 truncate whitespace-nowrap">
                        {a.id} · {a.category} · {a.sellerMasked}
                      </div>
                    </div>

                    <div className="w-[220px] text-right flex-none">
                      <div className="text-sm font-bold text-gray-900 truncate whitespace-nowrap">₩{money(a.currentBid)}</div>
                      <div className="text-[11px] text-gray-500 truncate whitespace-nowrap">
                        입찰 {a.bidCount} · {formatKST(a.endsAt)}
                      </div>
                    </div>

                    <div className="flex-none">
                      <span className={"text-[11px] px-2 py-1 rounded-full border whitespace-nowrap " + b.cls}>
                        {b.label}
                      </span>
                    </div>
                  </div>
                );
              })}

              {topAuctions.length === 0 && (
                <div className="py-8 text-center text-gray-500 text-sm">진행중 경매가 없습니다.</div>
              )}
            </div>
          )}
        </div>

        <div className="bg-white border border-gray-100 rounded-2xl p-4 shadow-sm relative">
          <SectionTitle
            title="최근 신고(상위)"
            right={
              canViewReports ? (
                <button type="button" className={rightLinkCls} onClick={() => navigate("/admin/reports")}>
                  신고 탭으로 이동
                </button>
              ) : (
                <span className="text-[11px] text-gray-400">ADMIN 전용</span>
              )
            }
          />

          {canViewReports && reportsErr ? (
            <AdminInlineErrorBox title="신고 목록을 불러올 수 없습니다" message={reportsErr} onRetry={loadAll} />
          ) : (
            <div className={canViewReports ? "space-y-2" : "space-y-2 opacity-40 pointer-events-none select-none"}>
              {topReportGroups.map((g) => {
                const cat = categoryBadge(g.category);
                const risk = pendingRiskBadge(g.pendingCount);

                return (
                  <div key={`${g.targetUserId}-${g.category}`} className="p-3 rounded-xl bg-gray-50 border border-gray-100">
                    <div className="flex items-center justify-between">
                      <div className="text-sm font-semibold text-gray-900">
                        {g.targetNickname?.trim() ? g.targetNickname : (g.targetName || "대상 유저")}
                        <span className="text-[11px] text-gray-400 ml-2">#{g.targetUserId}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className={"text-[11px] px-2 py-0.5 rounded-full border " + cat.cls}>{cat.label}</span>
                        <span className={"text-[11px] px-2 py-0.5 rounded-full border " + risk.cls}>{risk.label}</span>
                      </div>
                    </div>

                    <div className="mt-1 text-[11px] text-gray-500">
                      P {g.pendingCount} / A {g.acceptedCount} / R {g.rejectedCount} · {formatKST(g.lastReportedAt || "")}
                    </div>
                  </div>
                );
              })}

              {topReportGroups.length === 0 && canViewReports && (
                <div className="py-8 text-center text-gray-500 text-sm">최근 신고가 없습니다.</div>
              )}
            </div>
          )}

          {!canViewReports && (
            <div className="absolute inset-0 rounded-2xl bg-gray-50/70 backdrop-blur-[1px] flex items-center justify-center">
              <div className="text-sm font-semibold text-gray-500">권한이 없습니다</div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AdminOverviewPage;