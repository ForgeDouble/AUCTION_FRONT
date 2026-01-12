import { useEffect, useState } from "react";
import { Clock, CheckCircle, XCircle, TrendingUp } from "lucide-react";
import { fetchBidsByUser } from "../MyPageApi";
import { useNavigate, useSearchParams } from "react-router-dom";
import type { BidListDto, PageInfo } from "../MyPageDto";
import RenderPagination from "../components/RenderPagination";

const MyBidlist = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [bids, setBids] = useState<BidListDto[]>([]);
  const [currentPage, setCurrentPage] = useState(
    parseInt(searchParams.get("page") || "0")
  );
  const [pageInfo, setPageInfo] = useState<PageInfo>({
    totalElements: 0,
    totalPages: 0,
    currentPage: 0,
    size: 10,
  });
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const getStatusInfo = (status: string, isWinning?: boolean) => {
    switch (status) {
      case "READY":
        return {
          badge: "대기중",
          bgColor: "bg-blue-500/20",
          textColor: "text-blue-400",
          borderColor: "border-blue-500/30",
          icon: <Clock className="h-5 w-5" />,
          message: "경매 시작 대기 중",
        };
      case "PROCESSING":
        if (isWinning) {
          return {
            badge: "최고가",
            bgColor: "bg-green-500/20",
            textColor: "text-green-400",
            borderColor: "border-green-500/30",
            icon: <TrendingUp className="h-5 w-5" />,
            message: "현재 최고 입찰가입니다",
          };
        }
        return {
          badge: "진행중",
          bgColor: "bg-yellow-500/20",
          textColor: "text-yellow-400",
          borderColor: "border-yellow-500/30",
          icon: <Clock className="h-5 w-5" />,
          message: "더 높은 입찰가가 있습니다",
        };
      case "SELLED":
        if (isWinning) {
          return {
            badge: "낙찰",
            bgColor: "bg-purple-500/20",
            textColor: "text-purple-400",
            borderColor: "border-purple-500/30",
            icon: <CheckCircle className="h-5 w-5" />,
            message: "축하합니다! 낙찰되었습니다",
          };
        }
        return {
          badge: "낙찰실패",
          bgColor: "bg-gray-500/20",
          textColor: "text-gray-400",
          borderColor: "border-gray-500/30",
          icon: <XCircle className="h-5 w-5" />,
          message: "다른 입찰자가 낙찰받았습니다",
        };
      case "NOTSELLED":
        return {
          badge: "유찰",
          bgColor: "bg-gray-500/20",
          textColor: "text-gray-400",
          borderColor: "border-gray-500/30",
          icon: <XCircle className="h-5 w-5" />,
          message: "경매가 유찰되었습니다",
        };
      default:
        return {
          badge: "알 수 없음",
          bgColor: "bg-gray-500/20",
          textColor: "text-gray-400",
          borderColor: "border-gray-500/30",
          icon: <Clock className="h-5 w-5" />,
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

  const loadBidsByUser = async (page: number = 0, size: number = 10) => {
    try {
      setLoading(true);
      const token = localStorage.getItem("accessToken");
      const data = await fetchBidsByUser(token, page, size);
      setBids(data.result.content);
      setPageInfo({
        totalElements: data.result.totalElements,
        totalPages: data.result.totalPages,
        currentPage: page,
        size: data.result.size,
      });
      setCurrentPage(page);
      console.log(data.result);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handlePageChange = (newPage: number) => {
    if (isNaN(newPage) || newPage < 0) {
      return;
    }
    setCurrentPage(newPage);
    updateURLParams({ page: newPage });
    loadBidsByUser(newPage, pageInfo.size || 10);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  useEffect(() => {
    loadBidsByUser(0, 10);
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-black pt-24 pb-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          <div className="lg:col-span-4">
            <div className="bg-black/40 backdrop-blur-lg rounded-2xl border border-white/10 p-8">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold text-white">입찰 내역</h2>
                {pageInfo.totalElements > 0 && (
                  <span className="text-gray-400 text-sm">
                    총 {pageInfo.totalElements}개
                  </span>
                )}
              </div>

              {/* 필터 탭 (선택사항) */}
              <div className="flex gap-2 mb-6 flex-wrap">
                <button className="px-4 py-2 bg-purple-600 text-white rounded-lg text-sm font-semibold">
                  전체
                </button>
                <button className="px-4 py-2 bg-white/5 text-gray-300 rounded-lg text-sm hover:bg-white/10 transition-colors">
                  진행중
                </button>
                <button className="px-4 py-2 bg-white/5 text-gray-300 rounded-lg text-sm hover:bg-white/10 transition-colors">
                  낙찰
                </button>
                <button className="px-4 py-2 bg-white/5 text-gray-300 rounded-lg text-sm hover:bg-white/10 transition-colors">
                  종료
                </button>
              </div>

              {loading ? (
                <div className="flex justify-center items-center py-12">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-500"></div>
                </div>
              ) : (
                <>
                  <div className="space-y-4">
                    {(bids || []).map((bid) => {
                      const statusInfo = getStatusInfo(
                        bid.status,
                        bid.isWinning
                      );
                      const { date, time } = formatDateTime(bid.bidCreatedAt);

                      return (
                        <div
                          key={bid.bidId}
                          className={`bg-white/5 rounded-xl p-5 border ${statusInfo.borderColor} hover:border-purple-500 transition-all duration-300 hover:transform hover:scale-[1.02]`}
                        >
                          <div className="flex items-start justify-between gap-4">
                            {/* 왼쪽: 이미지 + 정보 */}
                            <div className="flex items-start gap-4 flex-1">
                              {/* 상품 이미지 */}
                              <div className="relative flex-shrink-0">
                                {bid.previewImageUrl ? (
                                  <img
                                    src={bid.previewImageUrl}
                                    alt={bid.productName}
                                    className="w-20 h-20 object-cover rounded-lg"
                                  />
                                ) : (
                                  <div className="w-20 h-20 bg-gradient-to-br from-purple-500/20 to-pink-500/20 rounded-lg flex items-center justify-center">
                                    <span className="text-white/50 text-xs">
                                      No Image
                                    </span>
                                  </div>
                                )}

                                {/* 상태 아이콘 오버레이 */}
                                <div
                                  className={`absolute -top-2 -right-2 ${statusInfo.bgColor} ${statusInfo.textColor} p-1.5 rounded-full border-2 border-gray-900`}
                                >
                                  {statusInfo.icon}
                                </div>
                              </div>

                              {/* 상품 정보 */}
                              <div className="flex-1 min-w-0">
                                <h3 className="text-white font-semibold text-lg mb-1 truncate">
                                  {bid.productName}
                                </h3>

                                <div className="flex items-center gap-3 mb-2">
                                  <span className="text-gray-400 text-sm">
                                    입찰가:
                                  </span>
                                  <span className="text-xl font-bold text-purple-400">
                                    {formatPrice(bid.bidAmount)}
                                  </span>
                                </div>

                                {/* 상태 메시지 */}
                                <p
                                  className={`text-sm ${statusInfo.textColor} font-medium`}
                                >
                                  {statusInfo.message}
                                </p>
                              </div>
                            </div>

                            {/* 오른쪽: 상태 뱃지 + 시간 */}
                            <div className="text-right flex-shrink-0">
                              <span
                                className={`inline-block px-4 py-2 rounded-full text-sm font-bold ${statusInfo.bgColor} ${statusInfo.textColor} mb-2`}
                              >
                                {statusInfo.badge}
                              </span>
                              <p className="text-gray-400 text-sm">{date}</p>
                              <p className="text-gray-500 text-xs">{time}</p>
                            </div>
                          </div>

                          {/* 추가 액션 버튼 (상태에 따라) */}
                          <div className="mt-4 pt-4 border-t border-white/10">
                            {bid.status === "PROCESSING" && bid.isWinning && (
                              <div className="flex items-center justify-between">
                                <span className="text-sm text-gray-400">
                                  현재 최고 입찰가를 유지 중입니다
                                </span>
                                <button
                                  onClick={() =>
                                    handleNavigateToDetail(bid.productId)
                                  }
                                  className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg text-sm font-semibold transition-colors"
                                >
                                  상세보기
                                </button>
                              </div>
                            )}

                            {bid.status === "PROCESSING" && !bid.isWinning && (
                              <div className="flex items-center justify-between">
                                <span className="text-sm text-yellow-400">
                                  더 높은 입찰을 고려해보세요
                                </span>
                                <button
                                  onClick={() =>
                                    handleNavigateToDetail(bid.productId)
                                  }
                                  className="px-4 py-2 bg-yellow-600 hover:bg-yellow-700 text-white rounded-lg text-sm font-semibold transition-colors"
                                >
                                  재입찰하기
                                </button>
                              </div>
                            )}

                            {bid.status === "SELLED" && bid.isWinning && (
                              <div className="flex items-center justify-between">
                                <span className="text-sm text-purple-400 font-semibold">
                                  🎉 낙찰을 축하드립니다!
                                </span>
                                <button
                                  onClick={() =>
                                    handleNavigateToPayment(bid.productId)
                                  }
                                  className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg text-sm font-semibold transition-colors"
                                >
                                  결제하기
                                </button>
                              </div>
                            )}

                            {((bid.status === "SELLED" && !bid.isWinning) ||
                              bid.status === "NOTSELLED") && (
                              <div className="flex items-center justify-center">
                                <button
                                  onClick={() =>
                                    handleNavigateToDetail(bid.productId)
                                  }
                                  className="px-4 py-2 bg-white/5 hover:bg-white/10 text-gray-400 rounded-lg text-sm transition-colors"
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
