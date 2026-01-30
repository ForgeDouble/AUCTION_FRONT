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
import ProtectedRoute from "./components/route/ProtectedRoute";
import PublicRoute from "./components/route/PublicRoute";
import Footer from "./components/Footer";
import ForgotPassword from "./pages/forgot_password/ForgotPassword";
import ResetPassword from "./pages/forgot_password/ResetPassword";

function App() {
  const location = useLocation();
  const state = location.state as { backgroundLocation?: Location } | null;
  const backgroundLocation = state?.backgroundLocation;

  // Footer를 숨길 경로들 정의
  const hideFooterPaths = ["/chat-popup", "/chat-list", "/chat"];
  const shouldHideFooter =
    hideFooterPaths.includes(location.pathname) ||
    location.pathname.startsWith("/admin");

  return (
    <ModalProvider>
      <AuthProvider>
        <ChatProvider>
          <FcmNotificationCenter />

          {/* 1) 기본 화면: backgroundLocation이 있으면 "뒤에 깔릴 화면"을 그걸로 렌더 */}
          <Routes location={backgroundLocation || location}>
            {/* 팝업 전용: Navbar 없이 렌더링 */}
            <Route
              path="/chat-popup"
              element={
                <ProtectedRoute allowedRoles={["USER", "ADMIN", "INQUIRY"]}>
                  <ChatListPopup />
                </ProtectedRoute>
              }
            />

            <Route
              path="/admin/*"
              element={
                <ProtectedRoute allowedRoles={["ADMIN", "INQUIRY"]}>
                  <AdminDashboard />
                </ProtectedRoute>
              }
            />

            {/* 일반 페이지는 Navbar 래핑 */}
            <Route element={<Navbar />}>
              <Route path="/" element={<Home />} />
              <Route
                path="/auction_detail/:productId"
                element={<AuctionDetail />}
              />
              <Route
                path="/login"
                element={
                  <PublicRoute redirectTo="/">
                    <LoginPage />
                  </PublicRoute>
                }
              />
              <Route
                path="/find_password"
                element={
                  <PublicRoute redirectTo="/">
                    <ForgotPassword />
                  </PublicRoute>
                }
              />
              <Route
                path="/reset_password"
                element={
                  <PublicRoute redirectTo="/">
                    <ResetPassword />
                  </PublicRoute>
                }
              />
              <Route path="/auction_list" element={<AuctionListPage />} />
              <Route
                path="/mypage/profile"
                element={
                  <ProtectedRoute allowedRoles={["USER", "ADMIN", "INQUIRY"]}>
                    <MyProfile />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/mypage/wishlist"
                element={
                  <ProtectedRoute allowedRoles={["USER", "ADMIN", "INQUIRY"]}>
                    <MyWishlist />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/mypage/bidlist"
                element={
                  <ProtectedRoute allowedRoles={["USER", "ADMIN", "INQUIRY"]}>
                    <MyBidlist />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/mypage/auctionlist"
                element={
                  <ProtectedRoute allowedRoles={["USER", "ADMIN", "INQUIRY"]}>
                    <MyAuctionlist />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/sell_product"
                element={
                  <ProtectedRoute allowedRoles={["USER"]}>
                    <SellProductPage />
                  </ProtectedRoute>
                }
              />

              <Route
                path="/register"
                element={
                  <PublicRoute redirectTo="/">
                    <RegisterPage />
                  </PublicRoute>
                }
              />
            </Route>

            <Route
              path="/chat-list"
              element={
                <ProtectedRoute allowedRoles={["USER", "ADMIN", "INQUIRY"]}>
                  <ChatListPopup />
                </ProtectedRoute>
              }
            />
            <Route
              path="/chat"
              element={
                <ProtectedRoute allowedRoles={["USER", "ADMIN", "INQUIRY"]}>
                  <ChatRoomPopup />
                </ProtectedRoute>
              }
            />
          </Routes>
          {!shouldHideFooter && <Footer />}

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
