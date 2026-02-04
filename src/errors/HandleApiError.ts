import type { ErrorHandlingResult } from "./ErrorDto";
import { ApiError, UnauthorizedError } from "./Errors";

export function handleApiError(error: unknown): ErrorHandlingResult {
  if (error instanceof UnauthorizedError) {
    return {
      type: "REDIRECT",
      to: "/login",
    };
  }

  if (error instanceof ApiError) {
    switch (error.statusCode) {
      /** 공통 */
      case "INTERNAL_SERVER_ERROR":
        return {
          type: "MODAL",
          message:
            "서버 내부에서 오류가 발생했습니다. 관리자에게 문의해주세요.",
        };

      case "INVALID_TOKEN":
        return {
          type: "AUTH",
          message: "유효하지 않거나 만료된 JWT 토큰입니다.",
        };

      /** 입찰 */
      case "LOW_PRICE":
      case "QUANTITY_ERROR":
        return {
          type: "FIELD_ERROR",
          field: "price",
          message: error.message,
        };

      case "PRODUCT_NOT_FOUND":
        return {
          type: "REDIRECT",
          to: "/404",
        };

      case "INTERNAL_ERROR":
        return {
          type: "MODAL",
          message: error.message,
        };

      /** 비밀번호 찾기 이메일 전송 */
      case "INVALID_PS_TOKEN":
        return {
          type: "DIALOG",
          message: error.message,
        };

      /** 기본 */
      default:
        return {
          type: "TOAST",
          message: error.message,
        };
    }
  }

  return {
    type: "MODAL",
    message: "알 수 없는 오류가 발생했습니다.",
  };
}
