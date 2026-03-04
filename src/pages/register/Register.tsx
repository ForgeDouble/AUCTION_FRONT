import React, { useMemo, useState } from "react";
import { useNavigate, Link } from "react-router-dom";

import { Check, AlertCircle } from "lucide-react";
import bidLogo from "@/assets/bid-logo.png";
import {
  reEmail,
  rePassword,
  formatPhone,
  isValidPhone,
  toBirthdayDotFromInputDate,
  isValidBirthdayDot,
} from "@/lib/validators";
import type { Errors, FormState, Gender, RegisterRequest } from "./RegisterDto";
import { useModal } from "@/contexts/ModalContext";
import { handleApiError } from "@/errors/HandleApiError";
import { registerUser } from "./RegistApi";

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
  const { showWarning, showError } = useModal();

  function set<K extends keyof FormState>(k: K, v: FormState[K]) {
    setF((p) => ({ ...p, [k]: v }));
    if (err[k]) setErr((p) => ({ ...p, [k]: "" }));
  }

  function validateField<K extends keyof FormState>(k: K, v: FormState[K]) {
    let msg = "";
    switch (k) {
      case "email":
        if (!v) msg = "이메일을 입력하세요.";
        else if (!reEmail.test(String(v)))
          msg = "유효한 이메일 주소가 아닙니다.";
        break;
      case "name": {
        const name = String(v).trim();

        if (!name) {
          msg = "이름을 입력하세요.";
        } else if (name.length < 2) {
          msg = "이름은 2자 이상이어야 합니다.";
        } else if (!/^[가-힣a-zA-Z]+$/.test(name)) {
          msg = "이름에는 한글 또는 영문만 입력할 수 있습니다.";
        }
        break;
      }
      case "password":
        if (!v) msg = "비밀번호를 입력하세요.";
        else if (!rePassword.test(String(v)))
          msg = "영문과 숫자를 포함해 8자 이상이어야 합니다.";
        break;
      case "passwordConfirm":
        if (String(v) !== f.password) msg = "비밀번호가 일치하지 않습니다.";
        break;
      case "phone":
        if (!v) msg = "전화번호를 입력하세요.";
        else if (!isValidPhone(String(v)))
          msg = "올바른 전화번호 형식이 아닙니다.";
        break;
      case "birthdayInput": {
        const dot = toBirthdayDotFromInputDate(String(v));
        if (!v) msg = "생년월일을 선택하세요.";
        else if (!isValidBirthdayDot(dot))
          msg = "만 14세 이상부터 가입할 수 있습니다.";
        break;
      }
      case "nickname":
        if (String(v).trim().length > 0 && !/^[\w가-힣]{2,8}$/.test(String(v)))
          msg = "닉네임은 2~8자 (한글/영문/숫자)만 가능합니다.";
        break;
      case "address":
        if (String(v).trim().length > 0 && String(v).length < 2)
          msg = "주소가 너무 짧습니다.";
        break;
      case "agree":
        if (!v) msg = "약관에 동의해야 합니다.";
        break;
    }
    setErr((p) => ({ ...p, [k]: msg }));
    return !msg;
  }

  const allValid = useMemo(() => {
    return (
      reEmail.test(f.email) &&
      f.name.trim().length >= 2 &&
      rePassword.test(f.password) &&
      f.password === f.passwordConfirm &&
      f.birthdayInput &&
      isValidPhone(f.phone) &&
      f.agree
    );
  }, [f]);

  const progress = useMemo(() => {
    const requiredChecks = [
      reEmail.test(f.email),
      f.name.trim().length >= 2,
      !!f.birthdayInput &&
        isValidBirthdayDot(toBirthdayDotFromInputDate(f.birthdayInput)),
      isValidPhone(f.phone),
      rePassword.test(f.password),
      f.password.length > 0 && f.password === f.passwordConfirm,
      f.agree,
    ];

    const done = requiredChecks.filter(Boolean).length;
    const total = requiredChecks.length;

    const pct = Math.round((done / total) * 100);
    return Math.max(8, pct);
  }, [f]);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();

    let ok = true;
    (Object.keys(f) as (keyof FormState)[]).forEach((k) => {
      ok = validateField(k, f[k]) && ok;
    });
    if (!ok) return;

    const birthdayDot = toBirthdayDotFromInputDate(f.birthdayInput);

    const body: RegisterRequest = {
      email: f.email.trim(),
      name: f.name.trim(),
      password: f.password,
      gender: f.gender === "M" ? "M" : "W",
      birthday: birthdayDot,
      phone: f.phone.replace(/\D/g, ""),
      address: f.address.trim() || undefined,
      nickname: f.nickname.trim() || undefined,
    };

    try {
      setLoading(true);
      await registerUser(body);
      showWarning("회원가입이 완료되었습니다. 로그인해 주세요.");
      nav("/login", { replace: true });
    } catch (error: unknown) {
      const result = handleApiError(error);
      console.error(result);

      switch (result.type) {
        case "DIALOG":
          switch (result.to) {
            case "email":
              setErr((p) => ({ ...p, email: result.message }));
              break;
            case "name":
              setErr((p) => ({ ...p, name: result.message }));
              break;
            case "nickname":
              setErr((p) => ({ ...p, nickname: result.message }));
              break;
            case "birthdayInput":
              setErr((p) => ({ ...p, birthdayInput: result.message }));
              break;
            case "phone":
              setErr((p) => ({ ...p, phone: result.message }));
              break;
            case "address":
              setErr((p) => ({ ...p, address: result.message }));
              break;
            case "password":
              setErr((p) => ({ ...p, password: result.message }));
              break;
            case "gender":
              setErr((p) => ({ ...p, gender: result.message }));
              break;
            default:
              showError(result.message ?? "입력값을 확인해주세요.");
          }
          break;

        default:
          showError(
            "서버 내부에서 오류가 발생했습니다. 관리자에게 문의해주세요.",
          );
      }
    } finally {
      setLoading(false);
    }
  }

  const pageBg = "min-h-screen bg-[#F6F7FB] px-4 pb-12 pt-28";
  const wrap = "mx-auto w-full max-w-[820px]";
  const card =
    "bg-white rounded-3xl border border-black/5 shadow-[0_10px_30px_rgba(15,23,42,0.06)] overflow-hidden";
  const head = "px-8 pt-8 pb-6 border-b border-black/5";
  const body = "px-8 py-8";

  const title = "text-[28px] font-extrabold tracking-tight text-[#111827]";

  const section = "py-6 border-t border-black/5";
  const sectionTitle = "text-[15px] font-extrabold text-[#111827] mb-4";

  const label = "block text-[12px] font-semibold text-gray-600 mb-2";
  const inputBase =
    "w-full h-12 rounded-2xl border border-black/10 bg-white px-4 text-[15px] text-[#111827] " +
    "placeholder:text-gray-300 outline-none transition " +
    "focus:border-[rgb(118_90_255_/_0.45)] focus:ring-2 focus:ring-[rgb(118_90_255_/_0.12)]";
  const inputErr =
    "border-red-400 focus:border-red-400 focus:ring-red-200/60 bg-red-50/40";
  const errText = "mt-2 text-[12px] text-red-500 flex items-center gap-1";
  const helpText = "mt-2 text-[12px] text-gray-500";

  const primaryBtn =
    "w-full md:w-[360px] h-12 rounded-2xl font-extrabold text-[15px] transition flex items-center justify-center gap-2";
  const primaryOn =
    "bg-[rgb(118_90_255)] text-white hover:bg-[rgb(104_78_235)] " +
    "shadow-[0_10px_24px_rgb(118_90_255_/_0.18)] active:scale-[0.99]";
  const primaryOff = "bg-[#EEF0F6] text-gray-400 cursor-not-allowed";

  return (
    <div className={pageBg}>
      <div className={wrap}>
        {/* 상단: 브랜드 / 로그인 링크 */}
        <div className="mb-6 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-white border border-black/5 shadow-sm flex items-center justify-center">
              <img
                src={bidLogo}
                alt="bid-logo"
                className="w-7 h-7 object-contain"
              />
            </div>
            <div className="leading-tight">
              <div className="text-[24px] font-extrabold text-[#111827]">
                BID 계정 생성
              </div>
            </div>
          </div>
          <br></br>
          <div className="mt-3 text-[13px] text-gray-500">
            {" "}
            이미 계정이 있으신가요?{" "}
            <Link
              to="/login"
              className="font-semibold text-[rgb(118_90_255)] hover:text-[rgb(104_78_235)]"
            >
              로그인
            </Link>
          </div>
        </div>

        <div className={card}>
          {/* 헤더 */}
          <div className={head}>
            <div className={title}>회원가입</div>

            <div className="mt-6 h-1.5 rounded-full bg-[#EEF0F6] overflow-hidden">
              <div
                className="h-full bg-[rgb(118_90_255)] rounded-full transition-[width] duration-300 ease-out"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>

          <form onSubmit={onSubmit} className={body}>
            {/* 기본 정보 */}
            <div className="pb-2">
              <div className={sectionTitle}>기본 정보</div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div>
                  <div className={label}>이름</div>
                  <input
                    value={f.name}
                    onChange={(e) => set("name", e.target.value)}
                    onBlur={(e) => validateField("name", e.target.value)}
                    placeholder="이름"
                    className={inputBase + (err.name ? " " + inputErr : "")}
                  />
                  {err.name && (
                    <div className={errText}>
                      <AlertCircle className="w-3.5 h-3.5" /> {err.name}
                    </div>
                  )}
                </div>

                <div>
                  <div className={label}>닉네임</div>
                  <input
                    value={f.nickname}
                    onChange={(e) => set("nickname", e.target.value)}
                    onBlur={(e) => validateField("nickname", e.target.value)}
                    placeholder="닉네임"
                    className={inputBase + (err.nickname ? " " + inputErr : "")}
                  />
                  {err.nickname && (
                    <div className={errText}>
                      <AlertCircle className="w-3.5 h-3.5" /> {err.nickname}
                    </div>
                  )}
                  {/* {!err.nickname && <div className={helpText}>닉네임은 선택 항목입니다.</div>} */}
                </div>

                <div>
                  <div className={label}>생년월일</div>
                  <input
                    type="date"
                    value={f.birthdayInput}
                    onChange={(e) => set("birthdayInput", e.target.value)}
                    onBlur={(e) =>
                      validateField("birthdayInput", e.target.value)
                    }
                    className={
                      inputBase + (err.birthdayInput ? " " + inputErr : "")
                    }
                  />
                  {err.birthdayInput && (
                    <div className={errText}>
                      <AlertCircle className="w-3.5 h-3.5" />{" "}
                      {err.birthdayInput}
                    </div>
                  )}
                </div>

                <div>
                  <div className={label}>성별</div>
                  <div className="h-12 rounded-2xl border border-black/10 bg-white p-1 flex">
                    {(["M", "F"] as Gender[]).map((g) => (
                      <button
                        key={g}
                        type="button"
                        onClick={() => set("gender", g)}
                        className={
                          "flex-1 rounded-xl text-[14px] font-extrabold transition " +
                          (f.gender === g
                            ? "bg-[rgb(118_90_255)] text-white shadow-sm"
                            : "text-gray-600 hover:bg-black/5")
                        }
                      >
                        {g === "M" ? "남성" : "여성"}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* 연락처 */}
            <div className={section}>
              <div className={sectionTitle}>연락처 & 주소 정보</div>

              {/* ✅ 전화번호 -> 다음 칸에 주소(전체 폭) */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div>
                  <div className={label}>전화번호</div>
                  <input
                    value={f.phone}
                    onChange={(e) => set("phone", formatPhone(e.target.value))}
                    onBlur={(e) => validateField("phone", e.target.value)}
                    placeholder="010-0000-0000"
                    maxLength={13}
                    className={inputBase + (err.phone ? " " + inputErr : "")}
                  />
                  {err.phone && (
                    <div className={errText}>
                      <AlertCircle className="w-3.5 h-3.5" /> {err.phone}
                    </div>
                  )}
                </div>

                <div className="hidden md:block" />
              </div>

              <div className="mt-5">
                <div className={label}>주소 (선택)</div>
                <input
                  value={f.address}
                  onChange={(e) => set("address", e.target.value)}
                  onBlur={(e) => validateField("address", e.target.value)}
                  placeholder="예) 서울특별시 강남구"
                  className={inputBase + (err.address ? " " + inputErr : "")}
                />
                {err.address && (
                  <div className={errText}>
                    <AlertCircle className="w-3.5 h-3.5" /> {err.address}
                  </div>
                )}
              </div>
            </div>

            {/* 계정 보안 */}
            <div className={section}>
              <div className={sectionTitle}>계정 보안</div>

              <div className="grid grid-cols-1 gap-5">
                <div>
                  <div className={label}>이메일</div>
                  <input
                    type="email"
                    value={f.email}
                    onChange={(e) => set("email", e.target.value)}
                    onBlur={(e) => validateField("email", e.target.value)}
                    placeholder="name@example.com"
                    className={inputBase + (err.email ? " " + inputErr : "")}
                  />
                  {err.email ? (
                    <div className={errText}>
                      <AlertCircle className="w-3.5 h-3.5" /> {err.email}
                    </div>
                  ) : (
                    <div className={helpText}>
                      이 주소는 로그인 아이디로 사용됩니다.
                    </div>
                  )}
                </div>

                {/* ✅ 비밀번호 다음칸에 비밀번호 확인(세로 배치) */}
                <div>
                  <div className={label}>비밀번호</div>
                  <input
                    type="password"
                    value={f.password}
                    onChange={(e) => set("password", e.target.value)}
                    onBlur={(e) => validateField("password", e.target.value)}
                    placeholder="영문+숫자 8자 이상"
                    autoComplete="new-password"
                    className={inputBase + (err.password ? " " + inputErr : "")}
                  />
                  {err.password && (
                    <div className={errText}>
                      <AlertCircle className="w-3.5 h-3.5" /> {err.password}
                    </div>
                  )}
                </div>

                <div>
                  <div className={label}>비밀번호 확인</div>
                  <input
                    type="password"
                    value={f.passwordConfirm}
                    onChange={(e) => set("passwordConfirm", e.target.value)}
                    onBlur={(e) =>
                      validateField("passwordConfirm", e.target.value)
                    }
                    placeholder="비밀번호를 다시 입력"
                    autoComplete="new-password"
                    className={
                      inputBase + (err.passwordConfirm ? " " + inputErr : "")
                    }
                  />
                  {err.passwordConfirm && (
                    <div className={errText}>
                      <AlertCircle className="w-3.5 h-3.5" />{" "}
                      {err.passwordConfirm}
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* 약관 / 제출 */}
            <div className={section}>
              <label className="flex items-start gap-3 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={f.agree}
                  onChange={(e) => set("agree", e.target.checked)}
                  className="mt-1 w-5 h-5 rounded-md border-black/20 text-[rgb(118_90_255)] focus:ring-[rgb(118_90_255_/_0.20)]"
                />
                <div>
                  <div className="text-[13px] font-semibold text-[#111827]">
                    서비스 이용약관 및 개인정보 처리방침에 동의합니다.
                  </div>
                  <div className="text-[12px] text-gray-500 mt-1">
                    필수 동의 항목입니다.
                  </div>
                  {err.agree && (
                    <div className={errText}>
                      <AlertCircle className="w-3.5 h-3.5" /> {err.agree}
                    </div>
                  )}
                </div>
              </label>

              <div className="mt-6 flex justify-center">
                <button
                  type="submit"
                  disabled={!allValid || loading}
                  className={
                    primaryBtn +
                    " " +
                    (allValid && !loading ? primaryOn : primaryOff)
                  }
                >
                  {loading ? "계정 생성 중..." : "계정 생성"}
                  {!loading && <Check className="w-4 h-4" />}
                </button>
              </div>

              <div className="mt-3 text-center text-[11px] text-gray-400">
                가입 시 약관 및 개인정보 처리방침에 동의한 것으로 간주합니다.
              </div>
            </div>
          </form>
        </div>

        <div className="mt-5 text-center text-[12px] text-gray-500">
          이미 계정이 있으신가요?{" "}
          <Link
            to="/login"
            className="font-semibold text-[#6D28D9] hover:text-[#5B21B6]"
          >
            로그인하기
          </Link>
        </div>
      </div>
    </div>
  );
}
