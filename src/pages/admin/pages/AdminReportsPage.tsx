//  src/pages/admin/pages/AdminReportsPage.tsx
import React, { useMemo, useState } from "react";
import { Ban, CheckCircle2, UserCircle2, XCircle } from "lucide-react";
import { useAdminStore } from "../AdminContext";
import { SectionTitle } from "../components/AdminUi";
import { severityBadge, statusBadge } from "../components/badges";
import type { ReportRow, ReportStatus } from "../adminTypes";

function formatKST(iso: string): string {
  const d = new Date(iso);
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  const hh = String(d.getHours()).padStart(2, "0");
  const mi = String(d.getMinutes()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd} ${hh}:${mi}`;
}

const AdminReportsPage: React.FC = () => {
  const {
    reports,
    query,
    adminNick,
    auctions,
    suspendAuction,
    assignReport,
    resolveReport,
    reportStatusFilter,
    setReportStatusFilter,
    reportSeverityFilter,
    setReportSeverityFilter,
  } = useAdminStore();

  const [selectedId, setSelectedId] = useState<string>(reports[0]?.id ?? "");

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return reports.filter((r) => {
      if (reportStatusFilter !== "ALL" && r.status !== reportStatusFilter) return false;
      if (reportSeverityFilter !== "ALL" && r.severity !== reportSeverityFilter) return false;
      if (!q) return true;
      return (
        r.id.toLowerCase().includes(q) ||
        r.type.toLowerCase().includes(q) ||
        r.targetTitle.toLowerCase().includes(q) ||
        r.reporterMasked.toLowerCase().includes(q)
      );
    });
  }, [reports, query, reportStatusFilter, reportSeverityFilter]);

  const selected: ReportRow | null = useMemo(() => {
    const found = reports.find((r) => r.id === selectedId);
    return found || reports[0] || null;
  }, [reports, selectedId]);

  const onResolve = (next: ReportStatus): void => {
    if (!selected) return;
    resolveReport(selected.id, next);
  };

  return (
    <div className="grid grid-cols-1 xl:grid-cols-[420px_1fr] gap-4">
      <div className="bg-white border border-gray-100 rounded-2xl p-4 shadow-sm">
        <SectionTitle
          title="신고 리스트"
          right={
            <div className="flex items-center gap-2">
              <select
                value={reportStatusFilter}
                onChange={(e) => setReportStatusFilter(e.target.value as ReportStatus | "ALL")}
                className="text-xs border border-gray-200 rounded-xl px-2 py-2 bg-white"
              >
                <option value="ALL">상태 전체</option>
                <option value="대기">대기</option>
                <option value="처리중">처리중</option>
                <option value="완료">완료</option>
                <option value="반려">반려</option>
              </select>

              <select
                value={reportSeverityFilter}
                onChange={(e) => setReportSeverityFilter(e.target.value as any)}
                className="text-xs border border-gray-200 rounded-xl px-2 py-2 bg-white"
              >
                <option value="ALL">심각도 전체</option>
                <option value="LOW">LOW</option>
                <option value="MEDIUM">MEDIUM</option>
                <option value="HIGH">HIGH</option>
                <option value="CRITICAL">CRITICAL</option>
              </select>
            </div>
          }
        />

        <div className="space-y-2">
          {filtered
            .slice()
            .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
            .map((r) => {
              const sb = statusBadge(r.status);
              const sev = severityBadge(r.severity);
              const active = selectedId === r.id;
              return (
                <button
                  key={r.id}
                  onClick={() => setSelectedId(r.id)}
                  className={
                    "w-full text-left p-3 rounded-xl border transition " +
                    (active ? "bg-violet-50 border-violet-200" : "bg-gray-50 border-gray-100 hover:bg-gray-100")
                  }
                >
                  <div className="flex items-center justify-between gap-2">
                    <div className="text-sm font-semibold text-gray-900 truncate">{r.type}</div>
                    <div className="text-[11px] text-gray-400">#{r.id}</div>
                  </div>

                  <div className="mt-1 text-[11px] text-gray-500 truncate">{r.targetTitle}</div>

                  <div className="mt-2 flex items-center gap-2">
                    <span className={"text-[11px] px-2 py-0.5 rounded-full border " + sev.cls}>{sev.label}</span>
                    <span className={"text-[11px] px-2 py-0.5 rounded-full border " + sb.cls}>{sb.label}</span>
                    <span className="text-[11px] text-gray-500">{r.reporterMasked}</span>
                    <span className="text-[11px] text-gray-500">{formatKST(r.createdAt)}</span>
                  </div>
                </button>
              );
            })}

          {filtered.length === 0 && <div className="py-10 text-center text-gray-500">검색 결과가 없습니다.</div>}
        </div>
      </div>

      <div className="bg-white border border-gray-100 rounded-2xl p-4 shadow-sm">
        <SectionTitle title="신고 상세 / 처리" />

        {!selected && <div className="py-10 text-center text-gray-500">신고를 선택하세요.</div>}

        {selected && (
          <div className="space-y-3">
            <div className="p-3 rounded-xl bg-gray-50 border border-gray-100">
              <div className="flex items-center justify-between gap-2">
                <div className="text-sm font-bold text-gray-900">{selected.type}</div>
                <div className="text-[11px] text-gray-400">#{selected.id}</div>
              </div>
              <div className="mt-1 text-[12px] text-gray-700">
                대상: <span className="font-semibold">{selected.targetType}</span> · {selected.targetTitle}
              </div>
              <div className="mt-1 text-[12px] text-gray-700">
                신고자: {selected.reporterMasked} · 생성: {formatKST(selected.createdAt)}
              </div>
              <div className="mt-2 flex items-center gap-2">
                <span className={"text-[11px] px-2 py-1 rounded-full border " + severityBadge(selected.severity).cls}>
                  {severityBadge(selected.severity).label}
                </span>
                <span className={"text-[11px] px-2 py-1 rounded-full border " + statusBadge(selected.status).cls}>
                  {statusBadge(selected.status).label}
                </span>
                <span className="text-[11px] text-gray-500">
                  담당: {selected.assignedTo && selected.assignedTo.trim() ? selected.assignedTo : "미배정"}
                </span>
              </div>
            </div>

            <div className="p-3 rounded-xl bg-white border border-gray-100">
              <div className="text-xs font-semibold text-gray-900">내용</div>
              <div className="mt-2 text-sm text-gray-800 whitespace-pre-wrap break-words">{selected.description || "내용이 없습니다."}</div>
            </div>

            <div className="p-3 rounded-xl bg-white border border-gray-100">
              <div className="text-xs font-semibold text-gray-900">조치</div>

              <div className="mt-2 flex flex-wrap gap-2">
                <button
                  onClick={() => assignReport(selected.id, adminNick)}
                  className="px-3 py-2 rounded-xl border border-gray-200 hover:bg-gray-50 text-sm flex items-center gap-2"
                >
                  <UserCircle2 className="w-4 h-4" />
                  내게 배정
                </button>

                <button
                  onClick={() => onResolve("완료")}
                  className="px-3 py-2 rounded-xl bg-green-600 hover:bg-green-700 text-white text-sm flex items-center gap-2"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  완료 처리
                </button>

                <button
                  onClick={() => onResolve("반려")}
                  className="px-3 py-2 rounded-xl bg-gray-700 hover:bg-gray-800 text-white text-sm flex items-center gap-2"
                >
                  <XCircle className="w-4 h-4" />
                  반려
                </button>

                <button
                  onClick={() => {
                    const targetAuction = auctions.find((a) => selected.targetTitle.includes(a.title));
                    if (targetAuction) suspendAuction(targetAuction.id);
                    onResolve("처리중");
                  }}
                  className="px-3 py-2 rounded-xl border border-gray-200 hover:bg-gray-50 text-sm flex items-center gap-2"
                >
                  <Ban className="w-4 h-4" />
                  관련 경매 차단(샘플)
                </button>
              </div>

              <div className="mt-3 text-[11px] text-gray-500">
                운영 팁: 조치 로그(누가/언제/사유) + 증빙 링크는 반드시 남기는 걸 추천.
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminReportsPage;
