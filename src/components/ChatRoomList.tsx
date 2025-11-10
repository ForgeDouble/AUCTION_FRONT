import React from "react";
import type { ChatRoomDto } from "@/pages/chat/ChatTypes";

type Props = { rooms: ChatRoomDto[]; onOpen: (roomId: string) => void };

export default function ChatRoomList({ rooms, onOpen }: Props) {
  return (
    <div className="h-full overflow-y-auto divide-y divide-black/5">
      {rooms.map((r) => (
        <button
          key={r.roomId}
          className="w-full text-left px-4 py-3 hover:bg-black/5 transition"
          onClick={() => onOpen(r.roomId)}
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-purple-100 flex items-center justify-center text-purple-700 font-semibold">
              {(r.title || "?").slice(0,1)}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between">
                <div className="text-gray-900 font-medium truncate">{r.title}</div>
                <div className="text-xs text-gray-400">{(r.lastAt || "").replace("T", " ").slice(0,16)}</div>
              </div>
              <div className="text-sm text-gray-500 truncate">{r.lastMessage || "대화를 시작해 보세요"}</div>
            </div>
            {!!(r.unread || 0) && (
              <span className="ml-2 inline-flex items-center justify-center min-w-6 h-6 px-2 rounded-full bg-pink-600 text-white text-xs">
                {r.unread}
              </span>
            )}
          </div>
        </button>
      ))}
    </div>
  );
}
