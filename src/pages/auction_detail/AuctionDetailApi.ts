import type { BidLogDto, ProductDto, SellerDto } from "./AuctionDetailDto";
import type { ApiResponse } from "../../type/CommonType";
import { ApiError, DataReadError } from "@/errors/Errors";

const BASE =
  (import.meta.env.VITE_API_BASE as string | undefined) ??
  "http://localhost:8080";

/** redis로부터 경매 내역 조회 (입찰이 진행 중인 경우) */
export const fetchBidsFromRedis = async (
  productId: number | null,
): Promise<ApiResponse<BidLogDto[]>> => {
  const response = await fetch(`${BASE}/bid/redis/${productId}`, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
    },
  });

  if (!response.ok) {
    const body = await response.json();

    throw new ApiError(
      response.status,
      body.statusCode,
      body.errorMessage,
      body.additionalInfo,
    );
  }

  return response.json();
};

/** DB로부터 경매 내역 조회 (입찰이 진행 중이지 않은 경우) */
export const fetchBidsFromDB = async (
  productId: number | null,
): Promise<ApiResponse<BidLogDto[]>> => {
  const response = await fetch(`${BASE}/bid/all/${productId}`, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
    },
  });

  if (!response.ok) {
    const body = await response.json();

    throw new ApiError(
      response.status,
      body.statusCode,
      body.errorMessage,
      body.additionalInfo,
    );
  }

  return response.json();
};

/** 상품 조회 */
export const fetchProductById = async (
  productId: number | null,
): Promise<ApiResponse<ProductDto>> => {
  const response = await fetch(`${BASE}/product/${productId}`, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
    },
  });

  if (!response.ok) {
    const body = await response.json();

    if (response.status === 500) throw new DataReadError();
    throw new ApiError(
      response.status,
      body.statusCode,
      body.errorMessage,
      body.additionalInfo,
    );
  }

  return response.json();
};

/* 판매자의 정보를 조회 */
export const fetchSellerByProductId = async (
  productId: number | null,
): Promise<ApiResponse<SellerDto>> => {
  const response = await fetch(`${BASE}/user/seller/${productId}`, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
    },
  });

  if (!response.ok) {
    const body = await response.json();

    if (response.status === 500) throw new DataReadError();
    throw new ApiError(
      response.status,
      body.statusCode,
      body.errorMessage,
      body.additionalInfo,
    );
  }

  return response.json();
};

/** 위시리스트에 속한 경매인지 여부를 조회 */
export const fetchIsWishlisted = async (
  token: string | null,
  productId: null | number,
): Promise<ApiResponse<number | null>> => {
  const response = await fetch(`${BASE}/wishlist/isWishlisted/${productId}`, {
    method: "GET",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
  });

  if (!response.ok) {
    const body = await response.json();

    throw new ApiError(
      response.status,
      body.statusCode,
      body.errorMessage,
      body.additionalInfo,
    );
  }

  return response.json();
};

export const fetchDeleteProduct = async (
  token: string | null,
  productId: null | number,
): Promise<ApiResponse<null>> => {
  const response = await fetch(`${BASE}/product/delete/${productId}`, {
    method: "PUT",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
  });

  if (!response.ok) {
    const body = await response.json();

    throw new ApiError(
      response.status,
      body.statusCode,
      body.errorMessage,
      body.additionalInfo,
    );
  }

  return response.json();
};
