// src/pages/admin/AdminContext.tsx
import React, { createContext, useContext, useEffect, useMemo, useRef, useCallback, useState, } from "react";
import type {
  AdminOverviewResponse,
  AuctionRow,
  CalendarEventRow,
  NoticeRow,
  NoticeCategory,
  AdminReportGroupRow,
  ReportCategory,
  SpringPage,
  AdminReportItemRow,
  BlockedProductRow,
  CategoryDistributionRow,
  ActiveHourBucketRow,
  AuctionTrendRow,
  MonthlyTradeRow,
  AdminUserRow,
  AdminUserCreateReq,
  Authority,
  AdminUserPageRes,
  AdminUserCounts,
  AdminChatRoomRow
} from "./adminTypes";
import { adminApi } from "./adminApi";
import { Client } from "@stomp/stompjs";
import SockJS from "sockjs-client";

// import { createMockAuctions, createMockReportGroups, createMockStats } from "./adminMockData";

function nowIso(): string {
  return new Date().toISOString();
}

// function clamp(n: number, min: number, max: number): number {
//   return Math.max(min, Math.min(max, n));
// }

// 권한 확인을 위한 헬퍼
function parseAuthorityFromTokenPayload(payload: Record<string, unknown>): "ADMIN" | "INQUIRY" | "USER" {
  const pick =
    (payload as any)?.authority ??
    (payload as any)?.role ??
    (payload as any)?.userRole ??
    (payload as any)?.userAuthority;

  const cleaned = String(pick ?? "USER")
    .trim()
    .toUpperCase()
    .replace(/^ROLE_/, "");

  if (cleaned.includes("ADMIN")) return "ADMIN";
  if (cleaned.includes("INQUIRY")) return "INQUIRY";
  return "USER";
}

function safeGetAdminProfile(): { email: string; nick: string; role: string } {
  const token = localStorage.getItem("accessToken");
  const fallback = { email: "admin@example.com", nick: "관리자", role: "ADMIN" };
  if (!token) return fallback;

  const parts = token.split(".");
  if (parts.length < 2) return fallback;

  try {
    const base64 = parts[1].replace(/-/g, "+").replace(/_/g, "/");
    const padded = base64.padEnd(base64.length + (4 - (base64.length % 4)) % 4, "=");
    const json = decodeURIComponent(
      Array.from(atob(padded))
        .map((c) => "%" + c.charCodeAt(0).toString(16).padStart(2, "0"))
        .join("")
    );
    const payload = JSON.parse(json) as Record<string, unknown>;

    const email = typeof payload.email === "string" ? payload.email : fallback.email;
    const nick =
      typeof (payload as any).nick === "string" ? (payload as any).nick :
      typeof (payload as any).nickname === "string" ? (payload as any).nickname :
      typeof (payload as any).name === "string" ? (payload as any).name :
      fallback.nick;
    const role = parseAuthorityFromTokenPayload(payload);

    return { email, nick, role };
  } catch {
    return fallback;
  }
}

// 초기값 셋팅
function emptyAdminStats(): AdminOverviewResponse {
  return {
  todayNewUsers: 0,
  todayCreatedAuctions: 0,
  todayEndedAuctions: 0,
  todaySoldAuctions: 0,
  totalBids: 0,
  ongoingAuctions: 0,
  reportsOpen: 0,
  realtimeUsers: 0,
  todayActiveUsers: 0,

  todayTradeAmount: 0,
  monthlyAvgTradeAmount: 0,

  todayActivityHourly: [],
  statusReady: 0,
  statusProcessing: 0,
  statusSelled: 0,
  statusNotselled: 0,
  };
}
export interface AdminStore {
  adminEmail: string;
  adminNick: string;
  adminRole: string;
  rtConnected: boolean;
  query: string;
  setQuery: (v: string) => void;

  lastUpdatedAt: string;
  refreshAll: (opts?: { auctionsPageUi?: number; auctionsSize?: number }) => Promise<void>;

  stats: AdminOverviewResponse;
  setStats: React.Dispatch<React.SetStateAction<AdminOverviewResponse>>;

  // 경매 모니터링 관련
  auctions: AuctionRow[];
  setAuctions: React.Dispatch<React.SetStateAction<AuctionRow[]>>;

