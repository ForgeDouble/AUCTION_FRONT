import React, { useEffect, useRef, useState } from "react";
import {
  Upload,
  X,
  DollarSign,
  Package,
  Image,
  Loader2,
  SwatchBook,
  Pencil,
} from "lucide-react";
import {
  type ImageDto,
  type ParentCategoriesDto,
  type ProductCreateDto,
} from "./SellProductDto";
import CategorySelector from "@/components/category_selector/CategorySelector";
import { fetchCreateProduct, fetchParentCategories } from "./SellProductApi";
import { useNavigate } from "react-router-dom";
import { useModal } from "@/contexts/ModalContext";
import { useAuth } from "@/hooks/useAuth";

const SellProductPage = () => {
  const { showError, showLogin, showWarning } = useModal();
  const [images, setImages] = useState<ImageDto[]>([]);
  const [parentCategories, setParentCategories] = useState<
    ParentCategoriesDto[]
  >([]);
  const [formData, setFormData] = useState({
    productName: "",
    categoryId: null as number | null,
    price: "",
    productContent: "",
  });
  const [imageError, setImageError] = useState("");
  const [nameError, setNameError] = useState<string>("");
  const [categoryError, setCategoryError] = useState<string>("");
  const [priceError, setPriceError] = useState<string>("");
  const [contentError, setContentError] = useState<string>("");
  const [loading, setLoading] = useState(false);

  const imageRef = useRef<HTMLDivElement>(null);
  const nameInputRef = useRef<HTMLInputElement>(null);
  const priceInputRef = useRef<HTMLInputElement>(null);
  const contentInputRef = useRef<HTMLInputElement>(null);

  const navigate = useNavigate();

  const { authority } = useAuth();

  /* 상품 제목 검증 함수 */
  const isValidProductName = (name: string) => {
    const trimmed = name.trim();

    if (trimmed.length === 0) return false; // 공백만 있는 경우
    if (trimmed.length > 30) return false; // 30자 초과

    return true;
  };

  /* 가격 검증 함수 */
  const isValidPrice = (price: string) => {
    const value = Number(price.replace(/,/g, ""));

    if (isNaN(value)) return false;
    if (value < 1000) return false;
    if (value % 1000 !== 0) return false;

    return true;
  };

  const formatNumber = (value: string) =>
    value.replace(/\B(?=(\d{3})+(?!\d))/g, ",");

  const unformatNumber = (value: string) => value.replace(/,/g, "");

  /* 가격 핸들러 함수 */
  const handlePriceChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = unformatNumber(e.target.value);
    const onlyNumber = raw.replace(/[^0-9]/g, "");
    setFormData((prev) => ({ ...prev, price: formatNumber(onlyNumber) }));
    setPriceError("");
  };

  /* 상품 제목 검증 함수 */
  const isValidProductContent = (content: string) => {
    const trimmed = content.trim();

    if (trimmed.length === 0) return false; // 공백만 있는 경우
    if (trimmed.length > 2500) return false; // 2500자 초과

    return true;
  };

  /* 이미지 업로드 함수 */
  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    const newImages = files.map((file) => ({
      id: Math.random().toString(36).substr(2, 9),
      url: URL.createObjectURL(file),
      file,
    }));
    setImages((prev) => [...prev, ...newImages].slice(0, 10));
    setImageError("");
  };

  /* 입력 감지 함수 */
  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
  ) => {
    const { name, value } = e.target;

    /* 제목 입력하면 에러 제거 */
    if (name === "productName") {
      setNameError("");
    }

    /* 카테고라 선택하면 에러 제거 */
    if (name === "categoryId") {
      setCategoryError("");
    }

    /* 내용 입력하면 에러 제거 */
    if (name === "productContent") {
      setContentError("");
    }

    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  /* 이미지 제거 함수 */
  const removeImage = (id: string) => {
    setImages((prev) => prev.filter((img) => img.id !== id));
  };

  /* 부모 카테고리 조회 */
  const loadParentCategories = async () => {
    try {
      const data = await fetchParentCategories();
      setParentCategories(data.result);
    } catch (error) {
      console.error(error);
      showError();
    }
  };

  /* 상품 등록 핸들러 */
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (authority && (authority === "ADMIN" || authority === "INQUIRY")) {
      showError("관리자 또는 문의담당자는 상품을 판매하실 수 없습니다.");
      return;
    }

    if (images.length === 0) {
      setImageError("최소 1개 이상의 이미지를 업로드해주세요.");

      imageRef.current?.scrollIntoView({
        behavior: "smooth",
        block: "center",
      });
      return;
    }

    if (!isValidProductName(formData.productName)) {
      const msg = "상품명은 공백 없이 최대 30자까지 입력할 수 있습니다.";
      setNameError(msg);

      setTimeout(() => {
        nameInputRef.current?.focus();
      }, 0);

      return;
    }

    if (!formData.categoryId) {
      setCategoryError("카테고리를 선택해주세요.");
      return;
    }

    if (!isValidPrice(formData.price)) {
      const msg = "가격은 최소 1,000원이며 1,000원 단위로 입력해야 합니다.";
      setPriceError(msg);

      setTimeout(() => {
        priceInputRef.current?.focus();
      }, 0);

      return;
    }

    if (!isValidProductContent(formData.productContent)) {
      const msg = "상품 내용은 공백 없이 최대 2500자까지 입력할 수 있습니다.";
      setContentError(msg);

      setTimeout(() => {
        contentInputRef.current?.focus();
      }, 0);

      return;
    }

    setLoading(true);

    try {
      const productData: ProductCreateDto = {
        categoryId: formData.categoryId,
        productName: formData.productName,
        productContent: formData.productContent,
        price: Number(formData.price.replace(/,/g, "")),
        status: "READY",
      };

      const token = localStorage.getItem("accessToken");
      if (token == null) {
        console.error("Missing AccessToken");
        showLogin();
        return;
      }

      const files = images.map((img) => img.file);
      await fetchCreateProduct(productData, files, token);

      showWarning("상품이 등록되었습니다.");

      // 폼 초기화
      setFormData({
        productName: "",
        categoryId: null,
        price: "",
        productContent: "",
      });
      setImages([]);
    } catch (error) {
      console.error("상품 등록 실패:", error);
      showError("상품 등록에 실패했습니다. 다시 시도해주세요");
    } finally {
      setLoading(false);
      navigate(`/auction_list`);
    }
  };

  useEffect(() => {
    loadParentCategories();
  }, []);

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4 pt-20">
      <div className="max-w-4xl mx-auto">
        {/* 헤더 */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold bg-[rgb(118,90,255)] bg-clip-text text-transparent mb-2">
            상품 판매하기
          </h1>
          <p className="text-gray-600">경매로 당신의 물건을 판매해보세요</p>
        </div>

        <form
          onSubmit={handleSubmit}
          className="bg-white rounded-2xl shadow-xl p-8 space-y-8"
        >
          {/* 이미지 업로드 섹션 */}
          <div ref={imageRef}>
            <label className="flex items-center text-lg font-semibold text-gray-800 mb-4">
              <Image className="mr-2 text-[rgb(118,90,255)]" size={24} />
              상품 이미지 (최대 10장) *
            </label>

            <div className="grid grid-cols-5 gap-4 p-2 rounded-xl">
              {/* 이미지 업로드 버튼 */}
              {images.length < 10 && (
                <label
                  className={`aspect-square border-2 border-dashed border-gray-300 rounded-xl hover:border-[rgb(118,90,255)] hover:bg-blue-50 transition-all cursor-pointer flex flex-col items-center justify-center
                  ${imageError ? "border-2 border-dashed border-yellow-500 rounded-xl" : "border-2 border-dashed border-gray-300 rounded-xl"}
                  `}
                >
                  <input
                    type="file"
                    multiple
                    accept="image/*"
                    onChange={handleImageUpload}
                    className="hidden"
                  />
                  <Upload className="text-gray-400 mb-2" size={32} />
                  <span className="text-xs text-gray-500">이미지 추가</span>
                </label>
              )}

              {/* 업로드된 이미지들 */}
              {images.map((img, index) => (
                <div
                  key={img.id}
                  className="relative aspect-square rounded-xl overflow-hidden group"
                >
                  <img
                    src={img.url}
                    alt={`상품 이미지 ${index + 1}`}
                    className="w-full h-full object-cover"
                  />
                  {index === 0 && (
                    <div className="absolute top-2 left-2 bg-[rgb(118,90,255)] text-white text-xs px-2 py-1 rounded-full">
                      대표
                    </div>
                  )}
                  <button
                    type="button"
                    onClick={() => removeImage(img.id)}
                    className="absolute top-2 right-2 bg-red-500 text-white p-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <X size={16} />
                  </button>
                </div>
              ))}
            </div>
            {imageError && (
              <p className="mt-2 text-sm text-yellow-500">{imageError}</p>
            )}
            <p className="text-sm text-gray-500 mt-2">
              첫 번째 이미지가 대표 이미지로 설정됩니다
            </p>
          </div>

          {/* 상품 정보 */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* 상품명 */}
            <div className="md:col-span-2">
              <label className="flex items-center text-sm font-semibold text-gray-700 mb-2">
                <Package className="mr-2 text-[rgb(118,90,255)]" size={18} />
                상품명 *
              </label>
              <input
                ref={nameInputRef}
                type="text"
                name="productName"
                placeholder="제목을 입력하세요. (최대 30자)"
                value={formData.productName}
                onChange={handleChange}
                maxLength={30}
                className={`w-full px-4 py-3 border rounded-xl focus:outline-none focus:ring-2 placeholder:text-gray-400
                    ${
                      nameError
                        ? "border-yellow-500 focus:ring-yellow-400"
                        : "border-gray-300 focus:ring-[rgb(118,90,255)]"
                    }
                  `}
              />
              {nameError && (
                <p className="mt-1 text-sm text-yellow-500">{nameError}</p>
              )}
            </div>

            {/* 카테고리 */}
            <div>
              <label className="flex items-center text-sm font-semibold text-gray-700 mb-2">
                <SwatchBook className="mr-2 text-[rgb(118,90,255)]" size={18} />
                카테고리 *
              </label>

              <CategorySelector
                categories={parentCategories}
                selectedCategoryId={formData.categoryId}
                hasError={!!categoryError}
                onSelectCategory={(categoryId, categoryName) => {
                  setFormData((prev) => ({
                    ...prev,
                    categoryId,
                    categoryName,
                  }));
                  setCategoryError(""); // 선택하면 에러 제거
                }}
              />

              {categoryError && (
                <p className="mt-1 text-sm text-yellow-500">{categoryError}</p>
              )}
            </div>

            {/* 시작 가격 */}
            <div>
              <label className="flex items-center text-sm font-semibold text-gray-700 mb-2">
                <DollarSign className="mr-2 text-[rgb(118,90,255)]" size={18} />
                시작 가격 *
              </label>
              <div className="relative">
                <input
                  ref={priceInputRef}
                  type="text"
                  inputMode="numeric"
                  name="price"
                  value={formData.price}
                  placeholder="가격을 입력하세요. (단위: 1000, 최소 1000원)"
                  onChange={handlePriceChange}
                  min={1000}
                  className={`w-full px-4 py-3 border rounded-xl focus:outline-none focus:ring-2 placeholder:text-gray-400
                    ${
                      priceError
                        ? "border-yellow-500 focus:ring-yellow-400"
                        : "border-gray-300 focus:ring-[rgb(118,90,255)]"
                    }
                  `}
                />

                {priceError && (
                  <p className="mt-1 text-sm text-yellow-500">{priceError}</p>
                )}
              </div>
            </div>
          </div>

          {/* 상품 설명 */}
          <div>
            <label className="flex item-center text-sm font-semibold text-gray-700 mb-2">
              <Pencil className="mr-2 text-[rgb(118,90,255)]" size={18} />
              상품 설명 *
            </label>
            <div className="space-y-1">
              <textarea
                name="productContent"
                value={formData.productContent}
                onChange={handleChange}
                maxLength={2500}
                placeholder="상품 설명을 입력하세요 (최대 2500자)"
                className={`w-full h-40 px-4 py-3 border rounded-xl resize-none focus:outline-none focus:ring-2 placeholder:text-gray-400
                    ${
                      contentError
                        ? "border-yellow-500 focus:ring-yellow-400"
                        : "border-gray-300 focus:ring-[rgb(118,90,255)]"
                    }
                  `}
              />

              {/* 글자 수 표시 */}
              <div className="flex justify-between text-sm">
                <span className="text-yellow-500">{contentError}</span>
                <span className="text-gray-400">
                  {formData.productContent.length} / 2500
                </span>
              </div>
            </div>
            <p className="text-sm text-gray-500 mt-2">
              상품의 상태, 특징, 사용감 등을 상세히 작성하면 구매 확률이
              높아집니다
            </p>
          </div>

          {/* 주의사항 */}
          <div className="bg-white border-2 border border-[rgb(118,90,255)] rounded-xl p-4">
            <h3 className="font-bold text-gray-900 mb-2">판매 시 유의사항</h3>
            <ul className="text-sm text-gray-750 space-y-1">
              <li>• 상품 등록 후 10분 이후는 수정, 삭제를 할 수 없습니다</li>
              <li>• 정확한 상품 정보를 입력해주세요</li>
              <li>• 실물과 동일한 사진을 업로드해주세요</li>
            </ul>
          </div>

          {/* 제출 버튼 */}
          <div className="flex gap-4">
            <button
              type="button"
              onClick={() => window.history.back()}
              className="flex-1 py-4 border-2 border-gray-300 text-gray-700 rounded-xl font-bold hover:bg-gray-50 transition-all cursor-pointer"
              disabled={loading}
            >
              취소
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 py-4 bg-[rgb(118,90,255)] text-white rounded-xl font-bold hover:from-purple-700 hover:to-pink-700 transition-all shadow-lg hover:shadow-xl cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <Loader2 className="w-5 h-5 text-white animate-spin" />
              ) : (
                "상품 등록하기"
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default SellProductPage;
