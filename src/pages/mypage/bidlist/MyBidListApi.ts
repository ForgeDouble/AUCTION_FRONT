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
  status: Status | null,
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
  const response = await fetch(
    `${BASE}/bid/allByUser?page=${page}&size=${size}&status=${status}`,
    {
      method: "GET",

      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
    },
  );

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
