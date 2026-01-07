import React, { useEffect, useState } from "react";
import { Upload, X, DollarSign, Package, Image } from "lucide-react";
import {
  Status,
  type ParentCategoriesDto,
  type ProductCreateDto,
} from "./SellProductDto";
import CategorySelector from "@/components/fcm/category_selector/CategorySelector";
import { fetchCreateProduct, fetchParentCategories } from "./SellProductApi";
import { useNavigate } from "react-router-dom";

const SellProductPage = () => {
  const [images, setImages] = useState<any[]>([]);
  const [parentCategories, setParentCategories] = useState<
    ParentCategoriesDto[]
  >([]);
  const [formData, setFormData] = useState({
    productName: "",
    categoryId: null as number | null,
    price: "",
    productContent: "",
  });
  const [loading, setLoading] = useState(false);

  const navigate = useNavigate();

  /* 부모 카테고리 조회 */
  const loadParentCategories = async () => {
    try {
      const data = await fetchParentCategories();
      setParentCategories(data.result);
    } catch (error) {
      console.error(error);
    }
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    const newImages = files.map((file) => ({
      id: Math.random().toString(36).substr(2, 9),
      url: URL.createObjectURL(file),
      file,
    }));
    setImages((prev) => [...prev, ...newImages].slice(0, 10));
  };

  const removeImage = (id: string) => {
    setImages((prev) => prev.filter((img) => img.id !== id));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (images.length === 0) {
      alert("최소 1개 이상의 이미지를 업로드해주세요.");
      return;
    }

    if (!formData.categoryId) {
      alert("카테고리를 선택해주세요.");
      return;
    }

    setLoading(true);

    try {
      const productData: ProductCreateDto = {
        categoryId: formData.categoryId,
        productName: formData.productName,
        productContent: formData.productContent,
        price: Number(formData.price),
        status: Status.READY,
      };

      const token = localStorage.getItem("accessToken");
      if (token == null) {
        throw Error("No Token");
        return;
      }

      const files = images.map((img) => img.file);
      const response = await fetchCreateProduct(productData, files, token);

      alert(response.message || "상품이 등록되었습니다!");
      navigate(`/auction_list`);

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
      alert("상품 등록에 실패했습니다. 다시 시도해주세요.");
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  useEffect(() => {
    loadParentCategories();
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-blue-50 py-8 px-4 pt-20">
      <div className="max-w-4xl mx-auto">
        {/* 헤더 */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent mb-2">
            상품 판매하기
          </h1>
          <p className="text-gray-600">경매로 당신의 물건을 판매해보세요</p>
        </div>

        <form
          onSubmit={handleSubmit}
          className="bg-white rounded-2xl shadow-xl p-8 space-y-8"
        >
          {/* 이미지 업로드 섹션 */}
          <div>
            <label className="flex items-center text-lg font-semibold text-gray-800 mb-4">
              <Image className="mr-2 text-purple-600" size={24} />
              상품 이미지 (최대 10장) *
            </label>

            <div className="grid grid-cols-5 gap-4">
              {/* 이미지 업로드 버튼 */}
              {images.length < 10 && (
                <label className="aspect-square border-2 border-dashed border-gray-300 rounded-xl hover:border-purple-500 hover:bg-purple-50 transition-all cursor-pointer flex flex-col items-center justify-center">
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
                    <div className="absolute top-2 left-2 bg-purple-600 text-white text-xs px-2 py-1 rounded-full">
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
            <p className="text-sm text-gray-500 mt-2">
              첫 번째 이미지가 대표 이미지로 설정됩니다
            </p>
          </div>

          {/* 상품 정보 */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* 상품명 */}
            <div className="md:col-span-2">
              <label className="flex items-center text-sm font-semibold text-gray-700 mb-2">
                <Package className="mr-2 text-purple-600" size={18} />
                상품명 *
              </label>
              <input
                type="text"
                name="productName"
                value={formData.productName}
                onChange={handleChange}
                placeholder="상품명을 입력하세요"
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                required
              />
            </div>

            {/* 카테고리 */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                카테고리 *
              </label>
              <CategorySelector
                categories={parentCategories}
                selectedCategoryId={formData.categoryId}
                onSelectCategory={(categoryId, categoryName) => {
                  setFormData((prev) => ({
                    ...prev,
                    categoryId,
                    categoryName,
                  }));
                }}
              />
            </div>

            {/* 시작 가격 */}
            <div>
              <label className="flex items-center text-sm font-semibold text-gray-700 mb-2">
                <DollarSign className="mr-2 text-purple-600" size={18} />
                시작 가격 *
              </label>
              <div className="relative">
                <input
                  type="number"
                  name="price"
                  value={formData.price}
                  onChange={handleChange}
                  placeholder="0"
                  min="0"
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  required
                />
                <span className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500">
                  원
                </span>
              </div>
            </div>
          </div>

          {/* 상품 설명 */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              상품 설명 *
            </label>
            <textarea
              name="productContent"
              value={formData.productContent}
              onChange={handleChange}
              placeholder="상품에 대해 자세히 설명해주세요"
              rows={6}
              className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent resize-none"
              required
            />
            <p className="text-sm text-gray-500 mt-2">
              상품의 상태, 특징, 사용감 등을 상세히 작성하면 구매 확률이
              높아집니다
            </p>
          </div>

          {/* 주의사항 */}
          <div className="bg-purple-50 border border-purple-200 rounded-xl p-4">
            <h3 className="font-semibold text-purple-900 mb-2">
              판매 시 유의사항
            </h3>
            <ul className="text-sm text-purple-800 space-y-1">
              <li>• 정확한 상품 정보를 입력해주세요</li>
              <li>• 실물과 동일한 사진을 업로드해주세요</li>
              <li>• 경매 시작 후에는 취소가 불가능합니다</li>
            </ul>
          </div>

          {/* 제출 버튼 */}
          <div className="flex gap-4">
            <button
              type="button"
              onClick={() => window.history.back()}
              className="flex-1 py-4 border-2 border-gray-300 text-gray-700 rounded-xl font-bold hover:bg-gray-50 transition-all"
              disabled={loading}
            >
              취소
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 py-4 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-xl font-bold hover:from-purple-700 hover:to-pink-700 transition-all shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? "등록 중..." : "상품 등록하기"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default SellProductPage;
