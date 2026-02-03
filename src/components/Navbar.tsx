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
      <nav className="fixed top-0 left-0 right-0 z-50 bg-white/85 backdrop-blur-xl border-b border-slate-200/70 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-2 cursor-pointer">
              <img
                src={logoBid}
                alt="BID"
                className="h-[42px] select-none"
                onClick={() => window.location.replace("/")}
              />
            </div>

            <div className="hidden md:flex items-center space-x-8">
              <button
                type="button"
                className="text-slate-600 hover:text-slate-900 transition-colors font-medium"
                onClick={() => navigate("/auction_list")}
              >
                경매 목록
              </button>

              <button
                type="button"
                className="text-slate-600 hover:text-slate-900 transition-colors font-medium"
                onClick={() => navigateSellProduct()}
              >
                판매하기
              </button>

              <button
                type="button"
                className="text-slate-600 hover:text-slate-900 transition-colors font-medium"
              >
                고객센터
              </button>
            </div>

            <div className="flex items-center">
              <AuthButtons />
            </div>
          </div>
        </div>
      </nav>
      <div className="h-16" />
      <Outlet />
    </>
  );
};
export default Navbar;
