import React, { useEffect, useState, useRef } from "react";
import type { MessagePayload } from "firebase/messaging";
import { subscribeForegroundMessage } from "@/firebase/firebase";
import { useNavigate, useLocation } from "react-router-dom";
import { routeForNotification } from "@/firebase/notificationRoute";
import { markNotificationRead } from "@/api/notificationApi";

type NotificationItem = {
  id: string;
  title: string;
  body: string;
  type?: string;
  data?: Record<string, string>;
};

const MAX_STACK = 3;
const AUTO_CLOSE_MS = 5000;

export function FcmNotificationCenter() {
  const [items, setItems] = useState<NotificationItem[]>([]);
  const navigate = useNavigate();
  const location = useLocation();

  const isChatRoute =
  location.pathname.startsWith("/chat") ||
  location.pathname.startsWith("/chat-list") ||
  location.pathname.startsWith("/chat-popup");

  const isChatRouteRef = useRef(isChatRoute);
  useEffect(() => {
  isChatRouteRef.current = isChatRoute;
  }, [isChatRoute]);

  useEffect(() => {
  let isMounted = true;
  let unsubscribe: (() => void) | undefined;

  const init = async () => {
    try {
      const unsub = await subscribeForegroundMessage((payload: MessagePayload) => {
        if (!isMounted) return;

        if (isChatRouteRef.current) {
          return;
        }

        const data = (payload.data || {}) as Record<string, string>;
        const type = data.type;
        const baseTitle = payload.notification?.title || data.title || "AuctionHub 알림";
        const baseBody = payload.notification?.body || data.body || "";

        const item: NotificationItem = {
          id: crypto.randomUUID(),
          title: baseTitle,
          body: baseBody,
          type,
          data,
        };

        setItems((prev) => {
          const next = [item, ...prev];
          if (next.length > MAX_STACK) next.pop();
          return next;
        });

        setTimeout(() => {
          setItems((prev) => prev.filter((x) => x.id !== item.id));
        }, AUTO_CLOSE_MS);
      });

      unsubscribe = unsub;
    } catch (e) {
      console.error("[FcmCenter] init 오류:", e);
    }
  };

  init();

  return () => {
    isMounted = false;
    try {
      if (unsubscribe) unsubscribe();
    } catch (e) {}
  };
  }, []);

  const handleClick = async (item: NotificationItem) => {
    setItems((prev) => prev.filter((x) => x.id !== item.id));

    const type = item.type;
    const data = item.data || {};

    const notificationId = data.notificationId;
    if (notificationId) {
      try {
        await markNotificationRead(notificationId);
      } catch (e) {
      }
    }

    const path = routeForNotification(type, data);
    if (path) navigate(path);

  };

  if (items.length === 0) return null;

  return (
    <div className="fixed top-4 right-4 z-[9999] space-y-3">
      {items.map((item) => (
      <button
        key={item.id}
        onClick={() => handleClick(item)}
        className="w-80 text-left bg-white/95 border border-slate-200 shadow-xl rounded-2xl px-4 py-3 flex flex-col gap-1 hover:shadow-2xl hover:-translate-y-0.5 transition-all duration-200"
      >
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold text-slate-500">
            {item.type || "알림"}
          </span>
        </div>
        <div className="text-sm font-semibold text-slate-900 truncate">
          {item.title}
        </div>
        {item.body && (
          <div className="text-xs text-slate-600 line-clamp-2">{item.body}</div>
        )}
      </button>
      ))}
    </div>
  );
}