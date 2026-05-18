import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { firstValueFrom } from 'rxjs';

import { API_BASE_URL } from '../config/api-base-url';
import { HealthApiService } from './health-api.service';

describe('HealthApiService', () => {
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

  it('calls GET /api/v1/health and returns the typed health data', async () => {
    const service = TestBed.inject(HealthApiService);
    const response = firstValueFrom(service.getHealth());

    const request = httpTesting.expectOne('/api/v1/health');
    expect(request.request.method).toBe('GET');
    request.flush({
      data: {
        status: 'ok',
        timestamp: '2026-05-13T12:00:00.000Z',
      },
    });

    await expect(response).resolves.toEqual({
      status: 'ok',
      timestamp: '2026-05-13T12:00:00.000Z',
    });
  });
});
