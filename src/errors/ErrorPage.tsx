import { useNavigate } from "react-router-dom";

interface ErrorPageProps {
  type: "404" | "500" | "network";
  title?: string;
  message?: string;
  onRetry?: () => void;
}

const ErrorPage = ({ type, title, message, onRetry }: ErrorPageProps) => {
  const navigate = useNavigate();

  const errorConfig = {
    "404": {
      icon: <div className="text-2xl font-extrabold text-yellow-600">404</div>,
      bgColor: "bg-yellow-100",
      defaultTitle: "페이지를 찾을 수 없습니다",
      defaultMessage: "요청하신 페이지가 존재하지 않거나 삭제되었습니다.",
    },
    "500": {
      icon: (
        <svg
          className="h-8 w-8 text-red-600"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="2"
            d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
          />
        </svg>
      ),
      bgColor: "bg-red-100",
      defaultTitle: "오류가 발생했습니다",
      defaultMessage:
        "일시적인 문제가 발생했습니다. 잠시 후 다시 시도해주세요.",
    },
    network: {
      icon: (
        <svg
          className="h-8 w-8 text-gray-600"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="2"
            d="M8.111 16.404a5.5 5.5 0 017.778 0M12 20h.01m-7.08-7.071c3.904-3.905 10.236-3.905 14.141 0M1.394 9.393c5.857-5.857 15.355-5.857 21.213 0"
          />
        </svg>
      ),
      bgColor: "bg-gray-100",
      defaultTitle: "네트워크 오류",
      defaultMessage: "인터넷 연결을 확인해주세요.",
    },
  };

  const config = errorConfig[type];

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="max-w-lg w-full text-center">
        <div className="bg-white rounded-2xl shadow-lg p-8">
          <div
            className={`mx-auto flex items-center justify-center h-16 w-16 rounded-full ${config.bgColor}`}
          >
            {config.icon}
          </div>

          <h2 className="mt-6 text-2xl font-bold text-gray-900">
            {title || config.defaultTitle}
          </h2>

          <p className="mt-2 text-sm text-gray-600">
            {message || config.defaultMessage}
          </p>

          <div className="mt-8 space-y-3">
            {onRetry && (
              <button
                onClick={onRetry}
                className="w-full py-3 px-4 bg-indigo-600 hover:bg-indigo-700 text-white font-medium rounded-lg transition-colors"
              >
                다시 시도
              </button>
            )}

            <button
              onClick={() => navigate("/")}
              className="w-full py-3 px-4 bg-white hover:bg-gray-50 text-gray-700 font-medium rounded-lg border border-gray-300 transition-colors cursor-pointer"
            >
              홈으로 돌아가기
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ErrorPage;
