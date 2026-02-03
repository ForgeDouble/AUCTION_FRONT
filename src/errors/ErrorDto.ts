export type ErrorCode =
  | "INTERNAL_SERVER_ERROR"
  | "INVALID_TOKEN"
  | "NOT_ALLOWED"
  | "USER_NOT_FOUND"
  | "PRODUCT_NOT_FOUND"
  | "SELLER_NOT_ALLOWED"
  | "QUANTITY_ERROR"
  | "LOW_PRICE"
  | "INVALID_INPUT_FORMAT"
  | "BID_VALIDATION_ERROR"
  | "INTERNAL_ERROR"
  | "FAILED_TO_SEND_EMAIL";

export type ErrorHandlingResult =
  | { type: "REDIRECT"; to: string }
  | { type: "TOAST"; message: string }
  | { type: "MODAL"; message: string }
  | { type: "DIALOG"; message: string }
  | { type: "FIELD_ERROR"; field: string; message: string }
  | { type: "IGNORE" };
