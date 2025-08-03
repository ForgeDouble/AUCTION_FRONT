import { Gavel } from "lucide-react";
import { Outlet } from "react-router-dom";

const Navbar = () => {
  return (
    <>
      <nav className="bg-black/20 backdrop-blur-lg border-b border-white/10 fixed top-0 left-0 right-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-2">
              <Gavel className="h-8 w-8 text-purple-400" />
              <span className="text-2xl font-bold text-white">AuctionHub</span>
            </div>

            <div className="hidden md:flex items-center space-x-8">
              <a
                href="#"
                className="text-gray-300 hover:text-white transition-colors"
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
              <button className="text-gray-300 hover:text-white">로그인</button>
              <button className="bg-gradient-to-r from-purple-600 to-pink-600 text-white px-6 py-2 rounded-full hover:from-purple-700 hover:to-pink-700 transition-all duration-300 transform hover:scale-105">
                회원가입
              </button>
            </div>
          </div>
        </div>
      </nav>
      <Outlet />
    </>
  );
};
export default Navbar;
