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

export interface UpdateImageDto {
  id: string;
  position: number;
  url: string;
}

export interface ProductReadUpdateDto {
  categoryId: number;
  createdAt: string;
  images: UpdateImageDto[];
  productId: number;
  userId: number;
  productName: string;
  productContent: string;
  price: number;
  status: Status;
}
