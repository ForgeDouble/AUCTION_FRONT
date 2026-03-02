import React, { useEffect, useMemo, useRef, useState, useCallback } from "react";
import type { ChatMessageDto } from "@/pages/chat/ChatTypes";
import { useAuth } from "@/hooks/useAuth";
import { X, ChevronLeft, ChevronRight } from "lucide-react";
import { useNavigate } from "react-router-dom";

type Props = { title?: string; messages: ChatMessageDto[] };

function pad2(n: number) {
  return n < 10 ? "0" + n : "" + n;
}

function formatTimeAmPm(d: Date) {
  const h = d.getHours();
  const m = d.getMinutes();
  const isAm = h < 12;
  let hh = h % 12;
  if (hh === 0) hh = 12;
  return `${isAm ? "오전" : "오후"} ${hh}:${pad2(m)}`;
}

function formatKoreanDate(d: Date) {
  const yoil = ["일", "월", "화", "수", "목", "금", "토"][d.getDay()];
  return `${d.getFullYear()}년 ${d.getMonth() + 1}월 ${d.getDate()}일 ${yoil}요일`;
}

function isImageMessage(m: ChatMessageDto) {
  return (
    m.type === "IMAGE" &&
    typeof m.content === "string" &&
    /^https?:\/\//i.test(m.content)
  );
}

const NAV_CH = "auction:navigate";

function tryNavigateMain(path: string) {
  try {
    let w: any = window;

    while (w.opener && !w.opener.closed) {
      w = w.opener;
    }

    if (w && w !== window) {
      w.location.assign(path);
      w.focus();
      return true;
    }
  } catch {}
  return false;
}

function requestMainNavigate(path: string) {
  if (tryNavigateMain(path)) return true;
  try {
    const ch = new BroadcastChannel(NAV_CH);
    ch.postMessage({ path });
    ch.close();
    return true;
  } catch {}

  try {
    localStorage.setItem(NAV_CH, JSON.stringify({ path, ts: Date.now() }));
    localStorage.removeItem(NAV_CH);
    return true;
  } catch {}

  return false;
}

