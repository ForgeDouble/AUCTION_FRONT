import React, { useState, useEffect, useRef } from "react";
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
import {
  fetchBidsFromDB,
  fetchBidsFromRedis,
  fetchProductById,
} from "./AuctionDetailApi";
import type { BidLogDto, ProductDto } from "./AuctionDetailDto";
import dayjs from "dayjs";
import { useParams } from "react-router-dom";

const AuctionDetail = () => {
  const { productId } = useParams<{ productId: string }>();
  const [product, setProduct] = useState<ProductDto>();
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [bidAmount, setBidAmount] = useState(0);
  const [timeLeft, setTimeLeft] = useState({
    hours: 0,
    minutes: 0,
    seconds: 0,
  });
  const [isWatching, setIsWatching] = useState(false);
  const [bidLogs, setBidLogs] = useState<BidLogDto[]>([]); // 실시간 입찰 내역 저장
  const [stompClient, setStompClient] = useState(null);

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

  // 카운트다운 타이머
  useEffect(() => {
    if (!product?.auctionEndTime) return;

    // 초기 시간 설정
    setTimeLeft(calculateTimeLeft(product.auctionEndTime));

    const timer = setInterval(() => {
      setTimeLeft(calculateTimeLeft(product.auctionEndTime));
    }, 1000);

    return () => clearInterval(timer);
  }, [product?.auctionEndTime]);

  const loadBidsFromRedis = async () => {
    try {
      const data = await fetchBidsFromRedis(Number(productId));

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

  const loadBidsFromDB = async () => {
    try {
      const data = await fetchBidsFromDB(Number(productId));

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

  useEffect(() => {
    loadProduct();
  }, [productId]);

  useEffect(() => {
    if (!product) return;

    // 진행 중인 경매 -> Redis에서 실시간 데이터 조회
    if (product.status === "PROCEEDING") {
      console.log("진행 중인 경매 - Redis에서 입찰 내역 조회");
      loadBidsFromRedis();
    }
    // 종료된 경매 (SELLED, NOTSELLED) -> DB에서 확정된 데이터 조회
    else if (product.status === "SELLED" || product.status === "NOTSELLED") {
      console.log("종료된 경매 - DB에서 입찰 내역 조회");
      loadBidsFromDB();
    } // READY 상태는 입찰 내역이 없을 수 있음
    else if (product.status === "READY") {
      console.log("준비 중인 경매 - 입찰 내역 없음");
      setBidLogs([]);
    }
  }, [product]);

  // WebSocket 구독
  useEffect(() => {
    // 상품 정보가 없거나 경매가 종료된 경우 WebSocket 연결 안 함
    if (
      !product ||
      product.status === "SELLED" ||
      product.status === "NOTSELLED" ||
      product.status === "READY"
    ) {
      console.log("경매가 진행 중이 아니므로 WebSocket 연결하지 않음");
      return;
    }

    const socket = new SockJS("http://localhost:8080/ws-public"); // 공개 엔드포인트
    const stomp = Stomp.over(socket);
    stomp.heartbeat.outgoing = 10000;
    stomp.heartbeat.incoming = 10000;
    stomp.debug = () => {};

    stomp.connect(
      {}, // 인증 헤더 없음
      () => {
        console.log("경매 WebSocket 연결 성공");
        setStompClient(stomp);

        // 구독
        stomp.subscribe(`/topic/auction/${productId}`, (message) => {
          const payload = JSON.parse(message.body);
          const refinedPayload: BidLogDto = {
            ...payload,
            createdAt: dayjs(payload.createdAt).format("YYYY-MM-DD HH:mm:ss"),
          };
          console.log("📩 받은 메시지:", refinedPayload);
          setBidLogs((prev) => [refinedPayload, ...prev]);
        });
      },
      (error) => {
        console.error("경매 WebSocket 연결 실패:", error);
      }
    );

    return () => {
      if (stomp && stomp.connected) {
        stomp.disconnect(() => {
          console.log("경매 WebSocket 연결 해제");
        });
      }
    };
  }, [product, productId]);

  // 입찰 메시지 보내기
  const sendBid = () => {
    if (product?.status !== "PROCEEDING") {
      alert("진행 중인 경매가 아닙니다.");
      return;
    }

    if (stompClient && bidAmount) {
      const token = localStorage.getItem("accessToken");
      if (token == null) {
        throw Error("No Token");
        return;
      }

      const bid = {
        productId: productId,
        bidAmount: bidAmount,
        isWinned: "N",
      };
      stompClient.send(
        "/app/bid",
        { Authorization: `Bearer ${token}` },
        JSON.stringify(bid)
      ); // 서버쪽 @MessageMapping("/bid")
      setBidAmount("");
    }
  };

  const images = product?.images
    ? [...product.images].sort((a, b) => a.position - b.position)
    : [];

  const nextImage = () => {
    setCurrentImageIndex((prev) => (prev + 1) % images.length);
  };

  const prevImage = () => {
    setCurrentImageIndex((prev) => (prev - 1 + images.length) % images.length);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      {/* 네비게이션 브레드크럼 */}
      <div className="h-30">
        {/* <div className="max-w-7xl mx-auto">
          <div className="flex items-center space-x-2 text-gray-400">
            <span>홈</span>
            <ChevronRight className="h-4 w-4" />
            <span>시계</span>
            <ChevronRight className="h-4 w-4" />
            <span className="text-white">빈티지 롤렉스 서브마리너</span>
          </div>
        </div> */}
      </div>

      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* 왼쪽: 이미지 갤러리 */}
          <div className="lg:col-span-2">
            <div className="bg-white/10 backdrop-blur-lg border border-white/20 rounded-2xl overflow-hidden">
              {/* 메인 이미지 */}
              <div className="relative">
                <img
                  src={
                    images[currentImageIndex]?.url
                      ? images[currentImageIndex]?.url
                      : null
                  }
                  alt="경매 아이템"
                  className="w-full h-96 lg:h-[500px] object-cover"
                />
                {product?.status != "PROCESSING" && (
                  <div className="absolute inset-0 bg-black/70 rounded-t-xl flex items-center justify-center">
                    <div className="text-center">
                      <Clock className="h-8 w-8 text-white mx-auto mb-1" />
                      <span className="text-white text-sm font-bold">
                        경매종료
                      </span>
                    </div>
                  </div>
                )}
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
                        src={image?.url ? image?.url : null}
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
                <p>{product?.productContent}</p>
              </div>

              {/* 상품 상세 정보 */}
              <div className="mt-6 grid grid-cols-2 gap-4">
                {/* <div>
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
                </div> */}
              </div>
            </div>
          </div>

          {/* 오른쪽: 입찰 정보 */}
          <div className="space-y-6">
            {/* 경매 정보 카드 */}
            <div className="bg-white/10 backdrop-blur-lg border border-white/20 rounded-2xl p-6">
              <h1 className="text-3xl font-bold text-white mb-6">
                {product?.productName}
              </h1>
              {/* <p className="text-gray-400 mb-6">1965년 오리지널 다이얼</p> */}

              {/* 현재 입찰가 */}
              <div className="bg-gradient-to-r from-green-600/20 to-emerald-600/20 rounded-xl p-4 mb-6">
                <div className="text-sm text-gray-400 mb-1">
                  현재 최고 입찰가
                </div>
                <div className="text-4xl font-bold text-green-400 mb-2">
                  ₩{bidLogs[0]?.bidAmount}
                </div>
                <div className="flex items-center text-gray-300">
                  <Users className="h-4 w-4 mr-1" />
                  <span>23명 참여</span>
                  <Eye className="h-4 w-4 ml-4 mr-1" />
                  <span>156명 관심</span>
                </div>
              </div>

              {/* 입찰 시작가 */}
              <div className="bg-gradient-to-r from-green-600/20 to-emerald-600/20 rounded-xl p-4 mb-6">
                <div className="text-sm text-gray-400 mb-1">입찰 시작가</div>
                <div className="text-4xl font-bold text-green-400 mb-2">
                  ₩{product?.price}
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
                    className={`flex-1 py-3 rounded-xl font-bold transition-all duration-300 ${
                      product?.status === "PROCESSING"
                        ? "bg-gradient-to-r from-purple-600 to-pink-600 text-white hover:from-purple-700 hover:to-pink-700"
                        : "bg-gray-600 text-gray-400 cursor-not-allowed"
                    }`}
                    onClick={() => sendBid()}
                    disabled={product?.status !== "PROCESSING"}
                  >
                    {product?.status === "PROCESSING"
                      ? "입찰하기"
                      : "경매 종료"}
                  </button>
                  {/* {product?.status === "PROCESSING" && (
                    <button className="bg-yellow-600 text-white px-4 py-3 rounded-xl hover:bg-yellow-700 transition-all duration-300 font-bold">
                      즉시구매
                    </button>
                  )} */}
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
                        : index === bidLogs.length - 1
                        ? "bg-blue-600/20 border border-blue-500/30"
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
                      {index === bidLogs.length - 1 && (
                        <div className="text-blue-400 text-xs">시작가</div>
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
