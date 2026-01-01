export type TabKey = "overview" | "auctions" | "reports" | "calendar" | "notices";

export type ReportCategory = "SPAM" | "AD" | "ABUSE" | "HATE" | "SCAM" | "OTHER";
export type BackendReportStatus = "PENDING" | "ACCEPTED" | "REJECTED";

export type AuctionStatus = "NORMAL" | "HOT" | "ENDING" | "SUSPENDED";

export type NoticeCategory = "HANDOVER" | "SYSTEM" | "POLICY" | "ETC";

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

export interface AdminOverviewResponse extends OverviewStats {
  todayActivityHourly: Array<{ hour: number; users: number }>;

  statusReady: number;
  statusProcessing: number;
  statusSelled: number;
  statusNotselled: number;
}

// 상품/경매 부분
export interface AuctionRow {
  id: string;
  title: string;
  sellerMasked: string;
  category: string;
  currentBid: number;
  bidCount: number;
  endsAt: string;
  status: AuctionStatus;
}

// 신고 부분
export interface AdminReportGroupRow {
  targetUserId: number;
  targetName?: string | null;
  targetNickname?: string | null;
  category: ReportCategory;

  pendingCount: number;
  acceptedCount: number;
  rejectedCount: number;

  viewOnly: boolean;
  suspendedUntil?: string | null;
  warning: number;

  lastReportedAt?: string | null;
}

export type SpringPage<T> = {
  content: T[];
  number: number;
  size: number;
  totalElements: number;
  totalPages: number;
  first?: boolean;
  last?: boolean;
};
// 신고 그룹 상세 아이템
export interface AdminReportItemRow {
  id: number;
  status: BackendReportStatus;

  content?: string | null;

  createdAt?: string | null;
  processedAt?: string | null;
  adminContent?: string | null;

  reporterId?: number | null;
  reporterName?: string | null;
  reporterNickname?: string | null;
}

// 인수인계 부분

export interface NoticeRow {
  id: number;
  category: NoticeCategory;
  title: string;
  content: string;
  pinned: boolean;
  importance: number;

  authorUserId: number;
  authorEmail: string;
  authorNickname: string;

  createdAt: string;
  updatedAt: string;
}

// 캘린더 부분
export interface CalendarEventRow {
  id: string;
  date: string; // YYYY-MM-DD
  time?: string; // HH:mm
  title: string;
  tag?: "운영" | "장애" | "정산" | "점검" | "기타";
}

// 상품 차단 목록 AdminBlockedProductDto
export interface BlockedProductRow {
  productId: number;
  productName: string;
  reportCount: number;
  blockedAt?: string | null;
  blockedReason?: string | null;
}