export default function ChatWindow({ title, messages }: Props) {
  const nav = useNavigate();
  const bottomRef = useRef<HTMLDivElement | null>(null);
  const scrollRef = useRef<HTMLDivElement | null>(null);

  const { userEmail, userId: meId } = useAuth() as {
    userEmail?: string | null;
    userId?: number | null;
  };

  const myEmail = useMemo(
    () => String(userEmail ?? "").trim().toLowerCase(),
    [userEmail],
  );

  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [lightboxIndex, setLightboxIndex] = useState(0);

  const imageUrls = useMemo(() => {
    return messages.filter(isImageMessage).map((m) => String(m.content));
  }, [messages]);

  const openLightboxByUrl = useCallback(
    (url: string) => {
      const idx = imageUrls.findIndex((x) => x === url);
      setLightboxIndex(idx >= 0 ? idx : 0);
      setLightboxOpen(true);
    },
    [imageUrls],
  );

  const closeLightbox = useCallback(() => setLightboxOpen(false), []);
  const goPrev = useCallback(
    () => setLightboxIndex((i) => (i <= 0 ? Math.max(0, imageUrls.length - 1) : i - 1)),
    [imageUrls.length],
  );
  const goNext = useCallback(
    () => setLightboxIndex((i) => (imageUrls.length === 0 ? 0 : (i + 1) % imageUrls.length)),
    [imageUrls.length],
  );

  useEffect(() => {
    if (!lightboxOpen) return;

    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") closeLightbox();
      if (e.key === "ArrowLeft") goPrev();
      if (e.key === "ArrowRight") goNext();
    };

    window.addEventListener("keydown", onKeyDown);
    return () => {
      window.removeEventListener("keydown", onKeyDown);
      document.body.style.overflow = prevOverflow;
    };
  }, [lightboxOpen, closeLightbox, goPrev, goNext]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const goPublicProfile = useCallback(
    (userId: number) => {
      if (!Number.isFinite(userId) || userId <= 0) return;

      const path = `/user/profile/${userId}`;
      const ok = requestMainNavigate(path);

      if (!ok || !window.opener) {
        nav(path);
      }
    },
    [nav],
  );

  let lastDayKey = "";
  const currentImageUrl = imageUrls[lightboxIndex] || "";

  return (
    <div className="flex-1 min-h-0 flex flex-col relative">
      {title && (
        <div className="px-4 py-2 border-b border-black/5 text-gray-800 font-bold">
          {title}
        </div>
      )}

      <div ref={scrollRef} className="flex-1 overflow-y-auto px-3 py-2">
        {messages.map((m, idx) => {
          const d = new Date(m.createdAt);
          const dayKey = `${d.getFullYear()}-${d.getMonth() + 1}-${d.getDate()}`;
          const needDayChip = idx === 0 || dayKey !== lastDayKey;
          lastDayKey = dayKey;

          const sender = String(m.senderId || "").trim().toLowerCase();
          const mine = myEmail !== "" && sender === myEmail;

          const showTime = formatTimeAmPm(d);
          const nickname = m.senderNickname || (mine ? "나" : "상대방");
          const initial = nickname.slice(0, 1);
          const isImage = isImageMessage(m);

          const targetUid =
            typeof m.senderUserId === "number" ? m.senderUserId : null;

          const canOpenPeer =
            !mine &&
            typeof targetUid === "number" &&
            targetUid > 0 &&
            (!meId || Number(targetUid) !== Number(meId));

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
                <div className="flex justify-end mb-2">
                  <div className="flex flex-col items-end max-w-[72%] min-w-0">
                    <div className="text-[11px] text-gray-500 mb-0.5">{nickname}</div>

                    <div className="rounded-xl px-2 py-2 text-[13px] leading-snug shadow-sm bg-[#e8d8ff] text-gray-900 max-w-full min-w-0">
                      {isImage ? (
                        <button
                          type="button"
                          onClick={() => openLightboxByUrl(String(m.content))}
                          className="block"
                          title="이미지 확대 보기"
                        >
                          <img
                            src={String(m.content)}
                            alt="보낸 이미지"
                            className="max-w-[220px] max-h-[260px] rounded-lg object-cover"
                          />
                        </button>
                      ) : (
                        <div className="whitespace-pre-wrap break-all min-w-0">{m.content}</div>
                      )}
                    </div>

                    <div className="text-gray-700/70 text-[10px] mt-0.5 pr-1 text-right">{showTime}</div>
                  </div>
                </div>
              ) : (
                <div className="flex justify-start mb-2">
                  <div className="flex items-start gap-2 max-w-[80%] min-w-0">
                    <button
                      type="button"
                      onClick={() => {
                        if (!canOpenPeer) return;
                        goPublicProfile(targetUid as number);
                      }}
                      disabled={!canOpenPeer}
                      title={canOpenPeer ? "프로필 보기" : "프로필 정보를 불러올 수 없어요"}
                      className={
                        "w-8 h-8 shrink-0 rounded-full overflow-hidden flex items-center justify-center text-xs font-semibold " +
                        (m.senderProfileImageUrl ? "bg-gray-100" : "bg-purple-100 text-purple-700") +
                        (canOpenPeer
                          ? " hover:ring-2 hover:ring-[rgba(118,90,255,0.35)] cursor-pointer"
                          : " opacity-70 cursor-default")
                      }
                    >
                      {m.senderProfileImageUrl ? (
                        <img
                          src={m.senderProfileImageUrl}
                          alt={nickname}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        initial
                      )}
                    </button>

                    <div className="flex flex-col min-w-0">
                      <div className="text-[11px] text-gray-500 mb-0.5">{nickname}</div>

                      <div className="max-w-full min-w-0 rounded-xl px-2 py-2 text-[13px] leading-snug shadow-sm bg-white text-gray-800 border border-black/5">
                        {isImage ? (
                          <button
                            type="button"
                            onClick={() => openLightboxByUrl(String(m.content))}
                            className="block"
                            title="이미지 확대 보기"
                          >
                            <img
                              src={String(m.content)}
                              alt="받은 이미지"
                              className="max-w-[220px] max-h-[260px] rounded-lg object-cover"
                            />
                          </button>
                        ) : (
                          <div className="whitespace-pre-wrap break-words">{m.content}</div>
                        )}
                      </div>

                      <div className="text-gray-500 text-[10px] mt-0.5 pl-1">{showTime}</div>
                    </div>
                  </div>
                </div>
              )}
            </React.Fragment>
          );
        })}
        <div ref={bottomRef} />
      </div>

      {lightboxOpen && (
        <div
          className="fixed inset-0 z-[9999] bg-black/70 flex items-center justify-center p-4"
          onClick={closeLightbox}
          role="dialog"
          aria-modal="true"
        >
          <div className="relative max-w-[92vw] max-h-[92vh]" onClick={(e) => e.stopPropagation()}>
            <button
              type="button"
              onClick={closeLightbox}
              className="absolute -top-3 -right-3 w-10 h-10 rounded-full bg-white/90 hover:bg-white grid place-items-center shadow"
              aria-label="닫기"
              title="닫기 (ESC)"
            >
              <X className="w-5 h-5 text-gray-800" />
            </button>

            {imageUrls.length > 1 && (
              <>
                <button
                  type="button"
                  onClick={goPrev}
                  className="absolute left-2 top-1/2 -translate-y-1/2 w-11 h-11 rounded-full bg-white/90 hover:bg-white grid place-items-center shadow"
                  aria-label="이전"
                  title="이전 (←)"
                >
                  <ChevronLeft className="w-6 h-6 text-gray-800" />
                </button>

                <button
                  type="button"
                  onClick={goNext}
                  className="absolute right-2 top-1/2 -translate-y-1/2 w-11 h-11 rounded-full bg-white/90 hover:bg-white grid place-items-center shadow"
                  aria-label="다음"
                  title="다음 (→)"
                >
                  <ChevronRight className="w-6 h-6 text-gray-800" />
                </button>
              </>
            )}

            <img
              src={currentImageUrl}
              alt="확대 이미지"
              className="max-w-[92vw] max-h-[92vh] rounded-2xl object-contain shadow-2xl bg-black/20"
            />

            {imageUrls.length > 1 && (
              <div className="absolute left-1/2 -translate-x-1/2 -bottom-3 px-3 py-1 rounded-full bg-white/90 text-xs text-gray-800 shadow">
                {lightboxIndex + 1} / {imageUrls.length}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}