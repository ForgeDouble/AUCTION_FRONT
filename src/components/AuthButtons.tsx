import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { useChat } from "@/hooks/useChat";
import { useEffect, useRef, useState } from "react";
import { MessageCircle, Bell, ChevronDown } from "lucide-react";
import { useNotifications, type NotificationItem, type NotificationCategory } from "@/hooks/useNotifications";

function useClickOutside(
  ref: React.RefObject<HTMLDivElement | null>,
  onClose: () => void,
) {
  useEffect(() => {
    function handle(e: MouseEvent) {
      if (!ref.current) return;
      if (!ref.current.contains(e.target as Node)) onClose();
    }
    document.addEventListener("mousedown", handle);
    return () => document.removeEventListener("mousedown", handle);
  }, [ref, onClose]);
}

function formatRelativeTime(createdAt: string): string {
  if (!createdAt) return "";
  if (createdAt.indexOf("전") >= 0 || createdAt.indexOf("방금") >= 0) {
    return createdAt;
  }

  const date = new Date(createdAt);
  if (isNaN(date.getTime())) return createdAt;

  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffSec = Math.floor(diffMs / 1000);

  if (diffSec < 60) return "방금 전";

  const diffMin = Math.floor(diffSec / 60);
  if (diffMin < 60) return diffMin + "분 전";

  const diffHour = Math.floor(diffMin / 60);
  if (diffHour < 24) return diffHour + "시간 전";

  const diffDay = Math.floor(diffHour / 24);
  if (diffDay < 7) return diffDay + "일 전";

  const y = date.getFullYear();
  const m = (date.getMonth() + 1).toString().padStart(2, "0");
  const d = date.getDate().toString().padStart(2, "0");
  return y + "." + m + "." + d;
}

