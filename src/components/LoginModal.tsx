import { X } from "lucide-react";
import { useEffect } from "react";
import { createPortal } from "react-dom";
import { useNavigate } from "react-router-dom";

interface LoginModalProps {
  onClose?: () => void;
}

export default function LoginModal({ onClose }: LoginModalProps) {
  const navigate = useNavigate();

  const handleClose = () => {
    if (onClose) onClose();
  };

  // 모달이 열릴 때 배경 스크롤 방지
  useEffect(() => {
    document.body.style.overflow = "hidden";

    return () => {
      document.body.style.overflow = "unset";
    };
  }, []);

  const modalContent = (
    <div
      className="fixed inset-0 flex items-center justify-center p-4 z-50"
      style={{ backgroundColor: "rgba(0, 0, 0, 0.6)" }}
    >
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6 relative">
        {/* X 버튼 */}
        <button
          onClick={handleClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition-colors cursor-pointer"
        >
          <X size={24} />
        </button>

        {/* 내용 */}
        <div className="text-center mb-8">
          <h2 className="text-2xl font-bold text-gray-800 mb-2">
            로그인이 필요합니다
          </h2>
          <p className="text-gray-600">이 기능을 사용하려면 로그인해주세요</p>
        </div>

        {/* 버튼들 */}
        <div className="flex gap-3">
          <button
            onClick={() => navigate(`/register`)}
            className="flex-1 py-3 bg-white text-blue-600 font-semibold border-2 border-blue-600 rounded-lg hover:bg-blue-50 transition-colors cursor-pointer"
          >
            회원가입
          </button>
          <button
            onClick={() => navigate(`/login`)}
            className="flex-1 py-3 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 transition-colors cursor-pointer"
          >
            로그인
          </button>
        </div>
      </div>
    </div>
  );

  return createPortal(modalContent, document.body);
}
