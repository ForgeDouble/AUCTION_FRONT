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
  if (createdAt.indexOf("전") >= 0 || createdAt.indexOf("방금") >= 0) return createdAt;

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

function IconBadge(props: { count: number }) {
  const { count } = props;
  if (count <= 0) return null;
  return (
    <span className="absolute -top-1 -right-1 bg-violet-600 text-white text-[10px] rounded-full min-w-[18px] h-[18px] px-1 flex items-center justify-center shadow-sm">
      {count > 9 ? "9+" : count}
    </span>
  );
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

  const categoryMeta: Record<NotificationCategory, { label: string; className: string }> = {
    ALL: { label: "전체", className: "bg-slate-100 text-slate-700" },
    AUCTION: { label: "경매", className: "bg-violet-50 text-violet-700" },
    INQUIRY: { label: "문의", className: "bg-sky-50 text-sky-700" },
    PRODUCT: { label: "상품", className: "bg-emerald-50 text-emerald-700" },
    CHAT: { label: "채팅", className: "bg-amber-50 text-amber-700" },
  };

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="relative w-9 h-9 rounded-full grid place-items-center text-slate-700 hover:bg-black/5 active:scale-[0.98] transition"
        aria-label="알림"
      >
        <Bell className="w-5 h-5" />
        <IconBadge count={unreadCount} />
      </button>

      {open && (
        <div className="absolute right-0 mt-3 w-[420px] rounded-2xl border border-slate-200 bg-white shadow-xl overflow-hidden z-50">
          <div className="px-4 py-3 border-b border-slate-200 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-sm font-semibold text-slate-900">알림</span>
              {unreadCount > 0 && (
                <span className="text-[11px] text-slate-500">새 알림 {unreadCount}개</span>
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

          <div className="px-4 py-3 border-b border-slate-200">
            <div className="inline-flex p-1 rounded-xl bg-slate-100">
              {[
                { key: "ALL", label: "전체" },
                { key: "AUCTION", label: "경매" },
                { key: "INQUIRY", label: "문의" },
                { key: "PRODUCT", label: "상품" },
                { key: "CHAT", label: "채팅" },
              ].map((t) => {
                const active = tab === t.key;
                return (
                  <button
                    key={t.key}
                    type="button"
                    onClick={() => setTab(t.key as NotificationCategory)}
                    className={
                      "px-3 py-1.5 text-xs rounded-lg transition font-semibold " +
                      (active
                        ? "bg-white text-slate-900 shadow-sm"
                        : "text-slate-600 hover:text-slate-900")
                    }
                  >
                    {t.label}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="max-h-96 overflow-y-auto p-3 space-y-2">
            {filtered.length === 0 && (
              <div className="py-10 text-center text-xs text-slate-400">
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
                      ? "bg-white hover:bg-slate-50 border-slate-200"
                      : "bg-violet-50/40 hover:bg-violet-50 border-violet-100")
                  }
                >
                  <div className="flex justify-between items-center gap-2">
                    <div className="flex items-center gap-2 min-w-0">
                      {!n.read && (
                        <span className="w-2 h-2 rounded-full bg-violet-600 flex-shrink-0" />
                      )}
                      <span className="text-sm font-semibold text-slate-900 truncate">
                        {n.title}
                      </span>
                    </div>
                    <span className="text-[11px] text-slate-500 flex-shrink-0">
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
                        "ml-2 px-2.5 py-0.5 rounded-full text-[10px] font-semibold whitespace-nowrap " +
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

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex items-center gap-2 pl-1 pr-2 h-9 rounded-full hover:bg-black/5 active:scale-[0.99] transition"
        aria-label="유저 메뉴"
      >
        <div className="w-7 h-7 rounded-full bg-slate-200 overflow-hidden flex items-center justify-center">
          {profileUrl ? (
            <img src={profileUrl} alt="profile" className="w-full h-full object-cover" />
          ) : (
            <span className="text-xs font-bold text-slate-700">{firstLetter}</span>
          )}
        </div>

        <span className="text-sm font-semibold text-slate-800 max-w-[120px] truncate">
          {nickname}
        </span>
        <ChevronDown className="w-4 h-4 text-slate-500" />
      </button>

      {open && (
        <div className="absolute right-0 mt-2 w-56 bg-white text-slate-900 rounded-2xl shadow-xl border border-slate-200 overflow-hidden z-50">
          <button
            type="button"
            onClick={() => {
              setOpen(false);
              navigate("/mypage/profile");
            }}
            className="w-full text-left px-4 py-3 text-sm hover:bg-slate-50"
          >
            마이페이지
          </button>

          <button
            type="button"
            onClick={() => {
              setOpen(false);
              navigate("/mypage/wishlist");
            }}
            className="w-full text-left px-4 py-3 text-sm hover:bg-slate-50"
          >
            위시리스트
          </button>

          <button
            type="button"
            onClick={() => {
              setOpen(false);
              navigate("/mypage/bidlist");
            }}
            className="w-full text-left px-4 py-3 text-sm hover:bg-slate-50"
          >
            나의 경매 내역
          </button>

          <button
            type="button"
            onClick={() => {
              setOpen(false);
              navigate("/mypage/auctionlist");
            }}
            className="w-full text-left px-4 py-3 text-sm hover:bg-slate-50"
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
            className="w-full text-left px-4 py-3 text-sm text-rose-600 hover:bg-rose-50 font-semibold"
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
    if (!n.read) await markAsRead(n.id);

    if (n.category === "INQUIRY" || n.category === "CHAT") {
      openChatListPopup();
      return;
    }

    if (n.category === "AUCTION" || n.category === "PRODUCT") {
      const productId = n.data?.productId;
      if (productId) {
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
      <div className="flex items-center gap-2">
        <button
          type="button"
          className="h-9 px-3 rounded-full text-slate-700 hover:bg-slate-50 font-semibold transition"
          onClick={() => navigate("/login")}
        >
          로그인
        </button>

        <button
          type="button"
          className="h-9 px-4 rounded-full bg-violet-600 text-white hover:bg-violet-700 font-semibold shadow-sm transition"
          onClick={() => navigate("/register")}
        >
          회원가입
        </button>
      </div>
    );
  }

  const displayName = nickname || userEmail || "USER";

  return (
    <div className="flex items-center gap-1.5">
      <button
        type="button"
        onClick={openChatListPopup}
        className="relative w-9 h-9 rounded-full grid place-items-center text-slate-700 hover:bg-black/5 active:scale-[0.98] transition"
        aria-label="채팅"
      >
        <MessageCircle className="w-5 h-5" />
        <IconBadge count={unreadTotal} />
      </button>

      <NotificationMenu
        notifications={notifications}
        unreadCount={unreadCount}
        onClickItem={handleNotificationClick}
        onMarkAllRead={() => markAllRead()}
      />

      <div className="w-px h-5 bg-black/5 mx-1" />

      <UserMenu
        nickname={displayName}
        profileUrl={profileImageUrl}
        onLogout={handleLogout}
      />
    </div>
  );
}
