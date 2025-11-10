// src/components/AuthButtons.tsx
import React, { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";
import { useChat } from "@/hooks/useChat";

export const AuthButtons: React.FC = () => {
  const navigate = useNavigate();
  const { userEmail, isAuthenticated, logout } = useAuth();
  const { unread, rooms } = useChat();

  const unreadTotal = Object.values(unread || {}).reduce((a, b) => a + (b || 0), 0);

  // 팝오버 열고닫기
  const [openRooms, setOpenRooms] = useState(false);
  const btnRef = useRef<HTMLButtonElement | null>(null);
  const panelRef = useRef<HTMLDivElement | null>(null);

  const toggleRooms = () => setOpenRooms((v) => !v);
  const closeRooms = () => setOpenRooms(false);

  useEffect(() => {
    const handleDown = (e: MouseEvent) => {
      const t = e.target as Node;
      if (panelRef.current?.contains(t)) return;
      if (btnRef.current?.contains(t)) return;
      setOpenRooms(false);
    };
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpenRooms(false);
    };
    document.addEventListener("mousedown", handleDown);
    document.addEventListener("keydown", handleEsc);
    return () => {
      document.removeEventListener("mousedown", handleDown);
      document.removeEventListener("keydown", handleEsc);
    };
  }, []);

  const handleLogout = () => {
    logout();
    navigate("/");
  };

  const openRoom = (roomId: string) => {
    navigate(`/chat?roomId=${roomId}`);
    closeRooms();
  };

  if (isAuthenticated) {
    return (
      <div className="flex items-center gap-3 relative">
        <span className="text-gray-300">
          <span className="text-purple-400 font-semibold">{userEmail}</span>님
        </span>

        {/* 채팅 아이콘 버튼 (배지 포함) */}
        <button
          ref={btnRef}
          onClick={toggleRooms}
          className="relative bg-white/10 text-white px-3 py-2 rounded-full hover:bg-white/20 transition inline-flex items-center gap-2"
          aria-haspopup="dialog"
          aria-expanded={openRooms}
          aria-controls="chat-rooms-popover"
        >
          {/* 심플한 말풍선 아이콘 (SVG, 외부 라이브러리 무의존) */}
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="18" height="18" fill="currentColor" className="opacity-90">
            <path d="M4 4h16a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2H9l-4.5 3.6A1 1 0 0 1 3 20v-2H4a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2z"/>
          </svg>
          <span className="hidden sm:inline">채팅</span>
          {unreadTotal > 0 && (
            <span className="absolute -top-2 -right-2 bg-pink-600 text-white text-[10px] rounded-full min-w-5 h-5 px-1 flex items-center justify-center">
              {unreadTotal}
            </span>
          )}
        </button>

        {/* 팝오버 패널 */}
        {openRooms && (
          <div
            id="chat-rooms-popover"
            ref={panelRef}
            className="absolute right-0 top-full mt-2 w-[22rem] max-h-[70vh] overflow-hidden rounded-2xl border border-white/15 bg-slate-900/95 backdrop-blur-xl shadow-2xl z-50"
            role="dialog"
            aria-label="채팅방 목록"
          >
            <div className="p-3 border-b border-white/10 text-white/90 font-semibold flex items-center justify-between">
              <span>내 채팅방</span>
              <button
                className="text-xs text-gray-300 hover:text-white underline"
                onClick={() => { navigate("/chat"); closeRooms(); }}
              >
                모두 보기
              </button>
            </div>
            <div className="max-h-[60vh] overflow-y-auto divide-y divide-white/10">
              {rooms.length === 0 && (
                <div className="p-6 text-center text-gray-400">채팅방이 없습니다.</div>
              )}
              {rooms.map((r) => (
                <button
                  key={r.roomId}
                  onClick={() => openRoom(r.roomId)}
                  className="w-full text-left p-3 hover:bg-white/10 transition"
                >
                  <div className="flex items-center justify-between gap-2">
                    <div className="text-white font-medium truncate">{r.title}</div>
                    {(r.unread ?? 0) > 0 && (
                      <span className="ml-2 inline-flex items-center justify-center min-w-6 h-6 px-2 rounded-full bg-purple-600 text-white text-xs">
                        {r.unread}
                      </span>
                    )}
                  </div>
                  {r.lastMessage && (
                    <div className="text-gray-400 text-sm truncate mt-0.5">{r.lastMessage}</div>
                  )}
                  <div className="text-gray-500 text-[11px] mt-1">
                    {r.lastAt ? r.lastAt.replace("T", " ").slice(0, 16) : ""}
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* 기존 버튼들 */}
        <button
          className="bg-gradient-to-r from-purple-600 to-pink-600 text-white px-6 py-2 rounded-full hover:from-purple-700 hover:to-pink-700 transition-all duration-300 transform hover:scale-105"
          onClick={handleLogout}
        >
          로그아웃
        </button>
        <button
          className="bg-gradient-to-r from-purple-600 to-pink-600 text-white px-6 py-2 rounded-full hover:from-purple-700 hover:to-pink-700 transition-all duration-300 transform hover:scale-105"
          onClick={() => navigate("/mypage")}
        >
          마이페이지
        </button>
      </div>
    );
  }

  // 비로그인일 때
  return (
    <div className="flex items-center gap-3">
      <button
        className="text-gray-300 hover:text-white cursor-pointer transition-colors"
        onClick={() => navigate("/login")}
      >
        로그인
      </button>
      <button
        className="bg-gradient-to-r from-purple-600 to-pink-600 text-white px-6 py-2 rounded-full hover:from-purple-700 hover:to-pink-700 transition-all duration-300 transform hover:scale-105"
        onClick={() => navigate("/register")}
      >
        회원가입
      </button>
    </div>
  );
};

export default AuthButtons;


// ─────────────────────────────────────────────────────────────────────────────
// (옵션) 딥링크 지원: roomId 쿼리로 들어왔을 때 해당 방 자동 선택
// src/pages/chat/ChatPage.tsx (또는 Chat.tsx) 일부만 참고용으로 추가
/*
import React, { useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { useChat } from "@/hooks/useChat";

const ChatPage: React.FC = () => {
  const { rooms, currentRoom, messages, unread, selectRoom, send, ensureRoomByProduct } = useChat();
  const [sp] = useSearchParams();

  useEffect(() => {
    const rid = sp.get("roomId");
    if (rid) selectRoom(rid);
    const pid = sp.get("productId");
    if (pid) ensureRoomByProduct(Number(pid), true);
  }, [sp]);

  // ... 이하 동일 ...
}
export default ChatPage;
*/
