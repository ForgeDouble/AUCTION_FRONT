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
          message: "유효하지 않거나 만료된 요청입니다. 다시 시도해주세요.",
        };
      /** 로그인 */
      case "INVALID_LOGIN_CREDENTIALS":
        return {
          type: "DIALOG",
          message: "이메일 또는 비밀번호가 일치하지 않습니다.",
        };
      case "ACCOUNT_SUSPENDED":
        return {
          type: "WARNING",
          message: `정지된 계정입니다. ${error.additionalInfo}`,
        };
      /** 닉네임 변경 */
      case "USER_TEMPORARY_RESTRICTED":
        return {
          type: "WARNING",
          message: "임시 제한 상태라 닉네임을 변경할 수 없습니다.",
        };
      case "BLANK_NICKNAME":
        return {
          type: "DIALOG",
          message: "닉네임을 입력해 주세요.",
        };
      case "INVALID_NICKNAME_LENGTH":
        return {
          type: "DIALOG",
          message: "닉네임은 2~8자로 입력해 주세요.",
        };
      case "INVALID_NICKNAME_FORMAT":
        return {
          type: "DIALOG",
          message: "닉네임은 영문,숫자,한글,_ 만 사용가능합니다.",
        };
      case "NICKNAME_CHANGE_COOLDOWN":
        return {
          type: "WARNING",
          message: error.message,
        };
      case "ALREADY_USED_NICKNAME":
        return {
          type: "DIALOG",
          message: "이미 사용 중인 닉네임입니다.",
        };

      /** 리뷰 - 계정 상태 */
      case "REVIEW_TEMPORARY_RESTRICTED":
        return {
          type: "WARNING",
          message: "임시 제한(view-only) 상태라 리뷰를 작성할 수 없습니다.",
        };
      case "PRODUCT_NOT_FOUND":
        return { 
          type: "REDIRECT", 
          to: "/404" 
        };
      case "REVIEW_NOT_FOUND":
        return { 
          type: "REDIRECT", 
          to: "/404" 
        };

      case "DUPLICATE_REVIEW":
      case "SELF_REVIEW_FORBIDDEN":
      case "REVIEWER_NOT_WINNER":
      case "WINNER_BID_NOT_FOUND":
      case "PRODUCT_NOT_SELLED":
      case "TAG_REQUIRED":
      case "TAG_INVALID":
      case "RATING_REQUIRED":
      case "RATING_OUT_OF_RANGE":
      case "RATING_STEP_INVALID":
      case "SELLER_ID_REQUIRED":
      case "REVIEW_ID_REQUIRED":
        return { 
          type: "WARNING", 
          message: error.message 
        };
      case "PRODUCT_ID_REQUIRED":
        return { 
          type: "WARNING", message: error.message || "상품 ID가 올바르지 않습니다." 
        };

      case "REVIEW_IMAGE_UPLOAD_FAILED":
      case "BID_PRODUCT_MISSING":
      case "WINNER_USER_MISSING":
        return {
          type: "DIALOG",
          message: error.message || "처리 중 오류가 발생했습니다. 잠시 후 다시 시도해주세요.",
        };  
      
      // 관리자
      case "TITLE_REQUIRED":
      case "DATE_REQUIRED":
      case "EVENT_ID_REQUIRED":
      case "EVENT_ID_INVALID":
        return { type: "WARNING", message: error.message };  
      case "CALENDAR_EVENT_NOT_FOUND":
        return {
          type: "WARNING",
          message: error.message || "이미 삭제되었거나 존재하지 않는 일정입니다.",
        };
      

      case "NOTICE_NOT_FOUND":
        return {
          type: "WARNING",
          message: error.message || "해당 공지가 존재하지 않거나 삭제되었습니다.",
        };

      case "NOTICE_ID_REQUIRED":
        return { 
          type: "WARNING", 
          message: error.message || "공지 ID가 필요합니다." 
        };

      case "TITLE_REQUIRED":
        return { 
          type: "WARNING", 
          message: error.message || "제목은 필수입니다." 
        };

      case "CONTENT_REQUIRED":
        return { 
          type: "WARNING", 
          message: error.message || "내용은 필수입니다." 
        };

      case "CATEGORY_REQUIRED":
        return { 
          type: "WARNING", 
          message: error.message || "카테고리를 선택해 주세요." 
        };

      case "IMPORTANCE_OUT_OF_RANGE":
        return { 
          type: "WARNING", 
          message: error.message || "중요도는 0~100 범위여야 합니다." 
        };
      case "NOTICE_CREATE_FAILED":
      case "NOTICE_UPDATE_FAILED":
      case "NOTICE_DELETE_FAILED":
        return {
          type: "ERROR",
          message: error.message || "처리 중 오류가 발생했습니다. 서버 로그를 확인해 주세요.",
        };  

      case "ADMIN_AUCTION_SUSPEND_FAILED":
        return { 
          type: "ERROR", 
          message: error.message || "경매 임시차단 처리 중 오류가 발생했습니다." 
        };
      case "ADMIN_AUCTION_FORCE_END_FAILED":
        return { type: "ERROR", 
          message: error.message || "경매 강제종료 처리 중 오류가 발생했습니다." 
        };

      case "UNAUTHORIZED_ACCESS":
        return {
          type: "ERROR",
          message: "권한이 없습니다. ADMIN/INQUIRY 계정인지 확인해 주세요.",
        };


      /** 기본 */
      default:
        return {
          type: "ERROR",
          message: error.message,
        };
    }
  }

  return {
    type: "ERROR",
    message: "알 수 없는 오류가 발생했습니다.",
  };
}
