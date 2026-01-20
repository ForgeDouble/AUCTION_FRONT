// login/loginApi.ts
import type { ApiResponse } from "../../type/CommonType";
import type { loginRequest, loginResponse } from "./LoginDto";

export const fetchLogin = async (
  loginDto: loginRequest
): Promise<ApiResponse<loginResponse>> => {
  const response = await fetch(`http://localhost:8080/user/login`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(loginDto),
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch login: ${response.status}`);
  }

  return response.json();
};
