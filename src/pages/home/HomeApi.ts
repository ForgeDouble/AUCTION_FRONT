import type { ApiResponse } from "@/type/CommonType";
import type { ParentCategoriesDto, Top3ProductDto } from "./HomeDto";
import { ApiError } from "@/errors/Errors";

const BASE =
  (import.meta.env.VITE_API_BASE as string | undefined) ??
  "http://localhost:8080";

export const fetchTop3Products = async (): Promise<
  ApiResponse<Top3ProductDto[]>
> => {
  const response = await fetch(`${BASE}/product/top3`, {
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
  const response = await fetch(`${BASE}/category/with_count`, {
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
