import React, { useEffect, useRef } from "react";
import type { ChatMessageDto } from "@/pages/chat/ChatTypes";

interface Props {
  title?: string;
  messages: ChatMessageDto[];
  mineIdGuess?: number; // 필요 시 내 유저 ID
}

export default function ChatWindow({ title, messages }: Props) {
  const bottomRef = useRef<HTMLDivElement | null>(null);
  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages]);

  return (
    <div className="flex flex-col h-full">
      <div className="p-4 border-b border-white/10 text-white font-bold">{title || "채팅"}</div>
      <div className="flex-1 overflow-y-auto p-4 space-y-2">
        {messages.map((m) => {
          const mine = !!m.mine; // 서버가 유저 ID 안주면 프론트에서 mine 플래그 사용
          return (
            <div key={m.messageId} className={`flex ${mine ? "justify-end" : "justify-start"}`}>
              <div className={`max-w-[70%] rounded-2xl px-4 py-2 text-sm ${mine ? "bg-purple-600 text-white" : "bg-white/10 text-white"}`}>
                <div className="whitespace-pre-wrap break-words">{m.content}</div>
                <div className="text-[10px] opacity-70 mt-1 text-right">{m.createdAt.replace("T", " ").slice(0,16)}</div>
              </div>
            </div>
          );
        })}
        <div ref={bottomRef} />
      </div>
    </div>
  );
};

