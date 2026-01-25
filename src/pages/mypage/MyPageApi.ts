// src/pages/.../MyPageApi.ts
import type { ApiResponse } from "../../type/CommonType";
import type { BidListDto, ProductListDto, UserDto } from "./MyPageDto";

const BASE =
  (import.meta.env.VITE_API_BASE as string | undefined) ?? "http://localhost:8080";

async function throwApiError(response: Response, fallback: string) {
  const text = await response.text().catch(() => "");
  try {
    const json = text ? JSON.parse(text) : null;
    const code = json?.code ?? json?.errorCode ?? json?.result?.code;
    const msg =
      json?.message ??
      json?.msg ??
      json?.error ??
      json?.result?.message ??
      fallback;

    if (code) throw new Error(`[${code}] ${msg}`);
    throw new Error(msg);
  } catch {
    throw new Error(text ? `${fallback} (${response.status}) ${text}` : `${fallback} (${response.status})`);
  }
}

/** 내 정보 조회 */
export const fetchLoginUser = async (
  token: string | null
): Promise<ApiResponse<UserDto>> => {
  const response = await fetch(`${BASE}/user/detail`, {
    method: "GET",
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  });

  if (!response.ok) {
    if (response.status === 401 || response.status === 403) throw new Error("AUTH_REQUIRED");
    await throwApiError(response, "내 정보 조회 실패");
  }

  return response.json();
};

/** 내 판매글/경매글 목록 */
export const fetchProductsByUser = async (
  token: string | null,
  page: number = 0,
  size: number = 10
): Promise<
  ApiResponse<{
    content: ProductListDto[];
    totalElements: number;
    totalPages: number;
    currentPage: number;
    size: number;
  }>
> => {
  const response = await fetch(
    `${BASE}/product/allByUser?page=${page}&size=${size}`,
    {
      method: "GET",
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    }
  );

  if (!response.ok) {
    if (response.status === 401 || response.status === 403) throw new Error("AUTH_REQUIRED");
    await throwApiError(response, "상품 조회 실패");
  }

  return response.json();
};

/** 내 입찰 목록 */
export const fetchBidsByUser = async (
  token: string | null,
  page: number = 0,
  size: number = 10
): Promise<
  ApiResponse<{
    content: BidListDto[];
    totalElements: number;
    totalPages: number;
    currentPage: number;
    size: number;
  }>
> => {
  const response = await fetch(
    `${BASE}/bid/allByUser?page=${page}&size=${size}`,
    {
      method: "GET",
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    }
  );

  if (!response.ok) {
    if (response.status === 401 || response.status === 403) throw new Error("AUTH_REQUIRED");
    await throwApiError(response, "입찰 조회 실패");
  }

  return response.json();
};

/** 내 찜 목록 */
export const fetchProductsByWishlist = async (
  token: string | null,
  page: number = 0,
  size: number = 10
): Promise<
  ApiResponse<{
    content: ProductListDto[];
    totalElements: number;
    totalPages: number;
    currentPage: number;
    size: number;
  }>
> => {
  const response = await fetch(
    `${BASE}/product/allByWishlist?page=${page}&size=${size}`,
    {
      method: "GET",
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    }
  );

  if (!response.ok) {
    if (response.status === 401 || response.status === 403) throw new Error("AUTH_REQUIRED");
    await throwApiError(response, "찜 목록 조회 실패");
  }

  return response.json();
};


export const updateMyProfileBasic = async (
  token: string | null,
  payload: { name?: string; address?: string; phone?: string }
): Promise<ApiResponse<null>> => {
  const fd = new FormData();
  if (payload.name !== undefined) fd.append("name", payload.name);
  if (payload.address !== undefined) fd.append("address", payload.address);
  if (payload.phone !== undefined) fd.append("phone", payload.phone);

  const response = await fetch(`${BASE}/user/update`, {
    method: "PUT",
    headers: token ? { Authorization: `Bearer ${token}` } : {},
    body: fd,
  });

  if (!response.ok) {
    if (response.status === 401 || response.status === 403) throw new Error("AUTH_REQUIRED");
    await throwApiError(response, "기본정보 수정 실패");
  }

  return response.json();
};

/** 닉네임 수정  */
export const updateMyNickname = async (
  token: string | null,
  nickname: string
): Promise<ApiResponse<null>> => {
  const response = await fetch(`${BASE}/user/nickname`, {
    method: "PUT",
    headers: {
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ nickname }),
  });

  if (!response.ok) {
    if (response.status === 401 || response.status === 403) throw new Error("AUTH_REQUIRED");
    await throwApiError(response, "닉네임 수정 실패");
  }

  return response.json();
};

/** 프로필 이미지 업로드 - multipart
 *  절대 Content-Type을 직접 넣지 말 것
 */
export const uploadMyProfileImage = async (
  token: string | null,
  file: File
): Promise<ApiResponse<{ url: string }>> => {
  const fd = new FormData();
  fd.append("file", file);

  const response = await fetch(`${BASE}/user/image`, {
    method: "POST",
    headers: token ? { Authorization: `Bearer ${token}` } : {},
    body: fd,
  });

  if (!response.ok) {
    if (response.status === 401 || response.status === 403) throw new Error("AUTH_REQUIRED");
    await throwApiError(response, "프로필 이미지 업로드 실패");
  }

  return response.json();
};

/** 프로필 이미지 삭제 */
export const deleteMyProfileImage = async (
  token: string | null
): Promise<ApiResponse<null>> => {
  const response = await fetch(`${BASE}/user/image/delete`, {
    method: "DELETE",
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  });

  if (!response.ok) {
    if (response.status === 401 || response.status === 403) throw new Error("AUTH_REQUIRED");
    await throwApiError(response, "프로필 이미지 삭제 실패");
  }

  return response.json();
};