  auctionsPage: SpringPage<AuctionRow> | null;
  auctionsPageIndex: number;
  auctionsPageSize: number;

  auctionsTotalPages: number;
  auctionsTotalElements: number;

  setAuctionsPagingFromUrl: (pageUi: number, size: number) => void;
  refreshAuctionsPage: () => Promise<void>;

  overviewTopAuctions: AuctionRow[];
  refreshOverviewTopAuctions: () => Promise<void>; 

  // 신고(유저)
  reportGroups: AdminReportGroupRow[];
  setReportGroups: React.Dispatch<React.SetStateAction<AdminReportGroupRow[]>>;

  fetchGroupReports: (targetUserId: number, category: ReportCategory, page: number, size: number) => Promise<SpringPage<AdminReportItemRow>>;
  resolveReportGroup: (targetUserId: number, category: ReportCategory, payload: { accept: boolean; adminContent?: string; suspendDays?: number }) => Promise<void>;
  adminSuspendUser: (targetUserId: number, days: number, reason?: string) => Promise<void>;
  adminLiftAll: (targetUserId: number, reason?: string) => Promise<void>;

  // 신고(상품)
  blockedProducts: BlockedProductRow[];
  setBlockedProducts: React.Dispatch<React.SetStateAction<BlockedProductRow[]>>;
  refreshBlockedProducts: () => Promise<void>;
  liftBlockedProduct: (payload: { productId: number; reason?: string; resetCounter?: boolean }) => Promise<void>;

  // 공지(인수인계)
  notices: NoticeRow[];
  setNotices: React.Dispatch<React.SetStateAction<NoticeRow[]>>;

  noticePage: number;
  noticeSize: number;
  noticeTotalPages: number;
  noticeTotalElements: number;
  goNoticePage: (page: number) => void;

  addNotice: (payload: {
    category: NoticeCategory;
    title: string;
    content: string;
    pinned?: boolean;
    importance?: number;
  }) => void;
  updateNotice: (
    id: number,
    payload: {
      category?: NoticeCategory;
      title?: string;
      content?: string;
      pinned?: boolean;
      importance?: number;
    }
  ) => void;
  deleteNotice: (id: number) => void;

  // 캘린더
  events: CalendarEventRow[];
  setEvents: React.Dispatch<React.SetStateAction<CalendarEventRow[]>>;
  refreshEvents: () => Promise<void>;
  addEvent: (e: Omit<CalendarEventRow, "id">) => Promise<void>;
  updateEvent: (id: string, payload: Partial<Omit<CalendarEventRow, "id">>) => Promise<void>;
  deleteEvent: (id: string) => Promise<void>;
  moveEventDate: (id: string, newDate: string) => Promise<void>;

  // 뱃지 관련(카운팅)
  noticesCount: number;
  pinnedNoticesCount: number;
  reportsOpenCount: number;

  // 경매 조치
  suspendAuction: (auctionId: string) => void;
  forceEndAuction: (auctionId: string) => void;

  // 카테고리 확인용(overview)
  categoryDistribution: CategoryDistributionRow[];
  setCategoryDistribution: React.Dispatch<React.SetStateAction<CategoryDistributionRow[]>>;
  refreshCategoryDistribution: () => Promise<void>;

  todayActiveHours: ActiveHourBucketRow[];
  setTodayActiveHours: React.Dispatch<React.SetStateAction<ActiveHourBucketRow[]>>;
  refreshTodayActiveHours: () => Promise<void>;

  // 최근 7일 내 경매 생성/종료 
  auctionTrendRows: AuctionTrendRow[];
  refreshAuctionTrend: () => Promise<void>;

  // 월 별 경매 계산
  monthlyTradeRows: MonthlyTradeRow[];
  refreshMonthlyTrade: () => Promise<void>;

  // 로그인 연장(토큰 재발급 + localStorage 변경
  extendAdminSession: () => Promise<void>;

  users: AdminUserRow[];
  setUsers: React.Dispatch<React.SetStateAction<AdminUserRow[]>>;
  refreshUsers: () => Promise<void>;

  createAdminUser: (payload: AdminUserCreateReq) => Promise<void>;
  createInquiryUser: (payload: AdminUserCreateReq) => Promise<void>;

