import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  User,
  Mail,
  Phone,
  MapPin,
  Calendar,
  Edit2,
  Save,
  X,
  Package,
  Gavel,
  Heart,
  Settings,
  LogOut,
  BrainIcon,
  Cake,
  PersonStanding,
  User2,
} from "lucide-react";
import { useAuth } from "../../hooks/useAuth";
import { type UserDto, type UserProfile } from "./MyPageDto";
import { fetchLoginUser } from "./MyPageApi";

const MyPage = () => {
  const navigate = useNavigate();
  const { userEmail, logout } = useAuth();

  const [isEditing, setIsEditing] = useState(false);
  const [activeTab, setActiveTab] = useState<"profile" | "auctions" | "bids">(
    "profile"
  );

  const [profile, setProfile] = useState<UserProfile>({
    name: "홍길동",
    email: userEmail || "",
    phone: "010-1234-5678",
    address: "서울특별시 강남구",
    joinDate: "2024.01.15",
  });

  const [user, setUser] = useState<UserDto>();
  const [tempUser, setTempUser] = useState<UserDto>();
  // const [editedProfile, setEditedProfile] = useState(profile);

  const handleSave = () => {
    setUser(tempUser);
    setIsEditing(false);
    // TODO: API 호출하여 프로필 업데이트
  };

  const handleCancel = () => {
    setTempUser(user);
    setIsEditing(false);
  };

  const handleLogout = () => {
    logout();
    navigate("/");
  };

  const loadLoginUser = async () => {
    try {
      const token = localStorage.getItem("accessToken");
      const data = await fetchLoginUser(token);
      const userProfile = {
        userId: data.result.userId,
        name: data.result.name,
        nickname: data.result.nickname,
        email: data.result.email,
        phone: data.result.phone,
        address: data.result.address,
        birthday: data.result.birthday,
        gender: data.result.gender,
        profileImageUrl: data.result.profileImageUrl,
        warning: data.result.warning,
        createdAt: data.result.createdAt.split("T")[0].replace(/-/g, "."),
      };

      setUser(userProfile);
      console.log(data);
    } catch (error) {
      console.error(error);
    } finally {
      // setLoading(false);
    }
  };

  useEffect(() => {
    loadLoginUser();
  }, []);

  useEffect(() => {
    if (user) {
      setTempUser(user);
    }
  }, [user]);

  if (!user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-black pt-24 pb-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* 헤더 */}
        <div className="bg-black/40 backdrop-blur-lg rounded-2xl border border-white/10 p-8 mb-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-6">
              <div className="w-24 h-24 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full flex items-center justify-center">
                <User className="w-12 h-12 text-white" />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-white mb-2">
                  {user.nickname}
                </h1>
                <p className="text-gray-400">{user.email}</p>
              </div>
            </div>
            <button
              onClick={handleLogout}
              className="flex items-center space-x-2 text-gray-300 hover:text-red-400 transition-colors"
            >
              <LogOut className="w-5 h-5" />
              <span>로그아웃</span>
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* 사이드바 */}
          <div className="lg:col-span-1">
            <div className="bg-black/40 backdrop-blur-lg rounded-2xl border border-white/10 p-6">
              <nav className="space-y-2">
                <button
                  onClick={() => setActiveTab("profile")}
                  className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg transition-all ${
                    activeTab === "profile"
                      ? "bg-purple-600 text-white"
                      : "text-gray-300 hover:bg-white/5"
                  }`}
                >
                  <Settings className="w-5 h-5" />
                  <span>프로필 설정</span>
                </button>
                <button
                  onClick={() => setActiveTab("auctions")}
                  className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg transition-all ${
                    activeTab === "auctions"
                      ? "bg-purple-600 text-white"
                      : "text-gray-300 hover:bg-white/5"
                  }`}
                >
                  <Package className="w-5 h-5" />
                  <span>내 경매</span>
                </button>
                <button
                  onClick={() => setActiveTab("bids")}
                  className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg transition-all ${
                    activeTab === "bids"
                      ? "bg-purple-600 text-white"
                      : "text-gray-300 hover:bg-white/5"
                  }`}
                >
                  <Gavel className="w-5 h-5" />
                  <span>입찰 내역</span>
                </button>
                <button className="w-full flex items-center space-x-3 px-4 py-3 rounded-lg text-gray-300 hover:bg-white/5 transition-all">
                  <Heart className="w-5 h-5" />
                  <span>찜한 경매</span>
                </button>
              </nav>
            </div>
          </div>

          {/* 메인 컨텐츠 */}
          <div className="lg:col-span-3">
            {activeTab === "profile" && (
              <div className="bg-black/40 backdrop-blur-lg rounded-2xl border border-white/10 p-8">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-2xl font-bold text-white">프로필 정보</h2>
                  {!isEditing ? (
                    <button
                      onClick={() => setIsEditing(true)}
                      className="flex items-center space-x-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
                    >
                      <Edit2 className="w-4 h-4" />
                      <span>수정</span>
                    </button>
                  ) : (
                    <div className="flex space-x-2">
                      <button
                        onClick={handleSave}
                        className="flex items-center space-x-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                      >
                        <Save className="w-4 h-4" />
                        <span>저장</span>
                      </button>
                      <button
                        onClick={handleCancel}
                        className="flex items-center space-x-2 px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
                      >
                        <X className="w-4 h-4" />
                        <span>취소</span>
                      </button>
                    </div>
                  )}
                </div>

                <div className="space-y-6">
                  {/* 이름 */}
                  <div>
                    <label className="flex items-center space-x-2 text-gray-400 mb-2">
                      <User className="w-4 h-4" />
                      <span>이름</span>
                    </label>
                    {isEditing ? (
                      <input
                        type="text"
                        value={tempUser?.name || ""}
                        onChange={(e) =>
                          tempUser &&
                          setTempUser({
                            ...tempUser,
                            name: e.target.value,
                          })
                        }
                        className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white focus:outline-none focus:border-purple-500 transition-colors"
                      />
                    ) : (
                      <p className="text-white text-lg">{user.name}</p>
                    )}
                  </div>
                  {/* 닉네임 */}
                  <div>
                    <label className="flex items-center space-x-2 text-gray-400 mb-2">
                      <User2 className="w-4 h-4" />
                      <span>닉네임</span>
                    </label>
                    {isEditing ? (
                      <input
                        type="text"
                        value={tempUser?.nickname || ""}
                        onChange={(e) =>
                          tempUser &&
                          setTempUser({
                            ...tempUser,
                            nickname: e.target.value,
                          })
                        }
                        className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white focus:outline-none focus:border-purple-500 transition-colors"
                      />
                    ) : (
                      <p className="text-white text-lg">{user.nickname}</p>
                    )}
                  </div>
                  {/* 이메일 */}
                  <div>
                    <label className="flex items-center space-x-2 text-gray-400 mb-2">
                      <Mail className="w-4 h-4" />
                      <span>이메일</span>
                    </label>
                    <p className="text-white text-lg">{user.email}</p>
                    <p className="text-gray-500 text-sm mt-1">
                      이메일은 변경할 수 없습니다
                    </p>
                  </div>
                  {/* 전화번호 */}
                  <div>
                    <label className="flex items-center space-x-2 text-gray-400 mb-2">
                      <User2 className="w-4 h-4" />
                      <span>전화번호</span>
                    </label>
                    {isEditing ? (
                      <input
                        type="text"
                        value={tempUser?.phone || ""}
                        onChange={(e) =>
                          tempUser &&
                          setTempUser({
                            ...tempUser,
                            phone: e.target.value,
                          })
                        }
                        className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white focus:outline-none focus:border-purple-500 transition-colors"
                      />
                    ) : (
                      <p className="text-white text-lg">{user.phone}</p>
                    )}
                  </div>
                  {/* 주소 */}
                  <div>
                    <label className="flex items-center space-x-2 text-gray-400 mb-2">
                      <MapPin className="w-4 h-4" />
                      <span>주소</span>
                    </label>
                    {isEditing ? (
                      <input
                        type="text"
                        value={tempUser?.address || ""}
                        onChange={(e) =>
                          tempUser &&
                          setTempUser({
                            ...tempUser,
                            address: e.target.value,
                          })
                        }
                        className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white focus:outline-none focus:border-purple-500 transition-colors"
                      />
                    ) : (
                      <p className="text-white text-lg">{user.address}</p>
                    )}
                  </div>
                  {/* 생년월일 */}
                  <div>
                    <label className="flex items-center space-x-2 text-gray-400 mb-2">
                      <Cake className="w-4 h-4" />
                      <span>생년월일</span>
                    </label>
                    {isEditing ? (
                      <input
                        type="date"
                        value={tempUser?.birthday?.replace(/\./g, "-") || ""}
                        onChange={(e) =>
                          tempUser &&
                          setTempUser({
                            ...tempUser,
                            birthday: e.target.value.replace(/-/g, "."),
                          })
                        }
                        className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white focus:outline-none focus:border-purple-500 transition-colors [color-scheme:dark]"
                      />
                    ) : (
                      <p className="text-white text-lg">{user.birthday}</p>
                    )}
                  </div>
                  {/* 성별 */}
                  <div>
                    <label className="flex items-center space-x-2 text-gray-400 mb-2">
                      <PersonStanding className="w-4 h-4" />
                      <span>성별</span>
                    </label>
                    {isEditing ? (
                      <div className="flex space-x-4">
                        <label className="flex-1 cursor-pointer">
                          <input
                            type="radio"
                            value="M"
                            checked={tempUser?.gender === "M"}
                            onChange={(e) =>
                              tempUser &&
                              setTempUser({
                                ...tempUser,
                                gender: e.target.value,
                              })
                            }
                            className="peer sr-only"
                          />
                          <div className="px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white text-center transition-all peer-checked:bg-purple-600 peer-checked:border-purple-500 hover:border-purple-500/50">
                            남성
                          </div>
                        </label>
                        <label className="flex-1 cursor-pointer">
                          <input
                            type="radio"
                            value="F"
                            checked={tempUser?.gender === "F"}
                            onChange={(e) =>
                              tempUser &&
                              setTempUser({
                                ...tempUser,
                                gender: e.target.value,
                              })
                            }
                            className="peer sr-only"
                          />
                          <div className="px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white text-center transition-all peer-checked:bg-purple-600 peer-checked:border-purple-500 hover:border-purple-500/50">
                            여성
                          </div>
                        </label>
                      </div>
                    ) : (
                      <p className="text-white text-lg">
                        {user.gender === "M" ? "남성" : "여성"}
                      </p>
                    )}
                  </div>
                  {/* 가입일 */}
                  <div>
                    <label className="flex items-center space-x-2 text-gray-400 mb-2">
                      <Calendar className="w-4 h-4" />
                      <span>가입일</span>
                    </label>
                    <p className="text-white text-lg">{user.createdAt}</p>
                  </div>
                </div>
              </div>
            )}

            {activeTab === "auctions" && (
              <div className="bg-black/40 backdrop-blur-lg rounded-2xl border border-white/10 p-8">
                <h2 className="text-2xl font-bold text-white mb-6">
                  내가 등록한 경매
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* 경매 카드 예시 */}
                  {[1, 2, 3].map((item) => (
                    <div
                      key={item}
                      className="bg-white/5 rounded-xl p-4 border border-white/10 hover:border-purple-500 transition-colors cursor-pointer"
                    >
                      <div className="aspect-video bg-gradient-to-br from-purple-500/20 to-pink-500/20 rounded-lg mb-3"></div>
                      <h3 className="text-white font-semibold mb-2">
                        경매 상품 {item}
                      </h3>
                      <div className="flex justify-between items-center text-sm">
                        <span className="text-gray-400">현재가</span>
                        <span className="text-purple-400 font-bold">
                          {(item * 10000).toLocaleString()}원
                        </span>
                      </div>
                      <div className="flex justify-between items-center text-sm mt-1">
                        <span className="text-gray-400">입찰</span>
                        <span className="text-white">{item * 3}건</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {activeTab === "bids" && (
              <div className="bg-black/40 backdrop-blur-lg rounded-2xl border border-white/10 p-8">
                <h2 className="text-2xl font-bold text-white mb-6">
                  입찰 내역
                </h2>
                <div className="space-y-4">
                  {[1, 2, 3, 4].map((item) => (
                    <div
                      key={item}
                      className="bg-white/5 rounded-xl p-4 border border-white/10 hover:border-purple-500 transition-colors"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-4">
                          <div className="w-16 h-16 bg-gradient-to-br from-purple-500/20 to-pink-500/20 rounded-lg"></div>
                          <div>
                            <h3 className="text-white font-semibold mb-1">
                              경매 상품 {item}
                            </h3>
                            <p className="text-gray-400 text-sm">
                              입찰가: {(item * 15000).toLocaleString()}원
                            </p>
                          </div>
                        </div>
                        <div className="text-right">
                          <span
                            className={`px-3 py-1 rounded-full text-sm ${
                              item === 1
                                ? "bg-green-500/20 text-green-400"
                                : "bg-yellow-500/20 text-yellow-400"
                            }`}
                          >
                            {item === 1 ? "낙찰" : "진행중"}
                          </span>
                          <p className="text-gray-500 text-sm mt-1">
                            2024.10.{20 - item}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default MyPage;
