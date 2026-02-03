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
      case "INTERNAL_SERVER_ERROR":
        return {
          type: "MODAL",
          message:
            "서버 내부에서 오류가 발생했습니다. 관리자에게 문의해주세요.",
        };

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

      /** 이메일 전송 실패 예외 */
      case "FAILED_TO_SEND_EMAIL":
        return {
          type: "DIALOG",
          message: "이메일 전송이 실패했습니다. 잠시 후 다시 시도해주세요.",
        };

      case "INVALID_TOKEN":
        return {
          type: "DIALOG",
          message: error.message,
        };

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
