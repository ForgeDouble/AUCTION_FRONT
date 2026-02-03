import React, { useRef, useState } from "react";
import { fetchForgotPassword } from "./PasswordApi";
import { useNavigate } from "react-router-dom";
import { handleApiError } from "@/errors/HandleApiError";

const ForgotPassword = () => {
  const [email, setEmail] = useState<string>("");
  const [emailError, setEmailError] = useState<string>("");
  const [isSubmitted, setIsSubmitted] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [apiError, setApiError] = useState<string>("");

  const emailInputRef = useRef<HTMLInputElement>(null);
  const navigate = useNavigate();

  const validateEmail = (email: string) => {
    return /\S+@\S+\.\S+/.test(email);
  };

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
  ) => {
    const { name, value } = e.target;

    if (name === "email") {
      setEmailError("");
      setApiError("");
    }

    setEmail(value);
  };

  const loadForgotPassword = async () => {
    setIsLoading(true);
    setApiError("");

    try {
      const data = await fetchForgotPassword(email);
      console.log(data);

      setIsSubmitted(true);
    } catch (error: unknown) {
      const result = handleApiError(error);
      console.error(result);

      switch (result.type) {
        case "MODAL":
          setApiError(result.message);
          break;

        case "DIALOG":
          setApiError(result.message);
          break;

        default:
          setApiError("메일 전송에 실패했습니다. 다시 시도해주세요.");
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (!validateEmail(email)) {
      const msg = "유효한 이메일 형식이 아닙니다.";
      setEmailError(msg);

      setTimeout(() => {
        emailInputRef.current?.focus();
      }, 0);

      return;
    }

    loadForgotPassword();
  };

  const handleRetry = () => {
    setIsSubmitted(false);
    setIsLoading(false);
    setApiError("");
    setEmail("");
  };

  return (
    <div className="min-h-screen flex items-start justify-center bg-gray-50 px-4 pt-70">
      <div className="max-w-md w-full space-y-8 p-8 bg-white rounded-2xl shadow-lg">
        {/* 헤더 섹션 */}
        <div className="text-center">
          <h2 className="text-3xl font-extrabold text-gray-900">
            비밀번호 찾기
          </h2>
          <p className="mt-2 text-sm text-gray-600">
            가입하신 이메일 주소를 입력하시면
            <br />
            비밀번호 재설정 링크를 보내드립니다.
          </p>
        </div>

        {isLoading ? (
          /* 로딩 중 */
          <div className="mt-8 text-center animate-fade-in">
            <div className="mx-auto flex items-center justify-center h-12 w-12">
              <div className="w-12 h-12 border-4 border-gray-200 border-t-[rgb(118,90,255)] rounded-full animate-spin"></div>
            </div>
            <p className="mt-4 text-sm text-gray-700">
              메일을 전송하는 중입니다...
              <br />
              잠시만 기다려주세요.
            </p>
          </div>
        ) : isSubmitted ? (
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
            <p className="mt-4 text-sm text-gray-700">
              <strong>{email}</strong>로 메일을 보냈습니다.
              <br />
              메일함을 확인해주세요.
            </p>
            <button
              onClick={handleRetry}
              className="mt-6 text-indigo-600 hover:text-indigo-500 text-sm font-medium cursor-pointer"
            >
              다시 시도하기
            </button>
          </div>
        ) : (
          /* 입력 폼 */
          <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
            <div className="rounded-md shadow-sm -space-y-px">
              <div>
                <label htmlFor="email-address" className="sr-only">
                  이메일 주소
                </label>
                <input
                  ref={emailInputRef}
                  id="email-address"
                  name="email"
                  type="text"
                  className={`appearance-none rounded-lg relative block w-full px-3 py-3 placeholder-gray-500 text-gray-900 focus:outline-none sm:text-sm border transition-all
                        ${
                          emailError || apiError
                            ? "border-yellow-500 focus:ring-1 focus:ring-yellow-500"
                            : "border-gray-300 focus:ring-1 focus:ring-[rgb(118,90,255)] focus:border-[rgb(118,90,255)]"
                        }
                    `}
                  placeholder="example@email.com"
                  value={email}
                  onChange={handleChange}
                />
              </div>
            </div>
            {emailError && (
              <p className="mt-2 text-sm text-yellow-500">{emailError}</p>
            )}
            {apiError && (
              <p className="mt-2 text-sm text-red-500">{apiError}</p>
            )}

            <div>
              <button
                type="submit"
                className="group relative w-full flex justify-center py-3 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-[rgb(118,90,255)] cursor-pointer hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-colors"
              >
                재설정 메일 보내기
              </button>
            </div>
          </form>
        )}

        {/* 하단 네비게이션 */}
        {!isLoading && !isSubmitted && (
          <div className="text-center mt-4">
            <span
              onClick={() => navigate(`/login`)}
              className="text-sm font-medium text-gray-500 hover:text-gray-700 cursor-pointer"
            >
              로그인 페이지로 돌아가기
            </span>
          </div>
        )}
      </div>
    </div>
  );
};

export default ForgotPassword;
