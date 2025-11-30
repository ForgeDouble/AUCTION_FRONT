import React, { useEffect, useState } from "react";
import type { MessagePayload } from "firebase/messaging";
import { requestFcmToken, subscribeForegroundMessage } from "@/firebase/firebase";
import { useNavigate } from "react-router-dom";
import { registerDeviceToken } from "@/api/pushApi";
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

useEffect(() => {
let isMounted = true;

// 1) FCM 토큰 발급 + /push/register 호출
const initFcm = async () => {
  try {
    console.log("[FcmCenter] initFcm 시작");

    const accessToken = localStorage.getItem("accessToken");
    if (!accessToken) {
      console.log("[FcmCenter] accessToken 없음, 등록 스킵");
    } else {
      const alreadyRegistered =
        localStorage.getItem("fcm_registered") === "true";

      const token = await requestFcmToken();
      if (token) {
        const prevToken = localStorage.getItem("fcm_token");
        if (!alreadyRegistered || prevToken !== token) {
          console.log("[FcmCenter] /push/register 호출 시도");
          await registerDeviceToken(token);
          console.log("[FcmCenter] /push/register 성공");
          localStorage.setItem("fcm_registered", "true");
          localStorage.setItem("fcm_token", token);
        } else {
          console.log("[FcmCenter] 기존 토큰과 동일, 재등록 스킵");
        }
      } else {
        console.warn("[FcmCenter] requestFcmToken 결과가 null");
      }
    }

    // 2) 포그라운드 메시지 구독
    console.log("[FcmCenter] foreground message 구독 설정");
    subscribeForegroundMessage((payload: MessagePayload) => {
      if (!isMounted) return;

      const data = (payload.data || {}) as Record<string, string>;
      const type = data.type;
      const baseTitle = payload.notification?.title || "AuctionHub 알림";
      const baseBody = payload.notification?.body || "";

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
  } catch (e) {
    console.error("[FcmCenter] initFcm 중 오류:", e);
  }
};

initFcm();

return () => {
  isMounted = false;
};


}, []);

const handleClick = (item: NotificationItem) => {
const type = item.type;
const data = item.data || {};
setItems((prev) => prev.filter((x) => x.id !== item.id));

// 1) 문의 채팅 알림
if (type === "INQUIRY_NEW_MESSAGE") {
  const roomId = data.roomId;
  if (roomId) {
    navigate(`/chat?roomId=${roomId}`);
  } else {
    navigate("/chat");
  }
  return;
}

// 2) 경매 관련 알림
if (
  type === "AUCTION_ENDING_SOON" ||
  type === "AUCTION_ENDED" ||
  type === "AUCTION_WINNER" ||
  type === "AUCTION_ENDED_NO_WINNER"
) {
  const productId = data.productId;
  if (productId) {
    navigate(`/auction_detail/${productId}`);
  }
  return;
}

// 3) 신고 / 제재 관련은 필요시 라우트 지정
if (type === "USER_VIEW_ONLY" || type === "ADMIN_PENDING_REPORTS") {
  // 예: navigate("/mypage");
  return;
}

// 기본 동작: 일단 아무것도 안 함 (원하면 홈으로 보내도 됨)
// navigate("/");


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
{item.type === "INQUIRY_NEW_MESSAGE"
? "새 문의 메시지"
: item.type === "AUCTION_ENDING_SOON"
? "경매 종료 임박"
: item.type === "AUCTION_WINNER"
? "입찰 상품 낙찰"
: item.type === "AUCTION_ENDED_NO_WINNER"
? "경매 종료(무입찰)"
: item.type === "USER_VIEW_ONLY"
? "계정 제재 안내"
: item.type === "ADMIN_PENDING_REPORTS"
? "관리자 신고 알림"
: "알림"}
</span>
</div>
<div className="text-sm font-semibold text-slate-900 truncate">
{item.title}
</div>
{item.body && (
<div className="text-xs text-slate-600 line-clamp-2">
{item.body}
</div>
)}
</button>
))}
</div>
);
}