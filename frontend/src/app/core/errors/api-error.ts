import { ApiErrorCode, ApiErrorDetails } from '../api/api.types';

export interface ApiErrorOptions {
  readonly status?: number;
  readonly details?: ApiErrorDetails;
  readonly originalError?: unknown;
}

export class ApiError extends Error {
  readonly code: ApiErrorCode;
  readonly status: number;
  readonly details: ApiErrorDetails;
  readonly originalError: unknown;

  constructor(code: ApiErrorCode, message: string, options: ApiErrorOptions = {}) {
    super(message);
    this.name = 'ApiError';
    this.code = code;
    this.status = options.status ?? 0;
    this.details = options.details ?? {};
    this.originalError = options.originalError;
  }
}
