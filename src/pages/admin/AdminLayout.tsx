// src/pages/admin/AdminLayout.tsx
import React, { useEffect, useState, useMemo } from "react";
import { NavLink, Outlet, Link, useLocation, useNavigate } from "react-router-dom";
import AdminSettingsModal from "./components/AdminSettingsModal";
import {
  Activity,
  CalendarDays,
  LayoutDashboard,
  LogOut,
  Megaphone,
  RefreshCw,
  Search,
  Settings,
  ShieldCheck,
  Siren,
  Users,
  Gavel,
  UserCircle2,
  Home,
  Clock,
  MessagesSquare,
} from "lucide-react";
import { useAdminStore } from "./AdminContext";
import { useAuth } from "@/hooks/useAuth";
import { useModal } from "@/contexts/ModalContext";
import { applyUiError } from "@/hooks/applyUiError";

function formatKST(iso: string): string {
  const d = new Date(iso);
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  const hh = String(d.getHours()).padStart(2, "0");
  const mi = String(d.getMinutes()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd} ${hh}:${mi}`;
}

function safeJwtRemainingSeconds(): number {
  const token = localStorage.getItem("accessToken");
  if (!token) return 0;

  const parts = token.split(".");
  if (parts.length < 2) return 0;

  try {
    const base64 = parts[1].replace(/-/g, "+").replace(/_/g, "/");
    const padded = base64.padEnd(base64.length + (4 - (base64.length % 4)) % 4, "=");
    const json = decodeURIComponent(
      Array.from(atob(padded))
        .map((c) => "%" + c.charCodeAt(0).toString(16).padStart(2, "0"))
        .join("")
    );

    const payload = JSON.parse(json) as { exp?: number };
    const expSec = Number(payload.exp ?? 0);
    if (!Number.isFinite(expSec) || expSec <= 0) return 0;

    const nowSec = Math.floor(Date.now() / 1000);
    return Math.max(0, expSec - nowSec);
  } catch {
    return 0;
  }
}

function formatRemain(sec: number): string {
  if (!Number.isFinite(sec) || sec <= 0) return "만료됨";

  const h = Math.floor(sec / 3600);
  const m = Math.floor((sec % 3600) / 60);
  const s = sec % 60;

  if (h > 0) return `로그아웃까지 ${h}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
  return `로그아웃까지 ${m}:${String(s).padStart(2, "0")}`;
}

const SideItem: React.FC<{
  to: string;
  icon: React.ElementType;
  label: string;
  badge?: number;
  disabled?: boolean;
  disabledHint?: string;
  end?: boolean;
}> = ({ to, icon: Icon, label, badge, disabled, disabledHint, end }) => {
  if (disabled) {
    return (
      <div
        className="w-full flex items-center justify-between gap-2 px-3 py-2 rounded-lg text-sm text-gray-400 bg-gray-50 cursor-not-allowed"
        title={disabledHint ?? "권한이 없습니다."}
        aria-disabled="true"
      >
        <span className="flex items-center gap-2 min-w-0">
          <Icon className="w-4 h-4 shrink-0" />
          <span className="font-medium truncate">{label}</span>
        </span>

        {typeof badge === "number" && badge > 0 && (
          <span className="text-xs px-2 py-0.5 rounded-full bg-gray-200 text-gray-500 shrink-0">{badge}</span>
        )}
      </div>
    );
  }

  return (
    <NavLink
      to={to}
       end={end}
      className={({ isActive }) =>
        "w-full flex items-center justify-between gap-2 px-3 py-2 rounded-lg text-sm transition " +
        (isActive ? "bg-[rgb(118,90,255)] text-white" : "text-gray-700 hover:bg-gray-100")
      }
    >
      <span className="flex items-center gap-2 min-w-0">
        <Icon className="w-4 h-4 shrink-0" />
        <span className="font-medium truncate">{label}</span>
      </span>

      {typeof badge === "number" && badge > 0 && (
        <span className="text-xs px-2 py-0.5 rounded-full bg-pink-600 text-white shrink-0">{badge}</span>
      )}
    </NavLink>
  );
};

