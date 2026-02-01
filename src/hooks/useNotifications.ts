import { useEffect, useRef, useState } from "react";
import { Client } from "@stomp/stompjs";
import type { IMessage } from "@stomp/stompjs";
import SockJS from "sockjs-client";
import { useAuth } from "@/hooks/useAuth";
import {
  fetchNotifications,
  fetchUnreadCount,
  markAllNotificationsRead,
  markNotificationRead,
} from "@/api/notificationApi";
import { categoryFromType } from "@/firebase/notificationRoute";

const API_BASE_URL = import.meta.env.VITE_API_BASE;

export type NotificationCategory = "ALL" | "AUCTION" | "INQUIRY" | "PRODUCT" | "CHAT";

export type NotificationItem = {
  id: string;
  title: string;
  body: string;
  category: NotificationCategory;
  createdAt: string;
  read: boolean;
  type?: string;
  data?: Record<string, string>;
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

function getAccessToken() {
  return localStorage.getItem("accessToken");
}

function unwrapResult<T>(json: any): T {
  if (json && typeof json === "object") {
    if ("result" in json) return json.result as T;
    if ("data" in json) return json.data as T;
  }
  return json as T;
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

  const loadInitial = async () => {
    if (!isAuthenticated) return;

    setLoading(true);
    setError(undefined);

    try {
      const listJsonRaw = await fetchNotifications(20);
      const rawList = unwrapResult<any[]>(listJsonRaw) || [];

      const mapped: NotificationItem[] = (rawList || []).map((n: any) => {
        const type = n.type || n.notificationType || n.eventType;
        const data = (n.data || n.payload || n.meta || null) as Record<string, string> | null;

        const category: NotificationCategory =
          (n.category as NotificationCategory) ||
          categoryFromType(type) ||
          "ALL";

        return {
          id: String(n.id),
          title: n.title || "",
          body: n.body || "",
          category,
          createdAt: n.createdAt || "",
          read: !!n.read,
          type: type ? String(type) : undefined,
          data: data || undefined,
        };
      });

      const countJsonRaw = await fetchUnreadCount();
      const unread = unwrapResult<number>(countJsonRaw) ?? 0;

      setNotifications(mapped);
      setUnreadCount(typeof unread === "number" ? unread : 0);
    } catch (e: any) {
      console.error(e);
      setError(e?.message || "알림 조회 중 오류가 발생했습니다.");
    } finally {
      setLoading(false);
    }
  };
  const reload = () => {
    loadInitial();
  };

  const markAsRead = async (id: string) => {
    try {
    await markNotificationRead(id);
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, read: true } : n))
      );
      setUnreadCount((prev) => Math.max(0, prev - 1));
    } catch (e) {
      console.error(e);
    }
  };

  const markAllRead = async () => {
    try {
    await markAllNotificationsRead();
      setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
      setUnreadCount(0);
    } catch (e) {
      console.error(e);
    }
  };

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
      connectHeaders: token ? { Authorization: `Bearer ${token}` } : {},
      debug: () => {},
      reconnectDelay: 5000,
    });

    client.onConnect = () => {
      const dest = `/topic/notification/${userEmail}`;
      client.subscribe(dest, (frame: IMessage) => {
        try {
          const body = frame.body ? JSON.parse(frame.body) : null;
          if (!body) return;

          const type = body.type || body.notificationType || body.eventType;
          const data = (body.data || body.payload || body.meta || null) as Record<string, string> | null;

          const category: NotificationCategory =
            (body.category as NotificationCategory) ||
            categoryFromType(type) ||
            "ALL";

          const item: NotificationItem = {
            id: String(body.id),
            title: body.title || "",
            body: body.body || "",
            category,
            createdAt: body.createdAt || new Date().toISOString(),
            read: !!body.read,
            type: type ? String(type) : undefined,
            data: data || undefined,
          };

          setNotifications((prev) => [item, ...prev].slice(0, 50));
          if (!item.read) setUnreadCount((prev) => prev + 1);
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