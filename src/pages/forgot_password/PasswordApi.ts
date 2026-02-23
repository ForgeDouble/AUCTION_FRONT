import type { ApiResponse } from "@/pages/register/RegisteApi";
import { ApiError } from "@/errors/Errors";

export const fetchForgotPassword = async (
  email: string,
): Promise<ApiResponse<null>> => {
  const formData = new FormData();
  formData.append("email", email);

  const response = await fetch(`http://localhost:8080/auth/forgot_password`, {
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

  const response = await fetch(`http://localhost:8080/auth/reset_password`, {
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
  const response = await fetch(
    `http://localhost:8080/auth/validate_token?token=${token}`,
    {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
    },
  );

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
