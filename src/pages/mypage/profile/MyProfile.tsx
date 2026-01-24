// src/pages/.../MyProfile.tsx
import React, { useCallback, useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  User,
  Camera,
  LogOut,
  Edit2,
  Check,
  X,
  Mail,
  Smartphone,
  MapPin,
  Calendar,
  User2,
  ChevronRight,
  Heart,
  Gavel,
  Trash2,
} from "lucide-react";
import { useAuth } from "../../../hooks/useAuth";
import type { UserDto } from "../MyPageDto";
import {
  fetchLoginUser,
  updateMyProfileBasic,
  updateMyNickname,
  uploadMyProfileImage,
  deleteMyProfileImage,
} from "../MyPageApi";
import { useModal } from "@/contexts/ModalContext";
interface ProfileFieldProps {
  label: string;
  value: any;
  icon: any;
  isEditable?: boolean;
  onChange?: (e: any) => void;
  type?: string;
  options?: { value: string; label: string }[];
  isEditing: boolean;
  helperText?: string;
}

const ProfileField = ({
  label,
  value,
  icon: Icon,
  isEditable = false,
  onChange,
  type = "text",
  options = [],
  isEditing,
  helperText,
}: ProfileFieldProps) => {
  return (
    <div className="flex flex-col">
      <div className="ml-1 min-h-[34px]">
        <div className="text-xs font-semibold text-gray-400 flex items-center gap-1.5">
          <Icon className="w-3.5 h-3.5" />
          {label}
        </div>
        <div className="mt-1 min-h-[14px] text-[11px] text-gray-400">
          {helperText ? helperText : <span className="invisible">자리맞춤</span>}
        </div>
      </div>

      <div className={`relative transition-all duration-300 ${isEditing ? "scale-[1.01]" : ""}`}>
        {isEditing && isEditable ? (
          type === "radio" ? (
            <div className="flex bg-gray-50 p-1.5 rounded-2xl border border-gray-200 h-12 items-center">
              {options.map((opt: any) => (
                <label key={opt.value} className="flex-1 cursor-pointer">
                  <input
                    type="radio"
                    name={label}
                    value={opt.value}
                    checked={value === opt.value}
                    onChange={onChange}
                    className="peer sr-only"
                  />
                  <div className="py-2 text-center text-sm font-medium text-gray-500 rounded-xl transition-all peer-checked:bg-white peer-checked:text-[#765AFF] peer-checked:shadow-sm">
                    {opt.label}
                  </div>
                </label>
              ))}
            </div>
          ) : (
            <input
              type={type}
              value={value ?? ""}
              onChange={onChange}
              className="w-full h-12 px-5 bg-gray-50 border-0 rounded-2xl text-gray-900 font-medium focus:ring-2 focus:ring-[#765AFF]/20 focus:bg-white transition-all outline-none placeholder:text-gray-300"
            />
          )
        ) : (
          <div className="w-full h-12 px-5 bg-white border border-gray-100 rounded-2xl text-gray-900 font-medium shadow-sm group-hover:border-[#765AFF]/30 transition-colors flex items-center justify-between">
            <span>
              {type === "radio"
                ? options.find((o: any) => o.value === value)?.label || value
                : value || <span className="text-gray-300 font-normal">미입력</span>}
            </span>
            {!isEditing && (
              <div className="w-1.5 h-1.5 rounded-full bg-gray-200 group-hover:bg-[#765AFF] transition-colors" />
            )}
          </div>
        )}
      </div>
    </div>
  );
};

const MenuItem = ({
  onClick,
  icon: Icon,
  label,
  colorClass = "bg-purple-50 text-[#765AFF]",
}: any) => (
  <button
    onClick={onClick}
    className="w-full flex items-center justify-between p-3 hover:bg-gray-50 rounded-xl transition-colors text-sm text-gray-600 group"
  >
    <span className="flex items-center gap-3">
      <div
        className={`w-8 h-8 rounded-lg flex items-center justify-center transition-colors group-hover:bg-[#765AFF] group-hover:text-white ${colorClass}`}
      >
        <Icon className="w-4 h-4" />
      </div>
      <span className="font-medium">{label}</span>
    </span>
    <ChevronRight className="w-4 h-4 text-gray-300 group-hover:text-[#765AFF]" />
  </button>
);

