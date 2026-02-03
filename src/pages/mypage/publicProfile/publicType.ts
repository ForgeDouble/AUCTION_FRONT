// src/pages/mypage/publicProfile/publicType.ts
export type ProfileUserDto = {
  userId: number;
  email?: string;
  name?: string;
  nickname?: string;
  profileImageUrl?: string | null;
  createdAt?: string;
};

export type ProfileCountsDto = {
  registered: number;
  selling: number;
  ended: number;
  traded: number;
};

export type ReviewRowDto = {
  reviewId: number;
  productId: number;
  productName: string;
  rating: number;
  content?: string | null;
  writerUserId: number;
  writerNickname: string;
  createdAt: string;
};

export type ReviewSummaryDto = {
  avgRating: number;
  totalCount: number;
};
