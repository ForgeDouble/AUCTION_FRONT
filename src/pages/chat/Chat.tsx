import React, { useEffect } from "react";
import ChatRoomList from "@/components/ChatRoomList";
import ChatWindow from "@/components/ChatWindow";
import MessageInput from "@/components/MessageInput";
import { useChat } from "@/hooks/useChat";
import { useSearchParams } from "react-router-dom";

const Chat: React.FC = () => {
  const { rooms, currentRoom, messages, unread, selectRoom, send } = useChat();
  const [sp] = useSearchParams();

  // 팝업에서 넘긴 roomId 자동 선택
  useEffect(() => {
    const rid = sp.get("roomId");
    if (rid) selectRoom(rid);
  }, [sp]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 pt-24 pb-6">
      <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-3 gap-6 px-4">
        <div className="bg-white/10 border border-white/20 rounded-2xl overflow-hidden h-[70vh]">
          <div className="p-4 text-white font-bold border-b border-white/10">채팅방</div>
          <ChatRoomList
            rooms={rooms}
            activeRoomId={currentRoom?.roomId}
            unread={unread}
            onSelect={selectRoom}
          />
        </div>

        <div className="lg:col-span-2 bg-white/10 border border-white/20 rounded-2xl overflow-hidden h-[70vh] flex flex-col">
          <ChatWindow
            title={currentRoom?.title}
            messages={currentRoom ? (messages[currentRoom.roomId] || []) : []}
          />
          {currentRoom && <MessageInput onSend={(t) => send(currentRoom.roomId, t)} />}
        </div>
      </div>
    </div>
  );
};

export default Chat;
