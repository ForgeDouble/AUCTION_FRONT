import React, { useState } from "react";
type Props = {
  onSend: (text: string) => void;
};
export default function MessageInput({ onSend }: Props) {
  const [text, setText] = useState("");

  const submit = () => {  
  const t = text.trim();
  if (!t) return;
  onSend(t);
  setText("");
  };

  return (
  <div className="p-3 border-t border-white/10 flex gap-2">
  <input
  className="flex-1 bg-white/10 border border-white/20 rounded-xl px-3 py-2 text-white placeholder-gray-400 focus:outline-none"
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
  <button onClick={submit} className="px-4 py-2 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-xl font-bold" >
  전송
  </button>
  </div>
  );
}
