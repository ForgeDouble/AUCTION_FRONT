const BASE =
  (import.meta.env.VITE_API_BASE as string | undefined) ??
  "http://localhost:8080";

async function throwApiError(response: Response, fallback: string) {
  const text = await response.text().catch(() => "");
  try {
    const json = text ? JSON.parse(text) : null;
    const code = json?.code ?? json?.errorCode ?? json?.result?.code;
    const msg =
      json?.message ??
      json?.msg ??
      json?.error ??
      json?.result?.message ??
      fallback;

    if (code) throw new Error(`[${code}] ${msg}`);
    throw new Error(msg);
  } catch {
    throw new Error(
      text
        ? `${fallback} (${response.status}) ${text}`
        : `${fallback} (${response.status})`,
    );
  }
}

/** 내 찜 목록 */
// MyPageApi.ts
export const fetchProductsByWishlist = async (
  token: string | null,
  page = 0,
  size = 10,
) => {
  const response = await fetch(
    `${BASE}/wishlist/products?page=${page}&size=${size}`,
    {
      method: "GET",
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    },
  );

  if (!response.ok) {
    if (response.status === 401 || response.status === 403)
      throw new Error("AUTH_REQUIRED");
    await throwApiError(response, "찜 목록 조회 실패");
  }

  return response.json();
};

export async function deleteWishlist(token: string, wishlistId: number) {
  const res = await fetch(
    `${import.meta.env.VITE_API_BASE}/wishlist/delete/${wishlistId}`,
    {
      method: "DELETE",
      headers: {
        Authorization: `Bearer ${token}`,
      },
    },
  );
  const data = await res.json().catch(() => null);
  if (!res.ok) {
    const msg = data?.message ?? "찜 해제 실패";
    throw new Error(msg);
  }
  return data;
}
