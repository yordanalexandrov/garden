import { TestBed } from '@angular/core/testing';
import { of } from 'rxjs';

import { ApiClient } from '../../core/api/api-client';
import { CalendarApiService } from './calendar-api.service';

describe('Phase 20 calendar API service', () => {
  const api = { get: vi.fn() };

  beforeEach(() => {
    api.get.mockReturnValue(of({ activities: [], tasks: [], quarantinePeriods: [], weatherEvents: [] }));
    TestBed.configureTestingModule({
      providers: [{ provide: ApiClient, useValue: api }],
    });
  });

  afterEach(() => {
    vi.clearAllMocks();
    TestBed.resetTestingModule();
  });

  it('calls the canonical calendar endpoint with date range and place filter', () => {
    const service = TestBed.inject(CalendarApiService);

    service.getCalendar({ from: '2026-06-01', to: '2026-06-30', placeId: 'place-1' }).subscribe();

    expect(api.get).toHaveBeenCalledWith('/calendar', {
      params: { from: '2026-06-01', to: '2026-06-30', placeId: 'place-1' },
    });
  });
});
