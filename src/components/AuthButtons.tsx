import { useNavigate } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";

export const AuthButtons = () => {
  const navigate = useNavigate();
  const { userEmail, isAuthenticated, logout } = useAuth();

  const handleLogout = () => {
    logout();
    navigate("/");
  };

  if (isAuthenticated) {
    return (
      <>
        <span className="text-gray-300">
          <span className="text-purple-400 font-semibold">{userEmail}</span>님
        </span>
        <button
          className="bg-gradient-to-r from-purple-600 to-pink-600 text-white px-6 py-2 rounded-full hover:from-purple-700 hover:to-pink-700 transition-all duration-300 transform hover:scale-105"
          onClick={handleLogout}
        >
          로그아웃
        </button>
        <button
          className="bg-gradient-to-r from-purple-600 to-pink-600 text-white px-6 py-2 rounded-full hover:from-purple-700 hover:to-pink-700 transition-all duration-300 transform hover:scale-105"
          onClick={() => navigate("/mypage")}
        >
          마이페이지
        </button>
      </>
    );
  }

  return (
    <>
      <button
        className="text-gray-300 hover:text-white cursor-pointer transition-colors"
        onClick={() => navigate("/login")}
      >
        로그인
      </button>
      <button
        className="bg-gradient-to-r from-purple-600 to-pink-600 text-white px-6 py-2 rounded-full hover:from-purple-700 hover:to-pink-700 transition-all duration-300 transform hover:scale-105"
        onClick={() => navigate("/signup")}
      >
        회원가입
      </button>
    </>
  );
};
