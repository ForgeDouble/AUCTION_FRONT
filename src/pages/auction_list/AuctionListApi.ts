import type { ApiResponse } from "../../type/CommonType";
import type { ProductListDto } from "./AuctionListDto";

export const fetchProducts = async (): Promise<
  ApiResponse<ProductListDto[]>
> => {
  const response = await fetch(`http://localhost:8080/product/all`, {
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
