export type categoryDto = {
  categoryId: number;
  categoryName: string;
};

export interface ProductListDto {
  productId: number;
  productName: string;
  productContent: string;
  price: number;
  sellYN: string;
  previewImageUrl: string;
  categoryId: number;
  userEmail: string;
  path: categoryDto[];
  latestBidAmount: number | null;
  bidCount: number;
}

export interface ParentCategoriesDto {
  categoryId: number;
  categoryName: string;
  children: [] | ParentCategoriesDto[];
}

export interface wishlistDto {
  wishlistId: number;
  productId: number;
}
