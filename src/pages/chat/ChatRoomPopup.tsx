//console.log("[ChatRoomPopup] render");
// src/pages/chat/ChatRoomPopup.tsx
import React, { useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { useChat } from "@/hooks/useChat";
import ChatWindow from "@/components/ChatWindow";
import MessageInput from "@/components/MessageInput";

export default function ChatRoomPopup() {
  const { currentRoom, messages, selectRoom, send, sendImage } = useChat();
  const [sp] = useSearchParams();
  const roomId = sp.get("roomId") || "";

  useEffect(() => {
    if (roomId) selectRoom(roomId);
  }, [roomId]);

  const title = currentRoom?.title || ""; 

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#fbf3ff] to-[#f7eefb]">
    
      <div className="sticky top-0 z-10 bg-[#EDE7F6] text-[#3B2B73]
                      px-3 py-2 flex items-center justify-between border-b border-black/5">
        <button
          onClick={() => window.close()}
          className="text-[#3B2B73]/80 hover:text-[#3B2B73] text-sm"
        >
          ←
        </button>
        <div className="font-semibold truncate max-w-[70%] text-center">{title}</div>
        <div className="w-4" />
      </div>

      {/* 콘텐츠 영역 */}
      <div className="h-[calc(100vh-56px)] px-3 pt-2 pb-3">
        <div className="h-full min-h-0 bg-white/70 border border-black/5 rounded-2xl flex flex-col">
          <ChatWindow messages={roomId ? (messages[roomId] || []) : []} />
          {roomId && <MessageInput onSend={(t) => send(roomId, t)} onSendImage={(file) => sendImage(roomId, file)} />}
        </div>
      </div>
    </div>
  );
}
