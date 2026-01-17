export type Status = "READY" | "PROCESSING" | "SELLED" | "NOTSELLED";

export interface ImageDto {
  id: string;
  url: string;
  file: File;
}

export interface ProductCreateDto {
  categoryId: number;
  productName: string;
  productContent: string;
  price: number;
  status: Status;
}

export interface ParentCategoriesDto {
  categoryId: number;
  categoryName: string;
  children: [] | ParentCategoriesDto[];
}
