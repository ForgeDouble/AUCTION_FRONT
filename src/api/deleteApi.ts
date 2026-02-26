// src/api/deleteApi.ts
const API_BASE_URL = import.meta.env.VITE_API_BASE;

function getAccessToken() {
  return localStorage.getItem("accessToken");
}

export async function deleteUserAccount(userId: number): Promise<any> {
  const token = getAccessToken();
  const res = await fetch(`${API_BASE_URL}/user/delete`, {
    method: "POST",
    headers: {
      Authorization: token ? `Bearer ${token}` : "",
      "Content-Type": "application/json",
      Accept: "application/json",
    },
    body: JSON.stringify({ userId }),
  });

  const json = await res.json().catch(() => null);

  if (!res.ok) {
    const statusCode = json?.statusCode || json?.errorCode || "INTERNAL_SERVER_ERROR";
    const errorMessage = json?.errorMessage || json?.message || "요청 처리 중 오류가 발생했습니다.";
    const additionalInfo = json?.additionalInfo ?? null;

    const err: any = new Error(errorMessage);
    err.statusCode = statusCode;
    err.message = errorMessage;
    err.additionalInfo = additionalInfo;
    throw err;
  }

  return json;
}