  // 유저 페이징 관련
  usersPage: AdminUserPageRes | null;

  usersPageIndex: number;
  usersPageSize: number;
  usersTotalPages: number;
  usersTotalElements: number;

  usersCounts: AdminUserCounts;

  refreshUsersPage: (params?: { page?: number; size?: number; role?: "ALL" | Authority; q?: string }) => Promise<void>;
  goUsersPage: (pageIndex: number) => void;
  changeUsersPageSize: (size: number) => void;

  // 채팅 관련
  chatRooms: AdminChatRoomRow[];
  setChatRooms: React.Dispatch<React.SetStateAction<AdminChatRoomRow[]>>;
  refreshChatRooms: () => Promise<void>;
  chatUnreadTotal: number;
}

const Ctx = createContext<AdminStore | null>(null);

export function useAdminStore(): AdminStore {
  const v = useContext(Ctx);
  if (!v) throw new Error("useAdminStore must be used within AdminProvider");
  return v;
}

export const AdminProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const profile = useMemo(() => safeGetAdminProfile(), []);
  const [query, setQuery] = useState<string>("");
  const [lastUpdatedAt, setLastUpdatedAt] = useState<string>(nowIso());

  const [stats, setStats] = useState<AdminOverviewResponse>(() => emptyAdminStats());

  const [auctions, setAuctions] = useState<AuctionRow[]>([]);
  const [auctionsPage, setAuctionsPage] = useState<SpringPage<AuctionRow> | null>(null);

  const [auctionsPageIndex, setAuctionsPageIndex] = useState<number>(0);
  const [auctionsPageSize, setAuctionsPageSize] = useState<number>(10);

  const [auctionsTotalPages, setAuctionsTotalPages] = useState<number>(1);
  const [auctionsTotalElements, setAuctionsTotalElements] = useState<number>(0);

  const [overviewTopAuctions, setOverviewTopAuctions] = useState<AuctionRow[]>([]);
  // const auctionsPagingRef = useRef<{ index: number; size: number }>({ index: -1, size: -1 });

  const [reportGroups, setReportGroups] = useState<AdminReportGroupRow[]>([]);

  const [events, setEvents] = useState<CalendarEventRow[]>([]);
  
  const [notices, setNotices] = useState<NoticeRow[]>([]);
  const [noticePage, setNoticePage] = useState(0);
  const [noticeSize, setNoticeSize] = useState(10);
  const [noticeTotalPages, setNoticeTotalPages] = useState(1);
  const [noticeTotalElements, setNoticeTotalElements] = useState(0);

  const [blockedProducts, setBlockedProducts] = useState<BlockedProductRow[]>([]);
  const [categoryDistribution, setCategoryDistribution] = useState<CategoryDistributionRow[]>([]);
  const [todayActiveHours, setTodayActiveHours] = useState<ActiveHourBucketRow[]>([]);

  const [auctionTrendRows, setAuctionTrendRows] = useState<AuctionTrendRow[]>([]);
  const [monthlyTradeRows, setMonthlyTradeRows] = useState<MonthlyTradeRow[]>([]);

  const [users, setUsers] = useState<AdminUserRow[]>([]);
  const [usersPage, setUsersPage] = useState<AdminUserPageRes | null>(null);

  const [usersPageIndex, setUsersPageIndex] = useState(0);
  const [usersPageSize, setUsersPageSize] = useState(10);
  const [usersTotalPages, setUsersTotalPages] = useState(1);
  const [usersTotalElements, setUsersTotalElements] = useState(0);

  const [usersCounts, setUsersCounts] = useState<AdminUserCounts>({ ADMIN: 0, INQUIRY: 0, USER: 0 });

  const [chatRooms, setChatRooms] = useState<AdminChatRoomRow[]>([]);
  type AdminRealtimePayload = {
    realtimeUsers?: number;
    todayActiveUsers?: number;
    ongoingAuctions?: number;
    ts?: number;
  };
  const [rtConnected, setRtConnected] = useState(false);
  const rtClientRef = useRef<Client | null>(null);
  const [rtTokenVersion, setRtTokenVersion] = useState(0);

