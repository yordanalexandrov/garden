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

const messageFromUnknown = (value: unknown): string | null => {
  if (typeof value !== 'string') {
    return null;
  }

  const trimmed = value.trim();

  return trimmed.length > 0 ? trimmed : null;
};

const defaultMessageForCode = (code: ApiErrorEnvelope['error']['code']): string => {
  if (code === 'VALIDATION_ERROR') {
    return 'Invalid input';
  }

  return 'API request failed.';
};

export const extractApiErrorEnvelope = (value: unknown): ApiErrorEnvelope | null => {
  if (!isRecord(value) || !isRecord(value['error'])) {
    return null;
  }

  const error = value['error'];
  const rawCode = error['code'];
  const rawMessage = error['message'];

  if (typeof rawCode !== 'string' && typeof rawMessage !== 'string') {
    return null;
  }

  const code = isApiErrorCode(rawCode) ? rawCode : 'INTERNAL_ERROR';
  const message = messageFromUnknown(rawMessage) ?? defaultMessageForCode(code);

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
