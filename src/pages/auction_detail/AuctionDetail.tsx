import { useState, useEffect, useRef, useMemo } from "react";
import { useAuth } from "@/hooks/useAuth";
import SockJS from "sockjs-client";
import Stomp from "stompjs";
import placeholderImg from "@/assets/images/PlaceHolder.jpg";
import ReportModal from "@/components/report/ReportModal";
import { openRoom } from "@/api/chatApi";
import { useNavigate } from "react-router-dom";
import {
  Heart,
  Share2,
  Clock,
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
} from "lucide-react";
import {
  fetchBidsFromDB,
  fetchBidsFromRedis,
  fetchDeleteProduct,
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
import { fetchSeasonLatestForUser } from "@/components/season/seasonApi";
import type { SeasonUserAwardsDto } from "@/components/season/seasonTypes";
import SeasonAwardChips from "@/components/season/SeasonAwardChips";
import ErrorPage from "@/errors/ErrorPage";
import { handleApiError } from "@/errors/HandleApiError";
import type { ErrorState } from "@/errors/ErrorDto";
import { ApiError } from "@/errors/Errors";

const AuctionDetail = () => {
  const productId = useNumberParam("productId");
  const { showWarning, showError, showLogin } = useModal();
  const { logout } = useAuth();

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

  const [bidLogs, setBidLogs] = useState<BidLogDto[]>([]);

  const stompRef = useRef<Stomp.Client>(null);
  const socketRef = useRef<WebSocket>(null);
  const [copied, setCopied] = useState(false);

  const [bidLoading, setBidLoading] = useState(false);
  const bidTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // 신고 관련 state
  // const [reportMode, setReportMode] = useState<string>("");
  // const [reportOpen, setReportOpen] = useState(false);
  const [reportOpen, setReportOpen] = useState(false);
  const [reportMode, setReportMode] = useState<"USER" | "PRODUCT">("USER");

  // UI 전용: 상세 펼침/접기
  const [detailExpanded, setDetailExpanded] = useState(false);
  // 시즌 뱃지
  const [seasonAwards, setSeasonAwards] = useState<SeasonUserAwardsDto | null>(
    null,
  );
  const [errorState, setErrorState] = useState<ErrorState | null>(null);

  // 본인 상품 여부 등 로직 (필요시 복구)
  // const isSelfSeller = false;
  const nav = useNavigate();
  const goSellerProfile = () => {
    if (!sellerInfo?.userId) {
      showWarning("판매자 정보를 불러오지 못했습니다.");
      return;
    }
    nav(`/user/profile/${sellerInfo.userId}`);
  };

  const { userEmail: authEmail, userId: authUserId } = useAuth();

  const myEmailNorm = String(authEmail ?? "")
    .trim()
    .toLowerCase();

  const [bidDetailOpen, setBidDetailOpen] = useState(false);

  //  왼쪽 스크롤 컨테이너 + 상세 섹션 앵커
  const leftScrollRef = useRef<HTMLDivElement | null>(null);
  const bidDetailAnchorRef = useRef<HTMLDivElement | null>(null);

  const openBidDetailAndScroll = () => {
    setBidDetailOpen(true);

    requestAnimationFrame(() => {
      const container = leftScrollRef.current;
      const anchor = bidDetailAnchorRef.current;
      if (!anchor) return;

      if (!container) {
        anchor.scrollIntoView({ behavior: "smooth", block: "start" });
        return;
      }

      const cRect = container.getBoundingClientRect();
      const aRect = anchor.getBoundingClientRect();
      const nextTop = container.scrollTop + (aRect.top - cRect.top) - 16;

      container.scrollTo({ top: nextTop, behavior: "smooth" });
    });
  };

  const sellerEmailNorm = String(sellerInfo?.email ?? "")
    .trim()
    .toLowerCase();

  const isSelfSeller = (() => {
    if (!authUserId && !authEmail) return false; // 로그인 안 했으면 false

    const myId = authUserId != null ? Number(authUserId) : null;
    const sellerId =
      sellerInfo?.userId != null ? Number(sellerInfo.userId) : null;

    const sameId = myId != null && sellerId != null && myId === sellerId;
    const sameEmail =
      myEmailNorm !== "" &&
      sellerEmailNorm !== "" &&
      myEmailNorm === sellerEmailNorm;

    return sameId || sameEmail;
  })();

  const canChatSeller = !isSelfSeller && Boolean(sellerInfo?.email);
  const canReportSeller = !isSelfSeller && Boolean(sellerInfo?.userId);
  const canWishlist = !isSelfSeller;

  // 입찰정책 펼치기/닫기 관련
  const [bidPolicyOpen, setBidPolicyOpen] = useState(false);

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

  /** 레디스의 입찰 내역 조회 */
  const loadBidsFromRedis = async () => {
    try {
      if (!productId) {
        setErrorState({
          show: true,
          type: "404",
          title: "상품을 찾을 수 없습니다",
          message: "상품 ID가 유효하지 않습니다.",
        });
        return;
      }

      const data = await fetchBidsFromRedis(productId);
      const formattedLogs = data.result.map((bid: BidLogDto) => ({
        ...bid,
        createdAtDisplay: dayjs(bid.createdAt).format("HH:mm:ss"),
      }));
      setBidLogs(formattedLogs);
    } catch (error: unknown) {
      const result = handleApiError(error);
      console.error(result);

      switch (result.type) {
        default:
          showError(
            "입찰 내역을 불러 올 수 없습니다. 관리자에게 문의해주세요.",
          );
      }
    }
  };

  /** 디비의 입찰내역 조회 */
  const loadBidsFromDB = async () => {
    try {
      if (!productId) {
        setErrorState({
          show: true,
          type: "404",
          title: "상품을 찾을 수 없습니다",
          message: "상품 ID가 유효하지 않습니다.",
        });
        return;
      }

      const data = await fetchBidsFromDB(productId);
      const formattedLogs = data.result.map((bid: BidLogDto) => ({
        ...bid,
        createdAtDisplay: dayjs(bid.createdAt).format("YY.MM.DD HH:mm"),
      }));
      setBidLogs(formattedLogs);
    } catch (error: unknown) {
      const result = handleApiError(error);
      console.error(result);

      switch (result.type) {
        default:
          showError(
            "입찰 내역을 불러 올 수 없습니다. 관리자에게 문의해주세요.",
          );
      }
    }
  };

  /** 상품 조회 */
  const loadProduct = async () => {
    try {
      if (!productId) {
        setErrorState({
          show: true,
          type: "404",
          title: "상품을 찾을 수 없습니다",
          message: "상품 ID가 유효하지 않습니다.",
        });
        return;
      }
      const data = await fetchProductById(productId);
      setProduct(data.result);
    } catch (error: unknown) {
      const result = handleApiError(error);
      console.error(result);

      switch (result.type) {
        case "REDIRECT":
          if (result.to === "/404")
            setErrorState({
              show: true,
              type: "404",
              title: "상품을 찾을 수 없습니다",
              message: "상품 ID가 유효하지 않습니다.",
            });

          if (result.to === "/500")
            setErrorState({
              show: true,
              type: "500",
              title: "서버 내부에서 오류가 발생했습니다",
              message: "관리자에게 문의해주세요.",
            });
          break;

        default:
          setErrorState({
            show: true,
            type: "500",
            title: "서버 내부에서 오류가 발생했습니다",
            message: "관리자에게 문의해주세요.",
          });
      }
    }
  };

  /** 판매자 정보 조회 */
  const loadSellerInfo = async () => {
    if (!productId) {
      setErrorState({
        show: true,
        type: "404",
        title: "상품을 찾을 수 없습니다",
        message: "상품 ID가 유효하지 않습니다.",
      });
      return;
    }
    try {
      const data = await fetchSellerByProductId(productId);
      const formattedData = {
        ...data.result,
        createdAt: formatDate(data.result.createdAt),
      };
      setSellerInfo(formattedData);
    } catch (error: unknown) {
      const result = handleApiError(error);
      console.error(result);

      switch (result.type) {
        case "REDIRECT":
          if (result.to === "/500")
            setErrorState({
              show: true,
              type: "500",
              title: "서버 내부에서 오류가 발생했습니다",
              message: "관리자에게 문의해주세요.",
            });

          break;

        default:
          setErrorState({
            show: true,
            type: "500",
            title: "서버 내부에서 오류가 발생했습니다",
            message: "관리자에게 문의해주세요.",
          });
      }
    }
  };

  /** 위시리스트 생성 */
  const handleCreateWishlist = async (productId: number | null) => {
    try {
      if (!productId) {
        setErrorState({
          show: true,
          type: "404",
          title: "상품을 찾을 수 없습니다",
          message: "상품 ID가 유효하지 않습니다.",
        });
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

  /** 해당 상품이 위스리스트에 속하는지 확인 */
  const loadIsWishlisted = async (productId: null | number) => {
    try {
      const token = localStorage.getItem("accessToken");
      if (!token) {
        return;
      }
      const data = await fetchIsWishlisted(token, productId);
      setWishlistId(data.result);
    } catch (error: unknown) {
      const result = handleApiError(error);
      console.error(result);

      switch (result.type) {
        case "AUTH":
          showLogin("confirm");
          logout();
          break;
        case "REDIRECT":
          if (result.to === "/404")
            setErrorState({
              show: true,
              type: "404",
              title: "상품을 찾을 수 없습니다",
              message: "상품 ID가 유효하지 않습니다.",
            });
          break;
        default:
          showError(
            "서버 내부에서 오류가 발생했습니다. 관리자에게 문의해주세요.",
          );
      }
    }
  };

  /** 위시리스트 제거 */
  const handleDeleteWishlist = async (wishlistId: number) => {
    if (!canWishlist) {
      showWarning("본인 상품은 찜(위시리스트) 할 수 없습니다.");
      return;
    }
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

  /** 상품 삭제 */
  const handleDeleteProduct = async () => {
    if (
      product?.auctionEndTime &&
      dayjs().isAfter(dayjs(product.auctionEndTime))
    ) {
      showError("경매시간이 종료된 상품입니다.");
      return;
    }

    if (!product?.productId) {
      showError("서버 내부에서 오류가 발생했습니다. 관리자에게 문의해주세요.");
      return;
    }

    const token = localStorage.getItem("accessToken");
    if (!token) {
      showLogin("confirm");
      return;
    }
    try {
      await fetchDeleteProduct(token, product?.productId);
      showWarning("해당 상품이 삭제되었습니다.");
      nav("/auction_list");
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

  /** 상품 수정 */
  const handleUpdateProduct = async () => {
    if (
      product?.auctionEndTime &&
      dayjs().isAfter(dayjs(product.auctionEndTime))
    ) {
      showError("경매시간이 종료된 상품입니다.");
      return;
    }

    if (!product?.productId) {
      showError("서버 내부에서 오류가 발생했습니다. 관리자에게 문의해주세요.");
      return;
    }

    const token = localStorage.getItem("accessToken");
    if (!token) {
      showLogin("confirm");
      return;
    }

    nav(`/edit_product/${product.productId}`);
  };

  /** 위시리스트 핸들 */
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

  const handleBidAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatNumber(e.target.value);
    setBidAmount(formatted);
  };

  useEffect(() => {
    loadProduct();
    loadSellerInfo();
    // loadIsWishlisted(productId);
  }, [productId]);

  useEffect(() => {
    if (!productId) return;

    if (isSelfSeller) {
      setWishlistId(null);
      return;
    }

    loadIsWishlisted(productId);
  }, [productId, isSelfSeller]);

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

  // 입찰 정책 관련
  const BID_POLICIES = [
    "입찰은 금액 입력 후 취소/철회가 불가능합니다.",
    "경매 시간이 초과 시 입찰할 수 없습니다.",
    "로그인한 사용자만 입찰할 수 있습니다.",
    "판매자는 본인 상품에 입찰할 수 없습니다.",
    "입찰 최소금액은 1000원 단위입니다.",
    "현재 최고가보다 높은 금액만 입찰할 수 있습니다.",
    "유저 사용량에 따라 입찰이 취소될 수 있습니다.",
  ];

  const handleBidResponse = (data: BidResponse) => {
    if (bidTimeoutRef.current) {
      clearTimeout(bidTimeoutRef.current);
      bidTimeoutRef.current = null;
    }
    setBidLoading(false);

    if (data.success) {
      setBidAmount("");
    } else {
      const error = new ApiError(500, data.errorCode, data.message, data.data);
      const result = handleApiError(error);
      console.error(result);

      switch (result.type) {
        case "AUTH":
          showLogin("confirm");
          logout();
          break;
        case "REDIRECT":
          if (result.to === "/404")
            setErrorState({
              show: true,
              type: "404",
              title: "상품을 찾을 수 없습니다",
              message: "상품 ID가 유효하지 않습니다.",
            });
          if (result.to === "/500")
            setErrorState({
              show: true,
              type: "500",
              title: "해당 상품에 접근할 권한이 없습니다",
              message: "경매가 진행중인 상품이 아닙니다.",
            });
          break;
        case "WARNING":
          showWarning(result.message);
          break;
        default:
          showError("입찰 처리 중 오류가 발생했습니다.");
      }
    }
  };

  const validateBidAmount = (amountString: string): string | null => {
    const amount = parseInt(amountString.replace(/,/g, ""), 10);
    if (!amountString || isNaN(amount) || amount <= 0)
      return BID_RESPONSE_MESSAGES.INVALID_INPUT_FORMAT;
    if (amount % 1000 !== 0) return BID_RESPONSE_MESSAGES.QUANTITY_ERROR;
    return null;
  };

  useEffect(() => {
    if (!product) return;
    if (product.status === "PROCESSING") loadBidsFromRedis();
    else if (product.status === "SELLED" || product.status === "NOTSELLED")
      loadBidsFromDB();
    else if (product.status === "READY") setBidLogs([]);
  }, [product]);

  useEffect(() => {
    const isLive = product?.status === "PROCESSING";
    if (!productId || !isLive) {
      // 라이브가 아니면 혹시 남아있는 연결 정리
      try {
        if (stompRef.current) stompRef.current.disconnect(() => {});
      } catch {
        // ignore
      }
      stompRef.current = null;

      try {
        if (socketRef.current) socketRef.current.close();
      } catch {
        // ignore
      }
      socketRef.current = null;

      return;
    }

    let alive = true;

    // effect 시작 시 기존 연결 정리(중복 방지)
    try {
      if (stompRef.current) stompRef.current.disconnect(() => {});
    } catch {
      //ignore
    }
    stompRef.current = null;

    try {
      if (socketRef.current) socketRef.current.close();
    } catch {
      //ignore
    }
    socketRef.current = null;

    const token = localStorage.getItem("accessToken");
    const endpoint = token ? "/ws" : "/ws-public";

    const socket = new SockJS(`http://localhost:8080${endpoint}`);
    socketRef.current = socket;

    const stomp = Stomp.over(socket);
    stompRef.current = stomp;

    stomp.debug = () => {};

    stomp.connect(
      token ? { Authorization: `Bearer ${token}` } : {},
      () => {
        if (!alive) return;

        stomp.subscribe(`/topic/auction/${productId}`, (message) => {
          if (!alive) return;
          const payload = JSON.parse(message.body);
          console.log("[BID WS PAYLOAD]", payload);
          setBidLogs((prev) => [
            {
              ...payload,
              createdAtDisplay: dayjs(payload.createdAt).format("HH:mm:ss"),
            },
            ...prev,
          ]);
        });

        if (token) {
          stomp.subscribe("/user/queue/bid_response", (response) => {
            if (!alive) return;
            handleBidResponse(JSON.parse(response.body));
          });
        }
      },
      (error) => {
        if (!alive) return;
        console.error("연결 실패:", error);
      },
    );

    return () => {
      alive = false;

      try {
        if (stompRef.current) stompRef.current.disconnect(() => {});
      } catch {
        //ignore
      }
      stompRef.current = null;

      try {
        if (socketRef.current) socketRef.current.close();
      } catch {
        //ignore
      }
      socketRef.current = null;
    };
  }, [product?.status, productId]);

  useEffect(() => {
    const uidRaw = sellerInfo?.userId;
    if (uidRaw == null) {
      setSeasonAwards(null);
      return;
    }

    const uid = Number(uidRaw);
    if (!Number.isFinite(uid)) {
      setSeasonAwards(null);
      return;
    }

    const token = localStorage.getItem("accessToken");
    if (!token) {
      setSeasonAwards(null);
      return;
    }

    let alive = true;

    (async () => {
      try {
        const dto = await fetchSeasonLatestForUser(token, uid);
        if (!alive) return;
        setSeasonAwards(dto);
      } catch {
        if (!alive) return;
        setSeasonAwards(null);
      }
    })();

    return () => {
      alive = false;
    };
  }, [sellerInfo?.userId]);

  const sendBid = () => {
    if (product?.status !== "PROCESSING") {
      showError("진행중인 경매가 아닙니다.");
      return;
    }
    const stomp = stompRef.current;
    if (!stomp || !stomp.connected) {
      showError("서버와 연결되지 않았습니다. 새로고침 후 다시 시도해주세요.");
      return;
    }
    const amountError = validateBidAmount(bidAmount);
    if (amountError) {
      showWarning(amountError);
      return;
    }
    const token = localStorage.getItem("accessToken");
    if (!token) {
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
      stomp.send(
        "/app/bid",
        { Authorization: `Bearer ${token}` },
        JSON.stringify(bid),
      );
    } catch (error) {
      if (bidTimeoutRef.current) clearTimeout(bidTimeoutRef.current);
      setBidLoading(false);
      showError("전송 실패");
      console.error(error);
    }
  };

  const images = product?.images
    ? [...product.images].sort((a, b) => a.position - b.position)
    : [];
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
      `width=${w},height=${h},left=${left},top=${top},resizable=yes`,
    );
  };

  const handleContactSeller = async () => {
    if (!canChatSeller) {
      alert("본인 상품에는 판매자 문의(채팅)가 불가합니다.");
      return;
    }
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
      const roomId = await openRoom(token, {
        targetEmail: sellerInfo.email,
        adminChat: false,
      });
      if (roomId) openRoomWindow(roomId);
    } catch (e: unknown) {
      console.error(e);
      alert("채팅방 연결 실패");
    }
  };

  // status에 따른 텍스트 및 스타일 설정
  const getStatusInfo = (status: string | undefined) => {
    switch (status) {
      case "READY":
        return {
          label: "경매 준비 중",
          color: "#64748b",
          bgColor: "rgba(148,163,184,0.12)",
          borderColor: "rgba(148,163,184,0.25)",
        };
      case "PROCESSING":
        return {
          label: "경매 진행 중",
          color: ACCENT,
          bgColor: ACCENT_SOFT,
          borderColor: "rgba(118,90,255,0.25)",
        };
      case "SELLED":
      case "NOTSELLED":
        return {
          label: "경매 종료",
          color: "#475569",
          bgColor: "rgba(148,163,184,0.12)",
          borderColor: "rgba(148,163,184,0.25)",
        };
      default:
        return {
          label: "알 수 없음",
          color: "#64748b",
          bgColor: "rgba(148,163,184,0.12)",
          borderColor: "rgba(148,163,184,0.25)",
        };
    }
  };

  const statusInfo = getStatusInfo(product?.status);

  const isLive = product?.status === "PROCESSING";
  const currentTopPrice =
    bidLogs.length > 0
      ? Number(bidLogs[0].bidAmount)
      : Number(product?.price || 0);

  // productId에 이상이 있을 경우 오류 페이지 렌더링
  if (errorState?.show) {
    return (
      <ErrorPage
        type={errorState.type}
        title={errorState.title}
        message={errorState.message}
      />
    );
  }

  // 상품 또는 판매자 정보 로딩
  if (!product || !sellerInfo) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-violet-600 mx-auto"></div>
          <p className="mt-4 text-slate-600">로딩 중...</p>
        </div>
      </div>
    );
  }

  // READY 상태 체크 (단, 본인 상품은 예외)
  if (product.status === "READY" && !isSelfSeller) {
    return (
      <ErrorPage
        type="404"
        title="경매 준비 중"
        message="아직 경매가 시작되지 않은 상품입니다. 경매 시작 시간을 확인해주세요."
      />
    );
  }

  return (
    <div className="min-h-screen bg-white pb-28 lg:h-screen lg:overflow-hidden lg:pb-0">
      <div className="sticky top-0 z-30 bg-white/95 backdrop-blur border-b border-slate-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3 min-w-0">
            <div className="min-w-0">
              <div className="text-xs text-slate-500 font-medium">
                상품 상세
              </div>
              <div className="text-sm font-extrabold text-slate-900 truncate">
                {product?.productName || "경매 상세"}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
              {!isSelfSeller && (
                <button
                  type="button"
                  onClick={() => {
                    setReportMode("PRODUCT");
                    setReportOpen(true);
                  }}
                  className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-[11px] font-extrabold text-rose-600 hover:bg-rose-100 transition"
                >
                  <Siren className="w-3 h-3" />
                  신고
                </button>
            )}
            <span
              className="px-3 py-1 rounded-full text-xs font-extrabold border"
              style={{
                color: isLive ? ACCENT : "#475569",
                backgroundColor: isLive
                  ? ACCENT_SOFT
                  : "rgba(148,163,184,0.12)",
                borderColor: isLive
                  ? "rgba(118,90,255,0.25)"
                  : "rgba(148,163,184,0.25)",
              }}
            >
              {isLive ? "LIVE" : "CLOSED"}
            </span>
            <span className="hidden sm:inline text-xs text-slate-400">
              POT #{productId}
            </span>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8 lg:h-[calc(100vh-64px)] lg:overflow-hidden">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:h-full">
          {/* LEFT */}
          <div
            ref={leftScrollRef}
            className="lg:col-span-8 lg:h-full lg:overflow-y-auto lg:overscroll-contain lg:pr-2 no-scrollbar"
          >
            <div className="rounded-[28px] border border-slate-100 bg-white overflow-hidden">
              {/* Header */}
              <div className="p-6 md:p-8">
                <div className="flex items-start justify-between gap-4">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-xs text-slate-500 font-semibold">
                        POT #{productId}
                      </span>
                      <span className="text-slate-300">•</span>
                      <span className="text-xs text-slate-500">
                        {statusInfo.label}
                      </span>

                      {product?.status === "PROCESSING" && (
                        <span
                          className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-extrabold border"
                          style={{
                            color: ACCENT,
                            backgroundColor: ACCENT_SOFT,
                            borderColor: "rgba(118,90,255,0.25)",
                          }}
                        >
                          <span
                            className="w-2 h-2 rounded-full"
                            style={{ backgroundColor: ACCENT }}
                          />
                          LIVE
                        </span>
                      )}
                    </div>

                    <h1 className="mt-2 text-2xl md:text-3xl font-extrabold text-slate-900 leading-tight">
                      {product?.productName || "상품명을 불러오는 중..."}
                    </h1>

                    {!isSelfSeller && (
                      <button
                        type="button"
                        onClick={() => {
                          setReportMode("PRODUCT");
                          setReportOpen(true);
                        }}
                        className="mt-2 text-xs font-extrabold flex items-center gap-1 text-slate-400 hover:text-rose-600 transition cursor-pointer"
                      >
                        <Siren className="w-3.5 h-3.5" />
                        상품 신고
                      </button>
                    )}

                    <div className="mt-4">
                      {" "}
                      <SeasonAwardChips
                        data={seasonAwards}
                        accent={ACCENT}
                        accentSoft={ACCENT_SOFT}
                        max={3}
                      />{" "}
                    </div>
                  </div>
                  <div className="hidden md:block text-right">
                    <div className="text-xs text-slate-500 font-bold">
                      현재 최고가
                    </div>
                    <div className="mt-1 text-2xl font-extrabold text-slate-900 tabular-nums">
                      ₩{formatNumber(String(currentTopPrice))}
                    </div>
                    <div className="mt-2 text-xs text-slate-500">
                      시작가 ₩{formatNumber(String(product?.price || 0))}
                    </div>

                    {/* 준비중 + 본인 상품일 때 수정/삭제 버튼 */}
                    {product?.status === "READY" && isSelfSeller && (
                      <div className="mt-3 flex gap-2 justify-end relative z-30">
                        <button
                          onClick={() => handleUpdateProduct()}
                          className="px-3 py-1.5 rounded-full text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-200 hover:bg-amber-100 hover:border-amber-300 active:scale-95 transition-all cursor-pointer flex items-center gap-1"
                        >
                          <svg
                            className="w-3.5 h-3.5"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth="2"
                              d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                            />
                          </svg>
                          수정
                        </button>
                        <button
                          onClick={() => handleDeleteProduct()}
                          className="px-3 py-1.5 rounded-full text-xs font-semibold bg-rose-50 text-rose-700 border border-rose-200 hover:bg-rose-100 hover:border-rose-300 active:scale-95 transition-all cursor-pointer flex items-center gap-1"
                        >
                          <svg
                            className="w-3.5 h-3.5"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth="2"
                              d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                            />
                          </svg>
                          삭제
                        </button>
                      </div>
                    )}
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
                  {/* <div className="absolute inset-0 bg-gradient-to-b from-slate-50 to-white" /> */}
                  <div className="relative z-10 h-full p-4 sm:p-5">
                    <div className="h-full w-full rounded-[26px] border border-slate-100 bg-white overflow-hidden">
                      <div className="h-full w-full flex items-center justify-center">
                        <img
                          src={mainImageUrl}
                          alt="Product"
                          className="w-full h-full object-contain p-4 sm:p-6 transition-transform duration-500"
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
                        <span className="font-extrabold text-slate-900">
                          {statusInfo.label}
                        </span>
                      </div>
                    </div>
                  )}

                  <button
                    onClick={prevImage}
                    disabled={images.length <= 1}
                    className="absolute z-30 left-5 top-1/2 -translate-y-1/2 p-3 rounded-full bg-transparent hover:bg-black/5 transition disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    <ChevronLeft className="w-5 h-5 text-slate-800" />
                  </button>
                  <button
                    onClick={nextImage}
                    disabled={images.length <= 1}
                    className="absolute z-30 right-5 top-1/2 -translate-y-1/2 p-3 rounded-full bg-transparent hover:bg-black/5 transition disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    <ChevronRight className="w-5 h-5 text-slate-800" />
                  </button>

                  <div className="absolute z-30 top-3 right-3 flex gap-1.5">
                    <button
                      onClick={handleWishlistToggle}
                      disabled={!canWishlist}
                      className={
                        "p-2.5 rounded-full border transition active:scale-95" +
                        (canWishlist ? "" : "opacity-50 cursor-not-allowed")
                      }
                      style={{
                        backgroundColor: !canWishlist
                          ? "rgba(148,163,184,0.10)"
                          : wishlistId
                            ? "rgba(244,63,94,0.10)"
                            : "white",
                        color: !canWishlist
                          ? "#94a3b8"
                          : wishlistId
                            ? "rgb(244,63,94)"
                            : "#64748b",
                        borderColor: !canWishlist
                          ? "rgba(148,163,184,0.35)"
                          : wishlistId
                            ? "rgba(244,63,94,0.18)"
                            : "rgba(148,163,184,0.35)",
                      }}
                    >
                      <Heart
                        className={`w-4 h-4 ${wishlistId && canWishlist ? "fill-current" : ""}`}
                      />
                    </button>

                    <div className="relative">
                      <button
                        onClick={() => {
                          navigator.clipboard.writeText(window.location.href);
                          setCopied(true);
                          setTimeout(() => setCopied(false), 1800);
                        }}
                        className="p-2.5 rounded-full bg-white text-slate-500 border border-slate-200 hover:bg-slate-50 transition active:scale-95"
                      >
                        {copied ? (
                          <Check
                            className="w-4 h-4"
                            style={{ color: ACCENT }}
                          />
                        ) : (
                          <Share2 className="w-4 h-4" />
                        )}
                      </button>

                      {copied && (
                        <div className="absolute right-0 top-10 px-3 py-1.5 rounded-xl bg-slate-900 text-white text-xs">
                          링크가 복사됐어요
                        </div>
                      )}
                    </div>
                  </div>

                  {/* <div className="absolute z-30 bottom-5 left-5">
                    <div className="px-3 py-1.5 rounded-full bg-white border border-slate-200 text-xs font-extrabold text-slate-700">
                      {images.length > 0 ? `${currentImageIndex + 1} / ${images.length}` : "0 / 0"}
                    </div>
                  </div> */}
                </div>

                {images.length > 1 && (
                  <div className="px-6 pb-6 -mt-2">
                    <div className="flex items-center justify-center gap-2">
                      {images.map((_, idx) => {
                        const active = idx === currentImageIndex;
                        return (
                          <button
                            key={idx}
                            type="button"
                            onClick={() => setCurrentImageIndex(idx)}
                            className={`h-1 rounded-full transition-all ${
                              active ? "w-10" : "w-6 hover:w-8"
                            }`}
                            style={{
                              backgroundColor: active
                                ? ACCENT
                                : "rgba(148,163,184,0.45)",
                            }}
                            aria-label={`이미지 ${idx + 1}로 이동`}
                            aria-current={active ? "true" : "false"}
                          />
                        );
                      })}
                    </div>

                    <div className="mt-2 text-center text-xs font-extrabold text-slate-400 tabular-nums">
                      {currentImageIndex + 1} / {images.length}
                    </div>
                  </div>
                )}
              </div>

              <div className="border-t border-slate-100" />
              <div ref={bidDetailAnchorRef} />

              {bidDetailOpen && (
                <BidDetailPanel
                  bidLogs={bidLogs}
                  isLive={isLive}
                  ACCENT={ACCENT}
                  ACCENT_SOFT={ACCENT_SOFT}
                />
              )}

              {bidDetailOpen && <div className="border-t border-slate-100" />}
              {/* 상세 정보 */}
              <div className="p-6 md:p-8">
                <div className="flex items-center justify-between">
                  <h2 className="text-base md:text-lg font-extrabold text-slate-900 flex items-center gap-2">
                    <AlertCircle
                      className="w-5 h-5"
                      style={{ color: ACCENT }}
                    />
                    상품 상세 정보
                  </h2>
                  <div className="text-xs text-slate-400">
                    설명 / 구성 / 상태
                  </div>
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
                    <div className="text-sm font-extrabold text-slate-900">
                      거래 안내
                    </div>
                    <ul className="mt-2 text-sm text-slate-600 space-y-1">
                      <li>• 입찰 후 취소는 불가합니다.</li>
                      <li>• 낙찰 후 취소는 불가합니다.</li>
                      <li>• 상품 상태는 상품설명을 기준으로 합니다.</li>
                    </ul>
                  </div>
                  <div className="rounded-2xl border border-slate-100 bg-slate-50/40 p-4">
                    <div className="text-sm font-extrabold text-slate-900">
                      배송 / 수령
                    </div>
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
                      {/* <div className="text-sm font-extrabold text-slate-900">입찰</div> */}
                      <div className="text-xs text-slate-500 mt-1">
                        {statusInfo.label}
                      </div>
                    </div>

                    <span
                      className="px-3 py-1 rounded-full text-xs font-extrabold border"
                      style={{
                        color: isLive ? ACCENT : "#475569",
                        backgroundColor: isLive
                          ? ACCENT_SOFT
                          : "rgba(148,163,184,0.12)",
                        borderColor: isLive
                          ? "rgba(118,90,255,0.25)"
                          : "rgba(148,163,184,0.25)",
                      }}
                    >
                      {isLive ? "LIVE" : "CLOSED"}
                    </span>
                  </div>

                  <div className="mt-5 rounded-2xl border border-slate-100 bg-slate-50/40 p-4">
                    <div className="flex items-center justify-between">
                      <div className="text-xs font-extrabold text-slate-500">
                        현재 최고가
                      </div>
                      {isLive && (
                        <div
                          className="flex items-center gap-2 text-[11px] font-extrabold"
                          style={{ color: ACCENT }}
                        >
                          <span
                            className="w-2 h-2 rounded-full"
                            style={{ backgroundColor: ACCENT }}
                          />
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
                      {(["hours", "minutes", "seconds"] as const).map(
                        (unit) => (
                          <div
                            key={unit}
                            className="rounded-2xl border border-slate-100 bg-white p-3 text-center"
                          >
                            <div className="text-xl font-extrabold text-slate-900 tabular-nums">
                              {timeLeft[unit].toString().padStart(2, "0")}
                            </div>
                            <div className="mt-1 text-[10px] font-extrabold text-slate-400 tracking-widest">
                              {unit === "hours"
                                ? "시간"
                                : unit === "minutes"
                                  ? "분"
                                  : "초"}
                            </div>
                          </div>
                        ),
                      )}
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
                        backgroundColor: isLive
                          ? ACCENT
                          : "rgba(148,163,184,0.20)",
                        color: isLive ? "white" : "#94a3b8",
                      }}
                    >
                      {bidLoading ? (
                        <span className="w-5 h-5 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                      ) : isLive ? (
                        "입찰하기"
                      ) : (
                        "입찰 마감"
                      )}
                    </button>

                    <div className="mt-3 rounded-2xl border border-slate-200 bg-white overflow-hidden">
                      <button
                        type="button"
                        onClick={() => setBidPolicyOpen((v) => !v)}
                        className="w-full px-4 py-3 flex items-center justify-between hover:bg-slate-50 transition"
                      >
                        <div className="flex items-center gap-2">
                          {" "}
                          <AlertCircle
                            className="w-4 h-4"
                            style={{ color: ACCENT }}
                          />
                          <span className="text-sm font-extrabold text-slate-900">
                            입찰 정책
                          </span>
                        </div>
                        <span
                          className="text-xs font-extrabold"
                          style={{ color: ACCENT }}
                        >
                          {bidPolicyOpen ? "접기" : "펼치기"}
                        </span>
                      </button>
                      <div
                        className="px-4 pb-4 text-xs text-slate-600 leading-relaxed"
                        style={{
                          maxHeight: bidPolicyOpen ? 320 : 92,
                          overflow: "hidden",
                          transition: "max-height 220ms ease",
                        }}
                      >
                        <ul className="space-y-1">
                          {" "}
                          {BID_POLICIES.map((t, i) => (
                            <li key={i}>• {t}</li>
                          ))}{" "}
                        </ul>
                        {!bidPolicyOpen && (
                          <div
                            className="mt-2 text-[11px]"
                            style={{ color: ACCENT }}
                          >
                            더 보기
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                <div className="border-t border-slate-100" />

                <div className="p-5">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <TrendingUp
                        className="w-5 h-5"
                        style={{ color: ACCENT }}
                      />
                      <div className="font-extrabold text-slate-900 text-sm">
                        실시간 입찰 내역
                      </div>
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

                    <div className="flex items-center gap-3">
                      <div className="text-xs text-slate-500">
                        {bidLogs.length}건
                      </div>

                      <button
                        type="button"
                        onClick={() => {
                          if (bidDetailOpen) setBidDetailOpen(false);
                          else openBidDetailAndScroll();
                        }}
                        className="text-xs font-extrabold text-slate-500 hover:text-slate-900 transition"
                      >
                        {bidDetailOpen ? "닫기" : "자세히 보기"}
                      </button>
                    </div>
                  </div>

                  <div className="mt-3 max-h-[420px] overflow-y-auto rounded-2xl border border-slate-100 bg-white">
                    {bidLogs.length === 0 ? (
                      <div className="py-12 text-center text-slate-400">
                        <div className="font-semibold text-sm">
                          아직 입찰 내역이 없습니다.
                        </div>
                        <div className="text-xs mt-1">
                          첫 번째 입찰자가 되어보세요
                        </div>
                      </div>
                    ) : (
                      <div className="divide-y divide-slate-100">
                        {bidLogs.map((bid, index) => {
                          const isTop = index === 0 && isLive;
                          // const initial = (bid.profileImageUrl || "?").slice(
                          //   0,
                          //   1,
                          // );

                          return (
                            <div
                              key={index}
                              className="relative px-4 py-3"
                              style={{
                                backgroundColor: isTop ? ACCENT_SOFT : "white",
                              }}
                            >
                              {isTop && (
                                <div
                                  className="absolute left-0 top-0 bottom-0 w-1"
                                  style={{ backgroundColor: ACCENT }}
                                />
                              )}

                              <div className="flex items-center justify-between gap-3">
                                <div className="flex items-center gap-3 min-w-0">
                                  <div
                                    className="w-9 h-9 rounded-2xl border flex items-center justify-center text-[12px] font-extrabold"
                                    style={{
                                      borderColor: isTop
                                        ? "rgba(118,90,255,0.35)"
                                        : "rgba(148,163,184,0.35)",
                                      backgroundColor: isTop
                                        ? "rgba(118,90,255,0.12)"
                                        : "white",
                                      color: isTop ? ACCENT : "#334155",
                                    }}
                                    title={bid.userNickName}
                                  >
                                    <BidAvatar
                                      url={bid.profileImageUrl}
                                      name={bid.userNickName}
                                      isTop={isTop}
                                      ACCENT={ACCENT}
                                    />
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
                                            borderColor:
                                              "rgba(118,90,255,0.25)",
                                          }}
                                        >
                                          최고가
                                        </span>
                                      )}
                                    </div>

                                    <div className="text-[10px] text-slate-400 font-mono">
                                      {" "}
                                      {bid.createdAtDisplay ??
                                        bid.createdAt}{" "}
                                    </div>
                                  </div>
                                </div>

                                <div className="text-right">
                                  <div
                                    className="font-extrabold tabular-nums"
                                    style={{
                                      color: isTop ? ACCENT : "#0f172a",
                                    }}
                                  >
                                    ₩{formatNumber(String(bid.bidAmount))}
                                  </div>

                                  {isTop && (
                                    <div className="mt-1 inline-flex items-center gap-1 text-[10px] font-extrabold">
                                      <ArrowUp
                                        className="w-3 h-3"
                                        style={{ color: ACCENT }}
                                      />
                                      <span style={{ color: ACCENT }}>
                                        Highest
                                      </span>
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
                    <div className="text-sm font-extrabold text-slate-900">
                      판매자 정보
                    </div>
                    <div className="text-xs text-slate-500 mt-1">
                      문의/거래는 채팅을 이용하세요
                    </div>
                  </div>

                  <button
                    type="button"
                    disabled={!canReportSeller}
                    onClick={() => {
                      if (!canReportSeller) return;
                      setReportMode("USER");
                      setReportOpen(true);
                    }}
                    className={
                      "text-xs font-extrabold flex items-center gap-1 transition " +
                      (canReportSeller
                        ? "text-slate-400 hover:text-rose-600 cursor-pointer"
                        : "text-slate-300 cursor-not-allowed opacity-60")
                    }
                    title={
                      canReportSeller
                        ? "신고"
                        : "본인에게는 신고할 수 없습니다."
                    }
                  >
                    <Siren className="w-3.5 h-3.5" />
                    신고
                  </button>
                </div>
                <div className="mt-5 flex items-center gap-4">
                  <button
                    type="button"
                    onClick={goSellerProfile}
                    className="w-14 h-14 rounded-2xl border border-slate-200 overflow-hidden bg-slate-50 flex items-center justify-center hover:ring-2 hover:ring-slate-900/5 transition"
                    title="프로필 보기"
                  >
                    {sellerInfo?.profileImageUrl ? (
                      <img
                        src={sellerInfo.profileImageUrl}
                        alt="Seller"
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <User className="w-7 h-7 text-slate-300" />
                    )}
                  </button>
                  <div className="flex-1 min-w-0">
                    {" "}
                    <div className="flex items-center gap-2 min-w-0">
                      <button
                        type="button"
                        onClick={goSellerProfile}
                        className="text-lg font-extrabold text-slate-900 truncate hover:underline"
                        title="프로필 보기"
                      >
                        {" "}
                        {sellerInfo?.nickname || "판매자"}
                      </button>
                      <button
                        type="button"
                        onClick={goSellerProfile}
                        className="px-2 py-0.5 rounded-full text-[11px] font-extrabold border hover:bg-slate-50 transition shrink-0"
                        style={{
                          color: ACCENT,
                          borderColor: "rgba(118,90,255,0.25)",
                          backgroundColor: ACCENT_SOFT,
                        }}
                      >
                        프로필
                      </button>
                    </div>
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
                    disabled={!canChatSeller}
                    className={
                      "py-3 rounded-2xl border font-extrabold text-sm transition flex items-center justify-center gap-2 " +
                      (canChatSeller
                        ? "bg-white border-slate-200 text-slate-900 hover:bg-slate-50"
                        : "bg-slate-50 border-slate-200 text-slate-400 cursor-not-allowed opacity-70")
                    }
                    title={
                      canChatSeller
                        ? "1:1 문의"
                        : "본인 상품에는 판매자 문의(채팅)가 불가합니다."
                    }
                  >
                    <MessageCircle className="w-4 h-4" />
                    1:1 문의
                  </button>

                  <div
                    className="py-3 rounded-2xl text-white text-center"
                    style={{ backgroundColor: ACCENT }}
                  >
                    <div className="text-[11px] text-white/70 font-extrabold">
                      신뢰도
                    </div>
                    <div className="text-sm font-extrabold">98%</div>
                  </div>
                </div>

                <ReportModal
                  open={reportOpen}
                  onClose={() => setReportOpen(false)}
                  mode={reportMode}
                  targetUserId={sellerInfo?.userId}
                  targetUserName={sellerInfo?.nickname}
                  productId={product?.productId}
                  productName={product?.productName}
                />
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
              <div className="text-[11px] text-slate-500 font-extrabold">
                현재 최고가
              </div>
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

type BidDetailPanelProps = {
  bidLogs: BidLogDto[];
  isLive: boolean;
  ACCENT: string;
  ACCENT_SOFT: string;
};

function parseBidMs(createdAt?: string | null): number | null {
  if (!createdAt) return null;

  if (createdAt.includes("T")) {
    const t = Date.parse(createdAt);
    return Number.isFinite(t) ? t : null;
  }

  if (/^\d{2}:\d{2}:\d{2}$/.test(createdAt)) {
    const today = dayjs().format("YYYY-MM-DD");
    const t = dayjs(`${today} ${createdAt}`, "YYYY-MM-DD HH:mm:ss").valueOf();
    return Number.isFinite(t) ? t : null;
  }

  if (/^\d{2}.\d{2}.\d{2}\s\d{2}:\d{2}$/.test(createdAt)) {
    const t = dayjs(createdAt, "YY.MM.DD HH:mm").valueOf();
    return Number.isFinite(t) ? t : null;
  }

  const t = dayjs(createdAt).valueOf();
  return Number.isFinite(t) ? t : null;
}

type SeriesPoint = { xLabel: string; from: number; to: number; count: number };

function buildBidSeries(bidLogs: BidLogDto[], rangeMs: number, binMs: number) {
  const times = bidLogs
    .map((b) => parseBidMs(b.createdAt))
    .filter((t): t is number => typeof t === "number" && Number.isFinite(t))
    .sort((a, b) => a - b);

  if (times.length === 0)
    return {
      points: [] as SeriesPoint[],
      maxY: 0,
      peak: undefined as SeriesPoint | undefined,
    };

  const end = times[times.length - 1];
  const start = end - rangeMs;

  const bucketCount = Math.max(2, Math.floor((end - start) / binMs) + 1);

  const points: SeriesPoint[] = Array.from({ length: bucketCount }).map(
    (_, i) => {
      const from = start + i * binMs;
      const to = from + binMs;
      let count = 0;
      for (const t of times) if (t >= from && t < to) count++;
      const xLabel = dayjs(from).format("HH:mm");
      return { xLabel, from, to, count };
    },
  );

  const maxY = Math.max(...points.map((p) => p.count), 0);
  let peak: SeriesPoint | undefined = undefined;
  for (const p of points) if (!peak || p.count > peak.count) peak = p;

  return { points, maxY, peak };
}

function BidLineChart(props: {
  points: SeriesPoint[];
  maxY: number;
  ACCENT: string;
}) {
  const { points, maxY, ACCENT } = props;

  if (points.length < 2) {
    return (
      <div className="h-[140px] rounded-2xl border border-slate-100 bg-white grid place-items-center text-xs text-slate-400">
        차트를 표시할 데이터가 부족합니다.
      </div>
    );
  }

  const W = 640;
  const H = 140;
  const padL = 32;
  const padR = 16;
  const padT = 16;
  const padB = 28;

  const innerW = W - padL - padR;
  const innerH = H - padT - padB;

  const n = points.length;
  const safeMax = Math.max(1, maxY);

  const xy = points.map((p, i) => {
    const x = padL + (i / (n - 1)) * innerW;
    const y = padT + innerH - (p.count / safeMax) * innerH;
    return { x, y, p };
  });

  const d = xy
    .map(
      (pt, i) => `${i === 0 ? "M" : "L"} ${pt.x.toFixed(1)} ${pt.y.toFixed(1)}`,
    )
    .join(" ");

  const first = points[0]?.xLabel ?? "";
  const mid = points[Math.floor((n - 1) / 2)]?.xLabel ?? "";
  const last = points[n - 1]?.xLabel ?? "";

  return (
    <div className="rounded-2xl border border-slate-100 bg-white p-3">
      <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-[140px]">
        {[0, 0.5, 1].map((r, idx) => {
          const y = padT + innerH * r;
          return (
            <line
              key={idx}
              x1={padL}
              x2={W - padR}
              y1={y}
              y2={y}
              stroke="rgba(148,163,184,0.30)"
              strokeWidth="1"
            />
          );
        })}

        <path
          d={d}
          fill="none"
          stroke={ACCENT}
          strokeWidth="3"
          strokeLinecap="round"
          strokeLinejoin="round"
        />

        {xy.map((pt, idx) => (
          <circle key={idx} cx={pt.x} cy={pt.y} r="4" fill={ACCENT} />
        ))}

        <text x={padL} y={H - 10} fontSize="12" fill="rgba(100,116,139,0.9)">
          {first}
        </text>
        <text
          x={W / 2}
          y={H - 10}
          fontSize="12"
          fill="rgba(100,116,139,0.9)"
          textAnchor="middle"
        >
          {mid}
        </text>
        <text
          x={W - padR}
          y={H - 10}
          fontSize="12"
          fill="rgba(100,116,139,0.9)"
          textAnchor="end"
        >
          {last}
        </text>

        <text
          x={W - padR}
          y={14}
          fontSize="12"
          fill="rgba(100,116,139,0.9)"
          textAnchor="end"
        >
          {safeMax}건
        </text>
      </svg>
    </div>
  );
}

function BidDetailPanel({
  bidLogs,
  isLive,
  ACCENT,
  ACCENT_SOFT,
}: BidDetailPanelProps) {
  const rangeMs = isLive ? 60 * 60 * 1000 : 24 * 60 * 60 * 1000;
  const binMs = isLive ? 5 * 60 * 1000 : 30 * 60 * 1000;

  const { points, maxY, peak } = useMemo(
    () => buildBidSeries(bidLogs, rangeMs, binMs),
    [bidLogs, rangeMs, binMs],
  );

  const sorted = useMemo(() => {
    return [...(bidLogs || [])]
      .map((b) => ({ b, t: parseBidMs(b.createdAt) ?? 0 }))
      .sort((a, c) => c.t - a.t)
      .map((x) => x.b);
  }, [bidLogs]);

  const peakLabel =
    peak && peak.count > 0
      ? `${dayjs(peak.from).format("HH:mm")}~${dayjs(peak.to).format("HH:mm")} (${peak.count}건)`
      : "데이터 없음";

  return (
    <div className="p-6 md:p-8">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="text-base font-extrabold text-slate-900">
            실시간 입찰 상세
          </div>
          <div className="mt-1 text-xs text-slate-500">
            {isLive ? "최근 60분" : "최근 24시간"} · 피크:{" "}
            <span className="font-extrabold" style={{ color: ACCENT }}>
              {peakLabel}
            </span>
          </div>
        </div>

        <span
          className="px-3 py-1 rounded-full text-xs font-extrabold border"
          style={{
            color: isLive ? ACCENT : "#475569",
            backgroundColor: isLive ? ACCENT_SOFT : "rgba(148,163,184,0.12)",
            borderColor: isLive
              ? "rgba(118,90,255,0.25)"
              : "rgba(148,163,184,0.25)",
          }}
        >
          {isLive ? "LIVE" : "CLOSED"}
        </span>
      </div>

      <div className="mt-4">
        <BidLineChart points={points} maxY={maxY} ACCENT={ACCENT} />
        <div className="mt-2 text-[11px] text-slate-400">
          y축: 입찰 건수 · x축: 시간
        </div>
      </div>

      <div className="mt-4 rounded-2xl border border-slate-100 bg-white overflow-hidden">
        <div className="px-4 py-3 bg-slate-50/40 flex items-center justify-between">
          <div className="text-sm font-extrabold text-slate-900">입찰 내역</div>
          <div className="text-xs text-slate-500">{sorted.length}건</div>
        </div>

        <div className="max-h-[550px] overflow-y-auto divide-y divide-slate-100">
          {sorted.length === 0 ? (
            <div className="py-12 text-center text-slate-400">
              <div className="font-semibold text-sm">입찰 내역이 없습니다.</div>
              <div className="text-xs mt-1">
                입찰이 발생하면 여기에 표시됩니다.
              </div>
            </div>
          ) : (
            sorted.map((bid, idx) => {
              const t = parseBidMs(bid.createdAt);
              const timeLabel = t
                ? dayjs(t).format(isLive ? "HH:mm:ss" : "YY.MM.DD HH:mm")
                : String(bid.createdAt ?? "");

              const isTop = idx === 0 && isLive;

              return (
                <div
                  key={idx}
                  className="px-4 py-3 flex items-center justify-between gap-3"
                  style={{ backgroundColor: isTop ? ACCENT_SOFT : "white" }}
                >
                  <div className="flex items-center gap-3 min-w-0 flex-1">
                    <BidAvatar
                      url={bid.profileImageUrl}
                      name={bid.userNickName}
                      isTop={isTop}
                      ACCENT={ACCENT}
                    />

                    <div className="min-w-0">
                      <div className="flex items-center gap-2 min-w-0">
                        <div className="text-sm font-extrabold text-slate-900 truncate">
                          {bid.userNickName}
                        </div>

                        {isTop && (
                          <span
                            className="px-2 py-0.5 rounded-full text-[10px] font-extrabold border shrink-0"
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

                      <div className="text-[11px] text-slate-400 font-mono">
                        {timeLabel}
                      </div>
                    </div>
                  </div>

                  <div className="text-right shrink-0 min-w-[110px] self-start">
                    <div className="font-extrabold tabular-nums text-slate-900 whitespace-nowrap">
                      ₩{Number(bid.bidAmount ?? 0).toLocaleString("ko-KR")}
                    </div>
                    {isTop && (
                      <div
                        className="text-[10px] font-extrabold whitespace-nowrap"
                        style={{ color: ACCENT }}
                      >
                        highest
                      </div>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}

function BidAvatar(props: {
  url?: string | null;
  name?: string | null;
  isTop?: boolean;
  ACCENT: string;
}) {
  const { url, name, isTop, ACCENT } = props;
  const initial = (name || "?").slice(0, 1);

  return (
    <div
      className="w-9 h-9 rounded-2xl border overflow-hidden relative flex items-center justify-center text-[12px] font-extrabold"
      style={{
        borderColor: isTop ? "rgba(118,90,255,0.35)" : "rgba(148,163,184,0.35)",
        backgroundColor: isTop ? "rgba(118,90,255,0.12)" : "white",
        color: isTop ? ACCENT : "#334155",
      }}
      title={name || ""}
    >
      <span className="relative z-0">{initial}</span>

      {!!url && (
        <img
          src={url}
          alt={name || "user"}
          className="absolute inset-0 w-full h-full object-cover"
          loading="lazy"
          decoding="async"
          onError={(e) => {
            (e.currentTarget as HTMLImageElement).style.display = "none";
          }}
        />
      )}
    </div>
  );
}
