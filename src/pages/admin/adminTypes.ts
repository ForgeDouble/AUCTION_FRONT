export type TabKey = "overview" | "auctions" | "reports" | "calendar" | "notices";

export type ReportCategory = "SPAM" | "AD" | "ABUSE" | "HATE" | "SCAM" | "OTHER";
export type BackendReportStatus = "PENDING" | "ACCEPTED" | "REJECTED";

export type AuctionStatus = "NORMAL" | "HOT" | "ENDING" | "SUSPENDED" | "READY" | "PROCESSING" | "SELLED" | "NOTSELLED" | "BLOCKED" | "SUSPENDED" | "UNKNOWN";

export type NoticeCategory = "HANDOVER" | "SYSTEM" | "POLICY" | "ETC";

export type Authority = "USER" | "ADMIN" | "INQUIRY";

export type Gender = "M" | "W"; 

export type ChatRoomType = "NORMAL" | "INQUIRY" | "ADMIN_GROUP" | "STAFF_GROUP";

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
  memo?: string | null;
}

// 상품 차단 목록 AdminBlockedProductDto
export interface BlockedProductRow {
  productId: number;
  productName: string;
  reportCount: number;
  blockedAt?: string | null;
  blockedReason?: string | null;
}

export type CategoryDistributionRow = {
  category: string;
  count: number;
};

export type ActiveHourBucketRow = {
  hour: string;
  count: number;
};

// 최근 7일 내 경매 생성/종료
export type AuctionTrendRow = {
  date: string;
  created: number;
  ended: number;
};

// 월별 경매 추이(금액)
export type MonthlyTradeRow = {
  ym: string;
  amount: number;
};


// 관리자 유저 생성 관련 
export type AdminUserCreateReq = {
  email: string;
  name: string;
  password: string;

  gender: Gender;
  birthday: string; 
  phone: string;

  address?: string | null;
  nickname?: string | null;
};

export type AdminUserRow = {
  userId: number;
  email: string;
  name: string;
  nickname?: string | null;
  authority: Authority;
  phone?: string | null;
  profileImageUrl?: string | null;
  warning?: number | null;
  suspendedUntil?: string | null;
  viewOnly?: boolean | null;
  delYn?: "N" | "Y";
  createdAt?: string | null;
};

export type AdminUserCounts = {
  ADMIN: number;
  INQUIRY: number;
  USER: number;
};

export type AdminUserPageRes = {
  items: AdminUserRow[];
  page: number;
  size: number;
  totalElements: number;
  totalPages: number;
  counts?: AdminUserCounts;
};

// 채팅 관련
export type ChatUserSummary = {
  userId?: number;
  email: string;
  nickname?: string | null;
  authority?: "USER" | "INQUIRY" | "ADMIN";
  profileImageUrl?: string | null;
};

export type AdminChatRoomRow = {
  id: string;
  roomName: string;
  roomType?: ChatRoomType;
  adminChat?: boolean;
  participantIds?: string[];
  recentText?: string | null;
  recentTime?: string | null;
  unread?: number;
  // canRename?: boolean
  // roomKey?: string
};

export type AdminChatFileRow = {
  fileName: string;
  fileUrl: string;
};

export type AdminChatMessageRow = {
  id: string;
  roomId: string;
  senderId: string;
  messageType: "TALK" | "IMAGE" | "FILE" | "SYSTEM";
  message?: string | null;
  files?: AdminChatFileRow[];
  createdAt?: string | null;
  sender?: ChatUserSummary | null;
};

export type AdminChatCreateGroupReq = {
  title?: string | null;
  participantEmails?: string[];
  staffOnly?: boolean;
};

export type AdminChatInviteReq = {
  targetEmail: string;
};

export type AdminChatMemberRow = {
  userId?: number;
  email: string;
  nickname?: string | null;
  authority?: "USER" | "INQUIRY" | "ADMIN";
  profileImageUrl?: string | null;
};

