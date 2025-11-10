// src/components/ChatRoomList.tsx
import React from "react";
import type { ChatRoomDto } from "@/pages/chat/ChatTypes";

type Props = {
  rooms: ChatRoomDto[];
  activeRoomId?: string;
  unread: Record<string, number>;
  onSelect: (roomId: string) => void;
};

const ChatRoomList: React.FC<Props> = ({ rooms, activeRoomId, unread, onSelect }) => {
  return (
    <div className="h-full overflow-y-auto divide-y divide-white/10">
      {rooms.map((r) => (
        <button
          key={r.roomId}
          className={`w-full text-left p-4 hover:bg-white/10 transition ${
            activeRoomId === r.roomId ? "bg-white/10" : ""
          }`}
          onClick={() => onSelect(r.roomId)}
        >
          <div className="flex items-center justify-between">
            <div className="text-white font-semibold line-clamp-1">{r.title}</div>
            {!!(unread[r.roomId] || 0) && (
              <span className="ml-2 inline-flex items-center justify-center min-w-6 h-6 px-2 rounded-full bg-purple-600 text-white text-xs">
                {unread[r.roomId]}
              </span>
            )}
          </div>
          {r.lastMessage && <div className="text-gray-400 text-sm line-clamp-1">{r.lastMessage}</div>}
          {r.lastAt && (
            <div className="text-gray-500 text-xs mt-1">{r.lastAt.replace("T", " ").slice(0, 16)}</div>
          )}
        </button>
      ))}
    </div>
  );
};

export default ChatRoomList;
