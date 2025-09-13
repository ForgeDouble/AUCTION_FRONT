import type { BidLogDto } from "../pages/auction_detail/AuctionDetailDto";
import type { ApiResponse } from "../type/CommonType";

export const fetchBids = async (
  productId: number
): Promise<ApiResponse<BidLogDto[]>> => {
  const response = await fetch(`http://localhost:8080/bid/redis/${productId}`, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
    },
    credentials: "include", // 필요하면 쿠키 포함
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch bids: ${response.status}`);
  }

  return response.json();
};
