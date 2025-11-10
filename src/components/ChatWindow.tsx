// src/components/ChatWindow.tsx
import React, { useEffect, useRef } from "react";
import type { ChatMessageDto } from "@/pages/chat/ChatTypes";

interface Props {
  title?: string;
  messages: ChatMessageDto[];
  showHeader?: boolean; // 팝업 상단바와 중복 방지용
}

const ChatWindow: React.FC<Props> = ({ title, messages, showHeader = false }) => {
  const bottomRef = useRef<HTMLDivElement | null>(null);
  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages]);

  return (
    <div className="flex flex-col h-full bg-white/70">
      {showHeader && (
        <div className="h-12 px-4 flex items-center border-b border-neutral-200 bg-white/70">
          <div className="font-semibold text-neutral-800">{title || "채팅"}</div>
        </div>
      )}

      <div className="flex-1 overflow-y-auto p-12 pt-6 space-y-8">
        {messages.map((m) => {
          const mine = !!m.mine;
          return (
            <div key={m.messageId} className={`flex ${mine ? "justify-end" : "justify-start"}`}>
              <div className="max-w-[70%] flex flex-col">
                <div
                  className={[
                    "rounded-2xl px-4 py-2 text-[14px] leading-5",
                    mine ? "bg-[#EBDDFF] text-[#2A2344]" : "bg-[#F2F3F5] text-[#2B2B2B]"
                  ].join(" ")}
                >
                  <div className="whitespace-pre-wrap break-words">{m.content}</div>
                </div>
                <div className={`text-[10px] mt-1 ${mine ? "text-right" : "text-left"} text-neutral-400`}>
                  {m.createdAt.replace("T", " ").slice(0, 16)}
                </div>
              </div>
            </div>
          );
        })}
        <div ref={bottomRef} />
      </div>
    </div>
  );
};

export default ChatWindow;
