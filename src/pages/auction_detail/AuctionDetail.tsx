import { useState, useEffect, useRef } from "react";
import SockJS from "sockjs-client";
import Stomp from "stompjs";
import placeholderImg from "@/assets/images/PlaceHolder.jpg";
import ReportModal from "@/components/report/ReportModal";
import { openRoom } from "@/api/chatApi";
import { useAuth } from "@/hooks/useAuth";
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
  MessageCircle,
  AlertTriangle,
  CheckCircle,
  ArrowUp,
  Check,
  Siren,
  User,
  DollarSign,
} from "lucide-react";
import {
  fetchBidsFromDB,
  fetchBidsFromRedis,
  fetchIsWishlisted,
  fetchProductById,
  fetchSellerByProductId,
} from "./AuctionDetailApi";
import {
  type SellerDto,
  type BidLogDto,
  type ProductDto,
  type BidResponse,
} from "./AuctionDetailDto";
import dayjs from "dayjs";
import { fetchCreateWishlist, fetchDeleteWishlist } from "@/api/wishListApi";
import { useNumberParam } from "@/hooks/useNumberParam";
import { useModal } from "@/contexts/ModalContext";

const AuctionDetail = () => {
  const productId = useNumberParam("productId");
  const { showWarning, showError, showLogin } = useModal();
  const [product, setProduct] = useState<ProductDto>();
  const [sellerInfo, setSellerInfo] = useState<SellerDto>();
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [bidAmount, setBidAmount] = useState<string>("");
  const [wishlistId, setWishlistId] = useState<number | null>(null);
  const [timeLeft, setTimeLeft] = useState({
    hours: 0,
    minutes: 0,
    seconds: 0,
  });
  // const [isWatching, setIsWatching] = useState(false);
  const [bidLogs, setBidLogs] = useState<BidLogDto[]>([]); // 실시간 입찰 내역 저장
  const [stompClient, setStompClient] = useState(null);
  const [copied, setCopied] = useState(false);

  const [bidLoading, setBidLoading] = useState(false);
  // const [bidTimeout, setBidTimeout] = useState<NodeJS.Timeout | null>(null);
  const bidTimeoutRef = useRef<NodeJS.Timeout | null>(null);


  // 신고 모달 연결
  const [reportOpen, setReportOpen] = useState(false);
  const [reportMode, setReportMode] = useState<"USER" | "PRODUCT">("USER");


  // const { userEmail: authEmail, userId: authUserId } = useAuth();

  // const myEmailNorm = useMemo(() => {
  //   return String(authEmail ?? "").trim().toLowerCase();
  // }, [authEmail]);

  // const isSelfSeller = useMemo(() => {
  //   const sellerEmailNorm = String(sellerInfo?.email ?? "").trim().toLowerCase();

  //   const myId = authUserId != null ? Number(authUserId) : null;
  //   const sellerId = sellerInfo?.userId != null ? Number(sellerInfo.userId) : null;

  //   const sameId = myId != null && sellerId != null && myId === sellerId;
  //   const sameEmail = myEmailNorm !== "" && sellerEmailNorm !== "" && myEmailNorm === sellerEmailNorm;

  //   return sameId || sameEmail;
  // }, [authUserId, myEmailNorm, sellerInfo?.email, sellerInfo?.userId]);

  // const canChatSeller = useMemo(() => {
  //   return !isSelfSeller && Boolean(sellerInfo?.email);
  // }, [isSelfSeller, sellerInfo?.email]);

  // const canReportSeller = useMemo(() => {
  //   return !isSelfSeller && Boolean(sellerInfo?.userId);
  // }, [isSelfSeller, sellerInfo?.userId]);


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
  // 날짜 포맷 함수
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");

    return `${year}년 ${month}월 ${day}일`;
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

  /* 입찰 정보 조회 (경매가 진행 중일 때 Redis 조회)*/
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
  /* 입찰 정보 조회(경매가 끝난 후 DB 조회) */
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

  /* 상품 조회 */
  const loadProduct = async () => {
    try {
      if (!productId) {
        showError("서버 오류가 발생했습니다.다시 시도해주세요.");
      }
      const data = await fetchProductById(productId);
      setProduct(data.result);
    } catch (error) {
      console.error(error);
    } finally {
      // setLoading(false);
    }
  };

  /* 판매자 정보 조회 */
  const loadSellerInfo = async () => {
    if (productId == null) {
      console.error("Missing ProductId");
      return;
    }
    try {
      const data = await fetchSellerByProductId(productId);

      // createdAt 포맷 변환
      const formattedData = {
        ...data.result,
        createdAt: formatDate(data.result.createdAt),
      };

      setSellerInfo(formattedData);
    } catch (error) {
      console.error(error);
    }
  };

  /* 위시리스트 생성 */
  const handleCreateWishlist = async (productId: number | null) => {
    try {
      const token = localStorage.getItem("accessToken");
      if (token == null) {
        throw Error("No Token");
        return;
      }
      if (productId === null) {
        throw Error("No ProductId");
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

  /* 위시리스트 판별 */
  const loadIsWishlisted = async (productId: null | number) => {
    try {
      const token = localStorage.getItem("accessToken");
      if (token == null) {
        throw Error("No Token");
        return;
      }
      const data = await fetchIsWishlisted(token, productId);
      console.log(data);
      setWishlistId(data.result);
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

  /* 위시리스트 버튼 토글 함수 */
  const handleWishlistToggle = async () => {
    try {
      if (wishlistId) {
        // 찜 제거
        await handleDeleteWishlist(wishlistId);
        setWishlistId(null);
      } else {
        // 찜 추가
        await handleCreateWishlist(productId);
        await loadIsWishlisted(productId);
      }
    } catch (error) {
      console.error(error);
    }
  };


  // 본인 판단 여부 확인
  //  const myEmail = useMemo(() => {
  //   try {
  //     const raw = localStorage.getItem("userEmail");
  //     return String(raw ?? "").trim().toLowerCase();
  //   } catch {
  //     return "";
  //   }
  // }, []);

  // const isMyProduct = useMemo(() => {
  //   const sellerEmail = String(sellerInfo?.email ?? "").trim().toLowerCase();
  //   if (!myEmail || !sellerEmail) return false;
  //   return myEmail === sellerEmail;
  // }, [myEmail, sellerInfo?.email]);

  // 콤마 포맷팅 함수
  const formatNumber = (value: string): string => {
    const number = value.replace(/[^0-9]/g, "");
    if (number === "") return "";
    return parseInt(number, 10).toLocaleString("ko-KR");
  };
  // input 핸들러
  const handleBidAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatNumber(e.target.value);
    setBidAmount(formatted);
  };


  useEffect(() => {
    loadProduct();
    loadSellerInfo();
    loadIsWishlisted(productId);
  }, [productId]);

  const BID_RESPONSE_MESSAGES = {
    NOT_ALLOWED: "해당 상품에 접근할 권한이 없습니다.",
    USER_NOT_FOUND: "존재하지 않은 아이디입니다. 고객센터에 문의하세요",
    PRODUCT_NOT_FOUND: "존재하지 않은 상품입니다.",
    SELLER_NOT_ALLOWED: "판매자는 입찰을 할 수 없습니다.",
    QUANTITY_ERROR: "입찰가는 1000원 단위로 입력해주세요.",
    LOW_PRICE: "현재 최고가 보다 높은 금액만 입찰가능합니다.",
    INVALID_INPUT_FORMAT: "올바르지 않은 입력입니다.",
    BID_VALIDATION_ERROR: "올바르지 않은 입력입니다.",
    INTERNAL_ERROR: "입찰 처리중 오류가 발생했습니다. 고객센터에 문의하세요",
  } as const;

  // 입찰 응답 처리
  const handleBidResponse = (data: BidResponse) => {
    console.log("입찰 응답 수신:", data);

    // 타임아웃 제거
    if (bidTimeoutRef.current) {
      clearTimeout(bidTimeoutRef.current);
      bidTimeoutRef.current = null;
    }

    // 로딩 해제
    setBidLoading(false);

    if (data.success) {
      // 성공 처리
      // showWarning(data.message || "입찰이 완료되었습니다!");
      console.log(data.message);
      setBidAmount(""); // 입력 초기화
    } else {
      // 실패 처리
      switch (data.errorCode) {
        case "NOT_ALLOWED":
          showError(BID_RESPONSE_MESSAGES.NOT_ALLOWED);
          break;
        case "USER_NOT_FOUND":
          showError(BID_RESPONSE_MESSAGES.USER_NOT_FOUND);
          showLogin();
          break;
        case "PRODUCT_NOT_FOUND":
          showError(BID_RESPONSE_MESSAGES.PRODUCT_NOT_FOUND);
          break;
        case "SELLER_NOT_ALLOWED":
          showWarning(BID_RESPONSE_MESSAGES.SELLER_NOT_ALLOWED);
          break;
        case "QUANTITY_ERROR":
          showWarning(BID_RESPONSE_MESSAGES.QUANTITY_ERROR);
          break;
        case "LOW_PRICE":
          showWarning(BID_RESPONSE_MESSAGES.LOW_PRICE);
          break;
        case "INVALID_INPUT_FORMAT":
          showWarning(BID_RESPONSE_MESSAGES.INVALID_INPUT_FORMAT);
          break;
        case "BID_VALIDATION_ERROR":
          showWarning(BID_RESPONSE_MESSAGES.BID_VALIDATION_ERROR);
          break;
        case "INTERNAL_ERROR":
          showError(BID_RESPONSE_MESSAGES.INTERNAL_ERROR);
          break;
      }
    }
  };

  const validateBidAmount = (amountString: string): string | null => {
    const amount = parseInt(amountString.replace(/,/g, ""), 10);

    if (!amountString || isNaN(amount) || amount <= 0) {
      return BID_RESPONSE_MESSAGES.INVALID_INPUT_FORMAT;
    }

    if (amount % 1000 !== 0) {
      return BID_RESPONSE_MESSAGES.QUANTITY_ERROR;
    }
    return null; // 검증 통과
  };

  // 전역 에러 처리
  // const handleGlobalError = (error: any) => {
  //   console.error("WebSocket 전역 에러:", error);

  //   if (bidTimeoutRef.current) {
  //     clearTimeout(bidTimeoutRef.current);
  //     bidTimeoutRef.current = null;
  //   }

  //   setBidLoading(false);
  //   alert(error.message || "오류가 발생했습니다.");
  // };

  useEffect(() => {
    if (!product) return;

    // 진행 중인 경매 -> Redis에서 실시간 데이터 조회
    if (product.status === "PROCESSING") {
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
    if (!product || product.status !== "PROCESSING") return;

    const token = localStorage.getItem("accessToken");

    // 토큰이 있으면 인증된 연결, 없으면 공개 연결
    const endpoint = token ? "/ws" : "/ws-public";
    const socket = new SockJS(`http://localhost:8080${endpoint}`);
    const stomp = Stomp.over(socket);

    stomp.debug = (str) => console.log("🔧 STOMP:", str);

    stomp.connect(
      token ? { Authorization: `Bearer ${token}` } : {}, // 토큰 있을 때만 헤더 추가
      () => {
        console.log("연결 성공 - 엔드포인트:", endpoint);
        setStompClient(stomp);

        // 1. 경매 현황 구독 (누구나 가능)
        stomp.subscribe(`/topic/auction/${productId}`, (message) => {
          console.log("경매 현황:", message.body);
          const payload = JSON.parse(message.body);
          setBidLogs((prev) => [payload, ...prev]);
        });

        // 2. 개인 응답 구독 (토큰 있을 때만)
        if (token) {
          stomp.subscribe("/user/queue/bid_response", (response) => {
            console.log("개인 응답:", response.body);
            handleBidResponse(JSON.parse(response.body));
          });

          // stomp.subscribe("/user/queue/errors", (error) => {
          //   console.log("에러:", error.body);
          //   handleGlobalError(JSON.parse(error.body));
          // });
        }
      },
      (error) => {
        console.error("❌ 연결 실패:", error);
      },
    );

    return () => {
      if (stomp && stomp.connected) {
        stomp.disconnect();
      }
    };
  }, [product, productId]);

  // 입찰 메시지 보내기
  const sendBid = () => {
    if (product?.status !== "PROCESSING") {
      showError("진행중인 경매가 아닙니다.");
      return;
    }

    if (!stompClient) {
      showError("서버와 연결되지 않았습니다. 페이지를 새로고침해주세요.");
      return;
    }

    const amountError = validateBidAmount(bidAmount);
    if (amountError) {
      showWarning(amountError);
      return;
    }

    const token = localStorage.getItem("accessToken");
    if (token == null) {
      showLogin();
      console.error("Missing Token");
      return;
    }

    // 로딩 시작
    setBidLoading(true);

    // 타임아웃 설정 (3초)
    bidTimeoutRef.current = setTimeout(() => {
      setBidLoading(false);
      showError("입찰 처리 시간 초과. 다시 시도해주세요.");
    }, 3000);

    const amount = parseInt(bidAmount.replace(/,/g, ""), 10);

    const bid = {
      productId: productId,
      bidAmount: amount,
      isWinned: "N",
    };

    try {
      stompClient.send(
        "/app/bid",
        { Authorization: `Bearer ${token}` },
        JSON.stringify(bid),
      ); // 서버쪽 @MessageMapping("/bid")
      console.log("입찰 요청 전송:", bid);
    } catch (error) {
      clearTimeout(bidTimeoutRef.current);
      setBidLoading(false);
      showError("입찰 요청 전송 실패");
      console.error("입찰 전송 오류:", error);
    } finally {
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

  const openRoomWindow = (roomId: string) => {
    const w = 420,
      h = 720;
    const left = window.screenX + Math.max(0, (window.outerWidth - w) / 2);
    const top = window.screenY + Math.max(0, (window.outerHeight - h) / 2);

    window.open(
      "/chat?roomId=" + encodeURIComponent(roomId),
      "chat_room_" + roomId,
      "popup=yes,width=" +
        w +
        ",height=" +
        h +
        ",left=" +
        left +
        ",top=" +
        top +
        ",resizable=yes,scrollbars=yes",
    );
  };

  const handleContactSeller = async () => {
    const token = localStorage.getItem("accessToken");
    if (!token) {
      alert("로그인이 필요합니다.");
      return;
    }

    const sellerEmail = sellerInfo?.email;
    if (!sellerEmail) {
      alert(
        "판매자 이메일 정보가 없어 채팅을 열 수 없습니다. (sellerInfo.email 누락)",
      );
      return;
    }

    try {
      const roomId = await openRoom(token, {
        targetEmail: sellerEmail,
        adminChat: false,
      });
      if (!roomId) {
        alert("채팅방 생성/조회에 실패했습니다.");
        return;
      }
      openRoomWindow(roomId);
    } catch (e: any) {
      console.error(e);
      alert("채팅방 연결 실패\n" + String(e?.message ?? ""));
    }
    if (isSelfSeller) {
      alert("본인 상품에는 판매자 문의(1:1 채팅)를 할 수 없습니다.");
      return;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
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
            <div className="bg-white/10 backdrop-blur-lg border border-black/20 rounded-2xl overflow-hidden">
              {/* 메인 이미지 */}
              <div className="relative">
                <img
                  src={
                    images[currentImageIndex]?.url
                      ? images[currentImageIndex]?.url
                      : placeholderImg
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
                    onClick={() => handleWishlistToggle()}
                    className={`p-2 rounded-full backdrop-blur-sm transition-all ${
                      wishlistId
                        ? "bg-red-500 text-white"
                        : "bg-black/50 text-white hover:bg-black/70"
                    }`}
                  >
                    <Heart
                      className={`h-5 w-5 ${wishlistId ? "fill-current" : ""}`}
                    />
                  </button>
                  <button
                    onClick={() => {
                      navigator.clipboard.writeText(window.location.href);
                      setCopied(true);
                      setTimeout(() => setCopied(false), 2000);
                    }}
                    className="bg-black/50 backdrop-blur-sm text-white p-2 rounded-full hover:bg-black/70 transition-all"
                  >
                    {copied ? (
                      <Check className="h-5 w-5" />
                    ) : (
                      <Share2 className="h-5 w-5" />
                    )}
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
                          ? "ring-2 ring-[rgb(118,90,255)]"
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
            <div className="min-h-66 bg-white/10 backdrop-blur-lg border border-black/20 rounded-2xl p-6 mt-6">
              <h3 className="text-2xl font-bold text-gray-900 mb-4">
                상품 설명
              </h3>
              <div className="text-gray-600 space-y-4">
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
            <div className="bg-white/10 backdrop-blur-lg border border-black/20 rounded-2xl p-6">
              <h1 className="text-3xl font-bold text-gray-900 mb-6">
                {product?.productName}
              </h1>

              {/* 현재 입찰가 */}
              <div className="bg-gradient-to-r from-green-600/20 to-emerald-600/20 rounded-xl p-6 mb-4">
                <div className="flex items-center justify-between mb-2">
                  <div className="text-sm text-gray-600 font-medium">
                    현재 최고 입찰가
                  </div>
                  <TrendingUp className="h-5 w-5 text-green-400" />
                </div>
                <div className="text-4xl font-bold text-green-400 mb-2">
                  ₩{bidLogs[0]?.bidAmount}
                </div>
              </div>

              {/* 입찰 시작가 */}
              <div className="bg-gradient-to-r from-blue-600/20 to-indigo-600/20 rounded-xl p-6 mb-4">
                <div className="flex items-center justify-between mb-2">
                  <div className="text-sm text-gray-600 font-medium">
                    입찰 시작가
                  </div>
                  <DollarSign className="h-5 w-5 text-blue-400" />
                </div>
                <div className="text-4xl font-bold text-blue-400 mb-2">
                  ₩{product?.price}
                </div>
              </div>

              {/* 남은 시간 */}
              <div className="bg-gradient-to-r from-red-600/20 to-orange-600/20 rounded-xl p-6 mb-4">
                <div className="flex items-center justify-between mb-4">
                  <div className="text-sm text-gray-600 font-medium">
                    마감까지 남은 시간
                  </div>
                  <Clock className="h-5 w-5 text-red-400" />
                </div>
                <div className="grid grid-cols-3 gap-4">
                  <div className="text-center bg-white/10 rounded-lg p-3">
                    <div className="text-3xl font-bold text-red-400">
                      {timeLeft.hours.toString().padStart(2, "0")}
                    </div>
                    <div className="text-xs text-gray-600 mt-1">시간</div>
                  </div>
                  <div className="text-center bg-white/10 rounded-lg p-3">
                    <div className="text-3xl font-bold text-red-400">
                      {timeLeft.minutes.toString().padStart(2, "0")}
                    </div>
                    <div className="text-xs text-gray-600 mt-1">분</div>
                  </div>
                  <div className="text-center bg-white/10 rounded-lg p-3">
                    <div className="text-3xl font-bold text-red-400">
                      {timeLeft.seconds.toString().padStart(2, "0")}
                    </div>
                    <div className="text-xs text-gray-600 mt-1">초</div>
                  </div>
                </div>
              </div>

              {/* 경매 상태 인디케이터 */}
              <div className="flex items-center justify-center space-x-2 mb-2">
                <div
                  className={`w-2 h-2 rounded-full ${product?.status === "PROCESSING" ? "bg-green-400 animate-pulse" : "bg-gray-400"}`}
                ></div>
                <span
                  className={`text-sm font-medium ${product?.status === "PROCESSING" ? "text-green-400" : "text-gray-400"}`}
                >
                  {product?.status === "PROCESSING"
                    ? "경매 진행중"
                    : "경매 종료"}
                </span>
              </div>
            </div>

            {/* 판매자 정보 */}
            <div className="bg-white/10 backdrop-blur-lg border border-black/20 rounded-2xl p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-xl font-bold text-gray-900">판매자 정보</h3>
                <div
                  className="flex items-center text-gray-400 hover:text-red-400 transition-colors cursor-pointer"
                  onClick={() => {
                    if (!sellerInfo?.userId) {
                      alert("판매자 정보(userId)가 없어 신고할 수 없습니다.");
                      return;
                    }
                    setReportMode("USER");
                    setReportOpen(true);
                  }}
                >
                  <Siren className="h-4 w-4 mr-1" />
                  <span className="text-sm">신고하기</span>
                </div>
              </div>

              <div className="flex items-center mb-4">
                {sellerInfo?.profileImageUrl ? (
                  <img
                    src={sellerInfo.profileImageUrl}
                    alt={`프로필이미지`}
                    className="w-12 h-12 border border-gray-300 rounded-full"
                  />
                ) : (
                  <User className="w-12 h-12 text-gray-400 border border-gray-300 rounded-full" />
                )}

                <div className="ml-3">
                  <div className="text-gray-900 font-semibold">
                    {sellerInfo?.nickname}
                  </div>
                </div>
              </div>

              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-900">가입일:</span>
                  <span className="text-gray-600">{sellerInfo?.createdAt}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-900">완료된 경매:</span>
                  <span className="text-gray-600">
                    {sellerInfo?.selledBidCount}건
                  </span>
                </div>
              </div>

              <button
                onClick={handleContactSeller}
                className="w-full mt-4 bg-white/10 border border-black/20 text-gray-900 py-2 rounded-lg hover:bg-black/10 transition-all duration-300 cursor-pointer"
              >
                <MessageCircle className="h-4 w-4 inline mr-2" />
                판매자 문의
              </button>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mt-8">
          {/* 왼쪽: 입찰 현황 */}
          <div className="lg:col-span-2">
            <div className="bg-white/10 backdrop-blur-lg border border-black/20 rounded-2xl p-6 h-[600px] flex flex-col">
              <h3 className="text-xl font-bold text-gray-900 mb-4 flex items-center">
                <TrendingUp className="h-5 w-5 mr-2" />
                입찰 현황
              </h3>
              <div className="space-y-3 overflow-y-auto flex-1">
                {bidLogs.map((bid, index) => (
                  <div
                    key={index}
                    className={`flex justify-between items-center p-3 rounded-lg ${
                      index === 0
                        ? "bg-green-600/20 border border-green-500/30"
                        : index === bidLogs.length - 1
                          ? "bg-blue-600/20 border border-blue-500/30"
                          : "bg-black/5 border border-black/20"
                    }`}
                  >
                    <div>
                      <div className="text-gray-900 font-semibold">
                        {bid.userNickName}
                      </div>
                      <div className="text-gray-600 text-sm">
                        {bid.createdAt}
                      </div>
                    </div>
                    <div className="text-right">
                      <div
                        className={`font-bold ${
                          index === 0 ? "text-green-400" : "text-gray-900"
                        }`}
                      >
                        {bid.bidAmount}
                      </div>
                      {index === 0 && (
                        <div className="text-green-600 text-xs flex items-center">
                          <ArrowUp className="h-3 w-3 mr-1" />
                          최고가
                        </div>
                      )}
                      {index === bidLogs.length - 1 && (
                        <div className="text-blue-600 text-xs">시작가</div>
                      )}
                    </div>
                  </div>
                ))}
              </div>

              {/* <button className="w-full mt-4 text-[rgb(118,90,255)] hover:text-blue-300 transition-colors">
                더 보기
              </button>
            </div>

            <div className="bg-white/10 backdrop-blur-lg border border-black/20 rounded-2xl p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-xl font-bold text-black">판매자 정보</h3>
                  
                <button
                  type="button"
                  disabled={!canReportSeller}
                  onClick={() => {
                    if (!canReportSeller) return;

                    setReportMode("USER");
                    setReportOpen(true);
                  }}
                  className={
                    "flex items-center transition-colors " +
                    (canReportSeller
                      ? "text-gray-400 hover:text-red-400 cursor-pointer"
                      : "text-gray-300 cursor-not-allowed opacity-60")
                  }
                  title={canReportSeller ? "신고하기" : "본인 신고는 불가합니다."}
                >
                  <Siren className="h-4 w-4 mr-1" />
                  <span className="text-sm">신고하기</span>
                </button>


              </div>

              <div className="flex items-center mb-4">
                {sellerInfo?.profileImageUrl ? (
                  <img
                    src={sellerInfo.profileImageUrl}
                    alt={`프로필이미지`}
                    className="w-12 h-12"
                  />
                ) : (
                  <div className="w-12 h-12 bg-gradient-to-r from-purple-600 to-pink-600 rounded-full flex items-center justify-center text-white font-bold text-lg">
                    S
                  </div>
                )}

                <div className="ml-3">
                  <div className="text-gray-900 font-semibold">
                    {sellerInfo?.nickname}
                  </div>
                </div>
              </div>

              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-900">가입일:</span>
                  <span className="text-gray-600">{sellerInfo?.createdAt}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-900">완료된 경매:</span>
                  <span className="text-gray-600">
                    {sellerInfo?.selledBidCount}건
                  </span>
                </div>

              </div>

              <button
                onClick={handleContactSeller}
                disabled={!canChatSeller}
                className={
                  "w-full mt-4 border py-2 rounded-lg transition-all duration-300 flex items-center justify-center " +
                  (canChatSeller
                    ? "bg-[rgb(118,90,255)]/100 border-white/20 text-white hover:bg-[rgb(174, 158, 255)]"
                    : "bg-gray-200/30 border-gray-300/40 text-gray-400 cursor-not-allowed opacity-70")
                }
                title={canChatSeller ? "판매자 문의" : "본인 상품에는 문의할 수 없습니다."}
              >
                <MessageCircle className="h-4 w-4 inline mr-2" />
                판매자 문의
              </button> */}

            </div>
          </div>

          {/* 오른쪽: 입찰 금액 입력 */}
          <div className="flex flex-col justify-end">
            <div className="bg-white/10 backdrop-blur-lg border border-black/20 rounded-2xl p-6">
              <h3 className="text-xl font-bold text-gray-900 mb-6">입찰하기</h3>
              <div className="space-y-6">
                <div>
                  <label className="text-gray-900 font-semibold block mb-3">
                    입찰 금액
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      value={bidAmount}
                      onChange={handleBidAmountChange}
                      placeholder="₩2,500,000"
                      className="w-full bg-white/10 border border-black/20 rounded-xl px-4 py-3 text-gray-900 placeholder-gray-400 focus:outline-none focus:border-purple-500 focus:ring-2 focus:ring-[rgb(118,90,255)]"
                    />
                  </div>
                  <div className="text-sm text-gray-400 mt-2">
                    최소 입찰가: ₩2,500,000 (현재가 + ₩50,000)
                  </div>
                </div>

                <button
                  className={`w-full py-3 rounded-xl font-bold transition-all duration-300 relative ${
                    product?.status === "PROCESSING" && !bidLoading
                      ? "bg-[rgb(118,90,255)] text-white hover:bg-purple-700"
                      : "bg-gray-600 text-gray-400 cursor-not-allowed"
                  }`}
                  onClick={() => sendBid()}
                  disabled={product?.status !== "PROCESSING" || bidLoading}
                >
                  {bidLoading ? (
                    <>
                      <span className="opacity-0">입찰하기</span>
                      <div className="absolute inset-0 flex items-center justify-center">
                        <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                      </div>
                    </>
                  ) : product?.status === "PROCESSING" ? (
                    "입찰하기"
                  ) : (
                    "경매 종료"
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
      <ReportModal
        open={reportOpen}
        onClose={() => setReportOpen(false)}
        mode={reportMode}
        targetUserId={sellerInfo?.userId}
        targetUserName={sellerInfo?.nickname}
      />
    </div>
  );
};

export default AuctionDetail;
