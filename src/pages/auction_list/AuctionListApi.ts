import type { ApiResponse } from "../../type/CommonType";
import type {
  ParentCategoriesDto,
  ProductListDto,
  wishlistDto,
} from "./AuctionListDto";

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

export const fetchParentCategories = async (): Promise<
  ApiResponse<ParentCategoriesDto[]>
> => {
  const response = await fetch(
    `http://localhost:8080/category/parent_category`,
    {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
      credentials: "include", // 필요하면 쿠키 포함
    }
  );

  if (!response.ok) {
    throw new Error(`Failed to fetch bids: ${response.status}`);
  }

  return response.json();
};

export const fetchCreateWishlist = async (
  token: string | null,
  prodcutId: number
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
    throw new Error(`Failed to fetch bids: ${response.status}`);
  }

  return response.json();
};

export const fetchDeleteWishlist = async (
  token: string | null,
  wishlistId: number
): Promise<ApiResponse<null>> => {
  const response = await fetch(
    `http://localhost:8080/wishlist/delete/${wishlistId}`,
    {
      method: "DELETE",
      headers: {
        Authorization: `Bearer ${token}`,
      },
    }
  );

  if (!response.ok) {
    throw new Error(`Failed to fetch bids: ${response.status}`);
  }

  return response.json();
};

export const fetchWishlistByUser = async (
  token: string | null
): Promise<ApiResponse<wishlistDto[]>> => {
  const response = await fetch(`http://localhost:8080/wishlist/allByUser`, {
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
