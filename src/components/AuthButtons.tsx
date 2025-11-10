// src/components/AuthButtons.tsx
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { useChat } from "@/hooks/useChat";

export default function AuthButtons() {
  const navigate = useNavigate();
  const { userEmail, isAuthenticated, logout } = useAuth();
  const { unread } = useChat();
  const unreadTotal = Object.values(unread || {}).reduce((a, b) => a + (b || 0), 0);

  const handleLogout = () => {
    logout();
    navigate("/");
  };

  const openChatPopup = () => {
    const w = 420, h = 720;
    const left = window.screenX + Math.max(0, (window.outerWidth - w) / 2);
    const top  = window.screenY + Math.max(0, (window.outerHeight - h) / 2);
    window.open(
      "/chat-popup",
      "chat_popup",
      `popup=yes,width=${w},height=${h},left=${left},top=${top},resizable=yes,scrollbars=yes`
    );
  };

  if (isAuthenticated) {
    return (
      <>
        <span className="text-gray-300">
          <span className="text-purple-400 font-semibold">{userEmail}</span>님
        </span>

        <button
          className="relative bg-white/10 text-white px-4 py-2 rounded-full hover:bg-white/20 transition"
          onClick={openChatPopup}
        >
          채팅
          {unreadTotal > 0 && (
            <span className="absolute -top-2 -right-2 bg-pink-600 text-white text-xs rounded-full min-w-5 h-5 px-1 flex items-center justify-center">
              {unreadTotal}
            </span>
          )}
        </button>

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
      </>
    );
  }

  return (
    <>
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
    </>
  );
}
