export type categoryDto = {
  categoryId: number;
  categoryName: string;
};

export interface ProductListDto {
  productId: number;
  path: categoryDto[];
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
