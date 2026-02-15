import { useEffect, useState } from "react";
import { Clock, CheckCircle, XCircle } from "lucide-react";

import { useNavigate, useSearchParams } from "react-router-dom";
import type { BidListDto, IsWinned, PageInfo, Status } from "../MyPageDto";
import RenderPagination from "../components/RenderPagination";
import { useModal } from "@/contexts/ModalContext";
import { fetchBidsByUser } from "./MyBidListApi";
import { handleApiError } from "@/errors/HandleApiError";
import { useAuth } from "@/hooks/useAuth";

const MyBidlist = () => {
  const { showLogin } = useModal();
  const { logout } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  const [bids, setBids] = useState<BidListDto[]>([]);
  const [currentPage, setCurrentPage] = useState(
    parseInt(searchParams.get("page") || "0"),
  );
  const [pageInfo, setPageInfo] = useState<PageInfo>({
    totalElements: 0,
    totalPages: 0,
    currentPage: 0,
    size: 10,
  });
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string>("");
  const [selectedStatus, setSelectedStatus] = useState<Status | null>(null);
  const navigate = useNavigate();

  const getStatusInfo = (status: string, isWinned: IsWinned) => {
    switch (status) {
      case "READY":
        return {
          badge: "대기중",
          bgColor: "bg-blue-100",
          textColor: "text-blue-600",
          borderColor: "border-blue-300",
          icon: <Clock className="h-6 w-6" />,
          message: "경매 시작 대기중입니다",
        };
      case "PROCESSING":
        return {
          badge: "진행중",
          bgColor: "bg-yellow-100",
          textColor: "text-yellow-600",
          borderColor: "border-yellow-300",
          icon: <Clock className="h-6 w-6" />,
          message: "현재 경매가 진행중입니다",
        };
      case "SELLED":
        if (isWinned === "Y") {
          return {
            badge: "낙찰",
            bgColor: "bg-[rgb(230,226,253)]",
            textColor: "text-[rgb(118,90,255)]",
            borderColor: "border-[rgb(194,182,255)]",
            icon: <CheckCircle className="h-6 w-6" />,
            message: "경매가 낙찰되었습니다",
          };
        }
        return {
          badge: "낙찰실패",
          bgColor: "bg-gray-100",
          textColor: "text-gray-600",
          borderColor: "border-gray-300",
          icon: <XCircle className="h-6 w-6" />,
          message: "낙찰에 실패했습니다",
        };
      case "NOTSELLED":
        return {
          badge: "유찰",
          bgColor: "bg-gray-100",
          textColor: "text-gray-600",
          borderColor: "border-gray-300",
          icon: <XCircle className="h-6 w-6" />,
          message: "경매가 유찰되었습니다",
        };
      default:
        return {
          badge: "알 수 없음",
          bgColor: "bg-gray-100",
          textColor: "text-gray-600",
          borderColor: "border-gray-300",
          icon: <Clock className="h-6 w-6" />,
          message: "",
        };
    }
  };

  /* URL 쿼리 파라미터 업데이트 */
  const updateURLParams = (params: Record<string, string | number>) => {
    const newSearchParams = new URLSearchParams(searchParams);

    Object.entries(params).forEach(([key, value]) => {
      if (
        value !== null &&
        value !== undefined &&
        value !== "" &&
        value !== 0
      ) {
        newSearchParams.set(key, value.toString());
      } else {
        newSearchParams.delete(key);
      }
    });

    setSearchParams(newSearchParams);
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat("ko-KR").format(price) + "원";
  };

  const formatDateTime = (datetime: string) => {
    const date = datetime.split("T")[0].replace(/-/g, ".");
    const time = datetime.split("T")[1].split(".")[0];
    return { date, time };
  };

  const handleNavigateToDetail = (productId: number) => {
    navigate(`/auction_detail/${productId}`);
  };

  const handleNavigateToPayment = (productId: number) => {
    navigate(`/payment/${productId}`);
  };

  /** 입찰 목록 조회 */
  const loadBidsByUser = async (
    page: number = 0,
    size: number = 10,
    status: Status | null = null,
  ) => {
    try {
      setLoading(true);
      const token = localStorage.getItem("accessToken");
      if (token == null) {
        showLogin("confirm");
        logout();
        return;
      }
      const data = await fetchBidsByUser(token, page, size, status);
      setBids(data.result.content);
      setPageInfo({
        totalElements: data.result.totalElements,
        totalPages: data.result.totalPages,
        currentPage: page,
        size: data.result.size,
      });
      setCurrentPage(page);
    } catch (error: unknown) {
      const result = handleApiError(error);
      console.error(result);

      switch (result.type) {
        case "AUTH":
          showLogin("confirm");
          logout();
          break;
        default:
          setError("입찰 목록을 조회하지 못했습니다");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleStatusFilter = (status: Status | null) => {
    setSelectedStatus(status);
    setCurrentPage(0);
    updateURLParams({ page: 0, status: status || "" });
    loadBidsByUser(0, 10, status);
  };

  const handlePageChange = (newPage: number) => {
    if (isNaN(newPage) || newPage < 0) {
      return;
    }
    setCurrentPage(newPage);
    updateURLParams({ page: newPage, status: selectedStatus || "" });
    loadBidsByUser(newPage, pageInfo.size || 10, selectedStatus);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  useEffect(() => {
    const pageParam = searchParams.get("page");
    const raw = searchParams.get("status");
    const statusParam: Status | null =
      raw === "READY" ||
      raw === "PROCESSING" ||
      raw === "SELLED" ||
      raw == "NOTSELLED"
        ? raw
        : null;

    const initialPage = pageParam ? parseInt(pageParam) : 0;
    const initialStatus = statusParam || null;

    setCurrentPage(initialPage);
    setSelectedStatus(initialStatus);
    loadBidsByUser(initialPage, 10, initialStatus);
  }, []);

  return (
    <div className="min-h-screen bg-gray-50 pt-24 pb-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          <div className="lg:col-span-4">
            <div className="bg-white backdrop-blur-lg rounded-2xl border border-black/10 p-8 shadow-xl">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold text-gray-900">입찰 내역</h2>
                {pageInfo.totalElements > 0 && (
                  <span className="text-gray-600 text-sm">
                    총 {pageInfo.totalElements}개
                  </span>
                )}
              </div>

              {/* 필터 탭 (선택사항) */}
              <div className="flex gap-2 mb-6 flex-wrap">
                <button
                  onClick={() => handleStatusFilter(null)}
                  className={`px-4 py-2 rounded-lg text-sm font-semibold cursor-pointer ${
                    selectedStatus === null
                      ? "bg-[rgb(118,90,255)] text-white"
                      : "bg-white/5 border border-gray-400 text-gray-900 hover:bg-white/10"
                  } transition-colors`}
                >
                  전체
                </button>
                <button
                  onClick={() => handleStatusFilter("PROCESSING")}
                  className={`px-4 py-2 rounded-lg text-sm font-semibold cursor-pointer ${
                    selectedStatus === "PROCESSING"
                      ? "bg-[rgb(118,90,255)] text-white"
                      : "bg-white/5 border border-gray-400 text-gray-900 hover:bg-white/10"
                  } transition-colors`}
                >
                  진행중
                </button>
                <button
                  onClick={() => handleStatusFilter("SELLED")}
                  className={`px-4 py-2 rounded-lg text-sm font-semibold cursor-pointer ${
                    selectedStatus === "SELLED"
                      ? "bg-[rgb(118,90,255)] text-white"
                      : "bg-white/5 border border-gray-400 text-gray-900 hover:bg-white/10"
                  } transition-colors`}
                >
                  낙찰
                </button>
                <button
                  onClick={() => handleStatusFilter("NOTSELLED")}
                  className={`px-4 py-2 rounded-lg text-sm font-semibold cursor-pointer ${
                    selectedStatus === "NOTSELLED"
                      ? "bg-[rgb(118,90,255)] text-white"
                      : "bg-white/5 border border-gray-400 text-gray-900 hover:bg-white/10"
                  } transition-colors`}
                >
                  유찰
                </button>
              </div>

              {loading ? (
                <div className="flex justify-center items-center py-12">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-500"></div>
                </div>
              ) : error ? (
                <div className="text-center py-16">
                  <XCircle className="h-16 w-16 text-red-700 mx-auto mb-4" />
                  <p className="text-gray-900 text-lg mb-2 font-semibold">
                    {error}
                  </p>
                  <p className="text-gray-500 text-sm">
                    잠시 후 다시 시도해주세요
                  </p>
                </div>
              ) : (
                <>
                  <div className="space-y-4">
                    {(bids || []).map((bid) => {
                      const statusInfo = getStatusInfo(
                        bid.status,
                        bid.isWinned,
                      );
                      const { date, time } = formatDateTime(bid.bidCreatedAt);

                      return (
                        <div
                          key={bid.bidId}
                          className={`bg-white/5 rounded-xl p-5 border border-gray-200 hover: transition-all duration-300 hover:transform hover:scale-[1.02]`}
                        >
                          <div className="flex items-start justify-between gap-4">
                            {/* 왼쪽: 이미지 + 정보 */}
                            <div className="flex items-start gap-4 flex-1">
                              {/* 상품 이미지 */}
                              <div className="relative flex-shrink-0">
                                {bid.imgUrl ? (
                                  <img
                                    src={bid.imgUrl}
                                    alt={bid.productName}
                                    className="w-20 h-20 object-cover rounded-lg border border-black/20"
                                  />
                                ) : (
                                  <div className="w-20 h-20 bg-gradient-to-br from-[rgb(118,90,255)]/20 to-blue-500/20 rounded-lg flex items-center justify-center border border-black/10">
                                    <span className="text-white/50 text-xs">
                                      No Image
                                    </span>
                                  </div>
                                )}

                                {/* 상태 아이콘 오버레이 */}
                                <div
                                  className={`absolute -top-2 -right-2 ${statusInfo.bgColor} ${statusInfo.textColor} rounded-full`}
                                >
                                  {statusInfo.icon}
                                </div>
                              </div>

                              {/* 상품 정보 */}
                              <div className="flex-1 min-w-0">
                                <h3 className="text-gray-900 font-semibold text-lg mb-1 truncate">
                                  {bid.productName}
                                </h3>

                                <div className="flex items-center gap-3 mb-2">
                                  <span className="text-gray-600 text-sm">
                                    입찰가:
                                  </span>
                                  <span className="text-xl font-bold text-gray-900">
                                    {formatPrice(bid.bidAmount)}
                                  </span>
                                </div>
                              </div>
                            </div>

                            {/* 오른쪽: 상태 뱃지 + 시간 */}
                            <div className="text-right flex-shrink-0">
                              <span
                                className={`inline-block px-4 py-2 rounded-full text-sm font-bold border ${statusInfo.borderColor} ${statusInfo.bgColor} ${statusInfo.textColor} mb-2`}
                              >
                                {statusInfo.badge}
                              </span>
                              <p className="text-gray-600 text-sm">{date}</p>
                              <p className="text-gray-900 text-xs">{time}</p>
                            </div>
                          </div>

                          {/* 추가 액션 버튼 (상태에 따라) */}
                          <div className="mt-4 pt-4 border-t border-white/10">
                            {bid.status === "READY" && (
                              <div className="flex items-center justify-between">
                                <span className="text-sm text-gray-600">
                                  {statusInfo.message}
                                </span>
                                {/* <button
                                          onClick={() => handleNavigateToDetail(bid.productId)}
                                          className="px-4 py-2 bg-yellow-100 hover:bg-yellow-200 text-yellow-600 rounded-lg text-sm font-semibold transition-colors cursor-pointer border border-yellow-300"
                                        >
                                          재입찰하기
                                        </button> */}
                              </div>
                            )}

                            {bid.status === "PROCESSING" &&
                              bid.isWinned == "N" && (
                                <div className="flex items-center justify-between">
                                  <span className="text-sm text-gray-600">
                                    {statusInfo.message}
                                  </span>
                                  <button
                                    onClick={() =>
                                      handleNavigateToDetail(bid.productId)
                                    }
                                    className="px-4 py-2 bg-yellow-100 hover:bg-yellow-200 text-yellow-600 rounded-lg text-sm font-semibold transition-colors cursor-pointer border border-yellow-300"
                                  >
                                    재입찰하기
                                  </button>
                                </div>
                              )}

                            {bid.status === "SELLED" && bid.isWinned == "Y" && (
                              <div className="flex items-center justify-between">
                                <span className="text-sm text-gray-600 font-semibold">
                                  {statusInfo.message}
                                </span>
                                <button
                                  onClick={() =>
                                    handleNavigateToPayment(bid.productId)
                                  }
                                  className={`px-4 py-2 bg ${statusInfo.bgColor} hover:bg-[rgb(214,206,255)] text ${statusInfo.textColor} rounded-lg text-sm font-semibold transition-colors cursor-pointer border ${statusInfo.borderColor}`}
                                >
                                  결제하기
                                </button>
                              </div>
                            )}

                            {((bid.status === "SELLED" &&
                              bid.isWinned == "N") ||
                              bid.status === "NOTSELLED") && (
                              <div className="flex items-center justify-between">
                                <span className="text-sm text-gray-600 font-semibold">
                                  {statusInfo.message}
                                </span>
                                <button
                                  onClick={() =>
                                    handleNavigateToDetail(bid.productId)
                                  }
                                  className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-900 rounded-lg text-sm transition-colors cursor-pointer border border-gray-300"
                                >
                                  상세보기
                                </button>
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {(!bids || bids.length === 0) && (
                    <div className="text-center py-16">
                      <Clock className="h-16 w-16 text-gray-600 mx-auto mb-4" />
                      <p className="text-gray-400 text-lg mb-2">
                        입찰 내역이 없습니다
                      </p>
                      <p className="text-gray-500 text-sm">
                        관심있는 경매에 입찰해보세요!
                      </p>
                    </div>
                  )}

                  <RenderPagination
                    currentPage={currentPage}
                    totalPages={pageInfo.totalPages}
                    onPageChange={handlePageChange}
                    loading={loading}
                  />
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MyBidlist;
