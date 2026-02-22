import type { Status } from "../MyPageDto";

export interface ProductListDto {
  productId: number;
  productName: string;
  productContent: string;
  price: number;
  status: Status;
  previewImageUrl?: string;
  categoryId: number;
  path: categoryDto[];
  userEmail: string;
  latestBidAmount: number;
  bidCount: number;
  wishlistCount: number;
  createdAt: string;
  auctionStartTime?: string;
  auctionEndTime?: string;
  wishlistId: number;
}

type categoryDto = {
  categoryId: number;
  categoryName: string;
};
