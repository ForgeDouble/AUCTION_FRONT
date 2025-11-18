// api/chatApi
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

// GET /chat/room/my?userId=...
export async function myRooms(token: string | null | undefined, userId: string) {
const res = await fetch(buildURL("/chat/room/my", { userId }), {
method: "GET",
headers: authHeaders(token ?? undefined),
credentials: "include",
});
const raw = unwrap<any[]>(await handle<any>(res)) || [];

const list: ChatRoomDto[] = raw.map((r) => {
let title = "대화";
if (Array.isArray(r.participantIds)) {
const other = r.participantIds.find((id: string) => String(id) !== String(userId));
title = other || title;
}
return {
roomId: r.roomId || r.id || "",
title,
lastMessage: r.recentText || "",
lastAt: r.recentTime || "",
unread: r.unread || 0,
};
});

return list;
}

// POST /chat/room/open (유저끼리 1:1 채팅용으로 유지)
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

// POST /chat/room/inquire (문의하기 전용)
export async function openInquiryRoom(
token: string | null | undefined,
body: { userId: string }
) {
const res = await fetch(buildURL("/chat/room/inquire"), {
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
roomId: m.roomId || "",
senderId: -1,
senderNickname: "",
content: m.message || "",
createdAt: m.createdAt || new Date().toISOString(),
mine: false,
}));
return mapped;
}

// POST /chat/message/send
export async function sendMessage(
token: string | null | undefined,
body: { roomId: string; senderId: string; content: string }
) {
const payload = {
roomId: body.roomId,
senderId: body.senderId,
messageType: "TALK",
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