export type categoryDto = {
  categoryId: number;
  categoryName: string;
};

export interface ProductListDto {
  productId: number;
  productName: string;
  productContent: string;
  price: number;
  status: string;
  previewImageUrl: string;
  categoryId: number;
  userEmail: string;
  path: categoryDto[];
  latestBidAmount: number | null;
  bidCount: number;
  wishlistCount: number;
  createdAt: string;
  auctionEndTime: string;
}

export interface ParentCategoriesDto {
  categoryId: number;
  categoryName: string;
  productCount: number;
  children: [] | ParentCategoriesDto[];
}

export interface wishlistDto {
  wishlistId: number;
  productId: number;
}
