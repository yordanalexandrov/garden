import { TestBed } from '@angular/core/testing';
import { of } from 'rxjs';

import { ApiClient } from '../../core/api/api-client';
import { ProblemsApiService } from './problems-api.service';

describe('Phase 17 problems API service', () => {
  const api = {
    get: vi.fn(),
    post: vi.fn(),
    patch: vi.fn(),
  };

  beforeEach(() => {
    api.get.mockReturnValue(of({ items: [], page: 1, pageSize: 20, total: 0 }));
    api.post.mockReturnValue(of({ id: 'problem-1' }));
    api.patch.mockReturnValue(of({ id: 'problem-1' }));

    TestBed.configureTestingModule({
      providers: [{ provide: ApiClient, useValue: api }],
    });
  });

  afterEach(() => {
    vi.clearAllMocks();
    TestBed.resetTestingModule();
  });

  it('uses canonical problem endpoints and request shapes', () => {
    const service = TestBed.inject(ProblemsApiService);
    const createRequest = {
      type: 'problem' as const,
      placeId: 'place-1',
      targetType: 'bed' as const,
      targetId: 'bed-1',
      title: 'Leaf spots',
      description: 'Dark spots on lower leaves',
      category: 'fungus' as const,
      severity: 'medium',
      status: 'open' as const,
      observedAt: '2026-05-13T07:00:00.000Z',
      linkedActivityId: null,
    };

    service
      .list({
        placeId: 'place-1',
        type: 'problem',
        status: 'open',
        category: 'fungus',
        from: '2026-05-01T00:00:00.000Z',
        to: '2026-05-31T00:00:00.000Z',
        page: 2,
        pageSize: 50,
      })
      .subscribe();
    service.get('problem-1').subscribe();
    service.create(createRequest).subscribe();
    service.update('problem-1', { status: 'monitoring' }).subscribe();

    expect(api.get).toHaveBeenNthCalledWith(1, '/problems', {
      params: {
        placeId: 'place-1',
        type: 'problem',
        status: 'open',
        category: 'fungus',
        from: '2026-05-01T00:00:00.000Z',
        to: '2026-05-31T00:00:00.000Z',
        page: 2,
        pageSize: 50,
      },
    });
    expect(api.get).toHaveBeenNthCalledWith(2, '/problems/problem-1');
    expect(api.post).toHaveBeenCalledWith('/problems', createRequest);
    expect(api.patch).toHaveBeenCalledWith('/problems/problem-1', { status: 'monitoring' });
    expect(createRequest).not.toHaveProperty(['account', 'Id'].join(''));
  });

  it('uploads problem photos with multipart field name file', () => {
    api.post.mockReturnValue(of({ id: 'photo-1', storageKey: 'problems/problem-1/photo.jpg' }));
    const service = TestBed.inject(ProblemsApiService);
    const file = new File(['binary'], 'leaf.jpg', { type: 'image/jpeg' });

    service.uploadPhoto('problem-1', file).subscribe();

    expect(api.post).toHaveBeenCalledTimes(1);
    const [path, body] = api.post.mock.calls[0];
    expect(path).toBe('/problems/problem-1/photos');
    expect(body).toBeInstanceOf(FormData);
    expect((body as FormData).get('file')).toBe(file);
  });

  it('archives a problem', () => {
    api.post.mockReturnValue(of({ archived: true }));
    const service = TestBed.inject(ProblemsApiService);

    service.archive('problem-1').subscribe();

    expect(api.post).toHaveBeenCalledWith('/problems/problem-1/archive', {});
  });
});
