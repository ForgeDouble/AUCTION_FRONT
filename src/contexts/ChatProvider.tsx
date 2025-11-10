import React, { createContext, useContext, useEffect, useMemo, useRef, useState } from "react";
import SockJS from "sockjs-client";
import Stomp from "stompjs";
import { useAuth } from "@/hooks/useAuth";
import type { ChatMessageDto, ChatRoomDto } from "@/pages/chat/ChatTypes";
import { myRooms, openRoom, recentMessages, sendMessage, enterRoom, exitRoom } from "@/api/chatApi";

export interface ChatContextType {
  connected: boolean;
  rooms: ChatRoomDto[];
  currentRoom?: ChatRoomDto;
  messages: Record<string, ChatMessageDto[]>;
  unread: Record<string, number>;
  refreshRooms: () => Promise<void>;
  selectRoom: (roomId: string) => Promise<void>;
  send: (roomId: string, content: string) => Promise<void>;
  openAdminAndSelect: () => Promise<void>;
}

const ChatContext = createContext<ChatContextType | null>(null);

export function useChat(): ChatContextType {
  const ctx = useContext(ChatContext);
  if (!ctx) throw new Error("useChat must be used within ChatProvider");
  return ctx;
}

export const ChatProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isAuthenticated, userEmail } = useAuth();

  const token = useMemo(() => localStorage.getItem("accessToken"), [isAuthenticated]);
  const myId = useMemo(() => {
    return localStorage.getItem("userId") || userEmail || "";
  }, [userEmail, isAuthenticated]);

  const clientRef = useRef<Stomp.Client | null>(null);
  const [connected, setConnected] = useState(false);
  const [rooms, setRooms] = useState<ChatRoomDto[]>([]);
  const [currentRoomId, setCurrentRoomId] = useState<string | undefined>();
  const [messages, setMessages] = useState<Record<string, ChatMessageDto[]>>({});
  const [unread, setUnread] = useState<Record<string, number>>({});
  const subscriptionsRef = useRef<Record<string, Stomp.Subscription | undefined>>({});
  const retryRef = useRef(0);

  /* STOMP 연결 (옵션) */
  useEffect(() => {
    if (!token) return;
    const sock = new SockJS("http://localhost:8080/ws");
    const client = Stomp.over(sock);
    client.heartbeat.outgoing = 10000;
    client.heartbeat.incoming = 10000;
    client.debug = () => {};

    client.connect({ Authorization: "Bearer " + token }, async () => {
      clientRef.current = client;
      setConnected(true);
      retryRef.current = 0;
    }, () => {
      setConnected(false);
      clientRef.current = null;
      const backoff = Math.min(1000 * Math.pow(2, retryRef.current), 10000);
      retryRef.current += 1;
      setTimeout(() => {}, backoff);
    });

    return () => {
      try { client.disconnect(() => {}); } catch {}
      setConnected(false);
      clientRef.current = null;
      subscriptionsRef.current = {};
    };
  }, [token]);

  const currentRoom = useMemo(() => rooms.find(r => r.roomId === currentRoomId), [rooms, currentRoomId]);

  /* 목록 로드 */
  const refreshRooms = async () => {
    if (!token || !myId) return;
    const list = await myRooms(token, myId);
    setRooms(list);
    const initUnread: Record<string, number> = {};
    list.forEach(r => initUnread[r.roomId] = r.unread || 0);
    setUnread(initUnread);
  };

  useEffect(() => { refreshRooms().catch(console.error); }, [token, myId]);

  /* 구독 */
  const subscribeRoom = (roomId: string) => {
    if (!clientRef.current || subscriptionsRef.current[roomId]) return;
    const sub = clientRef.current.subscribe("/topic/chat/" + roomId, (frame) => {
      try {
        const payload: ChatMessageDto = JSON.parse(frame.body);
        setMessages(prev => ({ ...prev, [roomId]: [ ...(prev[roomId] || []), payload ] }));
        setUnread(u => ({ ...u, [roomId]: roomId === currentRoomId ? 0 : (u[roomId] || 0) + 1 }));
      } catch (e) {
        console.error(e);
      }
    });
    subscriptionsRef.current[roomId] = sub;
  };

  /* 방 선택 */
  const selectRoom = async (roomId: string) => {
    if (!token || !myId) return;
    setCurrentRoomId(roomId);
    subscribeRoom(roomId);
    await enterRoom(token, myId, roomId);
    if (!messages[roomId]) {
      const list = await recentMessages(token, roomId, 50);
      setMessages(p => ({ ...p, [roomId]: list }));
    }
    setUnread(u => ({ ...u, [roomId]: 0 }));
  };

  /* 전송 */
  const send = async (roomId: string, content: string) => {
    if (!token || !myId || !content.trim()) return;
    await sendMessage(token, { roomId, senderId: myId, content });
    // 낙관적 반영
    const mine: ChatMessageDto = {
      messageId: "tmp-" + Date.now(),
      roomId,
      senderId: -1,
      senderNickname: "me",
      content,
      createdAt: new Date().toISOString(),
      mine: true,
    };
    setMessages(p => ({ ...p, [roomId]: [ ...(p[roomId] || []), mine ] }));
  };

  /* 관리자 문의: targetId="ADMIN" 가정 */
  const openAdminAndSelect = async () => {
    if (!token || !myId) return;
    const roomId = await openRoom(token, { userId: myId, targetId: "ADMIN" });
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
  };

  useEffect(() => {
    return () => {
      if (token && myId) exitRoom(token, myId).catch(() => {});
    };
  }, [token, myId]);

  const value: ChatContextType = {
    connected,
    rooms,
    currentRoom,
    messages,
    unread,
    refreshRooms,
    selectRoom,
    send,
    openAdminAndSelect,
  };

  return <ChatContext.Provider value={value}>{children}</ChatContext.Provider>;
};
