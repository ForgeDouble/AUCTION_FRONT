// login/loginpage.tsx
import React, { useState } from "react";
import {
  Gavel,
  Eye,
  EyeOff,
  Mail,
  Lock,
  ArrowRight,
  Shield,
  Star,
  Users,
  Heart,
} from "lucide-react";
import { fetchLogin } from "./LoginApi";

import { WarningModal } from "../../components/WarningModal";
import { useAuth } from "../../hooks/useAuth";
import type { loginRequest } from "./LoginDto";
import { requestFcmToken } from "@/firebase/firebase";
import { registerDeviceToken } from "../../api/pushApi";

const LoginPage = () => {
  // 비밀번호 보이기
  const [showPassword, setShowPassword] = useState(false);
  // 로그인 정보
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  // 비밀번호 기억하기
  const [rememberMe, setRememberMe] = useState(false);
  // 로딩 상태
  const [loading, setLoading] = useState(false);
  // 에러 상태
  const [error, setError] = useState<string | null>(null);
  // 경고창
  const [warningOpen, setWarningOpen] = useState(false);

  const { userEmail, isAuthenticated, checkAuth } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const loginData: loginRequest = { email, password };
      const result = await fetchLogin(loginData);

      console.log("로그인 성공:", result);

      localStorage.setItem("accessToken", result.result.token);
      localStorage.setItem("userId", email);
      await checkAuth();

      try {  
        const alreadyRegistered = localStorage.getItem("fcm_registered") === "true";  

        const fcmToken = await requestFcmToken();  

        if (fcmToken) {  
          const prevToken = localStorage.getItem("fcm_token");  

          if (!alreadyRegistered || prevToken !== fcmToken) {  
            await registerDeviceToken(fcmToken);  

            localStorage.setItem("fcm_registered", "true");  
            localStorage.setItem("fcm_token", fcmToken);  
          }  
        } else {  
          console.warn("FCM 토큰 없음 (권한 거부 또는 오류)");  
        }  
      } catch (fcmError) {  
        console.error("로그인 후 FCM 등록 중 오류:", fcmError);  
      }

      window.location.replace("/");
    } catch (err) {
      let errorMessage = "로그인에 실패했습니다.";
      if (err instanceof Error) {
        if (err.message.includes("401")) {
          errorMessage = "이메일 또는 비밀번호가 올바르지 않습니다.";
        } else if (err.message.includes("404")) {
          errorMessage = "존재하지 않는 계정입니다.";
        } else if (err.message.includes("500")) {
          errorMessage = "서버 오류가 발생했습니다. 잠시 후 다시 시도해주세요.";
        } else if (err.message.includes("Network")) {
          errorMessage = "네트워크 연결을 확인해주세요.";
        } else {
          errorMessage = err.message;
        }
      }
      setError(errorMessage);
      setWarningOpen(true);
    } finally {
      setLoading(false);
    }
  };

  const testimonials = [
    {
      name: "김성재",
      role: "아트 컬렉터",
      comment: "정말 안전하고 투명한 거래가 가능해요!",
      rating: 5,
    },
    {
      name: "김형기",
      role: "골동품 수집가",
      comment: "다양한 희귀 아이템을 만날 수 있어서 좋아요",
      rating: 5,
    },
    {
      name: "이명규",
      role: "패션 애호가",
      comment: "명품 경매에서 합리적인 가격에 구매했어요",
      rating: 5,
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex">
      <div className="flex-1 flex items-center justify-center p-8">
        <div className="w-full max-w-md">
          <div className="text-center mb-8">
            <div className="flex items-center justify-center space-x-3 mb-4">
              <Gavel className="h-10 w-10 text-purple-400" />
              <span className="text-3xl font-bold text-white">AuctionHub</span>
            </div>
            <h1 className="text-2xl font-bold text-white mb-2">
              다시 오신 것을 환영합니다
            </h1>
            <p className="text-gray-400">특별한 아이템들이 기다리고 있어요</p>
          </div>

          <div className="space-y-6">

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                이메일
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="이메일을 입력하세요"
                  className="w-full pl-12 pr-4 py-3 bg-white/10 backdrop-blur-lg border border-white/20 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 transition-all duration-300"
                />
              </div>
            </div>

            {/* 비밀번호 입력 */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                비밀번호
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="비밀번호를 입력하세요"
                  className="w-full pl-12 pr-12 py-3 bg-white/10 backdrop-blur-lg border border-white/20 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 transition-all duration-300"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-300 transition-colors"
                >
                  {showPassword ? (
                    <EyeOff className="h-5 w-5" />
                  ) : (
                    <Eye className="h-5 w-5" />
                  )}
                </button>
              </div>
            </div>

            {/* 옵션 */}
            <div className="flex items-center justify-between">
              <label className="flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="w-4 h-4 text-purple-600 bg-white/10 border border-white/20 rounded focus:ring-purple-500 focus:ring-2"
                />
                <span className="ml-2 text-sm text-gray-300">
                  로그인 상태 유지
                </span>
              </label>
              <button className="text-sm text-purple-400 hover:text-purple-300 transition-colors">
                비밀번호 찾기
              </button>
            </div>

            {/* 로그인 버튼 */}
            <button
              onClick={handleSubmit}
              className="w-full bg-gradient-to-r from-purple-600 to-pink-600 text-white py-3 rounded-xl hover:from-purple-700 hover:to-pink-700 transition-all duration-300 transform hover:scale-105 font-bold flex items-center justify-center"
            >
              로그인하기
              <ArrowRight className="ml-2 h-5 w-5" />
            </button>

            {/* 소셜 로그인 구분선 */}
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-white/20"></div>
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 text-gray-400">
                  또는
                </span>
              </div>
            </div>

            {/* 소셜 로그인 */}
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                className="flex items-center justify-center px-4 py-3 border border-white/20 rounded-xl bg-white/10 backdrop-blur-lg text-white hover:bg-white/20 transition-all duration-300"
              >
                <span className="text-lg mr-2">🌐</span>
                구글
              </button>
              <button
                type="button"
                className="flex items-center justify-center px-4 py-3 border border-white/20 rounded-xl bg-white/10 backdrop-blur-lg text-white hover:bg-white/20 transition-all duration-300"
              >
                <span className="text-lg mr-2">💬</span>
                카카오
              </button>
            </div>

            {/* 회원가입 링크 */}
            <div className="text-center">
              <span className="text-gray-400">아직 계정이 없으신가요? </span>
              <button className="text-purple-400 hover:text-purple-300 transition-colors font-medium">
                회원가입하기
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* 오른쪽 정보 섹션 */}
      <div className="hidden lg:flex flex-1 relative overflow-hidden">
        {/* 배경 그라데이션 */}
        <div className="absolute inset-0 bg-gradient-to-r from-purple-600/30 to-pink-600/30 backdrop-blur-sm"></div>

        <div className="relative z-10 flex flex-col justify-center p-12 w-full">
          {/* 헤더 정보 */}
          <div className="mb-12">
            <h2 className="text-4xl font-bold text-white mb-6 leading-tight">
              세상의 모든
              <span className="bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
                {" "}
                희귀템
              </span>
              <br />
              한곳에서
            </h2>
            <p className="text-xl text-gray-300">
              전 세계 컬렉터들과 함께하는 프리미엄 경매 플랫폼
            </p>
          </div>

          {/* 통계 */}
          <div className="grid grid-cols-2 gap-6 mb-12">
            <div className="bg-white/10 backdrop-blur-lg border border-white/20 rounded-2xl p-6 text-center">
              <div className="flex items-center justify-center mb-3">
                <Users className="h-8 w-8 text-purple-400" />
              </div>
              <div className="text-3xl font-bold text-white mb-2">50K+</div>
              <div className="text-gray-300">활성 사용자</div>
            </div>
            <div className="bg-white/10 backdrop-blur-lg border border-white/20 rounded-2xl p-6 text-center">
              <div className="flex items-center justify-center mb-3">
                <Shield className="h-8 w-8 text-green-400" />
              </div>
              <div className="text-3xl font-bold text-white mb-2">99.8%</div>
              <div className="text-gray-300">안전 거래율</div>
            </div>
          </div>

          {/* 후기 */}
          <div className="space-y-4">
            <h3 className="text-2xl font-bold text-white mb-6 flex items-center">
              <Heart className="h-6 w-6 text-pink-400 mr-2" />
              사용자 후기
            </h3>
            {testimonials.map((testimonial, index) => (
              <div
                key={index}
                className="bg-white/10 backdrop-blur-lg border border-white/20 rounded-xl p-4 hover:bg-white/20 transition-all duration-300"
              >
                <div className="flex items-center justify-between mb-2">
                  <div>
                    <div className="font-bold text-white">
                      {testimonial.name}
                    </div>
                    <div className="text-sm text-gray-400">
                      {testimonial.role}
                    </div>
                  </div>
                  <div className="flex">
                    {[...Array(testimonial.rating)].map((_, i) => (
                      <Star
                        key={i}
                        className="h-4 w-4 text-yellow-400 fill-current"
                      />
                    ))}
                  </div>
                </div>
                <p className="text-gray-300 text-sm">"{testimonial.comment}"</p>
              </div>
            ))}
          </div>
        </div>

        {/* 장식 요소 */}
        <div className="absolute -bottom-32 -right-32 w-64 h-64 bg-purple-500/20 rounded-full blur-3xl"></div>
        <div className="absolute -top-32 -right-16 w-48 h-48 bg-pink-500/20 rounded-full blur-3xl"></div>
      </div>
      <WarningModal
        isOpen={warningOpen}
        onClose={() => setWarningOpen(false)}
        title="로그인 실패"
        message={error}
      />
    </div>
  );
};

export default LoginPage;
