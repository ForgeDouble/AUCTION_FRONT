import { ApiError } from "@/errors/Errors";
import type { ApiResponse } from "../../type/CommonType";
import type { loginRequest, loginResponse } from "./LoginDto";

export const fetchLogin = async (
  loginDto: loginRequest,
): Promise<ApiResponse<loginResponse>> => {
  const response = await fetch(`http://localhost:8080/user/login`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(loginDto),
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
