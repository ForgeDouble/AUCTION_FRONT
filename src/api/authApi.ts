import { ApiError, UnauthorizedError } from "@/errors/Errors";
import type { ApiResponse, UserTokenDto } from "../type/CommonType";

const BASE = import.meta.env.VITE_API_BASE

export const fetchLoginEmail = async (
  token: string,
): Promise<ApiResponse<UserTokenDto>> => {
  const response = await fetch(`${BASE}/user/verify-token`, {
    method: "GET",
    headers: {
      Authorization: `Bearer ${token}`,
      // "Content-Type": "application/json",
    },
    // credentials: "include", // 필요하면 쿠키 포함
  });

  if (!response.ok) {
    const body = await response.json();

    if (response.status === 401) {
      throw new UnauthorizedError();
    }

    throw new ApiError(
      response.status,
      body.statusCode,
      body.errorMessage,
      body.additionalInfo,
    );
  }

  return response.json();
};
