// components/WarningModal.tsx
import { useEffect } from "react";

interface WarningModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  message: string | null;
}

export const WarningModal = ({
  isOpen,
  onClose,
  title = "알림",
  message,
}: WarningModalProps) => {
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
    }

    return () => {
      document.body.style.overflow = "unset";
    };
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center"
      style={{ backgroundColor: "rgba(0, 0, 0, 0.6)" }}
      onClick={onClose}
    >
      <div
        className="bg-white rounded-lg shadow-xl p-6 w-96 max-w-[90%]"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 className="text-xl font-bold mb-4 text-gray-800">{title}</h2>
        <p className="text-gray-600 mb-6">{message}</p>
        <div className="flex justify-end">
          <button
            onClick={onClose}
            className="px-6 py-2 bg-purple-500 text-white rounded hover:bg-purple-600 transition-colors"
          >
            확인
          </button>
        </div>
      </div>
    </div>
  );
};
