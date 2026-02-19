import { ApiError, UnauthorizedError } from "@/errors/Errors";
import type { ApiResponse, PageResponse } from "@/type/CommonType";
import type { ProductListDto } from "./MywishlistDto";

const BASE =
  (import.meta.env.VITE_API_BASE as string | undefined) ??
  "http://localhost:8080";

/** 내 찜 목록 */
export const fetchProductsByWishlist = async (
  token: string | null,
  page = 0,
  size = 10,
): Promise<ApiResponse<PageResponse<ProductListDto>>> => {
  const response = await fetch(
    `${BASE}/wishlist/products?page=${page}&size=${size}`,
    {
      method: "GET",
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    },
  );

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

export async function deleteWishlist(
  token: string,
  wishlistId: number,
): Promise<ApiResponse<null>> {
  const response = await fetch(
    `${import.meta.env.VITE_API_BASE}/wishlist/delete/${wishlistId}`,
    {
      method: "DELETE",
      headers: {
        Authorization: `Bearer ${token}`,
      },
    },
  );

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
}
