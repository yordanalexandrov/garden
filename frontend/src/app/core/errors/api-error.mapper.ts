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

export const formatApiErrorForDisplay = (error: ApiError): string => {
  const detailEntries = Object.entries(error.details)
    .map(([field, value]) => formatDetailEntry(field, value))
    .filter((entry): entry is string => entry !== null);

  if (detailEntries.length === 0) {
    return error.message;
  }

  return `${error.message}: ${detailEntries.join('; ')}`;
};

const fallbackHttpErrorMessage = (error: HttpErrorResponse): string => {
  if (error.status === 0) {
    return 'API request failed. Check the network connection.';
  }

  return 'API request failed.';
};

const formatDetailEntry = (field: string, value: unknown): string | null => {
  const formattedValue = formatDetailValue(value);

  if (formattedValue === null) {
    return null;
  }

  return `${field}: ${formattedValue}`;
};

const formatDetailValue = (value: unknown): string | null => {
  if (Array.isArray(value)) {
    const values = value.map(formatScalarDetailValue).filter((entry): entry is string => entry !== null);

    return values.length > 0 ? values.join(', ') : null;
  }

  if (isRecord(value)) {
    return JSON.stringify(value);
  }

  return formatScalarDetailValue(value);
};

const formatScalarDetailValue = (value: unknown): string | null => {
  if (typeof value === 'string') {
    return messageFromUnknown(value);
  }

  if (typeof value === 'number' || typeof value === 'boolean') {
    return String(value);
  }

  return null;
};
