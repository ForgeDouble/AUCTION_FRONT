import type { ApiResponse } from "@/type/CommonType";
import type { ParentCategoriesDto, Top3ProductDto } from "./HomeDto";

export const fetchTop3Products = async (): Promise<
  ApiResponse<Top3ProductDto[]>
> => {
  const response = await fetch(`http://localhost:8080/product/top3`, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
    },
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch bids: ${response.status}`);
  }

  return response.json();
};

export const fetchParentCategories = async (): Promise<
  ApiResponse<ParentCategoriesDto[]>
> => {
  const response = await fetch(`http://localhost:8080/category/with_count`, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
    },
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch bids: ${response.status}`);
  }

  return response.json();
};
