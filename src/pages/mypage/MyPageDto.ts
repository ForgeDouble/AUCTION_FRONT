export interface UserProfile {
  name: string;
  email: string;
  phone: string;
  address: string;
  joinDate: string;
}

export type Gender = "M" | "W";

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

export interface UserUpdateDto {
  name: string;
  nickname: string;
  phone: string;
  address: string;
  birthday: string;
  gender: Gender;
}

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

export interface PageInfo {
  totalElements: number;
  totalPages: number;
  currentPage: number;
  size: number;
}
