import { HttpClient, provideHttpClient, withInterceptors } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { firstValueFrom } from 'rxjs';

import { API_BASE_URL } from '../config/api-base-url';
import { SnackbarService } from '../notifications/snackbar.service';
import { apiErrorInterceptor } from './api-error.interceptor';

describe('apiErrorInterceptor', () => {
  let http: HttpClient;
  let httpTesting: HttpTestingController;
  const snackbar = {
    showError: vi.fn(),
  };

  beforeEach(() => {
    snackbar.showError.mockReset();

    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(withInterceptors([apiErrorInterceptor])),
        provideHttpClientTesting(),
        { provide: API_BASE_URL, useValue: '/api/v1' },
        { provide: SnackbarService, useValue: snackbar },
      ],
    });

    http = TestBed.inject(HttpClient);
    httpTesting = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpTesting.verify();
    TestBed.resetTestingModule();
  });

  it('maps backend error envelopes and shows messages with validation details globally', async () => {
    const response = firstValueFrom(http.get('/api/v1/health'));

    const request = httpTesting.expectOne('/api/v1/health');
    request.flush(
      {
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Invalid input',
          details: {
            field: ['Required'],
          },
        },
      },
      {
        status: 400,
        statusText: 'Bad Request',
      },
    );

    await expect(response).rejects.toMatchObject({
      code: 'VALIDATION_ERROR',
      message: 'Invalid input',
      status: 400,
    });
    expect(snackbar.showError).toHaveBeenCalledWith('Invalid input: field: Required');
  });

  it('does not show snackbar errors for non-API requests', async () => {
    const response = firstValueFrom(http.get('/assets/missing.json'));

    const request = httpTesting.expectOne('/assets/missing.json');
    request.flush(
      {
        message: 'Not found',
      },
      {
        status: 404,
        statusText: 'Not Found',
      },
    );

    await expect(response).rejects.toBeTruthy();
    expect(snackbar.showError).not.toHaveBeenCalled();
  });
});
