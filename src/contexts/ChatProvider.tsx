//contests/ChatProvider.tsx
import React, { createContext, useContext, useEffect, useMemo, useRef, useState, useCallback } from "react";
import SockJS from "sockjs-client";
import Stomp from "stompjs";
import { useAuth } from "@/hooks/useAuth";
import type { ChatMessageDto, ChatRoomDto, ChatMessageType } from "@/pages/chat/ChatTypes";
import {myRooms, openInquiryRoom, openRoom, recentMessages, sendMessage, enterRoom, exitRoom, uploadChatImage, getChatRoomMembers,leaveChatRoom } from "@/api/chatApi";

export interface ChatContextType {
  connected: boolean;
  rooms: ChatRoomDto[];
  currentRoom?: ChatRoomDto;
  messages: Record<string, ChatMessageDto[]>;
  unread: Record<string, number>;
  refreshRooms: () => Promise<void>;
  selectRoom: (roomId: string) => Promise<void>;
  send: (roomId: string, content: string) => Promise<boolean>;
  sendImage: (roomId: string, file: File) => Promise<boolean>;
  openAdminAndSelect: () => Promise<void>;
  leaveRoom: (roomId: string) => Promise<void>;

  roomsLoading: boolean;
  roomsError: string | null;
}

const ChatContext = createContext<ChatContextType | null>(null);

export function useChat(): ChatContextType {
  const ctx = useContext(ChatContext);
  if (!ctx) throw new Error("useChat 은 반드시 ChatProvider 와 같이 사용");
  return ctx;
}

