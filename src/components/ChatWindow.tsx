// components/ChatWindow.tsx
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
<div className="flex-1 min-h-0 flex flex-col">
{title && (
<div className="px-4 py-2 border-b border-black/5 text-gray-800 font-bold">
{title}
</div>
)}

  <div className="flex-1 overflow-y-auto px-3 py-2">
    {messages.map((m, idx) => {
      const d = new Date(m.createdAt);
      const dayKey = `${d.getFullYear()}-${d.getMonth()+1}-${d.getDate()}`;
      const needDayChip = idx === 0 || dayKey !== lastDayKey;
      lastDayKey = dayKey;

      const mine = !!m.mine;
      const showTime = formatTime(d);
      const isToday = isSameDay(d, today);

      const nickname = m.senderNickname || (mine ? "나" : "상대방");
      const initial = nickname.slice(0, 1);

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
              <div className="flex flex-col items-end max-w-[72%]">
                <div className="text-[11px] text-gray-500 mb-0.5">
                  {nickname}
                </div>
                <div
                  className="rounded-2xl px-3 py-1.5 text-[13px] leading-snug shadow-sm bg-[#e8d8ff] text-gray-900"
                >
                  <div className="whitespace-pre-wrap break-words">{m.content}</div>
                  <div className="text-gray-700/70 text-[10px] mt-0.5 text-right">
                    {isToday ? showTime : showTime}
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="flex justify-start mb-1">
              <div className="flex items-end gap-2 max-w-[80%]">
                <div className="w-8 h-8 rounded-full bg-purple-100 flex items-center justify-center text-purple-700 text-xs font-semibold overflow-hidden">
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
                <div className="flex flex-col">
                  <div className="text-[11px] text-gray-500 mb-0.5">
                    {nickname}
                  </div>
                  <div
                    className="max-w-[100%] rounded-2xl px-3 py-1.5 text-[13px] leading-snug shadow-sm bg-white text-gray-800 border border-black/5"
                  >
                    <div className="whitespace-pre-wrap break-words">{m.content}</div>
                    <div className="text-gray-500 text-[10px] mt-0.5 text-right">
                      {isToday ? showTime : showTime}
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