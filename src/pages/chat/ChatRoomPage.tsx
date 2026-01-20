//console.log("[ChatRoomPage] render");
// pages/chat/chatRoomPage.tsx
import React, { useEffect, useMemo, useRef, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { useChat } from "@/hooks/useChat";
import ChatWindow from "@/components/ChatWindow";
import MessageInput from "@/components/MessageInput";

const ChatRoomPage: React.FC = () => {
  const { currentRoom, messages, selectRoom, send, rooms, sendImage } = useChat();
  const [sp] = useSearchParams();
  const roomId = sp.get("roomId") || "";

  // 최초 진입 시 roomId로 방 선택 (읽음 처리 + 최근 메시지 로딩)
  useEffect(() => {
    if (roomId) {
      selectRoom(roomId);
    }
  }, [roomId]);

  // 현재 방의 메시지 목록
  const msgList = useMemo(
    () => (currentRoom ? (messages[currentRoom.roomId] || []) : []),
    [messages, currentRoom]
  );

  // 닫기 버튼: 팝업이면 close, 아니면 뒤로가기
  const closeOrBack = () => {
    if (window.opener) {
      window.close();
    } else {
      window.history.back();
    }
  };

  // 방 제목
  const title =
    currentRoom?.title ||
    rooms.find((r) => r.roomId === roomId)?.title ||
    "채팅";

  return (
    <div className="min-h-screen w-full bg-gradient-to-b from-rose-50 via-fuchsia-50 to-violet-50">
      {/* 상단 헤더 */}
      <div className="sticky top-0 z-10 h-14 px-3 flex items-center justify-between border-b border-black/10 bg-white/60 backdrop-blur">
        <button
          onClick={closeOrBack}
          className="px-2 py-1 rounded-lg text-sm text-gray-700 hover:bg-black/5"
        >
          ←
        </button>
        <div className="flex flex-col items-center">
          <div className="text-sm font-semibold text-gray-800">{title}</div>
          <div className="text-[11px] text-gray-500">
            {roomId ? `room: ${roomId}` : ""}
          </div>
        </div>
        <div className="w-8" />
      </div>

      {/* 본문 */}
      <div className="max-w-3xl mx-auto p-3">
        <div className="h-[72vh] bg-white/70 border border-black/10 rounded-2xl overflow-hidden shadow-sm flex flex-col">
          <ChatWindow title={title} messages={msgList} />
          {roomId && (
            <MessageInput onSend={(t) => send(roomId, t)} onSendImage={(file) => sendImage(roomId, file)} />
          )}
        </div>
      </div>
    </div>
  );
};

export default ChatRoomPage;
