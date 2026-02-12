/** 마이페이지 유저프로필 */
export interface UserProfile {
  name: string;
  email: string;
  phone: string;
  address: string;
  joinDate: string;
}

/** 마이페이지 성별 */
export type Gender = "M" | "W";

/** 마이페이지 유저 조회 dto */
export interface UserDto {
  userId: number;
  name: string;
  nickname: string;
  email: string;
  phone: string;
  address: string;
  birthday: string;
  gender: Gender;
  profileImageUrl: string | null;
  warning: number;
  createdAt: string;
}

/** 마이페이지 유저 업데이트 dto */
export interface UserUpdateDto {
  name: string;
  nickname: string;
  phone: string;
  address: string;
  birthday: string;
  gender: Gender;
}

/** 상품 관리 상태 */
export type Status = "READY" | "PROCESSING" | "NOTSELLED" | "SELLED";

export interface ProductListDto {
  productId: number;
  productName: string;
  productContent: string;
  previewImageUrl?: string;
  latestBidAmount: number;
  bidCount: number;
  status: Status;
  auctionEndTime?: string;
}

/** 입찰 데이터 */
export type IsWinned = "Y" | "N";

export interface BidListDto {
  bidId: number;
  productId: number;
  productName: string;
  bidAmount: number;
  bidCreatedAt: string;
  imgId: number;
  imgUrl: string;
  imgPosition: number;
  isWinned: IsWinned;
  status: Status;
  productCreatedAt: string;
}

/** 페이징 */
export interface PageInfo {
  totalElements: number;
  totalPages: number;
  currentPage: number;
  size: number;
}

/** 내 판매글/경매글 목록 */
export type MyProductsQuery = {
  page?: number;
  size?: number;
  search?: string; // q 같은 이름으로 쓰고싶으면 프론트에서만 바꿔도 됨
  statuses?: string[]; // ["READY","PROCESSING"...]
  sortBy?: string; // "NEWEST" | "ENDING_SOON" | "MOST_BIDS" | "HIGHEST_BID"
};
