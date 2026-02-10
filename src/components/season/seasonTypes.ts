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