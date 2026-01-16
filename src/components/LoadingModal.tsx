import { Loader2 } from "lucide-react";
import { createPortal } from "react-dom";
import { useEffect } from "react";

interface LoadingModalProps {
  message?: string;
}

export default function LoadingModal({
  message = "처리 중입니다...",
}: LoadingModalProps) {
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
      <div className="bg-white rounded-lg shadow-xl max-w-sm w-full p-8">
        {/* 로딩 스피너 */}
        <div className="flex flex-col items-center text-center">
          <Loader2 className="w-16 h-16 text-blue-600 animate-spin mb-4" />
          <p className="text-gray-700 text-lg font-semibold">{message}</p>
        </div>
      </div>
    </div>
  );

  return createPortal(modalContent, document.body);
}
