export type categoryDto = {
  categoryId: number;
  categoryName: string;
};

export interface ProductListDto {
  productId: number;
  path: categoryDto[];
  userEmail: string;
  productName: string;
  productContent: string;
  price: number;
  sellYN: string;
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
