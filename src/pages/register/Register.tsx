// src/pages/auction_register/Register.tsx (혹은 너가 둔 RegisterPage 파일 경로)
import React, { useMemo, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { registerUser, type RegisterRequest } from "@/api/registerapi";
import {
  reEmail,
  rePassword,
  formatPhone,
  isValidPhone,
  toBirthdayDotFromInputDate,
  isValidBirthdayDot,
} from "@/lib/validators";

type Gender = "M" | "F";

type FormState = {
  email: string;
  name: string;
  password: string;
  passwordConfirm: string;
  gender: Gender;
  birthdayInput: string; // input=date (yyyy-MM-dd)
  phone: string;         // 화면: 010-****
  address: string;
  nickname: string;
  agree: boolean;
};

type Errors = Partial<Record<keyof FormState, string>>;

const initial: FormState = {
  email: "",
  name: "",
  password: "",
  passwordConfirm: "",
  gender: "M",
  birthdayInput: "",
  phone: "",
  address: "",
  nickname: "",
  agree: false,
};

export default function RegisterPage() {
  const nav = useNavigate();
  const [f, setF] = useState<FormState>(initial);
  const [err, setErr] = useState<Errors>({});
  const [loading, setLoading] = useState(false);

  function set<K extends keyof FormState>(k: K, v: FormState[K]) {
    setF((p) => ({ ...p, [k]: v }));
    validateField(k, v);
  }

  function validateField<K extends keyof FormState>(k: K, v: FormState[K]) {
    let msg = "";
    switch (k) {
      case "email":
        if (!v) msg = "이메일을 입력하세요.";
        else if (!reEmail.test(String(v))) msg = "이메일 형식이 올바르지 않습니다.";
        break;
      case "name":
        if (!v) msg = "이름을 입력하세요.";
        else if (String(v).trim().length < 2) msg = "이름은 최소 2자 이상입니다.";
        break;
      case "password":
        if (!v) msg = "비밀번호를 입력하세요.";
        else if (!rePassword.test(String(v)))
          msg = "비밀번호는 영문과 숫자를 포함해 8자 이상이어야 합니다.";
        break;
      case "passwordConfirm":
        if (String(v) !== f.password) msg = "비밀번호가 일치하지 않습니다.";
        break;
      case "phone":
        if (!v) msg = "전화번호를 입력하세요.";
        else if (!isValidPhone(String(v))) msg = "전화번호 형식이 올바르지 않습니다.";
        break;
      case "birthdayInput": {
        const dot = toBirthdayDotFromInputDate(String(v));
        if (!v) msg = "생년월일을 선택하세요.";
        else if (!isValidBirthdayDot(dot)) msg = "생년월일 형식 또는 나이가 올바르지 않습니다.";
        break;
      }
      case "address":
        if (String(v).trim().length > 0 && String(v).length < 4) msg = "주소가 너무 짧습니다.";
        break;
      case "nickname":
        if (String(v).trim().length > 0 && !/^[\w가-힣]{2,8}$/.test(String(v)))
          msg = "닉네임은 2~8자, 영문/숫자/한글/_ 만 허용됩니다.";
        break;
      case "agree":
        if (!v) msg = "약관에 동의해야 가입할 수 있습니다.";
        break;
    }
    setErr((p) => ({ ...p, [k]: msg }));
    return !msg;
  }

  const allValid = useMemo(() => {
    const checks: [keyof FormState, any][] = [
      ["email", f.email],
      ["name", f.name],
      ["password", f.password],
      ["passwordConfirm", f.passwordConfirm],
      ["birthdayInput", f.birthdayInput],
      ["phone", f.phone],
      ["agree", f.agree],
    ];
    return checks.every(([k, v]) => validateField(k, v));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [f.email, f.name, f.password, f.passwordConfirm, f.birthdayInput, f.phone, f.agree]);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();

    let ok = true;
    (Object.keys(f) as (keyof FormState)[]).forEach((k) => {
      // @ts-expect-error
      ok = validateField(k, f[k]) && ok;
    });
    if (!ok) return;

    const birthdayDot = toBirthdayDotFromInputDate(f.birthdayInput);

    // ✅ 서버가 여성 코드를 "W"로 받는 경우에 맞춰 변환 ("F" -> "W")
    const genderForServer: RegisterRequest["gender"] = f.gender === "M" ? "M" : "W";

    const body: RegisterRequest = {
      email: f.email.trim(),
      name: f.name.trim(),
      password: f.password,
      gender: genderForServer,
      birthday: birthdayDot,
      phone: f.phone.replace(/\D/g, ""),
      address: f.address.trim() || undefined,
      nickname: f.nickname.trim() || undefined,
    };

    try {
      setLoading(true);
      await registerUser(body);
      alert("회원가입이 완료되었습니다. 로그인해 주세요.");
      nav("/login", { replace: true });
    } catch (e: any) {
      const msg = e?.message || "회원가입 실패";
      alert(msg);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-slate-800 pt-24 pb-12 px-4">
      <div className="max-w-2xl mx-auto bg-white/10 backdrop-blur-lg border border-white/20 rounded-2xl p-8">
        <h1 className="text-3xl font-bold text-white mb-6">회원가입</h1>

        <form onSubmit={onSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {/* 이메일 */}
          <div className="md:col-span-2">
            <label className="block text-sm text-gray-200 mb-2">이메일*</label>
            <input
              type="email"
              className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white"
              placeholder="example@mail.com"
              value={f.email}
              onChange={(e) => set("email", e.target.value)}
              onBlur={(e) => validateField("email", e.target.value)}
            />
            {err.email && <p className="text-red-400 text-sm mt-1">{err.email}</p>}
          </div>

          {/* 이름 */}
          <div>
            <label className="block text-sm text-gray-200 mb-2">이름*</label>
            <input
              className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white"
              value={f.name}
              onChange={(e) => set("name", e.target.value)}
              onBlur={(e) => validateField("name", e.target.value)}
            />
            {err.name && <p className="text-red-400 text-sm mt-1">{err.name}</p>}
          </div>

          {/* 닉네임(선택) */}
          <div>
            <label className="block text-sm text-gray-200 mb-2">닉네임(선택)</label>
            <input
              className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white"
              placeholder="2~8자, 영문/숫자/한글/_"
              value={f.nickname}
              onChange={(e) => set("nickname", e.target.value)}
              onBlur={(e) => validateField("nickname", e.target.value)}
            />
            {err.nickname && <p className="text-red-400 text-sm mt-1">{err.nickname}</p>}
          </div>

          {/* 비밀번호 */}
          <div>
            <label className="block text-sm text-gray-200 mb-2">비밀번호*</label>
            <input
              type="password"
              className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white"
              placeholder="영문+숫자 포함 8자 이상"
              value={f.password}
              onChange={(e) => set("password", e.target.value)}
              onBlur={(e) => validateField("password", e.target.value)}
              autoComplete="new-password"
            />
            {err.password && <p className="text-red-400 text-sm mt-1">{err.password}</p>}
          </div>

          {/* 비밀번호 확인 */}
          <div>
            <label className="block text-sm text-gray-200 mb-2">비밀번호 확인*</label>
            <input
              type="password"
              className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white"
              value={f.passwordConfirm}
              onChange={(e) => set("passwordConfirm", e.target.value)}
              onBlur={(e) => validateField("passwordConfirm", e.target.value)}
              autoComplete="new-password"
            />
            {err.passwordConfirm && <p className="text-red-400 text-sm mt-1">{err.passwordConfirm}</p>}
          </div>

          {/* 성별 */}
          <div>
            <label className="block text-sm text-gray-200 mb-2">성별*</label>
            <div className="flex gap-4">
              <label className="flex items-center gap-2 text-gray-200">
                <input
                  type="radio"
                  name="gender"
                  checked={f.gender === "M"}
                  onChange={() => set("gender", "M")}
                />
                남성
              </label>
              <label className="flex items-center gap-2 text-gray-200">
                <input
                  type="radio"
                  name="gender"
                  checked={f.gender === "F"}
                  onChange={() => set("gender", "F")}
                />
                여성
              </label>
            </div>
          </div>

          {/* 생년월일 */}
          <div>
            <label className="block text-sm text-gray-200 mb-2">생년월일*</label>
            <input
              type="date"
              className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white [color-scheme:dark]"
              value={f.birthdayInput}
              onChange={(e) => set("birthdayInput", e.target.value)}
              onBlur={(e) => validateField("birthdayInput", e.target.value)}
            />
            {err.birthdayInput && <p className="text-red-400 text-sm mt-1">{err.birthdayInput}</p>}
          </div>

          {/* 전화번호 */}
          <div>
            <label className="block text-sm text-gray-200 mb-2">전화번호*</label>
            <input
              inputMode="numeric"
              className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white"
              placeholder="010-1234-5678"
              value={f.phone}
              onChange={(e) => set("phone", formatPhone(e.target.value))}
              onBlur={(e) => validateField("phone", e.target.value)}
            />
            {err.phone && <p className="text-red-400 text-sm mt-1">{err.phone}</p>}
          </div>

          {/* 주소(선택) */}
          <div className="md:col-span-2">
            <label className="block text-sm text-gray-200 mb-2">주소(선택)</label>
            <input
              className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white"
              value={f.address}
              onChange={(e) => set("address", e.target.value)}
              onBlur={(e) => validateField("address", e.target.value)}
            />
            {err.address && <p className="text-red-400 text-sm mt-1">{err.address}</p>}
          </div>

          {/* 약관 동의 */}
          <div className="md:col-span-2">
            <label className="flex items-center gap-2 text-gray-200">
              <input
                type="checkbox"
                checked={f.agree}
                onChange={(e) => set("agree", e.target.checked)}
                onBlur={(e) => validateField("agree", e.target.checked)}
              />
              <span>서비스 이용약관 및 개인정보 처리방침에 동의합니다.</span>
            </label>
            {err.agree && <p className="text-red-400 text-sm mt-1">{err.agree}</p>}
          </div>

          {/* 버튼 */}
          <div className="md:col-span-2 flex items-center justify-between mt-2">
            <Link to="/login" className="text-purple-300 hover:text-purple-2 00">
              이미 계정이 있으신가요? 로그인
            </Link>
            <button
              className={`px-6 py-3 rounded-xl font-bold ${
                allValid && !loading
                  ? "bg-gradient-to-r from-purple-600 to-pink-600 text-white"
                  : "bg-gray-500 text-gray-200 cursor-not-allowed"
              }`}
              type="submit"
              disabled={!allValid || loading}
            >
              {loading ? "처리중…" : "가입하기"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
