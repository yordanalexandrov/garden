import type { ErrorDetails } from "../api/envelope.js";
import type { ApiErrorCode } from "./error-codes.js";

export class AppError extends Error {
  readonly code: ApiErrorCode;
  readonly details: ErrorDetails;

  constructor(code: ApiErrorCode, message: string, details: ErrorDetails = {}) {
    super(message);
    this.name = "AppError";
    this.code = code;
    this.details = details;
  }
}

export function isAppError(error: unknown): error is AppError {
  return error instanceof AppError;
}
