import type { ApiResponse } from "@/api/registerapi";

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
    throw new Error(`Failed to fetch findPassword: ${response.status}`);
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
    throw new Error(`Failed to fetch resetPassword: ${response.status}`);
  }

  return response.json();
};
