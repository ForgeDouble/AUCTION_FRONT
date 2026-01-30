import { useState, useEffect, useRef } from "react";
import SockJS from "sockjs-client";
import Stomp from "stompjs";
import placeholderImg from "@/assets/images/PlaceHolder.jpg";
// import ReportModal from "@/components/report/ReportModal";
import { openRoom } from "@/api/chatApi";
import {
  Heart,
  Share2,
  Clock,
  Shield,
  TrendingUp,
  ChevronLeft,
  ChevronRight,
  MessageCircle,
  Siren,
  User,
  DollarSign,
  ArrowUp,
  Check,
  AlertCircle,
  Gavel,
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
  const [timeLeft, setTimeLeft] = useState({ hours: 0, minutes: 0, seconds: 0 });

  const [bidLogs, setBidLogs] = useState<BidLogDto[]>([]);
  const [stompClient, setStompClient] = useState<any>(null);
  const [copied, setCopied] = useState(false);

  const [bidLoading, setBidLoading] = useState(false);
  const bidTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // 신고 관련 state
  const [reportMode, setReportMode] = useState<string>("");
  const [reportOpen, setReportOpen] = useState(false);

  // UI 전용: 상세 펼침/접기
  const [detailExpanded, setDetailExpanded] = useState(false);

  // 본인 상품 여부 등 로직 (필요시 복구)
  const isSelfSeller = false;

  // 포인트 컬러
  const ACCENT = "rgb(118,90,255)";
  const ACCENT_SOFT = "rgba(118,90,255,0.10)";
  const ACCENT_SOFT2 = "rgba(118,90,255,0.16)";

  const calculateTimeLeft = (endTime: string) => {
    const now = dayjs();
    const end = dayjs(endTime);
    const diff = end.diff(now, "second");
    if (diff <= 0) return { hours: 0, minutes: 0, seconds: 0 };

    const hours = Math.floor(diff / 3600);
    const minutes = Math.floor((diff % 3600) / 60);
    const seconds = diff % 60;
    return { hours, minutes, seconds };
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    return `${year}.${month}.${day}`;
  };

  useEffect(() => {
    if (!product?.auctionEndTime) return;
    setTimeLeft(calculateTimeLeft(product.auctionEndTime));
    const timer = setInterval(() => {
      setTimeLeft(calculateTimeLeft(product.auctionEndTime));
    }, 1000);
    return () => clearInterval(timer);
  }, [product?.auctionEndTime]);

  const loadBidsFromRedis = async () => {
    try {
      const data = await fetchBidsFromRedis(Number(productId));
      const formattedLogs = data.result.map((bid: BidLogDto) => ({
        ...bid,
        createdAt: dayjs(bid.createdAt).format("HH:mm:ss"),
      }));
      setBidLogs(formattedLogs);
    } catch (error) {
      console.error(error);
    }
  };

  const loadBidsFromDB = async () => {
    try {
      const data = await fetchBidsFromDB(Number(productId));
      const formattedLogs = data.result.map((bid: BidLogDto) => ({
        ...bid,
        createdAt: dayjs(bid.createdAt).format("YY.MM.DD HH:mm"),
      }));
      setBidLogs(formattedLogs);
    } catch (error) {
      console.error(error);
    }
  };

  const loadProduct = async () => {
    try {
      if (!productId) showError("서버 오류가 발생했습니다.다시 시도해주세요.");
      const data = await fetchProductById(productId);
      setProduct(data.result);
    } catch (error) {
      console.error(error);
    }
  };

  const loadSellerInfo = async () => {
    if (productId == null) return;
    try {
      const data = await fetchSellerByProductId(productId);
      const formattedData = { ...data.result, createdAt: formatDate(data.result.createdAt) };
      setSellerInfo(formattedData);
    } catch (error) {
      console.error(error);
    }
  };

  const handleCreateWishlist = async (productId: number | null) => {
    try {
      const token = localStorage.getItem("accessToken");
      if (token == null) throw Error("No Token");
      if (productId === null) throw Error("No ProductId");
      await fetchCreateWishlist(token, productId);
    } catch (error) {
      console.error(error);
    }
  };

  const loadIsWishlisted = async (productId: null | number) => {
    try {
      const token = localStorage.getItem("accessToken");
      if (token == null) return;
      const data = await fetchIsWishlisted(token, productId);
      setWishlistId(data.result);
    } catch (error) {
      console.error(error);
    }
  };

  const handleDeleteWishlist = async (wishlistId: number) => {
    try {
      const token = localStorage.getItem("accessToken");
      if (token == null) throw Error("No Token");
      await fetchDeleteWishlist(token, wishlistId);
    } catch (error) {
      console.error(error);
    }
  };

  const handleWishlistToggle = async () => {
    try {
      if (wishlistId) {
        await handleDeleteWishlist(wishlistId);
        setWishlistId(null);
      } else {
        await handleCreateWishlist(productId);
        await loadIsWishlisted(productId);
      }
    } catch (error) {
      console.error(error);
    }
  };

  const formatNumber = (value: string): string => {
    const number = value.replace(/[^0-9]/g, "");
    if (number === "") return "";
    return parseInt(number, 10).toLocaleString("ko-KR");
  };

  const handleBidAmountChange = (e: any) => {
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

  const handleBidResponse = (data: BidResponse) => {
    if (bidTimeoutRef.current) {
      clearTimeout(bidTimeoutRef.current);
      bidTimeoutRef.current = null;
    }
    setBidLoading(false);

    if (data.success) {
      setBidAmount("");
    } else {
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
    if (!amountString || isNaN(amount) || amount <= 0) return BID_RESPONSE_MESSAGES.INVALID_INPUT_FORMAT;
    if (amount % 1000 !== 0) return BID_RESPONSE_MESSAGES.QUANTITY_ERROR;
    return null;
  };

  useEffect(() => {
    if (!product) return;
    if (product.status === "PROCESSING") loadBidsFromRedis();
    else if (product.status === "SELLED" || product.status === "NOTSELLED") loadBidsFromDB();
    else if (product.status === "READY") setBidLogs([]);
  }, [product]);

  useEffect(() => {
    if (!product || product.status !== "PROCESSING") return;
    const token = localStorage.getItem("accessToken");
    const endpoint = token ? "/ws" : "/ws-public";
    const socket = new SockJS(`http://localhost:8080${endpoint}`);
    const stomp = Stomp.over(socket);

    stomp.connect(
      token ? { Authorization: `Bearer ${token}` } : {},
      () => {
        setStompClient(stomp);
        stomp.subscribe(`/topic/auction/${productId}`, (message) => {
          const payload = JSON.parse(message.body);
          setBidLogs((prev) => [payload, ...prev]);
        });
        if (token) {
          stomp.subscribe("/user/queue/bid_response", (response) => {
            handleBidResponse(JSON.parse(response.body));
          });
        }
      },
      (error) => console.error("❌ 연결 실패:", error)
    );

    return () => {
      if (stomp && stomp.connected) stomp.disconnect();
    };
  }, [product, productId]);

  const sendBid = () => {
    if (product?.status !== "PROCESSING") {
      showError("진행중인 경매가 아닙니다.");
      return;
    }
    if (!stompClient) {
      showError("서버 연결 확인 필요");
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
      return;
    }

    setBidLoading(true);
    bidTimeoutRef.current = setTimeout(() => {
      setBidLoading(false);
      showError("응답 시간 초과");
    }, 3000);

    const amount = parseInt(bidAmount.replace(/,/g, ""), 10);
    const bid = { productId: productId, bidAmount: amount, isWinned: "N" };

    try {
      stompClient.send("/app/bid", { Authorization: `Bearer ${token}` }, JSON.stringify(bid));
    } catch (error) {
      if (bidTimeoutRef.current) clearTimeout(bidTimeoutRef.current);
      setBidLoading(false);
      showError("전송 실패");
    }
  };

  const images = product?.images ? [...product.images].sort((a, b) => a.position - b.position) : [];
  const mainImageUrl = images[currentImageIndex]?.url || placeholderImg;

  const nextImage = () => {
    if (images.length <= 1) return;
    setCurrentImageIndex((prev) => (prev + 1) % images.length);
  };
  const prevImage = () => {
    if (images.length <= 1) return;
    setCurrentImageIndex((prev) => (prev - 1 + images.length) % images.length);
  };

  const openRoomWindow = (roomId: string) => {
    const w = 420,
      h = 720;
    const left = window.screenX + Math.max(0, (window.outerWidth - w) / 2);
    const top = window.screenY + Math.max(0, (window.outerHeight - h) / 2);
    window.open(
      `/chat?roomId=${encodeURIComponent(roomId)}`,
      `chat_${roomId}`,
      `width=${w},height=${h},left=${left},top=${top},resizable=yes`
    );
  };

  const handleContactSeller = async () => {
    const token = localStorage.getItem("accessToken");
    if (!token) {
      alert("로그인이 필요합니다.");
      return;
    }
    if (!sellerInfo?.email) {
      alert("판매자 정보 오류");
      return;
    }
    if (isSelfSeller) {
      alert("본인 상품입니다.");
      return;
    }

    try {
      const roomId = await openRoom(token, { targetEmail: sellerInfo.email, adminChat: false });
      if (roomId) openRoomWindow(roomId);
    } catch (e: any) {
      alert("채팅방 연결 실패");
    }
  };

  const isLive = product?.status === "PROCESSING";
  const currentTopPrice =
    bidLogs.length > 0 ? Number(bidLogs[0].bidAmount) : Number(product?.price || 0);

  return (
    <div className="min-h-screen bg-white pb-28 lg:h-screen lg:overflow-hidden lg:pb-0">
      <div className="sticky top-0 z-30 bg-white/95 backdrop-blur border-b border-slate-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3 min-w-0">
            <div
              className="w-10 h-10 rounded-2xl text-white flex items-center justify-center"
              style={{ backgroundColor: ACCENT }}
            >
              <Gavel className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <div className="text-xs text-slate-500 font-medium">상품 상세</div>
              <div className="text-sm font-extrabold text-slate-900 truncate">
                {product?.productName || "경매 상세"}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span
              className="px-3 py-1 rounded-full text-xs font-extrabold border"
              style={{
                color: isLive ? ACCENT : "#475569",
                backgroundColor: isLive ? ACCENT_SOFT : "rgba(148,163,184,0.12)",
                borderColor: isLive ? "rgba(118,90,255,0.25)" : "rgba(148,163,184,0.25)",
              }}
            >
              {isLive ? "LIVE" : "CLOSED"}
            </span>
            <span className="hidden sm:inline text-xs text-slate-400">POT #{productId}</span>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8 lg:h-[calc(100vh-64px)] lg:overflow-hidden">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:h-full">
          {/* LEFT */}
          <div className="lg:col-span-8 lg:h-full lg:overflow-y-auto lg:overscroll-contain lg:pr-2 no-scrollbar">
            <div className="rounded-[28px] border border-slate-100 bg-white overflow-hidden">
              {/* Header */}
              <div className="p-6 md:p-8">
                <div className="flex items-start justify-between gap-4">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-xs text-slate-500 font-semibold">POT #{productId}</span>
                      <span className="text-slate-300">•</span>
                      <span className="text-xs text-slate-500">
                        {isLive ? "경매 진행 중" : "경매 종료"}
                      </span>

                      {isLive && (
                        <span
                          className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-extrabold border"
                          style={{
                            color: ACCENT,
                            backgroundColor: ACCENT_SOFT,
                            borderColor: "rgba(118,90,255,0.25)",
                          }}
                        >
                          <span className="w-2 h-2 rounded-full" style={{ backgroundColor: ACCENT }} />
                          LIVE
                        </span>
                      )}
                    </div>

                    <h1 className="mt-2 text-2xl md:text-3xl font-extrabold text-slate-900 leading-tight">
                      {product?.productName || "상품명을 불러오는 중..."}
                    </h1>

                    <div className="mt-4 flex flex-wrap gap-2">
                      <span className="px-3 py-1 rounded-full text-xs font-semibold bg-slate-50 text-slate-700 border border-slate-200">
                        정품 보증
                      </span>
                      <span className="px-3 py-1 rounded-full text-xs font-semibold bg-slate-50 text-slate-700 border border-slate-200">
                        검수 가능
                      </span>
                      <span
                        className="px-3 py-1 rounded-full text-xs font-semibold border flex items-center gap-1"
                        style={{
                          color: ACCENT,
                          backgroundColor: ACCENT_SOFT,
                          borderColor: "rgba(118,90,255,0.25)",
                        }}
                      >
                        <Shield className="w-3.5 h-3.5" />
                        안전 거래
                      </span>
                    </div>
                  </div>

                  <div className="hidden md:block text-right">
                    <div className="text-xs text-slate-500 font-bold">현재 최고가</div>
                    <div className="mt-1 text-2xl font-extrabold text-slate-900 tabular-nums">
                      ₩{formatNumber(String(currentTopPrice))}
                    </div>
                    <div className="mt-2 text-xs text-slate-500">
                      시작가 ₩{formatNumber(String(product?.price || 0))}
                    </div>
                  </div>
                </div>
              </div>

              <div className="border-t border-slate-100" />

              {/* Image */}
              <div className="relative bg-white">
                <div
                  className="absolute -top-24 -right-24 w-72 h-72 rounded-full blur-[60px] opacity-60"
                  style={{ backgroundColor: ACCENT_SOFT2 }}
                />
                <div
                  className="absolute -bottom-24 -left-24 w-72 h-72 rounded-full blur-[60px] opacity-60"
                  style={{ backgroundColor: ACCENT_SOFT }}
                />

                <div className="relative aspect-[4/3]">
                  <div className="absolute inset-0 bg-gradient-to-b from-slate-50 to-white" />

                  <div className="relative z-10 h-full p-5 sm:p-6">
                    <div className="h-full w-full rounded-[26px] border border-slate-100 bg-white overflow-hidden">
                      <div className="h-full w-full flex items-center justify-center">
                        <img
                          src={mainImageUrl}
                          alt="Product"
                          className="w-full h-full object-contain p-4 sm:p-7 transition-transform duration-500"
                          loading="lazy"
                          decoding="async"
                        />
                      </div>
                    </div>
                  </div>

                  {!isLive && (
                    <div className="absolute inset-0 z-20 bg-white/70 backdrop-blur-[2px] flex items-center justify-center">
                      <div className="px-6 py-3 rounded-2xl bg-white border border-slate-200 flex items-center gap-2">
                        <Clock className="w-5 h-5 text-slate-900" />
                        <span className="font-extrabold text-slate-900">경매 종료</span>
                      </div>
                    </div>
                  )}

                  <button
                    onClick={prevImage}
                    disabled={images.length <= 1}
                    className="absolute z-30 left-5 top-1/2 -translate-y-1/2 p-3 rounded-full bg-white border border-slate-200 hover:bg-slate-50 transition disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    <ChevronLeft className="w-5 h-5 text-slate-800" />
                  </button>
                  <button
                    onClick={nextImage}
                    disabled={images.length <= 1}
                    className="absolute z-30 right-5 top-1/2 -translate-y-1/2 p-3 rounded-full bg-white border border-slate-200 hover:bg-slate-50 transition disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    <ChevronRight className="w-5 h-5 text-slate-800" />
                  </button>

                  <div className="absolute z-30 top-5 right-5 flex gap-2">
                    <button
                      onClick={handleWishlistToggle}
                      className="p-3 rounded-full border transition active:scale-95"
                      style={{
                        backgroundColor: wishlistId ? "rgba(244,63,94,0.10)" : "white",
                        color: wishlistId ? "rgb(244,63,94)" : "#64748b",
                        borderColor: wishlistId ? "rgba(244,63,94,0.18)" : "rgba(148,163,184,0.35)",
                      }}
                    >
                      <Heart className={`w-5 h-5 ${wishlistId ? "fill-current" : ""}`} />
                    </button>

                    <div className="relative">
                      <button
                        onClick={() => {
                          navigator.clipboard.writeText(window.location.href);
                          setCopied(true);
                          setTimeout(() => setCopied(false), 1800);
                        }}
                        className="p-3 rounded-full bg-white text-slate-500 border border-slate-200 hover:bg-slate-50 transition active:scale-95"
                      >
                        {copied ? (
                          <Check className="w-5 h-5" style={{ color: ACCENT }} />
                        ) : (
                          <Share2 className="w-5 h-5" />
                        )}
                      </button>

                      {copied && (
                        <div className="absolute right-0 top-12 px-3 py-1.5 rounded-xl bg-slate-900 text-white text-xs">
                          링크가 복사됐어요
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="absolute z-30 bottom-5 left-5">
                    <div className="px-3 py-1.5 rounded-full bg-white border border-slate-200 text-xs font-extrabold text-slate-700">
                      {images.length > 0 ? `${currentImageIndex + 1} / ${images.length}` : "0 / 0"}
                    </div>
                  </div>
                </div>

                {images.length > 1 && (
                  <div className="px-5 pb-5 -mt-2">
                    <div className="flex gap-2 overflow-x-auto pb-1">
                      {images.map((img, idx) => {
                        const active = idx === currentImageIndex;
                        return (
                          <button
                            key={idx}
                            onClick={() => setCurrentImageIndex(idx)}
                            className="w-[74px] h-[74px] rounded-2xl overflow-hidden border transition"
                            style={{
                              borderColor: active ? "rgba(118,90,255,0.50)" : "rgba(148,163,184,0.35)",
                            }}
                            title={`이미지 ${idx + 1}`}
                          >
                            <img
                              src={img.url}
                              alt="thumb"
                              className="w-full h-full object-cover"
                              loading="lazy"
                              decoding="async"
                            />
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>

              <div className="border-t border-slate-100" />

              {/* 상세 정보 */}
              <div className="p-6 md:p-8">
                <div className="flex items-center justify-between">
                  <h2 className="text-base md:text-lg font-extrabold text-slate-900 flex items-center gap-2">
                    <AlertCircle className="w-5 h-5" style={{ color: ACCENT }} />
                    상품 상세 정보
                  </h2>
                  <div className="text-xs text-slate-400">설명 / 구성 / 상태</div>
                </div>

                <div className="mt-5 relative">
                  <div
                    className={`prose prose-slate max-w-none text-slate-700 leading-relaxed whitespace-pre-line ${
                      detailExpanded ? "" : "overflow-hidden"
                    }`}
                    style={{
                      maxHeight: detailExpanded ? "none" : "320px",
                    }}
                  >
                    {product?.productContent || "상품 설명이 없습니다."}
                  </div>

                  {!detailExpanded && (
                    <div className="pointer-events-none absolute left-0 right-0 bottom-0 h-24 bg-gradient-to-t from-white to-transparent" />
                  )}
                </div>

                <div className="mt-4 flex justify-center">
                  <button
                    onClick={() => setDetailExpanded((v) => !v)}
                    className="px-4 py-2 rounded-full border text-sm font-extrabold transition hover:bg-slate-50"
                    style={{
                      borderColor: "rgba(118,90,255,0.30)",
                      color: ACCENT,
                      backgroundColor: "white",
                    }}
                  >
                    {detailExpanded ? "상세 접기" : "상세 열기"}
                  </button>
                </div>

                <div className="mt-8 grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="rounded-2xl border border-slate-100 bg-slate-50/40 p-4">
                    <div className="text-sm font-extrabold text-slate-900">거래 안내</div>
                    <ul className="mt-2 text-sm text-slate-600 space-y-1">
                      <li>• 낙찰 후 취소는 불가합니다.</li>
                      <li>• 상품 상태는 설명을 기준으로 합니다.</li>
                      <li>• 안전 결제를 권장합니다.</li>
                    </ul>
                  </div>
                  <div className="rounded-2xl border border-slate-100 bg-slate-50/40 p-4">
                    <div className="text-sm font-extrabold text-slate-900">배송 / 수령</div>
                    <ul className="mt-2 text-sm text-slate-600 space-y-1">
                      <li>• 판매자와 협의 후 진행됩니다.</li>
                      <li>• 파손/분실은 택배사 정책을 따릅니다.</li>
                      <li>• 문의는 1:1 채팅을 이용하세요.</li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* RIGHT */}
          <div className="lg:col-span-4 lg:h-full lg:overflow-y-auto lg:overscroll-contain lg:pl-2 no-scrollbar">
            <div className="space-y-6">
              <div className="rounded-[28px] border border-slate-100 bg-white overflow-hidden">
                <div className="p-6">
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="text-sm font-extrabold text-slate-900">입찰</div>
                      <div className="text-xs text-slate-500 mt-1">
                        {isLive ? "실시간으로 반영됩니다." : "경매가 종료되었습니다."}
                      </div>
                    </div>

                    <span
                      className="px-3 py-1 rounded-full text-xs font-extrabold border"
                      style={{
                        color: isLive ? ACCENT : "#475569",
                        backgroundColor: isLive ? ACCENT_SOFT : "rgba(148,163,184,0.12)",
                        borderColor: isLive ? "rgba(118,90,255,0.25)" : "rgba(148,163,184,0.25)",
                      }}
                    >
                      {isLive ? "LIVE" : "CLOSED"}
                    </span>
                  </div>

                  <div className="mt-5 rounded-2xl border border-slate-100 bg-slate-50/40 p-4">
                    <div className="flex items-center justify-between">
                      <div className="text-xs font-extrabold text-slate-500">현재 최고가</div>
                      {isLive && (
                        <div className="flex items-center gap-2 text-[11px] font-extrabold" style={{ color: ACCENT }}>
                          <span className="w-2 h-2 rounded-full" style={{ backgroundColor: ACCENT }} />
                          LIVE
                        </div>
                      )}
                    </div>

                    <div className="mt-1 text-2xl font-extrabold text-slate-900 tabular-nums">
                      ₩{formatNumber(String(currentTopPrice))}
                    </div>

                    <div className="mt-2 text-xs text-slate-500 flex items-center justify-between">
                      <span>시작가</span>
                      <span className="font-extrabold text-slate-700 tabular-nums">
                        ₩{formatNumber(String(product?.price || 0))}
                      </span>
                    </div>
                  </div>

                  {isLive && (
                    <div className="mt-4 grid grid-cols-3 gap-2">
                      {(["hours", "minutes", "seconds"] as const).map((unit) => (
                        <div key={unit} className="rounded-2xl border border-slate-100 bg-white p-3 text-center">
                          <div className="text-xl font-extrabold text-slate-900 tabular-nums">
                            {timeLeft[unit].toString().padStart(2, "0")}
                          </div>
                          <div className="mt-1 text-[10px] font-extrabold text-slate-400 tracking-widest">
                            {unit === "hours" ? "시간" : unit === "minutes" ? "분" : "초"}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  <div className="mt-5 space-y-3">
                    <div className="relative">
                      <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">
                        <DollarSign className="w-5 h-5" />
                      </div>
                      <input
                        type="text"
                        value={bidAmount}
                        onChange={handleBidAmountChange}
                        disabled={!isLive || bidLoading}
                        placeholder="입찰 금액 (1,000원 단위)"
                        className="w-full pl-11 pr-4 py-4 rounded-2xl border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-slate-900/10 focus:border-slate-300 transition font-extrabold text-slate-900 placeholder:text-slate-300 disabled:opacity-60 disabled:cursor-not-allowed"
                      />
                    </div>

                    <button
                      onClick={sendBid}
                      disabled={!isLive || bidLoading}
                      className="w-full py-4 rounded-2xl font-extrabold text-sm flex items-center justify-center gap-2 transition active:scale-[0.99]"
                      style={{
                        backgroundColor: isLive ? ACCENT : "rgba(148,163,184,0.20)",
                        color: isLive ? "white" : "#94a3b8",
                      }}
                    >
                      {bidLoading ? (
                        <span className="w-5 h-5 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                      ) : (
                        <>
                          <Gavel className="w-5 h-5" />
                          {isLive ? "입찰하기" : "입찰 마감"}
                        </>
                      )}
                    </button>

                    <div className="text-[11px] text-slate-500 text-center">* 입찰은 1,000원 단위 · 취소 불가</div>
                  </div>
                </div>

                <div className="border-t border-slate-100" />

                <div className="p-5">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <TrendingUp className="w-5 h-5" style={{ color: ACCENT }} />
                      <div className="font-extrabold text-slate-900 text-sm">실시간 입찰 내역</div>
                      {isLive && (
                        <span
                          className="px-2 py-0.5 rounded-full text-[11px] font-extrabold border"
                          style={{
                            color: ACCENT,
                            backgroundColor: ACCENT_SOFT,
                            borderColor: "rgba(118,90,255,0.25)",
                          }}
                        >
                          LIVE
                        </span>
                      )}
                    </div>
                    <div className="text-xs text-slate-500">{bidLogs.length}건</div>
                  </div>

                  <div className="mt-3 max-h-[420px] overflow-y-auto rounded-2xl border border-slate-100 bg-white">
                    {bidLogs.length === 0 ? (
                      <div className="py-12 text-center text-slate-400">
                        <div className="font-semibold text-sm">아직 입찰 내역이 없습니다.</div>
                        <div className="text-xs mt-1">첫 번째 입찰자가 되어보세요</div>
                      </div>
                    ) : (
                      <div className="divide-y divide-slate-100">
                        {bidLogs.map((bid, index) => {
                          const isTop = index === 0 && isLive;
                          const initial = (bid.userNickName || "?").slice(0, 1);

                          return (
                            <div
                              key={index}
                              className="relative px-4 py-3"
                              style={{
                                backgroundColor: isTop ? ACCENT_SOFT : "white",
                              }}
                            >
                              {isTop && (
                                <div className="absolute left-0 top-0 bottom-0 w-1" style={{ backgroundColor: ACCENT }} />
                              )}

                              <div className="flex items-center justify-between gap-3">
                                <div className="flex items-center gap-3 min-w-0">
                                  <div
                                    className="w-9 h-9 rounded-2xl border flex items-center justify-center text-[12px] font-extrabold"
                                    style={{
                                      borderColor: isTop ? "rgba(118,90,255,0.35)" : "rgba(148,163,184,0.35)",
                                      backgroundColor: isTop ? "rgba(118,90,255,0.12)" : "white",
                                      color: isTop ? ACCENT : "#334155",
                                    }}
                                    title={bid.userNickName}
                                  >
                                    {initial}
                                  </div>

                                  <div className="min-w-0">
                                    <div className="flex items-center gap-2">
                                      <div className="text-sm font-extrabold text-slate-900 truncate">
                                        {bid.userNickName}
                                      </div>

                                      {isTop && (
                                        <span
                                          className="px-2 py-0.5 rounded-full text-[10px] font-extrabold border"
                                          style={{
                                            color: ACCENT,
                                            backgroundColor: ACCENT_SOFT,
                                            borderColor: "rgba(118,90,255,0.25)",
                                          }}
                                        >
                                          최고가
                                        </span>
                                      )}
                                    </div>

                                    <div className="text-[10px] text-slate-400 font-mono">{bid.createdAt}</div>
                                  </div>
                                </div>

                                <div className="text-right">
                                  <div className="font-extrabold tabular-nums" style={{ color: isTop ? ACCENT : "#0f172a" }}>
                                    ₩{formatNumber(String(bid.bidAmount))}
                                  </div>

                                  {isTop && (
                                    <div className="mt-1 inline-flex items-center gap-1 text-[10px] font-extrabold">
                                      <ArrowUp className="w-3 h-3" style={{ color: ACCENT }} />
                                      <span style={{ color: ACCENT }}>Highest</span>
                                    </div>
                                  )}
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                </div>
              </div>

              <div className="rounded-[28px] border border-slate-100 bg-white p-6">
                <div className="flex items-start justify-between">
                  <div>
                    <div className="text-sm font-extrabold text-slate-900">판매자 정보</div>
                    <div className="text-xs text-slate-500 mt-1">문의/거래는 채팅을 이용하세요</div>
                  </div>

                  <button
                    onClick={() => {
                      if (!sellerInfo?.userId) return;
                      setReportMode("USER");
                      setReportOpen(true);
                    }}
                    className="text-xs font-extrabold text-slate-400 hover:text-rose-600 flex items-center gap-1 transition"
                  >
                    <Siren className="w-3.5 h-3.5" />
                    신고
                  </button>
                </div>

                <div className="mt-5 flex items-center gap-4">
                  <div className="w-14 h-14 rounded-2xl border border-slate-200 overflow-hidden bg-slate-50 flex items-center justify-center">
                    {sellerInfo?.profileImageUrl ? (
                      <img src={sellerInfo.profileImageUrl} alt="Seller" className="w-full h-full object-cover" />
                    ) : (
                      <User className="w-7 h-7 text-slate-300" />
                    )}
                  </div>

                  <div className="flex-1">
                    <div className="text-lg font-extrabold text-slate-900">{sellerInfo?.nickname || "판매자"}</div>
                    <div className="text-xs text-slate-500 mt-1 flex flex-wrap gap-x-3 gap-y-1">
                      <span>판매성공 {sellerInfo?.selledBidCount || 0}회</span>
                      <span className="text-slate-300">•</span>
                      <span>가입일 {sellerInfo?.createdAt}</span>
                    </div>
                  </div>
                </div>

                <div className="mt-5 grid grid-cols-2 gap-2">
                  <button
                    onClick={handleContactSeller}
                    className="py-3 rounded-2xl bg-white border border-slate-200 text-slate-900 font-extrabold text-sm hover:bg-slate-50 transition flex items-center justify-center gap-2"
                  >
                    <MessageCircle className="w-4 h-4" />
                    1:1 문의
                  </button>

                  <div className="py-3 rounded-2xl text-white text-center" style={{ backgroundColor: ACCENT }}>
                    <div className="text-[11px] text-white/70 font-extrabold">신뢰도</div>
                    <div className="text-sm font-extrabold">98%</div>
                  </div>
                </div>

                {/* ReportModal 필요시 주석 해제
                <ReportModal
                  open={reportOpen}
                  onClose={() => setReportOpen(false)}
                  targetType={reportMode}
                  targetId={reportMode === "USER" ? sellerInfo?.userId : productId}
                />
                */}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 모바일 하단 */}
      <div className="fixed bottom-0 left-0 right-0 z-40 lg:hidden bg-white/95 backdrop-blur border-t border-slate-100">
        <div className="max-w-7xl mx-auto px-4 py-3">
          <div className="flex items-center gap-3">
            <div className="min-w-0">
              <div className="text-[11px] text-slate-500 font-extrabold">현재 최고가</div>
              <div className="text-sm font-extrabold text-slate-900 tabular-nums truncate">
                ₩{formatNumber(String(currentTopPrice))}
              </div>
            </div>

            <div className="flex-1">
              <div className="relative">
                <div className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
                  <DollarSign className="w-4 h-4" />
                </div>
                <input
                  type="text"
                  value={bidAmount}
                  onChange={handleBidAmountChange}
                  disabled={!isLive || bidLoading}
                  placeholder="입찰 금액"
                  className="w-full pl-9 pr-3 py-3 rounded-2xl border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-slate-900/10 font-extrabold text-slate-900 placeholder:text-slate-300 disabled:opacity-60"
                />
              </div>
            </div>

            <button
              onClick={sendBid}
              disabled={!isLive || bidLoading}
              className="px-4 py-3 rounded-2xl font-extrabold text-sm transition"
              style={{
                backgroundColor: isLive ? ACCENT : "rgba(148,163,184,0.20)",
                color: isLive ? "white" : "#94a3b8",
              }}
            >
              {bidLoading ? "..." : "입찰"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AuctionDetail;
