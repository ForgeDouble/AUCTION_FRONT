//  src/pages/admin/AdminTypes.ts
export type TabKey = "overview" | "auctions" | "reports" | "calendar" | "notices";

export type ReportStatus = "대기" | "처리중" | "완료" | "반려";
export type ReportSeverity = "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
export type AuctionStatus = "NORMAL" | "HOT" | "ENDING" | "SUSPENDED";

export interface OverviewStats {
  todayNewUsers: number;
  todayCreatedAuctions: number;
  todayEndedAuctions: number;
  todaySoldAuctions: number;
  totalBids: number;
  ongoingAuctions: number;
  reportsOpen: number;
  realtimeUsers: number;
  todayActiveUsers: number;
  todayTradeAmount: number;
  monthlyAvgTradeAmount: number;
}

export interface AuctionRow {
  id: string;
  title: string;
  sellerMasked: string;
  category: string;
  currentBid: number;
  bidCount: number;
  endsAt: string; // ISO
  status: AuctionStatus;
}

export interface ReportRow {
  id: string;
  type: string;
  targetType: "PRODUCT" | "CHAT" | "USER" | "COMMENT";
  targetTitle: string;
  reporterMasked: string;
  createdAt: string; // ISO
  status: ReportStatus;
  severity: ReportSeverity;
  assignedTo?: string;
  description?: string;
  evidenceUrl?: string;
}

export interface NoticeRow {
  id: string;
  pinned: boolean;
  title: string;
  body: string;
  author: string;
  createdAt: string; // ISO
  acknowledged: boolean;
}

export interface CalendarEventRow {
  id: string;
  date: string; // YYYY-MM-DD
  time?: string; // HH:mm
  title: string;
  tag?: "운영" | "장애" | "정산" | "점검" | "기타";
}
