// src/pages/admin/components/badges.ts
import type { AuctionStatus, BackendReportStatus, ReportCategory } from "../adminTypes";

// 신고 관련 부분 컴포넌트 + 옥션(경매) 컴포넌트

export function reportStatusBadge(st: BackendReportStatus): { label: string; cls: string } {
  const map: Record<BackendReportStatus, { label: string; cls: string }> = {
    PENDING: { label: "접수", cls: "bg-yellow-50 text-yellow-800 border-yellow-200" },
    ACCEPTED: { label: "승인", cls: "bg-green-50 text-green-700 border-green-200" },
    REJECTED: { label: "기각", cls: "bg-gray-50 text-gray-700 border-gray-200" },
  };
  return map[st];
}

export function categoryBadge(cat: ReportCategory): { label: string; cls: string } {
  const map: Record<ReportCategory, { label: string; cls: string }> = {
    SPAM: { label: "SPAM", cls: "bg-gray-100 text-gray-700 border-gray-200" },
    AD: { label: "AD", cls: "bg-blue-50 text-blue-700 border-blue-200" },
    ABUSE: { label: "ABUSE", cls: "bg-orange-50 text-orange-700 border-orange-200" },
    HATE: { label: "HATE", cls: "bg-red-50 text-red-700 border-red-200" },
    SCAM: { label: "SCAM", cls: "bg-violet-50 text-violet-700 border-violet-200" },
    OTHER: { label: "OTHER", cls: "bg-gray-50 text-gray-700 border-gray-200" },
  };
  return map[cat];
}

export function pendingRiskBadge(pendingCount: number): { label: string; cls: string } {
  if (pendingCount >= 5) return { label: "임계치", cls: "bg-red-50 text-red-700 border-red-200" };
  if (pendingCount >= 3) return { label: "주의", cls: "bg-orange-50 text-orange-700 border-orange-200" };
  if (pendingCount >= 1) return { label: "관찰", cls: "bg-blue-50 text-blue-700 border-blue-200" };
  return { label: "없음", cls: "bg-gray-50 text-gray-600 border-gray-200" };
}

// 옥션 뱃지
export function auctionBadge(status?: string) {
  const s = String(status ?? "UNKNOWN").toUpperCase();

  const map: Record<string, { label: string; cls: string }> = {
    READY: { label: "대기", cls: "bg-gray-50 text-gray-700 border-gray-200" },
    PROCESSING: { label: "진행중", cls: "bg-gray-50 text-gray-700 border-gray-200" },
    SELLED: { label: "낙찰", cls: "bg-gray-50 text-gray-700 border-gray-200" },
    SUSPENDED: { label: "임시정지", cls: "bg-gray-50 text-gray-700 border-gray-200"},
    NOTSELLED: { label: "유찰", cls: "bg-gray-50 text-gray-700 border-gray-200" },
    BLOCKED: { label: "차단", cls: "bg-gray-50 text-gray-700 border-gray-200" },
  };

  return map[s] ?? { label: s, cls: "bg-gray-50 text-gray-700 border-gray-200" };
}
