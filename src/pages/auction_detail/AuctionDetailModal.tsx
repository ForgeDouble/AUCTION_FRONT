import React, { useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { X } from "lucide-react";
import AuctionDetail from "./AuctionDetail";

const AuctionDetailModal: React.FC = () => {
  const navigate = useNavigate();

  const close = useCallback(() => {
    navigate(-1);
  }, [navigate]);

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") close();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [close]);

  return (
    <div
      className="fixed inset-0 z-[9999] bg-black/70 flex items-center justify-center"
      onMouseDown={close}
      role="dialog"
      aria-modal="true"
    >
      <div
        className="relative w-[70vw] h-[95vh] rounded-2xl overflow-hidden shadow-2xl"
        onMouseDown={(e) => e.stopPropagation()}
      >
        {/* 닫기 버튼 (X 아이콘) */}
      < button 
        onClick={close} 
        className="absolute top-3 right-3 z-[10000] w-10 h-10 rounded-full bg-black/60 hover:bg-black/80 text-white flex items-center justify-center" 
        aria-label="닫기" 
        title="닫기 (ESC)" 
      >
        <X className="w-5 h-5" />
      </button>

        {/* 내용(스크롤 가능) */}
        <div className="w-full h-full overflow-y-auto">
          <AuctionDetail />
        </div>
      </div>
    </div>
  );
};

export default AuctionDetailModal;
