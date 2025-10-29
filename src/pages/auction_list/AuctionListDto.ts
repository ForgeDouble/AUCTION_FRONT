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
}

export interface ParentCategoriesDto {
  categoryId: number;
  categoryName: string;
  parentId: null | string;
}

export interface wishlistDto {
  wishlistId: number;
  productId: number;
}
