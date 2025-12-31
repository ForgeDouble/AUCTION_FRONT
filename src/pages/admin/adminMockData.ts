// src/pages/admin/adminMockData.ts
import type { AdminOverviewResponse, AuctionRow, CalendarEventRow, NoticeRow, ReportRow } from "./adminTypes";
function yyyyMmDd(d: Date): string {
const y = d.getFullYear();
const m = String(d.getMonth() + 1).padStart(2, "0");
const dd = String(d.getDate()).padStart(2, "0");
return `${y}-${m}-${dd}`;
}

export function createMockStats(): AdminOverviewResponse {
  return {
    todayNewUsers: 48,
    todayCreatedAuctions: 23,
    todayEndedAuctions: 18,
    todaySoldAuctions: 14,
    totalBids: 1247,
    ongoingAuctions: 156,
    reportsOpen: 7,
    realtimeUsers: 342,
    todayActiveUsers: 1523,
    todayTradeAmount: 38500000,
    monthlyAvgTradeAmount: 920000000,

    todayActivityHourly: [
      { hour: 0, users: 45 },
      { hour: 3, users: 23 },
      { hour: 6, users: 67 },
      { hour: 9, users: 189 },
      { hour: 12, users: 312 },
      { hour: 15, users: 278 },
      { hour: 18, users: 398 },
      { hour: 21, users: 342 },
    ],

    statusReady: 12,
    statusProcessing: 34,
    statusSelled: 56,
    statusNotselled: 78,


  };
}

export function createMockAuctions(): AuctionRow[] {
  return [
    {
      id: "A-1001",
      title: "삼성 갤럭시 Z Fold 5",
      sellerMasked: "seller***",
      category: "전자제품",
      currentBid: 1850000,
      bidCount: 45,
      endsAt: new Date(Date.now() + 2 * 60 * 60 * 1000 + 30 * 60 * 1000).toISOString(),
      status: "HOT",
    },
    {
      id: "A-1002",
      title: "맥북 프로 14인치 M3",
      sellerMasked: "apple***",
      category: "전자제품",
      currentBid: 2340000,
      bidCount: 38,
      endsAt: new Date(Date.now() + 5 * 60 * 60 * 1000 + 12 * 60 * 1000).toISOString(),
      status: "HOT",
    },
    {
      id: "A-1003",
      title: "소니 A7M4 풀프레임",
      sellerMasked: "camera***",
      category: "전자제품",
      currentBid: 2890000,
      bidCount: 52,
      endsAt: new Date(Date.now() + 30 * 60 * 1000).toISOString(),
      status: "ENDING",
    },
    {
      id: "A-1004",
      title: "의류 랜덤 박스(브랜드 혼합)",
      sellerMasked: "fashion***",
      category: "의류/패션",
      currentBid: 120000,
      bidCount: 9,
      endsAt: new Date(Date.now() + 9 * 60 * 60 * 1000).toISOString(),
      status: "NORMAL",
    },
  ];
}

export function createMockReports(): ReportRow[] {
  return [
    {
      id: "R-2001",
      type: "부적절한 상품",
      targetType: "PRODUCT",
      targetTitle: "아이폰 14 Pro(박스 미개봉)",
      reporterMasked: "user***",
      createdAt: new Date(Date.now() - 10 * 60 * 1000).toISOString(),
      status: "대기",
      severity: "HIGH",
      assignedTo: "",
      description: "금지 품목 의심. 상세 설명이 과도하게 모호합니다.",
      evidenceUrl: "",
    },
    {
      id: "R-2002",
      type: "사기 의심",
      targetType: "USER",
      targetTitle: "seller*** (판매자 계정)",
      reporterMasked: "buyer***",
      createdAt: new Date(Date.now() - 25 * 60 * 1000).toISOString(),
      status: "처리중",
      severity: "CRITICAL",
      assignedTo: "ops-1",
      description: "동일 사진 반복 / 외부 연락 유도 문구가 있음.",
      evidenceUrl: "",
    },
    {
      id: "R-2003",
      type: "욕설/비방",
      targetType: "CHAT",
      targetTitle: "채팅방 A-1004",
      reporterMasked: "seller***",
      createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
      status: "대기",
      severity: "MEDIUM",
      assignedTo: "",
      description: "채팅 내 비방/욕설 포함",
      evidenceUrl: "",
    },
    {
      id: "R-2004",
      type: "허위 정보",
      targetType: "PRODUCT",
      targetTitle: "LG 그램 17인치(상태 S급)",
      reporterMasked: "user2***",
      createdAt: new Date(Date.now() - 3 * 60 * 60 * 1000).toISOString(),
      status: "완료",
      severity: "LOW",
      assignedTo: "ops-2",
      description: "설명과 사진 불일치. 판매글 수정 안내 및 경고 처리 완료.",
      evidenceUrl: "",
    },
  ];
}

export function createMockNotices(author: string): NoticeRow[] {
  return [
    {
      id: "N-3001",
      pinned: true,
      title: "인수인계: 신고 처리 기준(업데이트)",
      body:
        "CRITICAL은 즉시 임시차단 후 증빙 확보 → 30분 내 1차 판정.\nHIGH는 2시간 내 처리.\n채팅 신고는 채팅 로그 보존(7일) 확인 후 조치.",
      author,
      createdAt: new Date(Date.now() - 6 * 60 * 60 * 1000).toISOString(),
      acknowledged: false,
    },
    {
      id: "N-3002",
      pinned: false,
      title: "정산 점검 일정",
      body: "매일 02:10~02:20 정산 배치. 해당 시간대 결제/정산 지표 변동은 정상 범주.",
      author,
      createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
      acknowledged: true,
    },
  ];
}

export function createMockEvents(): CalendarEventRow[] {
  const today = new Date();
  return [
    { id: "E-4001", date: yyyyMmDd(today), time: "10:30", title: "운영: 신고 처리 회의", tag: "운영" },
    { id: "E-4002", date: yyyyMmDd(today), time: "14:00", title: "점검: 검색 인덱스 점검", tag: "점검" },
  ];
}
