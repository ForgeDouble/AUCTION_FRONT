import type { ApiResponse } from "@/type/CommonType";
import type {
  ParentCategoriesDto,
  ProductCreateDto,
  ProductReadUpdateDto,
  ProductUpdateDto,
} from "./SellEditProductDto";
import { ApiError, UnauthorizedError } from "@/errors/Errors";

const BASE =
  (import.meta.env.VITE_API_BASE as string | undefined) ??
  "http://localhost:8080";

/** 물건 판매 등록 */
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

  const response = await fetch(`${BASE}/product/create`, {
    method: "POST",
    headers: {
      // Content-Type을 설정하지 않음 (브라우저가 자동으로 multipart/form-data 설정)
      // 인증이 필요한 경우 Authorization 헤더 추가
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

/** 카테고리 조회 */
export const fetchParentCategories = async (): Promise<
  ApiResponse<ParentCategoriesDto[]>
> => {
  const response = await fetch(`${BASE}/category/with_children`, {
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

/** 상품 조회 (수정시 기존 상품 조회) */
export const fetchProductByProductId = async (
  productId: number | null,
  token: string | null,
): Promise<ApiResponse<ProductReadUpdateDto>> => {
  const response = await fetch(`${BASE}/product/update/${productId}`, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
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

/** 상품 수정 */
export const fetchUpdateProduct = async (
  productData: ProductUpdateDto,
  addFiles: File[],
  deleteIds: number[],
  orderIds: number[],
  token: string,
) => {
  const formData = new FormData();

  formData.append("productId", productData.productId.toString());
  formData.append("productName", productData.productName);
  formData.append("productContent", productData.productContent);
  formData.append("price", productData.price.toString());
  if (productData.categoryId !== null) {
    formData.append("categoryId", productData.categoryId.toString());
  }

  // 새로 추가할 이미지 파일들 추가
  if (addFiles && addFiles.length > 0) {
    addFiles.forEach((file) => {
      formData.append("addFiles", file);
    });
  }

  // 삭제할 이미지 ID들 추가
  if (deleteIds && deleteIds.length > 0) {
    deleteIds.forEach((id) => {
      formData.append("deleteImageIds", id.toString());
    });
  }

  // 이미지 정렬 순서 추가
  if (orderIds && orderIds.length > 0) {
    orderIds.forEach((id) => {
      formData.append("orderImageIds", id.toString());
    });
  }

  const response = await fetch(`${BASE}/product/update`, {
    method: "PUT",
    headers: {
      Authorization: `Bearer ${token}`,
      // Content-Type은 자동으로 설정되므로 추가하지 않음
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
