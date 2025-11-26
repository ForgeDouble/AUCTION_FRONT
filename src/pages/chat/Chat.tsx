console.log("[Chat] render");
// pages/chat/chat.tsx
import React from "react";
import ChatRoomList from "@/components/ChatRoomList";
import { useChat } from "@/hooks/useChat";

export default function Chat() {
    const { rooms } = useChat();

    const openRoomWindow = (roomId: string) => {
        const w = 420, h = 720;
        const left = window.screenX + Math.max(0, (window.outerWidth - w) / 2);
        const top = window.screenY + Math.max(0, (window.outerHeight - h) / 2);
        window.open(
            "/chat?roomId=" + encodeURIComponent(roomId),
            "chat_room_" + roomId,
            "popup=yes,width=" + w + ",height=" + h + ",left=" + left + ",top=" + top + ",resizable=yes,scrollbars=yes"
        );
    };

    return (
        <div className="min-h-screen bg-gradient-to-b from-[#fbf3ff] to-[#f7eefb]">
            <div className="sticky top-0 z-10 bg-white/70 backdrop-blur border-b border-black/5 px-4 py-3 font-bold text-gray-800">
                채팅
            </div>
            <div className="p-2">
                <div className="bg-white rounded-2xl shadow-sm border border-black/5 overflow-hidden h-[calc(100vh-70px)]">
                    <ChatRoomList rooms={rooms} onOpen={openRoomWindow} />
                </div>
            </div>
        </div>
    );
}