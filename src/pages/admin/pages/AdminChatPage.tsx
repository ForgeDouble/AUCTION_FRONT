import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  MessagesSquare,
  Plus,
  Users,
  LogOut,
  UserPlus,
  RefreshCw,
  SendHorizonal,
  Paperclip,
  X,
  Pencil,
  Check
} from "lucide-react";
import { adminApi } from "../adminApi";
import type { AdminChatMemberRow, AdminChatMessageRow, AdminChatRoomRow } from "../adminTypes";

import { Client } from "@stomp/stompjs";
import SockJS from "sockjs-client";
import { useAdminStore } from "../AdminContext";

const BASE = import.meta.env.VITE_API_BASE as string | undefined;

function getToken(): string | null {
  return localStorage.getItem("accessToken");
}

function kstTime(iso?: string | null) {
  if (!iso) return "";
  const d = new Date(iso);
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  const hh = String(d.getHours()).padStart(2, "0");
  const mi = String(d.getMinutes()).padStart(2, "0");
  return `${mm}.${dd} ${hh}:${mi}`;
}

function kstDayLabel(iso?: string | null) {
  if (!iso) return "";
  const d = new Date(iso);
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${yyyy}.${mm}.${dd}`;
}

function dayKey(iso?: string | null) {
  if (!iso) return "";
  return String(iso).slice(0, 10);
}

function uniqById(list: AdminChatMessageRow[]) {
  const seen = new Set<string>();
  const out: AdminChatMessageRow[] = [];
  for (const m of list) {
    const key = m.id || `${m.roomId}:${m.senderId}:${m.createdAt}:${m.message}`;
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(m);
  }
  return out;
}

function emailLike(x?: string | null) {
  const s = String(x ?? "").trim();
  return s.includes("@") ? s : "";
}

function nameFromEmail(email: string) {
  const at = email.indexOf("@");
  return at > 0 ? email.slice(0, at) : email;
}

function getSenderEmail(m: AdminChatMessageRow) {
  return emailLike(m.sender?.email) || emailLike(m.senderId) || "";
}

function getDisplayName(m: AdminChatMessageRow) {
  const nick = m.sender?.nickname?.trim();
  if (nick) return nick;

  const em = getSenderEmail(m);
  if (em) return nameFromEmail(em);

  return (m.senderId ?? "익명").toString();
}

function getAuthority(m: AdminChatMessageRow) {
  const raw = (m.sender?.authority ?? "").toString().toUpperCase();
  if (raw.includes("ADMIN")) return "ADMIN";
  if (raw.includes("INQUIRY")) return "INQUIRY";
  if (raw.includes("USER")) return "USER";
  return "";
}

function roleChipClass(role: string) {
  if (role === "ADMIN") return "bg-violet-50 text-violet-700 border-violet-200";
  if (role === "INQUIRY") return "bg-sky-50 text-sky-700 border-sky-200";
  if (role === "USER") return "bg-gray-50 text-gray-700 border-gray-200";
  return "bg-gray-50 text-gray-600 border-gray-200";
}

function initialFromName(name: string) {
  const s = (name ?? "").trim();
  if (!s) return "?";
  return s[0].toUpperCase();
}
function isImageFile(nameOrUrlOrType: string) {
  const v = String(nameOrUrlOrType ?? "").toLowerCase();
  return (
    v.startsWith("image/") ||
    v.endsWith(".png") ||
    v.endsWith(".jpg") ||
    v.endsWith(".jpeg") ||
    v.endsWith(".gif") ||
    v.endsWith(".webp")
  );
}

function Avatar(props: { name: string; url?: string | null; mine?: boolean }) {
  const { name, url, mine } = props;

  if (url) {
    return (
      <div className="w-9 h-9 rounded-full overflow-hidden border border-gray-200 bg-white shrink-0">
        <img src={url} alt={name} className="w-full h-full object-cover" />
      </div>
    );
  }

  return (
    <div
      className={
        "w-9 h-9 rounded-full flex items-center justify-center shrink-0 border " +
        (mine ? "bg-violet-600 text-white border-violet-200" : "bg-gray-100 text-gray-700 border-gray-200")
      }
    >
      <span className="text-sm font-semibold">{initialFromName(name)}</span>
    </div>
  );
}

function DateDivider(props: { label: string }) {
  return (
    <div className="py-2 flex items-center justify-center">
      <div className="px-3 py-1 rounded-full border border-gray-200 bg-white text-[11px] text-gray-600 shadow-sm">
        {props.label}
      </div>
    </div>
  );
}

export default function AdminChatPage() {
  const { adminEmail } = useAdminStore();

  const [rooms, setRooms] = useState<AdminChatRoomRow[]>([]);
  const [loadingRooms, setLoadingRooms] = useState(false);

  const [activeRoomId, setActiveRoomId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Record<string, AdminChatMessageRow[]>>({});
  const [input, setInput] = useState("");

  const [membersOpen, setMembersOpen] = useState(false);
  const [members, setMembers] = useState<AdminChatMemberRow[]>([]);

  const [inviteOpen, setInviteOpen] = useState(false);
  const [createOpen, setCreateOpen] = useState(false);

  const clientRef = useRef<Client | null>(null);
  const subRef = useRef<any>(null);

  const bottomRef = useRef<HTMLDivElement | null>(null);

  const me = useMemo(() => String(adminEmail ?? "").trim().toLowerCase(), [adminEmail]);

  const [pickedFiles, setPickedFiles] = useState<File[]>([]);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const [editingTitle, setEditingTitle] = useState(false);
  const [titleDraft, setTitleDraft] = useState("");
  const [savingTitle, setSavingTitle] = useState(false);

  const activeRoom = useMemo(
    () => rooms.find((r) => r.id === activeRoomId) ?? null,
    [rooms, activeRoomId]
  );
  const activeMessages = useMemo(
    () => (activeRoomId ? messages[activeRoomId] ?? [] : []),
    [messages, activeRoomId]
  );

  useEffect(() => {
    // 방 바뀌거나 메시지 늘어나면 아래로 스크롤
    if (!activeRoomId) return;
    bottomRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [activeRoomId, activeMessages.length]);

  const refreshRooms = async () => {
    setLoadingRooms(true);
    try {
      const list = await adminApi.getMyChatRooms();
      const sorted = list
        .slice()
        .sort((a, b) => String(b.recentTime ?? "").localeCompare(String(a.recentTime ?? "")));
      setRooms(sorted);
    } finally {
      setLoadingRooms(false);
    }
  };

  const ensureStompConnected = async () => {
    if (clientRef.current?.connected) return;

    const token = getToken();
    if (!token) throw new Error("토큰이 없습니다.");

    const wsUrl = (BASE ?? "") + "/ws";

    const client = new Client({
      webSocketFactory: () => new SockJS(wsUrl),
      connectHeaders: { Authorization: `Bearer ${token}` },
      reconnectDelay: 1500,
      debug: () => {},
    });

    client.onStompError = () => {};
    client.onWebSocketError = () => {};
    client.onDisconnect = () => {};

    client.activate();
    clientRef.current = client;

    await new Promise<void>((resolve) => {
      const t = setInterval(() => {
        if (client.connected) {
          clearInterval(t);
          resolve();
        }
      }, 50);
    });
  };

  const subscribeRoom = async (roomId: string) => {
    await ensureStompConnected();

    try {
      subRef.current?.unsubscribe?.();
    } catch {}

    const client = clientRef.current!;
    subRef.current = client.subscribe(`/topic/chat/room/${roomId}`, (frame) => {
      try {
        const data = JSON.parse(frame.body || "{}");

        const msg: AdminChatMessageRow = {
          id: String(data.id ?? ""),
          roomId: String(data.roomId ?? roomId),
          senderId: String(data.senderId ?? ""),
          messageType: String(data.messageType ?? "TALK").toUpperCase() as any,
          message: data.message != null ? String(data.message) : null,
          files: Array.isArray(data.files) ? data.files : [],
          createdAt: data.createdAt != null ? String(data.createdAt) : null,
          sender: data.sender ?? null,
        };

        setMessages((prev) => {
          const before = prev[roomId] ?? [];
          const next = uniqById([...before, msg]);
          return { ...prev, [roomId]: next };
        });

        setRooms((prev) =>
          prev.map((r) =>
            r.id === roomId
              ? {
                  ...r,
                  recentText:
                    msg.messageType === "FILE"
                      ? "파일을 보냈습니다."
                      : msg.messageType === "IMAGE"
                      ? "이미지를 보냈습니다."
                      : msg.message ?? "",
                  recentTime: msg.createdAt ?? r.recentTime ?? null,
                  unread: r.id === roomId ? 0 : Math.max(0, Number(r.unread ?? 0) + 1),
                }
              : r
          )
        );
      } catch {}
    });
  };

  const openLounge = async () => {
    await adminApi.openAdminLounge();
    await refreshRooms();
  };

  const selectRoom = async (roomId: string) => {
    setEditingTitle(false);
    setTitleDraft("");
    setActiveRoomId(roomId);

    await adminApi.enterChatRoom(roomId);

    const list = await adminApi.getRecentChatMessages(roomId, 60);
    setMessages((prev) => ({ ...prev, [roomId]: uniqById(list) }));

    setRooms((prev) => prev.map((r) => (r.id === roomId ? { ...r, unread: 0 } : r)));

    await subscribeRoom(roomId);
  };

  const send = async () => {
    if (!activeRoomId) return;
    const text = input.trim();
    const files = pickedFiles;

    if (!text && files.length === 0) return;
    if (uploading) return;

    if (files.length > 0) {
      setUploading(true);
      try {
        const uploaded = await adminApi.uploadChatFiles(files);

        const pairs = uploaded.map((u, i) => ({ up: u, raw: files[i] }));

        const imageUploads = pairs
          .filter(p => isImageFile(p.raw.type || p.up.fileName || p.up.fileUrl))
          .map(p => p.up);

        const otherUploads = pairs
          .filter(p => !isImageFile(p.raw.type || p.up.fileName || p.up.fileUrl))
          .map(p => p.up);

        // 이미지
        if (imageUploads.length > 0) {
          await adminApi.sendChatMessage({
            roomId: activeRoomId,
            messageType: "IMAGE",
            message: text ? text : "",
            files: imageUploads,
          });
        }

        // 일반 파일
        if (otherUploads.length > 0) {
          await adminApi.sendChatMessage({
            roomId: activeRoomId,
            messageType: "FILE",
            message: imageUploads.length > 0 ? "" : (text ? text : ""),
            files: otherUploads,
          });
        }

        setInput("");
        clearPickedFiles();
        return;
      } finally {
        setUploading(false);
      }
    }

    setInput("");
    await adminApi.sendChatMessage({
      roomId: activeRoomId,
      messageType: "TALK",
      message: text,
    });
  };

  const openMembers = async () => {
    if (!activeRoomId) return;
    const list = await adminApi.getChatRoomMembers(activeRoomId);
    setMembers(list);
    setMembersOpen(true);
  };

  const leave = async () => {
    if (!activeRoomId) return;
    if (!confirm("이 채팅방에서 나가시겠습니까?")) return;

    await adminApi.leaveChatRoom(activeRoomId);

    setMessages((prev) => {
      const copy = { ...prev };
      delete copy[activeRoomId];
      return copy;
    });

    setRooms((prev) => prev.filter((r) => r.id !== activeRoomId));
    setActiveRoomId(null);

    try {
      subRef.current?.unsubscribe?.();
    } catch {}
  };

  const onPickFiles = (e: React.ChangeEvent<HTMLInputElement>) => {
    const list = Array.from(e.target.files ?? []);
    if (list.length === 0) return;

    const MAX_MB = 10;
    const MAX = MAX_MB * 1024 * 1024;

    const safe = list.filter(f => f.size <= MAX);
    if (safe.length !== list.length) alert(`일부 파일이 ${MAX_MB}MB를 초과해서 제외됐습니다.`);

    setPickedFiles(prev => {
      const key = (f: File) => `${f.name}:${f.size}:${f.lastModified}`;
      const set = new Set(prev.map(key));
      const merged = [...prev];
      for (const f of safe) {
        const k = key(f);
        if (!set.has(k)) {
          set.add(k);
          merged.push(f);
        }
      }
      return merged;
    });

    e.target.value = "";
  };

  const removePickedFile = (idx: number) => {
    setPickedFiles(prev => prev.filter((_, i) => i !== idx));
  };

  const canRename = useMemo(() => {
    if (!activeRoomId || !activeRoom) return false;
    const typeOk = activeRoom.roomType === "ADMIN_GROUP" || activeRoom.roomType === "STAFF_GROUP";
    if (!typeOk) return false;

    if ((activeRoom.roomName ?? "").trim() === "운영자 단체방") return false;

    return true;
  }, [activeRoomId, activeRoom]);

  const beginEditTitle = () => {
    if (!activeRoomId || !activeRoom) return;

    if (!canRename) {
      alert("이 방은 제목 변경이 불가합니다. (운영진 그룹방만 가능)");
      return;
    }

    setTitleDraft((activeRoom?.roomName ?? "").trim());
    setEditingTitle(true);
  };

  const cancelEditTitle = () => {
    setEditingTitle(false);
    setTitleDraft("");
  };

  const saveEditTitle = async () => {
    if (!activeRoomId) return;

    const next = String(titleDraft ?? "").trim();
    if (!next) return;

    setSavingTitle(true);
    try {
      await adminApi.renameChatRoomTitle(activeRoomId, next);
      setRooms((prev) => prev.map((r) => (r.id === activeRoomId ? { ...r, roomName: next } : r)));

      setEditingTitle(false);
      setTitleDraft("");
      await refreshRooms();
    } catch (e: any) {
      console.error(e);
      alert(String(e?.message ?? "제목 변경 실패"));
    } finally {
      setSavingTitle(false);
    }
  };

  const clearPickedFiles = () => setPickedFiles([]);

  useEffect(() => {
    void (async () => {
      try {
        await openLounge();
      } catch {
        await refreshRooms();
      }
    })();

    return () => {
      try {
        subRef.current?.unsubscribe?.();
      } catch {}
      try {
        clientRef.current?.deactivate?.();
      } catch {}
    };
  }, []);

  const totalUnread = useMemo(
    () => rooms.reduce((a, r) => a + Number(r.unread ?? 0), 0),
    [rooms]
  );

  const roomList = rooms;

const inputBase =
"w-full text-sm leading-[20px] outline-none bg-transparent text-gray-900 resize-none " +
"min-h-[44px] max-h-[140px] px-3 py-[12px]";

  return (
    <div className="h-[calc(100vh-120px)]">
      <div className="bg-white border border-gray-100 rounded-2xl p-4 shadow-sm flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-9 h-9 rounded-xl bg-violet-600 flex items-center justify-center">
            <MessagesSquare className="w-5 h-5 text-white" />
          </div>
          <div>
            <div className="text-sm font-bold text-gray-900">관리자 채팅</div>
            <div className="text-[11px] text-gray-500">통합 / 운영진 그룹 / 1:1</div>
          </div>
          {totalUnread > 0 ? (
            <span className="ml-2 inline-flex items-center px-2 py-0.5 rounded-full text-[11px] bg-red-50 text-red-700 border border-red-200">
              미읽음 {totalUnread}
            </span>
          ) : null}
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={openLounge}
            className="px-3 py-2 rounded-xl bg-white border border-gray-200 text-sm hover:bg-gray-50"
            title="운영자 단체방 참가"
          >
            통합
          </button>

          <button
            onClick={() => setCreateOpen(true)}
            className="px-3 py-2 rounded-xl bg-violet-600 text-white text-sm hover:bg-violet-700 flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            그룹 생성
          </button>

          <button
            onClick={refreshRooms}
            disabled={loadingRooms}
            className={
              "px-3 py-2 rounded-xl bg-white border border-gray-200 text-sm flex items-center gap-2 " +
              (loadingRooms ? "opacity-60" : "hover:bg-gray-50")
            }
          >
            <RefreshCw className={"w-4 h-4 " + (loadingRooms ? "animate-spin" : "")} />
            새로고침
          </button>
        </div>
      </div>

      <div className="mt-4 grid grid-cols-1 lg:grid-cols-12 gap-4 h-[calc(100%-84px)]">
        {/* Left: room list */}
        <div className="lg:col-span-4 bg-white border border-gray-100 rounded-2xl shadow-sm overflow-hidden flex flex-col">
          <div className="p-3 border-b border-gray-100">
            <div className="text-sm font-bold text-gray-900">채팅 리스트</div>
            <div className="text-[11px] text-gray-500">방을 선택하면 우측에서 대화합니다</div>
          </div>

          <div className="flex-1 overflow-y-auto">
            {roomList.map((r) => {
              const active = r.id === activeRoomId;
              return (
                <button
                  key={r.id}
                  onClick={() => void selectRoom(r.id)}
                  className={
                    "w-full text-left px-4 py-3 border-b border-gray-50 transition " +
                    (active ? "bg-violet-50" : "bg-white hover:bg-gray-50")
                  }
                >
                  <div className="flex items-center justify-between gap-2">
                    <div className="min-w-0">
                      <div className="text-sm font-semibold text-gray-900 truncate">{r.roomName}</div>
                      <div className="text-[12px] text-gray-500 truncate">{r.recentText ?? ""}</div>
                    </div>
                    <div className="text-right">
                      <div className="text-[11px] text-gray-400 whitespace-nowrap">
                        {kstTime(r.recentTime)}
                      </div>
                      {Number(r.unread ?? 0) > 0 ? (
                        <div className="mt-1 inline-flex items-center px-2 py-0.5 rounded-full text-[11px] bg-red-50 text-red-700 border border-red-200">
                          {r.unread}
                        </div>
                      ) : null}
                    </div>
                  </div>
                </button>
              );
            })}

            {roomList.length === 0 ? (
              <div className="p-6 text-center text-gray-500 text-sm">채팅방이 없습니다.</div>
            ) : null}
          </div>
        </div>

        {/* Right: messages */}
        <div className="lg:col-span-8 bg-white border border-gray-100 rounded-2xl shadow-sm overflow-hidden flex flex-col">
          {/* 헤더 */}
          <div className="p-3 border-b border-gray-100 flex items-center justify-between bg-white">
            <div>

              <div className="flex items-center gap-2">
                {!editingTitle ? (
                  <div className="text-sm font-bold text-gray-900">
                    {activeRoom?.roomName ?? "채팅방을 선택하세요"}
                  </div>
                ) : (
                  <input
                    value={titleDraft}
                    onChange={(e) => setTitleDraft(e.target.value)}
                    disabled={savingTitle}
                    className="text-sm font-bold text-gray-900 bg-transparent border-b border-gray-300 px-1 py-0.5 w-[260px] outline-none"
                    placeholder="채팅방 제목 (30자 이하)"
                    maxLength={30}
                    autoFocus
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        void saveEditTitle();
                      }
                      if (e.key === "Escape") {
                        e.preventDefault();
                        cancelEditTitle();
                      }
                    }}
                  />
                )}

                {!editingTitle ? (
                  <button
                    type="button"
                    onClick={beginEditTitle}
                    title="제목 수정"
                    className={"p-0 bg-transparent border-0 shadow-none " + (canRename ? "" : "opacity-40")}
                  >
                    <Pencil className="w-3 h-3 text-gray-700" />
                  </button>
                ) : (
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => void saveEditTitle()}
                      disabled={savingTitle}
                      title="저장 (Enter)"
                      className="p-0 bg-transparent border-0 shadow-none"
                    >
                      {savingTitle ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4 text-gray-700" />}
                    </button>

                    <button
                      type="button"
                      onClick={cancelEditTitle}
                      disabled={savingTitle}
                      title="취소 (ESC)"
                      className="p-0 bg-transparent border-0 shadow-none"
                    >
                      <X className="w-4 h-4 text-gray-700" />
                    </button>
                  </div>
                )}
              </div>
              <div className="text-[11px] text-gray-500">
                {activeRoomId ? `roomId: ${activeRoomId}` : ""}
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => void openMembers()}
                disabled={!activeRoomId}
                className="px-3 py-2 rounded-xl bg-white border border-gray-200 text-sm hover:bg-gray-50 flex items-center gap-2 disabled:opacity-60"
              >
                <Users className="w-4 h-4" />
                멤버
              </button>

              <button
                onClick={() => setInviteOpen(true)}
                disabled={!activeRoomId}
                className="px-3 py-2 rounded-xl bg-white border border-gray-200 text-sm hover:bg-gray-50 flex items-center gap-2 disabled:opacity-60"
              >
                <UserPlus className="w-4 h-4" />
                초대
              </button>

              <button
                onClick={() => void leave()}
                disabled={!activeRoomId}
                className="px-3 py-2 rounded-xl bg-white border border-gray-200 text-sm hover:bg-gray-50 flex items-center gap-2 disabled:opacity-60"
              >
                <LogOut className="w-4 h-4" />
                나가기
              </button>
            </div>
          </div>

          {/* 메시지 영역 */}
          <div className="flex-1 overflow-y-auto p-4 bg-gray-50/40">
            {!activeRoomId ? (
              <div className="text-center text-gray-500 text-sm mt-10">
                좌측에서 채팅방을 선택해 주세요.
              </div>
            ) : (
              <div className="space-y-2">
                {activeMessages.map((m, idx) => {
                  const senderEmail = getSenderEmail(m);
                  const mine = me && senderEmail && senderEmail.toLowerCase() === me;

                  const prev = idx > 0 ? activeMessages[idx - 1] : null;
                  const next = idx < activeMessages.length - 1 ? activeMessages[idx + 1] : null;

                  const prevKey = prev ? (getSenderEmail(prev) || prev.senderId || "") : "";
                  const curKey = senderEmail || m.senderId || "";
                  const nextKey = next ? (getSenderEmail(next) || next.senderId || "") : "";

                  const sameAsPrev = Boolean(prev) && prevKey === curKey;
                  const sameAsNext = Boolean(next) && nextKey === curKey;

                  const showMeta = !sameAsPrev;
                  const showTime = !sameAsNext;

                  const showDateDivider =
                    idx === 0 || dayKey(prev?.createdAt) !== dayKey(m.createdAt);

                  const displayName = getDisplayName(m);
                  const role = getAuthority(m);

                  const text = (m.message ?? "").trim();
                  const files = Array.isArray(m.files) ? m.files : [];

                  const bubbleNode =
                    m.messageType === "IMAGE" ? (
                      <div className="space-y-2">
                        {text ? <div>{text}</div> : null}
                        <div className="flex flex-wrap gap-2">
                          {files.map((f, i) => (
                            <a
                              key={f.fileUrl + i}
                              href={f.fileUrl}
                              target="_blank"
                              rel="noreferrer"
                              className="block w-[180px] h-[120px] rounded-xl overflow-hidden border border-gray-200 bg-white"
                              title={f.fileName}
                            >
                              <img src={f.fileUrl} alt={f.fileName} className="w-full h-full object-cover" />
                            </a>
                          ))}
                        </div>
                      </div>
                    ) : m.messageType === "FILE" ? (
                      <div className="space-y-2">
                        {text ? <div>{text}</div> : null}
                        <div className="space-y-1">
                          {files.map((f, i) => (
                            <a
                              key={f.fileUrl + i}
                              href={f.fileUrl}
                              target="_blank"
                              rel="noreferrer"
                              className="block text-sm underline text-gray-800 hover:text-gray-900"
                              title={f.fileName}
                            >
                              {f.fileName}
                            </a>
                          ))}
                        </div>
                      </div>
                    ) : (
                      <div>{text}</div>
                    );

                  return (
                    <React.Fragment key={m.id || `${m.roomId}:${m.senderId}:${m.createdAt}:${idx}`}>
                      {showDateDivider ? (
                        <DateDivider label={kstDayLabel(m.createdAt)} />
                      ) : null}

                      <div className={"flex " + (mine ? "justify-end" : "justify-start")}>
                        {/* 상대 아바타 */}
                        {!mine ? (
                          <div className={"mr-2 " + (showMeta ? "" : "opacity-0")}>
                            <Avatar
                              name={displayName}
                              url={m.sender?.profileImageUrl}
                              mine={false}
                            />
                          </div>
                        ) : null}

                        <div className={"max-w-[75%] " + (mine ? "text-right" : "text-left")}>
                          {showMeta ? (
                            <div className={"mb-1 flex items-center gap-2 " + (mine ? "justify-end" : "justify-start")}>
                              <div className="text-[12px] font-semibold text-gray-800">
                                {displayName}
                              </div>
                              {role ? (
                                <span
                                  className={
                                    "text-[10px] px-2 py-0.5 rounded-full border " +
                                    roleChipClass(role)
                                  }
                                >
                                  {role}
                                </span>
                              ) : null}
                            </div>
                          ) : null}

                          <div
                            className={
                              "inline-block px-3 py-2 text-sm leading-relaxed shadow-sm " +
                              (mine
                                ? "bg-violet-50 text-gray-900 border border-violet-200 ring-1 ring-violet-100 rounded-2xl rounded-br-md"
                                : "bg-white text-gray-900 border border-gray-200 rounded-2xl rounded-bl-md")
                            }
                          >
                            {bubbleNode}
                          </div>

                          {showTime ? (
                            <div
                              className={
                                "mt-1 text-[11px] text-gray-600 font-medium " +
                                (mine ? "text-right" : "text-left")
                              }
                            >
                              {kstTime(m.createdAt)}
                            </div>
                          ) : null}
                        </div>

                        {/* 내 아바타 */}
                        {mine ? (
                          <div className={"ml-2 " + (showMeta ? "" : "opacity-0")}>
                            <Avatar
                              name={displayName}
                              url={m.sender?.profileImageUrl}
                              mine={true}
                            />
                          </div>
                        ) : null}
                      </div>
                    </React.Fragment>
                  );
                })}

                <div ref={bottomRef} />
              </div>
            )}
          </div>

          {/* 입력 영역 */}
          <div className="p-3 border-t border-gray-100 bg-white">
            <div className="rounded-2xl border border-gray-200 bg-gray-50 p-1.5 flex items-center gap-2">
              <input
                ref={fileInputRef}
                type="file"
                multiple
                accept="image/*,application/pdf,.zip,.txt"
                className="hidden"
                onChange={onPickFiles}
              />

              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={!activeRoomId || uploading}
                title="첨부"
                className="w-11 h-11 rounded-xl bg-white border border-gray-200 hover:bg-gray-50 flex items-center justify-center disabled:opacity-60"
              >
                <Paperclip className="w-5 h-5 text-gray-700" />
              </button>

              <textarea
                value={input}
                onChange={(e) => setInput(e.target.value)}
                className={inputBase}
                placeholder={activeRoomId ? "메시지를 입력하세요" : "채팅방을 선택하세요"}
                disabled={!activeRoomId || uploading}
                onKeyDown={(e) => {
                  if (uploading) return;
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    void send();
                  }
                }}
              />

              <button
                onClick={() => void send()}
                disabled={!activeRoomId || uploading}
                title="전송"
                className="w-11 h-11 rounded-xl bg-gray-900 hover:bg-gray-800 text-white flex items-center justify-center disabled:opacity-60"
              >
                {uploading ? <RefreshCw className="w-5 h-5 animate-spin" /> : <SendHorizonal className="w-5 h-5" />}
              </button>
            </div>

            {pickedFiles.length > 0 ? (
              <div className="mt-2 flex flex-wrap gap-2">
                {pickedFiles.map((f, idx) => (
                  <div
                    key={`${f.name}:${f.size}:${f.lastModified}`}
                    className="px-2 py-1 rounded-xl bg-white border border-gray-200 text-[12px] flex items-center gap-2"
                  >
                    <span className="max-w-[260px] truncate">{f.name}</span>
                    <button
                      type="button"
                      onClick={() => removePickedFile(idx)}
                      className="p-1 rounded-lg hover:bg-gray-100"
                      title="제거"
                    >
                      <X className="w-3 h-3 text-gray-500" />
                    </button>
                  </div>
                ))}
                <button
                  type="button"
                  onClick={clearPickedFiles}
                  className="text-[12px] px-2 py-1 rounded-xl border border-gray-200 hover:bg-gray-50"
                >
                  전체 제거
                </button>
              </div>
            ) : null}

            <div className="mt-1 text-[11px] text-gray-400">
              Enter: 전송, Shift+Enter: 줄바꿈
            </div>
          </div>
        </div>
      </div>

      {membersOpen ? (
        <MembersModal onClose={() => setMembersOpen(false)} members={members} />
      ) : null}

      {inviteOpen && activeRoomId ? (
        <InviteModal
          roomId={activeRoomId}
          onClose={() => setInviteOpen(false)}
          onInvited={async () => {
            setInviteOpen(false);
            await refreshRooms();
          }}
        />
      ) : null}

      {createOpen ? (
        <CreateGroupModal
          onClose={() => setCreateOpen(false)}
          onCreated={async (roomId) => {
            setCreateOpen(false);
            await refreshRooms();
            await selectRoom(roomId);
          }}
        />
      ) : null}
    </div>
  );
}

function ModalShell(props: { title: string; onClose: () => void; children: React.ReactNode; widthClass?: string }) {
  return (
    <div className="fixed inset-0 z-50 bg-black/30 flex items-center justify-center p-4">
      <div className={"bg-white rounded-2xl shadow-xl border border-gray-100 w-full " + (props.widthClass ?? "max-w-[520px]")}>
        <div className="p-4 border-b border-gray-100 flex items-center justify-between">
          <div className="text-sm font-bold text-gray-900">{props.title}</div>
          <button onClick={props.onClose} className="text-sm text-gray-500 hover:text-gray-900">닫기</button>
        </div>
        <div className="p-4">{props.children}</div>
      </div>
    </div>
  );
}

function MembersModal(props: { onClose: () => void; members: AdminChatMemberRow[] }) {
  return (
    <ModalShell title="채팅방 멤버" onClose={props.onClose}>
      <div className="space-y-2">
        {props.members.map((m) => (
          <div key={m.email} className="p-3 rounded-xl border border-gray-200 flex items-center justify-between">
            <div className="min-w-0">
              <div className="text-sm font-semibold text-gray-900 truncate">{m.nickname ?? m.email}</div>
              <div className="text-[11px] text-gray-500 truncate">{m.email}</div>
            </div>
            <span className="text-[11px] px-2 py-0.5 rounded-full border bg-gray-50 text-gray-700 border-gray-200">
              {m.authority ?? "-"}
            </span>
          </div>
        ))}
        {props.members.length === 0 ? <div className="text-sm text-gray-500 text-center py-6">멤버가 없습니다.</div> : null}
      </div>
    </ModalShell>
  );
}

function InviteModal(props: { roomId: string; onClose: () => void; onInvited: () => void }) {
  const [loading, setLoading] = useState(false);
  const [candidates, setCandidates] = useState<AdminChatMemberRow[]>([]);
  const [pick, setPick] = useState<string>("");

  useEffect(() => {
    void (async () => {
      const [admins, inquiries] = await Promise.all([adminApi.listAdminMembers(), adminApi.listInquiryMembers()]);
      const merged = [...admins, ...inquiries].reduce((acc, cur) => {
        if (!acc.some((x) => x.email === cur.email)) acc.push(cur);
        return acc;
      }, [] as AdminChatMemberRow[]);
      setCandidates(merged);
      setPick(merged[0]?.email ?? "");
    })();
  }, []);

  const invite = async () => {
    if (!pick) return;
    setLoading(true);
    try {
      await adminApi.inviteStaffToRoom(props.roomId, { targetEmail: pick });
      alert("초대 완료");
      props.onInvited();
    } catch (e) {
      console.error(e);
      alert("초대 실패(권한/대상/참가자 여부 확인)");
    } finally {
      setLoading(false);
    }
  };

  return (
    <ModalShell title="운영진 초대" onClose={props.onClose}>
      <div className="text-[11px] text-gray-500 mb-2">ADMIN/INQUIRY만 초대됩니다.</div>
      <select
        value={pick}
        onChange={(e) => setPick(e.target.value)}
        className="w-full px-3 py-2 rounded-xl border border-gray-200 text-sm"
      >
        {candidates.map((c) => (
          <option key={c.email} value={c.email}>
            {(c.nickname ?? c.email) + " (" + (c.authority ?? "-") + ")"}
          </option>
        ))}
      </select>

      <div className="mt-4 flex justify-end gap-2">
        <button onClick={props.onClose} className="px-3 py-2 rounded-xl border border-gray-200 text-sm hover:bg-gray-50">
          취소
        </button>
        <button
          onClick={() => void invite()}
          disabled={loading}
          className="px-3 py-2 rounded-xl bg-violet-600 text-white text-sm hover:bg-violet-700 disabled:opacity-60"
        >
          초대
        </button>
      </div>
    </ModalShell>
  );
}

function CreateGroupModal(props: { onClose: () => void; onCreated: (roomId: string) => void }) {
  const { adminEmail } = useAdminStore();
  const me = useMemo(() => String(adminEmail ?? "").trim().toLowerCase(), [adminEmail]);

  const [title, setTitle] = useState("운영진 그룹채팅");
  const [loading, setLoading] = useState(false);
  const [candidates, setCandidates] = useState<AdminChatMemberRow[]>([]);
  const [selected, setSelected] = useState<Record<string, boolean>>({});

  useEffect(() => {
    void (async () => {
      const [admins, inquiries] = await Promise.all([
        adminApi.listAdminMembers(),
        adminApi.listInquiryMembers(),
      ]);

      const merged = [...admins, ...inquiries].reduce((acc, cur) => {
        if (!acc.some((x) => x.email === cur.email)) acc.push(cur);
        return acc;
      }, [] as AdminChatMemberRow[]);

      const filtered = merged.filter(
        (m) => String(m.email ?? "").trim().toLowerCase() !== me
      );

      setCandidates(filtered);
    })();
  }, [me]);

  const toggle = (email: string) => setSelected((p) => ({ ...p, [email]: !p[email] }));

  const create = async () => {
    setLoading(true);
    try {
      const participantEmails = Object.entries(selected).filter(([, v]) => v).map(([k]) => k);
      const roomId = await adminApi.createStaffGroupRoom({ title, participantEmails, staffOnly: true });
      alert("그룹 생성 완료");
      props.onCreated(roomId);
    } catch (e) {
      console.error(e);
      alert("그룹 생성 실패");
    } finally {
      setLoading(false);
    }
  };

  return (
    <ModalShell title="운영진 그룹 생성" onClose={props.onClose} widthClass="max-w-[640px]">
      <div>
        <div className="text-[11px] text-gray-500">방 제목</div>
        <input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className="mt-1 w-full px-3 py-2 rounded-xl border border-gray-200 text-sm"
        />
      </div>

      <div className="mt-3">
        <div className="text-[11px] text-gray-500 mb-2">초대할 운영진 선택</div>
        <div className="max-h-[280px] overflow-y-auto border border-gray-200 rounded-xl">
          {candidates.map((c) => (
            <label
              key={c.email}
              className="flex items-center justify-between px-3 py-2 border-b border-gray-50 cursor-pointer hover:bg-gray-50"
            >
              <div className="min-w-0">
                <div className="text-sm font-semibold text-gray-900 truncate">{c.nickname ?? c.email}</div>
                <div className="text-[11px] text-gray-500 truncate">{c.email}</div>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-[11px] px-2 py-0.5 rounded-full border bg-gray-50 text-gray-700 border-gray-200">
                  {c.authority ?? "-"}
                </span>
                <input type="checkbox" checked={Boolean(selected[c.email])} onChange={() => toggle(c.email)} />
              </div>
            </label>
          ))}
          {candidates.length === 0 ? (
            <div className="p-6 text-center text-sm text-gray-500">대상이 없습니다.</div>
          ) : null}
        </div>
      </div>

      <div className="mt-4 flex justify-end gap-2">
        <button onClick={props.onClose} className="px-3 py-2 rounded-xl border border-gray-200 text-sm hover:bg-gray-50">
          취소
        </button>
        <button
          onClick={() => void create()}
          disabled={loading}
          className="px-3 py-2 rounded-xl bg-violet-600 text-white text-sm hover:bg-violet-700 disabled:opacity-60"
        >
          생성
        </button>
      </div>
    </ModalShell>
  );
}
