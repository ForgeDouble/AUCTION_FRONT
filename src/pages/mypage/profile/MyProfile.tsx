import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

import {
  User,
  Mail,
  MapPin,
  Calendar,
  Edit2,
  Save,
  X,
  LogOut,
  Cake,
  PersonStanding,
  User2,
} from "lucide-react";
import { useAuth } from "../../../hooks/useAuth";
import { type UserDto } from "../MyPageDto";
import { fetchLoginUser } from "../MyPageApi";
import { useModal } from "@/contexts/ModalContext";

const MyProfile = () => {
  const navigate = useNavigate();
  const { logout } = useAuth();
  const { showLogin, showError } = useModal();

  const [isEditing, setIsEditing] = useState(false);

  const [user, setUser] = useState<UserDto>();
  const [tempUser, setTempUser] = useState<UserDto>();

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
      if (token == null) {
        showLogin();
        console.error("Missing AccessToken");
        return;
      }
      const data = await fetchLoginUser(token);
      const userProfile = {
        ...data.result,
        createdAt: data.result.createdAt.split("T")[0].replace(/-/g, "."),
      };

      setUser(userProfile);
      console.log(data);
    } catch (error) {
      console.error(error);
      showError();
    }
  };

  useEffect(() => {
    if (user) {
      setTempUser(user);
    }
  }, [user]);

  useEffect(() => {
    loadLoginUser();
  }, []);

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
                  {user?.nickname || null}
                </h1>
                <p className="text-gray-400">{user?.email || null}</p>
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
          {/* 메인 컨텐츠 */}
          <div className="lg:col-span-4">
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
                    <p className="text-white text-lg">{user?.name || null}</p>
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
                    <p className="text-white text-lg">
                      {user?.nickname || null}
                    </p>
                  )}
                </div>
                {/* 이메일 */}
                <div>
                  <label className="flex items-center space-x-2 text-gray-400 mb-2">
                    <Mail className="w-4 h-4" />
                    <span>이메일</span>
                  </label>
                  <p className="text-white text-lg">{user?.email || null}</p>
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
                    <p className="text-white text-lg">{user?.phone || null}</p>
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
                    <p className="text-white text-lg">
                      {user?.address || null}
                    </p>
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
                    <p className="text-white text-lg">
                      {user?.birthday || null}
                    </p>
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
                      {user?.gender === "M"
                        ? "남성"
                        : user?.gender === "F"
                        ? "여성"
                        : ""}
                    </p>
                  )}
                </div>
                {/* 가입일 */}
                <div>
                  <label className="flex items-center space-x-2 text-gray-400 mb-2">
                    <Calendar className="w-4 h-4" />
                    <span>가입일</span>
                  </label>
                  <p className="text-white text-lg">
                    {user?.createdAt || null}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MyProfile;
