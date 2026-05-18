import { HttpClient, provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { firstValueFrom } from 'rxjs';

import { API_BASE_URL } from '../config/api-base-url';
import { ApiError } from '../errors/api-error';
import { ApiClient } from './api-client';

describe('ApiClient', () => {
  let httpTesting: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: API_BASE_URL, useValue: '/api/v1' },
      ],
    });

    httpTesting = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpTesting.verify();
    TestBed.resetTestingModule();
  });

  it('uses HttpClient only inside the centralized API client', () => {
    expect(TestBed.inject(HttpClient)).toBeTruthy();
    expect(TestBed.inject(ApiClient)).toBeTruthy();
  });

  it('unwraps canonical success data envelopes', async () => {
    const client = TestBed.inject(ApiClient);
    const response = firstValueFrom(client.get<{ readonly status: 'ok' }>('/health'));

    const request = httpTesting.expectOne('/api/v1/health');
    expect(request.request.method).toBe('GET');
    request.flush({ data: { status: 'ok' } });

    await expect(response).resolves.toEqual({ status: 'ok' });
  });

  it('rejects responses that do not use the canonical data envelope', async () => {
    const client = TestBed.inject(ApiClient);
    const response = firstValueFrom(client.get<{ readonly status: 'ok' }>('/health'));

    const request = httpTesting.expectOne('/api/v1/health');
    request.flush({ status: 'ok' });

    await expect(response).rejects.toBeInstanceOf(ApiError);
  });
});
