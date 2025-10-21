import type { ApiResponse } from "../../type/CommonType";
import type { UserDto } from "./MyPageDto";

export const fetchLoginUser = async (
  token: string
): Promise<ApiResponse<UserDto>> => {
  const response = await fetch(`http://localhost:8080/user/detail`, {
    method: "GET",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch bids: ${response.status}`);
  }

  return response.json();
};
