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
  Heart,
  Gavel,
  Trash2,
  AlertCircle,
} from "lucide-react";

import { useAuth } from "../../../hooks/useAuth";
import { useModal } from "@/contexts/ModalContext";
import {
  deleteMyProfileImage,
  fetchLoginUser,
  updateMyNickname,
  updateMyProfileBasic,
  uploadMyProfileImage,
} from "./MyProfileApi";
import type { Errors, FormState, UserDto } from "./MyProfileDto";
import ProfileField from "./components/ProFileField";
import MenuItem from "./components/MenuItem";
import { handleApiError } from "@/errors/HandleApiError";
import type { ErrorState } from "@/errors/ErrorDto";
import ErrorPage from "@/errors/ErrorPage";
import { isValidPhone } from "@/lib/validators";

const MyProfile = () => {
  const initial: FormState = {
    nickname: "",
    phone: "",
    address: "",
  };
  const navigate = useNavigate();
  const { logout } = useAuth();
  const { showLogin, showError, showWarning } = useModal();

  const [isEditingNickname, setIsEditingNickname] = useState<boolean>(false);
  const [isEditing, setIsEditing] = useState<boolean>(false);
  const [user, setUser] = useState<UserDto | null>(null);

  const [errorState, setErrorState] = useState<ErrorState | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [photoMenuOpen, setPhotoMenuOpen] = useState<boolean>(false);
  const [f, setF] = useState<FormState>(initial);
  const [err, setErr] = useState<Errors>({});

  const nicknameWarnedRef = useRef(false);

  function set<K extends keyof FormState>(k: K, v: FormState[K]) {
    setF((p) => ({ ...p, [k]: v }));
    if (err[k]) setErr((p) => ({ ...p, [k]: "" }));
  }

  function validateField<K extends keyof FormState>(k: K, v: FormState[K]) {
    let msg = "";
    switch (k) {
      case "nickname":
        if (String(v).trim().length > 0 && !/^[\w가-힣]{2,8}$/.test(String(v)))
          msg = "닉네임은 2~8자 (한글/영문/숫자)만 가능합니다.";
        break;
      case "phone":
        if (!v) msg = "전화번호를 입력하세요.";
        else if (!isValidPhone(String(v)))
          msg = "올바른 전화번호 형식이 아닙니다.";
        break;
      case "address":
        if (String(v).trim().length > 0 && String(v).length < 2)
          msg = "주소가 너무 짧습니다.";
        break;
    }
    setErr((p) => ({ ...p, [k]: msg }));
    return !msg;
  }

  const loadLoginUser = useCallback(async () => {
    try {
      const token = localStorage.getItem("accessToken");
      if (!token) {
        showLogin("confirm");
        logout();
        return;
      }

      const data = await fetchLoginUser(token);
      const raw = (data as { result: UserDto }).result;

      const userProfile: UserDto = {
        ...raw,
        createdAt: raw.createdAt?.split("T")[0].replace(/-/g, ".") ?? "",
      };

      const tempProfile: FormState = {
        nickname: raw.nickname,
        phone: raw.phone,
        address: raw.address,
      };

      setUser(userProfile);

      setF((prev) => (isEditing ? prev : tempProfile));
    } catch (error: unknown) {
      const result = handleApiError(error);
      console.error(result);

      switch (result.type) {
        case "AUTH":
          showLogin("confirm");
          logout();
          break;
        default:
          setErrorState({
            show: true,
            type: "500",
            title: "서버 내부에서 오류가 발생했습니다",
            message: "관리자에게 문의해주세요.",
          });
      }
    }
  }, [isEditing, showLogin, logout]);

  useEffect(() => {
    loadLoginUser();
  }, [loadLoginUser]);

  const startEdit = useCallback(() => {
    if (!user) return;

    setF({
      nickname: user.nickname,
      phone: user.phone,
      address: user.address,
    });
    setIsEditing(true);
    setErrorMessage("");
  }, [user]);

  const startEditNickname = useCallback(() => {
    if (!user) return;
    setF((prev) => ({ ...prev, nickname: user.nickname }));
    setIsEditingNickname(true);
    setErrorMessage("");

    if (!nicknameWarnedRef.current) {
      nicknameWarnedRef.current = true;
      showWarning("닉네임은 규칙/중복/7일 제한이 적용됩니다");
    }
  }, [user, showWarning]);

  const handleCancel = useCallback(() => {
    setF(
      user
        ? { nickname: user.nickname, phone: user.phone, address: user.address }
        : { nickname: "", phone: "", address: "" },
    );
    setErr({ nickname: "", phone: "", address: "" });
    setIsEditing(false);
    setIsEditingNickname(false); // ← 추가
    setErrorMessage("");
    nicknameWarnedRef.current = false;
    setPhotoMenuOpen(false);
  }, [user]);

  const handleCancelNickname = useCallback(() => {
    setF((prev) => ({ ...prev, nickname: user?.nickname ?? "" }));
    setErr((prev) => ({ ...prev, nickname: "" }));
    setIsEditingNickname(false);
    nicknameWarnedRef.current = false;
  }, [user]);

  const handleLogout = useCallback(() => {
    logout();
    navigate("/");
  }, [logout, navigate]);

  const handleSave = useCallback(async () => {
    const token = localStorage.getItem("accessToken");
    if (!token) {
      showLogin("confirm");
      logout();
      return;
    }
    if (!user || !f) return;

    let ok = true;
    (Object.keys(f) as (keyof FormState)[]).forEach((k) => {
      ok = validateField(k, f[k]) && ok;
    });
    if (!ok) return;

    try {
      await updateMyProfileBasic(token, {
        address: f.address,
        phone: f.phone,
      });
    } catch (error: unknown) {
      const result = handleApiError(error);
      console.error(result);

      switch (result.type) {
        case "DIALOG":
          switch (result.to) {
            case "phone":
              setErr((p) => ({ ...p, phone: result.message }));
              break;
            case "address":
              setErr((p) => ({ ...p, address: result.message }));
              break;

            default:
              showError(result.message ?? "입력값을 확인해주세요.");
          }
          break;
      }
    }
    await loadLoginUser();
    setIsEditing(false);
    setErrorMessage("");
  }, [loadLoginUser, showLogin, logout, showError, user, f]);

  const handleSaveNickname = useCallback(async () => {
    const token = localStorage.getItem("accessToken");
    if (!token) {
      showLogin("confirm");
      logout();
      return;
    }
    if (!user) return;

    const ok = validateField("nickname", f.nickname);
    if (!ok) return;

    try {
      await updateMyNickname(token, f.nickname);
      await loadLoginUser();
      setIsEditingNickname(false);
    } catch (error: unknown) {
      const result = handleApiError(error);
      if (result.type === "DIALOG" && result.to === "nickname") {
        setErr((p) => ({ ...p, nickname: result.message }));
      } else if (result.type === "ERROR") {
        showError(result.message);
      } else if (result.type === "WARNING") {
        showWarning(result.message);
      } else {
        showError("입력값을 확인해주세요.");
      }
    }
  }, [
    f.nickname,
    user,
    loadLoginUser,
    showLogin,
    logout,
    showError,
    showWarning,
  ]);

  const openSelector = useCallback(() => {
    setPhotoMenuOpen(false);
    fileInputRef.current?.click();
  }, []);

  const onPickImage = useCallback(
    async (e: React.ChangeEvent<HTMLInputElement>) => {
      try {
        const file = e.target.files?.[0];
        if (!file) return;

        const token = localStorage.getItem("accessToken");
        if (!token) {
          showLogin("confirm");
          logout();
          return;
        }

        await uploadMyProfileImage(token, file);
        await loadLoginUser();
      } catch (error: unknown) {
        const result = handleApiError(error);
        console.error(result);

        switch (result.type) {
          case "AUTH":
            showLogin("confirm");
            logout();
            break;
          case "WARNING":
            showWarning(result.message);
            break;
          case "DIALOG":
            setErrorMessage(result.message);
            break;
          default:
            showError(
              "서버 내부에서 오류가 발생했습니다. 관리자에게 문의해주세요.",
            );
        }
      } finally {
        if (fileInputRef.current) fileInputRef.current.value = "";
      }
    },
    [loadLoginUser, showLogin, logout, showWarning, showError],
  );

  const onDeleteImage = useCallback(async () => {
    try {
      const token = localStorage.getItem("accessToken");
      if (!token) {
        showLogin("confirm");
        logout();
        return;
      }
      setPhotoMenuOpen(false);
      await deleteMyProfileImage(token);
      await loadLoginUser();
    } catch (error: unknown) {
      const result = handleApiError(error);
      console.error(result);

      switch (result.type) {
        case "AUTH":
          showLogin("confirm");
          logout();
          break;
        case "WARNING":
          showWarning(result.message);
          break;
        case "DIALOG":
          setErrorMessage(result.message);
          break;
        default:
          showError(
            "서버 내부에서 오류가 발생했습니다. 관리자에게 문의해주세요.",
          );
      }
    }
  }, [loadLoginUser, showLogin, showError, logout, showWarning]);

  const viewUser = isEditing ? f : user;

  if (errorState?.show) {
    return (
      <ErrorPage
        type={errorState.type}
        title={errorState.title}
        message={errorState.message}
      />
    );
  }
  const errText = "mt-2 text-[12px] text-red-500 flex items-center gap-1";

  return (
    <div className="min-h-screen bg-[#F8F9FC] pt-20 pb-28 font-sans">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* 상단 */}
        <div className="flex justify-between items-end mb-8 px-2">
          <div>
            <br></br>
            <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight">
              내 프로필
            </h1>
            <p className="text-gray-500 mt-2 text-sm font-medium">
              계정 설정 및 활동 내역
            </p>
          </div>

          <button
            onClick={handleLogout}
            className="flex items-center space-x-2 text-gray-400 hover:text-red-500 transition-colors text-sm font-medium px-4 py-2 rounded-full hover:bg-red-50"
          >
            <LogOut className="w-4 h-4" />
            <span>로그아웃</span>
          </button>
        </div>

        {/* 핵심: items-stretch + 양 컬럼 h-full + 왼쪽 flex-1 */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch">
          {/* 왼쪽 */}
          <div className="lg:col-span-4 flex flex-col gap-6 h-full">
            {/* 프로필 카드 */}
            <div className="bg-white rounded-[2rem] p-8 shadow-[0_20px_40px_-15px_rgba(0,0,0,0.05)] border border-gray-100/50 flex flex-col items-center text-center relative overflow-hidden">
              <div className="absolute top-0 w-full h-32 bg-gradient-to-b from-gray-50 to-white z-0" />

              <div className="relative z-10 mt-4">
                <div className="w-32 h-32 rounded-full bg-white p-1.5 shadow-xl shadow-gray-200/50 relative">
                  <div className="w-full h-full rounded-full bg-gray-100 flex items-center justify-center overflow-hidden border border-gray-100">
                    {user?.profileImageUrl ? (
                      <img
                        src={user.profileImageUrl}
                        alt="프로필"
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <User className="w-12 h-12 text-gray-300" />
                    )}
                  </div>

                  <div className="absolute -bottom-1 right-1">
                    <button
                      type="button"
                      onClick={() => setPhotoMenuOpen((v) => !v)}
                      className="bg-[#765AFF] text-white p-2.5 rounded-full shadow-lg hover:bg-[#6348e6] transition-transform hover:scale-105 active:scale-95"
                      title="프로필 사진"
                    >
                      <Camera className="w-4 h-4" />
                    </button>

                    {photoMenuOpen && (
                      <div className="absolute bottom-12 right-0 w-36 bg-white border border-gray-100 rounded-2xl shadow-xl p-1">
                        <button
                          type="button"
                          onClick={openSelector}
                          className="w-full flex items-center gap-2 px-3 py-2 rounded-xl hover:bg-gray-50 text-sm text-gray-700"
                        >
                          <Camera className="w-4 h-4 text-[#765AFF]" />
                          <span className="font-medium">사진 변경</span>
                        </button>

                        {user?.profileImageUrl && (
                          <button
                            type="button"
                            onClick={onDeleteImage}
                            className="w-full flex items-center gap-2 px-3 py-2 rounded-xl hover:bg-red-50 text-sm text-red-600"
                          >
                            <Trash2 className="w-4 h-4" />
                            <span className="font-medium">사진 삭제</span>
                          </button>
                        )}
                      </div>
                    )}

                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={onPickImage}
                    />
                  </div>
                </div>
              </div>

              <div className="relative z-10 mt-6 mb-2">
                <h2 className="text-2xl font-bold text-gray-900">
                  {user?.nickname || "닉네임 없음"}
                </h2>
                <p className="text-gray-400 text-sm mt-1">
                  {user?.email || ""}
                </p>
              </div>

              <div className="relative z-10 mt-6 w-full pt-6 border-t border-gray-100">
                <div className="flex justify-between items-center px-4">
                  <div className="text-center">
                    <p className="text-xs text-gray-400 font-semibold">
                      가입일
                    </p>
                    <p className="text-gray-800 font-bold mt-1 text-sm">
                      {user?.createdAt || ""}
                    </p>
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

            <div className="bg-white rounded-3xl p-6 pb-7 shadow-sm border border-gray-100 flex-1 flex flex-col">
              <div className="flex items-center justify-between text-gray-800 font-bold mb-5 px-1">
                <span>내 활동 내역</span>
              </div>

              <div className="space-y-1">
                <MenuItem
                  icon={Calendar}
                  label="내 상품 내역"
                  onClick={() => navigate("/mypage/auctionlist")}
                  colorClass="bg-blue-50 text-blue-500"
                />
                <MenuItem
                  icon={Heart}
                  label="내 찜 목록"
                  onClick={() => navigate("/mypage/wishlist")}
                  colorClass="bg-red-50 text-red-500"
                />
                <MenuItem
                  icon={Gavel}
                  label="내 입찰 목록"
                  onClick={() => navigate("/mypage/bidlist")}
                  colorClass="bg-purple-50 text-purple-500"
                />
              </div>
              <div className="flex-1" />
            </div>
          </div>

          <div className="lg:col-span-8 h-full">
            <div className="bg-white rounded-[2rem] p-8 lg:p-10 shadow-[0_20px_40px_-15px_rgba(0,0,0,0.05)] border border-gray-100/50 h-full relative">
              <div className="flex items-center justify-between mb-10">
                <h3 className="text-xl font-bold text-gray-900">기본 정보</h3>

                {!isEditing ? (
                  <button
                    onClick={startEdit}
                    className="w-10 h-10 flex items-center justify-center rounded-xl bg-transparent text-gray-500 hover:bg-[#765AFF]/5 hover:text-[#765AFF] transition-all"
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

              <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-8">
                <ProfileField
                  label="이름"
                  value={user?.name}
                  icon={User2}
                  isEditable={false}
                  isEditing={isEditing}
                />
                <div>
                  <div className="flex items-center gap-2">
                    <div className="flex-1">
                      <ProfileField
                        label="닉네임"
                        value={isEditingNickname ? f.nickname : user?.nickname}
                        icon={User}
                        isEditable={isEditingNickname} // 전용 모드일 때만 편집 가능
                        isEditing={isEditingNickname}
                        onBlur={(e) =>
                          validateField("nickname", e.target.value)
                        }
                        onChange={(e) => set("nickname", e.target.value)}
                      />
                    </div>

                    {/* 닉네임 전용 버튼 */}
                    {!isEditingNickname ? (
                      <button
                        onClick={startEditNickname}
                        className="mt-5 w-8 h-8 flex items-center justify-center rounded-lg text-gray-400 hover:text-[#765AFF] hover:bg-[#765AFF]/5 transition-all"
                        title="닉네임 수정"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                    ) : (
                      <div className="mt-5 flex items-center gap-1">
                        <button
                          onClick={handleCancelNickname}
                          className="w-8 h-8 flex items-center justify-center rounded-lg border border-gray-200 text-gray-500 hover:bg-gray-50"
                          title="취소"
                        >
                          <X className="w-4 h-4" />
                        </button>
                        <button
                          onClick={handleSaveNickname}
                          className="w-8 h-8 flex items-center justify-center rounded-lg bg-[#765AFF] text-white hover:bg-[#6348e6] shadow-md shadow-[#765AFF]/30"
                          title="저장"
                        >
                          <Check className="w-4 h-4" />
                        </button>
                      </div>
                    )}
                  </div>
                  {err.nickname && (
                    <div className={errText}>
                      <AlertCircle className="w-3.5 h-3.5" /> {err.nickname}
                    </div>
                  )}
                </div>

                {errorMessage && (
                  <div className="md:col-span-2">
                    <div className="flex items-center gap-2 px-4 py-2 bg-red-50 border border-red-200 rounded-xl">
                      <span className="text-sm text-red-600">
                        {errorMessage}
                      </span>
                    </div>
                  </div>
                )}

                <div className="md:col-span-2">
                  <ProfileField
                    label="이메일 주소"
                    value={user?.email}
                    icon={Mail}
                    isEditable={false}
                    isEditing={isEditing}
                  />
                </div>
                <div>
                  <ProfileField
                    label="전화번호"
                    value={viewUser?.phone}
                    icon={Smartphone}
                    isEditable={true}
                    isEditing={isEditing}
                    onBlur={(e) => validateField("phone", e.target.value)}
                    onChange={(e) => {
                      const onlyDigits = String(e.target.value ?? "").replace(
                        /[^0-9]/g,
                        "",
                      );
                      set("phone", onlyDigits);
                    }}
                  />
                  {err.phone && (
                    <div className={errText}>
                      <AlertCircle className="w-3.5 h-3.5" /> {err.phone}
                    </div>
                  )}
                </div>

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
                    onChange={(e) => {
                      set("address", e.target.value);
                    }}
                    onBlur={(e) => validateField("address", e.target.value)}
                  />
                  {err.address && (
                    <div className={errText}>
                      <AlertCircle className="w-3.5 h-3.5" /> {err.address}
                    </div>
                  )}
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
                      { value: "W", label: "여성" },
                      { value: "F", label: "여성" },
                    ]}
                  />
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
