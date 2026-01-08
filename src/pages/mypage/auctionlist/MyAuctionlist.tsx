import { useEffect, useState } from "react";
import { Clock, Eye } from "lucide-react";
import { fetchProductsByUser } from "../MyPageApi";
import { useNavigate } from "react-router-dom";
import type { PageInfo } from "../MyPageDto";
import RenderPagination from "../components/RenderPagination";

// Placeholder image component
const PlaceholderImg = () => (
  <div className="w-full h-48 bg-gradient-to-br from-purple-900/30 to-pink-900/30 flex items-center justify-center">
    <span className="text-white/50">No Image</span>
  </div>
);

interface ProductListDto {
  productId: number;
  productName: string;
  previewImageUrl?: string;
  latestBidAmount: number;
  bidCount: number;
  status: "READY" | "PROCESSING" | "NOTSELLED" | "SELLED";
  auctionEndTime?: string;
}

const MyAuctionlist = () => {
  const [products, setProducts] = useState<ProductListDto[]>([]);
  const [currentPage, setCurrentPage] = useState(0);
  const [pageInfo, setPageInfo] = useState<PageInfo>({
    totalElements: 0,
    totalPages: 0,
    currentPage: 0,
    size: 10,
  });
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "READY":
        return {
          text: "준비중",
          bgColor: "bg-blue-500",
          textColor: "text-white",
        };
      case "PROCESSING":
        return {
          text: "진행중",
          bgColor: "bg-green-500",
          textColor: "text-white",
        };
      case "NOTSELLED":
        return {
          text: "유찰",
          bgColor: "bg-gray-500",
          textColor: "text-white",
        };
      case "SELLED":
        return {
          text: "낙찰",
          bgColor: "bg-purple-500",
          textColor: "text-white",
        };
      default:
        return {
          text: "알 수 없음",
          bgColor: "bg-gray-400",
          textColor: "text-white",
        };
    }
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat("ko-KR").format(price) + "원";
  };

  const loadProductsByUser = async (page: number = 0, size: number = 10) => {
    try {
      setLoading(true);
      const token = localStorage.getItem("accessToken");
      const data = await fetchProductsByUser(token, page, size);
      setProducts(data.result.content);
      setPageInfo({
        totalElements: Number(data.result.totalElements) || 0,
        totalPages: Number(data.result.totalPages) || 0,
        currentPage: page, // 명시적으로 숫자 변환
        size: Number(data.result.size) || 10,
      });
      setCurrentPage(page);
      console.log(data);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handlePageChange = (newPage: number) => {
    // 유효성 검사
    if (isNaN(newPage) || newPage < 0 || newPage >= pageInfo.totalPages) {
      return;
    }

    setCurrentPage(newPage);
    loadProductsByUser(newPage, pageInfo.size || 10);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  useEffect(() => {
    loadProductsByUser(0, 10);
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-black pt-24 pb-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          <div className="lg:col-span-4">
            <div className="bg-black/40 backdrop-blur-lg rounded-2xl border border-white/10 p-8">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold text-white">
                  내가 등록한 경매
                </h2>
                {pageInfo.totalElements > 0 && (
                  <span className="text-gray-400 text-sm">
                    총 {pageInfo.totalElements}개
                  </span>
                )}
              </div>

              {loading ? (
                <div className="flex justify-center items-center py-12">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-500"></div>
                </div>
              ) : (
                <>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {(products || []).map((product) => {
                      const statusBadge = getStatusBadge(product.status);
                      const isClickable = product.status !== "READY";

                      return (
                        <div
                          key={product.productId}
                          onClick={(e) => {
                            e.stopPropagation();
                            if (isClickable) {
                              navigate(`/auction_detail/${product.productId}`);
                            }
                          }}
                          className={`bg-white/5 rounded-xl p-4 border border-white/10 transition-all ${
                            isClickable
                              ? "hover:border-purple-500 cursor-pointer hover:transform hover:scale-105"
                              : "opacity-60 cursor-not-allowed"
                          }`}
                        >
                          <div className="relative mb-3">
                            {product.previewImageUrl ? (
                              <img
                                src={product.previewImageUrl}
                                alt={product.productName}
                                className="w-full h-48 object-cover rounded-lg"
                              />
                            ) : (
                              <PlaceholderImg />
                            )}

                            {/* 상태 오버레이 */}
                            {(product.status === "READY" ||
                              product.status === "NOTSELLED" ||
                              product.status === "SELLED") && (
                              <div className="absolute inset-0 bg-black/70 rounded-lg flex items-center justify-center">
                                <div className="text-center">
                                  {product.status === "READY" ? (
                                    <>
                                      <Clock className="h-8 w-8 text-white mx-auto mb-2" />
                                      <span className="text-white text-lg font-bold">
                                        {statusBadge.text}
                                      </span>
                                    </>
                                  ) : (
                                    <>
                                      <Eye className="h-8 w-8 text-white mx-auto mb-2" />
                                      <span className="text-white text-lg font-bold">
                                        {statusBadge.text}
                                      </span>
                                    </>
                                  )}
                                </div>
                              </div>
                            )}

                            {/* 상태 뱃지 - 우측 상단 */}
                            <div
                              className={`absolute top-3 right-3 ${statusBadge.bgColor} ${statusBadge.textColor} px-3 py-1 rounded-full text-xs font-bold`}
                            >
                              {statusBadge.text}
                            </div>
                          </div>

                          <h3 className="text-white font-semibold mb-3 line-clamp-2">
                            {product.productName}
                          </h3>

                          <div className="space-y-2">
                            <div className="flex justify-between items-center text-sm">
                              <span className="text-gray-400">
                                {product.status === "SELLED"
                                  ? "낙찰가"
                                  : "현재가"}
                              </span>
                              <span
                                className={`font-bold ${
                                  product.status === "SELLED"
                                    ? "text-purple-400"
                                    : product.status === "NOTSELLED"
                                    ? "text-gray-400"
                                    : "text-green-400"
                                }`}
                              >
                                {product.latestBidAmount === 0
                                  ? "입찰 없음"
                                  : formatPrice(product.latestBidAmount)}
                              </span>
                            </div>

                            <div className="flex justify-between items-center text-sm">
                              <span className="text-gray-400">입찰 수</span>
                              <span className="text-white font-semibold">
                                {product.bidCount - 1}건
                              </span>
                            </div>

                            {product.status === "READY" && (
                              <div className="mt-3 pt-3 border-t border-white/10">
                                <p className="text-xs text-gray-400 text-center">
                                  경매 시작 대기 중
                                </p>
                              </div>
                            )}

                            {product.status === "NOTSELLED" && (
                              <div className="mt-3 pt-3 border-t border-white/10">
                                <p className="text-xs text-gray-400 text-center">
                                  입찰자가 없어 유찰되었습니다
                                </p>
                              </div>
                            )}

                            {product.status === "SELLED" && (
                              <div className="mt-3 pt-3 border-t border-white/10">
                                <p className="text-xs text-purple-400 text-center font-semibold">
                                  낙찰 완료
                                </p>
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {(!products || products.length === 0) && (
                    <div className="text-center py-12">
                      <p className="text-gray-400 text-lg">
                        등록한 경매가 없습니다
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

export default MyAuctionlist;
