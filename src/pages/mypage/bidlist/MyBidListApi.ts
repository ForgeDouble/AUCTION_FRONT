import type { ApiResponse } from "@/type/CommonType";
import type { BidListDto, Status } from "../MyPageDto";
import { ApiError, UnauthorizedError } from "@/errors/Errors";

const BASE =
  (import.meta.env.VITE_API_BASE as string | undefined) ??
  "http://localhost:8080";

/** 내 입찰 목록 조회*/
export const fetchBidsByUser = async (
  token: string | null,
  page: number = 0,
  size: number = 10,
  statuses: Status[] | null,
  isWinned: "Y" | "N" | null = null,
): Promise<
  ApiResponse<{
    content: BidListDto[];
    totalElements: number;
    totalPages: number;
    currentPage: number;
    status: Status;
    size: number;
  }>
> => {
  const params = new URLSearchParams({
    page: page.toString(),
    size: size.toString(),
  });

  if (statuses && statuses.length > 0) {
    statuses.forEach((s) => params.append("statuses", s)); // 여러 개 append
  }
  if (isWinned) params.append("isWinned", isWinned);
  const response = await fetch(`${BASE}/bid/allByUser?${params}`, {
    method: "GET",

    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
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
};
