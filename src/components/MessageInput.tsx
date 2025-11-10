// src/components/MessageInput.tsx
import React, { useState } from "react";

const MessageInput: React.FC<{ onSend: (text: string) => void }> = ({ onSend }) => {
  const [text, setText] = useState("");
  const submit = () => {
    const t = text.trim();
    if (!t) return;
    onSend(t);
    setText("");
  };

  return (
    <div className="p-3 border-t border-neutral-200 bg-white/80 flex gap-2">
      <input
        className="flex-1 bg-white border border-neutral-200 rounded-xl px-3 py-2 text-[14px] text-neutral-800 placeholder-neutral-400 focus:outline-none focus:ring-2 focus:ring-purple-200"
        placeholder="메시지를 입력하세요"
        value={text}
        onChange={(e) => setText(e.target.value)}
        onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); submit(); } }}
      />
      <button
        onClick={submit}
        className="px-4 py-2 rounded-xl font-semibold bg-gradient-to-r from-purple-500 to-pink-500 text-white hover:opacity-95 active:opacity-90"
      >
        전송
      </button>
    </div>
  );
};

export default MessageInput;