const MyProfile = () => {
  const navigate = useNavigate();
  const { logout } = useAuth();
  const { showLogin, showError } = useModal();

  const [isEditing, setIsEditing] = useState(false);
  const [user, setUser] = useState<UserDto | null>(null);
  const [tempUser, setTempUser] = useState<UserDto | null>(null);

  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const loadLoginUser = useCallback(async () => {
    try {
      const t = localStorage.getItem("accessToken");
      if (!t) {
        showLogin();
        return;
      }
      const data = await fetchLoginUser(t);

      const raw = (data as any).result;
      const userProfile: UserDto = {
        ...raw,
        createdAt: raw.createdAt.split("T")[0].replace(/-/g, "."),
      };

      setUser(userProfile);
      setTempUser((prev) => (isEditing ? prev : userProfile));
    } catch (e) {
      console.error(e);
      showError();
    }
  }, [isEditing, showLogin, showError]);

  useEffect(() => {
    loadLoginUser();
  }, [loadLoginUser]);

  const 시작_편집 = useCallback(() => {
    if (!user) return;
    setTempUser({ ...user });
    setIsEditing(true);
  }, [user]);

  const handleCancel = useCallback(() => {
    setTempUser(user ? { ...user } : null);
    setIsEditing(false);
  }, [user]);

  const handleLogout = useCallback(() => {
    logout();
    navigate("/");
  }, [logout, navigate]);

  const handleSave = useCallback(async () => {
    const t = localStorage.getItem("accessToken");
    if (!t) {
      showLogin();
      return;
    }
    if (!user || !tempUser) return;

    const nameChanged = (tempUser.name ?? "") !== (user.name ?? "");
    const addressChanged = (tempUser.address ?? "") !== (user.address ?? "");
    const phoneChanged = (tempUser.phone ?? "") !== (user.phone ?? "");

    const nicknameChanged =
      (tempUser.nickname ?? "").trim() !== (user.nickname ?? "").trim() &&
      (tempUser.nickname ?? "").trim().length > 0;

    try {
      if (nameChanged || addressChanged || phoneChanged) {
        await updateMyProfileBasic(t, {
          name: nameChanged ? tempUser.name : undefined,
          address: addressChanged ? tempUser.address : undefined,
          phone: phoneChanged ? tempUser.phone : undefined,
        });
      }
    } catch (e) {
      console.error(e);
      showError();
      return;
    }

    if (nicknameChanged) {
      try {
        await updateMyNickname(t, (tempUser.nickname ?? "").trim());
      } catch (e) {
        console.error(e);
        await loadLoginUser();
        showError();
        return;
      }
    }

    await loadLoginUser();
    setIsEditing(false);
  }, [loadLoginUser, showLogin, showError, tempUser, user]);

  const 이미지_선택창_열기 = useCallback(() => {
    if (!isEditing) return;
    fileInputRef.current?.click();
  }, [isEditing]);

  const onPickImage = useCallback(
    async (e: React.ChangeEvent<HTMLInputElement>) => {
      try {
        const file = e.target.files?.[0];
        if (!file) return;

        const t = localStorage.getItem("accessToken");
        if (!t) {
          showLogin();
          return;
        }

        await uploadMyProfileImage(t, file);
        await loadLoginUser();
      } catch (err) {
        console.error(err);
        showError();
      } finally {
        if (fileInputRef.current) fileInputRef.current.value = "";
      }
    },
    [loadLoginUser, showLogin, showError]
  );

  const onDeleteImage = useCallback(async () => {
    try {
      const t = localStorage.getItem("accessToken");
      if (!t) {
        showLogin();
        return;
      }
      await deleteMyProfileImage(t);
      await loadLoginUser();
    } catch (e) {
      console.error(e);
      showError();
    }
  }, [loadLoginUser, showLogin, showError]);

  const viewUser = isEditing ? tempUser : user;

  return (
    <div className="min-h-screen bg-[#F8F9FC] py-24 font-sans">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* 상단 */}
        <div className="flex justify-between items-end mb-8 px-2">
          <div>
            <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight">내 프로필</h1>
            <p className="text-gray-500 mt-2 text-sm font-medium">계정 설정 및 활동 내역</p>
          </div>

          <button
            onClick={handleLogout}
            className="flex items-center space-x-2 text-gray-400 hover:text-red-500 transition-colors text-sm font-medium px-4 py-2 rounded-full hover:bg-red-50"
          >
            <LogOut className="w-4 h-4" />
            <span>로그아웃</span>
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* 왼쪽 */}
          <div className="lg:col-span-4 space-y-6">
            {/* 프로필 카드 */}
            <div className="bg-white rounded-[2rem] p-8 shadow-[0_20px_40px_-15px_rgba(0,0,0,0.05)] border border-gray-100/50 flex flex-col items-center text-center relative overflow-hidden">
              <div className="absolute top-0 w-full h-32 bg-gradient-to-b from-gray-50 to-white z-0" />

              <div className="relative z-10 mt-4">
                <div className="w-32 h-32 rounded-full bg-white p-1.5 shadow-xl shadow-gray-200/50 relative">
                  <div className="w-full h-full rounded-full bg-gray-100 flex items-center justify-center overflow-hidden border border-gray-100">
                    {user?.profileImageUrl ? (
                      <img src={user.profileImageUrl} alt="프로필" className="w-full h-full object-cover" />
                    ) : (
                      <User className="w-12 h-12 text-gray-300" />
                    )}
                  </div>

                  {isEditing && (
                    <>
                      <button
                        type="button"
                        onClick={이미지_선택창_열기}
                        className="absolute bottom-1 right-1 bg-[#765AFF] text-white p-2.5 rounded-full shadow-lg hover:bg-[#6348e6] transition-transform hover:scale-105 active:scale-95"
                        title="이미지 변경"
                      >
                        <Camera className="w-4 h-4" />
                      </button>

                      {user?.profileImageUrl && (
                        <button
                          type="button"
                          onClick={onDeleteImage}
                          className="absolute bottom-1 left-1 bg-white text-gray-600 p-2.5 rounded-full shadow-lg hover:bg-gray-50 transition-transform hover:scale-105 active:scale-95 border border-gray-100"
                          title="이미지 삭제"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}

                      <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={onPickImage} />
                    </>
                  )}
                </div>
              </div>

              <div className="relative z-10 mt-6 mb-2">
                <h2 className="text-2xl font-bold text-gray-900">{user?.nickname || "닉네임 없음"}</h2>
                <p className="text-gray-400 text-sm mt-1">{user?.email || ""}</p>
              </div>

              <div className="relative z-10 mt-6 w-full pt-6 border-t border-gray-100">
                <div className="flex justify-between items-center px-4">
                  <div className="text-center">
                    <p className="text-xs text-gray-400 font-semibold">가입일</p>
                    <p className="text-gray-800 font-bold mt-1 text-sm">{user?.createdAt || ""}</p>
                  </div>
                  <div className="h-8 w-[1px] bg-gray-200"></div>
                  <div className="text-center">
                    <p className="text-xs text-gray-400 font-semibold">상태</p>
                    <p className="text-[#765AFF] font-bold mt-1 text-sm flex items-center gap-1 justify-center">
                      <span className="w-2 h-2 rounded-full bg-[#765AFF]"></span>
                      활동중
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100">
              <div className="flex items-center justify-between text-gray-800 font-bold mb-13 px-1">
                <span>내 활동 내역</span>
              </div>

              <div className="space-y-1">
                <MenuItem icon={Calendar} label="내 경매 내역" onClick={() => navigate("/my_auction_list")} colorClass="bg-blue-50 text-blue-500" />
                <MenuItem icon={Heart} label="내 찜 목록" onClick={() => navigate("/my_wish_list")} colorClass="bg-red-50 text-red-500" />
                <MenuItem icon={Gavel} label="내 입찰 목록" onClick={() => navigate("/my_bid_list")} colorClass="bg-purple-50 text-purple-500" />
              </div>
            </div>
          </div>

          {/* 오른쪽 */}
          <div className="lg:col-span-8">
            <div className="bg-white rounded-[2rem] p-8 lg:p-10 shadow-[0_20px_40px_-15px_rgba(0,0,0,0.05)] border border-gray-100/50 h-full relative">
              {/* 헤더 */}
              <div className="flex items-center justify-between mb-10">
                <h3 className="text-xl font-bold text-gray-900">기본 정보</h3>

                {!isEditing ? (
                  <button
                    onClick={시작_편집}
                    className="w-10 h-10 flex items-center justify-center rounded-xl bg-white border border-gray-200 text-gray-600 hover:bg-[#765AFF]/5 hover:border-[#765AFF]/40 hover:text-[#765AFF] transition-all shadow-sm"
                    title="수정"
                  >
                    <Edit2 className="w-5 h-5" />
                  </button>
                ) : (
                  <div className="flex items-center gap-3">
                    <button
                      onClick={handleCancel}
                      className="w-10 h-10 flex items-center justify-center rounded-xl border border-gray-200 text-gray-500 hover:bg-gray-50 transition-colors"
                      title="취소"
                    >
                      <X className="w-5 h-5" />
                    </button>
                    <button
                      onClick={handleSave}
                      className="w-10 h-10 flex items-center justify-center rounded-xl bg-[#765AFF] text-white hover:bg-[#6348e6] transition-all shadow-lg shadow-[#765AFF]/30"
                      title="저장"
                    >
                      <Check className="w-5 h-5" />
                    </button>
                  </div>
                )}
              </div>

              {/* 폼 */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-8">
                <ProfileField
                  label="이름"
                  value={viewUser?.name}
                  icon={User2}
                  isEditable={true}
                  isEditing={isEditing}
                  onChange={(e: any) =>
                    setTempUser((prev) => ({ ...(prev ?? (user as UserDto)), name: e.target.value }))
                  }
                />

                <ProfileField
                  label="닉네임"
                  value={viewUser?.nickname}
                  icon={User}
                  isEditable={true}
                  isEditing={isEditing}
                  onChange={(e: any) =>
                    setTempUser((prev) => ({ ...(prev ?? (user as UserDto)), nickname: e.target.value }))
                  }
                />

                <div className="md:col-span-2">
                  <ProfileField
                    label="이메일 주소"
                    value={user?.email}
                    icon={Mail}
                    isEditable={false}
                    isEditing={isEditing}
                  />
                </div>

                <ProfileField
                  label="전화번호"
                  value={viewUser?.phone}
                  icon={Smartphone}
                  isEditable={true}
                  isEditing={isEditing}
                  onChange={(e: any) => {
                    const onlyDigits = String(e.target.value ?? "").replace(/[^0-9]/g, "");
                    setTempUser((prev) => ({ ...(prev ?? (user as UserDto)), phone: onlyDigits }));
                  }}
                />
                <ProfileField
                  label="생년월일"
                  value={user?.birthday}
                  icon={Calendar}
                  isEditable={false}
                  isEditing={isEditing}
                />

                <div className="md:col-span-2">
                  <ProfileField
                    label="주소"
                    value={viewUser?.address}
                    icon={MapPin}
                    isEditable={true}
                    isEditing={isEditing}
                    onChange={(e: any) =>
                      setTempUser((prev) => ({ ...(prev ?? (user as UserDto)), address: e.target.value }))
                    }
                  />
                </div>
                
                <div className="md:col-span-2">
                  <ProfileField
                    label="성별"
                    value={user?.gender}
                    icon={User}
                    isEditable={false}
                    isEditing={isEditing}
                    type="radio"
                    options={[
                      { value: "M", label: "남성" },
                      { value: "F", label: "여성" },
                    ]}
                  />
                </div>
              </div>

              {isEditing && (
                <div className="mt-10 p-4 rounded-2xl bg-gray-50 border border-gray-100 text-sm text-gray-500">
                  <p className="font-semibold text-gray-700 mb-1">안내</p>
                  <ul className="list-disc ml-5 space-y-1">
                    <li>이름/주소/전화번호: 저장 시 서버에 반영됩니다</li>
                    <li>닉네임: 규칙/중복/7일 제한이 적용됩니다</li>
                  </ul>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MyProfile;
