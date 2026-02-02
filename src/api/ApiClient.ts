import { ApiError, UnauthorizedError } from "../errors/Errors";

export async function apiFetch<T>(
  input: RequestInfo,
  init?: RequestInit,
): Promise<T> {
  const res = await fetch(input, init);

  if (!res.ok) {
    const body = await res.json();

    if (res.status === 401) {
      throw new UnauthorizedError();
    }

    throw new ApiError(res.status, body.code, body.message);
  }

  return res.json();
}
