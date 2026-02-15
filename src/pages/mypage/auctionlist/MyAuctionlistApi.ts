import { ApiError, UnauthorizedError } from "@/errors/Errors";
import type { MyProductsQuery } from "../MyPageDto";

const BASE =
  (import.meta.env.VITE_API_BASE as string | undefined) ??
  "http://localhost:8080";

export async function fetchProductsByUser(
  token: string,
  query: MyProductsQuery = {},
) {
  const params = new URLSearchParams();

  params.set("page", String(query.page ?? 0));
  params.set("size", String(query.size ?? 10));

  if (query.search && query.search.trim().length > 0) {
    params.set("search", query.search.trim());
  }

  if (query.sortBy) {
    params.set("sortBy", query.sortBy);
  }

  if (query.statuses && query.statuses.length > 0) {
    query.statuses.forEach((s) => params.append("statuses", s));
  }

  const url = `${BASE}/product/myPageProductUser?${params.toString()}`;

  const response = await fetch(url, {
    method: "GET",
    headers: {
      Authorization: token.startsWith("Bearer ") ? token : `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    const body = await response.json();
    if (response.status === 401) throw new UnauthorizedError();
    throw new ApiError(
      response.status,
      body.statusCode,
      body.errorMessage,
      body.additionalInfo,
    );
  }

  return response.json();
}
