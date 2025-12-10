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
  sellYN: string;
  images: imageDto;
}

export type imageDto = {
  id: number;
  url: string;
  position: number;
};
