import React, { useEffect, useMemo, useState } from "react";
import { ShieldCheck, UserPlus, RefreshCw } from "lucide-react";
import { useAdminStore } from "../AdminContext";
import type { AdminUserCreateReq, Authority, Gender } from "../adminTypes";

function authorityBadge(role: Authority) {
  const map: Record<Authority, string> = {
    USER: "bg-gray-50 text-gray-700 border-gray-200",
    INQUIRY: "bg-blue-50 text-blue-700 border-blue-200",
    ADMIN: "bg-violet-50 text-violet-700 border-violet-200",
  };
  return map[role] ?? "bg-gray-50 text-gray-700 border-gray-200";
}

export default function AdminUsersPage() {
  const { users, refreshUsers, createAdminUser, createInquiryUser } = useAdminStore();

  const [loading, setLoading] = useState(false);

  const [role, setRole] = useState<"ADMIN" | "INQUIRY">("INQUIRY");
  const [q, setQ] = useState("");

  const [form, setForm] = useState<AdminUserCreateReq>({
    email: "",
    name: "",
    password: "",
    gender: "M" as Gender,
    birthday: "",
    phone: "",
    address: "",
    nickname: "",
  });

  useEffect(() => {
    void (async () => {
      setLoading(true);
      try {
        await refreshUsers();
      } finally {
        setLoading(false);
      }
    })();
  }, [refreshUsers]);

  const filtered = useMemo(() => {
    const keyword = q.trim().toLowerCase();
    if (!keyword) return users;
    return users.filter((u) => {
      const a = (u.email ?? "").toLowerCase();
      const b = (u.name ?? "").toLowerCase();
      const c = (u.nickname ?? "").toLowerCase();
      return a.includes(keyword) || b.includes(keyword) || c.includes(keyword);
    });
  }, [users, q]);

  const admins = useMemo(() => filtered.filter((u) => u.authority === "ADMIN"), [filtered]);
  const inquiries = useMemo(() => filtered.filter((u) => u.authority === "INQUIRY"), [filtered]);
  const normals = useMemo(() => filtered.filter((u) => u.authority === "USER"), [filtered]);

  const onSubmit = async () => {
    const email = form.email.trim();
    const name = form.name.trim();
    const password = form.password;

    if (!email || !email.includes("@")) {
      alert("이메일을 확인해 주세요.");
      return;
    }
    if (!name) {
      alert("이름을 입력해 주세요.");
      return;
    }
    if (!password || password.length < 4) {
      alert("비밀번호를 입력해 주세요.");
      return;
    }
    if (!form.birthday.trim()) {
      alert("생년월일을 입력해 주세요. (예: 1999.01.01)");
      return;
    }
    if (!form.phone.trim()) {
      alert("전화번호를 입력해 주세요.");
      return;
    }

    setLoading(true);
    try {
      const payload: AdminUserCreateReq = {
        ...form,
        email,
        name,
        birthday: form.birthday.trim(),
        phone: form.phone.trim(),
        address: form.address?.trim() ? form.address.trim() : null,
        nickname: form.nickname?.trim() ? form.nickname.trim() : null,
      };

      if (role === "ADMIN") {
        await createAdminUser(payload);
        alert("ADMIN 계정 생성 성공");
      } else {
        await createInquiryUser(payload);
        alert("INQUIRY 계정 생성 성공");
      }

      setForm((prev) => ({
        ...prev,
        email: "",
        name: "",
        password: "",
        birthday: "",
        phone: "",
        address: "",
        nickname: "",
      }));
    } catch (e: any) {
      console.error(e);
      alert("생성 실패. 서버 응답/로그를 확인해 주세요.");
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    if (loading) return;
    setLoading(true);
    try {
      await refreshUsers();
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="bg-white border border-gray-100 rounded-2xl p-4 shadow-sm">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-xl bg-violet-600 flex items-center justify-center">
              <ShieldCheck className="w-5 h-5 text-white" />
            </div>
            <div>
              <div className="text-sm font-bold text-gray-900">유저/권한 관리</div>
              <div className="text-[11px] text-gray-500">ADMIN / INQUIRY 계정 생성 및 목록 확인</div>
            </div>
          </div>

          <button
            onClick={onRefresh}
            disabled={loading}
            className={
              "px-3 py-2 rounded-xl bg-white border border-gray-200 text-sm flex items-center gap-2 " +
              (loading ? "opacity-60 cursor-not-allowed" : "hover:bg-gray-50")
            }
          >
            <RefreshCw className={"w-4 h-4 " + (loading ? "animate-spin" : "")} />
            새로고침
          </button>
        </div>
      </div>

      <div className="bg-white border border-gray-100 rounded-2xl p-4 shadow-sm">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <UserPlus className="w-5 h-5 text-gray-700" />
            <div className="text-sm font-bold text-gray-900">계정 생성</div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setRole("INQUIRY")}
              className={
                "px-3 py-1.5 rounded-xl border text-sm " +
                (role === "INQUIRY"
                  ? "bg-blue-50 border-blue-200 text-blue-700"
                  : "bg-white border-gray-200 text-gray-700 hover:bg-gray-50")
              }
            >
              INQUIRY
            </button>
            <button
              onClick={() => setRole("ADMIN")}
              className={
                "px-3 py-1.5 rounded-xl border text-sm " +
                (role === "ADMIN"
                  ? "bg-violet-50 border-violet-200 text-violet-700"
                  : "bg-white border-gray-200 text-gray-700 hover:bg-gray-50")
              }
            >
              ADMIN
            </button>
          </div>
        </div>

        <div className="mt-3 grid grid-cols-1 md:grid-cols-2 gap-3">
          <div>
            <div className="text-[11px] text-gray-500">이메일</div>
            <input
              value={form.email}
              onChange={(e) => setForm((p) => ({ ...p, email: e.target.value }))}
              className="mt-1 w-full px-3 py-2 rounded-xl border border-gray-200 text-sm outline-none focus:ring-2 focus:ring-violet-200"
              placeholder="admin@example.com"
            />
          </div>

          <div>
            <div className="text-[11px] text-gray-500">이름</div>
            <input
              value={form.name}
              onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))}
              className="mt-1 w-full px-3 py-2 rounded-xl border border-gray-200 text-sm outline-none focus:ring-2 focus:ring-violet-200"
              placeholder="홍길동"
            />
          </div>

          <div>
            <div className="text-[11px] text-gray-500">비밀번호</div>
            <input
              type="password"
              value={form.password}
              onChange={(e) => setForm((p) => ({ ...p, password: e.target.value }))}
              className="mt-1 w-full px-3 py-2 rounded-xl border border-gray-200 text-sm outline-none focus:ring-2 focus:ring-violet-200"
              placeholder="비밀번호"
            />
          </div>

          <div>
            <div className="text-[11px] text-gray-500">성별</div>
            <select
              value={form.gender}
              onChange={(e) => setForm((p) => ({ ...p, gender: e.target.value as any }))}
              className="mt-1 w-full px-3 py-2 rounded-xl border border-gray-200 text-sm outline-none focus:ring-2 focus:ring-violet-200 bg-white"
            >
              <option value="M">남</option>
              <option value="W">여</option>
            </select>
          </div>

          <div>
            <div className="text-[11px] text-gray-500">생년월일</div>
            <input
              value={form.birthday}
              onChange={(e) => setForm((p) => ({ ...p, birthday: e.target.value }))}
              className="mt-1 w-full px-3 py-2 rounded-xl border border-gray-200 text-sm outline-none focus:ring-2 focus:ring-violet-200"
              placeholder="1999.01.01"
            />
          </div>

          <div>
            <div className="text-[11px] text-gray-500">전화번호</div>
            <input
              value={form.phone}
              onChange={(e) => setForm((p) => ({ ...p, phone: e.target.value }))}
              className="mt-1 w-full px-3 py-2 rounded-xl border border-gray-200 text-sm outline-none focus:ring-2 focus:ring-violet-200"
              placeholder="01012345678"
            />
          </div>

          <div>
            <div className="text-[11px] text-gray-500">주소 (옵션)</div>
            <input
              value={form.address ?? ""}
              onChange={(e) => setForm((p) => ({ ...p, address: e.target.value }))}
              className="mt-1 w-full px-3 py-2 rounded-xl border border-gray-200 text-sm outline-none focus:ring-2 focus:ring-violet-200"
              placeholder="서울시 ..."
            />
          </div>

          <div>
            <div className="text-[11px] text-gray-500">닉네임 (옵션)</div>
            <input
              value={form.nickname ?? ""}
              onChange={(e) => setForm((p) => ({ ...p, nickname: e.target.value }))}
              className="mt-1 w-full px-3 py-2 rounded-xl border border-gray-200 text-sm outline-none focus:ring-2 focus:ring-violet-200"
              placeholder="운영자"
            />
          </div>
        </div>

        <div className="mt-4 flex justify-end">
          <button
            onClick={onSubmit}
            disabled={loading}
            className={
              "px-4 py-2 rounded-xl text-sm font-semibold text-white bg-violet-600 " +
              (loading ? "opacity-60 cursor-not-allowed" : "hover:bg-violet-700")
            }
          >
            생성
          </button>
        </div>
      </div>

      <div className="bg-white border border-gray-100 rounded-2xl p-4 shadow-sm">
        <div className="flex items-center justify-between gap-3">
          <div className="text-sm font-bold text-gray-900">계정 목록</div>
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            className="px-3 py-2 rounded-xl border border-gray-200 text-sm outline-none focus:ring-2 focus:ring-violet-200 w-[320px]"
            placeholder="검색 (이메일/이름/닉네임)"
          />
        </div>

        <div className="mt-3 grid grid-cols-1 md:grid-cols-3 gap-3">
          <div className="p-3 rounded-xl bg-gray-50 border border-gray-100">
            <div className="text-[11px] text-gray-500">ADMIN</div>
            <div className="text-xl font-bold text-gray-900">{admins.length.toLocaleString()}</div>
          </div>
          <div className="p-3 rounded-xl bg-gray-50 border border-gray-100">
            <div className="text-[11px] text-gray-500">INQUIRY</div>
            <div className="text-xl font-bold text-gray-900">{inquiries.length.toLocaleString()}</div>
          </div>
          <div className="p-3 rounded-xl bg-gray-50 border border-gray-100">
            <div className="text-[11px] text-gray-500">USER</div>
            <div className="text-xl font-bold text-gray-900">{normals.length.toLocaleString()}</div>
          </div>
        </div>

        <div className="mt-4 overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-[11px] text-gray-500 border-b">
                <th className="py-2 pr-3">ID</th>
                <th className="py-2 pr-3">권한</th>
                <th className="py-2 pr-3">이메일</th>
                <th className="py-2 pr-3">이름</th>
                <th className="py-2 pr-3">닉네임</th>
                <th className="py-2 pr-3">전화</th>
                <th className="py-2 pr-3">상태</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((u) => {
                const roleCls = authorityBadge(u.authority);
                const suspended = Boolean(u.suspendedUntil);
                const viewOnly = Boolean(u.viewOnly);

                return (
                  <tr key={u.userId} className="border-b">
                    <td className="py-2 pr-3 text-gray-700">{u.userId}</td>
                    <td className="py-2 pr-3">
                      <span className={"inline-flex items-center px-2 py-0.5 rounded-full border text-[11px] " + roleCls}>
                        {u.authority}
                      </span>
                    </td>
                    <td className="py-2 pr-3 text-gray-900">{u.email}</td>
                    <td className="py-2 pr-3 text-gray-900">{u.name}</td>
                    <td className="py-2 pr-3 text-gray-700">{u.nickname ?? "-"}</td>
                    <td className="py-2 pr-3 text-gray-700">{u.phone ?? "-"}</td>
                    <td className="py-2 pr-3">
                      <div className="flex flex-wrap gap-2">
                        {viewOnly ? (
                          <span className="inline-flex items-center px-2 py-0.5 rounded-full border text-[11px] bg-orange-50 text-orange-700 border-orange-200">
                            VIEW_ONLY
                          </span>
                        ) : null}
                        {suspended ? (
                          <span className="inline-flex items-center px-2 py-0.5 rounded-full border text-[11px] bg-red-50 text-red-700 border-red-200">
                            SUSPENDED
                          </span>
                        ) : null}
                        {!viewOnly && !suspended ? (
                          <span className="inline-flex items-center px-2 py-0.5 rounded-full border text-[11px] bg-green-50 text-green-700 border-green-200">
                            OK
                          </span>
                        ) : null}
                      </div>
                    </td>
                  </tr>
                );
              })}

              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-6 text-center text-gray-500">
                    목록이 없습니다.
                  </td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
