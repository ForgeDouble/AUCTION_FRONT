import React, { createContext, useContext, useEffect, useMemo, useRef, useState } from "react";
import SockJS from "sockjs-client";
import Stomp from "stompjs";
import { useAuth } from "@/hooks/useAuth";
import type { ChatMessageDto, ChatRoomDto } from "@/pages/chat/ChatTypes";
import { chatMyRooms, chatEnterRoom, chatRecent } from "@/api/chatApi";

export interface ChatContextType {
  connected: boolean;
  rooms: ChatRoomDto[];
  currentRoom?: ChatRoomDto;
  messages: Record<string, ChatMessageDto[]>; // roomId -> messages
  unread: Record<string, number>;
  refreshRooms: () => Promise<void>;
  selectRoom: (roomId: string) => Promise<void>;
  send: (roomId: string, content: string) => void; // STOMP 전송
}

const ChatContext = createContext<ChatContextType | null>(null);

// 외부에서 쓰는 훅
export function useChat(): ChatContextType {
  const ctx = useContext(ChatContext);
  if (!ctx) throw new Error("useChat must be used within ChatProvider");
  return ctx;
}

export const ChatProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isAuthenticated, userEmail } = useAuth();
  const token = useMemo(() => localStorage.getItem("accessToken"), [isAuthenticated]);
  const userId = useMemo(() => (localStorage.getItem("userId") || userEmail || "").toString(), [userEmail, isAuthenticated]);

  const clientRef = useRef<Stomp.Client | null>(null);
  const [connected, setConnected] = useState(false);
  const [rooms, setRooms] = useState<ChatRoomDto[]>([]);
  const [currentRoomId, setCurrentRoomId] = useState<string | undefined>();
  const [messages, setMessages] = useState<Record<string, ChatMessageDto[]>>({});
  const [unread, setUnread] = useState<Record<string, number>>({});
  const subsRef = useRef<Record<string, Stomp.Subscription | undefined>>({});
  const retryRef = useRef(0);

  // STOMP 연결
  useEffect(() => {
    if (!token) return;

    const sock = new SockJS(`${(import.meta as any).env?.VITE_API_BASE ?? "http://localhost:8080"}/ws`);
    const client = Stomp.over(sock);
    client.heartbeat.outgoing = 10000;
    client.heartbeat.incoming = 10000;
    client.debug = () => {}; // 로그 억제

    client.connect(
      { Authorization: `Bearer ${token}` },
      async () => {
        clientRef.current = client;
        setConnected(true);
        retryRef.current = 0;
        // 최초 방 목록
        await refreshRooms();
      },
      () => {
        setConnected(false);
        clientRef.current = null;
        const backoff = Math.min(1000 * 2 ** retryRef.current, 10000);
        retryRef.current += 1;
        setTimeout(() => {
          // 재시도는 의존성(token) 변화 시 다시 실행됨
        }, backoff);
      }
    );

    return () => {
      try { client.disconnect(() => {}); } catch {}
      setConnected(false);
      clientRef.current = null;
      subsRef.current = {};
    };
  }, [token, userId]);

  const currentRoom = useMemo(() => rooms.find(r => r.roomId === currentRoomId), [rooms, currentRoomId]);

  const refreshRooms = async () => {
    if (!userId) return;
    const res = await chatMyRooms(userId, token);
    const list = res.result || [];
    setRooms(list);
    const initUnread: Record<string, number> = {};
    list.forEach(r => { initUnread[r.roomId] = r.unread || 0; });
    setUnread(initUnread);
  };

  const subscribeRoom = (roomId: string) => {
    if (!clientRef.current || subsRef.current[roomId]) return;
    const sub = clientRef.current.subscribe(`/topic/chat/${roomId}`, frame => {
      const msg: ChatMessageDto = JSON.parse(frame.body);
      setMessages(prev => ({ ...prev, [roomId]: [...(prev[roomId] || []), msg] }));
      setUnread(u => ({ ...u, [roomId]: roomId === currentRoomId ? 0 : (u[roomId] || 0) + 1 }));
    });
    subsRef.current[roomId] = sub;
  };

  const selectRoom = async (roomId: string) => {
    setCurrentRoomId(roomId);
    subscribeRoom(roomId);

    // 메시지 최초 로딩
    if (!messages[roomId]) {
      try {
        const page = await chatRecent(roomId, 50, token);
        setMessages(prev => ({ ...prev, [roomId]: page.result || [] }));
      } catch (e) {
        console.error(e);
      }
    }

    // 읽음 처리
    try {
      await chatEnterRoom({ userId, roomId }, token);
      setUnread(u => ({ ...u, [roomId]: 0 }));
    } catch {}
  };

  const send = (roomId: string, content: string) => {
    if (!clientRef.current || !connected) return;
    const body = JSON.stringify({ roomId, content });
    clientRef.current.send("/app/chat.send", { Authorization: `Bearer ${token}` }, body);

    // 낙관적 반영
    const mine: ChatMessageDto = {
      messageId: `tmp-${Date.now()}`,
      roomId,
      senderId: -1,
      senderNickname: "me",
      content,
      createdAt: new Date().toISOString(),
      mine: true,
    };
    setMessages(p => ({ ...p, [roomId]: [...(p[roomId] || []), mine] }));
  };

  const value: ChatContextType = {
    connected,
    rooms,
    currentRoom,
    messages,
    unread,
    refreshRooms,
    selectRoom,
    send,
  };

  return <ChatContext.Provider value={value}>{children}</ChatContext.Provider>;
};
