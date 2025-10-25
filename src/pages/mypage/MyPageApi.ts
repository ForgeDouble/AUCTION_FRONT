import type { ApiResponse } from "../../type/CommonType";

import type { BidListDto, ProductListDto, UserDto } from "./MyPageDto";

export const fetchLoginUser = async (
  token: string | null
): Promise<ApiResponse<UserDto>> => {
  const response = await fetch(`http://localhost:8080/user/detail`, {
    method: "GET",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch bids: ${response.status}`);
  }

  return response.json();
};

export const fetchProductsByUser = async (
  token: string | null
): Promise<ApiResponse<ProductListDto[]>> => {
  const response = await fetch(`http://localhost:8080/product/allByUser`, {
    method: "GET",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch bids: ${response.status}`);
  }

  return response.json();
};

export const fetchBidsByUser = async (
  token: string | null
): Promise<ApiResponse<BidListDto[]>> => {
  const response = await fetch(`http://localhost:8080/bid/allByUser`, {
    method: "GET",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch bids: ${response.status}`);
  }

  return response.json();
};

export const fetchProductsByWishlist = async (
  token: string | null
): Promise<ApiResponse<ProductListDto[]>> => {
  const response = await fetch(`http://localhost:8080/product/allByWishlist`, {
    method: "GET",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch bids: ${response.status}`);
  }

  return response.json();
};
