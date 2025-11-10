import React, { useEffect, useRef } from "react";
import type { ChatMessageDto } from "@/pages/chat/ChatTypes";

type Props = { title?: string; messages: ChatMessageDto[] };

function pad(n: number) { return n < 10 ? "0" + n : "" + n; }
function isSameDay(a: Date, b: Date) {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
}
function formatTime(d: Date) { return pad(d.getHours()) + ":" + pad(d.getMinutes()); }
function formatKoreanDate(d: Date) {
  const yoil = ["일","월","화","수","목","금","토"][d.getDay()];
  return `${d.getFullYear()}년 ${d.getMonth()+1}월 ${d.getDate()}일 ${yoil}요일`;
}

export default function ChatWindow({ title, messages }: Props) {
  const bottomRef = useRef<HTMLDivElement | null>(null);
  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages]);

  const today = new Date();
  let lastDayKey = "";

  return (
    // 핵심: flex-1 + min-h-0 로 아래 입력창 공간 확보
    <div className="flex-1 min-h-0 flex flex-col">
      {/* (원하는 경우만) 내부 타이틀 표시 */}
      {title && <div className="px-4 py-2 border-b border-black/5 text-gray-800 font-bold">{title}</div>}

      <div className="flex-1 overflow-y-auto px-3 py-2">
        {messages.map((m, idx) => {
          const d = new Date(m.createdAt);
          const dayKey = `${d.getFullYear()}-${d.getMonth()+1}-${d.getDate()}`;
          const needDayChip = idx === 0 || dayKey !== lastDayKey;
          lastDayKey = dayKey;

          const mine = !!m.mine;
          const showTime = formatTime(d);
          const isToday = isSameDay(d, today);

          return (
            <React.Fragment key={m.messageId}>
              {needDayChip && (
                <div className="flex justify-center my-2">
                  <span className="inline-flex items-center gap-2 bg-gray-200/70 text-gray-700 px-3 py-1 rounded-full text-xs shadow-sm">
                    <span aria-hidden>📅</span> {formatKoreanDate(d)}
                  </span>
                </div>
              )}

              <div className={`flex ${mine ? "justify-end" : "justify-start"} mb-1`}>
                <div
                  className={`max-w-[72%] rounded-2xl px-3 py-1.5 text-[13px] leading-snug shadow-sm ${
                    mine ? "bg-[#e8d8ff] text-gray-900" : "bg-white text-gray-800 border border-black/5"
                  }`}
                >
                  <div className="whitespace-pre-wrap break-words">{m.content}</div>
                  <div className={`${mine ? "text-gray-700/70" : "text-gray-500"} text-[10px] mt-0.5 text-right`}>
                    {isToday ? showTime : showTime}
                  </div>
                </div>
              </div>
            </React.Fragment>
          );
        })}
        <div ref={bottomRef} />
      </div>
    </div>
  );
}
