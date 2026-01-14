import type { BidLogDto, ProductDto, SellerDto } from "./AuctionDetailDto";
import type { ApiResponse } from "../../type/CommonType";

export const fetchBidsFromRedis = async (
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

export const fetchProductById = async (
  productId: number
): Promise<ApiResponse<ProductDto>> => {
  const response = await fetch(`http://localhost:8080/product/${productId}`, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
    },
    credentials: "include",
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch bids: ${response.status}`);
  }

  return response.json();
};

export const fetchSellerByProductId = async (
  productId: number | null
): Promise<ApiResponse<SellerDto>> => {
  const response = await fetch(
    `http://localhost:8080/user/seller/${productId}`,
    {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
      credentials: "include",
    }
  );

  if (!response.ok) {
    throw new Error(`Failed to fetch bids: ${response.status}`);
  }

  return response.json();
};

export const fetchBidsFromDB = async (
  productId: number
): Promise<ApiResponse<BidLogDto[]>> => {
  const response = await fetch(`http://localhost:8080/bid/all/${productId}`, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
    },
    credentials: "include",
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch bids: ${response.status}`);
  }

  return response.json();
};

export const fetchIsWishlisted = async (
  token: string | null,
  productId: null | number
): Promise<ApiResponse<number | null>> => {
  const response = await fetch(
    `http://localhost:8080/wishlist/isWishlisted/${productId}`,
    {
      method: "GET",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      credentials: "include",
    }
  );

  if (!response.ok) {
    throw new Error(`Failed to fetch Wishlist: ${response.status}`);
  }

  return response.json();
};
