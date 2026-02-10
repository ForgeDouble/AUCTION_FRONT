import { ApiError, UnauthorizedError } from "@/errors/Errors";
import type { ApiResponse } from "@/type/CommonType";

export const fetchCreateWishlist = async (
  token: string | null,
  prodcutId: number,
): Promise<ApiResponse<null>> => {
  const formData = new FormData();
  formData.append("productId", prodcutId.toString());

  const response = await fetch(`http://localhost:8080/wishlist/create`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
    },
    body: formData,
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

export const fetchDeleteWishlist = async (
  token: string | null,
  wishlistId: number,
): Promise<ApiResponse<null>> => {
  const response = await fetch(
    `http://localhost:8080/wishlist/delete/${wishlistId}`,
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
};
