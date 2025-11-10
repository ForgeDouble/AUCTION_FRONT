// 엔드포인트: /chat/room/*, /chat/message/*
import type { ChatMessageDto, ChatRoomDto } from "@/pages/chat/ChatTypes";

const API_BASE = (import.meta as any).env?.VITE_API_BASE ?? "http://localhost:8080";

function authHeaders(token?: string | null) {
  const h: Record<string, string> = { "Content-Type": "application/json" };
  if (token) h["Authorization"] = "Bearer " + token;
  return h;
}

function buildURL(path: string, params?: Record<string, any>) {
  let url = API_BASE + path;
  if (params) {
    const qs = new URLSearchParams();
    Object.entries(params).forEach(([k, v]) => {
      if (v !== undefined && v !== null) qs.append(k, String(v));
    });
    const q = qs.toString();
    if (q) url += (url.includes("?") ? "&" : "?") + q;
  }
  return url;
}

async function handle<T>(res: Response): Promise<T> {
  const text = await res.text();
  if (!res.ok) throw new Error("HTTP " + res.status + ": " + text);
  try {
    return JSON.parse(text) as T;
  } catch {
    // 성공이지만 빈 바디인 경우
    return {} as T;
  }
}

// 백엔드 CommonResDto 호환: { result: ... } 를 우선 사용, 없으면 원본 반환
function unwrap<T>(json: any): T {
  if (json && typeof json === "object" && "result" in json) return json.result as T;
  return json as T;
}

/* 타입 가드(백엔드 응답 필드를 프론트 Dto로 맞춰주는 매핑) */
type RawRoom = any;
function mapRoom(r: RawRoom): ChatRoomDto {
  return {
    roomId: r.id || r.roomId || r.room_id || "",
    title: r.title || r.peerNickname || r.productTitle || "대화",
    lastMessage: r.lastMessage || r.last_message || "",
    lastAt: r.lastAt || r.last_at || r.updatedAt || r.lastMessageAt || "",
    unread: r.unread || r.unreadCount || 0,
    peerUserId: r.peerUserId ?? undefined,
    peerNickname: r.peerNickname ?? undefined,
    productId: r.productId ?? undefined,
  };
}

type RawMsg = any;
function mapMsg(m: RawMsg): ChatMessageDto {
  return {
    messageId: m.id || m.messageId || m.uuid || String(Math.random()),
    roomId: m.roomId || m.room_id || "",
    senderId: typeof m.senderId === "number" ? m.senderId : -1,
    senderNickname: m.senderNickname || m.sender || "",
    content: m.content || m.text || "",
    createdAt: m.createdAt || m.created_at || new Date().toISOString(),
    mine: !!m.mine,
  };
}

/* API들 (컨트롤러와 1:1) */

// GET /chat/room/my?userId=...
export async function myRooms(token: string | null | undefined, userId: string) {
  const res = await fetch(buildURL("/chat/room/my", { userId }), {
    method: "GET",
    headers: authHeaders(token ?? undefined),
    credentials: "include",
  });
  const json = await handle<any>(res);
  const arr = unwrap<any[]>(json) || [];
  return arr.map(mapRoom) as ChatRoomDto[];
}

// POST /chat/room/open   body: { userId, targetId?, productId? }
export async function openRoom(
  token: string | null | undefined,
  body: { userId: string; targetId?: string; productId?: number }
) {
  const res = await fetch(buildURL("/chat/room/open"), {
    method: "POST",
    headers: authHeaders(token ?? undefined),
    credentials: "include",
    body: JSON.stringify(body),
  });
  const json = await handle<any>(res);
  return unwrap<string>(json); // roomId
}

// POST /chat/room/enter?userId=...&roomId=...
export async function enterRoom(
  token: string | null | undefined,
  userId: string,
  roomId: string
) {
  const res = await fetch(buildURL("/chat/room/enter", { userId, roomId }), {
    method: "POST",
    headers: authHeaders(token ?? undefined),
    credentials: "include",
  });
  await handle<any>(res);
}

// POST /chat/room/exit?userId=...
export async function exitRoom(
  token: string | null | undefined,
  userId: string
) {
  const res = await fetch(buildURL("/chat/room/exit", { userId }), {
    method: "POST",
    headers: authHeaders(token ?? undefined),
    credentials: "include",
  });
  await handle<any>(res);
}

// GET /chat/message/recent?roomId=...&size=30
export async function recentMessages(
  token: string | null | undefined,
  roomId: string,
  size = 50
) {
  const res = await fetch(buildURL("/chat/message/recent", { roomId, size }), {
    method: "GET",
    headers: authHeaders(token ?? undefined),
    credentials: "include",
  });
  const json = await handle<any>(res);
  const arr = unwrap<any[]>(json) || [];
  return arr.map(mapMsg) as ChatMessageDto[];
}

// POST /chat/message/send   body: { roomId, senderId, content }
export async function sendMessage(
  token: string | null | undefined,
  body: { roomId: string; senderId: string | number; content: string }
) {
  const res = await fetch(buildURL("/chat/message/send"), {
    method: "POST",
    headers: authHeaders(token ?? undefined),
    credentials: "include",
    body: JSON.stringify(body),
  });
  await handle<any>(res);
}
