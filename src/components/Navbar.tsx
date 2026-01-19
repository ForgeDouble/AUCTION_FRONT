import { Outlet, useNavigate } from "react-router-dom";
import AuthButtons from "./AuthButtons";
import logoBid from "@/assets/bid-logo.png";
import { useModal } from "@/contexts/ModalContext";
import { useAuth } from "@/hooks/useAuth";

const Navbar = () => {
  const navigate = useNavigate();
  const { showLogin } = useModal();
  const { isAuthenticated } = useAuth();

  const navigateSellProduct = () => {
    if (!isAuthenticated) {
      showLogin();
      console.error("Missing AccessToken");
      return;
    }

    navigate("/sell_product");
  };

  return (
    <>
      <nav className="bg-black/20 backdrop-blur-lg border-b border-white/10 fixed top-0 left-0 right-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-2 cursor-pointer">
              <img
                src={logoBid}
                alt="BID"
                style={{
                  height: "65px",
                  display: "block",
                  float: "left",
                  filter: "brightness(2.0)",
                }}
                onClick={() => {
                  window.location.replace("/");
                }}
              />
            </div>

            {/* 중앙 메뉴 */}
            <div className="hidden md:flex items-center space-x-8">
              <button
                type="button"
                className="text-gray-100 hover:text-white transition-colors cursor-pointer"
                onClick={() => navigate("/auction_list")}
              >
                경매 목록
              </button>

              <button
                type="button"
                className="text-gray-100 hover:text-white transition-colors cursor-pointer"
                onClick={() => navigateSellProduct()}
              >
                판매하기
              </button>

              <button
                type="button"
                className="text-gray-100 hover:text-white transition-colors cursor-pointer"
              >
                고객센터
              </button>
            </div>

            {/* 우측: 인증/채팅/알림/프로필 */}
            <div className="flex items-center space-x-4">
              <AuthButtons />
            </div>
          </div>
        </div>
      </nav>
      <Outlet />
    </>
  );
};
export default Navbar;
