import React, { useEffect, useRef, useState } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { fetchResetPassword, fetchValidateToken } from "./PasswordApi";
import { handleApiError } from "@/errors/HandleApiError";

const ResetPassword = () => {
  const [searchParams] = useSearchParams();

  const [token, setToken] = useState<string>("");
  const [newPassword, setNewPassword] = useState<string>("");
  const [confirmPassword, setConfirmPassword] = useState<string>("");
  const [passwordError, setPasswordError] = useState<string>("");
  const [confirmError, setConfirmError] = useState<string>("");
  const [isSubmitted, setIsSubmitted] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [tokenError, setTokenError] = useState<string>("");
  const [isValidatingToken, setIsValidatingToken] = useState<boolean>(true);

  const passwordInputRef = useRef<HTMLInputElement>(null);
  const confirmInputRef = useRef<HTMLInputElement>(null);

  const navigate = useNavigate();

  const validateToken = async (tokenValue: string) => {
    try {
      setIsValidatingToken(true);
      // 백엔드에 토큰 검증 요청
      await fetchValidateToken(tokenValue);
      setToken(tokenValue);
      setTokenError("");
    } catch (error: unknown) {
      // 토큰이 유효하지 않거나 만료됨
      const result = handleApiError(error);
      console.error(result);

      switch (result.type) {
        case "ERROR":
          setTokenError(result.message);
          break;

        case "DIALOG":
          setTokenError(result.message);
          break;

        default:
          setTokenError("올바르지 않은 접속입니다.");
      }
    } finally {
      setIsValidatingToken(false);
    }
  };

  useEffect(() => {
    const tokenFromUrl = searchParams.get("token");
    if (!tokenFromUrl) {
      setTokenError("유효하지 않은 링크입니다.");
      setIsValidatingToken(false);
      return;
    }
    validateToken(tokenFromUrl);
  }, [searchParams]);

  const validatePassword = (password: string) => {
    if (password.length < 8) {
      return "비밀번호는 최소 8자 이상이어야 합니다.";
    }
    if (!/(?=.*[a-zA-Z])(?=.*\d)/.test(password)) {
      return "비밀번호는 영문과 숫자를 포함해야 합니다.";
    }
    return "";
  };

  const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { value } = e.target;
    setNewPassword(value);
    setPasswordError("");
  };

  const handleConfirmChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { value } = e.target;
    setConfirmPassword(value);
    setConfirmError("");
  };

  const loadResetPassword = async () => {
    try {
      setIsLoading(true);
      const data = await fetchResetPassword(token, confirmPassword);
      setIsSubmitted(true);
      setTimeout(() => {
        navigate("/login");
      }, 5000);
      console.log(data);
    } catch (error: unknown) {
      const result = handleApiError(error);
      console.error(result);

      switch (result.type) {
        case "ERROR":
          setPasswordError(result.message);
          break;

        case "DIALOG":
          setPasswordError(result.message);
          break;

        default:
          setPasswordError(
            "서버 내부에서 오류가 발생했습니다. 고객센터에 문의하세요.",
          );
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    // 비밀번호 유효성 검사
    const passwordValidation = validatePassword(newPassword);
    if (passwordValidation) {
      setPasswordError(passwordValidation);
      setTimeout(() => {
        passwordInputRef.current?.focus();
      }, 0);
      return;
    }

    // 비밀번호 확인 검사
    if (newPassword !== confirmPassword) {
      setConfirmError("비밀번호가 일치하지 않습니다.");
      setTimeout(() => {
        confirmInputRef.current?.focus();
      }, 0);
      return;
    }

    loadResetPassword();
  };

  // 토큰 확인중
  if (isValidatingToken) {
    return (
      <div className="min-h-screen flex items-start justify-center bg-gray-50 px-4 pt-70">
        <div className="max-w-md w-full space-y-8 p-8 bg-white rounded-2xl shadow-lg">
          <div className="text-center">
            <div className="mx-auto flex items-center justify-center h-12 w-12">
              <svg
                className="animate-spin h-8 w-8 text-indigo-600"
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
              >
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                ></circle>
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                ></path>
              </svg>
            </div>
            <p className="mt-4 text-sm text-gray-600">링크 확인 중...</p>
          </div>
        </div>
      </div>
    );
  }
  // 토큰이 없는 경우
  if (tokenError) {
    return (
      <div className="min-h-screen flex items-start justify-center bg-gray-50 px-4 pt-70">
        <div className="max-w-md w-full space-y-8 p-8 bg-white rounded-2xl shadow-lg">
          <div className="text-center">
            <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-100">
              <svg
                className="h-6 w-6 text-red-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </div>
            <h2 className="mt-4 text-2xl font-bold text-gray-900">링크 오류</h2>
            <p className="mt-2 text-sm text-gray-600">
              {tokenError}
              <br />
              비밀번호 찾기를 다시 시도해주세요.
            </p>
            <div className="mt-6">
              <span
                onClick={() => navigate(`/find_password`)}
                className="text-indigo-600 hover:text-indigo-500 text-sm font-medium cursor-pointer"
              >
                비밀번호 찾기로 이동
              </span>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-start justify-center bg-gray-50 px-4 pt-70">
      <div className="max-w-md w-full space-y-8 p-8 bg-white rounded-2xl shadow-lg">
        {/* 헤더 섹션 */}
        <div className="text-center">
          <h2 className="text-3xl font-extrabold text-gray-900">
            새 비밀번호 설정
          </h2>
          <p className="mt-2 text-sm text-gray-600">
            새로운 비밀번호를 입력해주세요.
            <br />
            영문과 숫자를 포함하여 8자 이상이어야 합니다.
          </p>
        </div>

        {!isSubmitted ? (
          /* 입력 폼 */
          <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
            <div className="space-y-4">
              {/* 새 비밀번호 입력 */}
              <div>
                <label htmlFor="new-password" className="sr-only">
                  새 비밀번호
                </label>
                <input
                  ref={passwordInputRef}
                  id="new-password"
                  name="newPassword"
                  type="password"
                  className={`appearance-none rounded-lg relative block w-full px-3 py-3 placeholder-gray-500 text-gray-900 focus:outline-none sm:text-sm border transition-all
                    ${
                      passwordError
                        ? "border-yellow-500 focus:ring-1 focus:ring-yellow-500"
                        : "border-gray-300 focus:ring-1 focus:ring-[rgb(118,90,255)] focus:border-[rgb(118,90,255)]"
                    }
                  `}
                  placeholder="새 비밀번호"
                  value={newPassword}
                  onChange={handlePasswordChange}
                />
                {passwordError && (
                  <p className="mt-2 text-sm text-yellow-500">
                    {passwordError}
                  </p>
                )}
              </div>

              {/* 비밀번호 확인 입력 */}
              <div>
                <label htmlFor="confirm-password" className="sr-only">
                  비밀번호 확인
                </label>
                <input
                  ref={confirmInputRef}
                  id="confirm-password"
                  name="confirmPassword"
                  type="password"
                  className={`appearance-none rounded-lg relative block w-full px-3 py-3 placeholder-gray-500 text-gray-900 focus:outline-none sm:text-sm border transition-all
                    ${
                      confirmError
                        ? "border-yellow-500 focus:ring-1 focus:ring-yellow-500"
                        : "border-gray-300 focus:ring-1 focus:ring-[rgb(118,90,255)] focus:border-[rgb(118,90,255)]"
                    }
                  `}
                  placeholder="비밀번호 확인"
                  value={confirmPassword}
                  onChange={handleConfirmChange}
                />
                {confirmError && (
                  <p className="mt-2 text-sm text-yellow-500">{confirmError}</p>
                )}
              </div>
            </div>

            <div>
              <button
                type="submit"
                disabled={isLoading}
                className="group relative w-full flex justify-center py-3 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-[rgb(118,90,255)] cursor-pointer hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoading ? "변경 중..." : "비밀번호 변경하기"}
              </button>
            </div>
          </form>
        ) : (
          /* 성공 메시지 */
          <div className="mt-8 text-center animate-fade-in">
            <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-green-100">
              <svg
                className="h-6 w-6 text-green-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M5 13l4 4L19 7"
                />
              </svg>
            </div>
            <h3 className="mt-4 text-lg font-semibold text-gray-900">
              비밀번호가 변경되었습니다!
            </h3>
            <p className="mt-2 text-sm text-gray-600">
              새로운 비밀번호로 로그인해주세요.
              <br />
              잠시 후 로그인 페이지로 이동합니다.
            </p>
            <div className="mt-6">
              <a
                href="/login"
                className="text-indigo-600 hover:text-indigo-500 text-sm font-medium cursor-pointer"
              >
                지금 로그인하러 가기 →
              </a>
            </div>
          </div>
        )}

        {/* 하단 네비게이션 */}
        {!isSubmitted && (
          <div className="text-center mt-4">
            <a
              href="/login"
              className="text-sm font-medium text-gray-500 hover:text-gray-700"
            >
              로그인 페이지로 돌아가기
            </a>
          </div>
        )}
      </div>
    </div>
  );
};

export default ResetPassword;
