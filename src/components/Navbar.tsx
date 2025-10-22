import { Gavel } from "lucide-react";
import { Outlet, useNavigate } from "react-router-dom";
import { AuthButtons } from "./AuthButtons";

const Navbar = () => {
  const navigate = useNavigate();

  return (
    <>
      <nav className="bg-black/20 backdrop-blur-lg border-b border-white/10 fixed top-0 left-0 right-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-2">
              <Gavel className="h-8 w-8 text-purple-400" />
              <span
                className="text-3xl font-bold text-white cursor-pointer hover:text-purple-300 transition-colors duration-300"
                onClick={() => {
                  window.location.replace("/");
                }}
              >
                AuctionHub
              </span>
            </div>

            <div className="hidden md:flex items-center space-x-8">
              <a
                className="text-gray-300 hover:text-white transition-colors cursor-pointer"
                onClick={() => navigate("/auction_list")}
              >
                경매 목록
              </a>
              <a
                href="#"
                className="text-gray-300 hover:text-white transition-colors"
              >
                카테고리
              </a>
              <a
                href="#"
                className="text-gray-300 hover:text-white transition-colors"
              >
                판매하기
              </a>
              <a
                href="#"
                className="text-gray-300 hover:text-white transition-colors"
              >
                고객센터
              </a>
            </div>

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
