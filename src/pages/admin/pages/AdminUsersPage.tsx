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

function onlyDigits(s: string) {
  return (s ?? "").replace(/\D/g, "");
}

type Field = keyof AdminUserCreateReq;
type Errors = Partial<Record<Field, string>>;

function validate(v: AdminUserCreateReq): Errors {
  const e: Errors = {};
  const email = (v.email ?? "").trim();
  const name = (v.name ?? "").trim();
  const pw = v.password ?? "";

  const phone = onlyDigits(v.phone ?? "");
  const birthday = onlyDigits(v.birthday ?? "");

  if (!email) e.email = "필수 입력값입니다.";
  else if (!email.includes("@")) e.email = "이메일 형식이 올바르지 않습니다.";

  if (!name) e.name = "필수 입력값입니다.";
  if (!pw) e.password = "필수 입력값입니다.";
  else if (pw.length < 4) e.password = "비밀번호는 4자 이상 입력해 주세요.";

  // phone: 010xxxxxxxx (11자리 기준)
  if (!phone) e.phone = "필수 입력값입니다.";
  else if (phone.length !== 11) e.phone = "전화번호는 11자리(010xxxxxxxx)로 입력해 주세요.";

  // birthday: yyyymmdd (8자리)
  if (!birthday) e.birthday = "필수 입력값입니다.";
  else if (birthday.length !== 8) e.birthday = "생년월일은 8자리(yyyymmdd)로 입력해 주세요.";

  // gender는 select 기본값이 있으니 보통 필요 없지만, 혹시 비었을 때만
  if (!v.gender) e.gender = "필수 입력값입니다.";

  return e;
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
    birthday: "", // yyyymmdd
    phone: "", // 010xxxxxxxx
    address: "",
    nickname: "",
  });

  const [touched, setTouched] = useState<Partial<Record<Field, boolean>>>({});
  const [submitTried, setSubmitTried] = useState(false);

  const errors = useMemo(() => validate(form), [form]);

  const showError = (f: Field) => (submitTried || touched[f]) && errors[f];

  const markTouched = (f: Field) => setTouched((p) => ({ ...p, [f]: true }));

  const inputBase =
    "mt-1 w-full px-3 py-2 rounded-xl border text-sm outline-none bg-white " +
    "placeholder:text-gray-300 placeholder:opacity-70 " +
    "focus:ring-2";

  const inputClass = (hasErr: boolean) =>
    inputBase +
    (hasErr
      ? " border-red-300 focus:ring-red-200"
      : " border-gray-200 focus:ring-violet-200");

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

  // phone split
  const phoneDigits = onlyDigits(form.phone);
  const p1 = phoneDigits.slice(0, 3);
  const p2 = phoneDigits.slice(3, 7);
  const p3 = phoneDigits.slice(7, 11);

  const setPhoneParts = (n1: string, n2: string, n3: string) => {
    const next = (onlyDigits(n1).slice(0, 3) + onlyDigits(n2).slice(0, 4) + onlyDigits(n3).slice(0, 4)).slice(0, 11);
    setForm((prev) => ({ ...prev, phone: next }));
  };

  // birthday split
  const birthDigits = onlyDigits(form.birthday);
  const by = birthDigits.slice(0, 4);
  const bm = birthDigits.slice(4, 6);
  const bd = birthDigits.slice(6, 8);

  const setBirthParts = (y: string, m: string, d: string) => {
    const yy = onlyDigits(y).slice(0, 4);
    const mm = onlyDigits(m).slice(0, 2);
    const dd = onlyDigits(d).slice(0, 2);
    setForm((prev) => ({ ...prev, birthday: (yy + mm + dd).slice(0, 8) }));
  };

  const onSubmit = async () => {
    setSubmitTried(true);

    const hasErr = Object.keys(errors).length > 0;
    if (hasErr) return;

    setLoading(true);
    try {
      const payload: AdminUserCreateReq = {
        ...form,
        email: form.email.trim(),
        name: form.name.trim(),
        phone: onlyDigits(form.phone),
        birthday: onlyDigits(form.birthday),
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

      setForm({
        email: "",
        name: "",
        password: "",
        gender: "M" as Gender,
        birthday: "",
        phone: "",
        address: "",
        nickname: "",
      });
      setTouched({});
      setSubmitTried(false);
    } catch (e) {
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
              onBlur={() => markTouched("email")}
              onChange={(e) => setForm((p) => ({ ...p, email: e.target.value }))}
              className={inputClass(Boolean(showError("email")))}
              placeholder="admin@example.com"
            />
            {showError("email") ? <div className="mt-1 text-[11px] text-red-600">{errors.email}</div> : null}
          </div>

          <div>
            <div className="text-[11px] text-gray-500">이름</div>
            <input
              value={form.name}
              onBlur={() => markTouched("name")}
              onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))}
              className={inputClass(Boolean(showError("name")))}
              placeholder="홍길동"
            />
            {showError("name") ? <div className="mt-1 text-[11px] text-red-600">{errors.name}</div> : null}
          </div>

          <div>
            <div className="text-[11px] text-gray-500">비밀번호</div>
            <input
              type="password"
              value={form.password}
              onBlur={() => markTouched("password")}
              onChange={(e) => setForm((p) => ({ ...p, password: e.target.value }))}
              className={inputClass(Boolean(showError("password")))}
              placeholder="비밀번호"
            />
            {showError("password") ? <div className="mt-1 text-[11px] text-red-600">{errors.password}</div> : null}
          </div>

          <div>
            <div className="text-[11px] text-gray-500">성별</div>
            <select
              value={form.gender}
              onBlur={() => markTouched("gender")}
              onChange={(e) => setForm((p) => ({ ...p, gender: e.target.value as any }))}
              className={inputClass(Boolean(showError("gender"))) + " bg-white"}
            >
              <option value="M">남</option>
              <option value="W">여</option>
            </select>
            {showError("gender") ? <div className="mt-1 text-[11px] text-red-600">{errors.gender}</div> : null}
          </div>

          <div>
            <div className="text-[11px] text-gray-500">생년월일</div>
            <div className="mt-1 flex items-center gap-2">
              <input
                value={by}
                onBlur={() => markTouched("birthday")}
                onChange={(e) => setBirthParts(e.target.value, bm, bd)}
                className={inputClass(Boolean(showError("birthday")))}
                placeholder="YYYY"
              />
              <input
                value={bm}
                onBlur={() => markTouched("birthday")}
                onChange={(e) => setBirthParts(by, e.target.value, bd)}
                className={inputClass(Boolean(showError("birthday")))}
                placeholder="MM"
              />
              <input
                value={bd}
                onBlur={() => markTouched("birthday")}
                onChange={(e) => setBirthParts(by, bm, e.target.value)}
                className={inputClass(Boolean(showError("birthday")))}
                placeholder="DD"
              />
            </div>
            
            {showError("birthday") ? <div className="mt-1 text-[11px] text-red-600">{errors.birthday}</div> : null}
          </div>

          <div>
            <div className="text-[11px] text-gray-500">전화번호</div>
            <div className="mt-1 flex items-center gap-2">
              <input
                value={p1}
                onBlur={() => markTouched("phone")}
                onChange={(e) => setPhoneParts(e.target.value, p2, p3)}
                className={inputClass(Boolean(showError("phone")))}
                placeholder="010"
              />
              <input
                value={p2}
                onBlur={() => markTouched("phone")}
                onChange={(e) => setPhoneParts(p1, e.target.value, p3)}
                className={inputClass(Boolean(showError("phone")))}
                placeholder="1234"
              />
              <input
                value={p3}
                onBlur={() => markTouched("phone")}
                onChange={(e) => setPhoneParts(p1, p2, e.target.value)}
                className={inputClass(Boolean(showError("phone")))}
                placeholder="5678"
              />
            </div>
            
            {showError("phone") ? <div className="mt-1 text-[11px] text-red-600">{errors.phone}</div> : null}
          </div>

          <div>
            <div className="text-[11px] text-gray-500">주소</div>
            <input
              value={form.address ?? ""}
              onChange={(e) => setForm((p) => ({ ...p, address: e.target.value }))}
              className={inputClass(false)}
              placeholder="서울시 ..."
            />
          </div>

          <div>
            <div className="text-[11px] text-gray-500">닉네임</div>
            <input
              value={form.nickname ?? ""}
              onChange={(e) => setForm((p) => ({ ...p, nickname: e.target.value }))}
              className={inputClass(false)}
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
            className={inputBase + " border-gray-200 focus:ring-violet-200 w-[320px]"}
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

                const phoneView = u.phone ? onlyDigits(String(u.phone)) : "-";

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
                    <td className="py-2 pr-3 text-gray-700">{phoneView}</td>
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
