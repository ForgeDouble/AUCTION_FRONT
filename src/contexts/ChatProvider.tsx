import React, {createContext,useContext,useEffect,useMemo,useRef,useState,} from "react";
import SockJS from "sockjs-client";
import Stomp from "stompjs";
import { useAuth } from "@/hooks/useAuth";
import type { ChatMessageDto, ChatRoomDto } from "@/pages/chat/ChatTypes";
import {myRooms,openInquiryRoom, openRoom,recentMessages,sendMessage,enterRoom,exitRoom,} from "@/api/chatApi";

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
// 채팅 쪽에서는 userEmail 사용 X, 인증 여부만 필요
const { isAuthenticated } = useAuth();

// 토큰은 기존처럼 localStorage에서
const token = useMemo( () => localStorage.getItem("accessToken"), [isAuthenticated] );

// 중요: 채팅용 userId는 항상 백엔드의 User PK 문자열만 사용
// 로그인 성공 시 백엔드 응답의 userId를 localStorage.userId에 꼭 저장해야 함
const myId = useMemo( () => localStorage.getItem("userId") || "", [isAuthenticated] );

const clientRef = useRef<Stomp.Client | null>(null);
const [connected, setConnected] = useState(false);
const [rooms, setRooms] = useState<ChatRoomDto[]>([]);
const [currentRoomId, setCurrentRoomId] = useState<string | undefined>();
const [messages, setMessages] = useState<Record<string, ChatMessageDto[]>>({});
const [unread, setUnread] = useState<Record<string, number>>({});
const subscriptionsRef = useRef<Record<string, Stomp.Subscription | undefined>>({});
const retryRef = useRef(0);

// STOMP 연결
useEffect(() => {
  if (!token) return;

  const sock = new SockJS("http://localhost:8080/ws");
  const client = Stomp.over(sock);
  client.heartbeat.outgoing = 10000;
  client.heartbeat.incoming = 10000;
  client.debug = () => {};

  client.connect(
    { Authorization: "Bearer " + token },() => {
      clientRef.current = client;
      setConnected(true);
      retryRef.current = 0;
    }, () => {
      setConnected(false);
      clientRef.current = null;
      const backoff = Math.min(1000 * Math.pow(2, retryRef.current), 10000);
      retryRef.current += 1;
      setTimeout(() => {}, backoff);
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
}, [token]);

const currentRoom = useMemo(
  () => rooms.find((r) => r.roomId === currentRoomId),
  [rooms, currentRoomId]
);

const refreshRooms = async () => {
  if (!token || !myId) return;
  const list = await myRooms(token, myId);
  setRooms(list);
  const initUnread: Record<string, number> = {};
  list.forEach((r) => (initUnread[r.roomId] = r.unread || 0));
  setUnread(initUnread);
};

// 로그인 / myId 변동 시 방 목록 초기 로드
useEffect(() => {
refreshRooms().catch(console.error);
}, [token, myId]);

const subscribeRoom = (roomId: string) => {
if (!clientRef.current || subscriptionsRef.current[roomId]) return;

// 백엔드 STOMP 목적지는 /topic/chat/room/{roomId}
const sub = clientRef.current.subscribe(
  "/topic/chat/room/" + roomId,
  (frame) => {
    try {
      const p = JSON.parse(frame.body) || {};
      const sid = String(p.senderId ?? p.sender ?? p.senderEmail ?? "");
      const mine = !!myId && !!sid && String(myId) === sid;

      const msg: ChatMessageDto = {
        messageId: String(
          p.id ?? p.messageId ?? "stomp-" + Date.now()
        ),
        roomId: String(p.roomId || roomId),
        senderId: -1,
        senderNickname: "",
        content: String(p.message ?? p.content ?? ""),
        createdAt: String(p.createdAt ?? new Date().toISOString()),
        mine,
      };

      setMessages((prev) => ({
        ...prev,
        [roomId]: [...(prev[roomId] || []), msg],
      }));
      setUnread((u) => ({
        ...u,
        [roomId]:
          roomId === currentRoomId ? 0 : (u[roomId] || 0) + 1,
      }));
    } catch (e) {
      console.error(e);
    }
  }
);

subscriptionsRef.current[roomId] = sub;


};

const selectRoom = async (roomId: string) => {
if (!token || !myId) return;
setCurrentRoomId(roomId);
subscribeRoom(roomId);
await enterRoom(token, myId, roomId);

if (!messages[roomId]) {
  const list = await recentMessages(token, roomId, 50);
  const corrected = list.map((m) => ({
    ...m,
    mine:
      !!myId &&
      String(myId) === String(
        (m as any).senderIdText ?? m.senderId ?? ""
      ),
  }));
  setMessages((p) => ({ ...p, [roomId]: corrected }));
}
setUnread((u) => ({ ...u, [roomId]: 0 }));


};

const send = async (roomId: string, content: string) => {
if (!token || !myId || !content.trim()) return;

await sendMessage(token, { roomId, senderId: myId, content });

const mineMsg: ChatMessageDto = {
  messageId: "tmp-" + Date.now(),
  roomId,
  senderId: -1,
  senderNickname: "me",
  content,
  createdAt: new Date().toISOString(),
  mine: true,
};
setMessages((p) => ({
  ...p,
  [roomId]: [...(p[roomId] || []), mineMsg],
}));


};

// 문의하기 → /chat/room/inquire 사용
const openAdminAndSelect = async () => {
  console.log("openAdminAndSelect token =", token, "myId =", myId);
  if (!token || !myId) {
    alert("로그인이 필요합니다."); // 최소한 사용자에게 피드백
    return;
  }

  try {
  const roomId = await openInquiryRoom(token, { userId: myId });
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
};

// 언마운트 시 퇴장 처리
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

return (<ChatContext.Provider value={value}>{children}</ChatContext.Provider>);
};