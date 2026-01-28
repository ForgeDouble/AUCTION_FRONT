import { ChevronLeft, ChevronRight } from "lucide-react";

interface PaginationProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  loading?: boolean;
  maxPagesToShow?: number;
}

const RenderPagination = ({
  currentPage,
  totalPages,
  onPageChange,
  loading = false,
  maxPagesToShow = 5,
}: PaginationProps) => {
  if (totalPages <= 1) return null;

  const getPageNumbers = () => {
    const pages: number[] = [];

    // 전체 페이지가 maxPagesToShow보다 작으면 모두 표시
    if (totalPages <= maxPagesToShow) {
      for (let i = 0; i < totalPages; i++) {
        pages.push(i);
      }
      return pages;
    }

    // 현재 페이지를 중심으로 범위 계산
    const halfRange = Math.floor(maxPagesToShow / 2);
    let start = Math.max(0, currentPage - halfRange);
    const end = Math.min(totalPages - 1, start + maxPagesToShow - 1);

    // end가 최대치에 가까우면 start 재조정
    if (end === totalPages - 1) {
      start = Math.max(0, end - maxPagesToShow + 1);
    }

    for (let i = start; i <= end; i++) {
      pages.push(i);
    }

    return pages;
  };

  const pageNumbers = getPageNumbers();
  const showFirstPage = pageNumbers[0] > 0;
  const showLastPage = pageNumbers[pageNumbers.length - 1] < totalPages - 1;

  return (
    <div className="flex items-center justify-center gap-2 mt-8">
      {/* 이전 버튼 */}
      <button
        onClick={() => onPageChange(currentPage - 1)}
        disabled={currentPage === 0 || loading}
        className="p-2 rounded-lg bg-white/5 border border-black/20 text-gray-900 hover:bg-white/10 disabled:opacity-50 cursor-pointer disabled:cursor-not-allowed transition-all"
      >
        <ChevronLeft className="h-5 w-5" />
      </button>

      {/* 첫 페이지 */}
      {showFirstPage && (
        <>
          <button
            onClick={() => onPageChange(0)}
            disabled={loading}
            className="px-4 py-2 rounded-lg bg-white/5 border border-black/20 text-gray-900 hover:bg-white/10 transition-all disabled:opacity-50"
          >
            1
          </button>
          {pageNumbers[0] > 1 && <span className="text-white/50">...</span>}
        </>
      )}

      {/* 페이지 번호들 */}
      {pageNumbers.map((page) => (
        <button
          key={page}
          onClick={() => onPageChange(page)}
          disabled={loading}
          className={`px-4 py-2 rounded-lg border transition-all cursor-pointer disabled:opacity-50 ${
            page === currentPage
              ? "bg-[rgb(118,90,255)] border-[rgb(118,90,255)] text-white"
              : "bg-white/5 border-black/20 text-gray-900 hover:bg-white/10"
          }`}
        >
          {page + 1}
        </button>
      ))}

      {/* 마지막 페이지 */}
      {showLastPage && (
        <>
          {pageNumbers[pageNumbers.length - 1] < totalPages - 2 && (
            <span className="text-white/50">...</span>
          )}
          <button
            onClick={() => onPageChange(totalPages - 1)}
            disabled={loading}
            className="px-4 py-2 rounded-lg bg-white/5 border border-black/20 text-gray-900 hover:bg-white/10 transition-all disabled:opacity-50"
          >
            {totalPages}
          </button>
        </>
      )}

      {/* 다음 버튼 */}
      <button
        onClick={() => onPageChange(currentPage + 1)}
        disabled={currentPage === totalPages - 1 || loading}
        className="p-2 rounded-lg bg-white/5 border border-black/20 text-gray-900 hover:bg-white/10 disabled:opacity-50 cursor-pointer disabled:cursor-not-allowed transition-all"
      >
        <ChevronRight className="h-5 w-5" />
      </button>
    </div>
  );
};

export default RenderPagination;
