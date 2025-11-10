// src/pages/chat/ChatListPopup.tsx
import React, { useEffect, useMemo, useState } from "react";
import { chatMyRooms, chatOpenRoom, chatEnterRoom } from "@/api/chatApi";
import type { ChatRoomDto } from "./ChatTypes";
import { Plus, X } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";

// 관리자 식별자(백엔드에서 사용하는 targetId)로 교체하세요.
const ADMIN_ID = "admin"; // ← 실제 관리자 아이디/이메일/PK로 수정

function formatTime(iso?: string) {
  if (!iso) return "";
  try {
    const d = new Date(iso);
    return d.toLocaleTimeString("ko-KR", { hour: "numeric", minute: "2-digit", hour12: true });
  } catch {
    return iso?.replace("T", " ").slice(11, 16) ?? "";
  }
}

function initials(name?: string) {
  if (!name) return "?" ;
  const t = name.trim();
  if (!t) return "?";
  const parts = t.split(" ");
  if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
  return t.slice(0, 2).toUpperCase();
}

function Avatar({ title }: { title?: string }) {
  // 간단 파스텔 톤
  const color = useMemo(() => {
    const palette = ["bg-indigo-100 text-indigo-700","bg-pink-100 text-pink-700","bg-amber-100 text-amber-700","bg-emerald-100 text-emerald-700","bg-sky-100 text-sky-700","bg-violet-100 text-violet-700"];
    const i = Math.abs((title || "A").charCodeAt(0) + (title || "A").length) % palette.length;
    return palette[i];
  }, [title]);
  return (
    <div className={`w-11 h-11 rounded-full flex items-center justify-center font-semibold ${color}`}>
      {initials(title)}
    </div>
  );
}

export default function ChatListPopup() {
  const { userEmail } = useAuth(); // 당신의 useAuth에 userId가 있으면 그걸 쓰세요.
  const userId = (localStorage.getItem("userId") || userEmail || "").toString(); // 백엔드에서 요구하는 식별자로 맞추기
  const token = localStorage.getItem("accessToken");

  const [rooms, setRooms] = useState<ChatRoomDto[]>([]);
  const [tab, setTab] = useState<"ALL" | "UNREAD">("ALL");
  const [keyword, setKeyword] = useState("");

  const filtered = useMemo(() => {
    const base = tab === "UNREAD" ? rooms.filter(r => (r.unread || 0) > 0) : rooms;
    if (!keyword.trim()) return base;
    const q = keyword.trim().toLowerCase();
    return base.filter(r =>
      (r.title || "").toLowerCase().includes(q) ||
      (r.peerNickname || "").toLowerCase().includes(q) ||
      (r.lastMessage || "").toLowerCase().includes(q)
    );
  }, [rooms, tab, keyword]);

  async function load() {
    if (!userId) return;
    const res = await chatMyRooms(userId, token);
    setRooms(res.result || []);
  }

  useEffect(() => { load(); }, [userId]);

  async function onClickRoom(room: ChatRoomDto) {
    try {
      await chatEnterRoom({ userId, roomId: room.roomId }, token);
    } catch {}
    // 메인 창으로 대화창 전환 후 팝업 닫기
    if (window.opener && !window.opener.closed) {
      window.opener.location.assign(`/chat?roomId=${encodeURIComponent(room.roomId)}`);
      window.close();
    } else {
      // 독립 실행 시에는 같은 창에서 이동
      window.location.assign(`/chat?roomId=${encodeURIComponent(room.roomId)}`);
    }
  }

  async function onContactAdmin() {
    if (!userId) return;
    // 관리자와 방 생성/조회
    const opened = await chatOpenRoom({ userId, targetId: ADMIN_ID }, token);
    const roomId = opened.result;
    await chatEnterRoom({ userId, roomId }, token);

    if (window.opener && !window.opener.closed) {
      window.opener.location.assign(`/chat?roomId=${encodeURIComponent(roomId)}`);
      window.close();
    } else {
      window.location.assign(`/chat?roomId=${encodeURIComponent(roomId)}`);
    }
  }

  return (
    <div className="min-h-screen bg-white">
      {/* 상단 바 */}
      <div className="sticky top-0 bg-white border-b border-gray-200 px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-xl font-bold">채팅</span>
          <span className="ml-2 text-sm text-gray-500">({rooms.length})</span>
        </div>
        <button
          onClick={() => window.close()}
          className="p-2 rounded-full hover:bg-gray-100"
          aria-label="close"
        >
          <X className="w-5 h-5 text-gray-600" />
        </button>
      </div>

      {/* 탭 + 검색 */}
      <div className="px-4 pt-3 pb-2">
        <div className="flex items-center gap-2 mb-3">
          <button
            className={`px-3 py-1.5 rounded-full text-sm border ${tab === "ALL" ? "bg-gray-900 text-white border-gray-900" : "bg-white text-gray-700 border-gray-300"}`}
            onClick={() => setTab("ALL")}
          >
            전체
          </button>
          <button
            className={`px-3 py-1.5 rounded-full text-sm border ${tab === "UNREAD" ? "bg-gray-900 text-white border-gray-900" : "bg-white text-gray-700 border-gray-300"}`}
            onClick={() => setTab("UNREAD")}
          >
            안읽음
          </button>
        </div>

        <div className="relative">
          <input
            className="w-full rounded-xl border border-gray-300 px-3 py-2 pr-8 text-sm focus:outline-none focus:ring-2 focus:ring-purple-300"
            placeholder="대화 상대, 내용 검색"
            value={keyword}
            onChange={(e) => setKeyword(e.target.value)}
          />
          {keyword && (
            <button className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400" onClick={() => setKeyword("")}>×</button>
          )}
        </div>
      </div>

      {/* 리스트 */}
      <div className="divide-y divide-gray-100">
        {filtered.map((r) => (
          <button
            key={r.roomId}
            onClick={() => onClickRoom(r)}
            className="w-full text-left px-4 py-3 hover:bg-gray-50 focus:bg-gray-50"
          >
            <div className="flex items-start gap-3">
              <Avatar title={r.peerNickname || r.title} />
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <div className="font-semibold text-gray-900 truncate">
                    {r.title || r.peerNickname || "이름 없음"}
                  </div>
                  <div className="text-xs text-gray-500 whitespace-nowrap ml-2">
                    {formatTime(r.lastAt)}
                  </div>
                </div>
                <div className="flex items-center justify-between mt-0.5">
                  <div className="text-sm text-gray-500 truncate">
                    {r.lastMessage || "대화를 시작해 보세요."}
                  </div>
                  {(r.unread || 0) > 0 && (
                    <span className="ml-3 shrink-0 inline-flex items-center justify-center min-w-5 h-5 px-1 rounded-full bg-red-500 text-white text-[10px] font-bold">
                      {r.unread}
                    </span>
                  )}
                </div>
              </div>
            </div>
          </button>
        ))}

        {filtered.length === 0 && (
          <div className="px-4 py-16 text-center text-gray-400 text-sm">표시할 대화가 없습니다.</div>
        )}
      </div>

      {/* 문의하기 FAB */}
      <button
        onClick={onContactAdmin}
        className="fixed right-5 bottom-6 w-14 h-14 rounded-full shadow-lg bg-gradient-to-br from-purple-600 to-pink-600 text-white flex items-center justify-center hover:brightness-110"
        aria-label="문의하기"
        title="관리자에게 문의하기"
      >
        <Plus className="w-7 h-7" />
      </button>
    </div>
  );
}
