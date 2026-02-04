// src/pages/.../MyPageApi.ts
import { ApiError } from "@/errors/Errors";
import type { ApiResponse } from "../../type/CommonType";
import type {
  BidListDto,
  ProductListDto,
  Status,
  UserDto,
  UserUpdateDto,
} from "./MyPageDto";

const BASE =
  (import.meta.env.VITE_API_BASE as string | undefined) ??
  "http://localhost:8080";

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
    throw new Error(
      text
        ? `${fallback} (${response.status}) ${text}`
        : `${fallback} (${response.status})`,
    );
  }
}

/** 내 정보 조회 */
export const fetchLoginUser = async (
  token: string | null,
): Promise<ApiResponse<UserDto>> => {
  const response = await fetch(`${BASE}/user/detail`, {
    method: "GET",
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  });

  if (!response.ok) {
    if (response.status === 401 || response.status === 403)
      throw new Error("AUTH_REQUIRED");
    await throwApiError(response, "내 정보 조회 실패");
  }

  return response.json();
};

/** 내 판매글/경매글 목록 */
export type MyProductsQuery = {
  page?: number;
  size?: number;
  search?: string; // q 같은 이름으로 쓰고싶으면 프론트에서만 바꿔도 됨
  statuses?: string[]; // ["READY","PROCESSING"...]
  sortBy?: string; // "NEWEST" | "ENDING_SOON" | "MOST_BIDS" | "HIGHEST_BID"
};

export async function fetchProductsByUser(
  token: string,
  query: MyProductsQuery = {},
) {
  const params = new URLSearchParams();

  params.set("page", String(query.page ?? 0));
  params.set("size", String(query.size ?? 10));

  if (query.search && query.search.trim().length > 0) {
    params.set("search", query.search.trim());
  }

  if (query.sortBy) {
    params.set("sortBy", query.sortBy);
  }

  if (query.statuses && query.statuses.length > 0) {
    query.statuses.forEach((s) => params.append("statuses", s));
  }

  const url = `${BASE}/product/myPageProductUser?${params.toString()}`;

  const response = await fetch(url, {
    method: "GET",
    headers: {
      Authorization: token.startsWith("Bearer ") ? token : `Bearer ${token}`,
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
}

/** 내 입찰 목록 */
export const fetchBidsByUser = async (
  token: string | null,
  page: number = 0,
  size: number = 10,
  status: Status | null,
): Promise<
  ApiResponse<{
    content: BidListDto[];
    totalElements: number;
    totalPages: number;
    currentPage: number;
    status: Status;
    size: number;
  }>
> => {
  const response = await fetch(
    `${BASE}/bid/allByUser?page=${page}&size=${size}&status=${status}`,
    {
      method: "GET",

      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
    },
  );

  if (!response.ok) {
    if (response.status === 401 || response.status === 403)
      throw new Error("AUTH_REQUIRED");
    await throwApiError(response, "입찰 조회 실패");
  }

  return response.json();
};

/** 내 찜 목록 */
// MyPageApi.ts
export const fetchProductsByWishlist = async (
  token: string | null,
  page = 0,
  size = 10,
) => {
  const response = await fetch(
    `${BASE}/wishlist/products?page=${page}&size=${size}`,
    {
      method: "GET",
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    },
  );

  if (!response.ok) {
    if (response.status === 401 || response.status === 403)
      throw new Error("AUTH_REQUIRED");
    await throwApiError(response, "찜 목록 조회 실패");
  }

  return response.json();
};

export async function deleteWishlist(token: string, wishlistId: number) {
  const res = await fetch(
    `${import.meta.env.VITE_API_BASE}/wishlist/delete/${wishlistId}`,
    {
      method: "DELETE",
      headers: {
        Authorization: `Bearer ${token}`,
      },
    },
  );
  const data = await res.json().catch(() => null);
  if (!res.ok) {
    const msg = data?.message ?? "찜 해제 실패";
    throw new Error(msg);
  }
  return data;
}

export const updateMyProfileBasic = async (
  token: string | null,
  payload: { name?: string; address?: string; phone?: string },
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
    if (response.status === 401 || response.status === 403)
      throw new Error("AUTH_REQUIRED");
    await throwApiError(response, "기본정보 수정 실패");
  }

  return response.json();
};

/** 닉네임 수정  */
export const updateMyNickname = async (
  token: string | null,
  nickname: string,
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
    if (response.status === 401 || response.status === 403)
      throw new Error("AUTH_REQUIRED");
    await throwApiError(response, "닉네임 수정 실패");
  }

  return response.json();
};

/* 프로필 이미지 업로드 */
export const uploadMyProfileImage = async (
  token: string | null,
  file: File,
): Promise<ApiResponse<{ url: string }>> => {
  const fd = new FormData();
  fd.append("file", file);

  const response = await fetch(`${BASE}/user/image`, {
    method: "POST",
    headers: token ? { Authorization: `Bearer ${token}` } : {},
    body: fd,
  });

  if (!response.ok) {
    if (response.status === 401 || response.status === 403)
      throw new Error("AUTH_REQUIRED");
    await throwApiError(response, "프로필 이미지 업로드 실패");
  }

  return response.json();
};

/* 프로필 이미지 삭제 */
export const deleteMyProfileImage = async (
  token: string | null,
): Promise<ApiResponse<null>> => {
  const response = await fetch(`${BASE}/user/image/delete`, {
    method: "DELETE",
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  });

  if (!response.ok) {
    if (response.status === 401 || response.status === 403)
      throw new Error("AUTH_REQUIRED");
    await throwApiError(response, "프로필 이미지 삭제 실패");
  }

  return response.json();
};

export const fetchUpdateUser = async (
  token: string | null,
  userUpdateDto: UserUpdateDto,
): Promise<ApiResponse<null>> => {
  const formData = new FormData();

  formData.append("name", userUpdateDto.name);
  formData.append("nickname", userUpdateDto.nickname);
  formData.append("phone", userUpdateDto.phone);
  formData.append("address", userUpdateDto.address);
  formData.append("gender", userUpdateDto.gender);
  formData.append("birthday", userUpdateDto.birthday);

  const response = await fetch(`http://localhost:8080/user/update`, {
    method: "PUT",
    headers: {
      Authorization: `Bearer ${token}`,
    },
    body: formData,
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch UserUpdate: ${response.status}`);
  }

  return response.json();
};

export const fetchUploadORReplaceImage = async (
  token: string | null,
  file: File | null,
): Promise<ApiResponse<{ url: string }>> => {
  // 반환 타입 수정
  // file이 null인 경우 처리
  if (!file) {
    throw new Error("File is required");
  }

  const formData = new FormData();
  formData.append("file", file);

  const response = await fetch(`http://localhost:8080/user/image`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      // Content-Type은 자동으로 설정되므로 명시하지 않음
    },
    body: formData,
  });

  if (!response.ok) {
    throw new Error(`Failed to upload image: ${response.status}`);
  }

  return response.json();
};

export const fetchDeleteImage = async (
  token: string | null,
): Promise<ApiResponse<null>> => {
  const response = await fetch(`http://localhost:8080/user/image/delete`, {
    method: "DELETE",
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    throw new Error(`Failed to delete image: ${response.status}`);
  }

  return response.json();
};
