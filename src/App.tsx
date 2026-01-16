import { Route, Routes, useLocation } from "react-router-dom";
import Home from "./pages/home/Home";
import Navbar from "./components/Navbar";
import AuctionDetail from "./pages/auction_detail/AuctionDetail";
import AuctionDetailModal from "./pages/auction_detail/AuctionDetailModal";
import LoginPage from "./pages/login/LoginPage";
import AuctionListPage from "./pages/auction_list/AuctionListPage";
import { AuthProvider } from "./contexts/AuthProvider";

import SellProductPage from "./pages/sell_product_page/SellProductPage";
import RegisterPage from "./pages/register/Register";
import { ChatProvider } from "./contexts/ChatProvider";
import ChatListPopup from "./pages/chat/ChatListPopup";
import ChatRoomPopup from "@/pages/chat/ChatRoomPopup";
import { FcmNotificationCenter } from "./components/fcm/FcmNotificationCenter";

import AdminDashboard from "@/pages/admin/pages/AdminDashboard";

import MyWishlist from "./pages/mypage/wishlist/MyWishlist";
import MyBidlist from "./pages/mypage/bidlist/MyBidlist";
import MyAuctionlist from "./pages/mypage/auctionlist/MyAuctionlist";
import MyProfile from "./pages/mypage/profile/MyProfile";
import ModalProvider from "./contexts/ModalProvider";

function App() {
  const location = useLocation();
  const state = location.state as { backgroundLocation?: Location } | null;
  const backgroundLocation = state?.backgroundLocation;

  return (
    <ModalProvider>
      <AuthProvider>
        <ChatProvider>
          <FcmNotificationCenter />

          {/* 1) 기본 화면: backgroundLocation이 있으면 "뒤에 깔릴 화면"을 그걸로 렌더 */}
          <Routes location={backgroundLocation || location}>
            {/* 팝업 전용: Navbar 없이 렌더링 */}
            <Route path="/chat-popup" element={<ChatListPopup />} />
            <Route path="/admin/*" element={<AdminDashboard />} />

            {/* 일반 페이지는 Navbar 래핑 */}
            <Route element={<Navbar />}>
              <Route path="/" element={<Home />} />
              <Route
                path="/auction_detail/:productId"
                element={<AuctionDetail />}
              />
              <Route path="/login" element={<LoginPage />} />
              <Route path="/auction_list" element={<AuctionListPage />} />
              <Route path="/mypage/profile" element={<MyProfile />} />
              <Route path="/mypage/wishlist" element={<MyWishlist />} />
              <Route path="/mypage/bidlist" element={<MyBidlist />} />
              <Route path="/mypage/auctionlist" element={<MyAuctionlist />} />
              <Route path="/sell_product" element={<SellProductPage />} />
              <Route path="/register" element={<RegisterPage />} />
            </Route>

            <Route path="/chat-list" element={<ChatListPopup />} />
            <Route path="/chat" element={<ChatRoomPopup />} />
          </Routes>

          {/* 2) 모달 화면: backgroundLocation이 있을 때만 "위에 덮는 모달" 렌더 */}
          {backgroundLocation && (
            <Routes>
              <Route
                path="/auction_detail/:productId"
                element={<AuctionDetailModal />}
              />
            </Routes>
          )}
        </ChatProvider>
      </AuthProvider>
    </ModalProvider>
  );
}
export default App;
