//contests/ChatProvider.tsx
import React, {createContext, useContext, useEffect, useMemo, useRef, useState,} from "react";
import SockJS from "sockjs-client";
import Stomp from "stompjs";
import { useAuth } from "@/hooks/useAuth";
import type { ChatMessageDto, ChatRoomDto, ChatMessageType } from "@/pages/chat/ChatTypes";
import {myRooms, openInquiryRoom, openRoom, recentMessages, sendMessage, enterRoom, exitRoom, uploadChatImage, getChatRoomMembers } from "@/api/chatApi";

export interface ChatContextType {
  connected: boolean;
  rooms: ChatRoomDto[];
  currentRoom?: ChatRoomDto;
  messages: Record<string, ChatMessageDto[]>;
  unread: Record<string, number>;
  refreshRooms: () => Promise<void>;
  selectRoom: (roomId: string) => Promise<void>;
  send: (roomId: string, content: string) => Promise<void>;
  sendImage: (roomId: string, file: File) => Promise<void>;
  openAdminAndSelect: () => Promise<void>;
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
  function normRole(m: any) {
    const raw = m?.authority ?? m?.role ?? m?.userAuthority ?? m?.memberRole ?? "";
    return String(raw).trim().toUpperCase();
  }
  // const refreshRooms = async () => {
  //   if (!token || !myEmail) return;
  //   const list = await myRooms(token);
  //   setRooms(list);
  //   const initUnread: Record<string, number> = {};
  //   list.forEach((r) => (initUnread[r.roomId] = r.unread || 0));
  //   setUnread(initUnread);
  // };

  const refreshRooms = async () => {
    if (!token || !myEmail) return;
    const list = await myRooms(token);

    const enriched = await Promise.all(
      list.map(async (r) => {
      if (!r.adminChat) {
      return { ...r, inquiry: false };
    }

      try {
        const members = await getChatRoomMembers(token, r.roomId);

        const memberCount = Array.isArray(members) ? members.length : 0;
        const hasUser = Array.isArray(members)
          && members.some((m) => String(m.authority ?? "").trim().toUpperCase() === "USER");

        const inquiry = memberCount === 2 && hasUser;

        return { ...r, inquiry };
      } catch (e) {
        console.error("[getChatRoomMembers fail]", r.roomId, e);
        return { ...r, inquiry: false };
      }
    })

    );
    setRooms(enriched);
    const initUnread: Record<string, number> = {};
    enriched.forEach((r) => (initUnread[r.roomId] = r.unread || 0));
    setUnread(initUnread);
  };

  // 로그인 / email 변동 시 방 목록 초기 로드
  useEffect(() => {
    refreshRooms().catch(console.error);
  }, [token, myEmail]);
  useEffect(() => {
    if (!connected || !currentRoomId) return;

    // 소켓 연결  + 현재 방 지정된 시점에만 구독
    subscribeRoom(currentRoomId);
  }, [connected, currentRoomId]);

    const subscribeRoom = (roomId: string) => {
    if (!clientRef.current || subscriptionsRef.current[roomId]) return;

    console.log("[STOMP] subscribe room", roomId);

      const sub = clientRef.current.subscribe(
        "/topic/chat/room/" + roomId,
        (frame) => {
          try {
            const p = JSON.parse(frame.body) || {};
            const senderEmail = String(p.senderId ?? p.sender ?? p.senderEmail ?? "");
            const mine = !!myEmail && !!senderEmail && senderEmail === myEmail;
            const type: ChatMessageType = (p.messageType as ChatMessageType) || "TALK";

            // 기본 내용
            let content: string = String(p.message ?? p.content ?? "");

            // IMAGE 타입이면 fileUrl / files[0].fileUrl / url 중 하나를 우선
            if (type === "IMAGE") {
              const fileUrl =
              (Array.isArray(p.files) && p.files[0] && p.files[0].fileUrl) ||
              p.fileUrl ||
              p.url;
              if (fileUrl) {
                content = String(fileUrl);
              }
            }

            console.log("[STOMP] recv", { roomId, senderEmail, mine, type, content, raw: p });

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

              if (prevList.some((m) => m.messageId === msg.messageId)) {
                return prev;
              }

              const nextList = [...prevList, msg];

              nextList.sort(
                (a, b) =>
                  new Date(a.createdAt).getTime() -
                  new Date(b.createdAt).getTime()
              );

              return { ...prev, [roomId]: nextList };
            });

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
    if (!token) return;

    setCurrentRoomId(roomId);

    // 서버 -> "이 방에 들어왔다" 알림
    await enterRoom(token, roomId);

    // 최근 메시지 가져오기
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
      (a, b) =>
        new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
    );

    return { ...prev, [roomId]: merged };


    });
    setUnread((u) => ({ ...u, [roomId]: 0 }));
  };

  const send = async (roomId: string, content: string) => {
    if (!token || !myEmail || !content.trim()) return;

    // 서버전송 + 프론트 STOMP, subscribeRoom 으로만 반영
    await sendMessage(token, { roomId, content, type: "TALK"});
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

  const sendImage = async (roomId: string, file: File) => {
    if (!token || !myEmail) return;

console.log("[ChatProvider.sendImage] start", { roomId, fileName: file.name });

    try {
      const url = await uploadChatImage(token, file);
      console.log("[ChatProvider.sendImage] uploaded url =", url);


      await sendMessage(token, { roomId, content: url, type: "IMAGE" });
      console.log("[ChatProvider.sendImage] sendMessage OK");

      const mineMsg: ChatMessageDto = {
        messageId: "img-" + Date.now(),
        roomId,
        senderId: myEmail,
        senderNickname: "나",
        senderProfileImageUrl: "",
        content: url,
        createdAt: new Date().toISOString(),
        type: "IMAGE",
        mine: true,
      };

      // setMessages((p) => ({
      //   ...p,
      //   [roomId]: [...(p[roomId] || []), mineMsg],
      // }));


    } catch (e) {
      console.error(e);
      alert("이미지 전송 중 오류가 발생했습니다.");
    }
  };

  useEffect(() => {
    if (!connected || !currentRoomId) return;
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
    sendImage,
    openAdminAndSelect,
  };

  return <ChatContext.Provider value={value}>{children}</ChatContext.Provider>;
};

