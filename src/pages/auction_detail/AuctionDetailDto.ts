export interface BidLogDto {
  userId: number;
  userName: string;
  productId: number;
  bidAmount: number;
  createdAt: string;
  isWinned: string;
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
}
