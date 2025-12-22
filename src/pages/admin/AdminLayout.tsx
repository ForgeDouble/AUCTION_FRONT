import React from "react";
import { NavLink, Outlet, Link } from "react-router-dom";
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
} from "lucide-react";
import { useAdminStore } from "./AdminContext";

function formatKST(iso: string): string {
  const d = new Date(iso);
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  const hh = String(d.getHours()).padStart(2, "0");
  const mi = String(d.getMinutes()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd} ${hh}:${mi}`;
}

const SideItem: React.FC<{ to: string; icon: React.ElementType; label: string; badge?: number }> = ({
  to,
  icon: Icon,
  label,
  badge,
}) => {
  return (
    <NavLink
      to={to}
      className={({ isActive }) =>
        "w-full flex items-center justify-between gap-2 px-3 py-2 rounded-lg text-sm transition " +
        (isActive ? "bg-violet-600 text-white" : "text-gray-700 hover:bg-gray-100")
      }
    >
      <span className="flex items-center gap-2">
        <Icon className="w-4 h-4" />
        <span className="font-medium">{label}</span>
      </span>
      {typeof badge === "number" && badge > 0 && (
        <span className="text-xs px-2 py-0.5 rounded-full bg-pink-600 text-white">{badge}</span>
      )}
    </NavLink>
  );
};

const AdminLayout: React.FC = () => {
  const {
    adminEmail,
    adminNick,
    adminRole,
    query,
    setQuery,
    lastUpdatedAt,
    refreshAll,
    stats,
    pendingNoticesCount,
    reportsOpenCount,
  } = useAdminStore();

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Top */}
      <div className="sticky top-0 z-20 bg-white border-b border-gray-200">
        <div className="max-w-[1600px] mx-auto px-4 py-3 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-violet-600 flex items-center justify-center">
              <ShieldCheck className="w-5 h-5 text-white" />
            </div>

            {/* ✅ 루트(/) 이동 아이콘 */}
            <Link
              to="/"
              className="w-9 h-9 rounded-xl border border-gray-200 hover:bg-gray-50 flex items-center justify-center"
              title="사용자 페이지로 이동"
            >
              <Home className="w-5 h-5 text-gray-700" />
            </Link>

            <div>
              <div className="text-sm font-bold text-gray-900">경매 관리자</div>
              <div className="text-[11px] text-gray-500">실시간 모니터링 / 신고 / 운영 일정</div>
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
              onClick={refreshAll}
              className="px-3 py-2 rounded-xl bg-white border border-gray-200 hover:bg-gray-50 text-sm flex items-center gap-2"
              title="새로고침"
            >
              <RefreshCw className="w-4 h-4 text-gray-700" />
              <span className="hidden md:inline">Refresh</span>
            </button>

            <div className="flex items-center gap-2 pl-2 border-l border-gray-200">
              <div className="w-9 h-9 rounded-full bg-gray-100 flex items-center justify-center overflow-hidden">
                <UserCircle2 className="w-6 h-6 text-gray-600" />
              </div>
              <div className="hidden md:block leading-tight">
                <div className="text-xs font-semibold text-gray-900">{adminNick}</div>
                <div className="text-[11px] text-gray-500">{adminRole}</div>
              </div>
            </div>
          </div>
        </div>

        <div className="max-w-[1600px] mx-auto px-4 pb-2">
          <div className="text-[11px] text-gray-500">Last updated: {formatKST(lastUpdatedAt)}</div>
        </div>
      </div>

      {/* Body */}
      <div className="max-w-[1600px] mx-auto px-4 py-4 grid grid-cols-1 lg:grid-cols-[280px_1fr] gap-4">
        {/* Sidebar */}
        <div className="bg-white border border-gray-100 rounded-2xl p-3 shadow-sm h-fit">
          <div className="flex items-center gap-3 p-2 rounded-xl bg-gray-50 border border-gray-100">
            <div className="w-10 h-10 rounded-xl bg-violet-600 flex items-center justify-center">
              <UserCircle2 className="w-6 h-6 text-white" />
            </div>
            <div className="min-w-0">
              <div className="text-sm font-bold text-gray-900 truncate">{adminNick}</div>
              <div className="text-[11px] text-gray-500 truncate">{adminEmail}</div>
              <div className="text-[11px] text-gray-500">Role: {adminRole}</div>
            </div>
          </div>

          <div className="mt-3 space-y-1">
            {/* ✅ 사이드바에서도 / 이동 */}
            <NavLink
              to="/"
              className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-gray-700 hover:bg-gray-100 transition"
              title="사용자 페이지로 이동"
            >
              <Home className="w-4 h-4" />
              <span className="font-medium">홈으로</span>
            </NavLink>

            <SideItem to="/admin" icon={LayoutDashboard} label="개요" />
            <SideItem to="/admin/auctions" icon={Gavel} label="경매 모니터링" />
            <SideItem to="/admin/reports" icon={Siren} label="신고 관리" badge={reportsOpenCount} />
            <SideItem to="/admin/calendar" icon={CalendarDays} label="운영 캘린더" />
            <SideItem to="/admin/notices" icon={Megaphone} label="인수인계/공지" badge={pendingNoticesCount} />
          </div>

          <div className="mt-3 pt-3 border-t border-gray-100 flex items-center gap-2">
            <button className="flex-1 px-3 py-2 rounded-xl border border-gray-200 hover:bg-gray-50 text-sm flex items-center justify-center gap-2">
              <Settings className="w-4 h-4" />
              설정
            </button>
            <button className="flex-1 px-3 py-2 rounded-xl border border-gray-200 hover:bg-gray-50 text-sm flex items-center justify-center gap-2">
              <LogOut className="w-4 h-4" />
              로그아웃
            </button>
          </div>

          <div className="mt-3 p-3 rounded-xl bg-violet-50 border border-violet-100">
            <div className="text-xs font-semibold text-violet-900">운영 체크</div>
            <div className="mt-2 grid grid-cols-2 gap-2 text-[11px] text-violet-900">
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

        {/* Main outlet */}
        <Outlet />
      </div>
    </div>
  );
};

export default AdminLayout;
