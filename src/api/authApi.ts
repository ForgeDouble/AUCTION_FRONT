// api/authApi.ts
import type { ApiResponse, UserTokenDto } from "../type/CommonType";

export const fetchLoginEmail = async (
  token: string,
): Promise<ApiResponse<UserTokenDto>> => {
  const response = await fetch(`http://localhost:8080/user/verify-token`, {
    method: "GET",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    credentials: "include", // 필요하면 쿠키 포함
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch bids: ${response.status}`);
  }

  return response.json();
};
