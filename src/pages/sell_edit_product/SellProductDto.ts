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

// 기존 이미지와 새 이미지를 구분하는 타입 정의
export interface ExistingImageDto {
  id: number; // 서버에서 받은 실제 이미지 ID
  url: string;
  position: number;
  isExisting: true; // 기존 이미지 구분용
}

export interface NewImageDto {
  id: string; // 임시 ID (클라이언트에서 생성)
  url: string;
  file: File;
  isExisting: false; // 새 이미지 구분용
}

export type ProductEditImageDto = ExistingImageDto | NewImageDto;

export interface ProductUpdateDto {
  productId: number;
  categoryId: number | null;
  productName: string;
  productContent: string;
  price: number;
}
