// src/contexts/ChatProvider.tsx
import React, {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import SockJS from "sockjs-client";
import Stomp from "stompjs";
import { useAuth } from "@/hooks/useAuth";
import type { ChatMessageDto, ChatRoomDto } from "@/pages/chat/ChatTypes";
import {
  fetchChatRooms,
  fetchChatMessages,
  createChatRoom,
  markRoomRead,
  sendChatMessage,
} from "@/api/chatApi";

export interface ChatContextType {
  connected: boolean;
  rooms: ChatRoomDto[];
  currentRoom?: ChatRoomDto;
  messages: Record<string, ChatMessageDto[]>;
  unread: Record<string, number>;
  selectRoom: (roomId: string) => Promise<void>;
  send: (roomId: string, content: string) => Promise<void>;
  ensureRoomWithTarget: (targetId: string, autoSelect?: boolean) => Promise<ChatRoomDto>;
  // 임시 호환(이전 코드용): productId를 문자열로 캐스팅해 direct room 생성
  ensureRoomByProduct: (productId: number, autoSelect?: boolean) => Promise<ChatRoomDto>;
}

const ChatContext = createContext<ChatContextType | null>(null);

export function useChat(): ChatContextType {
  const ctx = useContext(ChatContext);
  if (!ctx) throw new Error("useChat must be used within ChatProvider");
  return ctx;
}

export const ChatProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // userId는 이메일을 그대로 쓰는 걸로 가정(백엔드 컨트롤러가 userId string을 받음)
  const { isAuthenticated, userEmail } = useAuth();
  const myId = useMemo(
    () => userEmail || localStorage.getItem("userEmail") || "",
    [userEmail]
  );
  const token = useMemo(() => localStorage.getItem("accessToken"), [isAuthenticated]);

  const clientRef = useRef<Stomp.Client | null>(null);
  const [connected, setConnected] = useState(false);
  const [rooms, setRooms] = useState<ChatRoomDto[]>([]);
  const [currentRoomId, setCurrentRoomId] = useState<string | undefined>();
  const [messages, setMessages] = useState<Record<string, ChatMessageDto[]>>({});
  const [unread, setUnread] = useState<Record<string, number>>({});
  const subscriptionsRef = useRef<Record<string, Stomp.Subscription | undefined>>({});
  const retryRef = useRef(0);

  // WebSocket 연결
  useEffect(() => {
    if (!token || !myId) return;

    const sock = new SockJS("http://localhost:8080/ws");
    const client = Stomp.over(sock);
    client.heartbeat.outgoing = 10000;
    client.heartbeat.incoming = 10000;
    client.debug = () => {};

    client.connect(
      { Authorization: `Bearer ${token}` },
      async () => {
        clientRef.current = client;
        setConnected(true);
        retryRef.current = 0;

        // 내 방 목록 로드 + 각 방 구독
        try {
          const res = await fetchChatRooms(token, myId);
          const list = res.result || [];
          setRooms(list);

          const initUnread: Record<string, number> = {};
          list.forEach((r) => (initUnread[r.roomId] = r.unread || 0));
          setUnread(initUnread);

          // 알림/미확인 카운트를 실시간 반영하려면 전체 구독
          list.forEach((r) => subscribeRoom(r.roomId));
        } catch (e) {
          console.error(e);
        }
      },
      () => {
        setConnected(false);
        clientRef.current = null;
        const backoff = Math.min(1000 * 2 ** retryRef.current, 10000);
        retryRef.current += 1;
        setTimeout(() => {
          // 재시도는 useEffect 재평가로 커버
        }, backoff);
      }
    );

    return () => {
      try {
        client.disconnect(() => {});
      } catch {}
      setConnected(false);
      clientRef.current = null;
      subscriptionsRef.current = {};
    };
  }, [token, myId]);

  const currentRoom = useMemo(
    () => rooms.find((r) => r.roomId === currentRoomId),
    [rooms, currentRoomId]
  );

  const subscribeRoom = (roomId: string) => {
    if (!clientRef.current || subscriptionsRef.current[roomId]) return;
    const sub = clientRef.current.subscribe(`/topic/chat/${roomId}`, (frame) => {
      const payload: ChatMessageDto = JSON.parse(frame.body);

      setMessages((prev) => ({
        ...prev,
        [roomId]: [...(prev[roomId] || []), payload],
      }));

      // 현재 방이 아니면 unread 증가
      setUnread((u) => ({
        ...u,
        [roomId]: roomId === currentRoomId ? 0 : (u[roomId] || 0) + 1,
      }));
    });
    subscriptionsRef.current[roomId] = sub;
  };

  const selectRoom = async (roomId: string) => {
    if (!myId) return;
    setCurrentRoomId(roomId);
    subscribeRoom(roomId);

    // 메시지 로컬에 없으면 최근 메시지 당겨오기 (배열 반환 주의)
    if (!messages[roomId]) {
      try {
        const recent = await fetchChatMessages(token, roomId, 50);
        setMessages((p) => ({ ...p, [roomId]: recent.result || [] }));
      } catch (e) {
        console.error(e);
      }
    }

    // 읽음 처리
    try {
      await markRoomRead(token, myId, roomId);
      setUnread((u) => ({ ...u, [roomId]: 0 }));
    } catch (e) {
      console.error(e);
    }
  };

  const send = async (roomId: string, content: string) => {
    if (!roomId || !content.trim()) return;

    // 낙관적 반영
    const mine: ChatMessageDto = {
      messageId: `tmp-${Date.now()}`,
      roomId,
      senderId: -1,
      senderNickname: myId || "me",
      content,
      createdAt: new Date().toISOString(),
      mine: true,
    };
    setMessages((p) => ({ ...p, [roomId]: [...(p[roomId] || []), mine] }));

    // 서버 전송(REST)
    try {
      await sendChatMessage(token, { roomId, content, senderId: myId });
    } catch (e) {
      console.error(e);
      // 실패 시 롤백 혹은 에러 표시를 원하면 여기서 처리
    }
  };

  const ensureRoomWithTarget = async (targetId: string, autoSelect = true) => {
    if (!myId) throw new Error("로그인이 필요합니다.");
    const { result } = await createChatRoom(token, { userId: myId, targetId });

    // 목록에 없으면 추가
    setRooms((prev) =>
      prev.find((r) => r.roomId === result.roomId) ? prev : [result, ...prev]
    );

    // 실시간 구독 확보
    subscribeRoom(result.roomId);

    if (autoSelect) await selectRoom(result.roomId);
    return result;
  };

  // 이전 코드 호환(상품 ID로 방 만들던 자리를 targetId 문자열로 우회)
  const ensureRoomByProduct = async (productId: number, autoSelect = true) => {
    return ensureRoomWithTarget(String(productId), autoSelect);
  };

  const value: ChatContextType = {
    connected,
    rooms,
    currentRoom,
    messages,
    unread,
    selectRoom,
    send,
    ensureRoomWithTarget,
    ensureRoomByProduct,
  };

  return <ChatContext.Provider value={value}>{children}</ChatContext.Provider>;
};
