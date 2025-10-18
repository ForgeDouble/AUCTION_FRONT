import type { ApiResponse } from "../type/CommonType";

export const fetchLoginEmail = async (): Promise<ApiResponse<string>> => {
  const response = await fetch(`http://localhost:8080/user/verify-token`, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
    },
    credentials: "include", // 필요하면 쿠키 포함
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch bids: ${response.status}`);
  }

  return response.json();
};
