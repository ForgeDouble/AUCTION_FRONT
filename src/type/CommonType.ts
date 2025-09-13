export interface ApiResponse<T> {
  status_code: number;
  status_message: string;
  result: T;
}
