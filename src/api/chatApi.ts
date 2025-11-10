// 엔드포인트: /chat/room/*, /chat/message/*
import type { ChatMessageDto, ChatRoomDto } from "@/pages/chat/ChatTypes";

const API_BASE = (import.meta as any).env?.VITE_API_BASE ?? "http://localhost:8080";

function authHeaders(token?: string | null) {
  const h: Record<string, string> = { "Content-Type": "application/json" };
  if (token) h["Authorization"] = `Bearer ${token}`;
  return h;
}

async function handle<T>(res: Response): Promise<T> {
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`HTTP ${res.status}: ${text}`);
  }
  return res.json() as Promise<T>;
}

export type ApiResult<T> = { result: T };

// 내 채팅방 목록
export async function chatMyRooms(userId: string, token?: string | null): Promise<ApiResult<ChatRoomDto[]>> {
  const url = `${API_BASE}/chat/room/my?userId=${encodeURIComponent(userId)}`;
  const res = await fetch(url, { headers: authHeaders(token), credentials: "include" });
  return handle<ApiResult<ChatRoomDto[]>>(res);
}

// 방 생성/조회 (1:1)
export async function chatOpenRoom(body: { userId: string; targetId: string }, token?: string | null): Promise<ApiResult<string>> {
  const url = `${API_BASE}/chat/room/open`;
  const res = await fetch(url, { method: "POST", headers: authHeaders(token), credentials: "include", body: JSON.stringify(body) });
  return handle<ApiResult<string>>(res); // result = roomId
}

// 방 입장(읽음 0 처리 등)
export async function chatEnterRoom(params: { userId: string; roomId: string }, token?: string | null): Promise<ApiResult<null>> {
  const url = `${API_BASE}/chat/room/enter?userId=${encodeURIComponent(params.userId)}&roomId=${encodeURIComponent(params.roomId)}`;
  const res = await fetch(url, { method: "POST", headers: authHeaders(token), credentials: "include" });
  return handle<ApiResult<null>>(res);
}

// 최근 메시지(무한스크롤 첫 로드)
export async function chatRecent(roomId: string, size = 50, token?: string | null): Promise<ApiResult<ChatMessageDto[]>> {
  const url = `${API_BASE}/chat/message/recent?roomId=${encodeURIComponent(roomId)}&size=${size}`;
  const res = await fetch(url, { headers: authHeaders(token), credentials: "include" });
  return handle<ApiResult<ChatMessageDto[]>>(res);
}

// (옵션) REST 전송이 필요하면 사용
export async function chatSend(body: { roomId: string; content: string }, token?: string | null): Promise<ApiResult<null>> {
  const url = `${API_BASE}/chat/message/send`;
  const res = await fetch(url, { method: "POST", headers: authHeaders(token), credentials: "include", body: JSON.stringify(body) });
  return handle<ApiResult<null>>(res);
}
