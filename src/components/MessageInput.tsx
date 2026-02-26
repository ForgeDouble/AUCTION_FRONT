// src/components/MessageInput.tsx
import React, { useEffect, useMemo, useRef, useState } from "react";
import { Images, Send, X } from "lucide-react";

type Props = {
  onSend: (text: string) => boolean | Promise<boolean>;
  onSendImage?: (file: File) => boolean | Promise<boolean>;
};

type PickedImage = {
  id: string;
  file: File;
  url: string;
};

const MAX_IMAGES = 10;
const MAX_FILE_MB = 10;
const MAX_FILE_BYTES = MAX_FILE_MB * 1024 * 1024;

function makeId() {
  return ((crypto?.randomUUID?.() ?? "img-" + Date.now() + "-" + Math.random().toString(16).slice(2)));
}

export default function MessageInput({ onSend, onSendImage }: Props) {
  const [text, setText] = useState("");
  const [picked, setPicked] = useState<PickedImage[]>([]);
  const [sending, setSending] = useState(false);

  const [submitErr, setSubmitErr] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const taRef = useRef<HTMLTextAreaElement | null>(null);

  useEffect(() => {
    return () => {
      picked.forEach((p) => URL.revokeObjectURL(p.url));
    };
  }, []);

  const pickedCount = picked.length;

  const addImages = (files: FileList | File[]) => {
    const arr = Array.from(files || []);
    if (arr.length === 0) return;

    setSubmitErr(null);

    const remain = Math.max(0, MAX_IMAGES - pickedCount);
    if (remain <= 0) {
      alert(`이미지는 한 번에 최대 ${MAX_IMAGES}장까지 전송할 수 있습니다.`);
      return;
    }

    const next: PickedImage[] = [];

    for (const f of arr) {
      if (!f.type.startsWith("image/")) continue;

      if (f.size > MAX_FILE_BYTES) {
        alert(`"${f.name}" 파일이 너무 큽니다. (최대 ${MAX_FILE_MB}MB)`);
        continue;
      }

      if (next.length >= remain) break;

      next.push({
        id: makeId(),
        file: f,
        url: URL.createObjectURL(f),
      });
    }

    if (next.length === 0) return;

    setPicked((prev) => [...prev, ...next]);

    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const removeImage = (id: string) => {
    setPicked((prev) => {
      const target = prev.find((p) => p.id === id);
      if (target) URL.revokeObjectURL(target.url);
      return prev.filter((p) => p.id !== id);
    });
  };

  const clearAll = () => {
    setPicked((prev) => {
      prev.forEach((p) => URL.revokeObjectURL(p.url));
      return [];
    });
  };

  const canSubmit = useMemo(() => {
    return text.trim().length > 0 || picked.length > 0;
  }, [text, picked.length]);

  const submit = async () => {
    if (sending) return;
    if (!canSubmit) return;

    setSending(true);
    setSubmitErr(null);

    try {
      //  이미지 순차 전송 -> 실패 시 유실
      if (picked.length > 0) {
        if (!onSendImage) {
          setSubmitErr("이미지 전송을 지원하지 않는 채팅입니다.");
          return;
        }

        const remain: PickedImage[] = [...picked];

        for (let i = 0; i < picked.length; i++) {
          const item = picked[i];

          const ok = await Promise.resolve(onSendImage(item.file));
          if (!ok) {
            setSubmitErr("메시지 전송에 실패했습니다. 잠시 후 다시 시도해주세요.");
            setPicked(remain);
            return;
          }

          const idx = remain.findIndex((x) => x.id === item.id);
          if (idx >= 0) {
            const target = remain[idx];
            URL.revokeObjectURL(target.url);
            remain.splice(idx, 1);
            setPicked([...remain]);
          }
        }
      }

      // 텍스트 전송
      const t = text.trim();
      if (t) {
        const ok = await Promise.resolve(onSend(t));
        if (!ok) {
          setSubmitErr("메시지 전송에 실패했습니다. 잠시 후 다시 시도해주세요.");
          return;
        }
        setText("");
      }

      requestAnimationFrame(() => taRef.current?.focus());
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="border-t border-black/5 bg-transparent flex flex-col gap-2 p-2">
      {picked.length > 0 && (
        <div className="px-1">
          <div className="flex items-center justify-between">
            <div className="text-xs text-gray-600">선택된 이미지 {picked.length}장</div>
            <button
              type="button"
              onClick={clearAll}
              disabled={sending}
              className="text-xs text-gray-500 hover:text-red-500 disabled:opacity-50"
              title="전체 삭제"
            >
              전체 삭제
            </button>
          </div>

          <div className="mt-2 grid grid-cols-5 gap-2">
            {picked.map((p) => (
              <div key={p.id} className="relative">
                <div className="aspect-square rounded-xl overflow-hidden border border-black/10 bg-gray-50">
                  <img src={p.url} alt={p.file.name} className="w-full h-full object-cover" />
                </div>

                <button
                  type="button"
                  onClick={() => removeImage(p.id)}
                  disabled={sending}
                  className="
                    absolute -top-2 -right-2 w-6 h-6 rounded-full
                    bg-white border border-black/10 shadow
                    grid place-items-center
                    text-gray-600 hover:text-red-500
                    disabled:opacity-50
                  "
                  aria-label="이미지 삭제"
                  title="삭제"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>

          <div className="mt-2 text-[11px] text-gray-400">
            Enter: 전송 · Shift+Enter: 줄바꿈 · 이미지: 최대 {MAX_IMAGES}장 / {MAX_FILE_MB}MB
          </div>
        </div>
      )}

      <div className="flex items-end gap-2">
        <button
          type="button"
          aria-label="이미지 첨부"
          onClick={() => fileInputRef.current?.click()}
          disabled={sending}
          className="
            w-10 h-10 rounded-full border border-black/10 bg-white
            flex items-center justify-center
            text-gray-700 hover:bg-black/5 active:scale-[0.99] transition
            disabled:opacity-50 disabled:cursor-not-allowed
          "
          title="이미지 첨부"
        >
          <Images className="w-5 h-5 text-[rgb(118_90_255)]" />
        </button>

        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          multiple
          className="hidden"
          onChange={(e) => {
            if (e.target.files) addImages(e.target.files);
          }}
        />

        <textarea
          ref={taRef}
          rows={1}
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Enter: 전송, Shift+Enter: 줄바꿈"
          className="
            flex-1 resize-none
            bg-white border border-black/5 rounded-xl px-3 py-2
            text-sm text-gray-700 placeholder-gray-400
            focus:outline-none focus:ring-2 focus:ring-[rgb(118_90_255)]/25
            leading-snug max-h-32 overflow-y-auto
          "
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              void submit();
            }
          }}
        />

        <button
          type="button"
          aria-label="메시지 전송"
          onClick={() => void submit()}
          disabled={sending || !canSubmit}
          className="
            w-10 h-10 rounded-full bg-[rgb(118_90_255)] text-white
            grid place-items-center
            hover:bg-[rgb(118_90_255)]/90 active:scale-[0.99] transition
            disabled:opacity-50 disabled:cursor-not-allowed
          "
          title="전송"
        >
          <Send className="w-5 h-5" />
        </button>
      </div>
      {submitErr && (
        <div className="px-1 text-[11px] text-rose-600">
          {submitErr}
        </div>
      )}
    </div>
  );
}