function NotificationMenu(props: {
  notifications: NotificationItem[];
  unreadCount: number;
  onClickItem: (n: NotificationItem) => void;
  onMarkAllRead: () => void;
}) {
  const { notifications, unreadCount, onClickItem, onMarkAllRead } = props;
  const [open, setOpen] = useState(false);
  const [tab, setTab] = useState<NotificationCategory>("ALL");
  const ref = useRef<HTMLDivElement | null>(null);

  useClickOutside(ref, () => setOpen(false));

  const filtered = tab === "ALL" ? notifications : notifications.filter((n) => n.category === tab);

  const handleToggle = () => setOpen((v) => !v);

  const categoryMeta: Record<
    NotificationCategory,
    { label: string; className: string }
  > = {
    ALL: { label: "전체", className: "bg-slate-100 text-slate-600" },
    AUCTION: { label: "경매", className: "bg-purple-50 text-purple-600" },
    INQUIRY: { label: "문의", className: "bg-sky-50 text-sky-600" },
    PRODUCT: { label: "상품", className: "bg-emerald-50 text-emerald-600" },
    CHAT: { label: "채팅", className: "bg-amber-50 text-amber-600" },
  };

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={handleToggle}
        className="relative flex items-center justify-center w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 border border-white/30 text-white transition"
      >
        <Bell className="w-5 h-5" />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 bg-pink-500 text-white text-[10px] rounded-full min-w-[18px] h-[18px] px-1 flex items-center justify-center">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 mt-3 w-96 rounded-2xl border border-white/60 bg-white/95 text-slate-900 shadow-[0_18px_45px_rgba(15,23,42,0.32)] backdrop-blur-xl overflow-hidden">
          <div className="px-4 py-3 bg-white/95 border-b border-slate-200 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-sm font-semibold text-slate-900">알림</span>
              {unreadCount > 0 && (
                <span className="text-[11px] text-slate-400">새 알림 {unreadCount}개</span>
              )}
            </div>

            <button
              type="button"
              onClick={() => onMarkAllRead()}
              className="text-[11px] font-semibold text-slate-500 hover:text-slate-900"
            >
              모두 읽음
            </button>
          </div>

          <div className="flex text-[11px] border-b border-slate-200 bg-slate-50/80">
            {[
              { key: "ALL", label: "전체" },
              { key: "AUCTION", label: "경매" },
              { key: "INQUIRY", label: "문의" },
              { key: "PRODUCT", label: "상품" },
              { key: "CHAT", label: "채팅" },
            ].map((t) => (
              <button
                key={t.key}
                type="button"
                onClick={() => setTab(t.key as NotificationCategory)}
                className={
                  "flex-1 py-2 text-center transition-colors " +
                  (tab === t.key
                    ? "bg-purple-600 text-white font-semibold shadow-sm"
                    : "text-slate-500 hover:bg-slate-100")
                }
              >
                {t.label}
              </button>
            ))}
          </div>

          <div className="max-h-96 overflow-y-auto p-4 space-y-2 bg-white/90">
            {filtered.length === 0 && (
              <div className="py-8 text-center text-xs text-slate-400">
                표시할 알림이 없습니다.
              </div>
            )}

            {filtered.map((n) => {
              const meta = categoryMeta[n.category];
              return (
                <button
                  key={n.id}
                  type="button"
                  onClick={() => {
                    setOpen(false);
                    onClickItem(n);
                  }}
                  className={
                    "w-full text-left px-4 py-3 rounded-xl border transition flex flex-col gap-1.5 " +
                    (n.read
                      ? "bg-white hover:bg-slate-50 border-slate-100"
                      : "bg-purple-50/40 hover:bg-purple-50 border-purple-100")
                  }
                >
                  <div className="flex justify-between items-center gap-2">
                    <div className="flex items-center gap-2 min-w-0">
                      {!n.read && (
                        <span className="w-2 h-2 rounded-full bg-pink-500 flex-shrink-0" />
                      )}
                      <span className="text-sm font-semibold text-slate-900 truncate">
                        {n.title}
                      </span>
                    </div>
                    <span className="text-[11px] text-slate-400 flex-shrink-0">
                      {formatRelativeTime(n.createdAt)}
                    </span>
                  </div>

                  <div className="mt-0.5 flex justify-between items-start gap-3">
                    {n.body && (
                      <p className="text-xs text-slate-600 leading-snug flex-1">
                        {n.body}
                      </p>
                    )}
                    <span
                      className={
                        "ml-2 px-2.5 py-0.5 rounded-full text-[10px] font-medium whitespace-nowrap " +
                        meta.className
                      }
                    >
                      {meta.label}
                    </span>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

function UserMenu(props: {
  nickname: string;
  profileUrl?: string | null;
  onLogout: () => void;
}) {
  const { nickname, profileUrl, onLogout } = props;
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement | null>(null);

  useClickOutside(ref, () => setOpen(false));

  const firstLetter = !profileUrl && nickname ? nickname.charAt(0).toUpperCase() : "?";

  const handleToggle = () => setOpen((v) => !v);

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={handleToggle}
        className="flex items-center gap-2 rounded-full bg-white/5 hover:bg-white/15 border border-white/15 pl-1 pr-3 py-1 transition text-white"
      >
        <div className="w-8 h-8 rounded-full bg-slate-700 overflow-hidden flex items-center justify-center">
          {profileUrl ? (
            <img src={profileUrl} alt="profile" className="w-full h-full object-cover" />
          ) : (
            <span className="text-sm font-semibold">{firstLetter}</span>
          )}
        </div>
        <span className="text-sm font-semibold max-w-[120px] truncate">{nickname}</span>
        <ChevronDown className="w-4 h-4 text-slate-200" />
      </button>

      {open && (
        <div className="absolute right-0 mt-2 w-52 bg-white/95 text-slate-900 rounded-2xl shadow-[0_18px_45px_rgba(15,23,42,0.32)] border border-white/60 overflow-hidden backdrop-blur-xl">
          <button
            type="button"
            onClick={() => {
              setOpen(false);
              navigate("/mypage/profile");
            }}
            className="w-full text-left px-4 py-2.5 text-sm hover:bg-slate-50"
          >
            마이페이지
          </button>

          <button
            type="button"
            onClick={() => {
              setOpen(false);
              navigate("/mypage/wishlist");
            }}
            className="w-full text-left px-4 py-2.5 text-sm hover:bg-slate-50"
          >
            위시리스트
          </button>

          <button
            type="button"
            onClick={() => {
              setOpen(false);
              navigate("/mypage/bidlist");
            }}
            className="w-full text-left px-4 py-2.5 text-sm hover:bg-slate-50"
          >
            나의 경매 내역
          </button>

          <button
            type="button"
            onClick={() => {
              setOpen(false);
              navigate("/mypage/auctionlist");
            }}
            className="w-full text-left px-4 py-2.5 text-sm hover:bg-slate-50"
          >
            나의 게시물
          </button>

          <div className="border-t border-slate-200" />
          <button
            type="button"
            onClick={() => {
              setOpen(false);
              onLogout();
            }}
            className="w-full text-left px-4 py-2.5 text-sm text-red-500 hover:bg-red-50"
          >
            로그아웃
          </button>
        </div>
      )}
    </div>
  );
}

export default function AuthButtons() {
  const navigate = useNavigate();
  const { userEmail, isAuthenticated, logout, nickname, profileImageUrl } =
    useAuth() as {
      userEmail: string | null;
      isAuthenticated: boolean;
      logout: () => void;
      nickname?: string;
      profileImageUrl?: string | null;
    };

  const { unread } = useChat();
  const { notifications, unreadCount, markAsRead, markAllRead } = useNotifications();

  const unreadTotal = Object.values(unread || {}).reduce((a, b) => a + (b || 0), 0);

  const handleLogout = () => {
    logout();
    navigate("/");
  };

  const openChatListPopup = () => {
    const w = 420;
    const h = 720;
    const left = window.screenX + Math.max(0, (window.outerWidth - w) / 2);
    const top = window.screenY + Math.max(0, (window.outerHeight - h) / 2);

    const win = window.open(
      "/chat-list",
      "chat_list_popup",
      "popup=yes,width=" +
        w +
        ",height=" +
        h +
        ",left=" +
        left +
        ",top=" +
        top +
        ",resizable=yes,scrollbars=yes",
    );

    if (!win) {
      navigate("/chat-list");
      return;
    }
    win.focus();
  };

  const handleNotificationClick = async (n: NotificationItem) => {
    if (!n.read) {
      await markAsRead(n.id);
    }
    if (n.category === "INQUIRY" || n.category === "CHAT") {
      openChatListPopup();
      return;
    }

    if (n.category === "AUCTION" || n.category === "PRODUCT") {
      const productId = n.data?.productId;
      if (productId) {
        // console.log(productId)
        navigate("/auction_detail/" + productId);
        return;
      }
      navigate("/");
      return;
    }

    navigate("/");
  };

  if (!isAuthenticated) {
    return (
      <>
        <button
          type="button"
          className="text-gray-100 hover:text-white cursor-pointer"
          onClick={() => navigate("/login")}
        >
          로그인
        </button>
        <button
          type="button"
          className="bg-[rgb(118,90,255)] text-white px-6 py-2 rounded-full hover:bg-[rgb(90,58,252)] transition-colors cursor-pointer"
          onClick={() => navigate("/register")}
        >
          회원가입
        </button>
      </>
    );
  }

  const displayName = nickname || userEmail || "USER";

  return (
    <>
      <button
        type="button"
        onClick={openChatListPopup}
        className="relative flex items-center justify-center w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 border border-white/30 text-white transition"
      >
        <MessageCircle className="w-5 h-5" />
        {unreadTotal > 0 && (
          <span className="absolute -top-1 -right-1 bg-pink-500 text-white text-[10px] rounded-full min-w-[18px] h-[18px] px-1 flex items-center justify-center">
            {unreadTotal > 9 ? "9+" : unreadTotal}
          </span>
        )}
      </button>

      <NotificationMenu
        notifications={notifications}
        unreadCount={unreadCount}
        onClickItem={handleNotificationClick}
        onMarkAllRead={() => markAllRead()}
      />

      <UserMenu
        nickname={displayName}
        profileUrl={profileImageUrl}
        onLogout={handleLogout}
      />
    </>
  );
}
