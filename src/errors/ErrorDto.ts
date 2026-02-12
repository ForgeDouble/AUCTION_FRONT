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
  /** 로그인 */
  | "INVALID_LOGIN_CREDENTIALS"
  | "ACCOUNT_SUSPENDED";

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
