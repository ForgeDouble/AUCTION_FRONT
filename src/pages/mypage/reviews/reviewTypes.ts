// pages/mypage/reviews/reviewType.tsx
import type { Status } from "../MyPageDto";

export type ReviewTag =
| "SAME_AS_DESCRIPTION"
| "KIND_AND_CONSIDERATE"
| "RESPONDS_WELL"
| "DETAILED_INFO"
| "FAST_AFTER_WIN";

export const REVIEW_TAG_LABEL: Record<ReviewTag, string> = {
    SAME_AS_DESCRIPTION: "상품 설명과 실제 상품이 동일해요",
    KIND_AND_CONSIDERATE: "친절하고 배려가 넘쳐요",
    RESPONDS_WELL: "상품 문의에 대한 답변이 성실해요",
    DETAILED_INFO: "상품 정보가 자세히 적혀있어요",
    FAST_AFTER_WIN: "낙찰 후 빠른 조치가 이루어져요",
};

export type ReviewListDto = {
    reviewId: number;
    productId: number;
    productName: string;

    reviewerId: number;
    reviewerNick: string;
    reviewerProfileImageUrl: string | null;

    rating: number;
    tags: ReviewTag[];
    content: string | null;

    firstImageUrl: string | null;
    createdAt: string;
};

export type ReviewDetailDto = {
    reviewId: number;
    productId: number;
    productName: string;

    sellerId: number;
    sellerNick: string;

    reviewerId: number;
    reviewerNick: string;
    reviewerProfileImageUrl?: string | null;

    rating: number;
    tags: ReviewTag[];
    content?: string | null;

    images: Array<{ id: number; url: string; position: number }>;
    createdAt: string;
};

export type ReviewCreateReq = {
    productId: number;
    rating: number; // 0.0~5.0 (0.5 단위)
    tags: ReviewTag[];
    content?: string | null;
};

export type CanWriteReviewDto = {
canWrite: boolean;
reason: string;
};

export type ReviewSellerSummaryDto = {
    sellerId: number;
    reviewCount: number;
    avgRating: number;
    tagCounts: Record<string, number>;
};

export type PendingReviewRowDto = {
    productId: number;
    productName: string;

    sellerId: number | null;
    sellerNick: string | null;

    winnerBidAmount: number;
    auctionEndTime: string | null;
};

export type SpringPage<T> = {
    content: T[];
    number: number;
    size: number;
    totalElements: number;
    totalPages: number;
    first: boolean;
    last: boolean;
};

export function unwrap<T>(api: any): T {
    return (api?.result ?? api?.data ?? api?.body ?? api) as T;
}

export function formatKST(iso?: string | null) {
    if (!iso) return "";
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) return String(iso);
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, "0");
    const dd = String(d.getDate()).padStart(2, "0");
    const hh = String(d.getHours()).padStart(2, "0");
    const mi = String(d.getMinutes()).padStart(2, "0");
    return `${yyyy}-${mm}-${dd} ${hh}:${mi}`;
}