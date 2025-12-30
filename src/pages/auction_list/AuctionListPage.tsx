import React, { useState, useEffect, useMemo } from "react";
import {
  Gavel,
  Search,
  Filter,
  Clock,
  Heart,
  Eye,
  Star,
  ChevronDown,
  Grid3X3,
  List,
  TrendingUp,
  Calendar,
  Users,
  MapPin,
} from "lucide-react";
import dayjs from "dayjs";
import {
  fetchParentCategories,
  fetchProducts,
  fetchWishlistByUser,
} from "./AuctionListApi";
import {
  type ProductListDto,
  type ParentCategoriesDto,
  type categoryDto,
  type wishlistDto,
} from "./AuctionListDto";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { fetchCreateWishlist, fetchDeleteWishlist } from "@/api/wishListApi";

const AuctionListPage = () => {
  // const navigate = useNavigate(); // 실제 사용 시 주석 해제
  const { userEmail } = useAuth();
  const [viewMode, setViewMode] = useState("grid"); // 'grid' or 'list'
  const [sortBy, setSortBy] = useState("newest");
  const [filterOpen, setFilterOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<number>(0);
  const [priceRange, setPriceRange] = useState([0, 10000000]);
  /* 경매 상품들 */
  const [auctions, setAuctions] = useState<ProductListDto[]>([]);
  /* 부모 카테고리들 */
  const [parentCategories, setParentCategories] = useState<
    ParentCategoriesDto[]
  >([]);
  /* 사용자의 찜한 경매들 */
  const [wishlist, setWishlist] = useState<wishlistDto[]>([]);
  /* 경매 상태 필터 */
  const [selectedStatuses, setSelectedStatuses] = useState<string[]>([]);
  // 각 경매의 남은 시간을 관리하는 state
  const [timers, setTimers] = useState<
    Record<number, { hours: number; minutes: number; seconds: number }>
  >({});

  const [currentPage, setCurrentPage] = useState(0);
  const [pageSize, setPageSize] = useState(9);
  const [totalPages, setTotalPages] = useState(0);
  const [totalElements, setTotalElements] = useState(0);

  const navigate = useNavigate();

  // 샘플 경매 데이터 예시
  // const auctions = [
  //   {
  //     id: 1,
  //     title: "1960년대 빈티지 롤렉스 서브마리너",
  //     image:
  //       "https://images.unsplash.com/photo-1522312346375-d1a52e2b99b3?w=400",
  //     currentBid: 850000,
  //     startingBid: 500000,
  //     timeLeft: "2시간 15분",
  //     bids: 23,
  //     watchers: 156,
  //     category: "시계",
  //     location: "서울",
  //     seller: "빈티지컬렉터",
  //     rating: 4.9,
  //     status: "진행중",
  //     endTime: new Date(Date.now() + 2 * 60 * 60 * 1000),
  //     featured: true,
  //   }
  //]

  /** 상태 체크박스 핸들러 */
  const handleStatusChange = (status: string) => {
    setSelectedStatuses((prev) => {
      if (prev.includes(status)) {
        return prev.filter((s) => s !== status);
      } else {
        return [...prev, status];
      }
    });
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat("ko-KR").format(price) + "원";
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

  const getStatusColor = (status) => {
    switch (status) {
      case "마감임박":
        return "bg-red-500";
      case "진행중":
        return "bg-green-500";
      default:
        return "bg-blue-500";
    }
  };
  // 필터 백엔드 처리
  // const filteredAuctions = auctions.filter((auction) => {
  //   const matchesSearch = auction.productName
  //     .toLowerCase()
  //     .includes(searchQuery.toLowerCase());
  //   const matchesCategory =
  //     selectedCategory === 0 ||
  //     auction.path.some((category) => category.categoryId === selectedCategory);
  //   // auction.category === selectedCategory;
  //   const matchesPrice = true;
  //   // auction.currentBid >= priceRange[0] &&
  //   // auction.currentBid <= priceRange[1];
  //   return matchesSearch && matchesCategory && matchesPrice;
  // });

  // 찜 목록을 Set으로 변환 (성능 최적화)
  const wishlistProductIds = useMemo(
    () => new Set(wishlist.map((item) => item.productId)),
    [wishlist]
  );

  const isWishlisted = (productId: number) => {
    return wishlistProductIds.has(productId);
  };

  /* 위시리스트 버튼 토글 함수 */
  const handleWishlistToggle = async (productId: number) => {
    try {
      if (isWishlisted(productId)) {
        // 찜 제거
        const item = wishlist.find((w) => w.productId === productId);
        if (item) {
          await handleDeleteWishlist(item.wishlistId);
          setWishlist((prev) => prev.filter((w) => w.productId !== productId));
        }
      } else {
        // 찜 추가
        await handleCreateWishlist(productId);
        await loadWishlistByUser();
      }
    } catch (error) {
      console.error(error);
    }
  };

  /* 모든 상품 조회 */
  const loadProductList = async (page = 0, size = 9) => {
    try {
      const sortParam = getSortParam(sortBy);

      // 쿼리 파라미터 구성
      const params = new URLSearchParams({
        page: page.toString(),
        size: size.toString(),
        sortBy: sortParam,
      });
      // 카테고리 필터 추가 (전체가 아닐 때만)
      if (selectedCategory !== 0) {
        params.append("categoryId", selectedCategory.toString());
      }

      // 검색어 추가
      if (searchQuery.trim()) {
        params.append("search", searchQuery.trim());
      }

      // 가격 범위 추가 (기본값이 아닐 때만)
      if (priceRange[0] > 0) {
        params.append("minPrice", priceRange[0].toString());
      }
      if (priceRange[1] < 10000000) {
        params.append("maxPrice", priceRange[1].toString());
      }

      if (selectedStatuses.length > 0) {
        selectedStatuses.forEach((status) => {
          params.append("statuses", status);
        });
      }

      const data = await fetchProducts(params); // fetchProducts 수정 필요

      setAuctions(data.result.content);
      setTotalPages(data.result.totalPages);
      setTotalElements(data.result.totalElements);
      setCurrentPage(data.result.number);
    } catch (error) {
      console.error(error);
    }
  };

  /* sortBy state를 API 파라미터로 변환하는 함수 */
  const getSortParam = (sortBy: string): string => {
    switch (sortBy) {
      case "ending_soon":
        return "ENDING_SOON";
      case "most_bids":
        return "MOST_BIDS";
      case "price_low":
        return "PRICE_ASC";
      case "price_high":
        return "PRICE_DESC";
      case "newest":
      default:
        return "NEWEST";
    }
  };

  /* 페이지 변경 핸들러 */
  const handlePageChange = (newPage: number) => {
    if (newPage >= 0 && newPage < totalPages) {
      setCurrentPage(newPage);
      loadProductList(newPage, pageSize);
      window.scrollTo({ top: 0, behavior: "smooth" }); // 페이지 상단으로 스크롤
    }
  };

  /* 부모 카테고리 조회 */
  const loadParentCategories = async () => {
    try {
      const data = await fetchParentCategories();
      const categoryResponse = data.result;
      // 모든 카테고리의 productCount 합계 계산
      const totalCount = categoryResponse.reduce(
        (sum: number, cat: ParentCategoriesDto) => {
          return sum + (cat.productCount || 0);
        },
        0
      );

      // "전체" 카테고리를 맨 앞에 추가
      setParentCategories([
        {
          categoryId: 0,
          categoryName: "전체",
          productCount: totalCount,
          children: [],
        },
        ...categoryResponse,
      ]);

      // setParentCategories(data.result);
    } catch (error) {
      console.error(error);
    } finally {
      // setLoading(false);
    }
  };
  /* 위시리스트 생성 */
  const handleCreateWishlist = async (productId: number) => {
    try {
      const token = localStorage.getItem("accessToken");
      if (token == null) {
        alert("로그인이 필요합니다.");
        throw Error("No Token");
        return;
      }
      const data = await fetchCreateWishlist(token, productId);
      console.log(data);
      // setParentCategories(data.result);
    } catch (error) {
      console.error(error);
    } finally {
      // setLoading(false);
    }
  };

  /* 위시리스트 삭제 */
  const handleDeleteWishlist = async (wishlistId: number) => {
    try {
      const token = localStorage.getItem("accessToken");
      if (token == null) {
        alert("로그인이 필요합니다.");
        throw Error("No Token");
        return;
      }
      const data = await fetchDeleteWishlist(token, wishlistId);
      console.log(data);
      // setParentCategories(data.result);
    } catch (error) {
      console.error(error);
    } finally {
      // setLoading(false);
    }
  };
  /* 사용자의 위시리스트 조회 */
  const loadWishlistByUser = async () => {
    try {
      const token = localStorage.getItem("accessToken");
      const data = await fetchWishlistByUser(token);
      setWishlist(data.result);

      // setParentCategories(data.result);
    } catch (error) {
      console.error(error);
    } finally {
      // setLoading(false);
    }
  };
  useEffect(() => {
    loadProductList(0, pageSize);
    loadParentCategories();
    loadWishlistByUser();
  }, []);

  // 모든 경매의 타이머 업데이트
  useEffect(() => {
    if (auctions.length === 0) return;

    // 초기 시간 설정
    const initialTimers: Record<
      number,
      { hours: number; minutes: number; seconds: number }
    > = {};
    auctions.forEach((auction) => {
      if (auction.auctionEndTime) {
        initialTimers[auction.productId] = calculateTimeLeft(
          auction.auctionEndTime
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
      auctions.forEach((auction) => {
        if (auction.auctionEndTime) {
          updatedTimers[auction.productId] = calculateTimeLeft(
            auction.auctionEndTime
          );
        }
      });
      setTimers(updatedTimers);
    }, 1000);

    return () => clearInterval(timer);
  }, [auctions]);

  // sortBy 변경 시 첫 페이지로 이동하며 재조회
  useEffect(() => {
    loadProductList(0, pageSize);
  }, [sortBy, selectedCategory, selectedStatuses, searchQuery]);

  return (
    <div className="min-h-screen bg-slate-800">
      <div className="max-w-7xl mx-auto px-4 py-20">
        {/* 페이지 헤더 */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-white mb-4">진행 중인 경매</h1>
          <p className="text-gray-300 text-lg">
            전 세계 희귀한 아이템들을 만나보세요
          </p>
        </div>

        <div className="flex flex-col lg:flex-row gap-8">
          {/* 사이드바 필터 */}
          <div className="lg:w-64 flex-shrink-0 relative z-50">
            <div className="bg-white/10 backdrop-blur-lg border border-white/20 rounded-2xl p-6 sticky top-24">
              <h3 className="text-xl font-bold text-white mb-6 flex items-center">
                <Filter className="h-5 w-5 mr-2" />
                필터
              </h3>

              {/* 카테고리 */}
              <div className="mb-6">
                <h4 className="text-white font-semibold mb-3">카테고리</h4>
                <div className="space-y-2">
                  {parentCategories.map((category) => (
                    <div key={category.categoryId} className="relative group">
                      <div
                        onClick={() => setSelectedCategory(category.categoryId)}
                        className="flex items-center cursor-pointer p-2 hover:bg-white/10 rounded transition-colors"
                      >
                        <span
                          className={`flex-1 ${
                            selectedCategory === category.categoryId
                              ? "text-purple-400 font-semibold"
                              : "text-gray-300"
                          }`}
                        >
                          {category.categoryName}
                        </span>
                        <span className="text-purple-400 text-sm">
                          {category.productCount}
                        </span>
                        {category.children && category.children.length > 0 && (
                          <ChevronDown className="h-4 w-4 text-gray-400 ml-2" />
                        )}
                      </div>

                      {/* 자식 카테고리 드롭다운 */}
                      {category.children && category.children.length > 0 && (
                        <div className="hidden group-hover:block absolute left-full top-0 w-48 z-[100]">
                          {/* 보이지 않는 연결 브릿지 */}
                          <div className="absolute right-full w-2 h-full"></div>
                          <div className="ml-2 bg-slate-900 border border-white/20 rounded-lg p-2 shadow-xl">
                            {category.children.map((child) => (
                              <div
                                key={child.categoryId}
                                onClick={() =>
                                  setSelectedCategory(child.categoryId)
                                }
                                className="flex items-center cursor-pointer p-2 hover:bg-white/10 rounded transition-colors"
                              >
                                <span
                                  className={`text-sm flex-1 ${
                                    selectedCategory === child.categoryId
                                      ? "text-purple-400 font-semibold"
                                      : "text-gray-300"
                                  }`}
                                >
                                  {child.categoryName}
                                </span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* 가격 범위 */}
              {/* <div className="mb-6">
                <h4 className="text-white font-semibold mb-3">가격 범위</h4>
                <div className="space-y-3">
                  <div className="flex items-center space-x-2">
                    <input
                      type="number"
                      placeholder="최소"
                      value={priceRange[0]}
                      onChange={(e) =>
                        setPriceRange([
                          parseInt(e.target.value) || 0,
                          priceRange[1],
                        ])
                      }
                      className="w-24  px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white text-sm"
                    />
                    <span className="text-gray-400">~</span>
                    <input
                      type="number"
                      placeholder="최대"
                      value={priceRange[1]}
                      onChange={(e) =>
                        setPriceRange([
                          priceRange[0],
                          parseInt(e.target.value) || 10000000,
                        ])
                      }
                      className="w-24 px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white text-sm"
                    />
                  </div>
                </div>
              </div> */}

              {/* 상태 */}
              <div className="mb-6">
                <h4 className="text-white font-semibold mb-3">경매 상태</h4>
                <div className="space-y-2">
                  <label className="flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      className="mr-3 text-purple-500"
                      checked={selectedStatuses.includes("READY")}
                      onChange={() => handleStatusChange("READY")}
                    />
                    <span className="text-gray-300">준비중</span>
                  </label>
                  <label className="flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      className="mr-3 text-purple-500"
                      checked={selectedStatuses.includes("PROCESSING")}
                      onChange={() => handleStatusChange("PROCESSING")}
                    />
                    <span className="text-gray-300">진행중</span>
                  </label>
                  <label className="flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      className="mr-3 text-purple-500"
                      checked={
                        selectedStatuses.includes("NOTSELLED") ||
                        selectedStatuses.includes("SELLED")
                      }
                      onChange={() => {
                        if (
                          selectedStatuses.includes("NOTSELLED") ||
                          selectedStatuses.includes("SELLED")
                        ) {
                          setSelectedStatuses((prev) =>
                            prev.filter(
                              (s) => s !== "NOTSELLED" && s !== "SELLED"
                            )
                          );
                        } else {
                          setSelectedStatuses((prev) => [
                            ...prev,
                            "NOTSELLED",
                            "SELLED",
                          ]);
                        }
                      }}
                    />
                    <span className="text-gray-300">경매종료</span>
                  </label>
                </div>
              </div>
            </div>
          </div>

          {/* 메인 콘텐츠 */}
          <div className="flex-1">
            {/* 툴바 */}
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center space-x-4">
                <span className="text-gray-300">
                  총{" "}
                  <span className="text-white font-bold">{totalElements}</span>
                  개 경매
                </span>
              </div>

              <div className="flex items-center space-x-4">
                {/* 정렬 */}
                <div className="relative">
                  <select
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value)}
                    className="bg-white/10 border border-white/20 rounded-lg px-4 py-2 text-black text-sm appearance-none pr-8"
                  >
                    <option value="newest">최신순</option>
                    <option value="price_low">낮은 가격순</option>
                    <option value="price_high">높은 가격순</option>
                    <option value="most_bids">입찰 많은순</option>
                    <option value="ending_soon">마감임박순</option>
                  </select>
                  <ChevronDown className="absolute right-2 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                </div>

                {/* 뷰 모드 */}
                <div className="flex items-center bg-white/10 rounded-lg p-1">
                  <button
                    onClick={() => setViewMode("grid")}
                    className={`p-2 rounded ${
                      viewMode === "grid"
                        ? "bg-purple-600 text-white"
                        : "text-gray-400"
                    }`}
                  >
                    <Grid3X3 className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => setViewMode("list")}
                    className={`p-2 rounded ${
                      viewMode === "list"
                        ? "bg-purple-600 text-white"
                        : "text-gray-400"
                    }`}
                  >
                    <List className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </div>

            {/* 경매 목록 */}
            <div
              className={
                viewMode === "grid"
                  ? "grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6"
                  : "space-y-4"
              }
            >
              {auctions.map((auction) => (
                <div
                  key={auction.productId}
                  className={
                    viewMode === "grid"
                      ? `bg-white/10 backdrop-blur-lg border border-white/20 rounded-2xl overflow-hidden transition-all duration-300 group ${
                          auction.status === "READY"
                            ? "opacity-50 cursor-not-allowed"
                            : "hover:transform hover:scale-105"
                        }`
                      : `bg-white/10 backdrop-blur-lg border border-white/20 rounded-2xl p-6 transition-all duration-300 ${
                          auction.status === "READY"
                            ? "opacity-50 cursor-not-allowed"
                            : "hover:bg-white/15"
                        }`
                  }
                >
                  {viewMode === "grid" ? (
                    // 그리드 뷰
                    <>
                      <div className="relative">
                        <img
                          src={auction.previewImageUrl}
                          alt={auction.productName}
                          className="w-full h-48 object-cover"
                        />
                        {/* 준비중 오버레이 */}
                        {auction.status === "READY" && (
                          <div className="absolute inset-0 bg-black/70 rounded-t-xl flex items-center justify-center">
                            <div className="text-center">
                              <Clock className="h-8 w-8 text-white mx-auto mb-1" />
                              <span className="text-white text-sm font-bold">
                                준비중
                              </span>
                            </div>
                          </div>
                        )}

                        {/* NOTSELLED, SELLED 오버레이 */}

                        {(auction.status === "NOTSELLED" ||
                          auction.status === "SELLED") && (
                          <div className="absolute inset-0 bg-black/70 rounded-t-xl flex items-center justify-center">
                            <div className="text-center">
                              <Clock className="h-8 w-8 text-white mx-auto mb-1" />
                              <span className="text-white text-sm font-bold">
                                경매종료
                              </span>
                            </div>
                          </div>
                        )}

                        {/* 추천 뱃지 - 왼쪽 상단 */}
                        {/* {true && (
                          <div className="absolute top-4 left-4 bg-gradient-to-r from-yellow-500 to-orange-500 text-white px-3 py-1 rounded-full text-xs font-bold">
                            추천
                          </div>
                        )} */}

                        {/* 상태 뱃지 - 오른쪽 상단 */}

                        <div
                          className={`absolute top-4 right-4 ${getStatusColor(
                            "진행중"
                          )} text-white px-3 py-1 rounded-full text-xs font-bold flex items-center`}
                        >
                          <Clock className="h-3 w-3 mr-1" />
                          {timers[auction.productId]
                            ? `${timers[auction.productId].hours}:${String(
                                timers[auction.productId].minutes
                              ).padStart(2, "0")}:${String(
                                timers[auction.productId].seconds
                              ).padStart(2, "0")}`
                            : "0:00:00"}
                        </div>

                        {/* 하단 정보 영역 */}
                        <div className="absolute bottom-4 left-4 right-4 flex items-center justify-between">
                          {/* 하트 버튼 - 오른쪽 하단 */}
                          {userEmail !== auction.userEmail && (
                            <button
                              onClick={() =>
                                handleWishlistToggle(auction.productId)
                              }
                            >
                              {isWishlisted(auction.productId) ? (
                                <Heart
                                  fill="#ef4444"
                                  color="#ef4444"
                                  size={20}
                                />
                              ) : (
                                <Heart color="#6b7280" size={20} />
                              )}
                            </button>
                          )}
                        </div>
                      </div>
                      <div className="p-6">
                        <h3 className="text-lg font-bold text-white mb-2 line-clamp-2">
                          {auction.productName}
                        </h3>
                        <div className="flex items-center justify-between mb-4">
                          <div>
                            <div className="text-xs text-gray-400">
                              현재 입찰가
                            </div>
                            <div className="text-xl font-bold text-green-400">
                              {auction.latestBidAmount
                                ? formatPrice(auction.latestBidAmount)
                                : "0원"}
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="text-xs text-gray-400">입찰 수</div>
                            <div className="text-lg font-bold text-purple-400">
                              {auction.bidCount - 1} 개
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center justify-between mb-4 text-xs text-gray-400">
                          <div className="flex items-center">
                            <MapPin className="h-3 w-3 mr-1" />
                            지역이름
                          </div>
                          <div className="flex items-center">
                            <Star className="h-3 w-3 mr-1 text-yellow-400 fill-current" />
                            0
                          </div>
                        </div>
                        <div className="flex items-center gap-2 mb-4 text-xs text-gray-400">
                          {auction.path.map((category) => (
                            <div
                              key={category.categoryId}
                              className="px-3 py-1 bg-white/10 border border-white/20 rounded-full"
                            >
                              {category.categoryName}
                            </div>
                          ))}
                        </div>

                        <button
                          className={`px-6 py-2 rounded-xl transition-all duration-300 font-bold ${
                            auction.status === "READY"
                              ? "w-full bg-gradient-to-r from-purple-600 to-pink-600 text-white py-3 rounded-xl hover:from-purple-700 hover:to-pink-700 transition-all duration-300 font-bold cursor-not-allowed"
                              : "w-full bg-gradient-to-r from-purple-600 to-pink-600 text-white py-3 rounded-xl hover:from-purple-700 hover:to-pink-700 transition-all duration-300 font-bold cursor-pointer"
                          }`}
                          onClick={(e) => {
                            e.stopPropagation();
                            if (auction.status !== "READY") {
                              navigate(`/auction_detail/${auction.productId}`);
                            }
                          }}
                          disabled={auction.status === "READY"}
                        >
                          {auction.status === "READY" ? "준비중" : "참여하기"}
                        </button>
                      </div>
                    </>
                  ) : (
                    // 리스트 뷰
                    <div className="flex items-center space-x-6">
                      <div className="relative">
                        <img
                          src={auction.previewImageUrl}
                          alt={auction.productName}
                          className="w-32 h-24 object-cover rounded-xl"
                        />

                        {/* 준비중 오버레이 */}
                        {auction.status === "READY" && (
                          <div className="absolute inset-0 bg-black/70 rounded-xl flex items-center justify-center">
                            <div className="text-center">
                              <Clock className="h-8 w-8 text-white mx-auto mb-1" />
                              <span className="text-white text-sm font-bold">
                                준비중
                              </span>
                            </div>
                          </div>
                        )}

                        {(auction.status === "NOTSELLED" ||
                          auction.status === "SELLED") && (
                          <div className="absolute inset-0 bg-black/70 rounded-xl flex items-center justify-center">
                            <div className="text-center">
                              <Clock className="h-8 w-8 text-white mx-auto mb-1" />
                              <span className="text-white text-sm font-bold">
                                경매종료
                              </span>
                            </div>
                          </div>
                        )}
                        {/* {true && (
                          <div className="absolute -top-2 -right-2 bg-gradient-to-r from-yellow-500 to-orange-500 text-white px-2 py-1 rounded-full text-xs font-bold">
                            추천
                          </div>
                        )} */}
                      </div>
                      <div className="flex-1">
                        <h3 className="text-xl font-bold text-white mb-2">
                          {auction.productName}
                        </h3>
                        <div className="flex items-center space-x-6 mb-2">
                          <div className="flex items-center text-gray-400 text-sm">
                            <MapPin className="h-4 w-4 mr-1" />
                            "지역이름"
                          </div>
                        </div>
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-6">
                            <div>
                              <div className="text-sm text-gray-400">
                                현재 입찰가
                              </div>
                              <div className="text-2xl font-bold text-green-400">
                                {formatPrice(auction.latestBidAmount || 0)}
                              </div>
                            </div>
                            <div
                              className={`${getStatusColor(
                                "진행중"
                              )} text-white px-3 py-1 rounded-full text-sm font-bold flex items-center`}
                            >
                              <Clock className="h-4 w-4 mr-1" />
                              {timers[auction.productId]
                                ? `${timers[auction.productId].hours}:${String(
                                    timers[auction.productId].minutes
                                  ).padStart(2, "0")}:${String(
                                    timers[auction.productId].seconds
                                  ).padStart(2, "0")}`
                                : "0:00:00"}
                            </div>
                            <div className="flex items-center gap-2 mb-4 text-xs text-gray-400">
                              {auction.path.map((category) => (
                                <div
                                  key={category.categoryId}
                                  className="px-3 py-1 bg-white/10 border border-white/20 rounded-full"
                                >
                                  {category.categoryName}
                                </div>
                              ))}
                            </div>
                          </div>
                          <div className="flex items-center space-x-3">
                            {userEmail !== auction.userEmail && (
                              <button
                                className="text-gray-400 hover:text-white transition-colors p-2"
                                onClick={() =>
                                  handleWishlistToggle(auction.productId)
                                }
                              >
                                {isWishlisted(auction.productId) ? (
                                  <Heart
                                    fill="#ef4444"
                                    color="#ef4444"
                                    size={20}
                                  />
                                ) : (
                                  <Heart color="#6b7280" size={20} />
                                )}
                              </button>
                            )}

                            <button
                              className={`px-6 py-2 rounded-xl transition-all duration-300 font-bold ${
                                auction.status === "READY"
                                  ? "bg-gradient-to-r from-purple-600 to-pink-600 text-white px-6 py-2 rounded-xl hover:from-purple-700 hover:to-pink-700 transition-all duration-300 font-bold cursor-not-allowed"
                                  : "bg-gradient-to-r from-purple-600 to-pink-600 text-white px-6 py-2 rounded-xl hover:from-purple-700 hover:to-pink-700 transition-all duration-300 font-bold cursor-pointer"
                              }`}
                              onClick={(e) => {
                                e.stopPropagation();
                                if (auction.status !== "READY") {
                                  navigate(
                                    `/auction_detail/${auction.productId}`
                                  );
                                }
                              }}
                              disabled={auction.status === "READY"}
                            >
                              {auction.status === "READY"
                                ? "준비중"
                                : "참여하기"}
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>

            {/* 페이지네이션 수정 */}
            <div className="flex items-center justify-center space-x-2 mt-12">
              <button
                onClick={() => handlePageChange(currentPage - 1)}
                disabled={currentPage === 0}
                className={`px-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white transition-colors ${
                  currentPage === 0
                    ? "opacity-50 cursor-not-allowed"
                    : "hover:bg-white/20"
                }`}
              >
                이전
              </button>

              {/* 페이지 번호 버튼들 */}
              {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                // 현재 페이지 기준으로 앞뒤 2개씩 보여주기
                let pageNum;
                if (totalPages <= 5) {
                  pageNum = i;
                } else if (currentPage < 2) {
                  pageNum = i;
                } else if (currentPage > totalPages - 3) {
                  pageNum = totalPages - 5 + i;
                } else {
                  pageNum = currentPage - 2 + i;
                }

                return (
                  <button
                    key={pageNum}
                    onClick={() => handlePageChange(pageNum)}
                    className={`px-4 py-2 rounded-lg transition-colors ${
                      pageNum === currentPage
                        ? "bg-purple-600 text-white"
                        : "bg-white/10 border border-white/20 text-white hover:bg-white/20"
                    }`}
                  >
                    {pageNum + 1}
                  </button>
                );
              })}

              <button
                onClick={() => handlePageChange(currentPage + 1)}
                disabled={currentPage === totalPages - 1}
                className={`px-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white transition-colors ${
                  currentPage === totalPages - 1
                    ? "opacity-50 cursor-not-allowed"
                    : "hover:bg-white/20"
                }`}
              >
                다음
              </button>
            </div>

            {/* 페이지 정보 표시 (선택사항) */}
            <div className="text-center mt-4 text-gray-400 text-sm">
              {currentPage * pageSize + 1} -{" "}
              {Math.min((currentPage + 1) * pageSize, totalElements)} /{" "}
              {totalElements}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AuctionListPage;
