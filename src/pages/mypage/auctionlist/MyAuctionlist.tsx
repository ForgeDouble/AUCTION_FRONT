import { useEffect, useState } from "react";
import { Clock, Eye, Gavel, PackageX, CheckCircle2 } from "lucide-react"; // 아이콘 일부 변경 및 추가
import { fetchProductsByUser } from "../MyPageApi";
import { useNavigate, useSearchParams } from "react-router-dom";
import type { PageInfo, ProductListDto } from "../MyPageDto";
import RenderPagination from "../components/RenderPagination";
import { useModal } from "@/contexts/ModalContext";

// 포인트 컬러 상수
const POINT_COLOR = "rgb(118,90,255)";

// Placeholder image component (그라데이션 제거, 심플한 그레이 톤)
const PlaceholderImg = () => (
  <div className="w-full h-48 bg-gray-100 flex items-center justify-center rounded-t-xl">
    <span className="text-gray-400 font-medium">No Image</span>
  </div>
);

const MyAuctionlist = () => {
  const { showLogin, showError } = useModal();
  const [searchParams, setSearchParams] = useSearchParams();
  const [products, setProducts] = useState<ProductListDto[]>([]);
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

  // 뱃지 스타일을 모던하고 플랫하게 변경
  const getStatusBadge = (status: string) => {
    switch (status) {
      case "READY":
        return {
          text: "준비중",
          bgClass: "bg-blue-50",
          textClass: "text-blue-600",
          icon: <Clock className="w-4 h-4 mr-1" />,
        };
      case "PROCESSING":
        return {
          text: "진행중",
          bgClass: "bg-[#765AFF]/10", // 포인트 컬러의 연한 배경
          textClass: "text-[#765AFF]", // 포인트 컬러 텍스트
          icon: <Gavel className="w-4 h-4 mr-1" />,
        };
      case "NOTSELLED":
        return {
          text: "유찰",
          bgClass: "bg-gray-100",
          textClass: "text-gray-500",
          icon: <PackageX className="w-4 h-4 mr-1" />,
        };
      case "SELLED":
        return {
          text: "낙찰",
          bgClass: "bg-green-50",
          textClass: "text-green-600",
          icon: <CheckCircle2 className="w-4 h-4 mr-1" />,
        };
      default:
        return {
          text: "알 수 없음",
          bgClass: "bg-gray-100",
          textClass: "text-gray-400",
          icon: null,
        };
    }
  };

  /* URL 쿼리 파라미터 업데이트 */
  const updateURLParams = (params: Record<string, string | number>) => {
    const newSearchParams = new URLSearchParams(searchParams);
    Object.entries(params).forEach(([key, value]) => {
      if (value !== null && value !== undefined && value !== "" && value !== 0) {
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

  const loadProductsByUser = async (page: number = 0, size: number = 10) => {
    try {
      setLoading(true);
      const token = localStorage.getItem("accessToken");
      if (token == null) {
        showLogin();
        return;
      }

      const data = await fetchProductsByUser(token, page, size);
      setProducts(data.result.content);
      setPageInfo({
        totalElements: Number(data.result.totalElements) || 0,
        totalPages: Number(data.result.totalPages) || 0,
        currentPage: page,
        size: Number(data.result.size) || 10,
      });
      setCurrentPage(page);
    } catch (error) {
      console.error(error);
      showError();
    } finally {
      setLoading(false);
    }
  };

  const handlePageChange = (newPage: number) => {
    if (isNaN(newPage) || newPage < 0 || newPage >= pageInfo.totalPages) return;
    setCurrentPage(newPage);
    updateURLParams({ page: newPage });
    loadProductsByUser(newPage, pageInfo.size || 10);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  useEffect(() => {
    loadProductsByUser(0, 10);
  }, []);

  return (
    <div className="min-h-screen bg-gray-50 pt-24 pb-12 font-sans">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          <div className="lg:col-span-4">
            {/* 메인 컨테이너: 깔끔한 화이트 보드 스타일 */}
            <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-8">
              <div className="flex justify-between items-end mb-8 border-b border-gray-100 pb-4">
                <div>
                  <h2 className="text-2xl font-bold text-gray-900 mb-1">
                    내가 등록한 경매
                  </h2>
                  <p className="text-gray-500 text-sm">
                    등록하신 물품의 경매 진행 상황을 확인하세요.
                  </p>
                </div>
                {pageInfo.totalElements > 0 && (
                  <span className="text-[#765AFF] font-bold text-lg">
                    {pageInfo.totalElements}
                    <span className="text-gray-400 text-sm font-normal ml-1">
                      Items
                    </span>
                  </span>
                )}
              </div>

              {loading ? (
                <div className="flex justify-center items-center py-24">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#765AFF]"></div>
                </div>
              ) : (
                <>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
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
                          className={`group relative bg-white rounded-2xl border border-gray-100 transition-all duration-300 overflow-hidden flex flex-col
                            ${
                              isClickable
                                ? "cursor-pointer hover:shadow-lg hover:-translate-y-1 hover:border-[#765AFF]/30"
                                : "opacity-80 cursor-not-allowed bg-gray-50/50"
                            }`}
                        >
                          {/* 이미지 영역 */}
                          <div className="relative h-48 overflow-hidden bg-gray-100">
                            {product.previewImageUrl ? (
                              <img
                                src={product.previewImageUrl}
                                alt={product.productName}
                                className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                              />
                            ) : (
                              <PlaceholderImg />
                            )}
                            
                            {/* 상태 뱃지 (이미지 위 좌측 상단) */}
                            <div className="absolute top-3 left-3">
                                <div className={`flex items-center px-2.5 py-1.5 rounded-lg text-xs font-bold backdrop-blur-md shadow-sm border border-white/20
                                    ${statusBadge.bgClass} ${statusBadge.textClass} bg-opacity-90`}>
                                    {statusBadge.icon}
                                    {statusBadge.text}
                                </div>
                            </div>
                          </div>

                          {/* 컨텐츠 영역 */}
                          <div className="p-5 flex flex-col flex-1">
                            <h3 className="text-gray-900 font-bold text-lg mb-4 line-clamp-1 group-hover:text-[#765AFF] transition-colors">
                              {product.productName}
                            </h3>

                            <div className="space-y-3 mt-auto">
                              <div className="flex justify-between items-center text-sm">
                                <span className="text-gray-400">
                                  {product.status === "SELLED"
                                    ? "최종 낙찰가"
                                    : "현재 입찰가"}
                                </span>
                                <span
                                  className={`font-bold text-base ${
                                    product.status === "SELLED"
                                      ? "text-[#765AFF]"
                                      : "text-gray-900"
                                  }`}
                                >
                                  {product.latestBidAmount === 0
                                    ? "-"
                                    : formatPrice(product.latestBidAmount)}
                                </span>
                              </div>

                              <div className="flex justify-between items-center text-sm">
                                <span className="text-gray-400">입찰 횟수</span>
                                <span className="text-gray-700 font-medium bg-gray-50 px-2 py-0.5 rounded text-xs">
                                  {product.bidCount - 1}회
                                </span>
                              </div>
                            </div>

                            {/* 하단 메시지 (상태별) */}
                            <div className="mt-4 pt-3 border-t border-gray-100 min-h-[40px] flex items-center justify-center">
                                {product.status === "READY" && (
                                    <p className="text-xs text-gray-400 flex items-center">
                                        <Clock className="w-3 h-3 mr-1"/> 경매 시작 대기
                                    </p>
                                )}
                                {product.status === "PROCESSING" && (
                                    <p className="text-xs text-[#765AFF] font-medium flex items-center">
                                        <Eye className="w-3 h-3 mr-1"/> 실시간 입찰 진행중
                                    </p>
                                )}
                                {product.status === "NOTSELLED" && (
                                    <p className="text-xs text-gray-400">입찰자 없음</p>
                                )}
                                {product.status === "SELLED" && (
                                    <p className="text-xs text-green-600 font-medium">낙찰 완료</p>
                                )}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {(!products || products.length === 0) && (
                    <div className="text-center py-20 bg-gray-50 rounded-xl mt-6 border border-dashed border-gray-200">
                      <div className="text-gray-300 mb-4">
                        <PackageX className="w-12 h-12 mx-auto" />
                      </div>
                      <p className="text-gray-500 text-lg font-medium">
                        등록된 경매 물품이 없습니다.
                      </p>
                      <p className="text-gray-400 text-sm mt-1">
                        새로운 경매를 시작해보세요!
                      </p>
                    </div>
                  )}

                  <div className="mt-8">
                    <RenderPagination
                      currentPage={currentPage}
                      totalPages={pageInfo.totalPages}
                      onPageChange={handlePageChange}
                      loading={loading}
                    />
                  </div>
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