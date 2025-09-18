import React, { useState, useEffect } from "react";
import SockJS from "sockjs-client";
import Stomp from "stompjs";
import {
  Heart,
  Share2,
  Clock,
  Users,
  Shield,
  TrendingUp,
  ChevronLeft,
  ChevronRight,
  Eye,
  Star,
  MessageCircle,
  AlertTriangle,
  CheckCircle,
  ArrowUp,
} from "lucide-react";
import { fetchBids, fetchProductById } from "../../api/bidapi";
import type { BidLogDto, ProductDto } from "./AuctionDetailDto";
import dayjs from "dayjs";

const AuctionDetail = () => {
  const [productId, setProductId] = useState(2);
  const [product, setProduct] = useState<ProductDto>();
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [bidAmount, setBidAmount] = useState(1500010);
  const [timeLeft, setTimeLeft] = useState({
    hours: 2,
    minutes: 45,
    seconds: 30,
  });
  const [isWatching, setIsWatching] = useState(false);
  const [bidLogs, setBidLogs] = useState<BidLogDto[]>([]); // 🔥 실시간 메시지 저장
  const [stompClient, setStompClient] = useState(null);

  // 카운트다운 타이머
  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev.seconds > 0) {
          return { ...prev, seconds: prev.seconds - 1 };
        } else if (prev.minutes > 0) {
          return { ...prev, minutes: prev.minutes - 1, seconds: 59 };
        } else if (prev.hours > 0) {
          return { hours: prev.hours - 1, minutes: 59, seconds: 59 };
        }
        return prev;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const loadBids = async () => {
    try {
      const data = await fetchBids(productId);

      // createdAt을 변환한 새로운 배열 만들기
      const formattedLogs = data.result.map((bid: BidLogDto) => ({
        ...bid,
        createdAt: dayjs(bid.createdAt).format("YYYY-MM-DD HH:mm:ss"),
      }));

      setBidLogs(formattedLogs);
    } catch (error) {
      console.error(error);
    } finally {
      // setLoading(false);
    }
  };

  const loadProduct = async () => {
    try {
      const data = await fetchProductById(productId);
      setProduct(data.result);
    } catch (error) {
      console.error(error);
    } finally {
      // setLoading(false);
    }
  };

  // 📡 WebSocket 연결
  useEffect(() => {
    loadBids();
    loadProduct();

    const socket = new SockJS("http://localhost:8080/ws");
    const stomp = Stomp.over(socket);

    stomp.connect({}, () => {
      console.log("WebSocket 연결 성공");

      // 구독 (topic/auction/{id})
      stomp.subscribe(`/topic/auction/${productId}`, (message) => {
        const payload = JSON.parse(message.body);

        const refinedPayload: BidLogDto = {
          ...payload,
          createdAt: dayjs(payload.createdAt).format("YYYY-MM-DD HH:mm:ss"),
        };

        console.log("📩 받은 메시지:", refinedPayload);

        setBidLogs((prev) => [refinedPayload, ...prev]); // 최신 로그를 위에 추가
      });
    });

    setStompClient(stomp);

    return () => {
      if (stomp) {
        stomp.disconnect(() => {
          console.log("❌ WebSocket 연결 해제");
        });
      }
    };
  }, [productId]);

  // 💰 입찰 메시지 보내기
  const sendBid = () => {
    if (stompClient && bidAmount) {
      const bid = {
        productId: productId,
        bidAmount: bidAmount,
        isWinned: "N",
      };
      stompClient.send("/app/bid", {}, JSON.stringify(bid)); // 서버쪽 @MessageMapping("/bid")
      setBidAmount("");
    }
  };

  const images = [
    "https://images.unsplash.com/photo-1509048191080-d2984bad6ae5?q=80&w=928&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
    "https://plus.unsplash.com/premium_photo-1682125784386-d6571f1ac86a?q=80&w=1208&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3Dp",
    "https://plus.unsplash.com/premium_photo-1682125779534-76c5debea767?q=80&w=1062&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
    "https://images.unsplash.com/photo-1563103311-860aee557af8?q=80&w=654&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
  ];

  const bidHistory = [
    { user: "user123", amount: "₩2,450,000", time: "방금 전" },
    { user: "collector88", amount: "₩2,400,000", time: "2분 전" },
    { user: "vintage_lover", amount: "₩2,350,000", time: "5분 전" },
    { user: "watch_expert", amount: "₩2,300,000", time: "8분 전" },
    { user: "auction_pro", amount: "₩2,250,000", time: "12분 전" },
  ];

  const nextImage = () => {
    setCurrentImageIndex((prev) => (prev + 1) % images.length);
  };

  const prevImage = () => {
    setCurrentImageIndex((prev) => (prev - 1 + images.length) % images.length);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      {/* 네비게이션 브레드크럼 */}
      <div className="bg-black/20 backdrop-blur-lg border-b border-white/10 px-4 py-4">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center space-x-2 text-gray-400">
            <span>홈</span>
            <ChevronRight className="h-4 w-4" />
            <span>시계</span>
            <ChevronRight className="h-4 w-4" />
            <span className="text-white">빈티지 롤렉스 서브마리너</span>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* 왼쪽: 이미지 갤러리 */}
          <div className="lg:col-span-2">
            <div className="bg-white/10 backdrop-blur-lg border border-white/20 rounded-2xl overflow-hidden">
              {/* 메인 이미지 */}
              <div className="relative">
                <img
                  src={images[currentImageIndex]}
                  alt="경매 아이템"
                  className="w-full h-96 lg:h-[500px] object-cover"
                />
                <button
                  onClick={prevImage}
                  className="absolute left-4 top-1/2 transform -translate-y-1/2 bg-black/50 backdrop-blur-sm text-white p-2 rounded-full hover:bg-black/70 transition-all"
                >
                  <ChevronLeft className="h-6 w-6" />
                </button>
                <button
                  onClick={nextImage}
                  className="absolute right-4 top-1/2 transform -translate-y-1/2 bg-black/50 backdrop-blur-sm text-white p-2 rounded-full hover:bg-black/70 transition-all"
                >
                  <ChevronRight className="h-6 w-6" />
                </button>

                {/* 상단 우측 버튼들 */}
                <div className="absolute top-4 right-4 flex space-x-2">
                  <button
                    onClick={() => setIsWatching(!isWatching)}
                    className={`p-2 rounded-full backdrop-blur-sm transition-all ${
                      isWatching
                        ? "bg-red-500 text-white"
                        : "bg-black/50 text-white hover:bg-black/70"
                    }`}
                  >
                    <Heart
                      className={`h-5 w-5 ${isWatching ? "fill-current" : ""}`}
                    />
                  </button>
                  <button className="bg-black/50 backdrop-blur-sm text-white p-2 rounded-full hover:bg-black/70 transition-all">
                    <Share2 className="h-5 w-5" />
                  </button>
                </div>
              </div>

              {/* 썸네일 이미지들 */}
              <div className="p-4">
                <div className="flex space-x-3">
                  {images.map((image, index) => (
                    <button
                      key={index}
                      onClick={() => setCurrentImageIndex(index)}
                      className={`relative overflow-hidden rounded-lg ${
                        index === currentImageIndex
                          ? "ring-2 ring-purple-500"
                          : "opacity-70 hover:opacity-100"
                      }`}
                    >
                      <img
                        src={image}
                        alt={`썸네일 ${index + 1}`}
                        className="w-20 h-16 object-cover"
                      />
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* 상품 설명 */}
            <div className="bg-white/10 backdrop-blur-lg border border-white/20 rounded-2xl p-6 mt-6">
              <h3 className="text-2xl font-bold text-white mb-4">상품 설명</h3>
              <div className="text-gray-300 space-y-4">
                <p>
                  1960년대 빈티지 롤렉스 서브마리너 5513 모델입니다. 오리지널
                  다이얼과 베젤을 유지하고 있으며, 컬렉터들 사이에서 매우 인기가
                  높은 희귀한 아이템입니다.
                </p>
                <p>
                  시계의 상태는 매우 양호하며, 정기적인 서비스를 받아 정확한
                  시간을 유지하고 있습니다. 박스와 보증서는 포함되지 않으나,
                  진품 인증서가 함께 제공됩니다.
                </p>
              </div>

              {/* 상품 상세 정보 */}
              <div className="mt-6 grid grid-cols-2 gap-4">
                <div>
                  <span className="text-gray-400">브랜드:</span>
                  <span className="text-white ml-2 font-semibold">롤렉스</span>
                </div>
                <div>
                  <span className="text-gray-400">모델:</span>
                  <span className="text-white ml-2 font-semibold">
                    서브마리너 5513
                  </span>
                </div>
                <div>
                  <span className="text-gray-400">연도:</span>
                  <span className="text-white ml-2 font-semibold">1965년</span>
                </div>
                <div>
                  <span className="text-gray-400">상태:</span>
                  <span className="text-green-400 ml-2 font-semibold">
                    매우 양호
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* 오른쪽: 입찰 정보 */}
          <div className="space-y-6">
            {/* 경매 정보 카드 */}
            <div className="bg-white/10 backdrop-blur-lg border border-white/20 rounded-2xl p-6">
              <h1 className="text-3xl font-bold text-white mb-2">
                빈티지 롤렉스 서브마리너
              </h1>
              <p className="text-gray-400 mb-6">1965년 오리지널 다이얼</p>

              {/* 현재 입찰가 */}
              <div className="bg-gradient-to-r from-green-600/20 to-emerald-600/20 rounded-xl p-4 mb-6">
                <div className="text-sm text-gray-400 mb-1">
                  현재 최고 입찰가
                </div>
                <div className="text-4xl font-bold text-green-400 mb-2">
                  ₩2,450,000
                </div>
                <div className="flex items-center text-gray-300">
                  <Users className="h-4 w-4 mr-1" />
                  <span>23명 참여</span>
                  <Eye className="h-4 w-4 ml-4 mr-1" />
                  <span>156명 관심</span>
                </div>
              </div>

              {/* 남은 시간 */}
              <div className="bg-gradient-to-r from-red-600/20 to-orange-600/20 rounded-xl p-4 mb-6">
                <div className="text-sm text-gray-400 mb-2">
                  마감까지 남은 시간
                </div>
                <div className="flex justify-between text-center">
                  <div>
                    <div className="text-2xl font-bold text-red-400">
                      {timeLeft.hours.toString().padStart(2, "0")}
                    </div>
                    <div className="text-xs text-gray-400">시간</div>
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-red-400">
                      {timeLeft.minutes.toString().padStart(2, "0")}
                    </div>
                    <div className="text-xs text-gray-400">분</div>
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-red-400">
                      {timeLeft.seconds.toString().padStart(2, "0")}
                    </div>
                    <div className="text-xs text-gray-400">초</div>
                  </div>
                </div>
              </div>

              {/* 입찰 입력 */}
              <div className="space-y-4">
                <div>
                  <label className="text-white font-semibold block mb-2">
                    입찰 금액
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      value={bidAmount}
                      onChange={(e) => setBidAmount(e.target.value)}
                      placeholder="₩2,500,000"
                      className="w-full bg-white/10 border border-white/20 rounded-xl px-4 py-3 text-white placeholder-gray-400 focus:outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20"
                    />
                  </div>
                  <div className="text-sm text-gray-400 mt-1">
                    최소 입찰가: ₩2,500,000 (현재가 + ₩50,000)
                  </div>
                </div>

                <div className="flex space-x-2">
                  <button
                    className="flex-1 bg-gradient-to-r from-purple-600 to-pink-600 text-white py-3 rounded-xl hover:from-purple-700 hover:to-pink-700 transition-all duration-300 font-bold"
                    onClick={() => sendBid()}
                  >
                    입찰하기
                  </button>
                  <button className="bg-yellow-600 text-white px-4 py-3 rounded-xl hover:bg-yellow-700 transition-all duration-300 font-bold">
                    즉시구매
                  </button>
                </div>
              </div>

              {/* 안전 보장 */}
              <div className="mt-6 p-4 bg-blue-600/20 rounded-xl">
                <div className="flex items-center mb-2">
                  <Shield className="h-5 w-5 text-blue-400 mr-2" />
                  <span className="text-white font-semibold">안전 보장</span>
                </div>
                <div className="text-sm text-gray-300">
                  전문가 감정 완료 • 에스크로 보호 • 7일 반품 보장
                </div>
              </div>
            </div>

            {/* 입찰 현황 */}
            <div className="bg-white/10 backdrop-blur-lg border border-white/20 rounded-2xl p-6">
              <h3 className="text-xl font-bold text-white mb-4 flex items-center">
                <TrendingUp className="h-5 w-5 mr-2" />
                입찰 현황
              </h3>
              <div className="space-y-3">
                {bidLogs.map((bid, index) => (
                  <div
                    key={index}
                    className={`flex justify-between items-center p-3 rounded-lg ${
                      index === 0
                        ? "bg-green-600/20 border border-green-500/30"
                        : "bg-white/5"
                    }`}
                  >
                    <div>
                      <div className="text-white font-semibold">
                        {bid.userName}
                      </div>
                      <div className="text-gray-400 text-sm">
                        {bid.createdAt}
                      </div>
                    </div>
                    <div className="text-right">
                      <div
                        className={`font-bold ${
                          index === 0 ? "text-green-400" : "text-white"
                        }`}
                      >
                        {bid.bidAmount}
                      </div>
                      {index === 0 && (
                        <div className="text-green-400 text-xs flex items-center">
                          <ArrowUp className="h-3 w-3 mr-1" />
                          최고가
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
              <button className="w-full mt-4 text-purple-400 hover:text-purple-300 transition-colors">
                더 보기
              </button>
            </div>

            {/* 판매자 정보 */}
            <div className="bg-white/10 backdrop-blur-lg border border-white/20 rounded-2xl p-6">
              <h3 className="text-xl font-bold text-white mb-4">판매자 정보</h3>
              <div className="flex items-center mb-4">
                <div className="w-12 h-12 bg-gradient-to-r from-purple-600 to-pink-600 rounded-full flex items-center justify-center text-white font-bold text-lg">
                  V
                </div>
                <div className="ml-3">
                  <div className="text-white font-semibold">
                    VintageCollector
                  </div>
                  <div className="flex items-center text-yellow-400">
                    <Star className="h-4 w-4 fill-current mr-1" />
                    <span>4.9 (127 거래)</span>
                  </div>
                </div>
              </div>

              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-400">가입일:</span>
                  <span className="text-white">2019년 3월</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">완료된 경매:</span>
                  <span className="text-white">89건</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">평균 평점:</span>
                  <span className="text-white">4.9/5.0</span>
                </div>
              </div>

              <button className="w-full mt-4 bg-white/10 border border-white/20 text-white py-2 rounded-lg hover:bg-white/20 transition-all duration-300">
                <MessageCircle className="h-4 w-4 inline mr-2" />
                판매자 문의
              </button>
            </div>
          </div>
        </div>

        {/* 하단 탭 섹션 */}
        <div className="mt-12">
          <div className="bg-white/10 backdrop-blur-lg border border-white/20 rounded-2xl overflow-hidden">
            {/* 탭 헤더 */}
            <div className="flex border-b border-white/10">
              <button className="flex-1 py-4 text-white bg-purple-600/20 font-semibold">
                상세 정보
              </button>
              <button className="flex-1 py-4 text-gray-400 hover:text-white hover:bg-white/5 transition-all">
                배송/반품
              </button>
              <button className="flex-1 py-4 text-gray-400 hover:text-white hover:bg-white/5 transition-all">
                문의 (3)
              </button>
            </div>

            {/* 탭 콘텐츠 */}
            <div className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div>
                  <h4 className="text-white font-semibold mb-3">제품 사양</h4>
                  <div className="space-y-2 text-gray-300">
                    <div className="flex justify-between py-2 border-b border-white/10">
                      <span>케이스 크기</span>
                      <span>40mm</span>
                    </div>
                    <div className="flex justify-between py-2 border-b border-white/10">
                      <span>케이스 소재</span>
                      <span>스테인리스 스틸</span>
                    </div>
                    <div className="flex justify-between py-2 border-b border-white/10">
                      <span>방수</span>
                      <span>200m</span>
                    </div>
                    <div className="flex justify-between py-2 border-b border-white/10">
                      <span>무브먼트</span>
                      <span>자동</span>
                    </div>
                  </div>
                </div>

                <div>
                  <h4 className="text-white font-semibold mb-3">감정 결과</h4>
                  <div className="space-y-3">
                    <div className="flex items-center text-green-400">
                      <CheckCircle className="h-5 w-5 mr-2" />
                      <span>진품 인증 완료</span>
                    </div>
                    <div className="flex items-center text-green-400">
                      <CheckCircle className="h-5 w-5 mr-2" />
                      <span>기능 동작 정상</span>
                    </div>
                    <div className="flex items-center text-yellow-400">
                      <AlertTriangle className="h-5 w-5 mr-2" />
                      <span>미세한 사용 흔적 있음</span>
                    </div>

                    <div className="mt-4 p-3 bg-blue-600/20 rounded-lg">
                      <div className="text-sm text-blue-300">
                        감정사: 김시계 (20년 경력) <br />
                        감정일: 2025.09.10
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AuctionDetail;
