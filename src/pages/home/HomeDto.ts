export interface Top3ProductDto {
  productId: number;
  productName: string;
  status: string;
  createdAt: string;
  bidCount: number;
  latestBidAmount: number;
  previewImageUrl: string;
  auctionEndTime: string;
}

export interface ParentCategoriesDto {
  categoryId: number;
  categoryName: string;
  productCount: number;
  children: [];
}
