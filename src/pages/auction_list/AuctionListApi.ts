import type { ApiResponse, PageResponse } from "../../type/CommonType";
import type {
  ParentCategoriesDto,
  ProductListDto,
  wishlistDto,
} from "./AuctionListDto";

export const fetchProducts = async (
  params: URLSearchParams
): Promise<ApiResponse<PageResponse<ProductListDto>>> => {
  const response = await fetch(
    `http://localhost:8080/product/all?${params.toString()}`,
    {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
    }
  );

  if (!response.ok) {
    throw new Error(`Failed to fetch products: ${response.status}`);
  }

  return response.json();
};

export const fetchParentCategories = async (): Promise<
  ApiResponse<ParentCategoriesDto[]>
> => {
  const response = await fetch(
    `http://localhost:8080/category/with_children_and_count`,
    {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
    }
  );

  if (!response.ok) {
    throw new Error(`Failed to fetch categories: ${response.status}`);
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
    throw new Error(`Failed to fetch wishlist: ${response.status}`);
  }
  return response.json();
};
