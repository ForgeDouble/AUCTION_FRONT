export type ErrorCode =
  /** 공용 */
  | "INTERNAL_SERVER_ERROR"
  | "INTERNAL_ERROR"
  | "INVALID_TOKEN"
  | "INVALID_USER"
  | "DATA_NOT_FOUND"
  /** 이메일 전송 */
  | "INVALID_PS_TOKEN"
  /** 위시리스트 */
  | "SELF_WISHLIST_FORBIDDEN"
  /** 입찰 */
  | "INVALID_INPUT_FORMAT"
  | "BID_VALIDATION_ERROR"
  | "NOT_PROCESSING"
  | "SELLER_NOT_ALLOWED"
  | "QUANTITY_ERROR"
  | "LOW_PRICE"

  /** 리뷰 */
  | "REVIEW_TEMPORARY_RESTRICTED"
  | "PRODUCT_NOT_FOUND"
  | "PRODUCT_ID_REQUIRED"
  | "PRODUCT_NOT_SELLED"
  | "SELLER_NOT_FOUND"
  | "SELLER_ID_REQUIRED"
  | "SELF_REVIEW_FORBIDDEN"
  | "WINNER_BID_NOT_FOUND"
  | "WINNER_USER_MISSING"
  | "REVIEWER_NOT_WINNER"
  | "DUPLICATE_REVIEW"
  | "REVIEW_NOT_FOUND"
  | "REVIEW_ID_REQUIRED"
  | "RATING_REQUIRED"
  | "RATING_OUT_OF_RANGE"
  | "RATING_STEP_INVALID"
  | "TAG_REQUIRED"
  | "TAG_INVALID"
  | "REVIEW_IMAGE_UPLOAD_FAILED"
  | "BID_PRODUCT_MISSING"

  /** 관리자 */
  | "UNAUTHORIZED_ACCESS"
  // 캘린더
  | "EVENT_ID_REQUIRED"
  | "EVENT_ID_INVALID"
  | "CALENDAR_EVENT_NOT_FOUND"
  | "TITLE_REQUIRED"
  | "DATE_REQUIRED"


  /** 로그인 */
  | "INVALID_LOGIN_CREDENTIALS"
  | "ACCOUNT_SUSPENDED"
  /** 닉네임 변경 */
  | "USER_TEMPORARY_RESTRICTED"
  | "BLANK_NICKNAME"
  | "INVALID_NICKNAME_LENGTH"
  | "INVALID_NICKNAME_FORMAT"
  | "NICKNAME_CHANGE_COOLDOWN"
  | "ALREADY_USED_NICKNAME";

export type ErrorHandlingResult =
  | { type: "REDIRECT"; to: string }
  | { type: "TOAST"; message: string }
  | { type: "MODAL"; message: string }
  | { type: "ERROR"; message: string }
  | { type: "WARNING"; message: string }
  | { type: "DIALOG"; message: string }
  | { type: "FIELD_ERROR"; field: string; message: string }
  | { type: "IGNORE" }
  | { type: "AUTH"; message: string };

export type ErrorStatus = "404" | "500" | "network";

/** ErrorPage Props */
export interface ErrorState {
  show: boolean;
  type: ErrorStatus;
  title?: string;
  message?: string;
}
