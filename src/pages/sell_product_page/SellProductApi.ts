import type { ApiResponse } from "@/api/registerapi";
import type { ProductCreateDto } from "./SellProductDto";

export const fetchCreateProduct = async (
  productData: ProductCreateDto,
  files: File[],
  token: string | null
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
    // credentials: 'include', // 쿠키 기반 인증을 사용하는 경우
    body: formData,
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch products: ${response.status}`);
  }

  return await response.json();
};
