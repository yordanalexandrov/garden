import { TestBed } from '@angular/core/testing';
import { of } from 'rxjs';

import { ApiClient } from '../../core/api/api-client';
import { TasksApiService } from './tasks-api.service';

describe('Phase 20 tasks API service', () => {
  const api = {
    get: vi.fn(),
    post: vi.fn(),
    patch: vi.fn(),
  };

  beforeEach(() => {
    api.get.mockReturnValue(of({ items: [], page: 1, pageSize: 20, total: 0 }));
    api.post.mockReturnValue(of({ id: 'task-1' }));
    api.patch.mockReturnValue(of({ id: 'task-1' }));

    TestBed.configureTestingModule({
      providers: [{ provide: ApiClient, useValue: api }],
    });
  });

  afterEach(() => {
    vi.clearAllMocks();
    TestBed.resetTestingModule();
  });

  it('uses canonical task endpoints without trusted scope or reminder payloads', () => {
    const service = TestBed.inject(TasksApiService);
    const createRequest = {
      placeId: 'place-1',
      type: 'spraying' as const,
      dueDate: '2026-06-10',
      status: 'suggested' as const,
      targetScopeType: 'whole_place' as const,
      notes: 'Review after rain',
    };
    const patchRequest = { dueDate: '2026-06-11', notes: 'Updated' };

    service
      .list({
        placeId: 'place-1',
        status: 'suggested',
        type: 'spraying',
        dueFrom: '2026-06-01',
        dueTo: '2026-06-30',
        page: 2,
        pageSize: 50,
      })
      .subscribe();
    service.create(createRequest).subscribe();
    service.get('task-1').subscribe();
    service.update('task-1', patchRequest).subscribe();
    service.confirm('task-1').subscribe();
    service.dismiss('task-1').subscribe();
    service.complete('task-1').subscribe();
    service.skip('task-1').subscribe();

    expect(api.get).toHaveBeenNthCalledWith(1, '/tasks', {
      params: {
        placeId: 'place-1',
        status: 'suggested',
        type: 'spraying',
        dueFrom: '2026-06-01',
        dueTo: '2026-06-30',
        page: 2,
        pageSize: 50,
      },
    });
    expect(api.post).toHaveBeenNthCalledWith(1, '/tasks', createRequest);
    expect(api.get).toHaveBeenNthCalledWith(2, '/tasks/task-1');
    expect(api.patch).toHaveBeenCalledWith('/tasks/task-1', patchRequest);
    expect(api.post).toHaveBeenNthCalledWith(2, '/tasks/task-1/confirm', {});
    expect(api.post).toHaveBeenNthCalledWith(3, '/tasks/task-1/dismiss', {});
    expect(api.post).toHaveBeenNthCalledWith(4, '/tasks/task-1/complete', {});
    expect(api.post).toHaveBeenNthCalledWith(5, '/tasks/task-1/skip', {});
    expect(createRequest).not.toHaveProperty(['account', 'Id'].join(''));
    expect(createRequest).not.toHaveProperty('reminders');
  });
});
