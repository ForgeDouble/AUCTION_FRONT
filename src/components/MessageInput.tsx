// src/components/MessageInput.tsx
import React, { useEffect, useRef, useState } from "react";

type Props = {
  onSend: (text: string) => void;
  onSendImage?: (file: File) => void;
};

export default function MessageInput({ onSend, onSendImage }: Props) {
  const [text, setText] = useState("");
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    return () => {
      if (imagePreview) {
        URL.revokeObjectURL(imagePreview);
      }
    };
  }, [imagePreview]);

  const pickImage = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (!f) return;
    if (!f.type.startsWith("image/")) {
      alert("이미지 파일만 전송할 수 있습니다.");
      return;
    }
    if (imagePreview) {
      URL.revokeObjectURL(imagePreview);
    }
    setImageFile(f);
    setImagePreview(URL.createObjectURL(f));
  };

  const clearImage = () => {
    if (imagePreview) {
      URL.revokeObjectURL(imagePreview);
    }
    setImageFile(null);
    setImagePreview(null);
  };

  const submit = () => {
    const t = text.trim();

    const hasImage = !!imageFile;
    const hasOnSendImage = !!onSendImage;
    console.log("[MessageInput.submit]", { t, hasImage, hasOnSendImage });

    // 텍스트도 없고 이미지도 없으면 그냥 리턴
    if (!t && !imageFile) return;

    // 이미지가 있고, onSendImage 도 있으면 이미지 먼저 전송
    if (imageFile) {
      if (onSendImage) {
        onSendImage(imageFile);
      } else {
        console.warn("이미지 파일은 있는데 onSendImage 가 없습니다.");
      }
      setImageFile(null);
      setImagePreview(null);
    }

    // 텍스트 있으면 텍스트 전송
    if (t) {
      onSend(t);
      setText("");
    }
  };

  return (
    <div className="border-t border-black/5 bg-transparent flex flex-col gap-2 p-2">
      {imagePreview && (
      <div className="flex items-center gap-2 px-1">
      <div className="w-16 h-16 rounded-lg overflow-hidden border border-black/10 bg-gray-50">
        <img src={imagePreview} alt="선택된 이미지" className="w-full h-full object-cover" />
      </div>
      <div className="flex-1 text-xs text-gray-600 truncate">
        {imageFile?.name}
      </div>
      <button type="button" onClick={clearImage} className="text-xs text-gray-500 hover:text-red-500" >
      ✕
      </button>
    </div>
    )}

      <div className="flex items-center gap-2">
        <button
          type="button"
          aria-label="이미지 첨부"
          onClick={() => fileInputRef.current?.click()}
          className="w-9 h-9 rounded-full border border-black/10 bg-white flex items-center justify-center text-lg hover:bg-gray-50"
        >
          📎
        </button>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={pickImage}
        />

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
    </div>


  );
}