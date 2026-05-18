import { HttpErrorResponse } from '@angular/common/http';

import { ApiError } from './api-error';
import { extractApiErrorEnvelope, mapApiError } from './api-error.mapper';

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
});
