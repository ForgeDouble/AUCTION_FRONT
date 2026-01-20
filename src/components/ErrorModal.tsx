import { X, AlertCircle } from "lucide-react";
import { createPortal } from "react-dom";
import { useEffect } from "react";

interface ErrorModalProps {
  message?: string;
  onClose?: () => void;
}

export default function ErrorModal({
  message = "오류가 발생했습니다.",
  onClose,
}: ErrorModalProps) {
  // 모달이 열릴 때 배경 스크롤 방지
  useEffect(() => {
    document.body.style.overflow = "hidden";

    return () => {
      document.body.style.overflow = "unset";
    };
  }, []);

  const handleClose = () => {
    if (onClose) onClose();
  };

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

        {/* 에러 아이콘 */}
        <div className="flex flex-col items-center text-center mb-6">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mb-4">
            <AlertCircle className="w-10 h-10 text-red-500" />
          </div>
          <h2 className="text-2xl font-bold text-gray-800 mb-2">오류</h2>
          <p className="text-gray-600">{message}</p>
        </div>

        {/* 확인 버튼 */}
        <div className="flex justify-center">
          <button
            onClick={handleClose}
            className="px-8 py-3 bg-red-600 text-white font-semibold rounded-lg hover:bg-red-700 transition-colors cursor-pointer"
          >
            확인
          </button>
        </div>
      </div>
    </div>
  );

  return createPortal(modalContent, document.body);
}