export const ChatProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { userEmail, isAuthenticated } = useAuth();

  const token = useMemo(
    () => localStorage.getItem("accessToken"),
    [isAuthenticated]
  );

  const myEmail = useMemo(() => userEmail ?? "", [userEmail, isAuthenticated]);

  const clientRef = useRef<Stomp.Client | null>(null);
  const [connected, setConnected] = useState(false);
  const [rooms, setRooms] = useState<ChatRoomDto[]>([]);
  const [currentRoomId, setCurrentRoomId] = useState<string | undefined>();
  const [messages, setMessages] = useState<Record<string, ChatMessageDto[]>>({});
  const [unread, setUnread] = useState<Record<string, number>>({});
  const subscriptionsRef = useRef<Record<string, Stomp.Subscription | undefined>>({});
  const retryRef = useRef(0);
  
  const [roomsLoading, setRoomsLoading] = useState(false);
  const [roomsError, setRoomsError] = useState<string | null>(null);
  // STOMP 연결
  useEffect(() => {
    if (!token) return;

    const sock = new SockJS("http://localhost:8080/ws");
    const client = Stomp.over(sock);
    client.heartbeat.outgoing = 10000;
    client.heartbeat.incoming = 10000;
    client.debug = () => {};

    const connect = () => {
      client.connect(
        { Authorization: "Bearer " + token },
        () => {
          clientRef.current = client;
          setConnected(true);
          retryRef.current = 0;
        },
        () => {
          setConnected(false);
          clientRef.current = null;
          const backoff = Math.min(1000 * Math.pow(2, retryRef.current), 10000);
          retryRef.current += 1;
          // 재시도
          setTimeout(connect, backoff);
        }
      );
    };

    connect();

    return () => {
      try {
        client.disconnect(() => {});
      } catch {}
      setConnected(false);
      clientRef.current = null;
      subscriptionsRef.current = {};
    };


  }, [token]);

  const currentRoom = useMemo(
    () => rooms.find((r) => r.roomId === currentRoomId),
    [rooms, currentRoomId]
  );
  // function normRole(m: any) {
  //   const raw = m?.authority ?? m?.role ?? m?.userAuthority ?? m?.memberRole ?? "";
  //   return String(raw).trim().toUpperCase();
  // }
  // const refreshRooms = async () => {
  //   if (!token || !myEmail) return;
  //   const list = await myRooms(token);
  //   setRooms(list);
  //   const initUnread: Record<string, number> = {};
  //   list.forEach((r) => (initUnread[r.roomId] = r.unread || 0));
  //   setUnread(initUnread);
  // };

  const refreshRooms = useCallback(async () => {
    if (!token || !myEmail) return;

    setRoomsLoading(true);
    setRoomsError(null);

    const norm = (s: any) => String(s ?? "").trim().toLowerCase();
    const normRole = (s: any) => String(s ?? "").trim().toUpperCase();

    let list: ChatRoomDto[] = [];
    try {
      list = await myRooms(token);
    } catch (e) {
      console.error("[chat] myRooms fail", e);

      setRooms([]);
      setUnread({});
      setRoomsError("채팅 리스트를 불러오지 못했습니다. 잠시 후 다시 시도해주세요.");
      setRoomsLoading(false);
      return;
    }
    const enriched = await Promise.all(
      list.map(async (r: any) => {
        try {
          const members = await getChatRoomMembers(token, r.roomId);
          const me = norm(myEmail);

          const others = (Array.isArray(members) ? members : []).filter(
            (m) => norm(m?.email) && norm(m.email) !== me,
          );

          const avatarStack = others.slice(0, 2).map((m) => ({
            nickname: m?.nickname ?? "",
            email: m?.email ?? "",
            profileImageUrl: m?.profileImageUrl ?? null,
          }));
          const avatarMoreCount = Math.max(0, others.length - 2);

          const peer = others.length === 1 ? others[0] : null;

          const userKeywords = others
            .map((m) => `${m?.nickname ?? ""} ${m?.email ?? ""}`.trim())
            .join(" ")
            .trim();

          const memberCount = Array.isArray(members) ? members.length : 0;
          const hasUser =
            Array.isArray(members) && members.some((m) => normRole(m?.authority) === "USER");

          const inquiry = !!r.adminChat && memberCount === 2 && hasUser;

          return {
            ...r,
            inquiry,
            userKeywords,
            peerNickname: peer?.nickname ?? "",
            peerEmail: peer?.email ?? "",
            peerProfileImageUrl: peer?.profileImageUrl ?? null,
            avatarStack,
            avatarMoreCount,
          };
        } catch (e) {
          console.error("[chat] getChatRoomMembers fail", r.roomId, e);
          return {
            ...r,
            inquiry: false,
            userKeywords: "",
            peerNickname: "",
            peerEmail: "",
            peerProfileImageUrl: null,
            avatarStack: [],
            avatarMoreCount: 0,
          };
        }
      }),
    );

    setRooms(enriched);

    const initUnread: Record<string, number> = {};
    enriched.forEach((x: any) => (initUnread[x.roomId] = x.unread || 0));
    setUnread(initUnread);

    setRoomsLoading(false);
  }, [token, myEmail]);

  // 로그인 / email 변동 시 방 목록 초기 로드
  useEffect(() => {
    refreshRooms().catch(console.error);
  }, [refreshRooms]);
  
  useEffect(() => {
    if (!connected || !currentRoomId) return;

    // 소켓 연결  + 현재 방 지정된 시점에만 구독
    subscribeRoom(currentRoomId);
  }, [connected, currentRoomId]);

  const subscribeRoom = useCallback((roomId: string) => {
    if (!clientRef.current || subscriptionsRef.current[roomId]) return;

    const sub = clientRef.current.subscribe("/topic/chat/room/" + roomId, (frame) => {
      try {
        const p = JSON.parse(frame.body) || {};
        const senderEmail = String(p.senderId ?? p.sender ?? p.senderEmail ?? "");
        const mine = !!myEmail && !!senderEmail && senderEmail === myEmail;
        const type: ChatMessageType = (p.messageType as ChatMessageType) || "TALK";

        let content: string = String(p.message ?? p.content ?? "");
        if (type === "IMAGE") {
          const fileUrl =
            (Array.isArray(p.files) && p.files[0] && p.files[0].fileUrl) ||
            p.fileUrl ||
            p.url;
          if (fileUrl) content = String(fileUrl);
        }

        const msg: ChatMessageDto = {
          messageId: String(p.id ?? p.messageId ?? "stomp-" + Date.now()),
          roomId: String(p.roomId || roomId),
          senderId: senderEmail,
          senderNickname: String(p.senderNickname ?? ""),
          senderProfileImageUrl: p.senderProfileImageUrl || "",
          content,
          createdAt: String(p.createdAt ?? new Date().toISOString()),
          type,
          mine,
        };

        setMessages((prev) => {
          const prevList = prev[roomId] || [];
          if (prevList.some((m) => m.messageId === msg.messageId)) return prev;

          const nextList = [...prevList, msg];
          nextList.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
          return { ...prev, [roomId]: nextList };
        });

        setUnread((u) => ({
          ...u,
          [roomId]: roomId === currentRoomId ? 0 : (u[roomId] || 0) + 1,
        }));
      } catch (e) {
        console.error(e);
      }
    });

    subscriptionsRef.current[roomId] = sub;
  }, [myEmail, currentRoomId]);

  const selectRoom = useCallback(async (roomId: string) => {
    if (!token) return;

    setCurrentRoomId(roomId);

    try {
      await enterRoom(token, roomId);
      const list = await recentMessages(token, roomId, 50);

      const corrected = list.map((m) => ({
        ...m,
        mine: m.senderId === myEmail,
      }));

      setMessages((prev) => {
        const prevList = prev[roomId] || [];
        const map = new Map<string, ChatMessageDto>();
        prevList.forEach((m) => map.set(m.messageId, m));
        corrected.forEach((m) => map.set(m.messageId, m));

        const merged = Array.from(map.values());
        merged.sort(
          (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime(),
        );
        return { ...prev, [roomId]: merged };
      });

      setUnread((u) => ({ ...u, [roomId]: 0 }));
    } catch (e) {
      console.error("[chat] selectRoom fail", e);
    }
  },[token, myEmail] );

  const send = useCallback(
    async (roomId: string, content: string) => {
      if (!token || !myEmail || !content.trim()) return false;
      try {
        await sendMessage(token, { roomId, content, type: "TALK" });
        return true;
      } catch (e) {
        console.error("[chat] send fail", e);
        return false;
      }
    },
    [token, myEmail],
  );

  const sendImage = useCallback(
    async (roomId: string, file: File) => {
      if (!token || !myEmail) return false;
      try {
        const url = await uploadChatImage(token, file);
        await sendMessage(token, { roomId, content: url, type: "IMAGE" });
        return true;
      } catch (e) {
        console.error("[chat] sendImage fail", e);
        return false;
      }
    },
    [token, myEmail],
  );

  // 문의하기 → /chat/room/inquire 사용
  const openAdminAndSelect = useCallback(async () => {
    if (!token || !myEmail) {
      alert("로그인이 필요합니다.");
      return;
    }

    try {
      const roomId = await openInquiryRoom(token);
      await refreshRooms();
      await selectRoom(roomId);

      const w = 420, h = 720;
      const left = window.screenX + Math.max(0, (window.outerWidth - w) / 2);
      const top  = window.screenY + Math.max(0, (window.outerHeight - h) / 2);
      window.open(
        "/chat?roomId=" + encodeURIComponent(roomId),
        "chat_room_" + roomId,
        "popup=yes,width=" + w + ",height=" + h + ",left=" + left + ",top=" + top + ",resizable=yes,scrollbars=yes"
      );
    } catch (e) {
      console.error(e);
      alert("문의방 생성 중 오류가 발생했습니다.");
    }
  }, [token, myEmail, refreshRooms, selectRoom]);

  const leaveRoom = useCallback(
    async (roomId: string) => {
      if (!token) return;

      await leaveChatRoom(token, roomId);

      const sub = subscriptionsRef.current[roomId];
      if (sub) {
        try {
          sub.unsubscribe();
        } catch {}
      }
      delete subscriptionsRef.current[roomId];

      setMessages((prev) => {
        const next = { ...prev };
        delete next[roomId];
        return next;
      });

      setUnread((prev) => {
        const next = { ...prev };
        delete next[roomId];
        return next;
      });

      setRooms((prev) => prev.filter((r) => r.roomId !== roomId));
      setCurrentRoomId((cur) => (cur === roomId ? undefined : cur));
      try {
        await refreshRooms();
      } catch (e) {
        console.error("[chat] refreshRooms after leave fail", e);
      }
    },
    [token, refreshRooms],
  );


  useEffect(() => {
    if (!connected || !currentRoomId) return;
    return () => {
      if (token) exitRoom(token).catch(() => {});
    };
  }, [token, connected, currentRoomId]);

  const value = useMemo(
    () => ({
      connected,
      roomsLoading,
      roomsError,

      rooms,
      currentRoom,
      messages,
      unread,

      refreshRooms,
      selectRoom,
      send,
      sendImage,
      openAdminAndSelect,
      leaveRoom,
    }),
    [connected, roomsLoading, roomsError, rooms, currentRoom, messages, unread, refreshRooms, selectRoom, send, sendImage, openAdminAndSelect, leaveRoom,],
  );

  return <ChatContext.Provider value={value}>{children}</ChatContext.Provider>;
};

