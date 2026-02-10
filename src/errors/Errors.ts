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
      "INVALID_TOKEN", // statusCode (도메인 코드)
      "로그인이 필요합니다.", // message
      additionalInfo, // optional
    );
    this.name = "UnauthorizedError";
  }
}

export class DataReadError extends ApiError {
  constructor(additionalInfo?: string) {
    super(
      500, // httpStatus
      "INTERNAL_SERVER_ERROR", // statusCode (도메인 코드)
      "서버 내부에서 오류가 발생했습니다. 관리자에게 문의해주세요.", // message
      additionalInfo, // optional
    );
    this.name = "DataReadError";
  }
}
