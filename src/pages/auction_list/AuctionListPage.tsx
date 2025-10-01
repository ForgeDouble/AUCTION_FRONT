import React, { useState, useEffect } from "react";
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
import { fetchProducts } from "./AuctionListApi";
import type { ProductListDto } from "./AuctionListDto";

const AuctionListPage = () => {
  // const navigate = useNavigate(); // 실제 사용 시 주석 해제
  const [viewMode, setViewMode] = useState("grid"); // 'grid' or 'list'
  const [sortBy, setSortBy] = useState("ending_soon");
  const [filterOpen, setFilterOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [priceRange, setPriceRange] = useState([0, 10000000]);
  const [products, setProducts] = useState<ProductListDto[]>([]);

  // 샘플 경매 데이터
  const auctions = [
    {
      id: 1,
      title: "1960년대 빈티지 롤렉스 서브마리너",
      image:
        "https://images.unsplash.com/photo-1522312346375-d1a52e2b99b3?w=400",
      currentBid: 850000,
      startingBid: 500000,
      timeLeft: "2시간 15분",
      bids: 23,
      watchers: 156,
      category: "시계",
      location: "서울",
      seller: "빈티지컬렉터",
      rating: 4.9,
      status: "진행중",
      endTime: new Date(Date.now() + 2 * 60 * 60 * 1000),
      featured: true,
    },
    {
      id: 2,
      title: "피카소 원작 리토그래프 '평화의 비둘기'",
      image:
        "https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=400",
      currentBid: 3200000,
      startingBid: 2000000,
      timeLeft: "5시간 32분",
      bids: 45,
      watchers: 289,
      category: "미술",
      location: "부산",
      seller: "아트갤러리",
      rating: 5.0,
      status: "진행중",
      endTime: new Date(Date.now() + 5 * 60 * 60 * 1000),
      featured: true,
    },
    {
      id: 3,
      title: "한정판 에르메스 버킨백 35cm",
      image:
        "https://images.unsplash.com/photo-1584917865442-de89df76afd3?w=400",
      currentBid: 4500000,
      startingBid: 3000000,
      timeLeft: "1일 3시간",
      bids: 67,
      watchers: 234,
      category: "패션",
      location: "강남구",
      seller: "럭셔리뜨",
      rating: 4.8,
      status: "진행중",
      endTime: new Date(Date.now() + 27 * 60 * 60 * 1000),
      featured: false,
    },
    {
      id: 4,
      title: "조선시대 백자 달항아리",
      image:
        "https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=400",
      currentBid: 12000000,
      startingBid: 8000000,
      timeLeft: "45분",
      bids: 89,
      watchers: 456,
      category: "골동품",
      location: "인사동",
      seller: "고미술상",
      rating: 4.9,
      status: "마감임박",
      endTime: new Date(Date.now() + 45 * 60 * 1000),
      featured: true,
    },
    {
      id: 5,
      title: "1955년 페라리 250 GT 모델카",
      image:
        "https://images.unsplash.com/photo-1492144534655-ae79c964c9d7?w=400",
      currentBid: 750000,
      startingBid: 400000,
      timeLeft: "3일 12시간",
      bids: 34,
      watchers: 123,
      category: "수집품",
      location: "용산구",
      seller: "모델카매니아",
      rating: 4.7,
      status: "진행중",
      endTime: new Date(Date.now() + 84 * 60 * 60 * 1000),
      featured: false,
    },
    {
      id: 6,
      title: "샤넬 No.5 빈티지 퍼퓨병 컬렉션",
      image:
        "https://images.unsplash.com/photo-1541643600914-78b084683601?w=400",
      currentBid: 320000,
      startingBid: 200000,
      timeLeft: "6시간 45분",
      bids: 28,
      watchers: 89,
      category: "수집품",
      location: "청담동",
      seller: "향수컬렉터",
      rating: 4.6,
      status: "진행중",
      endTime: new Date(Date.now() + 6 * 60 * 60 * 1000),
      featured: false,
    },
  ];

  const categories = [
    { value: "all", label: "전체", count: auctions.length },
    { value: "미술", label: "미술품", count: 1 },
    { value: "시계", label: "시계", count: 1 },
    { value: "패션", label: "패션", count: 1 },
    { value: "골동품", label: "골동품", count: 1 },
    { value: "수집품", label: "수집품", count: 2 },
  ];

  const handleLogoClick = () => {
    // navigate('/'); // React Router 사용 시
    window.location.href = "/";
  };

  const formatPrice = (price) => {
    return new Intl.NumberFormat("ko-KR").format(price) + "원";
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

  const filteredAuctions = auctions.filter((auction) => {
    const matchesSearch = auction.title
      .toLowerCase()
      .includes(searchQuery.toLowerCase());
    const matchesCategory =
      selectedCategory === "all" || auction.category === selectedCategory;
    const matchesPrice =
      auction.currentBid >= priceRange[0] &&
      auction.currentBid <= priceRange[1];
    return matchesSearch && matchesCategory && matchesPrice;
  });

  const loadProductList = async () => {
    try {
      const data = await fetchProducts();
      setProducts(data.result);
    } catch (error) {
      console.error(error);
    } finally {
      // setLoading(false);
    }
  };

  useEffect(() => {
    loadProductList();
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      {/* 헤더 */}
      <header className="bg-black/20 backdrop-blur-lg border-b border-white/10 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            {/* 로고 */}
            <div
              className="flex items-center space-x-3 cursor-pointer"
              onClick={handleLogoClick}
            >
              <Gavel className="h-8 w-8 text-purple-400" />
              <span className="text-2xl font-bold text-white hover:text-purple-300 transition-colors">
                AuctionHub
              </span>
            </div>

            {/* 검색바 */}
            <div className="flex-1 max-w-2xl mx-8">
              <div className="relative">
                <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
                <input
                  type="text"
                  placeholder="원하는 아이템을 검색해보세요..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-12 pr-4 py-3 bg-white/10 backdrop-blur-lg border border-white/20 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20"
                />
              </div>
            </div>

            {/* 사용자 메뉴 */}
            <div className="flex items-center space-x-4">
              <button className="text-gray-300 hover:text-white transition-colors">
                <Heart className="h-6 w-6" />
              </button>
              <button className="bg-gradient-to-r from-purple-600 to-pink-600 text-white px-6 py-2 rounded-xl hover:from-purple-700 hover:to-pink-700 transition-all duration-300">
                로그인
              </button>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* 페이지 헤더 */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-white mb-4">진행 중인 경매</h1>
          <p className="text-gray-300 text-lg">
            전 세계 희귀한 아이템들을 만나보세요
          </p>
        </div>

        <div className="flex flex-col lg:flex-row gap-8">
          {/* 사이드바 필터 */}
          <div className="lg:w-64 flex-shrink-0">
            <div className="bg-white/10 backdrop-blur-lg border border-white/20 rounded-2xl p-6 sticky top-24">
              <h3 className="text-xl font-bold text-white mb-6 flex items-center">
                <Filter className="h-5 w-5 mr-2" />
                필터
              </h3>

              {/* 카테고리 */}
              <div className="mb-6">
                <h4 className="text-white font-semibold mb-3">카테고리</h4>
                <div className="space-y-2">
                  {categories.map((category) => (
                    <label
                      key={category.value}
                      className="flex items-center cursor-pointer"
                    >
                      <input
                        type="radio"
                        name="category"
                        value={category.value}
                        checked={selectedCategory === category.value}
                        onChange={(e) => setSelectedCategory(e.target.value)}
                        className="mr-3 text-purple-500"
                      />
                      <span className="text-gray-300 flex-1">
                        {category.label}
                      </span>
                      <span className="text-purple-400 text-sm">
                        ({category.count})
                      </span>
                    </label>
                  ))}
                </div>
              </div>

              {/* 가격 범위 */}
              <div className="mb-6">
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
                      className="flex-1 px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white text-sm"
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
                      className="flex-1 px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white text-sm"
                    />
                  </div>
                </div>
              </div>

              {/* 상태 */}
              <div className="mb-6">
                <h4 className="text-white font-semibold mb-3">경매 상태</h4>
                <div className="space-y-2">
                  <label className="flex items-center cursor-pointer">
                    <input type="checkbox" className="mr-3 text-purple-500" />
                    <span className="text-gray-300">진행중</span>
                  </label>
                  <label className="flex items-center cursor-pointer">
                    <input type="checkbox" className="mr-3 text-purple-500" />
                    <span className="text-gray-300">마감임박</span>
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
                  <span className="text-white font-bold">
                    {filteredAuctions.length}
                  </span>
                  개 경매
                </span>
              </div>

              <div className="flex items-center space-x-4">
                {/* 정렬 */}
                <div className="relative">
                  <select
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value)}
                    className="bg-white/10 border border-white/20 rounded-lg px-4 py-2 text-white text-sm appearance-none pr-8"
                  >
                    <option value="ending_soon">마감임박순</option>
                    <option value="price_low">낮은 가격순</option>
                    <option value="price_high">높은 가격순</option>
                    <option value="most_bids">입찰 많은순</option>
                    <option value="newest">최신순</option>
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
              {filteredAuctions.map((auction) => (
                <div
                  key={auction.id}
                  className={
                    viewMode === "grid"
                      ? "bg-white/10 backdrop-blur-lg border border-white/20 rounded-2xl overflow-hidden hover:transform hover:scale-105 transition-all duration-300 cursor-pointer group"
                      : "bg-white/10 backdrop-blur-lg border border-white/20 rounded-2xl p-6 hover:bg-white/15 transition-all duration-300 cursor-pointer"
                  }
                >
                  {viewMode === "grid" ? (
                    // 그리드 뷰
                    <>
                      <div className="relative">
                        <img
                          src={auction.image}
                          alt={auction.title}
                          className="w-full h-48 object-cover"
                        />
                        {auction.featured && (
                          <div className="absolute top-4 left-4 bg-gradient-to-r from-yellow-500 to-orange-500 text-white px-3 py-1 rounded-full text-xs font-bold">
                            추천
                          </div>
                        )}
                        <div
                          className={`absolute top-4 right-4 ${getStatusColor(
                            auction.status
                          )} text-white px-3 py-1 rounded-full text-xs font-bold flex items-center`}
                        >
                          <Clock className="h-3 w-3 mr-1" />
                          {auction.timeLeft}
                        </div>
                        <div className="absolute bottom-4 right-4 flex items-center space-x-2">
                          <div className="bg-black/50 text-white px-2 py-1 rounded-lg text-xs flex items-center">
                            <Eye className="h-3 w-3 mr-1" />
                            {auction.watchers}
                          </div>
                          <button className="bg-black/50 text-white p-2 rounded-lg hover:bg-black/70 transition-colors">
                            <Heart className="h-4 w-4" />
                          </button>
                        </div>
                      </div>
                      <div className="p-6">
                        <h3 className="text-lg font-bold text-white mb-2 line-clamp-2">
                          {auction.title}
                        </h3>
                        <div className="flex items-center justify-between mb-4">
                          <div>
                            <div className="text-xs text-gray-400">
                              현재 입찰가
                            </div>
                            <div className="text-xl font-bold text-green-400">
                              {formatPrice(auction.currentBid)}
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="text-xs text-gray-400">입찰 수</div>
                            <div className="text-lg font-bold text-purple-400">
                              {auction.bids}개
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center justify-between mb-4 text-xs text-gray-400">
                          <div className="flex items-center">
                            <MapPin className="h-3 w-3 mr-1" />
                            {auction.location}
                          </div>
                          <div className="flex items-center">
                            <Star className="h-3 w-3 mr-1 text-yellow-400 fill-current" />
                            {auction.rating}
                          </div>
                        </div>
                        <button className="w-full bg-gradient-to-r from-purple-600 to-pink-600 text-white py-3 rounded-xl hover:from-purple-700 hover:to-pink-700 transition-all duration-300 font-bold">
                          입찰하기
                        </button>
                      </div>
                    </>
                  ) : (
                    // 리스트 뷰
                    <div className="flex items-center space-x-6">
                      <div className="relative">
                        <img
                          src={auction.image}
                          alt={auction.title}
                          className="w-32 h-24 object-cover rounded-xl"
                        />
                        {auction.featured && (
                          <div className="absolute -top-2 -right-2 bg-gradient-to-r from-yellow-500 to-orange-500 text-white px-2 py-1 rounded-full text-xs font-bold">
                            추천
                          </div>
                        )}
                      </div>
                      <div className="flex-1">
                        <h3 className="text-xl font-bold text-white mb-2">
                          {auction.title}
                        </h3>
                        <div className="flex items-center space-x-6 mb-2">
                          <div className="flex items-center text-gray-400 text-sm">
                            <MapPin className="h-4 w-4 mr-1" />
                            {auction.location}
                          </div>
                          <div className="flex items-center text-gray-400 text-sm">
                            <Users className="h-4 w-4 mr-1" />
                            {auction.bids}명 참여
                          </div>
                          <div className="flex items-center text-gray-400 text-sm">
                            <Eye className="h-4 w-4 mr-1" />
                            {auction.watchers}명 관심
                          </div>
                        </div>
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-6">
                            <div>
                              <div className="text-sm text-gray-400">
                                현재 입찰가
                              </div>
                              <div className="text-2xl font-bold text-green-400">
                                {formatPrice(auction.currentBid)}
                              </div>
                            </div>
                            <div
                              className={`${getStatusColor(
                                auction.status
                              )} text-white px-3 py-1 rounded-full text-sm font-bold flex items-center`}
                            >
                              <Clock className="h-4 w-4 mr-1" />
                              {auction.timeLeft}
                            </div>
                          </div>
                          <div className="flex items-center space-x-3">
                            <button className="text-gray-400 hover:text-white transition-colors p-2">
                              <Heart className="h-5 w-5" />
                            </button>
                            <button className="bg-gradient-to-r from-purple-600 to-pink-600 text-white px-6 py-2 rounded-xl hover:from-purple-700 hover:to-pink-700 transition-all duration-300 font-bold">
                              입찰하기
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>

            {/* 페이지네이션 */}
            <div className="flex items-center justify-center space-x-2 mt-12">
              <button className="px-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white hover:bg-white/20 transition-colors">
                이전
              </button>
              {[1, 2, 3, 4, 5].map((page) => (
                <button
                  key={page}
                  className={`px-4 py-2 rounded-lg transition-colors ${
                    page === 1
                      ? "bg-purple-600 text-white"
                      : "bg-white/10 border border-white/20 text-white hover:bg-white/20"
                  }`}
                >
                  {page}
                </button>
              ))}
              <button className="px-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white hover:bg-white/20 transition-colors">
                다음
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AuctionListPage;
