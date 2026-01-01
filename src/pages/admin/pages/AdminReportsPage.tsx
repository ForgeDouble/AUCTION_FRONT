// src/pages/admin/pages/AdminReportsPage.tsx
import React, { useEffect, useMemo, useState } from "react";
import { Ban, CheckCircle2, ShieldAlert, XCircle, RefreshCw, Unlock } from "lucide-react";
import { useAdminStore } from "../AdminContext";
import { SectionTitle } from "../components/AdminUi";
import { categoryBadge, pendingRiskBadge, reportStatusBadge } from "../components/badges";
import type { AdminReportGroupRow, AdminReportItemRow, ReportCategory, SpringPage } from "../adminTypes";

function formatKST(iso?: string | null): string {
  if (!iso) return "-";
  const d = new Date(iso);
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  const hh = String(d.getHours()).padStart(2, "0");
  const mi = String(d.getMinutes()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd} ${hh}:${mi}`;
}

function groupKey(g: AdminReportGroupRow): string {
  return `${g.targetUserId}::${g.category}`;
}

const AdminReportsPage: React.FC = () => {
  const {
    reportGroups,
    query,
    adminNick,
    fetchGroupReports,
    resolveReportGroup,
    adminSuspendUser,
    adminLiftAll,

    blockedProducts,
    refreshBlockedProducts,
    liftBlockedProduct,
  } = useAdminStore();

  const [selectedKey, setSelectedKey] = useState<string>("");

  // ✅ 필터(프론트에서 가볍게)
  const [statusFilter, setStatusFilter] = useState<"ALL" | "PENDING" | "ACCEPTED" | "REJECTED">("ALL");
  const [categoryFilter, setCategoryFilter] = useState<ReportCategory | "ALL">("ALL");
  const [minPending, setMinPending] = useState<number>(0);

  // ✅ 선택된 그룹
  const selectedGroup: AdminReportGroupRow | null = useMemo(() => {
    const found = reportGroups.find((g) => groupKey(g) === selectedKey);
    return found || reportGroups[0] || null;
  }, [reportGroups, selectedKey]);

  useEffect(() => {
    if (!selectedKey && reportGroups[0]) setSelectedKey(groupKey(reportGroups[0]));
  }, [reportGroups, selectedKey]);

  // ✅ 좌측 리스트 필터링
  const filteredGroups = useMemo(() => {
    const q = query.trim().toLowerCase();

    return reportGroups
      .filter((g) => {
        if (categoryFilter !== "ALL" && g.category !== categoryFilter) return false;
        if (minPending > 0 && (g.pendingCount ?? 0) < minPending) return false;

        if (statusFilter !== "ALL") {
          if (statusFilter === "PENDING" && !(g.pendingCount > 0)) return false;
          if (statusFilter === "ACCEPTED" && !(g.acceptedCount > 0)) return false;
          if (statusFilter === "REJECTED" && !(g.rejectedCount > 0)) return false;
        }

        if (!q) return true;

        const name = (g.targetName ?? "").toLowerCase();
        const nick = (g.targetNickname ?? "").toLowerCase();
        const cat = String(g.category).toLowerCase();
        const id = String(g.targetUserId);

        return name.includes(q) || nick.includes(q) || cat.includes(q) || id.includes(q);
      })
      .slice()
      .sort((a, b) => {
        const at = a.lastReportedAt ? new Date(a.lastReportedAt).getTime() : 0;
        const bt = b.lastReportedAt ? new Date(b.lastReportedAt).getTime() : 0;
        return bt - at;
      });
  }, [reportGroups, query, statusFilter, categoryFilter, minPending]);

  // ✅ 우측: 그룹 상세 리스트(페이지)
  const [page, setPage] = useState(0);
  const [size] = useState(12);
  const [detail, setDetail] = useState<SpringPage<AdminReportItemRow> | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);

  useEffect(() => {
    (async () => {
      if (!selectedGroup) return;
      setDetailLoading(true);
      try {
        const res = await fetchGroupReports(selectedGroup.targetUserId, selectedGroup.category, page, size);
        setDetail(res);
      } catch (e) {
        console.error(e);
        setDetail(null);
      } finally {
        setDetailLoading(false);
      }
    })();
  }, [selectedGroup?.targetUserId, selectedGroup?.category, page, size]);

  useEffect(() => {
    setPage(0);
  }, [selectedGroup?.targetUserId, selectedGroup?.category]);

  // ✅ 조치 입력
  const [adminContent, setAdminContent] = useState<string>("");
  const [suspendDays, setSuspendDays] = useState<number>(0);

  const doAccept = async () => {
    if (!selectedGroup) return;
    const ok = window.confirm("이 그룹의 PENDING 신고를 승인(ACCEPTED) 처리할까요?");
    if (!ok) return;

    try {
      await resolveReportGroup(selectedGroup.targetUserId, selectedGroup.category, {
        accept: true,
        adminContent: adminContent.trim() ? adminContent.trim() : undefined,
        suspendDays: suspendDays, // 0이면 경고만
      });

      const res = await fetchGroupReports(selectedGroup.targetUserId, selectedGroup.category, page, size);
      setDetail(res);
      alert("승인 처리 완료");
    } catch (e) {
      console.error(e);
      alert("승인 처리 실패");
    }
  };

  const doReject = async () => {
    if (!selectedGroup) return;
    const ok = window.confirm("이 그룹의 PENDING 신고를 기각(REJECTED) 처리할까요?");
    if (!ok) return;

    try {
      await resolveReportGroup(selectedGroup.targetUserId, selectedGroup.category, {
        accept: false,
        adminContent: adminContent.trim() ? adminContent.trim() : undefined,
      });

      const res = await fetchGroupReports(selectedGroup.targetUserId, selectedGroup.category, page, size);
      setDetail(res);
      alert("기각 처리 완료");
    } catch (e) {
      console.error(e);
      alert("기각 처리 실패");
    }
  };

  const doSuspend = async () => {
    if (!selectedGroup) return;
    const daysStr = window.prompt("정지 일수(days)를 입력하세요", "3") || "";
    const days = Number(daysStr);
    if (!Number.isFinite(days) || days <= 0) return;

    const reason = window.prompt("정지 사유(선택)", adminContent || "") || "";

    try {
      await adminSuspendUser(selectedGroup.targetUserId, days, reason);
      alert("정지 처리 완료");
    } catch (e) {
      console.error(e);
      alert("정지 처리 실패");
    }
  };

  const doLift = async () => {
    if (!selectedGroup) return;
    const reason = window.prompt("해제 사유(선택)", "") || "";

    try {
      await adminLiftAll(selectedGroup.targetUserId, reason);
      alert("제재 해제 완료");
    } catch (e) {
      console.error(e);
      alert("제재 해제 실패");
    }
  };

  // ✅ 차단 상품 해제
  const doLiftBlockedProduct = async (productId: number) => {
    const reason = window.prompt("차단 해제 사유(선택)", "") || "";
    const reset = window.confirm("신고 카운터를 초기화할까요? (기본: 예)");
    try {
      await liftBlockedProduct({ productId, reason: reason.trim() ? reason.trim() : undefined, resetCounter: reset });
      alert("차단 해제 완료");
    } catch (e) {
      console.error(e);
      alert("차단 해제 실패");
    }
  };

  return (
    <div className="grid grid-cols-1 xl:grid-cols-[420px_1fr] gap-4">
      {/* 좌측: 그룹 리스트 */}
      <div className="bg-white border border-gray-100 rounded-2xl p-4 shadow-sm">
        <SectionTitle
          title="신고 그룹(유저 × 카테고리)"
          right={
            <div className="flex items-center gap-2">
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value as any)}
                className="text-xs border border-gray-200 rounded-xl px-2 py-2 bg-white"
              >
                <option value="ALL">상태 전체</option>
                <option value="PENDING">접수(PENDING)</option>
                <option value="ACCEPTED">승인(ACCEPTED)</option>
                <option value="REJECTED">기각(REJECTED)</option>
              </select>

              <select
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value as any)}
                className="text-xs border border-gray-200 rounded-xl px-2 py-2 bg-white"
              >
                <option value="ALL">카테고리 전체</option>
                <option value="SPAM">SPAM</option>
                <option value="AD">AD</option>
                <option value="ABUSE">ABUSE</option>
                <option value="HATE">HATE</option>
                <option value="SCAM">SCAM</option>
                <option value="OTHER">OTHER</option>
              </select>

              <input
                type="number"
                min={0}
                value={minPending}
                onChange={(e) => setMinPending(Number(e.target.value))}
                className="w-[92px] text-xs border border-gray-200 rounded-xl px-2 py-2 bg-white"
                placeholder="minPending"
                title="최소 pending"
              />
            </div>
          }
        />

        <div className="space-y-2">
          {filteredGroups.map((g) => {
            const key = groupKey(g);
            const active = key === selectedKey;

            const cat = categoryBadge(g.category);
            const risk = pendingRiskBadge(g.pendingCount);

            return (
              <button
                key={key}
                onClick={() => setSelectedKey(key)}
                className={
                  "w-full text-left p-3 rounded-xl border transition " +
                  (active ? "bg-violet-50 border-violet-200" : "bg-gray-50 border-gray-100 hover:bg-gray-100")
                }
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <div className="text-sm font-semibold text-gray-900 truncate">
                      {(g.targetNickname && g.targetNickname.trim()) ? g.targetNickname : (g.targetName || "대상 유저")}
                      <span className="text-[11px] text-gray-400 ml-2">#{g.targetUserId}</span>
                    </div>

                    <div className="mt-1 text-[11px] text-gray-500 truncate">
                      last: {formatKST(g.lastReportedAt)}
                    </div>
                  </div>

                  <div className="shrink-0 text-right">
                    <div className="text-[11px] text-gray-500">P {g.pendingCount} / A {g.acceptedCount} / R {g.rejectedCount}</div>
                  </div>
                </div>

                <div className="mt-2 flex flex-wrap items-center gap-2">
                  <span className={"text-[11px] px-2 py-0.5 rounded-full border " + cat.cls}>{cat.label}</span>
                  <span className={"text-[11px] px-2 py-0.5 rounded-full border " + risk.cls}>{risk.label}</span>

                  {g.viewOnly ? (
                    <span className="text-[11px] px-2 py-0.5 rounded-full border bg-red-50 text-red-700 border-red-200">
                      viewOnly
                    </span>
                  ) : null}

                  {g.suspendedUntil ? (
                    <span className="text-[11px] px-2 py-0.5 rounded-full border bg-gray-50 text-gray-700 border-gray-200">
                      정지 ~ {formatKST(g.suspendedUntil)}
                    </span>
                  ) : null}

                  {g.warning > 0 ? (
                    <span className="text-[11px] px-2 py-0.5 rounded-full border bg-orange-50 text-orange-700 border-orange-200">
                      warning {g.warning}
                    </span>
                  ) : null}
                </div>
              </button>
            );
          })}

          {filteredGroups.length === 0 && <div className="py-10 text-center text-gray-500">검색 결과가 없습니다.</div>}
        </div>
      </div>

      {/* 우측: 상세/처리 + 차단 상품 */}
      <div className="space-y-4">
        {/* 유저 신고 상세 */}
        <div className="bg-white border border-gray-100 rounded-2xl p-4 shadow-sm">
          <SectionTitle title="신고 상세 / 처리(그룹 단위)" />

          {!selectedGroup && <div className="py-10 text-center text-gray-500">그룹을 선택하세요.</div>}

          {selectedGroup && (
            <div className="space-y-3">
              <div className="p-3 rounded-xl bg-gray-50 border border-gray-100">
                <div className="flex items-center justify-between gap-2">
                  <div className="text-sm font-bold text-gray-900">
                    {(selectedGroup.targetNickname && selectedGroup.targetNickname.trim())
                      ? selectedGroup.targetNickname
                      : (selectedGroup.targetName || "대상 유저")}
                    <span className="text-[11px] text-gray-400 ml-2">#{selectedGroup.targetUserId}</span>
                  </div>

                  <span className={"text-[11px] px-2 py-1 rounded-full border " + categoryBadge(selectedGroup.category).cls}>
                    {categoryBadge(selectedGroup.category).label}
                  </span>
                </div>

                <div className="mt-2 flex flex-wrap items-center gap-2">
                  <span className={"text-[11px] px-2 py-1 rounded-full border " + pendingRiskBadge(selectedGroup.pendingCount).cls}>
                    pending {selectedGroup.pendingCount}
                  </span>
                  <span className="text-[11px] px-2 py-1 rounded-full border bg-white border-gray-200 text-gray-700">
                    accepted {selectedGroup.acceptedCount}
                  </span>
                  <span className="text-[11px] px-2 py-1 rounded-full border bg-white border-gray-200 text-gray-700">
                    rejected {selectedGroup.rejectedCount}
                  </span>
                  <span className="text-[11px] text-gray-500">last: {formatKST(selectedGroup.lastReportedAt)}</span>
                </div>

                <div className="mt-2 text-[12px] text-gray-700">
                  상태:{" "}
                  {selectedGroup.viewOnly ? (
                    <span className="font-semibold text-red-700">viewOnly</span>
                  ) : (
                    <span className="font-semibold text-gray-700">normal</span>
                  )}
                  {selectedGroup.suspendedUntil ? (
                    <span className="ml-2 text-gray-600">· 정지 ~ {formatKST(selectedGroup.suspendedUntil)}</span>
                  ) : null}
                  {selectedGroup.warning > 0 ? (
                    <span className="ml-2 text-orange-700">· warning {selectedGroup.warning}</span>
                  ) : null}
                </div>
              </div>

              {/* 조치 입력 */}
              <div className="p-3 rounded-xl bg-white border border-gray-100">
                <div className="text-xs font-semibold text-gray-900">조치</div>

                <div className="mt-2 grid grid-cols-1 md:grid-cols-3 gap-2">
                  <div className="md:col-span-2">
                    <div className="text-[11px] text-gray-500 mb-1">운영 메모(adminContent)</div>
                    <textarea
                      value={adminContent}
                      onChange={(e) => setAdminContent(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl border border-gray-200 text-sm min-h-[90px]"
                      placeholder="승인/기각/정지 근거를 남겨두면 운영 품질이 올라가요."
                    />
                  </div>

                  <div>
                    <div className="text-[11px] text-gray-500 mb-1">승인 시 정지일수(suspendDays)</div>
                    <input
                      type="number"
                      min={0}
                      value={suspendDays}
                      onChange={(e) => setSuspendDays(Number(e.target.value))}
                      className="w-full px-3 py-2 rounded-xl border border-gray-200 text-sm"
                    />
                    <div className="mt-2 text-[11px] text-gray-500">
                      0이면 경고만 증가(정지 없음)
                    </div>

                    <div className="mt-3 flex flex-col gap-2">
                      <button
                        onClick={doAccept}
                        className="px-3 py-2 rounded-xl bg-green-600 hover:bg-green-700 text-white text-sm flex items-center gap-2 justify-center"
                      >
                        <CheckCircle2 className="w-4 h-4" />
                        승인(ACCEPT)
                      </button>

                      <button
                        onClick={doReject}
                        className="px-3 py-2 rounded-xl bg-gray-700 hover:bg-gray-800 text-white text-sm flex items-center gap-2 justify-center"
                      >
                        <XCircle className="w-4 h-4" />
                        기각(REJECT)
                      </button>

                      <button
                        onClick={doSuspend}
                        className="px-3 py-2 rounded-xl border border-gray-200 hover:bg-gray-50 text-sm flex items-center gap-2 justify-center"
                      >
                        <ShieldAlert className="w-4 h-4" />
                        즉시 정지
                      </button>

                      <button
                        onClick={doLift}
                        className="px-3 py-2 rounded-xl border border-gray-200 hover:bg-gray-50 text-sm flex items-center gap-2 justify-center"
                      >
                        <Unlock className="w-4 h-4" />
                        제재 해제
                      </button>
                    </div>
                  </div>
                </div>

                <div className="mt-3 text-[11px] text-gray-500">
                  운영 팁: 그룹 단위로 승인/기각하면 Redis 카운터(원자 이동)와 사용자 상태(viewOnly/정지/경고)가 같이 정합되도록 설계돼 있어요.
                </div>
              </div>

              {/* 그룹 상세 리스트 */}
              <div className="p-3 rounded-xl bg-white border border-gray-100">
                <div className="flex items-center justify-between">
                  <div className="text-xs font-semibold text-gray-900">그룹 상세 신고 리스트</div>
                  <button
                    onClick={async () => {
                      if (!selectedGroup) return;
                      setDetailLoading(true);
                      try {
                        const res = await fetchGroupReports(selectedGroup.targetUserId, selectedGroup.category, page, size);
                        setDetail(res);
                      } finally {
                        setDetailLoading(false);
                      }
                    }}
                    className="px-3 py-2 rounded-xl border border-gray-200 hover:bg-gray-50 text-sm flex items-center gap-2"
                  >
                    <RefreshCw className="w-4 h-4" />
                    새로고침
                  </button>
                </div>

                {detailLoading && <div className="py-6 text-center text-gray-500 text-sm">불러오는 중...</div>}

                {!detailLoading && detail && (
                  <div className="mt-3">
                    <div className="space-y-2">
                      {detail.content.map((it) => {
                        const sb = reportStatusBadge(it.status);
                        return (
                          <div key={it.id} className="p-3 rounded-xl bg-gray-50 border border-gray-100">
                            <div className="flex items-start justify-between gap-2">
                              <div className="min-w-0">
                                <div className="text-sm font-semibold text-gray-900">
                                  #{it.id}{" "}
                                  <span className={"ml-2 text-[11px] px-2 py-0.5 rounded-full border " + sb.cls}>{sb.label}</span>
                                </div>

                                <div className="mt-1 text-[11px] text-gray-500">
                                  신고자: {(it.reporterNickname && it.reporterNickname.trim()) ? it.reporterNickname : (it.reporterName || "알 수 없음")} · 생성 {formatKST(it.createdAt)}
                                  {it.processedAt ? <span> · 처리 {formatKST(it.processedAt)}</span> : null}
                                </div>
                              </div>
                            </div>

                            <div className="mt-2 text-sm text-gray-800 whitespace-pre-wrap break-words">
                              {it.content && String(it.content).trim() ? it.content : "(내용 없음)"}
                            </div>

                            {it.adminContent && String(it.adminContent).trim() ? (
                              <div className="mt-2 text-[12px] text-gray-700">
                                운영 메모: <span className="font-medium">{it.adminContent}</span>
                              </div>
                            ) : null}
                          </div>
                        );
                      })}

                      {detail.content.length === 0 && <div className="py-8 text-center text-gray-500">데이터가 없습니다.</div>}
                    </div>

                    <div className="mt-3 flex items-center justify-between">
                      <div className="text-[11px] text-gray-500">
                        page {detail.number + 1} / {detail.totalPages} · total {detail.totalElements}
                      </div>

                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => setPage((p) => Math.max(0, p - 1))}
                          disabled={detail.number <= 0}
                          className="px-3 py-2 rounded-xl border border-gray-200 hover:bg-gray-50 text-sm disabled:opacity-50"
                        >
                          이전
                        </button>
                        <button
                          onClick={() => setPage((p) => Math.min(detail.totalPages - 1, p + 1))}
                          disabled={detail.number >= detail.totalPages - 1}
                          className="px-3 py-2 rounded-xl border border-gray-200 hover:bg-gray-50 text-sm disabled:opacity-50"
                        >
                          다음
                        </button>
                      </div>
                    </div>
                  </div>
                )}

                {!detailLoading && !detail && <div className="py-8 text-center text-gray-500">상세 데이터를 불러오지 못했습니다.</div>}
              </div>
            </div>
          )}
        </div>

        {/* 상품 신고: 차단 상품 목록 */}
        <div className="bg-white border border-gray-100 rounded-2xl p-4 shadow-sm">
          <SectionTitle
            title="차단 상품(신고 임계치 초과)"
            right={
              <button
                onClick={() => void refreshBlockedProducts()}
                className="px-3 py-2 rounded-xl border border-gray-200 hover:bg-gray-50 text-sm flex items-center gap-2"
              >
                <RefreshCw className="w-4 h-4" />
                새로고침
              </button>
            }
          />

          <div className="mt-3 space-y-2">
            {blockedProducts.map((p) => (
              <div key={p.productId} className="p-3 rounded-xl bg-gray-50 border border-gray-100">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <div className="text-sm font-semibold text-gray-900 truncate">
                      #{p.productId} · {p.productName}
                    </div>
                    <div className="mt-1 text-[11px] text-gray-500">
                      신고 카운트: {p.reportCount} · 차단시각: {formatKST(p.blockedAt)}
                    </div>
                    {p.blockedReason ? (
                      <div className="mt-2 text-[12px] text-gray-700 whitespace-pre-wrap break-words">
                        사유: {p.blockedReason}
                      </div>
                    ) : null}
                  </div>

                  <button
                    onClick={() => void doLiftBlockedProduct(p.productId)}
                    className="px-3 py-2 rounded-xl border border-gray-200 hover:bg-gray-50 text-sm flex items-center gap-2"
                  >
                    <Ban className="w-4 h-4" />
                    해제
                  </button>
                </div>
              </div>
            ))}

            {blockedProducts.length === 0 && <div className="py-8 text-center text-gray-500">차단된 상품이 없습니다.</div>}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminReportsPage;
