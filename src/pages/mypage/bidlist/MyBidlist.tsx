import { useEffect, useState } from "react";
import { type BidListDto } from "../MyPageDto";
import { fetchBidsByUser } from "../MyPageApi";

const MyBidlist = () => {
  /* 나의 입찰 리스트 */
  const [bids, setBids] = useState<BidListDto[]>();

  const loadBidsByUser = async () => {
    try {
      const token = localStorage.getItem("accessToken");
      const data = await fetchBidsByUser(token);

      const bidData = data.result.map((bid) => ({
        ...bid,
        // bidCreatedAt: bid.bidCreatedAt.split("T")[0].replace(/-/g, "."),
      }));

      setBids(bidData);
      console.log(bidData);
    } catch (error) {
      console.error(error);
    } finally {
      // setLoading(false);
    }
  };

  useEffect(() => {
    loadBidsByUser();
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-black pt-24 pb-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          <div className="lg:col-span-4">
            <div className="bg-black/40 backdrop-blur-lg rounded-2xl border border-white/10 p-8">
              <h2 className="text-2xl font-bold text-white mb-6">입찰 내역</h2>
              <div className="space-y-4">
                {(bids || []).map((bid) => (
                  <div
                    key={bid.bidId}
                    className="bg-white/5 rounded-xl p-4 border border-white/10 hover:border-purple-500 transition-colors"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-4">
                        <div className="w-16 h-16 bg-gradient-to-br from-purple-500/20 to-pink-500/20 rounded-lg"></div>
                        <div>
                          <h3 className="text-white font-semibold mb-1">
                            경매 상품 {bid?.productName || ""}
                          </h3>
                          <p className="text-gray-400 text-sm">
                            입찰가: {(bid?.bidAmount || 0).toLocaleString()}원
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        {/* <span
                            className={`px-3 py-1 rounded-full text-sm ${
                              item === 1
                                ? "bg-green-500/20 text-green-400"
                                : "bg-yellow-500/20 text-yellow-400"
                            }`}
                          >
                            {item === 1 ? "낙찰" : "진행중"}
                          </span> */}
                        <p className="text-gray-500 text-sm mt-1">
                          {bid?.bidCreatedAt.split("T")[0].replace(/-/g, ".") ||
                            ""}
                        </p>
                        <p className="text-gray-500 text-sm mt-1">
                          {bid?.bidCreatedAt
                            .split("T")[1]
                            .split(".")[0]
                            .replace(/-/g, ".") || ""}
                        </p>
                      </div>
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

export default MyBidlist;
