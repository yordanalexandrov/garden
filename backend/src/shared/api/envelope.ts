import type { ApiErrorCode } from "../errors/error-codes.js";

export type SuccessEnvelope<TData> = {
  data: TData;
};

export type ErrorDetails = Record<string, unknown>;

export type ErrorEnvelope = {
  error: {
    code: ApiErrorCode;
    message: string;
    details: ErrorDetails;
  };
};

export function successEnvelope<TData>(data: TData): SuccessEnvelope<TData> {
  return { data };
}

export function errorEnvelope(
  code: ApiErrorCode,
  message: string,
  details: ErrorDetails = {}
): ErrorEnvelope {
  return {
    error: {
      code,
      message,
      details
    }
  };
}
