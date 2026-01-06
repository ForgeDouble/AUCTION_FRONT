import React, { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import AuctionDetail from "./AuctionDetail";

const AuctionDetailModal: React.FC = () => {
  const navigate = useNavigate();

  const close = () => navigate(-1);

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") close();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  return (
    <div
      className="fixed inset-0 z-[9999] bg-black/70 flex items-center justify-center"
      onMouseDown={close}
    >
      <div
        className="relative w-[95vw] h-[95vh] rounded-2xl overflow-hidden shadow-2xl"
        onMouseDown={(e) => e.stopPropagation()}
      >
        {/* 닫기 버튼 */}
        <button
          onClick={close}
          className="absolute top-3 right-3 z-10 bg-black/60 text-white px-3 py-2 rounded-lg hover:bg-black/80"
        >
          닫기
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
