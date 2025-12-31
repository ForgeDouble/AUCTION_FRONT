import placeholderImg from "@/assets/images/PlaceHolder.jpg";
import { useEffect, useState } from "react";
import { type ProductListDto } from "../MyPageDto";
import { fetchProductsByUser } from "../MyPageApi";

const MyAuctionlist = () => {
  /* 나의 경매 상품 리스트 */
  const [products, setProducts] = useState<ProductListDto[]>();

  const loadProductsByUser = async () => {
    try {
      const token = localStorage.getItem("accessToken");
      const data = await fetchProductsByUser(token);
      setProducts(data.result);
      console.log(data);
    } catch (error) {
      console.error(error);
    } finally {
      // setLoading(false);
    }
  };

  useEffect(() => {
    loadProductsByUser();
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-black pt-24 pb-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          <div className="lg:col-span-4">
            <div className="bg-black/40 backdrop-blur-lg rounded-2xl border border-white/10 p-8">
              <h2 className="text-2xl font-bold text-white mb-6">
                내가 등록한 경매
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* 경매 카드 예시 */}
                {(products || []).map((product) => (
                  <div
                    key={product.productId}
                    className="bg-white/5 rounded-xl p-4 border border-white/10 hover:border-purple-500 transition-colors cursor-pointer"
                  >
                    <img
                      src={product.previewImageUrl || placeholderImg}
                      alt={product.productName}
                      className="w-full h-55 object-cover"
                    />
                    <h3 className="text-white font-semibold mb-2">
                      경매 상품 : {product.productName}
                    </h3>
                    <div className="flex justify-between items-center text-sm">
                      <span className="text-gray-400">현재가</span>
                      <span className="text-purple-400 font-bold">
                        {product.latestBidAmount.toLocaleString()}원
                      </span>
                    </div>
                    <div className="flex justify-between items-center text-sm mt-1">
                      <span className="text-gray-400">입찰</span>
                      <span className="text-white">
                        {product.bidCount - 1}건
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MyAuctionlist;
