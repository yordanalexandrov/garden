import { HttpErrorResponse } from '@angular/common/http';

import {
  ApiErrorDetails,
  ApiErrorEnvelope,
  isApiErrorCode,
} from '../api/api.types';
import { ApiError } from './api-error';

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null;

const detailsFromUnknown = (value: unknown): ApiErrorDetails =>
  isRecord(value) ? value : {};

export const extractApiErrorEnvelope = (value: unknown): ApiErrorEnvelope | null => {
  if (!isRecord(value) || !isRecord(value['error'])) {
    return null;
  }

  const error = value['error'];
  const code = error['code'];
  const message = error['message'];

  if (!isApiErrorCode(code) || typeof message !== 'string' || message.trim().length === 0) {
    return null;
  }

  return {
    error: {
      code,
      message,
      details: detailsFromUnknown(error['details']),
    },
  };
};

export const mapApiError = (error: unknown): ApiError => {
  if (error instanceof ApiError) {
    return error;
  }

  if (error instanceof HttpErrorResponse) {
    const envelope = extractApiErrorEnvelope(error.error);

    if (envelope !== null) {
      return new ApiError(envelope.error.code, envelope.error.message, {
        status: error.status,
        details: envelope.error.details,
        originalError: error,
      });
    }

    return new ApiError('INTERNAL_ERROR', fallbackHttpErrorMessage(error), {
      status: error.status,
      originalError: error,
    });
  }

  return new ApiError('INTERNAL_ERROR', 'Unexpected API error.', {
    originalError: error,
  });
};

const fallbackHttpErrorMessage = (error: HttpErrorResponse): string => {
  if (error.status === 0) {
    return 'API request failed. Check the network connection.';
  }

  return 'API request failed.';
};
