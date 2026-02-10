import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Eye, EyeOff, Loader2 } from "lucide-react";
import { fetchLogin } from "./LoginApi";
import { useAuth } from "../../hooks/useAuth";
import type { loginRequest } from "./LoginDto";
import { requestFcmToken } from "@/firebase/firebase";
import { registerDeviceToken } from "../../api/pushApi";

const LoginPage = () => {
  const navigate = useNavigate();
  const [showPassword, setShowPassword] = useState<boolean>(false);
  const [email, setEmail] = useState<string>("");
  const [password, setPassword] = useState<string>("");
  const [rememberEmail, setRememberEmail] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const { checkAuth } = useAuth();

  useEffect(() => {
    const savedEmail = localStorage.getItem("saved_email");
    if (savedEmail) {
      setEmail(savedEmail);
      setRememberEmail(true);
    }
  }, []);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (loading) return;
    setLoading(true);
    setErrorMessage(null);

    try {
      const loginData: loginRequest = { email, password };
      const result = await fetchLogin(loginData);

      if (rememberEmail) localStorage.setItem("saved_email", email);
      else localStorage.removeItem("saved_email");

      localStorage.setItem("accessToken", result.result.token);
      // localStorage.setItem("userId", email);
      await checkAuth();

      try {
        const fcmToken = await requestFcmToken();
        if (fcmToken) {
          const prevToken = localStorage.getItem("fcm_token");
          const prevEmail = localStorage.getItem("fcm_email");

          const shouldRegister = prevToken !== fcmToken || prevEmail !== email;

          if (shouldRegister) {
            await registerDeviceToken(fcmToken);
            localStorage.setItem("fcm_registered", "true");
            localStorage.setItem("fcm_token", fcmToken);
            localStorage.setItem("fcm_email", email);
          }
        } else {
          console.warn("FCM 토큰 없음 (권한 거부 또는 오류)");
        }
      } catch (fcmError) {
        console.error("로그인 후 FCM 등록 중 오류:", fcmError);
      }

      window.location.replace("/");
    } catch (error) {
      if (error instanceof Error) {
        if (error.message.includes("401")) {
          console.error(error);
          setErrorMessage("이메일 또는 비밀번호가 일치하지 않습니다.");
        } else if (error.message.includes("403")) {
          console.error(error);
          setErrorMessage("정지된 계정입니다.");
        } else {
          console.error(error);
          setErrorMessage("서버에서 오류가 발생했습니다.");
        }
      } else {
        setErrorMessage("로그인에 실패했습니다.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F2F4F7] flex flex-col items-center justify-center p-6">
      <div className="w-full max-w-[420px]">
        {/* 정갈한 BID 로고 */}
        <div className="mb-10 text-center">
          <div className="flex items-center justify-center gap-1.5 mb-2">
            <div className="w-8 h-8 bg-[rgb(118,90,255)] rounded-lg flex items-center justify-center shadow-sm shadow-[rgb(118,90,255)]/20">
              <span className="text-white text-[14px] font-black tracking-tighter">
                B
              </span>
            </div>
            <h1 className="text-3xl font-black text-[#1F2937] tracking-[ -0.05em]">
              BID<span className="text-[rgb(118,90,255)]">.</span>
            </h1>
          </div>
          <p className="text-gray-500 font-medium text-sm">
            스마트한 경매의 시작
          </p>
        </div>

        {/* 메인 로그인 컨테이너 */}
        <div className="bg-white rounded-[32px] shadow-[0_12px_40px_rgba(0,0,0,0.04)] border border-gray-100 overflow-hidden transition-all">
          <div className="p-8 md:p-10">
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* 이메일 입력 */}
              <div className="relative group">
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="이메일 주소"
                  className="w-full h-13 pl-4 pr-4 bg-gray-50 border border-gray-200 rounded-2xl focus:bg-white focus:border-[rgb(118,90,255)] focus:ring-4 focus:ring-[rgb(118,90,255)]/5 outline-none transition-all text-[15px] font-semibold text-gray-800 placeholder-gray-400"
                />
              </div>

              {/* 비밀번호 입력 */}
              <div className="relative group">
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="비밀번호"
                  className="w-full h-13 pl-4 pr-12 bg-gray-50 border border-gray-200 rounded-2xl focus:bg-white focus:border-[rgb(118,90,255)] focus:ring-4 focus:ring-[rgb(118,90,255)]/5 outline-none transition-all text-[15px] font-semibold text-gray-800 placeholder-gray-400"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-4 flex items-center text-gray-400 hover:text-gray-600 transition-colors"
                >
                  {showPassword ? (
                    <EyeOff className="w-5 h-5" />
                  ) : (
                    <Eye className="w-5 h-5" />
                  )}
                </button>
              </div>

              {/* 로그인 보조 기능 */}
              <div className="flex items-center justify-between py-1">
                <label className="flex items-center gap-2 cursor-pointer select-none group">
                  <input
                    type="checkbox"
                    checked={rememberEmail}
                    onChange={(e) => setRememberEmail(e.target.checked)}
                    className="w-4 h-4 rounded border-gray-300 text-[#7C3AED] focus:ring-[#7C3AED] transition-all cursor-pointer"
                  />
                  <span className="text-[13px] font-bold text-gray-500 group-hover:text-gray-700">
                    이메일 저장
                  </span>
                </label>

                <div className="flex items-center gap-2.5 text-[13px] font-bold text-gray-400">
                  <button
                    type="button"
                    className="hover:text-gray-600 transition-colors cursor-pointer"
                    onClick={() => navigate(`/find_password`)}
                  >
                    비밀번호 찾기
                  </button>
                </div>
              </div>

              {/* 로그인 버튼 */}
              <button
                type="submit"
                disabled={loading}
                className="flex items-center justify-center w-full h-13 bg-[rgb(118,90,255)] hover:bg-[rgb(90,58,252)] disabled:bg-gray-200 text-white rounded-2xl font-black text-[16px] transition-all shadow-lg shadow-[#7C3AED]/10 active:scale-[0.99] mt-2"
              >
                {loading ? (
                  <Loader2 className="w-5 h-5 text-white animate-spin" />
                ) : (
                  "로그인"
                )}
              </button>
            </form>

            <div className="flex justify-center mt-4 min-h-[24px]">
              {errorMessage ? (
                <span className="text-red-600">{errorMessage}</span>
              ) : null}
            </div>

            {/* 회원가입 섹션 */}
            <div className="mt-4 pt-3 border-t border-gray-50 text-center">
              <button
                type="button"
                onClick={() => navigate("/register")}
                className="inline-flex items-center justify-center gap-2 text-gray-500 hover:text-[rgb(118,90,255)] transition-all group cursor-pointer"
              >
                <span className="text-[14px] font-semibold">
                  아직 BID의 회원이 아니신가요?
                </span>
                <span className="text-[14px] font-black border-b-2 border-transparent group-hover:border-[rgb(118,90,255)] pb-px">
                  회원가입
                </span>
              </button>
            </div>
          </div>
        </div>

        {/* 푸터 메뉴 */}
        <div className="mt-10 flex justify-center items-center gap-5 text-[12px] font-bold text-gray-400 uppercase tracking-tight">
          <button className="flex items-center gap-1 hover:text-gray-600 transition-colors">
            고객센터
          </button>
          <button className="hover:text-gray-600 transition-colors">
            이용약관
          </button>
          <button className="hover:text-gray-600 transition-colors">
            개인정보처리방침
          </button>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