useEffect(() => {
  const base = (import.meta.env.VITE_API_BASE as string | undefined) ?? "";
  const token = localStorage.getItem("accessToken");
  if (!base || !token) {
    setRtConnected(false);
    return;
  }

  if (rtClientRef.current) {
    try { rtClientRef.current.deactivate(); } catch {}
    rtClientRef.current = null;
  }

  const urlBase = base.replace(/\/$/, "");
  const client = new Client({
    webSocketFactory: () => new SockJS(`${urlBase}/ws-admin`) as any,
    connectHeaders: { Authorization: `Bearer ${token}` },
    reconnectDelay: 3000,
    debug: () => {},
    onConnect: () => {
      setRtConnected(true);

      client.subscribe("/topic/admin/realtime", (frame) => {
        try {
          const data = JSON.parse(frame.body || "{}") as {
            realtimeUsers?: number;
            ts?: number;
          };
          setStats((prev) => ({
            ...prev,
            realtimeUsers: Number(data.realtimeUsers ?? prev.realtimeUsers ?? 0),
          }));

          setLastUpdatedAt(nowIso());
        } catch (e) {
          console.error("admin realtime parse error", e);
        }
      });
    },
    onWebSocketClose: () => setRtConnected(false),
    onStompError: () => setRtConnected(false),
  });

  rtClientRef.current = client;
  client.activate();

  return () => {
    try { client.deactivate(); } catch {}
    rtClientRef.current = null;
    setRtConnected(false);
  };
}, [rtTokenVersion]);

  
  const computeCountsFromItems = useCallback((items: AdminUserRow[]): AdminUserCounts => {
    return items.reduce(
      (acc, u) => {
        if (u.authority === "ADMIN") acc.ADMIN += 1;
        else if (u.authority === "INQUIRY") acc.INQUIRY += 1;
        else acc.USER += 1;
        return acc;
      },
      { ADMIN: 0, INQUIRY: 0, USER: 0 } as AdminUserCounts
    );
  }, []);

  useEffect(() => {
    const t = window.setTimeout(() => {
      void fetchNoticesPage(0, noticeSize);
    }, 250);
    return () => window.clearTimeout(t);
  }, [query]);

  const usersPagingRef = useRef<{ page: number; size: number; role: "ALL" | Authority; q: string }>({
    page: 0,
    size: 10,
    role: "ALL",
    q: "",
  });

  const fetchUsersPage = useCallback(async (params?: { page?: number; size?: number; role?: "ALL" | Authority; q?: string }) => {
    const next = {
      page: Math.max(0, params?.page ?? usersPagingRef.current.page ?? 0),
      size: Math.max(1, Math.min(params?.size ?? usersPagingRef.current.size ?? 10, 100)),
      role: (params?.role ?? usersPagingRef.current.role ?? "ALL") as "ALL" | Authority,
      q: (params?.q ?? usersPagingRef.current.q ?? "").trim(),
    };

    usersPagingRef.current = next;

    const res = await adminApi.getUsersPage(next);

    setUsersPage(res);

    setUsers(res.items);

    setUsersPageIndex(res.page);
    setUsersPageSize(res.size);
    setUsersTotalPages(Math.max(1, res.totalPages));
    setUsersTotalElements(res.totalElements);

    if (res.counts) setUsersCounts(res.counts);
  }, [setUsers]);

  const fetchNoticesPage = async (pg: number, sz: number): Promise<void> => {
    const qv = query.trim();

    const res = await adminApi.getNoticesPage({
      page: pg,
      size: sz,
      q: qv ? qv : undefined,
    });

    setNotices(res.items);
    setNoticePage(res.page);
    setNoticeSize(res.size);
    setNoticeTotalPages(Math.max(1, res.totalPages));
    setNoticeTotalElements(res.totalElements);
  };

  const fetchAuctionsPage = useCallback(async (pageIndex: number, size: number): Promise<void> => {
    const p = Math.max(0, pageIndex);
    const s = Math.max(1, Math.min(size, 100));

    const pg = await adminApi.getAuctionsPage({ page: p, size: s });
    setAuctionsPage(pg);

    const content = Array.isArray(pg?.content) ? pg.content : [];
    setAuctions(content);

    const tp = (pg as any)?.totalPages ?? 1;
    const te = (pg as any)?.totalElements ?? content.length;

    setAuctionsTotalPages(Math.max(1, Number(tp) || 1));
    setAuctionsTotalElements(Number(te) || 0);
  }, []);

  const refreshAuctionsPage = useCallback(async (): Promise<void> => {
    await fetchAuctionsPage(auctionsPageIndex, auctionsPageSize);
  }, [fetchAuctionsPage, auctionsPageIndex, auctionsPageSize]);

  const refreshOverviewTopAuctions = useCallback(async (): Promise<void> => {
    try {
      const pg = await adminApi.getAuctionsPage({ page: 0, size: 5 });
      const content = Array.isArray(pg?.content) ? pg.content : [];
      setOverviewTopAuctions(content);
    } catch (e) {
      console.error(e);
      setOverviewTopAuctions([]);
    }
  }, []);

  const setAuctionsPagingFromUrl = useCallback((pageUi: number, size: number) => {
    const uiPage = Number.isFinite(pageUi) ? pageUi : 1;
    const uiSize = Number.isFinite(size) ? size : 10;

    const nextSize = Math.max(1, Math.min(uiSize, 100));
    const nextIndex = Math.max(0, Math.max(1, uiPage) - 1);

    setAuctionsPageIndex(nextIndex);
    setAuctionsPageSize(nextSize);

    void fetchAuctionsPage(nextIndex, nextSize);
  }, [fetchAuctionsPage]);

  const refreshBlockedProducts = async (): Promise<void> => {
    try {
      const list = await adminApi.getBlockedProducts();
      setBlockedProducts(list);
    } catch (e) {
      console.error(e);
    }
  };
  const refreshEvents = async (): Promise<void> => {
    try {
      const list = await adminApi.getEvents();
      setEvents(list);
    } catch (e) {
      console.error(e);
    }
  };

  const refreshCategoryDistribution = async (): Promise<void> => {
    try {
      const list = await adminApi.getCategoryDistribution();
      setCategoryDistribution(list);
    } catch (e) {
      console.error(e);
    }
  };

  const refreshTodayActiveHours = async (): Promise<void> => {
    try {
      const list = await adminApi.getTodayActiveHours();
      setTodayActiveHours(list);
    } catch (e) {
      console.error(e);
    }
  };

  const refreshAuctionTrend = useCallback(async (): Promise<void> => {
    try {
      const rows = await adminApi.getAuctionTrend(7);
      setAuctionTrendRows(rows);
    } catch (e) {
      console.error(e);
      setAuctionTrendRows([]);
    }
  }, []);

  const refreshMonthlyTrade = useCallback(async (): Promise<void> => {
    try {
      const rows = await adminApi.getMonthlyTrade(6);
      setMonthlyTradeRows(rows);
    } catch (e) {
      console.error(e);
      setMonthlyTradeRows([]);
    }
  }, []);

  const refreshChatRooms = useCallback(async () => {
    try {
      const list = await adminApi.getMyChatRooms();
      setChatRooms(list ?? []);
    } catch (e) {
      console.error(e);
      setChatRooms([]);
    }
  }, []);

  const chatUnreadTotal = useMemo(() => {
    return (chatRooms ?? []).reduce((acc, r) => acc + (Number((r as any).unread ?? 0) || 0), 0);
  }, [chatRooms]);
  // const refreshUsers = useCallback(async () => {
  //   try {
  //     const list = await adminApi.getUsers();
  //     setUsers(list);
  //   } catch (e) {
  //     console.error(e);
  //     setUsers([]);
  //   }
  // }, []);
  const refreshUsers = useCallback(async () => {
    try {
      await fetchUsersPage({ page: 0 });
    } catch (e) {
      console.error(e);
      setUsers([]);
    }
  }, [fetchUsersPage]);

  const refreshUsersPage = useCallback(
    async (params?: { page?: number; size?: number; role?: "ALL" | Authority; q?: string }) => {
      await fetchUsersPage(params);
    },
    [fetchUsersPage]
  );
  
  const createAdminUser = useCallback(
    async (payload: AdminUserCreateReq) => {
      await adminApi.createAdminUser(payload);
      await refreshUsersPage({ page: 0, size: usersPageSize, role: "ALL", q: "" });
    },
    [refreshUsersPage, usersPageSize]
  );

  const createInquiryUser = useCallback(
    async (payload: AdminUserCreateReq) => {
      await adminApi.createInquiryUser(payload);
      await refreshUsersPage({ page: 0, size: usersPageSize, role: "ALL", q: "" });
    },
    [refreshUsersPage, usersPageSize]
  );


  const goUsersPage: AdminStore["goUsersPage"] = (pageIndex) => {
    const pg = Math.max(0, Math.min(pageIndex, usersTotalPages - 1));
    void fetchUsersPage({ page: pg });
  };

  const changeUsersPageSize: AdminStore["changeUsersPageSize"] = (size) => {
    const sz = Math.max(1, Math.min(size, 100));
    void fetchUsersPage({ page: 0, size: sz });
  };

  const refreshAll: AdminStore["refreshAll"] = async (opts) => {
    const results = await Promise.allSettled([
      adminApi.getOverview(),
      adminApi.getReportGroups(),
      adminApi.getBlockedProducts(),
      adminApi.getEvents(),
      adminApi.getCategoryDistribution(),
      adminApi.getTodayActiveHours(),
      adminApi.getAuctionTrend(7),
      adminApi.getMonthlyTrade(6),
      adminApi.getMyChatRooms(),
    ]);

    // const [ovR, auctR, groupR, blockedR, evR, catR, hourR] = results;
    const [ovR, groupR, blockedR, evR, catR, hourR, trendR, tradeR, chatR] = results;
    if (ovR.status === "fulfilled") setStats(ovR.value);
    // if (auctR.status === "fulfilled") setAuctions(auctR.value);
    if (groupR.status === "fulfilled") setReportGroups(groupR.value);
    if (blockedR.status === "fulfilled") setBlockedProducts(blockedR.value);
    if (evR.status === "fulfilled") setEvents(evR.value);
    if (catR.status === "fulfilled") setCategoryDistribution(catR.value);
    if (hourR.status === "fulfilled") setTodayActiveHours(hourR.value);
    if (trendR.status === "fulfilled") setAuctionTrendRows(trendR.value);
    if(tradeR.status === "fulfilled") setMonthlyTradeRows(tradeR.value);
    if (chatR.status === "fulfilled") setChatRooms(chatR.value ?? []);

    const uiPage = opts?.auctionsPageUi;
    const uiSize = opts?.auctionsSize;

    if (typeof uiPage === "number" || typeof uiSize === "number") {
      const nextSize = Math.max(1, Math.min(uiSize ?? auctionsPageSize, 100));
      const nextIndex = Math.max(0, (Math.max(1, uiPage ?? (auctionsPageIndex + 1)) - 1));

      setAuctionsPageIndex(nextIndex);
      setAuctionsPageSize(nextSize);
      await fetchAuctionsPage(nextIndex, nextSize);
    } else {
      await refreshAuctionsPage();
    }

    await refreshOverviewTopAuctions();
    await fetchNoticesPage(noticePage, noticeSize);
    setLastUpdatedAt(nowIso());
  };

  useEffect(() => {
    void refreshAll();
  }, []);

  // useEffect(() => {
  //   const base = (import.meta.env.VITE_API_BASE as string | undefined) ?? "";
  //   const token = localStorage.getItem("accessToken");

  //   if (!token) return;

  //   if (rtClientRef.current) {
  //     try { rtClientRef.current.deactivate(); } catch {}
  //     rtClientRef.current = null;
  //   }

  //   const urlBase = base.replace(/\/$/, "");
  //   const sock = new SockJS(`${urlBase}/ws-admin`);

  //   const client = new Client({
  //     webSocketFactory: () => sock as any,
  //     connectHeaders: {
  //       Authorization: `Bearer ${token}`,
  //     },
  //     reconnectDelay: 2000,
  //     debug: () => {},
  //     onConnect: () => {
  //       client.subscribe("/topic/admin/realtime", (frame) => {
  //         try {
  //           const data = JSON.parse(frame.body || "{}") as AdminRealtimePayload;

  //           setStats((prev) => ({
  //             ...prev,
  //             realtimeUsers: Number(data.realtimeUsers ?? prev.realtimeUsers ?? 0),
  //             todayActiveUsers: Number(data.todayActiveUsers ?? prev.todayActiveUsers ?? 0),
  //             ongoingAuctions: Number(data.ongoingAuctions ?? prev.ongoingAuctions ?? 0),
  //           }));

  //           setLastUpdatedAt(nowIso());
  //         } catch (e) {
  //           console.error("admin realtime parse error", e);
  //         }
  //       });
  //     },
  //   });

  //   rtClientRef.current = client;
  //   client.activate();

  //   return () => {
  //     try { client.deactivate(); } catch {}
  //     rtClientRef.current = null;
  //   };
  // }, [rtTokenVersion]);


  const suspendAuction = (auctionId: string): void => {
    (async () => {
      const reason = window.prompt("임시차단 사유를 입력하세요") || "";
      if (!reason.trim()) return;

      try {
        await adminApi.suspendAuction(auctionId, reason.trim());
        // setAuctions((prev) => prev.map((a) => (a.id === auctionId ? { ...a, status: "SUSPENDED" } : a)));
        await refreshAuctionsPage();
        await refreshOverviewTopAuctions();
      } catch (e) {
        console.error(e);
        alert("임시차단에 실패했습니다. 서버 로그/응답을 확인하세요.");
      }
    })();
  };

  const forceEndAuction = (auctionId: string): void => {
    (async () => {
      const reason = window.prompt("강제종료 사유를 입력하세요") || "";
      if (!reason.trim()) return;

      try {
        await adminApi.forceEndAuction(auctionId, reason.trim());
        // setAuctions((prev) => prev.filter((a) => a.id !== auctionId));
        await refreshAuctionsPage();
        await refreshOverviewTopAuctions();
        setStats((s) => ({
          ...s,
          todayEndedAuctions: s.todayEndedAuctions + 1,
          ongoingAuctions: Math.max(0, s.ongoingAuctions - 1),
        }));
      } catch (e) {
        console.error(e);
        alert("강제종료에 실패했습니다. 서버 로그/응답을 확인하세요.");
      }
    })();
  };

 const fetchGroupReports: AdminStore["fetchGroupReports"] = async (targetUserId, category, page, size) => {
    return await adminApi.getGroupReports(targetUserId, category, page, size);
  };

  const resolveReportGroup: AdminStore["resolveReportGroup"] = async (targetUserId, category, payload) => {
    await adminApi.resolveReportGroup(targetUserId, category, payload);
    const refreshed = await adminApi.getReportGroups();
    setReportGroups(refreshed);
  };

  const adminSuspendUser: AdminStore["adminSuspendUser"] = async (targetUserId, days, reason) => {
    await adminApi.adminSuspendUser(targetUserId, days, reason);
    const refreshed = await adminApi.getReportGroups();
    setReportGroups(refreshed);
  };

  const adminLiftAll: AdminStore["adminLiftAll"] = async (targetUserId, reason) => {
    await adminApi.adminLiftAll(targetUserId, reason);
    const refreshed = await adminApi.getReportGroups();
    setReportGroups(refreshed);
  };

  const liftBlockedProduct: AdminStore["liftBlockedProduct"] = async (payload) => {
    await adminApi.liftBlockedProduct(payload);
    await refreshBlockedProducts();
  };

  const addNotice: AdminStore["addNotice"] = (payload) => {
    (async () => {
      try {
        await adminApi.createNotice(payload);
        await fetchNoticesPage(0, noticeSize);
      } catch (e) {
        console.error(e);
        alert("공지 등록에 실패했습니다.");
      }
    })();
  };
  const updateNotice: AdminStore["updateNotice"] = (id, payload) => {
    (async () => {
      try {
        await adminApi.updateNotice(id, payload);
        await fetchNoticesPage(noticePage, noticeSize);
      } catch (e) {
        console.error(e);
        alert("공지 수정에 실패했습니다.");
      }
    })();
  };
  const deleteNotice: AdminStore["deleteNotice"] = (id) => {
    (async () => {
      try {
        await adminApi.deleteNotice(id);

        const nextPage = noticePage > 0 && notices.length === 1 ? noticePage - 1 : noticePage;
        await fetchNoticesPage(nextPage, noticeSize);
      } catch (e) {
        console.error(e);
        alert("공지 삭제에 실패했습니다.");
      }
    })();
  };
  const addEvent: AdminStore["addEvent"] = async (e) => {
    const payload = {
      date: e.date,
      time: e.time,
      title: e.title,
      tag: e.tag ?? "기타",
      memo: (e as any).memo ?? null,
    };
    const created = await adminApi.addEvent(payload as any);
    setEvents((prev) => [created, ...prev]);
  };

  const updateEvent: AdminStore["updateEvent"] = async (id, payload) => {
    const updated = await adminApi.updateEvent(id, payload as any);
    setEvents((prev) => prev.map((x) => (x.id === id ? updated : x)));
  };

  const deleteEvent: AdminStore["deleteEvent"] = async (id) => {
    await adminApi.deleteEvent(id);
    setEvents((prev) => prev.filter((x) => x.id !== id));
  };

  const moveEventDate: AdminStore["moveEventDate"] = async (id, newDate) => {
    await adminApi.moveEventDate(id, newDate);
    setEvents((prev) => prev.map((e) => (e.id === id ? { ...e, date: newDate } : e)));
  };

  const goNoticePage = (page: number) => {
    const pg = Math.max(0, Math.min(page, noticeTotalPages - 1));
    void fetchNoticesPage(pg, noticeSize);
  };
  const extendAdminSession = useCallback(async (): Promise<void> => {
    const res = await adminApi.extendAdminSession();
    const token = res?.accessToken;

    if (!token || typeof token !== "string") {
      throw new Error("extendAdminSession: token missing");
    }
    localStorage.setItem("accessToken", token);
    setRtTokenVersion((v) => v + 1);
  }, []);
  
  // 뱃지 관련 카운팅 함수
  const pinnedNoticesCount = useMemo(() => notices.filter((n) => n.pinned).length, [notices]);
  const noticesCount = useMemo(() => noticeTotalElements, [noticeTotalElements]);

  const reportsOpenCount = useMemo(() => {
    return reportGroups.reduce((acc, g) => acc + (g.pendingCount || 0), 0);
  }, [reportGroups]);
  
  const value: AdminStore = {
    adminEmail: profile.email,
    adminNick: profile.nick,
    adminRole: profile.role,
    rtConnected,

    query,
    setQuery,

    lastUpdatedAt,
    refreshAll,

    stats,
    setStats,

    auctions,
    setAuctions,

    auctionsPage,
    auctionsPageIndex,
    auctionsPageSize,
    auctionsTotalPages,
    auctionsTotalElements,
    setAuctionsPagingFromUrl,
    refreshAuctionsPage,

    overviewTopAuctions,
    refreshOverviewTopAuctions,

    reportGroups,
    setReportGroups,

    fetchGroupReports,
    resolveReportGroup,
    adminSuspendUser,
    adminLiftAll,

    blockedProducts,
    setBlockedProducts,
    refreshBlockedProducts,
    liftBlockedProduct,

    notices,
    setNotices,

    noticePage,
    noticeSize,
    noticeTotalPages,
    noticeTotalElements,
    goNoticePage,

    addNotice,
    updateNotice,
    deleteNotice,

    events,
    setEvents,
    refreshEvents,
    addEvent,
    updateEvent,
    deleteEvent,
    moveEventDate,

    noticesCount,
    pinnedNoticesCount,
    reportsOpenCount,

    suspendAuction,
    forceEndAuction,

    categoryDistribution,
    setCategoryDistribution,
    refreshCategoryDistribution,

    todayActiveHours,
    setTodayActiveHours,
    refreshTodayActiveHours,

    auctionTrendRows,
    refreshAuctionTrend,

    monthlyTradeRows,
    refreshMonthlyTrade,

    extendAdminSession,

    users,
    setUsers,
    refreshUsers,

    createAdminUser,
    createInquiryUser,

    usersPage,
    usersPageIndex,
    usersPageSize,
    usersTotalPages,
    usersTotalElements,
    usersCounts,
    refreshUsersPage,
    goUsersPage,
    changeUsersPageSize,

    chatRooms,
    setChatRooms,
    refreshChatRooms,
    chatUnreadTotal,
  };

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
};
