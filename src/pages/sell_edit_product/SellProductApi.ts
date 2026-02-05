import type { ApiResponse } from "@/api/registerapi";
import type {
  ParentCategoriesDto,
  ProductCreateDto,
  ProductReadUpdateDto,
} from "./SellProductDto";

export const fetchCreateProduct = async (
  productData: ProductCreateDto,
  files: File[],
  token: string | null,
): Promise<ApiResponse<null>> => {
  const formData = new FormData();

  // ProductCreateDto 필드들을 FormData에 추가
  formData.append("categoryId", productData.categoryId.toString());
  formData.append("productName", productData.productName);
  formData.append("productContent", productData.productContent);
  formData.append("price", productData.price.toString());
  formData.append("status", productData.status);

  // 파일들을 FormData에 추가
  files.forEach((file) => {
    formData.append("files", file);
  });

  const response = await fetch(`http://localhost:8080/product/create`, {
    method: "POST",
    headers: {
      // Content-Type을 설정하지 않음 (브라우저가 자동으로 multipart/form-data 설정)
      // 인증이 필요한 경우 Authorization 헤더 추가
      Authorization: `Bearer ${token}`,
    },
    body: formData,
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch product: ${response.status}`);
  }

  return await response.json();
};

export const fetchParentCategories = async (): Promise<
  ApiResponse<ParentCategoriesDto[]>
> => {
  const response = await fetch(`http://localhost:8080/category/with_children`, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
    },
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch categories: ${response.status}`);
  }

  return response.json();
};

export const fetchProductByProductId = async (
  productId: number | null,
  token: string | null,
): Promise<ApiResponse<ProductReadUpdateDto>> => {
  const response = await fetch(
    `http://localhost:8080/product/update/${productId}`,
    {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
    },
  );

  if (!response.ok) {
    throw new Error(`Failed to fetch categories: ${response.status}`);
  }

  return response.json();
};
