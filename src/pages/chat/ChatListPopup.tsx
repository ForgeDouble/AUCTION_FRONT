// pages/chat/ChatListPopup.tsx
import React, { useMemo, useState } from "react";
import { useChat } from "@/hooks/useChat";
import { useAuth } from "@/hooks/useAuth";
import { Plus, X } from "lucide-react";

function escapeRegExp(s: string) {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function HighlightMessage(props: { text: string; query: string }) {
  const { text, query } = props;
  const q = query.trim();
  if (!q) return <>{text}</>;

  const re = new RegExp(`(${escapeRegExp(q)})`, "ig");
  const parts = text.split(re);

  return (
    <>
      {parts.map((p, i) =>
        i % 2 === 1 ? (
          <span
            key={i}
            className="px-1 rounded bg-[rgb(118_90_255)]/15 text-[rgb(118_90_255)] font-semibold"
          >
            {p}
          </span>
        ) : (
          <React.Fragment key={i}>{p}</React.Fragment>
        ),
      )}
    </>
  );
}

// 아바타 관련(리스트에서 상대 MULTI 프로필 보기)
function pickName(m: any) {
  const nick = String(m?.nickname ?? "").trim();
  const email = String(m?.email ?? "").trim();
  return nick || email || "U";
}

function AvatarCircle(props: { item: any; className: string }) {
  const { item, className } = props;
  const name = pickName(item);
  const initial = name.slice(0, 1);

  return (
    <div
      className={
        className +
        " rounded-full overflow-hidden flex items-center justify-center " +
        "bg-[rgb(118_90_255)]/10 text-[rgb(118_90_255)] font-semibold"
      }
      title={name}
    >
      {item?.profileImageUrl ? (
        <img
          src={item.profileImageUrl}
          alt={name}
          className="w-full h-full object-cover"
        />
      ) : (
        initial
      )}
    </div>
  );
}

export default function ChatListPopup() {
  const { rooms, openAdminAndSelect, roomsLoading, roomsError, refreshRooms } = useChat();
  const { isAuthenticated, authority } = useAuth();

  const canInquiry = isAuthenticated && authority === "USER";

  const openRoomWindow = (roomId: string) => {
    const w = 420;
    const h = 720;
    const left = window.screenX + Math.max(0, (window.outerWidth - w) / 2);
    const top = window.screenY + Math.max(0, (window.outerHeight - h) / 2);

    window.open(
      "/chat?roomId=" + encodeURIComponent(roomId),
      "chat_room_" + roomId,
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
  };

  const [q, setQ] = useState("");

  const filteredRooms = useMemo(() => {
    const query = q.trim().toLowerCase();
    if (!query) return rooms;

    return rooms.filter((r: any) => {
      const titleText = String(r.title ?? "").toLowerCase();
      const msgText = String(r.lastMessage ?? "").toLowerCase();
      const userText = String(r.userKeywords ?? "").toLowerCase();
      return (titleText + " " + msgText + " " + userText).includes(query);
    });
  }, [rooms, q]);

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#fbf3ff] to-[#f7eefb]">
      {/* 상단 바 */}
      <div className="sticky top-0 z-10 bg-white/70 backdrop-blur border-b border-black/5 px-4 py-3 flex items-center justify-between">
        <div className="font-bold text-gray-800">채팅</div>

        <button
          type="button"
          onClick={() => {
            if (!canInquiry) return;
            openAdminAndSelect();
          }}
          disabled={!canInquiry}
          className={
            "flex items-center gap-1 text-sm px-3 py-1.5 rounded-full transition " +
            (canInquiry
              ? "bg-[rgb(118_90_255)] text-white hover:bg-[rgb(118_90_255)]/90"
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

      {/* 검색 영역 */}
      <div className="px-4 pb-3 bg-white/70 backdrop-blur border-b border-black/5">
        <div className="relative">
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            className="
              w-full h-10 pl-3 pr-10 rounded-xl border border-black/10 bg-white
              text-sm text-gray-800 placeholder:text-gray-400
              focus:outline-none focus:ring-2 focus:ring-[rgb(118_90_255)]/25
            "
            placeholder="채팅방 / 유저 / 메시지 검색"
            disabled={roomsLoading}
          />

          {q.trim() && !roomsLoading && (
            <button
              type="button"
              onClick={() => setQ("")}
              className="
                absolute right-2 top-1/2 -translate-y-1/2
                w-7 h-7 rounded-full
                grid place-items-center
                text-gray-500 hover:text-[rgb(118_90_255)] hover:bg-black/5
                transition
              "
              aria-label="검색 초기화"
              title="초기화"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      <div className="p-2">
        <div className="bg-white rounded-2xl shadow-sm border border-black/5 overflow-hidden">
          {roomsLoading && (
            <div className="p-8 text-center text-gray-500">
              채팅 리스트를 불러오는 중입니다...
            </div>
          )}

          {!roomsLoading && roomsError && (
            <div className="p-8 text-center">
              <div className="text-sm font-semibold text-gray-900">
                채팅 리스트를 불러오지 못했습니다
              </div>
              <div className="mt-1 text-xs text-gray-600">{roomsError}</div>

              <button
                type="button"
                onClick={() => void refreshRooms()}
                className="
                  mt-3 inline-flex items-center justify-center h-9 px-4 rounded-full
                  bg-[rgb(118_90_255)] text-white text-sm font-semibold
                  hover:bg-[rgb(118_90_255)]/90 transition
                "
              >
                다시 시도
              </button>
            </div>
          )}

          {!roomsLoading && !roomsError && (
            <>
              {filteredRooms.length === 0 && (
                <div className="p-8 text-center text-gray-500">
                  {q.trim() ? "검색 결과가 없습니다." : "채팅 내역이 없습니다."}
                </div>
              )}

              {filteredRooms.map((r: any) => {
                const query = q.trim();
                const lastMsg = String(r.lastMessage ?? "");
                const msgMatched =
                  !!query && lastMsg.toLowerCase().includes(query.toLowerCase());

                const displayName =
                  (r.peerNickname && String(r.peerNickname).trim()) ||
                  (r.peerEmail && String(r.peerEmail).trim()) ||
                  (r.title || "대화");

                const initial = displayName.slice(0, 1);

                const stack = Array.isArray(r.avatarStack) ? r.avatarStack : [];
                const isGroup = stack.length >= 2;
                const more = Number(r.avatarMoreCount ?? 0);

                return (
                  <button
                    key={r.roomId}
                    onClick={() => openRoomWindow(r.roomId)}
                    className="w-full flex items-center gap-3 px-4 py-3 hover:bg-black/5 transition text-left"
                  >
                    {isGroup ? (
                      <div className="relative w-10 h-10">
                        <AvatarCircle
                          item={stack[0]}
                          className="absolute left-0 top-0 w-8 h-8 ring-2 ring-white"
                        />
                        <AvatarCircle
                          item={stack[1]}
                          className="absolute right-0 bottom-0 w-8 h-8 ring-2 ring-white"
                        />

                        {more > 0 && (
                          <div className="absolute -right-1 -bottom-1 w-5 h-5 rounded-full bg-[rgb(118_90_255)] text-white text-[10px] font-bold flex items-center justify-center ring-2 ring-white">
                            +{more > 9 ? "9" : more}
                          </div>
                        )}
                      </div>
                    ) : (
                      <div className="w-10 h-10 rounded-full bg-[rgb(118_90_255)]/10 flex items-center justify-center text-[rgb(118_90_255)] font-semibold overflow-hidden">
                        {r.peerProfileImageUrl ? (
                          <img
                            src={r.peerProfileImageUrl}
                            alt={displayName}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          initial
                        )}
                      </div>
                    )}

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2 min-w-0">
                          <div className="font-medium text-gray-900 truncate">
                            {r.title}
                          </div>

                          {r.inquiry && (
                            <span className="text-[10px] px-2 py-0.5 rounded-full bg-[rgb(118_90_255)]/10 text-[rgb(118_90_255)] shrink-0">
                              문의
                            </span>
                          )}
                        </div>

                        <div className="text-xs text-gray-400">
                          {(r.lastAt || "").replace("T", " ").slice(0, 16)}
                        </div>
                      </div>

                      <div className="text-sm text-gray-500 truncate">
                        {lastMsg ? (
                          msgMatched ? (
                            <HighlightMessage text={lastMsg} query={query} />
                          ) : (
                            lastMsg
                          )
                        ) : (
                          "대화를 시작해 보세요"
                        )}
                      </div>
                    </div>

                    {!!(r.unread || 0) && (
                      <span className="ml-2 inline-flex items-center justify-center min-w-6 h-6 px-2 rounded-full bg-[rgb(118_90_255)] text-white text-xs">
                        {r.unread}
                      </span>
                    )}
                  </button>
                );
              })}
            </>
          )}
        </div>
      </div>
    </div>
  );
}