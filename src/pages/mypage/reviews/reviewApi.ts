import type { ApiResponse } from "@/type/CommonType";
import type {
CanWriteReviewDto,
PendingReviewRowDto,
ReviewCreateReq,
ReviewDetailDto,
ReviewListDto,
ReviewSellerSummaryDto,
SpringPage
} from "./reviewTypes";

const BASE = (import.meta.env.VITE_API_BASE as string | undefined) ?? "http://localhost:8080";

async function throwApiError(response: Response, fallback: string) {
    const text = await response.text().catch(() => "");
    try {
        const json = text ? JSON.parse(text) : null;
        const code = json?.code ?? json?.errorCode ?? json?.result?.code;
        const msg = json?.message ?? json?.msg ?? json?.error ?? json?.result?.message ?? fallback;
        if (code) throw new Error(`[${code}] ${msg}`);
        throw new Error(msg);
    } catch {
        throw new Error(text ? `${fallback} (${response.status}) ${text}` : `${fallback} (${response.status})`);
    }
}

function authHeader(token: string) {
    return {
        Authorization: token.startsWith("Bearer ") ? token : `Bearer ${token}`,
    };
}

/** 작성 가능 여부 */
export async function fetchCanWriteReview(
    token: string,
    productId: number
): Promise<CanWriteReviewDto> {
    const res = await fetch(`${BASE}/review/can-write/${productId}`, {
        method: "GET",
        headers: authHeader(token),
    });
    if (!res.ok) {
        if (res.status === 401 || res.status === 403) throw new Error("AUTH_REQUIRED");
        await throwApiError(res, "리뷰 작성 가능 여부 조회 실패");
    }
    return res.json();
}

/** 리뷰 생성 (multipart) */
export async function createReview(
    token: string,
    req: ReviewCreateReq,
    files: File[] = []
): Promise<ReviewDetailDto> {
    const fd = new FormData();
    fd.append("req", new Blob([JSON.stringify(req)], { type: "application/json" }));
    for (const f of files) fd.append("files", f);

    const res = await fetch(`${BASE}/review/create`, {
        method: "POST",
        headers: authHeader(token),
        body: fd,
    });

    if (!res.ok) {
        if (res.status === 401 || res.status === 403) throw new Error("AUTH_REQUIRED");
        await throwApiError(res, "리뷰 생성 실패");
    }
    return res.json();
}


/** 공개 프로필 요약 */
export async function fetchSellerReviewSummary(token: string, sellerId: number) {
    const res = await fetch(`${BASE}/review/seller/${sellerId}/summary`, {
        method: "GET",
        headers: authHeader(token),
    });
    if (!res.ok) {
        if (res.status === 401 || res.status === 403) throw new Error("AUTH_REQUIRED");
        await throwApiError(res, "판매자 리뷰 요약 조회 실패");
    }
    return (await res.json()) as ApiResponse<ReviewSellerSummaryDto>;
}

/** 공개 프로필 받은 리뷰 목록 */
export async function fetchSellerReviews(token: string, sellerId: number, page = 0, size = 10) {
    const url = `${BASE}/review/seller/${sellerId}?page=${page}&size=${size}`;
    const res = await fetch(url, {
        method: "GET",
        headers: authHeader(token),
    });
    if (!res.ok) {
        if (res.status === 401 || res.status === 403) throw new Error("AUTH_REQUIRED");
        await throwApiError(res, "판매자 리뷰 목록 조회 실패");
    }
    return (await res.json()) as ApiResponse<SpringPage<ReviewListDto>> | SpringPage<ReviewListDto>;
}

/** 마이페이지: 내가 작성한 리뷰  0*/
export async function fetchMyReviews(token: string, page = 0, size = 10) {
    const url = `${BASE}/review/me?page=${page}&size=${size}`;
    const res = await fetch(url, {
        method: "GET",
        headers: authHeader(token),
    });
    if (!res.ok) {
        if (res.status === 401 || res.status === 403) throw new Error("AUTH_REQUIRED");
        await throwApiError(res, "내 리뷰 조회 실패");
    }
    return (await res.json()) as ApiResponse<SpringPage<ReviewListDto>> | SpringPage<ReviewListDto>;
}

/** 마이페이지 : 안 쓴 리뷰(낙찰 후 미작성) 0*/
export async function fetchMyPendingReviews(token: string, page = 0, size = 10) {
    const url = `${BASE}/review/me/pending?page=${page}&size=${size}`;
    const res = await fetch(url, {
        method: "GET",
        headers: authHeader(token),
    });
    if (!res.ok) {
        if (res.status === 401 || res.status === 403) throw new Error("AUTH_REQUIRED");
        await throwApiError(res, "미작성 리뷰 목록 조회 실패");
    }
    return (await res.json()) as ApiResponse<SpringPage<PendingReviewRowDto>> | SpringPage<PendingReviewRowDto>;
}