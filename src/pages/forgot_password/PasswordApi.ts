import { ApiError } from "@/errors/Errors";
import type { ApiResponse } from "@/type/CommonType";

const BASE =
  (import.meta.env.VITE_API_BASE as string | undefined) ??
  "http://localhost:8080";

export const fetchForgotPassword = async (
  email: string,
): Promise<ApiResponse<null>> => {
  const formData = new FormData();
  formData.append("email", email);

  const response = await fetch(`${BASE}/auth/forgot_password`, {
    method: "POST",
    body: formData,
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

export const fetchResetPassword = async (
  token: string,
  newPassword: string,
): Promise<ApiResponse<null>> => {
  const formData = new FormData();
  formData.append("token", token);
  formData.append("newPassword", newPassword);

  const response = await fetch(`${BASE}/auth/reset_password`, {
    method: "POST",
    body: formData,
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

export const fetchValidateToken = async (
  token: string,
): Promise<ApiResponse<null>> => {
  const response = await fetch(`${BASE}/auth/validate_token?token=${token}`, {
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
