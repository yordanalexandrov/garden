export const API_ERROR_CODES = [
  "VALIDATION_ERROR",
  "UNAUTHORIZED",
  "FORBIDDEN",
  "NOT_FOUND",
  "CONFLICT",
  "BUSINESS_RULE_VIOLATION",
  "INVENTORY_SHORTAGE",
  "EXTERNAL_SERVICE_ERROR",
  "INTERNAL_ERROR"
] as const;

export type ApiErrorCode = (typeof API_ERROR_CODES)[number];

export const ERROR_STATUS_BY_CODE = {
  VALIDATION_ERROR: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  CONFLICT: 409,
  BUSINESS_RULE_VIOLATION: 422,
  INVENTORY_SHORTAGE: 422,
  EXTERNAL_SERVICE_ERROR: 502,
  INTERNAL_ERROR: 500
} as const satisfies Record<ApiErrorCode, number>;

export function statusForErrorCode(code: ApiErrorCode): number {
  return ERROR_STATUS_BY_CODE[code];
}
