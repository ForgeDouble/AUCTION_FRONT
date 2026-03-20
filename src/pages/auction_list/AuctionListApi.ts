import { ApiError, UnauthorizedError } from "@/errors/Errors";
import type { ApiResponse, PageResponse } from "../../type/CommonType";
import type {
  ParentCategoriesDto,
  ProductListDto,
  wishlistDto,
} from "./AuctionListDto";

const BASE =
  (import.meta.env.VITE_API_BASE as string | undefined) ??
  "http://localhost:8080";

/** 상품목록 조회 */
export const fetchProducts = async (
  params: URLSearchParams,
): Promise<ApiResponse<PageResponse<ProductListDto>>> => {
  const response = await fetch(`${BASE}/product/all?${params.toString()}`, {
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

/** 카테고리 목록 조회 */
export const fetchParentCategories = async (): Promise<
  ApiResponse<ParentCategoriesDto[]>
> => {
  const response = await fetch(`${BASE}/category/with_children_and_count`, {
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

/** 위시리스트 여부 조회 */
export const fetchWishlistByUser = async (
  token: string | null,
): Promise<ApiResponse<wishlistDto[]>> => {
  const response = await fetch(`${BASE}/wishlist/allByUser`, {
    method: "GET",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
  });

  if (!response.ok) {
    const body = await response.json();

    if (response.status === 401) throw new UnauthorizedError();
    throw new ApiError(
      response.status,
      body.statusCode,
      body.errorMessage,
      body.additionalInfo,
    );
  }

  return response.json();
};
