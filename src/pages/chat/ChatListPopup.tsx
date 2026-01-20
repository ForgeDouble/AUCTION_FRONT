//pages/chat/ChatListPopup.tsx
import React from "react";
import { useChat } from "@/hooks/useChat";
import { useAuth } from "@/hooks/useAuth";
import { Plus } from "lucide-react";


export default function ChatListPopup() {
  const { rooms, openAdminAndSelect } = useChat();

  const { isAuthenticated, authority } = useAuth();
  const canInquiry = isAuthenticated && authority === "USER";

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
    {/* 상단 바 */}
    <div className="sticky top-0 z-10 bg-white/70 backdrop-blur border-b border-black/5 px-4 py-3 flex items-center justify-between">
    <div className="font-bold text-gray-800">채팅</div>
    <button type="button"
      onClick={() => {
        if (!canInquiry) return;
        openAdminAndSelect();
      }}
      

      disabled={!canInquiry}
      className={
        "flex items-center gap-1 text-sm px-3 py-1.5 rounded-full transition " +
        (canInquiry
          ? "bg-purple-600 text-white hover:bg-purple-700"
          : "bg-gray-200 text-gray-400 cursor-not-allowed")
      }
      title={
        canInquiry
          ? "관리자에게 문의하기"
          : "문의하기는 USER 권한에서만 가능합니다."
      }
    >
      <Plus size={16} /> 문의하기
    </button>
    </div>


      <div className="p-2">
        <div className="bg-white rounded-2xl shadow-sm border border-black/5 overflow-hidden">
          {rooms.length === 0 && (
            <div className="p-8 text-center text-gray-500">
              채팅 내역이 없습니다.
            </div>
          )}

          {rooms.map((r) => (
            <button
              key={r.roomId}
              onClick={() => openRoomWindow(r.roomId)}
              className="w-full flex items-center gap-3 px-4 py-3 hover:bg-black/5 transition text-left"
            >

              <div className="w-10 h-10 rounded-full bg-purple-100 flex items-center justify-center text-purple-700 font-semibold">
                {(r.title || "?").slice(0, 1)}
              </div>


              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 min-w-0">
                    <div className="font-medium text-gray-900 truncate">
                      {r.title}
                    </div>


                    {r.adminChat && (
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-purple-100 text-purple-700 shrink-0">
                        문의
                      </span>
                    )}
                  </div>

                  <div className="text-xs text-gray-400">
                    {(r.lastAt || "").replace("T", " ").slice(0, 16)}
                  </div>
                </div>

                <div className="text-sm text-gray-500 truncate">
                  {r.lastMessage || "대화를 시작해 보세요"}
                </div>
              </div>

              {/* 미읽음 배지 */}
              {!!(r.unread || 0) && (
                <span className="ml-2 inline-flex items-center justify-center min-w-6 h-6 px-2 rounded-full bg-pink-600 text-white text-xs">
                  {r.unread}
                </span>
              )}
            </button>
          ))}
        </div>
      </div>
    </div>


  );
}