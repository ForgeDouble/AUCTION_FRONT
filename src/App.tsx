import { Route, Routes } from "react-router-dom";
import Home from "./pages/home/Home";
import Navbar from "./components/Navbar";
import AuctionDetail from "./pages/auction_detail/AuctionDetail";
import LoginPage from "./pages/login/LoginPage";
import AuctionListPage from "./pages/auction_list/AuctionListPage";
import { AuthProvider } from "./contexts/AuthProvider";
import MyPage from "./pages/mypage/Mypage";
import SellProductPage from "./pages/sell_product_page/SellProductPage";
import RegisterPage from "./pages/register/Register";
import Chat from "./pages/chat/Chat";
import { ChatProvider } from "./contexts/ChatProvider";
import ChatListPopup from "./pages/chat/ChatListPopup"; // ⬅️ 추가
function App() {
  return (
    <AuthProvider>
      <ChatProvider>
        <Routes>
          {/* 팝업 전용: Navbar 없이 렌더링 */}
          <Route path="/chat-popup" element={<ChatListPopup />} />

          {/* 일반 페이지는 Navbar 래핑 */}
          <Route element={<Navbar />}>
            <Route path="/" element={<Home />} />
            <Route path="/auction_detail/:productId" element={<AuctionDetail />} />
            <Route path="/login" element={<LoginPage />} />
            <Route path="/auction_list" element={<AuctionListPage />} />
            <Route path="/mypage" element={<MyPage />} />
            <Route path="/sell_product" element={<SellProductPage />} />
            <Route path="/register" element={<RegisterPage />} />
            <Route path="/chat" element={<Chat />} />
          </Route>
        </Routes>
      </ChatProvider>
    </AuthProvider>
  );
}
export default App;
