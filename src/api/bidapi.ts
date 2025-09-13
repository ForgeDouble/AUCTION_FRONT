import type { Bid } from "../pages/auction_detail/AuctionDetailDto";

export const fetchBids = async (productId: number): Promise<Bid[]> => {
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
