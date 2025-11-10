// src/components/MessageInput.tsx
import React, { useState } from "react";

type Props = { onSend: (text: string) => void };

export default function MessageInput({ onSend }: Props) {
  const [text, setText] = useState("");

  const submit = () => {
    const t = text.trim();
    if (!t) return;
    onSend(t);
    setText("");
  };

  return (
    <div className="p-2 border-t border-black/5 bg-transparent flex gap-2">
      <input
        className="flex-1 bg-white border border-black/5 rounded-2xl px-3 py-2 text-sm text-gray-700 placeholder-gray-400
                   focus:outline-none focus:ring-2 focus:ring-purple-300"
        placeholder="메시지를 입력하세요"
        value={text}
        onChange={(e) => setText(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault();
            submit();
          }
        }}
      />
      <button
        aria-label="메시지 전송"
        onClick={submit}
        className="px-4 py-2 rounded-2xl font-semibold text-white
                   bg-[#8B5CF6] hover:bg-[#7C3AED] active:scale-[0.99] transition"
      >
        전송
      </button>
    </div>
  );
}
