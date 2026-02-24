// src/components/MessageInput.tsx
import React, { useEffect, useRef, useState } from "react";
import {Paperclip, Image as ImageIcon, Send } from "lucide-react";

type Props = {
  onSend: (text: string) => void;
  onSendImage?: (file: File) => void;
};

export default function MessageInput({ onSend, onSendImage }: Props) {
  const [text, setText] = useState("");
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const taRef = useRef<HTMLTextAreaElement | null>(null);

  useEffect(() => {
    return () => {
      if (imagePreview) URL.revokeObjectURL(imagePreview);
    };
  }, [imagePreview]);

  const pickImage = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (!f) return;

    if (!f.type.startsWith("image/")) {
      alert("이미지 파일만 전송할 수 있습니다.");
      return;
    }

    if (imagePreview) URL.revokeObjectURL(imagePreview);
    setImageFile(f);
    setImagePreview(URL.createObjectURL(f));
    // 같은 파일 다시 선택 가능하게 value 리셋
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const clearImage = () => {
    if (imagePreview) URL.revokeObjectURL(imagePreview);
    setImageFile(null);
    setImagePreview(null);
  };

  const submit = () => {
    const t = text.trim();
    if (!t && !imageFile) return;

    if (imageFile && onSendImage) {
      onSendImage(imageFile);
      clearImage();
    }

    if (t) {
      onSend(t);
      setText("");
    }

    requestAnimationFrame(() => taRef.current?.focus());
  };

  return (
    <div className="border-t border-black/5 bg-transparent flex flex-col gap-2 p-2">
      {imagePreview && (
        <div className="flex items-center gap-2 px-1">
          <div className="w-16 h-16 rounded-lg overflow-hidden border border-black/10 bg-gray-50">
            <img src={imagePreview} alt="선택된 이미지" className="w-full h-full object-cover" />
          </div>

          <div className="flex-1 min-w-0">
            <div className="text-xs text-gray-600 truncate">{imageFile?.name}</div>
            <div className="text-[11px] text-gray-400 mt-0.5">이미지를 선택했어요</div>
          </div>

          <button
            type="button"
            onClick={clearImage}
            className="w-8 h-8 rounded-full grid place-items-center text-gray-500 hover:text-red-500 hover:bg-black/5 transition"
            aria-label="선택 이미지 취소"
            title="취소"
          >
            ✕
          </button>
        </div>
      )}

      <div className="flex items-end gap-2">
        <button
          type="button"
          aria-label="이미지 첨부"
          onClick={() => fileInputRef.current?.click()}
          className="w-10 h-10 rounded-full border border-black/10 bg-white flex items-center justify-center
                     text-gray-700 hover:bg-black/5 active:scale-[0.99] transition"
          title="이미지 첨부"
        >
          <Paperclip className="w-5 h-5" />
        </button>

        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={pickImage}
        />

        <textarea
          ref={taRef}
          rows={1}
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="메시지를 입력하세요 (Enter: 전송, Shift+Enter: 줄바꿈)"
          className="
            flex-1 resize-none
            bg-white border border-black/5 rounded-2xl px-3 py-2
            text-sm text-gray-700 placeholder-gray-400
            focus:outline-none focus:ring-2 focus:ring-[rgb(118_90_255)]/25
            leading-snug max-h-32 overflow-y-auto
          "
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              submit();
            }
          }}
        />

        <button
          type="button"
          aria-label="메시지 전송"
          onClick={submit}
          className="w-10 h-10 rounded-full bg-[rgb(118_90_255)] text-white
                     grid place-items-center hover:bg-[rgb(118_90_255)]/90 active:scale-[0.99] transition"
          title="전송"
        >
          <Send className="w-5 h-5" />
        </button>
      </div>
    </div>
  );
}