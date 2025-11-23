//contests/ChatProvider.tsx
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
myRooms,
openInquiryRoom,
openRoom,
recentMessages,
sendMessage,
enterRoom,
exitRoom,
} from "@/api/chatApi";

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
const { userEmail, isAuthenticated } = useAuth();

const token = useMemo(
() => localStorage.getItem("accessToken"),
[isAuthenticated]
);

// 채팅에서 나를 구분하는 기준: 항상 이메일
const myEmail = useMemo(
() => userEmail ?? "",
[userEmail, isAuthenticated]
);

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
      setTimeout(connect, backoff); // 간단 재시도
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

const refreshRooms = async () => {
if (!token || !myEmail) return;
const list = await myRooms(token);
setRooms(list);
const initUnread: Record<string, number> = {};
list.forEach((r) => (initUnread[r.roomId] = r.unread || 0));
setUnread(initUnread);
};

// 로그인 / email 변동 시 방 목록 초기 로드
useEffect(() => {
refreshRooms().catch(console.error);
}, [token, myEmail]);

const subscribeRoom = (roomId: string) => {
  if (!clientRef.current || subscriptionsRef.current[roomId]) return;

  const sub = clientRef.current.subscribe(
  "/topic/chat/room/" + roomId,
  (frame) => {
  try {
  const p = JSON.parse(frame.body) || {};
  const senderEmail = String(
  p.senderId ?? p.sender ?? p.senderEmail ?? ""
  );
  const mine = !!myEmail && !!senderEmail && senderEmail === myEmail;
    console.log("[STOMP] recv", {
      roomId,
      senderEmail,
      mine,
      raw: p,
    });
      const msg: ChatMessageDto = {
        messageId: String(
          p.id ?? p.messageId ?? "stomp-" + Date.now()
        ),
        roomId: String(p.roomId || roomId),
        senderId: senderEmail,
        senderNickname: String(p.senderNickname ?? ""),
        senderProfileImageUrl: p.senderProfileImageUrl || "",
        content: String(p.message ?? p.content ?? ""),
        createdAt: String(p.createdAt ?? new Date().toISOString()),
        mine,
      };

      // 1) 메시지 목록 갱신
      setMessages((prev) => ({
        ...prev,
        [roomId]: [...(prev[roomId] || []), msg],
      }));

      // 2) 미읽음 카운트 갱신
      setUnread((u) => {
        const prevCount = u[roomId] || 0;
        if (mine) {
          // 내가 보낸 건 미읽음 증가 없음
          return { ...u, [roomId]: prevCount };
        }
        // 다른 사람이 보낸 건 +1 (현재 방인지 여부는 selectRoom 쪽에서 0으로 다시 맞춰줌)
        return { ...u, [roomId]: prevCount + 1 };
      });

      // 3) 방 리스트의 최근 메시지 / 시간 갱신
      setRooms((prev) =>
        prev.map((r) =>
          r.roomId === roomId
            ? { ...r, lastMessage: msg.content, lastAt: msg.createdAt }
            : r
        )
      );
    } catch (e) {
      console.error(e);
    }
  }


  );

  subscriptionsRef.current[roomId] = sub;
};

const selectRoom = async (roomId: string) => {
// 1) 이메일 체크는 제거, 토큰만 있으면 진행
if (!token) return;

setCurrentRoomId(roomId);
subscribeRoom(roomId);
await enterRoom(token, roomId);

// 2) 방 들어올 때마다 항상 서버 히스토리 한 번 가져오기
const list = await recentMessages(token, roomId, 50);

const corrected = list.map((m) => ({
...m,
mine: !!myEmail && m.senderId === myEmail, // 이메일 있으면 mine 판정, 없어도 문제 없음
}));

setMessages((prev) => {
const prevList = prev[roomId] || [];

const map = new Map<string, ChatMessageDto>();
prevList.forEach((m) => map.set(m.messageId, m));
corrected.forEach((m) => map.set(m.messageId, m));

const merged = Array.from(map.values());
merged.sort(
  (a, b) =>
    new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
);

return { ...prev, [roomId]: merged };


});

setUnread((u) => ({ ...u, [roomId]: 0 }));
};

const send = async (roomId: string, content: string) => {
if (!token || !myEmail || !content.trim()) return;

await sendMessage(token, { roomId, content });

// 낙관적 추가 (서버에서 다시 내려오긴 하지만 UX용)
const mineMsg: ChatMessageDto = {
  messageId: "tmp-" + Date.now(),
  roomId,
  senderId: myEmail,
  senderNickname: "나",
  senderProfileImageUrl: "",
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


};

// 언마운트 시 퇴장 처리 (email은 서버가 토큰에서 판단)
useEffect(() => {
return () => {
if (token) exitRoom(token).catch(() => {});
};
}, [token]);

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