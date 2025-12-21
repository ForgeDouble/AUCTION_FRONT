// src/pages/admin/components/badges.ts
import type { AuctionStatus, ReportSeverity, ReportStatus } from "../adminTypes";

export function severityBadge(sev: ReportSeverity): { label: string; cls: string } {
  const map: Record<ReportSeverity, { label: string; cls: string }> = {
    LOW: { label: "LOW", cls: "bg-gray-100 text-gray-700 border-gray-200" },
    MEDIUM: { label: "MEDIUM", cls: "bg-blue-50 text-blue-700 border-blue-200" },
    HIGH: { label: "HIGH", cls: "bg-orange-50 text-orange-700 border-orange-200" },
    CRITICAL: { label: "CRITICAL", cls: "bg-red-50 text-red-700 border-red-200" },
  };
  return map[sev];
}

export function statusBadge(st: ReportStatus): { label: string; cls: string } {
  const map: Record<ReportStatus, { label: string; cls: string }> = {
    대기: { label: "대기", cls: "bg-yellow-50 text-yellow-800 border-yellow-200" },
    처리중: { label: "처리중", cls: "bg-blue-50 text-blue-700 border-blue-200" },
    완료: { label: "완료", cls: "bg-green-50 text-green-700 border-green-200" },
    반려: { label: "반려", cls: "bg-gray-50 text-gray-700 border-gray-200" },
  };
  return map[st];
}

export function auctionBadge(st: AuctionStatus): { label: string; cls: string } {
  const map: Record<AuctionStatus, { label: string; cls: string }> = {
    NORMAL: { label: "일반", cls: "bg-gray-50 text-gray-700 border-gray-200" },
    HOT: { label: "HOT", cls: "bg-red-50 text-red-700 border-red-200" },
    ENDING: { label: "마감임박", cls: "bg-orange-50 text-orange-700 border-orange-200" },
    SUSPENDED: { label: "차단", cls: "bg-gray-200 text-gray-700 border-gray-300" },
  };
  return map[st];
}
