import { TestBed } from '@angular/core/testing';
import { of } from 'rxjs';

import { ApiClient } from '../../core/api/api-client';
import { DashboardApiService } from './dashboard-api.service';

describe('Phase 20 dashboard API service', () => {
  const api = { get: vi.fn() };

  beforeEach(() => {
    api.get.mockReturnValue(
      of({
        upcomingTasks: [],
        suggestedTasks: [],
        activeQuarantinePeriods: [],
        recentActivities: [],
        openProblems: [],
        lowStockProducts: [],
        places: [],
      }),
    );
    TestBed.configureTestingModule({
      providers: [{ provide: ApiClient, useValue: api }],
    });
  });

  afterEach(() => {
    vi.clearAllMocks();
    TestBed.resetTestingModule();
  });

  it('calls the canonical dashboard endpoint with optional place filter', () => {
    const service = TestBed.inject(DashboardApiService);

    service.getDashboard({ placeId: 'place-1' }).subscribe();

    expect(api.get).toHaveBeenCalledWith('/dashboard', {
      params: { placeId: 'place-1' },
    });
  });
});
