import { Route, Routes } from "react-router-dom";
import Home from "./pages/home/Home";
import Navbar from "./components/Navbar";
import AuctionDetail from "./pages/auction_detail/AuctionDetail";
import LoginPage from "./pages/login/LoginPage";
import AuctionListPage from "./pages/auction_list/AuctionListPage";
import { AuthProvider } from "./contexts/AuthProvider";

import SellProductPage from "./pages/sell_product_page/SellProductPage";
import RegisterPage from "./pages/register/Register";
// import { useEffect } from "react";
// import { requestFcmToken } from "./firebase/firebase";
import { ChatProvider } from "./contexts/ChatProvider";
import ChatListPopup from "./pages/chat/ChatListPopup";
import ChatRoomPopup from "@/pages/chat/ChatRoomPopup";
import { FcmNotificationCenter } from "./components/fcm/FcmNotificationCenter";
import MyWishlist from "./pages/mypage/wishlist/MyWishlist";

import MyBidlist from "./pages/mypage/bidlist/MyBidlist";
import MyAuctionlist from "./pages/mypage/auctionlist/MyAuctionlist";
import MyProfile from "./pages/mypage/profile/MyProfile";

function App() {
  // fcm 로그 확인용
  // useEffect(() => { (async () => {
  //   console.log("[App] FCM 디버그용 토큰 요청 시작");
  //   const token = await requestFcmToken();
  //   console.log("[App] FCM 디버그용 토큰 결과:", token);
  // })();
  //   }, []);
  return (
    <AuthProvider>
      <ChatProvider>
        <FcmNotificationCenter />
        <Routes>
          {/* 팝업 전용: Navbar 없이 렌더링 */}
          <Route path="/chat-popup" element={<ChatListPopup />} />

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
            {/* <Route path="/chat" element={<Chat />} /> */}
          </Route>
          <Route path="/chat-list" element={<ChatListPopup />} />
          <Route path="/chat" element={<ChatRoomPopup />} />
        </Routes>
      </ChatProvider>
    </AuthProvider>
  );
}

export default App;
