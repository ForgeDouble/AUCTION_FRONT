export enum Status {
  READY = "READY",
  PROCESSING = "PROCESSING",
  SELLED = "SELLED",
  NOTSELLED = "NOTSELLED",
}

export interface ProductCreateDto {
  categoryId: number;
  productName: string;
  productContent: string;
  price: number;
  status: Status;
}
