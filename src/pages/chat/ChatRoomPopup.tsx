// src/pages/chat/ChatRoomPopup.tsx
import React, { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { useChat } from "@/hooks/useChat";
import ChatWindow from "@/components/ChatWindow";
import MessageInput from "@/components/MessageInput";
import { LogOut } from "lucide-react";

const POPUP_NAME = "chat_list_popup";

function openChatListPopup() {
  const w = 420;
  const h = 720;
  const left = window.screenX + Math.max(0, (window.outerWidth - w) / 2);
  const top = window.screenY + Math.max(0, (window.outerHeight - h) / 2);

  // name을 고정하면 이미 열려 있으면 "그 창을 재사용"해서 앞으로 가져옴
  const win = window.open(
    "/chat-list",
    POPUP_NAME,
    "popup=yes,width=" +
      w +
      ",height=" +
      h +
      ",left=" +
      left +
      ",top=" +
      top +
      ",resizable=yes,scrollbars=yes",
  );

  if (win) win.focus();
  return win;
}

export default function ChatRoomPopup() {
  const { currentRoom, rooms, messages, selectRoom, send, sendImage, leaveRoom } = useChat();
  const [sp] = useSearchParams();
  const roomId = sp.get("roomId") || "";

  const [leaveOpen, setLeaveOpen] = useState(false);
  const [leaving, setLeaving] = useState(false);

  // useEffect(() => {
  //   if (roomId) selectRoom(roomId);
  // }, [roomId, selectRoom]);
  useEffect(() => {
    if (roomId) selectRoom(roomId);
  }, [roomId]);

  const msgList = useMemo(() => (roomId ? messages[roomId] || [] : []), [messages, roomId]);

  const title =
    currentRoom?.title ||
    rooms?.find((r) => r.roomId === roomId)?.title ||
    "채팅";

  const goChatListAfterLeave = () => {
    const listWin = openChatListPopup();

    if (!listWin) {
      alert("팝업이 차단되어 채팅 목록을 열 수 없습니다.\n브라우저 팝업 허용 후 다시 시도해주세요.");
      return;
    }

    // 현재 창 닫기
    window.close();
  };

  const doLeave = async () => {
    if (!roomId || leaving) return;

    setLeaving(true);
    try {
      await leaveRoom(roomId);
      setLeaveOpen(false);

      goChatListAfterLeave();
    } catch (e: any) {
      console.error(e);
      alert(e?.message || "방 나가기 중 오류가 발생했습니다.");
    } finally {
      setLeaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#fbf3ff] to-[#f7eefb]">
      <div
        className="sticky top-0 z-10 bg-[#EDE7F6] text-[#3B2B73]
                   px-3 py-2 flex items-center justify-between border-b border-black/5 relative"
      >
        <button
          onClick={() => window.close()}
          className="text-[#3B2B73]/80 hover:text-[#3B2B73] text-sm"
        >
          ←
        </button>

        <div className="font-semibold truncate max-w-[70%] text-center">{title}</div>

        <button
          type="button"
          onClick={() => setLeaveOpen((v) => !v)}
          className="inline-flex items-center gap-1 px-2 py-1 rounded-lg text-sm
                     text-[#3B2B73]/80 hover:text-[#3B2B73] hover:bg-black/5"
          title="방 나가기"
        >
          <LogOut className="w-4 h-4" />
          나가기
        </button>

        {leaveOpen && (
          <div className="absolute right-3 top-[44px] w-[240px] rounded-2xl bg-white shadow-xl border border-black/10 p-3">
            <div className="text-sm font-semibold text-gray-900">
              방을 나가시겠습니다
            </div>
            <div className="text-[11px] text-gray-500 mt-1">
              나가면 이 채팅방은 목록에서 사라집니다.
            </div>

            <div className="mt-3 flex gap-2">
              <button
                type="button"
                onClick={() => setLeaveOpen(false)}
                disabled={leaving}
                className={
                  "flex-1 h-9 rounded-xl border text-sm font-semibold " +
                  (leaving ? "opacity-50 cursor-not-allowed" : "hover:bg-black/5")
                }
              >
                취소
              </button>

              <button
                type="button"
                onClick={doLeave}
                disabled={leaving}
                className={
                  "flex-1 h-9 rounded-xl text-sm font-semibold text-white " +
                  (leaving
                    ? "bg-rose-400 cursor-not-allowed"
                    : "bg-rose-600 hover:bg-rose-700")
                }
              >
                방 나가기
              </button>
            </div>
          </div>
        )}
      </div>

      <div className="h-[calc(100vh-56px)] px-3 pt-2 pb-3">
        <div className="h-full min-h-0 bg-white/70 border border-black/5 rounded-2xl flex flex-col">
          <ChatWindow messages={msgList} />
          {roomId && (
            <MessageInput
              onSend={(t) => send(roomId, t)}
              onSendImage={(file) => sendImage(roomId, file)}
            />
          )}
        </div>
      </div>
    </div>
  );
}