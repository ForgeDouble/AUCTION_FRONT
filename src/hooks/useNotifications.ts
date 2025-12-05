const API_BASE_URL = import.meta.env.VITE_API_BASE;

import { useEffect, useRef, useState } from "react";
import { Client } from "@stomp/stompjs";
import type { IMessage } from "@stomp/stompjs";
import SockJS from "sockjs-client";
import { useAuth } from "@/hooks/useAuth";

export type NotificationCategory =
| "ALL"
| "AUCTION"
| "INQUIRY"
| "PRODUCT"
| "CHAT";

export type NotificationItem = {
id: string;
title: string;
body: string;
category: NotificationCategory;
createdAt: string;
read: boolean;
};

type UseNotificationsResult = {
notifications: NotificationItem[];
unreadCount: number;
loading: boolean;
error?: string;
reload: () => void;
markAsRead: (id: string) => Promise<void>;
markAllRead: () => Promise<void>;
};

// accessToken 가져오기
function getAccessToken() {
return localStorage.getItem("accessToken");
}

// JSON 요청용 공통 헤더 (Authorization 포함)
function jsonAuthHeaders() {
const token = getAccessToken();
const headers: Record<string, string> = {
"Content-Type": "application/json",
};
if (token) {
headers["Authorization"] = "Bearer " + token;
}
return headers;
}

export function useNotifications(): UseNotificationsResult {
const { isAuthenticated, userEmail } = useAuth() as {
isAuthenticated: boolean;
userEmail: string | null;
};

const [notifications, setNotifications] = useState<NotificationItem[]>([]);
const [unreadCount, setUnreadCount] = useState(0);
const [loading, setLoading] = useState(false);
const [error, setError] = useState<string | undefined>();

const stompRef = useRef<Client | null>(null);

// 초기 로드용 함수
const loadInitial = async () => {
if (!isAuthenticated) return;

setLoading(true);
setError(undefined);

try {
  // 1) 알림 목록
  const listRes = await fetch(
    `${API_BASE_URL}/notifications?size=20`,
    {
      method: "GET",
      headers: jsonAuthHeaders(),   // ← Authorization 추가
      credentials: "include",
    }
  );

  if (!listRes.ok) {
    throw new Error(`알림 목록 조회 실패: ${listRes.status}`);
  }

  const ct = listRes.headers.get("content-type") || "";
  if (!ct.includes("application/json")) {
    throw new Error(
      "알림 목록 API 응답이 JSON 이 아닙니다. (아마 404 HTML 페이지)"
    );
  }

  const listJsonRaw = await listRes.json();

  // 응답 형식: [ ... ] 또는 { data: [ ... ] } 또는 { result: [ ... ] } 모두 대응
  const rawList = Array.isArray(listJsonRaw)
    ? listJsonRaw
    : (listJsonRaw.data ?? listJsonRaw.result ?? []);

  const mapped: NotificationItem[] = (rawList || []).map((n: any) => ({
    id: String(n.id),
    title: n.title,
    body: n.body,
    category: n.category as NotificationCategory,
    createdAt: n.createdAt,
    read: !!n.read,
  }));

  // 2) 미읽음 개수
  const countRes = await fetch(
    `${API_BASE_URL}/notifications/unread-count`,
    {
      method: "GET",
      headers: jsonAuthHeaders(),   // ← Authorization 추가
      credentials: "include",
    }
  );

  if (!countRes.ok) {
    throw new Error(`미읽음 개수 조회 실패: ${countRes.status}`);
  }

  const ct2 = countRes.headers.get("content-type") || "";
  if (!ct2.includes("application/json")) {
    throw new Error("미읽음 개수 API 응답이 JSON 이 아닙니다.");
  }

  const countJsonRaw = await countRes.json();

  const unread =
    typeof countJsonRaw === "number"
      ? countJsonRaw
      : (countJsonRaw.data ?? countJsonRaw.result ?? 0);

  setNotifications(mapped);
  setUnreadCount(unread);
} catch (e: any) {
  console.error(e);
  setError(e?.message || "알림 조회 중 오류가 발생했습니다.");
} finally {
  setLoading(false);
}


};

// 외부에서 다시 호출할 수 있게 래핑
const reload = () => {
loadInitial();
};

// 개별 읽음 처리
const markAsRead = async (id: string) => {
try {
const res = await fetch(
`${API_BASE_URL}/notifications/${id}/read`,
{
method: "POST",
headers: jsonAuthHeaders(), // ← Authorization 추가
credentials: "include",
}
);
if (!res.ok) return;

  setNotifications((prev) =>
    prev.map((n) =>
      n.id === id
        ? { ...n, read: true }
        : n
    )
  );
  setUnreadCount((prev) => Math.max(0, prev - 1));
} catch (e) {
  console.error(e);
}


};

// 전체 읽음 처리
const markAllRead = async () => {
try {
const res = await fetch(
`${API_BASE_URL}/notifications/read-all`,
{
method: "POST",
headers: jsonAuthHeaders(), // ← Authorization 추가
credentials: "include",
}
);
if (!res.ok) return;

  setNotifications((prev) =>
    prev.map((n) => ({
      ...n,
      read: true,
    }))
  );
  setUnreadCount(0);
} catch (e) {
  console.error(e);
}


};

// 첫 로드
useEffect(() => {
if (!isAuthenticated) {
setNotifications([]);
setUnreadCount(0);
return;
}
loadInitial();
}, [isAuthenticated]);

// STOMP 연결
useEffect(() => {
if (!isAuthenticated || !userEmail) {
if (stompRef.current) {
stompRef.current.deactivate();
stompRef.current = null;
}
return;
}

const token = getAccessToken();

const client = new Client({
  webSocketFactory: () => new SockJS(`${API_BASE_URL}/ws`),
  connectHeaders: token
    ? { Authorization: `Bearer ${token}` }  // ← 채팅 WebSocket 과 동일하게 토큰 전달
    : {},
  debug: () => {},
  reconnectDelay: 5000,
});

client.onConnect = () => {
  const dest = `/topic/notification/${userEmail}`;
  client.subscribe(dest, (frame: IMessage) => {
    try {
      const body = frame.body ? JSON.parse(frame.body) : null;
      if (!body) return;

      const item: NotificationItem = {
        id: String(body.id),
        title: body.title,
        body: body.body,
        category: body.category as NotificationCategory,
        createdAt: body.createdAt,
        read: !!body.read,
      };

      setNotifications((prev) => [item, ...prev].slice(0, 50));

      if (!item.read) {
        setUnreadCount((prev) => prev + 1);
      }
    } catch (e) {
      console.error("notification parse error", e);
    }
  });
};

client.onStompError = (frame) => {
  console.error("STOMP error", frame.headers["message"]);
};

client.activate();
stompRef.current = client;

return () => {
  client.deactivate();
  stompRef.current = null;
};


}, [isAuthenticated, userEmail]);

return {
notifications,
unreadCount,
loading,
error,
reload,
markAsRead,
markAllRead,
};
}