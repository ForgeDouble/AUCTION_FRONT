import type { ErrorCode } from "./ErrorDto";

export class ApiError extends Error {
  httpStatus: number;
  statusCode: ErrorCode;
  additionalInfo?: string;

  constructor(
    httpStatus: number,
    statusCode: ErrorCode,
    message: string,
    additionalInfo?: string,
  ) {
    super(message);
    this.name = "ApiError";
    this.httpStatus = httpStatus;
    this.statusCode = statusCode;
    this.additionalInfo = additionalInfo;
  }
}

export class UnauthorizedError extends ApiError {
  constructor(additionalInfo?: string) {
    super(
      401, // httpStatus
      "NOT_ALLOWED", // statusCode (도메인 코드)
      "로그인이 필요합니다.", // message
      additionalInfo, // optional
    );
    this.name = "UnauthorizedError";
  }
}
