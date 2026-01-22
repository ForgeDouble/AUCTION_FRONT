// // src/pages/admin/adminMockData.ts
// import type {
//   AdminOverviewResponse,
//   AuctionRow,
//   AdminReportGroupRow,
//   AdminReportItemRow,
//   // CalendarEventRow,
//   ReportCategory,
// } from "./adminTypes";

// function yyyyMmDd(d: Date): string {
//   const y = d.getFullYear();
//   const m = String(d.getMonth() + 1).padStart(2, "0");
//   const dd = String(d.getDate()).padStart(2, "0");
//   return `${y}-${m}-${dd}`;
// }

// export function createMockStats(): AdminOverviewResponse {
//   return {
//     todayNewUsers: 48,
//     todayCreatedAuctions: 23,
//     todayEndedAuctions: 18,
//     todaySoldAuctions: 14,
//     totalBids: 1247,
//     ongoingAuctions: 156,
//     reportsOpen: 7,
//     realtimeUsers: 342,
//     todayActiveUsers: 1523,

//     todayTradeAmount: 38500000,
//     monthlyAvgTradeAmount: 920000000,

//     todayActivityHourly: [
//       { hour: 0, users: 45 },
//       { hour: 3, users: 23 },
//       { hour: 6, users: 67 },
//       { hour: 9, users: 189 },
//       { hour: 12, users: 312 },
//       { hour: 15, users: 278 },
//       { hour: 18, users: 398 },
//       { hour: 21, users: 342 },
//     ],

//     statusReady: 12,
//     statusProcessing: 34,
//     statusSelled: 56,
//     statusNotselled: 78,
//   };
// }

// export function createMockAuctions(): AuctionRow[] {
//   return [
//     {
//       id: "A-1001",
//       title: "삼성 갤럭시 Z Fold 5",
//       sellerMasked: "seller***",
//       category: "전자제품",
//       currentBid: 1850000,
//       bidCount: 45,
//       endsAt: new Date(Date.now() + 2 * 60 * 60 * 1000 + 30 * 60 * 1000).toISOString(),
//       status: "HOT",
//     },
//     {
//       id: "A-1002",
//       title: "맥북 프로 14인치 M3",
//       sellerMasked: "apple***",
//       category: "전자제품",
//       currentBid: 2340000,
//       bidCount: 38,
//       endsAt: new Date(Date.now() + 5 * 60 * 60 * 1000 + 12 * 60 * 1000).toISOString(),
//       status: "HOT",
//     },
//     {
//       id: "A-1003",
//       title: "소니 A7M4 풀프레임",
//       sellerMasked: "camera***",
//       category: "전자제품",
//       currentBid: 2890000,
//       bidCount: 52,
//       endsAt: new Date(Date.now() + 30 * 60 * 1000).toISOString(),
//       status: "ENDING",
//     },
//     {
//       id: "A-1004",
//       title: "의류 랜덤 박스(브랜드 혼합)",
//       sellerMasked: "fashion***",
//       category: "의류/패션",
//       currentBid: 120000,
//       bidCount: 9,
//       endsAt: new Date(Date.now() + 9 * 60 * 60 * 1000).toISOString(),
//       status: "NORMAL",
//     },
//   ];
// }

// export function createMockReportGroups(): AdminReportGroupRow[] {
//   const now = Date.now();
//   const mk = (userId: number, nick: string, cat: ReportCategory, pending: number): AdminReportGroupRow => ({
//     targetUserId: userId,
//     targetName: "홍길동",
//     targetNickname: nick,
//     category: cat,
//     pendingCount: pending,
//     acceptedCount: 1,
//     rejectedCount: 0,
//     viewOnly: pending >= 5,
//     suspendedUntil: null,
//     warning: pending >= 3 ? 1 : 0,
//     lastReportedAt: new Date(now - userId * 60_000).toISOString(),
//   });

//   return [
//     mk(101, "seller***", "SCAM", 5),
//     mk(102, "spammy***", "SPAM", 3),
//     mk(103, "abuse***", "ABUSE", 1),
//   ];
// }

// export function createMockGroupReports(): AdminReportItemRow[] {
//   return [
//     {
//       id: 9001,
//       status: "PENDING",
//       content: "외부 연락 유도 문구가 있음.",
//       createdAt: new Date(Date.now() - 10 * 60 * 1000).toISOString(),
//       processedAt: null,
//       adminContent: null,
//       reporterId: 201,
//       reporterName: "김철수",
//       reporterNickname: "buyer***",
//     },
//     {
//       id: 9002,
//       status: "PENDING",
//       content: "동일 사진 반복 사용.",
//       createdAt: new Date(Date.now() - 25 * 60 * 1000).toISOString(),
//       processedAt: null,
//       adminContent: null,
//       reporterId: 202,
//       reporterName: "이영희",
//       reporterNickname: "user***",
//     },
//   ];
// }

// // export function createMockEvents(): CalendarEventRow[] {
// //   const today = new Date();
// //   return [
// //     { id: "E-4001", date: yyyyMmDd(today), time: "10:30", title: "운영: 신고 처리 회의", tag: "운영" },
// //     { id: "E-4002", date: yyyyMmDd(today), time: "14:00", title: "점검: 검색 인덱스 점검", tag: "점검" },
// //   ];
// // }
