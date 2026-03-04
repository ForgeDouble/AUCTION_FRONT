import { useState, useEffect, useMemo, useRef } from "react";
import placeholderImg from "@/assets/images/PlaceHolder.jpg";
import {
  Filter,
  Clock,
  Heart,
  ChevronDown,
  Grid3X3,
  List,
  RotateCcw,
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
  type wishlistDto,
} from "./AuctionListDto";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { fetchCreateWishlist, fetchDeleteWishlist } from "@/api/wishListApi";
import { useModal } from "@/contexts/ModalContext";
import { handleApiError } from "@/errors/HandleApiError";

const AuctionListPage = () => {
  const navigate = useNavigate();
  const { showLogin, showError, showWarning, showLoading, hideLoading } =
    useModal();
  const [searchParams, setSearchParams] = useSearchParams();
  const { userEmail: authEmail, userId: authUserId, logout } = useAuth();
  const [viewMode, setViewMode] = useState("grid"); // 'grid' or 'list'

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

  const [currentPage, setCurrentPage] = useState(
    parseInt(searchParams.get("page") || "0"),
  );
  const [sortBy, setSortBy] = useState(searchParams.get("sortBy") || "newest");
  const [selectedCategory, setSelectedCategory] = useState<number>(
    parseInt(searchParams.get("categoryId") || "0"),
  );

  const [pageSize /*, setPageSize*/] = useState(9);
  const [totalPages, setTotalPages] = useState(0);
  const [totalElements, setTotalElements] = useState(0);
  const isInitialized = useRef(false);

  /* URL 쿼리 파라미터 업데이트 */
  const updateURLParams = (
    params: Record<string, string | number | string[]>,
  ) => {
    const newSearchParams = new URLSearchParams(searchParams);

    Object.entries(params).forEach(([key, value]) => {
      newSearchParams.delete(key); // 기존 값 먼저 제거
      if (Array.isArray(value)) {
        value.forEach((v) => newSearchParams.append(key, v));
      } else if (
        value !== null &&
        value !== undefined &&
        value !== "" &&
        value !== 0
      ) {
        newSearchParams.set(key, value.toString());
      }
    });

    setSearchParams(newSearchParams);
  };
  // 사용자 정보 정규화 (한 번만)
  const myEmailNorm = String(authEmail ?? "")
    .trim()
    .toLowerCase();

  // 특정 상품이 본인 상품인지 판단하는 함수
  const isSelfProduct = (auction: ProductListDto): boolean => {
    // 로그인 안 했으면 무조건 false
    if (!authUserId && !authEmail) return false;

    const sellerEmailNorm = String(auction.userEmail ?? "")
      .trim()
      .toLowerCase();

    const sameEmail =
      myEmailNorm !== "" &&
      sellerEmailNorm !== "" &&
      myEmailNorm === sellerEmailNorm;

    return sameEmail;
  };
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

  const getStatusColor = (status: string) => {
    switch (status) {
      case "마감임박":
        return "bg-red-500";
      case "진행중":
        return "bg-[rgb(118,90,255)]";
      default:
        return "bg-blue-500";
    }
  };

  // 찜 목록을 Set으로 변환 (성능 최적화)
  const wishlistProductIds = useMemo(
    () => new Set(wishlist.map((item) => item.productId)),
    [wishlist],
  );

  const isWishlisted = (productId: number) => {
    return wishlistProductIds.has(productId);
  };

  // 위시리스트 토글 (본인 상품 체크 추가)
  const handleWishlistToggle = async (auction: ProductListDto) => {
    try {
      // 본인 상품 체크
      if (isSelfProduct(auction)) {
        showWarning("본인 상품은 찜(위시리스트) 할 수 없습니다.");
        return;
      }

      if (isWishlisted(auction.productId)) {
        // 찜 제거
        const item = wishlist.find((w) => w.productId === auction.productId);
        if (item) {
          await handleDeleteWishlist(item.wishlistId);
          setWishlist((prev) =>
            prev.filter((w) => w.productId !== auction.productId),
          );
        }
      } else {
        // 찜 추가
        await handleCreateWishlist(auction.productId);
        await loadWishlistByUser();
      }
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
      updateURLParams({ page: newPage });
      loadProductList(newPage, pageSize);
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  /* 모든 상품 조회 */
  const loadProductList = async (page = 0, size = 9, statuses?: string[]) => {
    try {
      showLoading();
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

      const statusesToUse = statuses ?? selectedStatuses;
      if (statusesToUse.length > 0) {
        statusesToUse.forEach((status) => {
          params.append("statuses", status);
        });
      }

      const data = await fetchProducts(params);

      setAuctions(data.result.content);
      setTotalPages(data.result.totalPages);
      setTotalElements(data.result.totalElements);
      setCurrentPage(data.result.number);
    } catch (error: unknown) {
      const result = handleApiError(error);
      console.error(result);

      switch (result.type) {
        case "AUTH":
          showLogin("confirm");
          logout();
          break;
        default:
          showError(
            "서버 내부에서 오류가 발생했습니다. 관리자에게 문의해주세요.",
          );
      }
    } finally {
      hideLoading();
    }
  };

  /* 부모 카테고리 조회 */
  const loadParentCategories = async () => {
    try {
      showLoading();
      const data = await fetchParentCategories();
      const categoryResponse = data.result;
      // 모든 카테고리의 productCount 합계 계산
      const totalCount = categoryResponse.reduce(
        (sum: number, cat: ParentCategoriesDto) => {
          return sum + (cat.productCount || 0);
        },
        0,
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
    } catch (error: unknown) {
      const result = handleApiError(error);
      console.error(result);

      switch (result.type) {
        case "AUTH":
          showLogin("confirm");
          logout();
          break;
        default:
          showError(
            "서버 내부에서 오류가 발생했습니다. 관리자에게 문의해주세요.",
          );
      }
    } finally {
      hideLoading();
    }
  };

  /* 위시리스트 생성 */
  const handleCreateWishlist = async (productId: number | null) => {
    try {
      if (!productId) {
        showError("상품 정보를 불러올 수 없습니다.");
        return;
      }

      const token = localStorage.getItem("accessToken");
      if (!token) {
        showLogin();
        return;
      }

      await fetchCreateWishlist(token, productId);
    } catch (error: unknown) {
      const result = handleApiError(error);
      console.error(result);

      switch (result.type) {
        case "AUTH":
          showLogin("confirm");
          logout();
          break;
        case "WARNING":
          showWarning(result.message);
          break;
        default:
          showError(
            "서버 내부에서 오류가 발생했습니다. 관리자에게 문의해주세요.",
          );
      }
    }
  };

  /* 위시리스트 삭제 */
  const handleDeleteWishlist = async (wishlistId: number) => {
    // if (!canWishlist) {
    //   showWarning("본인 상품은 찜(위시리스트) 할 수 없습니다.");
    //   return;
    // }
    try {
      const token = localStorage.getItem("accessToken");
      if (!token) {
        showLogin();
        return;
      }
      await fetchDeleteWishlist(token, wishlistId);
    } catch (error: unknown) {
      const result = handleApiError(error);
      console.error(result);

      switch (result.type) {
        case "AUTH":
          showLogin("confirm");
          logout();
          break;
        default:
          showError(
            "서버 내부에서 오류가 발생했습니다. 관리자에게 문의해주세요.",
          );
      }
    }
  };

  /* 사용자의 위시리스트 조회 */
  const loadWishlistByUser = async () => {
    try {
      const token = localStorage.getItem("accessToken");
      if (token == null) {
        console.log("Missing AccessToken");
        return;
      }
      const data = await fetchWishlistByUser(token);
      setWishlist(data.result);
    } catch (error) {
      showError();
      console.error(error);
    }
  };

  const handleResetFilters = () => {
    setSelectedStatuses([]);
    setSelectedCategory(0);
    setSortBy("newest");
    setCurrentPage(0);
    setSearchParams(new URLSearchParams());
  };
  useEffect(() => {
    const pageFromURL = parseInt(searchParams.get("page") || "0");
    const categoryFromURL = parseInt(searchParams.get("categoryId") || "0");
    const sortFromURL = searchParams.get("sortBy") || "newest";
    const statusesFromURL = searchParams.getAll("statuses"); // ← 추가

    setCurrentPage(pageFromURL);
    setSelectedCategory(categoryFromURL);
    setSortBy(sortFromURL);
    setSelectedStatuses(statusesFromURL); // ← 추가

    loadParentCategories();
    loadWishlistByUser();
    loadProductList(pageFromURL, pageSize, statusesFromURL);
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
          auction.auctionEndTime,
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
            auction.auctionEndTime,
          );
        }
      });
      setTimers(updatedTimers);
    }, 1000);

    return () => clearInterval(timer);
  }, [auctions]);

  useEffect(() => {
    if (!isInitialized.current) {
      isInitialized.current = true;
      return;
    }
    updateURLParams({
      page: 0,
      sortBy,
      categoryId: selectedCategory,
      statuses: selectedStatuses,
    });
    loadProductList(0, pageSize);
  }, [sortBy, selectedCategory, selectedStatuses]);

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 py-20">
        {/* 페이지 헤더 */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            진행 중인 경매
          </h1>
          <p className="text-gray-600 text-lg">
            전 세계 희귀한 아이템들을 만나보세요
          </p>
        </div>

        <div className="flex flex-col lg:flex-row gap-8">
          {/* 사이드바 필터 */}
          <div className="lg:w-64 flex-shrink-0 relative z-50">
            <div className="bg-white/10 backdrop-blur-lg border border-black/20 rounded-2xl p-6 sticky top-24">
              <h3 className="text-xl font-bold text-gray-900 mb-6 flex items-center justify-between">
                <span className="flex items-center">
                  <Filter className="h-5 w-5 mr-2" />
                  필터
                </span>
                <button
                  onClick={handleResetFilters}
                  className="p-1.5 rounded-lg text-gray-400 hover:text-[rgb(118,90,255)] hover:bg-purple-50 transition-all"
                  title="필터 초기화"
                >
                  <RotateCcw className="h-4 w-4" />
                </button>
              </h3>

              {/* 카테고리 */}
              <div className="mb-6">
                <h4 className="text-gray-900 font-semibold mb-3">카테고리</h4>
                <div className="space-y-2">
                  {parentCategories.map((category) => (
                    <div key={category.categoryId} className="relative group">
                      <div
                        onClick={() => {
                          setSelectedCategory(category.categoryId);
                          updateURLParams({
                            categoryId: category.categoryId,
                            page: 0,
                          });
                        }}
                        className="flex items-center cursor-pointer p-2 hover:bg-white/10 rounded transition-colors"
                      >
                        <span
                          className={`flex-1 ${
                            selectedCategory === category.categoryId
                              ? "text-[rgb(118,90,255)] font-semibold"
                              : "text-gray-900"
                          }`}
                        >
                          {category.categoryName}
                        </span>
                        <span className="text-[rgb(118,90,255)] text-sm">
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
                          <div className="ml-2 bg-gray-50 border border-black/20 rounded-lg p-2 shadow-xl">
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
                                      ? "text-[rgb(118,90,255)] font-semibold"
                                      : "text-gray-600"
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
                <h4 className="text-gray-900 font-semibold mb-3">경매 상태</h4>
                <div className="space-y-2">
                  <label className="flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      className="mr-3 text-purple-500"
                      checked={selectedStatuses.includes("READY")}
                      onChange={() => handleStatusChange("READY")}
                    />
                    <span className="text-gray-600">준비중</span>
                  </label>
                  <label className="flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      className="mr-3 text-purple-500"
                      checked={selectedStatuses.includes("PROCESSING")}
                      onChange={() => handleStatusChange("PROCESSING")}
                    />
                    <span className="text-gray-600">진행중</span>
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
                              (s) => s !== "NOTSELLED" && s !== "SELLED",
                            ),
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
                    <span className="text-gray-600">경매종료</span>
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
                <span className="text-gray-600">
                  총{" "}
                  <span className="text-gray-900 font-bold">
                    {totalElements}
                  </span>
                  개 경매
                </span>
              </div>

              <div className="flex items-center space-x-4">
                {/* 정렬 */}
                <div className="relative">
                  <select
                    value={sortBy}
                    onChange={(e) => {
                      setSortBy(e.target.value);
                      updateURLParams({ sortBy: e.target.value, page: 0 });
                    }}
                    className="bg-white/10 border border-black/20 rounded-lg px-4 py-2 text-black text-sm appearance-none pr-8"
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
                        ? "bg-[rgb(118,90,255)] text-white"
                        : "text-gray-400 border border-black/20"
                    }`}
                  >
                    <Grid3X3 className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => setViewMode("list")}
                    className={`p-2 rounded ${
                      viewMode === "list"
                        ? "bg-[rgb(118,90,255)] text-white"
                        : "text-gray-400 border border-black/20"
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
              {auctions.map((auction) => {
                const isSelf = isSelfProduct(auction);

                return (
                  <div
                    key={auction.productId}
                    className={
                      viewMode === "grid"
                        ? `bg-white/10 backdrop-blur-lg border border-black/20 rounded-2xl overflow-hidden transition-all duration-300 group ${
                            auction.status === "READY" && !isSelf
                              ? "opacity-50 cursor-not-allowed"
                              : "hover:transform hover:scale-105"
                          }`
                        : `bg-white/10 backdrop-blur-lg border border-black/20 rounded-2xl p-6 transition-all duration-300 ${
                            auction.status === "READY" && !isSelf
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
                            src={auction.previewImageUrl || placeholderImg}
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
                              "진행중",
                            )} text-white px-3 py-1 rounded-full text-xs font-bold flex items-center`}
                          >
                            <Clock className="h-3 w-3 mr-1" />
                            {timers[auction.productId]
                              ? `${timers[auction.productId].hours}:${String(
                                  timers[auction.productId].minutes,
                                ).padStart(2, "0")}:${String(
                                  timers[auction.productId].seconds,
                                ).padStart(2, "0")}`
                              : "0:00:00"}
                          </div>

                          {/* 하단 정보 영역 */}
                          <div className="absolute bottom-4 left-4 right-4 flex items-center justify-between">
                            {/* 하트 버튼 - 오른쪽 하단 */}
                            {!isSelf && (
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleWishlistToggle(auction);
                                }}
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
                          <h3 className="text-lg font-bold text-gray-900 mb-2 line-clamp-1">
                            {auction.productName}
                          </h3>
                          <div className="flex items-center justify-between mb-4">
                            <div>
                              <div className="text-xs text-gray-600">
                                현재 입찰가
                              </div>
                              <div className="text-xl font-bold text-gray-900">
                                {auction.latestBidAmount
                                  ? formatPrice(auction.latestBidAmount)
                                  : "0원"}
                              </div>
                            </div>
                            <div className="text-right">
                              <div className="text-xs text-gray-600">
                                입찰 수
                              </div>
                              <div className="text-lg font-bold text-[rgb(118,90,255)] ">
                                {auction.bidCount - 1} 개
                              </div>
                            </div>
                          </div>
                          <div className="flex items-center justify-end mb-4 text-xs text-gray-600">
                            <div className="flex items-center">
                              <Heart className="h-3.5 w-3.5 mr-2 text-gray-400" />
                              {auction.wishlistCount
                                ? auction.wishlistCount
                                : 0}
                            </div>
                          </div>
                          <div className="flex items-center gap-2 mb-4 text-xs text-gray-600">
                            {auction.path.map((category) => (
                              <div
                                key={category.categoryId}
                                className="px-3 py-1 bg-white/10 border border-black/20 rounded-full"
                              >
                                {category.categoryName}
                              </div>
                            ))}
                          </div>

                          <button
                            className={`px-6 py-2 rounded-xl transition-all duration-300 font-bold ${
                              auction.status === "READY" && !isSelf
                                ? "w-full bg-[rgb(118,90,255)] text-white py-3 rounded-xl font-bold cursor-not-allowed opacity-50"
                                : "w-full bg-[rgb(118,90,255)] text-white py-3 rounded-xl hover:bg-[rgb(90,58,252)] transition-all duration-300 font-bold cursor-pointer"
                            }`}
                            onClick={(e) => {
                              e.stopPropagation();
                              if (auction.status !== "READY" || isSelf) {
                                navigate(
                                  `/auction_detail/${auction.productId}`,
                                );
                              }
                            }}
                            disabled={auction.status === "READY" && !isSelf}
                          >
                            {auction.status === "READY" && !isSelf
                              ? "준비중"
                              : "참여하기"}
                          </button>
                        </div>
                      </>
                    ) : (
                      // 리스트 뷰
                      <div className="flex items-center space-x-6">
                        {/* 왼쪽 이미지 영역 */}
                        <div className="relative">
                          <img
                            src={auction.previewImageUrl || placeholderImg}
                            alt={auction.productName}
                            className="w-32 h-24 object-cover rounded-xl border border-gray-100"
                          />

                          {/* 준비중/종료 오버레이 */}
                          {(auction.status === "READY" ||
                            auction.status === "NOTSELLED" ||
                            auction.status === "SELLED") && (
                            <div className="absolute inset-0 bg-black/70 rounded-xl flex items-center justify-center">
                              <div className="text-center">
                                <Clock className="h-8 w-8 text-white mx-auto mb-1" />
                                <span className="text-white text-sm font-bold">
                                  {auction.status === "READY"
                                    ? "준비중"
                                    : "경매종료"}
                                </span>
                              </div>
                            </div>
                          )}
                        </div>

                        {/* 오른쪽 컨텐츠 영역 */}
                        <div className="flex-1">
                          <div className="flex justify-between items-start mb-2">
                            {/* 상품명 */}
                            <h3 className="text-xl font-bold text-gray-900 line-clamp-1">
                              {auction.productName}
                            </h3>

                            {/* [변경 1] 타이머를 상단 우측으로 이동 */}
                            <div
                              className={`${getStatusColor(
                                "진행중",
                              )} text-white px-3 py-1.5 rounded-lg text-xs font-bold flex items-center shadow-sm shrink-0`}
                            >
                              <Clock className="h-3.5 w-3.5 mr-1.5" />
                              <span className="tabular-nums">
                                {timers[auction.productId]
                                  ? `${timers[auction.productId].hours}:${String(
                                      timers[auction.productId].minutes,
                                    ).padStart(2, "0")}:${String(
                                      timers[auction.productId].seconds,
                                    ).padStart(2, "0")}`
                                  : "0:00:00"}
                              </span>
                            </div>
                          </div>

                          {/* 하단 가격 및 버튼 섹션 */}
                          <div className="flex items-end justify-between mt-4">
                            {/* 좌측: 현재가 및 카테고리 */}
                            <div className="space-y-3">
                              <div>
                                <div className="text-xs text-gray-500 mb-0.5">
                                  현재 입찰가
                                </div>
                                <div className="text-2xl font-bold text-gray-900">
                                  {formatPrice(auction.latestBidAmount || 0)}
                                </div>
                              </div>

                              <div className="flex items-center gap-2 text-xs text-gray-500">
                                {auction.path.map((category) => (
                                  <div
                                    key={category.categoryId}
                                    className="px-2.5 py-1 bg-gray-50 border border-gray-200 rounded-lg"
                                  >
                                    {category.categoryName}
                                  </div>
                                ))}
                              </div>
                            </div>

                            {/* [변경 2] 지역이름과 입찰 수를 버튼 위로 배치 */}
                            <div className="flex flex-col items-end space-y-2">
                              <div className="flex items-center space-x-3 shrink-0 mb-4">
                                <div className="flex items-center text-gray-500 text-xs">
                                  <Heart className="h-3.5 w-3.5 mr-1 text-gray-400" />
                                  {auction.wishlistCount
                                    ? auction.wishlistCount
                                    : 0}
                                </div>
                                <div className="flex items-center space-x-1.5 border-l border-gray-200 pl-3">
                                  <span className="text-sm text-gray-500 uppercase">
                                    입찰수
                                  </span>
                                  <span className="text-sm font-bold text-[rgb(118,90,255)]">
                                    {auction.bidCount - 1}개
                                  </span>
                                </div>
                              </div>

                              {/* 우측 하단: 찜 + (지역/입찰수 & 버튼) */}
                              <div className="flex items-end space-x-3">
                                {!isSelf && (
                                  <button
                                    className="text-gray-400 hover:text-red-500 transition-colors p-2 mb-1"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleWishlistToggle(auction);
                                    }}
                                  >
                                    {isWishlisted(auction.productId) ? (
                                      <Heart
                                        fill="#ef4444"
                                        color="#ef4444"
                                        size={22}
                                      />
                                    ) : (
                                      <Heart color="#9ca3af" size={22} />
                                    )}
                                  </button>
                                )}

                                {/* 참여하기 버튼 */}
                                <button
                                  className={`px-6 py-2.5 rounded-xl transition-all duration-300 font-bold shadow-md min-w-[100px] ${
                                    auction.status === "READY" && !isSelf
                                      ? "bg-gray-200 text-gray-400 cursor-not-allowed shadow-none"
                                      : "bg-[rgb(118,90,255)] text-white hover:bg-[rgb(90,58,252)] hover:scale-105 active:scale-95 cursor-pointer"
                                  }`}
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    if (auction.status !== "READY" || isSelf) {
                                      navigate(
                                        `/auction_detail/${auction.productId}`,
                                      );
                                    }
                                  }}
                                  disabled={
                                    auction.status === "READY" && !isSelf
                                  }
                                >
                                  {auction.status === "READY" && !isSelf
                                    ? "준비중"
                                    : "참여하기"}
                                </button>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            {/* 페이지네이션 수정 */}
            <div className="flex items-center justify-center space-x-2 mt-12">
              <button
                onClick={() => handlePageChange(currentPage - 1)}
                disabled={currentPage === 0}
                className={`px-4 py-2 bg-white/10 border border-black/20 rounded-lg text-gray-900 transition-colors ${
                  currentPage === 0
                    ? "opacity-50 cursor-not-allowed"
                    : "hover:bg-white/20 cursor-pointer "
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
                        ? "bg-[rgb(118,90,255)] text-white cursor-pointer"
                        : "bg-white/10 border border-black/20 text-gray-900 hover:bg-white/20 cursor-pointer"
                    }`}
                  >
                    {pageNum + 1}
                  </button>
                );
              })}

              <button
                onClick={() => handlePageChange(currentPage + 1)}
                disabled={currentPage === totalPages - 1}
                className={`px-4 py-2 bg-white/10 border border-black/20 rounded-lg text-gray-900 transition-colors ${
                  currentPage === totalPages - 1
                    ? "opacity-50 cursor-not-allowed"
                    : "hover:bg-white/20 cursor-pointer "
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
