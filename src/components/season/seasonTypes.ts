// src/components/season/seasonType.ts
import type { ErrorCode } from "@/errors/ErrorDto";

export type SeasonUserAwardsDto = {
    ym: string | null;
    titles: Array<{
        titleType: string;
        titleLabel: string;
        rank: number;
        metricLong: number | null;
        metricDouble: number | null;
    }>;
    badges: Array<{
        badgeType: string;
        badgeLabel: string;
        rank: number;
        tagCount: number;
        totalReviews: number;
        ratio: number;
    }>;
};

export type CommonErrorBody = {
    statusCode?: ErrorCode | string;
    errorMessage?: string;
    additionalInfo?: string | null;
};