import type { ApiResponse } from "@/type/CommonType";
import type { ParentCategoriesDto, Top3ProductDto } from "./HomeDto";
import { ApiError } from "@/errors/Errors";

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
