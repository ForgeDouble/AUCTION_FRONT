import { useState, useEffect } from "react";
import {
  Search,
  Clock,
  TrendingUp,
  ArrowRight,
  Award,
  Shield,
  ShoppingBag,
  Shirt,
  Microwave,
  Tent,
  Refrigerator,
  ToyBrick,
  Bike,
  Book,
  type LucideIcon,
  AlertCircle,
} from "lucide-react";
import { fetchParentCategories, fetchTop3Products } from "./HomeApi";
import type { ParentCategoriesDto, Top3ProductDto } from "./HomeDto";
import { useNavigate } from "react-router-dom";
import PlaceHolder from "@/components/PlaceHolder";
import dayjs from "dayjs";
import { handleApiError } from "@/errors/HandleApiError";
import { ApiError } from "@/errors/Errors";

const Home = () => {
  const navigate = useNavigate();

  /* 입찰수 상위 3개 상품들 */
  const [products, setProducts] = useState<Top3ProductDto[]>([]);
  /* 부모 카테고리들 */
  const [parentCategories, setParentCategories] = useState<
    ParentCategoriesDto[]
  >([]);

  const [productsError, setProductsError] = useState<string>("");
  const [categoriesError, setCategoriesError] = useState<string>("");
  // 각 경매의 남은 시간을 관리하는 state
  const [timers, setTimers] = useState<
    Record<number, { hours: number; minutes: number; seconds: number }>
  >({});

  /** 카테고리 아이콘 */
  const categoryIcons: Record<string, LucideIcon> = {
    전자제품: Microwave,
    "패션/잡화": Shirt,
    "생활/가전": Refrigerator,
    "취미/레저": Tent,
    컬렉터블: ToyBrick,
    "자동차/오토바이": Bike,
    "도서/음반/영화": Book,
  };

  /** 타이머 핸들러 */
  const calculateTimeLeft = (endTime: string) => {
    const now = dayjs();
    const end = dayjs(endTime);
    const diff = end.diff(now, "second");

    if (diff <= 0) {
      return { hours: 0, minutes: 0, seconds: 0 };
    }

    const hours = Math.floor(diff / 3600);
    const minutes = Math.floor((diff % 3600) / 60);
    const seconds = diff % 60;

    return { hours, minutes, seconds };
  };

  /* 입찰수 상위 3개 상품들 조회 */
  const loadTop3Products = async () => {
    try {
      // throw new ApiError(500, "INTERNAL_SERVER_ERROR", "test");

      const data = await fetchTop3Products();
      const response = data.result;
      setProducts(response);
    } catch (error: unknown) {
      const result = handleApiError(error);
      console.error(result);

      setProductsError(
        result.type === "ERROR"
          ? result.message
          : "상품 데이터를 불러오는 중 오류가 발생했습니다.",
      );
    }
  };

  /* 부모 카테고리 조회 */
  const loadParentCategories = async () => {
    try {
      // throw new ApiError(500, "INTERNAL_SERVER_ERROR", "test");

      const data = await fetchParentCategories();
      const categoryResponse = data.result;
      setParentCategories(categoryResponse);
    } catch (error: unknown) {
      const result = handleApiError(error);
      console.error(result);

      setCategoriesError(
        result.type === "ERROR"
          ? result.message
          : "카테고리 데이터를 불러오는 중 오류가 발생했습니다.",
      );
    }
  };

  // 모든 경매의 타이머 업데이트
  useEffect(() => {
    if (products.length === 0) return;

    // 초기 시간 설정
    const initialTimers: Record<
      number,
      { hours: number; minutes: number; seconds: number }
    > = {};
    products.forEach((product) => {
      if (product.auctionEndTime) {
        initialTimers[product.productId] = calculateTimeLeft(
          product.auctionEndTime,
        );
      }
    });
    setTimers(initialTimers);

    // 1초마다 업데이트
    const timer = setInterval(() => {
      const updatedTimers: Record<
        number,
        { hours: number; minutes: number; seconds: number }
      > = {};
      products.forEach((product) => {
        if (product.auctionEndTime) {
          updatedTimers[product.productId] = calculateTimeLeft(
            product.auctionEndTime,
          );
        }
      });
      setTimers(updatedTimers);
    }, 1000);

    return () => clearInterval(timer);
  }, [products]);

  useEffect(() => {
    loadTop3Products();
    loadParentCategories();
  }, []);

  return (
    <div className="min-h-screen bg-gray-50">
      <section className="border-b border-gray-200 bg-gray-50">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 pt-28 pb-20">
          <div className="flex flex-col items-center text-center gap-10">
            <span className="text-xs tracking-[0.2em] uppercase text-gray-400">
              Premium Auction Platform
            </span>

            {/* 메인 타이틀 */}
            <div className="space-y-4">
              <h1 className="text-4xl md:text-5xl font-bold text-gray-900 leading-tight">
                경매의 새로운{" "}
                <span className="text-[rgb(118,90,255)]">차원</span>
              </h1>

              <p className="text-base md:text-lg text-gray-600 max-w-3xl mx-auto">
                전 세계 희귀한 아이템들을 실시간으로 경매하세요. 안전하고 투명한
                거래로 꿈꿔왔던 아이템을 손에 넣을 수 있는 프리미엄 경매
                플랫폼입니다.
              </p>
            </div>

            {/* 검색바 */}
            <div className="w-full max-w-2xl">
              <div className="relative">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 h-5 w-5" />
                <input
                  type="text"
                  placeholder="원하는 아이템을 검색해보세요..."
                  className="w-full pl-12 pr-28 py-3.5 rounded-2xl bg-white border border-gray-200 text-gray-900 placeholder-gray-400 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500/60 shadow-sm"
                />
                <button className="absolute right-2 top-1/2 -translate-y-1/2 px-6 py-2 rounded-xl bg-[rgb(118,90,255)] text-white text-sm font-semibold hover:bg-[rgb(90,58,252)] transition-colors cursor-pointer">
                  검색
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 라이브 경매 섹션 */}
      <section className="py-16">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row gap-10 items-start">
            {/* 추천 아이템 리스트 */}
            <div className="flex-1">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h2 className="text-xl md:text-2xl font-semibold text-gray-900">
                    지금 진행 중인 핫한 경매
                  </h2>
                  <p className="text-sm text-gray-500 mt-1">
                    놓치면 아쉬운 프리미엄 아이템들
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {productsError ? (
                  <div className="col-span-full bg-red-50 border border-red-200 rounded-2xl p-8 text-center">
                    <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-3" />
                    <p className="text-red-700 font-medium mb-1">
                      데이터를 불러올 수 없습니다
                    </p>
                    <p className="text-sm text-red-600">{productsError}</p>
                    <button
                      onClick={loadTop3Products}
                      className="mt-4 px-6 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors cursor-pointer"
                    >
                      다시 시도
                    </button>
                  </div>
                ) : products.length === 0 ? (
                  <div className="col-span-full bg-gray-50 border border-gray-200 rounded-2xl p-8 text-center">
                    <p className="text-gray-500">진행 중인 경매가 없습니다</p>
                  </div>
                ) : (
                  products.map((item) => (
                    <div
                      key={item.productId}
                      className="bg-white border border-gray-100 rounded-2xl overflow-hidden shadow-sm hover:shadow-md hover:-translate-y-1 transition-all duration-200"
                    >
                      <div className="relative">
                        {item.previewImageUrl ? (
                          <img
                            src={item.previewImageUrl}
                            alt={item.productName}
                            className="w-full h-40 object-cover"
                          />
                        ) : (
                          <PlaceHolder />
                        )}
                        <div className="absolute top-3 right-3 bg-gray-900/80 text-white px-2.5 py-1 rounded-full text-[11px] font-medium flex items-center">
                          <Clock className="h-3 w-3 mr-1" />
                          {timers[item.productId]
                            ? `${timers[item.productId].hours}:${String(
                                timers[item.productId].minutes,
                              ).padStart(2, "0")}:${String(
                                timers[item.productId].seconds,
                              ).padStart(2, "0")}`
                            : "0:00:00"}
                        </div>
                      </div>
                      <div className="p-4">
                        <h3 className="text-sm font-semibold text-gray-900 mb-2 line-clamp-2">
                          {item.productName}
                        </h3>
                        <div className="flex justify-between items-center mb-3">
                          <div>
                            <div className="text-[11px] text-gray-500 mb-0.5">
                              현재 입찰가
                            </div>
                            <div className="text-lg font-semibold text-[rgb(118,90,255)]">
                              {item.latestBidAmount}
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="text-[11px] text-gray-500 mb-0.5">
                              입찰 수
                            </div>
                            <div className="text-sm font-semibold text-gray-900">
                              {item.bidCount}개
                            </div>
                          </div>
                        </div>
                        <button
                          onClick={() =>
                            navigate(`/auction_detail/${item.productId}`)
                          }
                          className="w-full bg-[rgb(118,90,255)] text-white py-2 rounded-xl hover:bg-[rgb(90,58,252)] text-sm font-medium cursor-pointer transition-colors"
                        >
                          입찰 참여하기
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 카테고리 섹션 */}
      <section className="py-16 bg-white border-y border-gray-100">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h2 className="text-2xl font-semibold text-gray-900">
                인기 카테고리
              </h2>
              <p className="text-sm text-gray-500 mt-1">
                관심 있는 분야의 아이템을 빠르게 찾아보세요.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-6">
            {categoriesError ? (
              <div className="col-span-full bg-red-50 border border-red-200 rounded-2xl p-8 text-center">
                <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-3" />
                <p className="text-red-700 font-medium mb-1">
                  데이터를 불러올 수 없습니다
                </p>
                <p className="text-sm text-red-600">{categoriesError}</p>
                <button
                  onClick={loadParentCategories}
                  className="mt-4 px-6 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors cursor-pointer"
                >
                  다시 시도
                </button>
              </div>
            ) : parentCategories.length === 0 ? (
              <div className="col-span-full bg-gray-50 border border-gray-200 rounded-2xl p-8 text-center">
                <p className="text-gray-500">카테고리 정보가 없습니다</p>
              </div>
            ) : (
              parentCategories.map((category, index) => {
                const IconComponent =
                  categoryIcons[category.categoryName] || ShoppingBag;
                return (
                  <div
                    key={index}
                    onClick={() =>
                      navigate(
                        `/auction_list?categoryId=${category.categoryId}`,
                      )
                    }
                    className="bg-gray-50 border border-gray-100 rounded-2xl px-4 py-5 text-center hover:bg-white hover:shadow-sm transition-all duration-150 cursor-pointer"
                  >
                    <div className="flex justify-center mb-3">
                      <IconComponent className="text-3xl text-gray-700" />
                    </div>

                    <h3 className="text-sm font-semibold text-gray-900 mb-1">
                      {category.categoryName}
                    </h3>
                    <p className="text-xs text-gray-500">
                      {category.productCount}개
                    </p>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </section>

      {/* 특징 섹션 */}
      <section className="py-16 bg-gray-50">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-2xl md:text-3xl font-semibold text-gray-900 mb-3">
              AuctionHub이 제공하는 경험
            </h2>
            <p className="text-sm md:text-base text-gray-600">
              안전성과 편의성을 동시에 만족시키는 경매 환경을 제공합니다.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="bg-white border border-gray-100 rounded-2xl p-6 text-center shadow-sm">
              <div className="w-12 h-12 rounded-full bg-[rgb(118,90,255)] text-white flex items-center justify-center mx-auto mb-4">
                <Shield className="h-6 w-6" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                안전한 거래 구조
              </h3>
              <p className="text-sm text-gray-600">
                에스크로 기반 정산과 철저한 본인 인증으로 사기 없는 거래 환경을
                유지합니다.
              </p>
            </div>

            <div className="bg-white border border-gray-100 rounded-2xl p-6 text-center shadow-sm">
              <div className="w-12 h-12 rounded-full bg-[rgb(118,90,255)] text-white flex items-center justify-center mx-auto mb-4">
                <TrendingUp className="h-6 w-6" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                실시간 입찰 경험
              </h3>
              <p className="text-sm text-gray-600">
                초 단위로 반영되는 입찰 정보와 직관적인 UI로 라이브 경매의
                긴장감을 그대로 전달합니다.
              </p>
            </div>

            <div className="bg-white border border-gray-100 rounded-2xl p-6 text-center shadow-sm">
              <div className="w-12 h-12 rounded-full bg-[rgb(118,90,255)] text-white flex items-center justify-center mx-auto mb-4">
                <Award className="h-6 w-6" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                검증된 아이템
              </h3>
              <p className="text-sm text-gray-600">
                전문가 검수와 이력 관리로, 신뢰할 수 있는 프리미엄 아이템만
                선별하여 제공합니다.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA 섹션 */}
      <section className="py-16 bg-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-gray-50 rounded-3xl px-8 py-10 md:px-12 md:py-12 text-center text-gray-900 border border-gray-100 shadow-xl">
            <h2 className="text-2xl md:text-3xl font-semibold mb-4">
              지금 바로 AuctionHub와 함께하세요
            </h2>
            <p className="text-sm md:text-base text-gray-600 mb-8">
              몇 번의 클릭만으로 회원가입을 완료하고, 첫 번째 프리미엄 경매를
              시작해보세요.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <button
                onClick={() => navigate(`/register`)}
                className="px-8 py-3 rounded-xl bg-[rgb(118,90,255)] text-white text-sm font-semibold hover:bg-[rgb(90,58,252)] cursor-pointer transition-colors"
              >
                회원가입
                <ArrowRight className="inline-block ml-2 h-4 w-4" />
              </button>
              <button
                onClick={() => {
                  navigate(`auction_list`);
                }}
                className="px-8 py-3 rounded-xl bg-gray-600 border text-sm font-semibold text-gray-100 hover:bg-gray-800 cursor-pointer transition-colors"
              >
                경매 둘러보기
              </button>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Home;
