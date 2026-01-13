export interface UserProfile {
  name: string;
  email: string;
  phone: string;
  address: string;
  joinDate: string;
}

export interface UserDto {
  userId: number;
  name: string;
  nickname: string;
  email: string;
  phone: string;
  address: string;
  birthday: string;
  gender: string;
  profileImageUrl: string | null;
  warning: number;
  createdAt: string;
}

export interface ProductListDto {
  productId: number;
  productName: string;
  productContent: string;
  price: number;
  sellYN: string;
  previewImageUrl: string;
  latestBidAmount: number;
  bidCount: number;
}

export interface BidListDto {
  bidId: number;
  productId: number;
  productName: string;
  bidAmount: number;
  bidCreatedAt: string;
  isWinned: string;
  productCreatedAt: string;
}

export interface PageInfo {
  totalElements: number;
  totalPages: number;
  currentPage: number;
  size: number;
}
