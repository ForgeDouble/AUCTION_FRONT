import React, { useEffect, useMemo, useState } from "react";
import { ShieldCheck, UserPlus, RefreshCw, ChevronLeft, ChevronRight, List } from "lucide-react";
import { useAdminStore } from "../AdminContext";
import type { AdminUserCreateReq, Authority, Gender } from "../adminTypes";

type RoleTab = "ALL" | "ADMIN" | "INQUIRY" | "USER";

function authorityBadge(role: Authority) {
  const map: Record<Authority, string> = {
    USER: "bg-gray-50 text-gray-700 border-gray-200",
    INQUIRY: "bg-blue-50 text-blue-700 border-blue-200",
    ADMIN: "bg-violet-50 text-violet-700 border-violet-200",
  };
  return map[role] ?? "bg-gray-50 text-gray-700 border-gray-200";
}

function onlyDigits(v: string) {
  return v.replace(/\D/g, "");
}

function pad2(v: string) {
  return v.padStart(2, "0");
}

export default function AdminUsersPage() {
  const {
    users, // 현재 페이지 items
    usersCounts,
    usersPageIndex,
    usersPageSize,
    usersTotalPages,
    usersTotalElements,
    refreshUsersPage,
    goUsersPage,
    changeUsersPageSize,
    createAdminUser,
    createInquiryUser,
  } = useAdminStore();

  const [loading, setLoading] = useState(false);

  const [listOnly, setListOnly] = useState(false);

  const [createRole, setCreateRole] = useState<"ADMIN" | "INQUIRY">("INQUIRY");
  const [q, setQ] = useState("");
  const [roleFilter, setRoleFilter] = useState<RoleTab>("ALL");

  const [form, setForm] = useState<Omit<AdminUserCreateReq, "birthday" | "phone">>({
    email: "",
    name: "",
    password: "",
    gender: "M" as Gender,
    address: "",
    nickname: "",
  } as any);

  const [birth, setBirth] = useState({ yyyy: "", mm: "", dd: "" });
  const [phone, setPhone] = useState({ p1: "010", p2: "", p3: "" });

  const [touched, setTouched] = useState<Record<string, boolean>>({});
  const touch = (k: string) => setTouched((p) => ({ ...p, [k]: true }));

  // 최초 로드 + roleFilter 변경 시 즉시 로드
  useEffect(() => {
    void (async () => {
      setLoading(true);
      try {
        await refreshUsersPage({ page: 0, size: usersPageSize, role: roleFilter, q });
      } finally {
        setLoading(false);
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [roleFilter]);

  // 검색은 디바운스
  useEffect(() => {
    const t = window.setTimeout(() => {
      void (async () => {
        setLoading(true);
        try {
          await refreshUsersPage({ page: 0, size: usersPageSize, role: roleFilter, q });
        } finally {
          setLoading(false);
        }
      })();
    }, 250);

    return () => window.clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [q, usersPageSize]);

  const errors = useMemo(() => {
    const e: Record<string, string> = {};

    const email = form.email.trim();
    const name = form.name.trim();
    const password = form.password ?? "";

    if (!email) e.email = "이메일을 입력해 주세요.";
    else if (!email.includes("@")) e.email = "이메일 형식을 확인해 주세요.";

    if (!name) e.name = "이름을 입력해 주세요.";

    if (!password) e.password = "비밀번호를 입력해 주세요.";
    else if (password.length < 4) e.password = "비밀번호는 4자 이상 입력해 주세요.";

    const yyyy = onlyDigits(birth.yyyy);
    const mm = onlyDigits(birth.mm);
    const dd = onlyDigits(birth.dd);

    if (!yyyy || !mm || !dd) e.birthday = "생년월일을 입력해 주세요.";
    else if (yyyy.length !== 4) e.birthday = "YYYY 4자리를 입력해 주세요.";
    else {
      const m = Number(mm);
      const d = Number(dd);
      if (mm.length !== 2 || m < 1 || m > 12) e.birthday = "월(MM)을 01~12로 입력해 주세요.";
      else if (dd.length !== 2 || d < 1 || d > 31) e.birthday = "일(DD)을 01~31로 입력해 주세요.";
    }

    const p1 = onlyDigits(phone.p1);
    const p2 = onlyDigits(phone.p2);
    const p3 = onlyDigits(phone.p3);

    if (!p1 || !p2 || !p3) e.phone = "전화번호를 입력해 주세요.";
    else if (p1.length !== 3) e.phone = "앞자리는 3자리(예: 010)로 입력해 주세요.";
    else if (p2.length !== 4 || p3.length !== 4) e.phone = "가운데/끝자리는 4자리로 입력해 주세요.";

    return e;
  }, [form, birth, phone]);

  const canSubmit = Object.keys(errors).length === 0;

  const birthdayValue = useMemo(() => {
    const yyyy = onlyDigits(birth.yyyy);
    const mm = pad2(onlyDigits(birth.mm).slice(0, 2));
    const dd = pad2(onlyDigits(birth.dd).slice(0, 2));
    if (yyyy.length !== 4 || mm.length !== 2 || dd.length !== 2) return "";
    return `${yyyy}.${mm}.${dd}`;
  }, [birth]);

  const phoneValue = useMemo(() => {
    const p1 = onlyDigits(phone.p1).slice(0, 3);
    const p2 = onlyDigits(phone.p2).slice(0, 4);
    const p3 = onlyDigits(phone.p3).slice(0, 4);
    if (p1.length !== 3 || p2.length !== 4 || p3.length !== 4) return "";
    return `${p1}${p2}${p3}`;
  }, [phone]);

  const showErr = (k: string) => Boolean(errors[k]) && Boolean(touched[k]);

  const onSubmit = async () => {
    touch("email");
    touch("name");
    touch("password");
    touch("birthday");
    touch("phone");

    if (!canSubmit) return;

    setLoading(true);
    try {
      const payload: AdminUserCreateReq = {
        email: form.email.trim(),
        name: form.name.trim(),
        password: form.password,
        gender: form.gender,
        birthday: birthdayValue,
        phone: phoneValue,
        address: form.address?.trim() ? form.address.trim() : null,
        nickname: form.nickname?.trim() ? form.nickname.trim() : null,
      };

      if (createRole === "ADMIN") {
        await createAdminUser(payload);
        alert("ADMIN 계정 생성 성공");
      } else {
        await createInquiryUser(payload);
        alert("INQUIRY 계정 생성 성공");
      }

      setForm((p) => ({ ...p, email: "", name: "", password: "", address: "", nickname: "" }));
      setBirth({ yyyy: "", mm: "", dd: "" });
      setPhone({ p1: "010", p2: "", p3: "" });
      setTouched({});
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
      await refreshUsersPage({ page: 0, size: usersPageSize, role: roleFilter, q });
    } finally {
      setLoading(false);
    }
  };

  const pill = (active: boolean) =>
    "px-3 py-1.5 rounded-xl border text-sm break-keep whitespace-nowrap " +
    (active
      ? "bg-violet-50 border-violet-200 text-violet-700"
      : "bg-white border-gray-200 text-gray-700 hover:bg-gray-50");

  const inputBase =
    "mt-1 w-full px-3 py-2 rounded-xl border text-sm outline-none bg-white " +
    "focus:ring-2 focus:ring-violet-200 placeholder:text-gray-300 text-gray-900 break-keep";

  const inputErr = "border-red-300 focus:ring-red-100";
  const inputOk = "border-gray-200";

  // 페이징 정보 표시
  const pageUi = usersPageIndex + 1;
  const startNo = usersTotalElements === 0 ? 0 : usersPageIndex * usersPageSize + 1;
  const endNo = Math.min(usersTotalElements, usersPageIndex * usersPageSize + users.length);

  const adminsCount = usersCounts.ADMIN;
  const inquiriesCount = usersCounts.INQUIRY;
  const normalsCount = usersCounts.USER;

  return (
    <div className="space-y-4">
      <div className="bg-white border border-gray-100 rounded-2xl p-4 shadow-sm">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-xl bg-violet-600 flex items-center justify-center">
              <ShieldCheck className="w-5 h-5 text-white" />
            </div>
            <div>
              <div className="text-sm font-bold text-gray-900 break-keep">유저/권한 관리</div>
              <div className="text-[11px] text-gray-500 break-keep">
                {listOnly ? "전체 계정 목록(페이징) 조회" : "ADMIN / INQUIRY 계정 생성 및 목록 확인"}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setListOnly((v) => !v)}
              className="px-3 py-2 rounded-xl bg-white border border-gray-200 text-sm flex items-center gap-2 hover:bg-gray-50 break-keep"
              title="생성 폼 숨기고 목록만 보기"
            >
              <List className="w-4 h-4" />
              {listOnly ? "계정 생성" : "전체 리스트 보기"}
            </button>

            <button
              onClick={onRefresh}
              disabled={loading}
              className={
                "px-3 py-2 rounded-xl bg-white border border-gray-200 text-sm flex items-center gap-2 break-keep " +
                (loading ? "opacity-60 cursor-not-allowed" : "hover:bg-gray-50")
              }
            >
              <RefreshCw className={"w-4 h-4 " + (loading ? "animate-spin" : "")} />
              새로고침
            </button>
          </div>
        </div>
      </div>


      {!listOnly && (
        <div className="bg-white border border-gray-100 rounded-2xl p-4 shadow-sm">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <UserPlus className="w-5 h-5 text-gray-700" />
              <div className="text-sm font-bold text-gray-900 break-keep">문의담당자/관리자 계정 생성</div>
            </div>

            <div className="flex items-center gap-2">
              <button onClick={() => setCreateRole("INQUIRY")} className={pill(createRole === "INQUIRY")}>
                INQUIRY
              </button>
              <button onClick={() => setCreateRole("ADMIN")} className={pill(createRole === "ADMIN")}>
                ADMIN
              </button>
            </div>
          </div>

          <div className="mt-3 grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <div className="text-[11px] text-gray-500 break-keep">이메일</div>
              <input
                value={form.email}
                onChange={(e) => setForm((p) => ({ ...p, email: e.target.value }))}
                onBlur={() => touch("email")}
                className={inputBase + " " + (showErr("email") ? inputErr : inputOk)}
                placeholder="admin@example.com"
              />
              {showErr("email") ? <div className="mt-1 text-[11px] text-red-600 break-keep">{errors.email}</div> : null}
            </div>

            <div>
              <div className="text-[11px] text-gray-500 break-keep">이름</div>
              <input
                value={form.name}
                onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))}
                onBlur={() => touch("name")}
                className={inputBase + " " + (showErr("name") ? inputErr : inputOk)}
                placeholder="홍길동"
              />
              {showErr("name") ? <div className="mt-1 text-[11px] text-red-600 break-keep">{errors.name}</div> : null}
            </div>

            <div>
              <div className="text-[11px] text-gray-500 break-keep">비밀번호</div>
              <input
                type="password"
                value={form.password}
                onChange={(e) => setForm((p) => ({ ...p, password: e.target.value }))}
                onBlur={() => touch("password")}
                className={inputBase + " " + (showErr("password") ? inputErr : inputOk)}
                placeholder="알파벳 + 숫자"
              />
              {showErr("password") ? <div className="mt-1 text-[11px] text-red-600 break-keep">{errors.password}</div> : null}
            </div>

            <div>
              <div className="text-[11px] text-gray-500 break-keep">성별</div>
              <select
                value={form.gender}
                onChange={(e) => setForm((p) => ({ ...p, gender: e.target.value as any }))}
                className={inputBase + " " + inputOk}
              >
                <option value="M">남</option>
                <option value="W">여</option>
              </select>
            </div>

            <div>
              <div className="text-[11px] text-gray-500 break-keep">생년월일</div>
              <div className="mt-1 grid grid-cols-3 gap-2">
                <input
                  value={birth.yyyy}
                  onChange={(e) => setBirth((p) => ({ ...p, yyyy: onlyDigits(e.target.value).slice(0, 4) }))}
                  onBlur={() => touch("birthday")}
                  inputMode="numeric"
                  className={inputBase + " " + (showErr("birthday") ? inputErr : inputOk)}
                  placeholder="YYYY"
                />
                <input
                  value={birth.mm}
                  onChange={(e) => setBirth((p) => ({ ...p, mm: onlyDigits(e.target.value).slice(0, 2) }))}
                  onBlur={() => touch("birthday")}
                  inputMode="numeric"
                  className={inputBase + " " + (showErr("birthday") ? inputErr : inputOk)}
                  placeholder="MM"
                />
                <input
                  value={birth.dd}
                  onChange={(e) => setBirth((p) => ({ ...p, dd: onlyDigits(e.target.value).slice(0, 2) }))}
                  onBlur={() => touch("birthday")}
                  inputMode="numeric"
                  className={inputBase + " " + (showErr("birthday") ? inputErr : inputOk)}
                  placeholder="DD"
                />
              </div>
              {showErr("birthday") ? <div className="mt-1 text-[11px] text-red-600 break-keep">{errors.birthday}</div> : null}
            </div>

            <div>
              <div className="text-[11px] text-gray-500 break-keep">전화번호</div>
              <div className="mt-1 grid grid-cols-3 gap-2">
                <input
                  value={phone.p1}
                  onChange={(e) => setPhone((p) => ({ ...p, p1: onlyDigits(e.target.value).slice(0, 3) }))}
                  onBlur={() => touch("phone")}
                  inputMode="numeric"
                  className={inputBase + " " + (showErr("phone") ? inputErr : inputOk)}
                  placeholder="010"
                />
                <input
                  value={phone.p2}
                  onChange={(e) => setPhone((p) => ({ ...p, p2: onlyDigits(e.target.value).slice(0, 4) }))}
                  onBlur={() => touch("phone")}
                  inputMode="numeric"
                  className={inputBase + " " + (showErr("phone") ? inputErr : inputOk)}
                  placeholder="1234"
                />
                <input
                  value={phone.p3}
                  onChange={(e) => setPhone((p) => ({ ...p, p3: onlyDigits(e.target.value).slice(0, 4) }))}
                  onBlur={() => touch("phone")}
                  inputMode="numeric"
                  className={inputBase + " " + (showErr("phone") ? inputErr : inputOk)}
                  placeholder="5678"
                />
              </div>
              {showErr("phone") ? <div className="mt-1 text-[11px] text-red-600 break-keep">{errors.phone}</div> : null}
            </div>

            <div>
              <div className="text-[11px] text-gray-500 break-keep">주소</div>
              <input
                value={(form.address as any) ?? ""}
                onChange={(e) => setForm((p) => ({ ...p, address: e.target.value }))}
                className={inputBase + " " + inputOk}
                placeholder="서울특별시 강남구"
              />
            </div>

            <div>
              <div className="text-[11px] text-gray-500 break-keep">닉네임</div>
              <input
                value={(form.nickname as any) ?? ""}
                onChange={(e) => setForm((p) => ({ ...p, nickname: e.target.value }))}
                className={inputBase + " " + inputOk}
                placeholder="운영자"
              />
            </div>
          </div>

          <div className="mt-4 flex justify-end">
            <button
              onClick={onSubmit}
              disabled={loading}
              className={
                "px-4 py-2 rounded-xl text-sm font-semibold text-white bg-violet-600 break-keep " +
                (loading ? "opacity-60 cursor-not-allowed" : "hover:bg-violet-700")
              }
              title={canSubmit ? "생성" : "필수 입력값을 확인해 주세요"}
            >
              생성
            </button>
          </div>
        </div>
      )}

      {/* 목록 */}
      <div className="bg-white border border-gray-100 rounded-2xl p-4 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div className="flex items-center gap-2">
            <div className="text-sm font-bold text-gray-900 break-keep whitespace-nowrap">계정 목록</div>

            <div className="flex items-center gap-2 flex-wrap">
              <button onClick={() => setRoleFilter("ALL")} className={pill(roleFilter === "ALL")}>ALL</button>
              <button onClick={() => setRoleFilter("ADMIN")} className={pill(roleFilter === "ADMIN")}>ADMIN</button>
              <button onClick={() => setRoleFilter("INQUIRY")} className={pill(roleFilter === "INQUIRY")}>INQUIRY</button>
              <button onClick={() => setRoleFilter("USER")} className={pill(roleFilter === "USER")}>USER</button>
            </div>
          </div>

          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            className={
              "px-3 py-2 rounded-xl border border-gray-200 text-sm outline-none break-keep " +
              "focus:ring-2 focus:ring-violet-200 w-full sm:w-[360px] placeholder:text-gray-300"
            }
            placeholder="검색 (이메일/이름/닉네임)"
          />
        </div>

        <div className="mt-3 grid grid-cols-1 md:grid-cols-3 gap-3">
          <div className="p-3 rounded-xl bg-gray-50 border border-gray-100">
            <div className="text-[11px] text-gray-500 break-keep">ADMIN</div>
            <div className="text-xl font-bold text-gray-900">{adminsCount.toLocaleString()}</div>
          </div>
          <div className="p-3 rounded-xl bg-gray-50 border border-gray-100">
            <div className="text-[11px] text-gray-500 break-keep">INQUIRY</div>
            <div className="text-xl font-bold text-gray-900">{inquiriesCount.toLocaleString()}</div>
          </div>
          <div className="p-3 rounded-xl bg-gray-50 border border-gray-100">
            <div className="text-[11px] text-gray-500 break-keep">USER</div>
            <div className="text-xl font-bold text-gray-900">{normalsCount.toLocaleString()}</div>
          </div>
        </div>

        <div className="mt-4 overflow-x-auto">
          <table className="w-full text-sm table-fixed min-w-[920px]">
            <thead>
              <tr className="text-left text-[11px] text-gray-500 border-b break-keep whitespace-nowrap">
                <th className="py-2 pr-3 w-[70px]">ID</th>
                <th className="py-2 pr-3 w-[110px]">권한</th>
                <th className="py-2 pr-3 w-[280px]">이메일</th>
                <th className="py-2 pr-3 w-[140px]">이름</th>
                <th className="py-2 pr-3 w-[180px]">닉네임</th>
                <th className="py-2 pr-3 w-[160px]">전화</th>
                <th className="py-2 pr-3 w-[160px]">상태</th>
              </tr>
            </thead>
            <tbody>
              {users.map((u) => {
                const roleCls = authorityBadge(u.authority);
                const suspended = Boolean(u.suspendedUntil);
                const viewOnly = Boolean(u.viewOnly);

                return (
                  <tr key={u.userId} className="border-b">
                    <td className="py-2 pr-3 text-gray-700 break-keep whitespace-nowrap">{u.userId}</td>

                    <td className="py-2 pr-3 break-keep whitespace-nowrap">
                      <span className={"inline-flex items-center px-2 py-0.5 rounded-full border text-[11px] " + roleCls}>
                        {u.authority}
                      </span>
                    </td>

                    <td className="py-2 pr-3 text-gray-900 break-keep whitespace-nowrap truncate">
                      {u.email}
                    </td>

                    <td className="py-2 pr-3 text-gray-900 break-keep whitespace-nowrap">{u.name}</td>

                    <td className="py-2 pr-3 text-gray-700 break-keep whitespace-nowrap truncate">
                      {u.nickname ?? "-"}
                    </td>

                    <td className="py-2 pr-3 text-gray-700 break-keep whitespace-nowrap">
                      {(u.phone ?? "-").replace(/\D/g, "")}
                    </td>

                    <td className="py-2 pr-3 break-keep whitespace-nowrap">
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

              {users.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-6 text-center text-gray-500 break-keep">
                    목록이 없습니다.
                  </td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>

        {/* 페이저 */}
        <div className="mt-4 flex flex-col md:flex-row md:items-center md:justify-between gap-2">
          <div className="text-[11px] text-gray-500 break-keep">
            총 {usersTotalElements.toLocaleString()}명 · {startNo}-{endNo} · {pageUi}/{usersTotalPages} 페이지
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => goUsersPage(usersPageIndex - 1)}
              disabled={loading || usersPageIndex <= 0}
              className={
                "px-3 py-2 rounded-xl border border-gray-200 text-sm flex items-center gap-1 break-keep " +
                (loading || usersPageIndex <= 0 ? "opacity-50 cursor-not-allowed" : "hover:bg-gray-50")
              }
            >
              <ChevronLeft className="w-4 h-4" />
              이전
            </button>

            <button
              onClick={() => goUsersPage(usersPageIndex + 1)}
              disabled={loading || usersPageIndex >= usersTotalPages - 1}
              className={
                "px-3 py-2 rounded-xl border border-gray-200 text-sm flex items-center gap-1 break-keep " +
                (loading || usersPageIndex >= usersTotalPages - 1 ? "opacity-50 cursor-not-allowed" : "hover:bg-gray-50")
              }
            >
              다음
              <ChevronRight className="w-4 h-4" />
            </button>

            <select
              value={usersPageSize}
              onChange={(e) => changeUsersPageSize(Number(e.target.value))}
              className="px-3 py-2 rounded-xl border border-gray-200 text-sm bg-white break-keep"
              title="페이지 크기"
            >
              <option value={10}>10개</option>
              <option value={20}>20개</option>
              <option value={50}>50개</option>
            </select>
          </div>
        </div>
      </div>
    </div>
  );
}
