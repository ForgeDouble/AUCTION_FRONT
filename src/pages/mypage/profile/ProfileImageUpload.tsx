import { useState } from "react";
import { createPortal } from "react-dom";
import { User, X } from "lucide-react";
import { fetchDeleteImage, fetchUploadORReplaceImage } from "../MyPageApi";
import { useModal } from "@/contexts/ModalContext";

interface ProfileImageUploadProps {
  profileImage: string | null;
  onImageChange: (imageUrl: string | null) => void;
}

const ProfileImageUpload = ({
  profileImage,
  onImageChange,
}: ProfileImageUploadProps) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [tempImage, setTempImage] = useState<string | null>(null);
  const [tempfile, setTempFile] = useState<File | null>(null);

  const { showLogin, showError } = useModal();

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setTempFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setTempImage(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleDelete = () => {
    setTempImage(null);
    onImageChange(null);
  };

  const handleClose = () => {
    setIsModalOpen(false);
    setTempImage(profileImage);
  };

  const handleUpload = async () => {
    try {
      const token = localStorage.getItem("accessToken");
      if (token == null) {
        showLogin();
        console.error("Missing AccessToken");
        return;
      }
      if (tempfile == null) {
        const data = await fetchDeleteImage(token);
        onImageChange(tempImage);
        setIsModalOpen(false);
        console.log(data);
      } else {
        const data = await fetchUploadORReplaceImage(token, tempfile);
        onImageChange(tempImage);
        setIsModalOpen(false);
        console.log(data);
      }
    } catch (error) {
      console.error(error);
      showError();
    }
  };

  return (
    <>
      {/* 프로필 이미지 */}
      <div className="relative w-24 h-24">
        <div
          onClick={() => {
            setTempImage(profileImage);
            setIsModalOpen(true);
          }}
          className="cursor-pointer block w-24 h-24 border-2 border-gray-300 rounded-full flex items-center justify-center hover:border-[rgb(118,90,255)] transition-colors overflow-hidden bg-white"
        >
          {profileImage ? (
            <img
              src={profileImage}
              alt="Profile"
              className="w-full h-full object-cover"
            />
          ) : (
            <User className="w-12 h-12 text-gray-400" />
          )}
        </div>
        <div className="absolute bottom-0 right-0 bg-white rounded-full p-1.5 shadow-lg border border-gray-200">
          <svg
            className="w-4 h-4 text-gray-700"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z"
            />
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M15 13a3 3 0 11-6 0 3 3 0 016 0z"
            />
          </svg>
        </div>
      </div>

      {/* 모달 - Portal 사용 */}
      {isModalOpen &&
        createPortal(
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[9999]">
            <div className="bg-white rounded-2xl p-8 w-96 relative">
              {/* 닫기 버튼 */}
              <button
                onClick={handleClose}
                className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 cursor-pointer"
              >
                <X className="w-6 h-6" />
              </button>

              {/* 제목 */}
              <h2 className="text-xl font-bold text-gray-900 mb-6 text-center">
                프로필 사진 변경
              </h2>

              {/* 프로필 이미지 미리보기 */}
              <div className="flex justify-center mb-6">
                <div className="relative w-32 h-32">
                  <input
                    type="file"
                    id="modal-profile-image"
                    accept="image/*"
                    onChange={handleFileChange}
                    className="sr-only"
                  />
                  <label
                    htmlFor="modal-profile-image"
                    className="cursor-pointer block w-32 h-32 border-2 border-gray-300 rounded-full flex items-center justify-center hover:border-[rgb(118,90,255)] transition-colors overflow-hidden bg-white"
                  >
                    {tempImage ? (
                      <img
                        src={tempImage}
                        alt="Profile"
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <User className="w-16 h-16 text-gray-400" />
                    )}
                  </label>
                  <div className="absolute bottom-0 right-0 bg-white rounded-full p-2 shadow-lg border border-gray-200">
                    <svg
                      className="w-5 h-5 text-gray-700"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z"
                      />
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M15 13a3 3 0 11-6 0 3 3 0 016 0z"
                      />
                    </svg>
                  </div>
                </div>
              </div>

              {/* 버튼들 */}
              <div className="flex gap-3">
                <button
                  onClick={handleDelete}
                  className="flex-1 px-4 py-3 border border-gray-300 rounded-lg text-gray-700 font-medium hover:bg-gray-50 transition-colors cursor-pointer"
                >
                  삭제
                </button>
                <button
                  onClick={() => handleUpload()}
                  className="flex-1 px-4 py-3 bg-[rgb(118,90,255)] text-white rounded-lg font-medium hover:bg-[rgb(90,58,252)] transition-colors cursor-pointer"
                >
                  등록
                </button>
              </div>
            </div>
          </div>,
          document.body,
        )}
    </>
  );
};

export default ProfileImageUpload;
