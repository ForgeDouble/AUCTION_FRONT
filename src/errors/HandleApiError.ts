import type { ErrorHandlingResult } from "./ErrorDto";
import { ApiError, DataReadError, UnauthorizedError } from "./Errors";

export function handleApiError(error: unknown): ErrorHandlingResult {
  if (error instanceof UnauthorizedError) {
    return {
      type: "AUTH",
      message: "유효하지 않거나 만료된 JWT 토큰입니다.",
    };
  }

  if (error instanceof DataReadError) {
    return {
      type: "REDIRECT",
      to: "/500",
    };
  }

  if (error instanceof ApiError) {
    switch (error.statusCode) {
      /** 공통 */
      case "INTERNAL_SERVER_ERROR":
        return {
          type: "ERROR",
          message:
            "서버 내부에서 오류가 발생했습니다. 관리자에게 문의해주세요.",
        };

      case "INVALID_TOKEN":
        return {
          type: "AUTH",
          message: "유효하지 않거나 만료된 JWT 토큰입니다.",
        };

      case "INVALID_USER":
        return {
          type: "AUTH",
          message: "유효하지 않은 계정입니다.",
        };

      case "DATA_NOT_FOUND":
        return {
          type: "REDIRECT",
          to: "/404",
        };

      /** 위시리스트 */
      case "SELF_WISHLIST_FORBIDDEN":
        return {
          type: "WARNING",
          message: "본인 상품에는 찜기능을 사용 할 수 없습니다.",
        };

      /** 입찰 */
      case "INVALID_INPUT_FORMAT":
        return {
          type: "WARNING",
          message: "올바르지 않은 입력입니다.",
        };
      case "BID_VALIDATION_ERROR":
        return {
          type: "WARNING",
          message: "올바르지 않은 입력입니다.",
        };
      case "NOT_PROCESSING":
        return {
          type: "REDIRECT",
          to: "/500",
        };
      case "SELLER_NOT_ALLOWED":
        return {
          type: "WARNING",
          message: "판매자는 입찰을 할 수 없습니다.",
        };
      case "QUANTITY_ERROR":
        return {
          type: "WARNING",
          message: "입찰가는 1000원 단위로 입력해주세요.",
        };
      case "LOW_PRICE":
        return {
          type: "WARNING",
          message: "현재 최고가 보다 높은 금액만 입찰가능합니다.",
        };
      /** 비밀번호 찾기 이메일 전송 */
      case "INVALID_PS_TOKEN":
        return {
          type: "DIALOG",
          message: error.message,
        };

      /** 리뷰 - 계정 상태 */
      case "ACCOUNT_WARNING_STATE":
        return {
          type: "WARNING",
          message: error.message || "임시 제한 상태라 리뷰를 작성할 수 없습니다.",
        };

      case "ACCOUNT_SUSPENDED": {
        const until = error.additionalInfo;
        return {
          type: "DIALOG",
          message: until
            ? `${error.message}\n정지 해제: ${until}`
            : (error.message || "정지된 계정은 리뷰를 작성할 수 없습니다."),
        };
      }

      case "RATING_REQUIRED":
      case "RATING_OUT_OF_RANGE":
      case "RATING_STEP_INVALID":
      case "TAG_REQUIRED":
      case "SELF_REVIEW_FORBIDDEN":
      case "DUPLICATE_REVIEW":
      case "WINNER_BID_NOT_FOUND":
      case "REVIEWER_NOT_WINNER":
      case "PRODUCT_NOT_FOUND":
      case "PRODUCT_BE_SELLED":
      case "REVIEW_ID_REQUIRED":
      case "REVIEW_NOT_FOUND":
        return {
          type: "WARNING",
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
    type: "ERROR",
    message: "알 수 없는 오류가 발생했습니다.",
  };
}
