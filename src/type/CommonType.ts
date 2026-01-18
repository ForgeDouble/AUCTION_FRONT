export interface ApiResponse<T> {
  status_code: number;
  status_message: string;
  result: T;
}

export interface PageResponse<T> {
  content: T[];
  pageable: {
    pageNumber: number;
    pageSize: number;
    sort: {
      sorted: boolean;
      unsorted: boolean;
    };
  };
  totalElements: number;
  totalPages: number;
  last: boolean;
  first: boolean;
  number: number;
  size: number;
}

export interface UserTokenDto {
  email: string;
  authority: "USER" | "ADMIN" | "INQUIRY";
}
