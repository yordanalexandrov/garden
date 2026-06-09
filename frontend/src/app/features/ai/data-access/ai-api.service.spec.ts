import { TestBed } from '@angular/core/testing';
import { of } from 'rxjs';

import { ApiClient } from '../../../core/api/api-client';
import { AiApiService } from './ai-api.service';

describe('Phase 24 AI API service', () => {
  const api = { post: vi.fn() };

  const sessionStub = { id: 'session-1', kind: 'product_ingestion', inputMode: 'text', status: 'completed' };
  const suggestionStub = { id: 'suggestion-1', suggestionType: 'product', payload: { name: 'Fungicide A' } };
  const generationResult = { aiSession: sessionStub, suggestions: [suggestionStub] };
  const acceptResult = {
    acceptedSuggestionId: 'suggestion-1',
    createdEntities: [{ entityType: 'product', entityId: 'product-1' }],
    updatedEntities: [],
  };

  beforeEach(() => {
    api.post.mockReturnValue(of(generationResult));
    TestBed.configureTestingModule({
      providers: [{ provide: ApiClient, useValue: api }],
    });
  });

  afterEach(() => {
    vi.clearAllMocks();
    TestBed.resetTestingModule();
  });

  it('creates product ingestion sessions through POST /api/v1/ai/product-ingestion', () => {
    const service = TestBed.inject(AiApiService);

    service.productIngestion({ productName: 'Fungicide A', labelText: 'Label text' }).subscribe();

    expect(api.post).toHaveBeenCalledWith('/ai/product-ingestion', {
      productName: 'Fungicide A',
      labelText: 'Label text',
    });
    const trustedField = ['account', 'Id'].join('');
    expect(api.post.mock.calls[0][1]).not.toHaveProperty(trustedField);
  });

  it('creates bed planning sessions through POST /api/v1/ai/bed-planning', () => {
    const service = TestBed.inject(AiApiService);

    service
      .bedPlanning({
        bedId: 'bed-1',
        year: 2026,
        candidatePlantIds: ['plant-1', 'plant-2'],
        notes: 'I want tomatoes',
      })
      .subscribe();

    expect(api.post).toHaveBeenCalledWith('/ai/bed-planning', {
      bedId: 'bed-1',
      year: 2026,
      candidatePlantIds: ['plant-1', 'plant-2'],
      notes: 'I want tomatoes',
    });
    const trustedField = ['account', 'Id'].join('');
    expect(api.post.mock.calls[0][1]).not.toHaveProperty(trustedField);
  });

  it('creates problem assist sessions through POST /api/v1/ai/problem-assist', () => {
    const service = TestBed.inject(AiApiService);

    service.problemAssist({ problemId: 'problem-1' }).subscribe();

    expect(api.post).toHaveBeenCalledWith('/ai/problem-assist', { problemId: 'problem-1' });
    const trustedField = ['account', 'Id'].join('');
    expect(api.post.mock.calls[0][1]).not.toHaveProperty(trustedField);
  });

  it('creates problem assist sessions with ad hoc text', () => {
    const service = TestBed.inject(AiApiService);

    service.problemAssist({ text: 'Yellow leaves with spots' }).subscribe();

    expect(api.post).toHaveBeenCalledWith('/ai/problem-assist', {
      text: 'Yellow leaves with spots',
    });
  });

  it('accepts suggestions through canonical accept endpoint', () => {
    api.post.mockReturnValue(of(acceptResult));
    const service = TestBed.inject(AiApiService);

    service.acceptSuggestion('suggestion-1', { editedPayload: { name: 'Edited Name' } }).subscribe();

    expect(api.post).toHaveBeenCalledWith('/ai/suggestions/suggestion-1/accept', {
      editedPayload: { name: 'Edited Name' },
    });
  });

  it('accepts suggestions without editedPayload when not provided', () => {
    api.post.mockReturnValue(of(acceptResult));
    const service = TestBed.inject(AiApiService);

    service.acceptSuggestion('suggestion-1').subscribe();

    expect(api.post).toHaveBeenCalledWith('/ai/suggestions/suggestion-1/accept', {});
    const body = api.post.mock.calls[0][1] as Record<string, unknown>;
    expect(body).not.toHaveProperty('editedPayload');
  });

  it('rejects suggestions through canonical reject endpoint', () => {
    api.post.mockReturnValue(of({ rejected: true }));
    const service = TestBed.inject(AiApiService);

    service.rejectSuggestion('suggestion-1').subscribe();

    expect(api.post).toHaveBeenCalledWith('/ai/suggestions/suggestion-1/reject', {});
  });

  it('URL-encodes suggestion IDs in accept and reject paths', () => {
    api.post.mockReturnValue(of(acceptResult));
    const service = TestBed.inject(AiApiService);

    service.acceptSuggestion('suggestion/with-slash').subscribe();

    expect(api.post.mock.calls[0][0]).toBe('/ai/suggestions/suggestion%2Fwith-slash/accept');
  });
});