const AdminLayout: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { logout } = useAuth();
  const { showError, showWarning, showLogin } = useModal();

  const uiDeps = useMemo(() => {
    const fallback = "요청 처리 중 오류가 발생했습니다. 잠시 후 다시 시도해 주세요.";
    return {
      showLogin: (mode?: "navigation" | "confirm") => showLogin(mode ?? "confirm"),
      showWarning: (msg: string) => showWarning(msg),
      showError: (msg?: string) => showError(msg ?? fallback),
      logout: () => logout(),
      navigate: (to: string) => navigate(to),
    };
  }, [showError, showWarning, showLogin, logout, navigate]);

  const [loggingOut, setLoggingOut] = useState(false);

  const onLogout = async () => {
    if (loggingOut) return;

    const ok = window.confirm("로그아웃 하시겠습니까?");
    if (!ok) return;

    setLoggingOut(true);
    try {
      await logout();
    } catch (e) {
      applyUiError(e, uiDeps);
    } finally {
      localStorage.removeItem("accessToken");

      navigate("/", { replace: true });

      setLoggingOut(false);
    }
  };
  const {
    adminEmail,
    adminNick,
    adminRole,
    query,
    setQuery,
    lastUpdatedAt,
    refreshAll,
    stats,
    noticesCount,
    reportsOpenCount,
    extendAdminSession,
    chatUnreadTotal,
    profileImageUrl,
    setProfileImageUrl,
    notifEnabled,
    setNotifEnabled,
    birthdayOpen,
    setBirthdayOpen,
    setAdminNick,
    refreshEvents,
  } = useAdminStore();

  const [refreshing, setRefreshing] = useState(false);
  const [extending, setExtending] = useState(false);
  const [remainSec, setRemainSec] = useState<number>(() => safeJwtRemainingSeconds());

  const roleUpper = String(adminRole ?? "").toUpperCase();
  const isAdminOnly = roleUpper.includes("ADMIN");
  const [settingsOpen, setSettingsOpen] = useState(false);

  useEffect(() => {
    const tick = () => setRemainSec(safeJwtRemainingSeconds());
    tick();
    const id = window.setInterval(tick, 1000);

    const onStorage = (e: StorageEvent) => {
      if (e.key === "accessToken") tick();
    };
    window.addEventListener("storage", onStorage);

    return () => {
      window.clearInterval(id);
      window.removeEventListener("storage", onStorage);
    };
  }, []);

  const onRefresh = async () => {
    if (refreshing) return;
    setRefreshing(true);
    try {
      await refreshAll();
    } finally {
      setRefreshing(false);
    }
  };

  const onExtend = async () => {
    if (extending) return;
    setExtending(true);
    try {
      await extendAdminSession();
      setRemainSec(safeJwtRemainingSeconds());
    } catch (e) {
      console.error(e);
      alert("로그인 연장에 실패했습니다. 다시 시도해주세요.");
    } finally {
      setExtending(false);
    }
  };

  const goChats = () => {
    if (location.pathname.startsWith("/admin/chats")) return;
    navigate("/admin/chats");
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="sticky top-0 z-20 bg-white border-b border-gray-200">
        <div className="max-w-[1600px] mx-auto px-4 py-3 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-[rgb(118,90,255)] flex items-center justify-center">
              <ShieldCheck className="w-5 h-5 text-white" />
            </div>

            <Link
              to="/"
              className="w-9 h-9 rounded-xl border border-gray-200 hover:bg-gray-50 flex items-center justify-center"
              title="사용자 페이지로 이동"
            >
              <Home className="w-5 h-5 text-gray-700" />
            </Link>

            <div>
              <div className="text-sm font-bold text-gray-900">경매 관리자</div>
              <div className="text-[11px] text-gray-500">실시간 모니터링 / 신고 / 운영 일정 / 채팅</div>
            </div>
          </div>

          <div className="flex-1 flex items-center gap-2 max-w-[720px]">
            <div className="flex items-center gap-2 bg-gray-100 rounded-xl px-3 py-2 w-full">
              <Search className="w-4 h-4 text-gray-500" />
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="검색 (경매/신고/공지/일정)"
                className="bg-transparent outline-none text-sm text-gray-800 w-full"
              />
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={goChats}
              className="relative px-3 py-2 rounded-xl bg-white border border-gray-200 text-sm flex items-center gap-2 hover:bg-gray-50"
              title="운영 채팅"
            >
              <MessagesSquare className="w-4 h-4 text-gray-700" />
              <span className="hidden md:inline">채팅</span>
              {chatUnreadTotal > 0 && (
                <span className="absolute -top-2 -right-2 text-[10px] px-2 py-0.5 rounded-full bg-pink-600 text-white">
                  {chatUnreadTotal}
                </span>
              )}
            </button>

            <button
              onClick={onExtend}
              disabled={extending}
              className={
                "px-3 py-2 rounded-xl bg-white border border-gray-200 text-sm flex items-center gap-2 " +
                (extending ? "opacity-60 cursor-not-allowed" : "hover:bg-gray-50")
              }
              title="로그인 연장"
            >
              <Clock className={"w-4 h-4 text-gray-700 " + (extending ? "animate-spin" : "")} />
              <span className="hidden md:inline w-[60px] text-center">{extending ? "연장중" : "연장"}</span>
            </button>

            <button
              onClick={onRefresh}
              disabled={refreshing}
              className={
                "px-3 py-2 rounded-xl bg-white border border-gray-200 text-sm flex items-center gap-2 " +
                (refreshing ? "opacity-60 cursor-not-allowed" : "hover:bg-gray-50")
              }
              title="새로고침"
            >
              <RefreshCw className={"w-4 h-4 text-gray-700 " + (refreshing ? "animate-spin" : "")} />
              <span className="hidden md:inline w-[60px] text-center">{refreshing ? "Refreshing" : "Refresh"}</span>
            </button>

            <div className="flex items-center gap-2 pl-2 border-l border-gray-200">
              <div className="w-9 h-9 rounded-full bg-gray-100 flex items-center justify-center overflow-hidden">
                {profileImageUrl ? (
                  <img src={profileImageUrl} alt="profile" className="w-full h-full object-cover" />
                ) : (
                  <UserCircle2 className="w-6 h-6 text-gray-600" />
                )}
              </div>
              <div className="hidden md:block leading-tight">
                <div className="text-xs font-semibold text-gray-900">{adminNick}</div>
                <div className="text-[11px] text-gray-500">{adminRole}</div>
              </div>
            </div>
          </div>
        </div>

        <div className="max-w-[1600px] mx-auto px-4 pb-2 flex items-center justify-between">
          <div className="text-[11px] text-gray-500">Last updated: {formatKST(lastUpdatedAt)}</div>
          <div className="flex items-center gap-1 text-[11px] text-black-600">
            <Clock className="w-3.5 h-3.5" />
            <span>{formatRemain(remainSec)}</span>
          </div>
        </div>
      </div>

      <div className="max-w-[1600px] mx-auto px-4 py-4 grid grid-cols-1 lg:grid-cols-[280px_1fr] gap-4">
        <div className="bg-white border border-gray-100 rounded-2xl p-3 shadow-sm h-fit">
          <div className="flex items-center gap-3 p-2 rounded-xl bg-gray-50 border border-gray-100">
            <div className="w-10 h-10 rounded-xl bg-[rgb(118,90,255)] flex items-center justify-center">
              <UserCircle2 className="w-6 h-6 text-white" />
            </div>
            <div className="min-w-0">
              <div className="text-sm font-bold text-gray-900 truncate">{adminNick}</div>
              <div className="text-[11px] text-gray-500 truncate">{adminEmail}</div>
              <div className="text-[11px] text-gray-500">Role: {adminRole}</div>
            </div>
          </div>

          <div className="mt-3 space-y-1">
            <SideItem to="/admin" icon={LayoutDashboard} label="개요" end />
            <SideItem to="/admin/auctions" icon={Gavel} label="경매 모니터링" />
            <SideItem
              to="/admin/reports"
              icon={Siren}
              label="신고 관리"
              badge={reportsOpenCount}
              disabled={!isAdminOnly}
              disabledHint="ADMIN만 접근 가능합니다."
            />
            <SideItem to="/admin/calendar" icon={CalendarDays} label="운영 캘린더" />
            <SideItem to="/admin/notices" icon={Megaphone} label="인수인계/공지" badge={noticesCount} />
            <SideItem to="/admin/chats" icon={MessagesSquare} label="운영 채팅" badge={chatUnreadTotal} />
            <SideItem to="/admin/users" icon={Users} label="유저/권한 관리" disabled={!isAdminOnly} disabledHint="ADMIN만 접근 가능합니다." />

            <NavLink
              to="/"
              className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-gray-700 hover:bg-gray-100 transition"
              title="사용자 페이지로 이동"
            >
              <Home className="w-4 h-4" />
              <span className="font-medium">경매사이트 이동</span>
            </NavLink>
          </div>

          <div className="mt-3 pt-3 border-t border-gray-100 flex items-center gap-2">
            <button
              onClick={() => setSettingsOpen(true)}
              className="flex-1 px-3 py-2 rounded-xl border border-gray-200 hover:bg-gray-50 text-sm flex items-center justify-center gap-2"
            >
              <Settings className="w-4 h-4" />
              설정
            </button>
            <button
              onClick={onLogout}
              disabled={loggingOut}
              className={
                "flex-1 px-3 py-2 rounded-xl border border-gray-200 text-sm flex items-center justify-center gap-2 " +
                (loggingOut ? "opacity-60 cursor-not-allowed" : "hover:bg-gray-50")
              }
            >
              <LogOut className="w-4 h-4" />
              {loggingOut ? "로그아웃 중" : "로그아웃"}
            </button>
          </div>

          <div className="mt-3 p-3 rounded-xl bg-[rgb(248,247,255)] border border-[rgb(248,247,255)]">
            <div className="text-xs font-semibold text-[rgb(77,58,166)]">운영 체크</div>
            <div className="mt-2 grid grid-cols-2 gap-2 text-[11px] text-[rgb(77,58,166)]">
              <div className="flex items-center gap-2">
                <Activity className="w-4 h-4" />
                <span>실시간: {stats.realtimeUsers.toLocaleString()}</span>
              </div>
              <div className="flex items-center gap-2">
                <Users className="w-4 h-4" />
                <span>금일: {stats.todayActiveUsers.toLocaleString()}</span>
              </div>
            </div>
          </div>
        </div>

        <Outlet />
      </div>

      <AdminSettingsModal
        open={settingsOpen}
        onClose={() => setSettingsOpen(false)}
        adminEmail={adminEmail}
        adminNick={adminNick}
        setAdminNick={setAdminNick}
        profileImageUrl={profileImageUrl}
        setProfileImageUrl={setProfileImageUrl}
        notifEnabled={notifEnabled}
        setNotifEnabled={setNotifEnabled}
        birthdayOpen={birthdayOpen}
        setBirthdayOpen={setBirthdayOpen}
        refreshEvents={refreshEvents}
      />
    </div>
  );
};

export default AdminLayout;
