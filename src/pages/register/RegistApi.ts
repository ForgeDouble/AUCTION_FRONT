import type { ApiResponse } from "@/type/CommonType";
import type { RegisterRequest } from "./RegisterDto";
import { ApiError } from "@/errors/Errors";

const BASE =
  (import.meta.env.VITE_API_BASE as string | undefined) ??
  "http://localhost:8080";

export async function registerUser(
  body: RegisterRequest,
): Promise<ApiResponse<null>> {
  const formData = new FormData();
  Object.entries(body).forEach(([k, v]) => {
    if (v !== undefined && v !== null) formData.append(k, String(v));
  });

  const response = await fetch(`${BASE}/user/register`, {
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
}
