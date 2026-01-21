// components/ChatWindow.tsx
import React, { useEffect, useMemo, useRef } from "react";
import type { ChatMessageDto } from "@/pages/chat/ChatTypes";
import { useAuth } from "@/hooks/useAuth";

type Props = { title?: string; messages: ChatMessageDto[] };

function pad(n: number) {
  return n < 10 ? "0" + n : "" + n;
}
function isSameDay(a: Date, b: Date) {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}
function formatTime(d: Date) {
  return pad(d.getHours()) + ":" + pad(d.getMinutes());
}
function formatKoreanDate(d: Date) {
  const yoil = ["일", "월", "화", "수", "목", "금", "토"][d.getDay()];
  return `${d.getFullYear()}년 ${d.getMonth() + 1}월 ${d.getDate()}일 ${yoil}요일`;
}

export default function ChatWindow({ title, messages }: Props) {
  const bottomRef = useRef<HTMLDivElement | null>(null);
  const { userEmail, userId } = useAuth();
  const myEmail = useMemo(() => {
    return String(userEmail || localStorage.getItem("userId") || "")
      .trim()
      .toLowerCase();
  }, [userEmail]);

const meEmail = String(userEmail ?? "").trim().toLowerCase();
const meId = String(userId ?? "").trim();

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const today = new Date();
  let lastDayKey = "";

  return (
    <div className="flex-1 min-h-0 flex flex-col">
      {title && (
        <div className="px-4 py-2 border-b border-black/5 text-gray-800 font-bold">
          {title}
        </div>
      )}

      <div className="flex-1 overflow-y-auto px-3 py-2">
        {messages.map((m, idx) => {
          console.log("me(email):", myEmail, "senderId:", m.senderId, "nickname:", m.senderNickname);
          const d = new Date(m.createdAt);
          const dayKey = `${d.getFullYear()}-${d.getMonth() + 1}-${d.getDate()}`;
          const needDayChip = idx === 0 || dayKey !== lastDayKey;
          
          lastDayKey = dayKey;

          const sender = String(m.senderId || "").trim().toLowerCase();

// if (idx === 0) {
//   console.log("[CHAT DEBUG] meEmail:", meEmail);
//   console.log("[CHAT DEBUG] meId:", meId);
//   console.log("[CHAT DEBUG] localStorage.userId:", localStorage.getItem("userId"));
//   console.log("[CHAT DEBUG] localStorage.userPk:", localStorage.getItem("userPk"));
// }

// console.log(
//   "[CHAT DEBUG] msg:",
//   "senderId=", m.senderId,
//   "type=", m.type,
//   "content=", typeof m.content === "string" ? m.content.slice(0, 30) : m.content
// );

          const mine = myEmail !== "" && sender === myEmail;

          const showTime = formatTime(d);
          const nickname = m.senderNickname || (mine ? "나" : "상대방");
          const initial = nickname.slice(0, 1);
          const isImage =
            m.type === "IMAGE" &&
            typeof m.content === "string" &&
            /^https?:\/\//.test(m.content);

          return (
            <React.Fragment key={m.messageId}>
              {needDayChip && (
                <div className="flex justify-center my-2">
                  <span className="inline-flex items-center gap-2 bg-gray-200/70 text-gray-700 px-3 py-1 rounded-full text-xs shadow-sm">
                    <span aria-hidden>📅</span> {formatKoreanDate(d)}
                  </span>
                </div>
              )}

              {mine ? (
                <div className="flex justify-end mb-1">
                  <div className="flex flex-col items-end max-w-[72%] min-w-0">
                    <div className="text-[11px] text-gray-500 mb-0.5">
                      {nickname}
                    </div>
                    <div className="rounded-2xl px-2 py-1.5 text-[13px] leading-snug shadow-sm bg-[#e8d8ff] text-gray-900 max-w-full min-w-0">
                      {isImage ? (
                        <a
                          href={m.content}
                          target="_blank"
                          rel="noreferrer"
                          className="block"
                        >
                          <img
                            src={m.content}
                            alt="보낸 이미지"
                            className="max-w-[220px] max-h-[260px] rounded-xl object-cover"
                          />
                        </a>
                      ) : (
                        <div className="whitespace-pre-wrap break-all min-w-0">
                          {m.content}
                        </div>
                      )}
                      <div className="text-gray-700/70 text-[10px] mt-0.5 text-right">
                        {showTime}
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="flex justify-start mb-1">
                  <div className="flex items-start gap-2 max-w-[80%] min-w-0">
                    <div className="w-8 h-8 shrink-0 rounded-full bg-purple-100 flex items-center justify-center text-purple-700 text-xs font-semibold overflow-hidden">
                      {m.senderProfileImageUrl ? (
                        <img
                          src={m.senderProfileImageUrl}
                          alt={nickname}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        initial
                      )}
                    </div>
                    <div className="flex flex-col min-w-0">
                      <div className="text-[11px] text-gray-500 mb-0.5">
                        {nickname}
                      </div>
                      <div className="max-w-full min-w-0 rounded-2xl px-2 py-1.5 text-[13px] leading-snug shadow-sm bg-white text-gray-800 border border-black/5">
                        {isImage ? (
                          <a
                            href={m.content}
                            target="_blank"
                            rel="noreferrer"
                            className="block"
                          >
                            <img
                              src={m.content}
                              alt="받은 이미지"
                              className="max-w-[220px] max-h-[260px] rounded-xl object-cover"
                            />
                          </a>
                        ) : (
                          <div className="whitespace-pre-wrap break-words">
                            {m.content}
                          </div>
                        )}
                        <div className="text-gray-500 text-[10px] mt-0.5 text-right">
                          {showTime}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </React.Fragment>
          );
        })}
        <div ref={bottomRef} />
      </div>
    </div>
  );
}