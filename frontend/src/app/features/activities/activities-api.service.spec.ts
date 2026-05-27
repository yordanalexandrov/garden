import { TestBed } from '@angular/core/testing';
import { of } from 'rxjs';

import { ApiClient } from '../../core/api/api-client';
import { ActivitiesApiService } from './activities-api.service';

describe('Phase 14 activities API service', () => {
  const api = {
    get: vi.fn(),
    post: vi.fn(),
  };

  beforeEach(() => {
    api.get.mockReturnValue(of({ items: [], page: 1, pageSize: 20, total: 0 }));
    api.post.mockReturnValue(of({ activity: { id: 'activity-1' } }));

    TestBed.configureTestingModule({
      providers: [{ provide: ApiClient, useValue: api }],
    });
  });

  afterEach(() => {
    vi.clearAllMocks();
    TestBed.resetTestingModule();
  });

  it('uses canonical activity endpoints and request shape', () => {
    const service = TestBed.inject(ActivitiesApiService);
    const request = {
      placeId: 'place-1',
      type: 'treatment' as const,
      performedAt: '2026-05-26T08:00:00.000Z',
      targetScopeType: 'selected_beds' as const,
      targetSelection: { bedIds: ['bed-1'] },
      notes: 'Preventive spray',
      productUsages: [
        {
          productId: 'product-1',
          productUsageRuleId: 'rule-1',
          quantityUsed: 30,
          unit: 'ml' as const,
          notes: null,
        },
      ],
      allowInventoryShortage: false,
    };

    service.list({ placeId: 'place-1', type: 'treatment', from: '2026-05-01', to: '2026-05-31', page: 2, pageSize: 50 }).subscribe();
    service.get('activity-1').subscribe();
    service.create(request).subscribe();

    expect(api.get).toHaveBeenNthCalledWith(1, '/activities', {
      params: {
        placeId: 'place-1',
        type: 'treatment',
        from: '2026-05-01',
        to: '2026-05-31',
        page: 2,
        pageSize: 50,
      },
    });
    expect(api.get).toHaveBeenNthCalledWith(2, '/activities/activity-1');
    expect(api.post).toHaveBeenCalledWith('/activities', request);
    expect(request).not.toHaveProperty(['account', 'Id'].join(''));
    expect(request).not.toHaveProperty('resolvedTargets');
  });
});
