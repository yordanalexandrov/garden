import { HttpErrorResponse } from '@angular/common/http';

import { ApiError } from './api-error';
import {
  extractApiErrorEnvelope,
  formatApiErrorForDisplay,
  mapApiError,
} from './api-error.mapper';

describe('API error mapper', () => {
  it('extracts canonical backend error envelopes', () => {
    expect(
      extractApiErrorEnvelope({
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Invalid input',
          details: {
            name: ['Name is required'],
          },
        },
      }),
    ).toEqual({
      error: {
        code: 'VALIDATION_ERROR',
        message: 'Invalid input',
        details: {
          name: ['Name is required'],
        },
      },
    });
  });

  it('converts canonical backend errors into typed API errors', () => {
    const error = new HttpErrorResponse({
      status: 400,
      error: {
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Invalid input',
          details: {
            field: ['Required'],
          },
        },
      },
    });

    const mapped = mapApiError(error);

    expect(mapped).toBeInstanceOf(ApiError);
    expect(mapped.code).toBe('VALIDATION_ERROR');
    expect(mapped.status).toBe(400);
    expect(mapped.message).toBe('Invalid input');
    expect(mapped.details['field']).toEqual(['Required']);
  });

  it('preserves backend messages and details when the backend sends an unknown error code', () => {
    const mapped = mapApiError(
      new HttpErrorResponse({
        status: 429,
        error: {
          error: {
            code: 'RATE_LIMITED',
            message: 'Too many requests',
            details: {
              retryAfterSeconds: 30,
            },
          },
        },
      }),
    );

    expect(mapped.code).toBe('INTERNAL_ERROR');
    expect(mapped.status).toBe(429);
    expect(mapped.message).toBe('Too many requests');
    expect(mapped.details['retryAfterSeconds']).toBe(30);
  });

  it('keeps known backend error codes when the backend message is blank', () => {
    const mapped = mapApiError(
      new HttpErrorResponse({
        status: 400,
        error: {
          error: {
            code: 'VALIDATION_ERROR',
            message: '   ',
            details: {
              field: ['Required'],
            },
          },
        },
      }),
    );

    expect(mapped.code).toBe('VALIDATION_ERROR');
    expect(mapped.message).toBe('Invalid input');
    expect(mapped.details['field']).toEqual(['Required']);
  });

  it('falls back to a typed internal error for non-canonical HTTP errors', () => {
    const mapped = mapApiError(
      new HttpErrorResponse({
        status: 500,
        error: {
          message: 'raw server failure',
        },
      }),
    );

    expect(mapped.code).toBe('INTERNAL_ERROR');
    expect(mapped.message).toBe('API request failed.');
    expect(mapped.status).toBe(500);
  });

  it('formats validation details for global display when available', () => {
    const error = new ApiError('VALIDATION_ERROR', 'Invalid input', {
      details: {
        name: ['Name is required'],
        weatherEnabled: true,
      },
    });

    expect(formatApiErrorForDisplay(error)).toBe(
      'Invalid input: name: Name is required; weatherEnabled: true',
    );
  });

  it('shows only the backend message when no displayable details exist', () => {
    const error = new ApiError('INTERNAL_ERROR', 'API request failed.', {
      details: {
        empty: [],
        nullish: null,
      },
    });

    expect(formatApiErrorForDisplay(error)).toBe('API request failed.');
  });
});
