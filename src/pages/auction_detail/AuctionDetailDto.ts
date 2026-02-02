export interface BidLogDto {
  userId: number;
  userNickName: string;
  productId: number;
  bidAmount: number;
  createdAt: string;
  isWinned: string;
  createdAtDisplay?: string;
  profileImageUrl?: string | null
}

export interface ProductDto {
  productId: number;
  categoryId: number;
  productName: string;
  productContent: string;
  price: number;
  status: string;
  images: imageDto;
  auctionEndTime: string;
}

export type imageDto = {
  id: number;
  url: string;
  position: number;
};

export interface SellerDto {
  userId: number;
  nickname: string | null;
  profileImageUrl: string | null;
  createdAt: string;
  selledBidCount: number;
  email: string;
}

export interface BidResponse {
  success: boolean;
  message: string | null;
  data: string | null;
  errorCode: string;
  timestamp: number;
}
