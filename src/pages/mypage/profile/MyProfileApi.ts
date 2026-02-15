import { ApiError, UnauthorizedError } from "@/errors/Errors";
import type { ApiResponse } from "@/type/CommonType";
import type { UserDto } from "./MyProfileDto";

const BASE =
  (import.meta.env.VITE_API_BASE as string | undefined) ??
  "http://localhost:8080";

/** 내 정보 조회 */
export const fetchLoginUser = async (
  token: string | null,
): Promise<ApiResponse<UserDto>> => {
  const response = await fetch(`${BASE}/user/detail`, {
    method: "GET",
    headers: token ? { Authorization: `Bearer ${token}` } : {},
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

/** 내 정보 수정(닉네임 제외) */
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

/* 프로필 이미지 삭제 */
export const deleteMyProfileImage = async (
  token: string | null,
): Promise<ApiResponse<null>> => {
  const response = await fetch(`${BASE}/user/image/delete`, {
    method: "DELETE",
    headers: token ? { Authorization: `Bearer ${token}` } : {},
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
