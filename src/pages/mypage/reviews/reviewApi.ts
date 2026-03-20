// pages/mypage/reviews/reviewApi.ts
import type { ApiResponse } from "@/type/CommonType";
import type {
  CanWriteReviewDto,
  PendingReviewRowDto,
  ReviewCreateReq,
  ReviewDetailDto,
  ReviewListDto,
  ReviewSellerSummaryDto,
  SpringPage,
} from "./reviewTypes";
import { ApiError, UnauthorizedError } from "@/errors/Errors";

const BASE =
  (import.meta.env.VITE_API_BASE as string | undefined) ??
  "http://localhost:8080";

async function throwApiError(res: Response, fallback: string): Promise<never> {
  const text = await res.text().catch(() => "");
  let json: any = null;

  try {
    json = text ? JSON.parse(text) : null;
  } catch {
    json = null;
  }

  const code =
    json?.statusCode ??
    json?.errorCode ??
    json?.code ??
    json?.result?.statusCode ??
    json?.result?.errorCode;

  const message =
    json?.errorMessage ??
    json?.message ??
    json?.msg ??
    json?.error ??
    json?.result?.errorMessage ??
    json?.result?.message ??
    fallback;

  const additionalInfo =
    json?.additionalInfo ?? json?.result?.additionalInfo ?? undefined;

  if (res.status === 401) {
    throw new UnauthorizedError(additionalInfo);
  }

  const finalCode = (code ? String(code) : "INTERNAL_SERVER_ERROR") as any;
  const finalMessage = String(message || fallback);

  throw new ApiError(res.status, finalCode, finalMessage, additionalInfo);
}

function authHeader(token: string) {
  return {
    Authorization: token.startsWith("Bearer ") ? token : `Bearer ${token}`,
    Accept: "application/json",
  };
}

/** 작성 가능 여부 */
export async function fetchCanWriteReview(
  token: string,
  productId: number,
): Promise<CanWriteReviewDto> {
  const res = await fetch(`${BASE}/review/can-write/${productId}`, {
    method: "GET",
    headers: authHeader(token),
  });
  if (!res.ok) {
    await throwApiError(res, "리뷰 작성 가능 여부 조회 실패");
  }
  return res.json();
}

/** 리뷰 생성 (multipart) */
export async function createReview(
  token: string,
  req: ReviewCreateReq,
  files: File[] = [],
): Promise<ReviewDetailDto> {
  const fd = new FormData();
  fd.append(
    "req",
    new Blob([JSON.stringify(req)], { type: "application/json" }),
  );
  for (const f of files) fd.append("files", f);

  const res = await fetch(`${BASE}/review/create`, {
    method: "POST",
    headers: {
      ...authHeader(token),
      Accept: "application/json",
    },
    body: fd,
  });

  if (!res.ok) {
    await throwApiError(res, "리뷰 생성 실패");
  }
  return res.json();
}

/** 공개 프로필 요약 */
export async function fetchSellerReviewSummary(
  token: string,
  sellerId: number,
): Promise<ReviewSellerSummaryDto> {
  const res = await fetch(`${BASE}/review/seller/${sellerId}/summary`, {
    method: "GET",
    headers: authHeader(token),
  });

  if (!res.ok) {
    if (res.status === 401 || res.status === 403)
      throw new Error("AUTH_REQUIRED");
    await throwApiError(res, "판매자 리뷰 요약 조회 실패");
  }

  return (await res.json()) as ReviewSellerSummaryDto;
}

/** 공개 프로필 받은 리뷰 목록 */
export async function fetchSellerReviews(
  token: string,
  sellerId: number,
  page = 0,
  size = 10,
) {
  const url = `${BASE}/review/seller/${sellerId}?page=${page}&size=${size}`;
  const res = await fetch(url, {
    method: "GET",
    headers: authHeader(token),
  });
  if (!res.ok) {
    await throwApiError(res, "판매자 리뷰 목록 조회 실패");
  }

  return (await res.json()) as
    | ApiResponse<SpringPage<ReviewListDto>>
    | SpringPage<ReviewListDto>;
}

/** 마이페이지: 내가 작성한 리뷰  */
export async function fetchMyReviews(token: string, page = 0, size = 10) {
  const url = `${BASE}/review/me?page=${page}&size=${size}`;
  const res = await fetch(url, {
    method: "GET",
    headers: authHeader(token),
  });
  if (!res.ok) {
    await throwApiError(res, "내 리뷰 조회 실패");
  }

  return (await res.json()) as
    | ApiResponse<SpringPage<ReviewListDto>>
    | SpringPage<ReviewListDto>;
}

/** 마이페이지 : 안 쓴 리뷰(낙찰 후 미작성) */
export async function fetchMyPendingReviews(
  token: string,
  page = 0,
  size = 10,
) {
  const url = `${BASE}/review/me/pending?page=${page}&size=${size}`;
  const res = await fetch(url, {
    method: "GET",
    headers: authHeader(token),
  });
  if (!res.ok) {
    await throwApiError(res, "미작성 리뷰 목록 조회 실패");
  }

  return (await res.json()) as
    | ApiResponse<SpringPage<PendingReviewRowDto>>
    | SpringPage<PendingReviewRowDto>;
}

/** 리뷰 상세 */
export async function fetchReviewDetail(
  token: string,
  reviewId: number,
  signal?: AbortSignal,
) {
  const res = await fetch(`${BASE}/review/${reviewId}`, {
    method: "GET",
    headers: authHeader(token),
    signal,
  });

  if (!res.ok) {
    await throwApiError(res, "리뷰 상세 조회 실패");
  }

  return await res.json();
}
