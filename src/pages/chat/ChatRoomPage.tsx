import React, { useEffect, useMemo, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
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

function isChatRoomPopupWindow() {
  return !!window.opener || (window.name || "").startsWith("chat_room_");
}

const ChatRoomPage: React.FC = () => {
  const nav = useNavigate();
  const {
    currentRoom,
    rooms,
    messages,
    selectRoom,
    send,
    sendImage,
    leaveRoom,
  } = useChat();
  const [sp] = useSearchParams();
  const roomId = sp.get("roomId") || "";

  const [leaveOpen, setLeaveOpen] = useState(false);
  const [leaving, setLeaving] = useState(false);

  useEffect(() => {
    if (roomId) selectRoom(roomId);
  }, [roomId, selectRoom]);

  const msgList = useMemo(
    () => (currentRoom ? messages[currentRoom.roomId] || [] : []),
    [messages, currentRoom],
  );

  const title =
    currentRoom?.title ||
    rooms.find((r) => r.roomId === roomId)?.title ||
    "채팅";

  const closeOrBack = () => {
    if (window.opener) window.close();
    else window.history.back();
  };

  const goChatListAfterLeave = () => {
    try {
      if (window.opener && !window.opener.closed) {
        try {
          window.opener.location.href = "/chat-list";
        } catch {}
        window.opener.focus();
        window.close();
        return;
      }
    } catch {}

    const listWin = openChatListPopup();

    if (isChatRoomPopupWindow()) {
      try {
        window.close();
        return;
      } catch {}
    }

    if (listWin) {
      if (window.history.length > 1) window.history.back();
      else nav("/", { replace: true });
      return;
    }

    nav("/chat-list", { replace: true });
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
    <div className="min-h-screen w-full bg-gradient-to-b from-rose-50 via-fuchsia-50 to-violet-50">
      <div className="sticky top-0 z-10 h-14 px-3 flex items-center justify-between border-b border-black/10 bg-white/60 backdrop-blur relative">
        <button
          onClick={closeOrBack}
          className="px-2 py-1 rounded-lg text-sm text-gray-700 hover:bg-black/5"
        >
          ←
        </button>

        <div className="flex flex-col items-center">
          <div className="text-sm font-semibold text-gray-800">{title}</div>
          <div className="text-[11px] text-gray-500">
            {roomId ? `room: ${roomId}` : ""}
          </div>
        </div>

        <button
          type="button"
          onClick={() => setLeaveOpen((v) => !v)}
          className="px-2 py-1 rounded-lg text-sm text-gray-700 hover:bg-black/5 flex items-center gap-1"
          title="방 나가기"
        >
          <LogOut className="w-4 h-4" />
          나가기
        </button>

        {leaveOpen && (
          <div className="absolute right-3 top-[56px] w-[240px] rounded-2xl bg-white shadow-xl border border-black/10 p-3">
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
                  (leaving
                    ? "opacity-50 cursor-not-allowed"
                    : "hover:bg-black/5")
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

      <div className="max-w-3xl mx-auto p-3">
        <div className="h-[72vh] bg-white/70 border border-black/10 rounded-2xl overflow-hidden shadow-sm flex flex-col">
          <ChatWindow title={title} messages={msgList} />
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
};

export default ChatRoomPage;
