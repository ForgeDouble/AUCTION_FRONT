// api/chatApi.ts
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
return {} as T;
}
}

function unwrap<T>(json: any): T {
if (json && typeof json === "object" && "result" in json) return json.result as T;
return json as T;
}

// GET /chat/room/my (현재 로그인 유저 기준)
export async function myRooms(token: string | null | undefined) {
const res = await fetch(buildURL("/chat/room/my"), {
method: "GET",
headers: authHeaders(token ?? undefined),
credentials: "include",
});
const raw = unwrap<any[]>(await handle<any>(res)) || [];

const list: ChatRoomDto[] = raw.map((r) => {
return {
roomId: r.roomId || r.id || "",
title: r.roomName || r.title || "대화",
lastMessage: r.recentText || "",
lastAt: r.recentTime || "",
unread: r.unread || 0,
adminChat: !!r.adminChat,
};
});

return list;
}

// POST /chat/room/open (유저끼리 1:1 채팅 또는 관리자/문의와 1:1)
export async function openRoom(
token: string | null | undefined,
body: { targetEmail: string; adminChat?: boolean }
) {
const payload = {
targetId: body.targetEmail, // 백엔드 ChatRoomOpenRequest.targetId = 이메일
adminChat: body.adminChat ?? false,
};

const res = await fetch(buildURL("/chat/room/open"), {
method: "POST",
headers: authHeaders(token ?? undefined),
credentials: "include",
body: JSON.stringify(payload),
});
const json = await handle<any>(res);
return unwrap<string>(json); // roomId
}

// POST /chat/room/inquire (문의하기 전용, 바디 불필요)
export async function openInquiryRoom(token: string | null | undefined) {
const res = await fetch(buildURL("/chat/room/inquire"), {
method: "POST",
headers: authHeaders(token ?? undefined),
credentials: "include",
body: JSON.stringify({}), // 컨트롤러가 @RequestBody 제거되었다면 이마저도 생략 가능
});
const json = await handle<any>(res);
return unwrap<string>(json); // roomId
}

// POST /chat/room/enter?roomId=...
export async function enterRoom(
token: string | null | undefined,
roomId: string
) {
const res = await fetch(buildURL("/chat/room/enter", { roomId }), {
method: "POST",
headers: authHeaders(token ?? undefined),
credentials: "include",
});
await handle<any>(res);
}

// POST /chat/room/exit (파라미터 없음)
export async function exitRoom(token: string | null | undefined) {
const res = await fetch(buildURL("/chat/room/exit"), {
method: "POST",
headers: authHeaders(token ?? undefined),
credentials: "include",
});
await handle<any>(res);
}

// GET /chat/message/recent?roomId=...&size=...
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
const arr = unwrap<any[]>(await handle<any>(res)) || [];

const mapped: ChatMessageDto[] = arr.map((m) => ({
messageId: m.id || m.messageId || m.uuid || String(Math.random()),
roomId: m.roomId || roomId,
senderId: m.senderId || m.senderEmail || "",
senderNickname: m.senderNickname || "",
senderProfileImageUrl: m.senderProfileImageUrl || "",
content: m.message || "",
createdAt: m.createdAt || new Date().toISOString(),
mine: false, // mine 여부는 ChatProvider에서 email 비교로 세팅
}));
return mapped;
}

// POST /chat/message/send
export async function sendMessage(
token: string | null | undefined,
body: { roomId: string; content: string; type?: "TALK" | "IMAGE" | "FILE" }
) {
const payload = {
roomId: body.roomId,
messageType: body.type ?? "TALK",
message: body.content,
files: [],
};
const res = await fetch(buildURL("/chat/message/send"), {
method: "POST",
headers: authHeaders(token ?? undefined),
credentials: "include",
body: JSON.stringify(payload),
});
await handle<any>(res);
}