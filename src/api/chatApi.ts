// src/api/chatApi.ts
import type { ChatMessageDto, ChatRoomDto } from "@/pages/chat/ChatTypes";

const API_BASE =
  (import.meta as any).env?.VITE_API_BASE ?? "http://localhost:8080";

function authHeaders(token?: string | null) {
  const h: Record<string, string> = { "Content-Type": "application/json" };
  if (token) h["Authorization"] = `Bearer ${token}`;
  return h;
}

function buildURL(path: string, params?: Record<string, any>): string {
  let url = `${API_BASE}${path}`;
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
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`HTTP ${res.status}: ${text}`);
  }
  return res.json() as Promise<T>;
}

async function handleVoid(res: Response): Promise<void> {
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`HTTP ${res.status}: ${text}`);
  }
}

export type ApiResult<T> = { result: T };

// 1) 내 채팅방 목록: GET /chat/room/my?userId=...
export async function fetchChatRooms(
  token: string | null | undefined,
  userId: string
): Promise<ApiResult<ChatRoomDto[]>> {
  const res = await fetch(buildURL("/chat/room/my", { userId }), {
    method: "GET",
    headers: authHeaders(token ?? undefined),
    credentials: "include",
  });
  return handle<ApiResult<ChatRoomDto[]>>(res);
}

// 2) 최근 메시지: GET /chat/message/recent?roomId=...&size=...
// 백엔드가 "리스트"를 반환하므로 Page 대신 배열로 받음
export async function fetchChatMessages(
  token: string | null | undefined,
  roomId: string,
  size = 50
): Promise<ApiResult<ChatMessageDto[]>> {
  const res = await fetch(
    buildURL("/chat/message/recent", { roomId, size }),
    {
      method: "GET",
      headers: authHeaders(token ?? undefined),
      credentials: "include",
    }
  );
  return handle<ApiResult<ChatMessageDto[]>>(res);
}

// 3) 방 열기: POST /chat/room/open (body: { userId, targetId })
// 서버는 roomId만 result로 반환(추정)
export async function openChatRoom(
  token: string | null | undefined,
  body: { userId: string; targetId: string }
): Promise<ApiResult<string>> {
  const res = await fetch(buildURL("/chat/room/open"), {
    method: "POST",
    headers: authHeaders(token ?? undefined),
    credentials: "include",
    body: JSON.stringify(body),
  });
  return handle<ApiResult<string>>(res); // result = roomId
}

// 3-1) 호환용: 프론트 기존 createChatRoom(token, { productId }) 사용처를 위해 래핑
// result(roomId)만 오니 임시 ChatRoomDto를 조립해서 반환
export async function createChatRoom(
  token: string | null | undefined,
  body: { userId: string; targetId: string }
): Promise<ApiResult<ChatRoomDto>> {
  const { result: roomId } = await openChatRoom(token, body);
  const dto: ChatRoomDto = {
    roomId,
    title: body.targetId, // 임시 타이틀(상대 식별자). 필요 시 서버에서 정보 조회해 교체
    unread: 0,
    peerUserId: undefined,
    peerNickname: body.targetId,
  };
  return { result: dto };
}

// 4) 읽음 처리(입장): POST /chat/room/enter?userId=...&roomId=...
export async function markRoomRead(
  token: string | null | undefined,
  userId: string,
  roomId: string
): Promise<void> {
  const res = await fetch(buildURL("/chat/room/enter", { userId, roomId }), {
    method: "POST",
    headers: authHeaders(token ?? undefined),
    credentials: "include",
  });
  return handleVoid(res);
}

// (옵션) 방 퇴장: POST /chat/room/exit?userId=...
export async function exitRoom(
  token: string | null | undefined,
  userId: string
): Promise<void> {
  const res = await fetch(buildURL("/chat/room/exit", { userId }), {
    method: "POST",
    headers: authHeaders(token ?? undefined),
    credentials: "include",
  });
  return handleVoid(res);
}

// (옵션) 메시지 전송(REST): POST /chat/message/send
// 서버 DTO에 맞춰 확장 가능
export async function sendChatMessage(
  token: string | null | undefined,
  body: { roomId: string; content: string; senderId?: string }
): Promise<void> {
  const res = await fetch(buildURL("/chat/message/send"), {
    method: "POST",
    headers: authHeaders(token ?? undefined),
    credentials: "include",
    body: JSON.stringify(body),
  });
  return handleVoid(res);
}
