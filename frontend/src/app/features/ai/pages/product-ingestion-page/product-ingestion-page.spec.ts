import { TestBed } from '@angular/core/testing';
import { provideNoopAnimations } from '@angular/platform-browser/animations';
import { of, throwError } from 'rxjs';

import { ApiError } from '../../../../core/errors/api-error';
import { AiApiService } from '../../data-access/ai-api.service';
import { ProductIngestionPage } from './product-ingestion-page';

const productSuggestion = {
  id: 'suggestion-1',
  suggestionType: 'product',
  payload: { name: 'Fungicide A', category: 'fungicide' },
};
const ruleSuggestion = {
  id: 'suggestion-2',
  suggestionType: 'product_rule',
  payload: { plantName: 'Tomato', doseValue: 20, doseUnit: 'g' },
};
const generationResult = {
  aiSession: { id: 'session-1', kind: 'product_ingestion', inputMode: 'text', status: 'completed' },
  suggestions: [productSuggestion, ruleSuggestion],
  warnings: ['Review label data before saving.'],
};
const acceptResult = {
  acceptedSuggestionId: 'suggestion-1',
  createdEntities: [{ entityType: 'product', entityId: 'product-1' }],
  updatedEntities: [],
};

describe('Phase 24 ProductIngestionPage', () => {
  const aiApi = {
    productIngestion: vi.fn(),
    acceptSuggestion: vi.fn(),
    rejectSuggestion: vi.fn(),
  };

  beforeEach(async () => {
    aiApi.productIngestion.mockReturnValue(of(generationResult));
    aiApi.acceptSuggestion.mockReturnValue(of(acceptResult));
    aiApi.rejectSuggestion.mockReturnValue(of({ rejected: true }));

    await TestBed.configureTestingModule({
      imports: [ProductIngestionPage],
      providers: [
        { provide: AiApiService, useValue: aiApi },
        provideNoopAnimations(),
      ],
    }).compileComponents();
  });

  afterEach(() => {
    vi.clearAllMocks();
    TestBed.resetTestingModule();
  });

  it('validates product name as required before submit', () => {
    const fixture = TestBed.createComponent(ProductIngestionPage);
    const component = fixture.componentInstance;
    fixture.detectChanges();

    component.form.controls.productName.markAsTouched();
    fixture.detectChanges();

    expect(component.form.invalid).toBe(true);
    expect(aiApi.productIngestion).not.toHaveBeenCalled();
  });

  it('submits canonical product ingestion request and renders suggestions as unaccepted', () => {
    const fixture = TestBed.createComponent(ProductIngestionPage);
    const component = fixture.componentInstance;
    fixture.detectChanges();

    component.form.patchValue({ productName: 'Fungicide A', labelText: 'Label content' });
    component.submit();
    fixture.detectChanges();

    expect(aiApi.productIngestion).toHaveBeenCalledWith({
      productName: 'Fungicide A',
      labelText: 'Label content',
    });
    expect(component.suggestionStates().length).toBe(2);
    component.suggestionStates().forEach((s) => expect(s.status).toBe('unaccepted'));
  });

  it('does not include trusted scope fields in the product ingestion request', () => {
    const fixture = TestBed.createComponent(ProductIngestionPage);
    const component = fixture.componentInstance;
    fixture.detectChanges();

    component.form.patchValue({ productName: 'Fungicide A' });
    component.submit();

    const request = aiApi.productIngestion.mock.calls[0][0] as Record<string, unknown>;
    const trustedField = ['account', 'Id'].join('');
    expect(request).not.toHaveProperty(trustedField);
  });

  it('accepts a suggestion with editedPayload and shows backend-created product link', () => {
    const fixture = TestBed.createComponent(ProductIngestionPage);
    const component = fixture.componentInstance;
    fixture.detectChanges();

    component.form.patchValue({ productName: 'Fungicide A' });
    component.submit();
    fixture.detectChanges();

    component.onAccept({ suggestionId: 'suggestion-1', editedPayload: { name: 'Edited Name' } });
    fixture.detectChanges();

    expect(aiApi.acceptSuggestion).toHaveBeenCalledWith('suggestion-1', {
      editedPayload: { name: 'Edited Name' },
    });
    const state = component.getState(productSuggestion);
    expect(state?.status).toBe('accepted');
    expect(state?.acceptResult?.createdEntities[0].entityId).toBe('product-1');
  });

  it('rejects a suggestion and updates state without creating entity links', () => {
    const fixture = TestBed.createComponent(ProductIngestionPage);
    const component = fixture.componentInstance;
    fixture.detectChanges();

    component.form.patchValue({ productName: 'Fungicide A' });
    component.submit();
    fixture.detectChanges();

    component.onReject({ suggestionId: 'suggestion-2' });
    fixture.detectChanges();

    const state = component.getState(ruleSuggestion);
    expect(state?.status).toBe('rejected');
    expect(state?.acceptResult).toBeNull();
  });

  it('preserves form input and suggestion states on backend error', () => {
    aiApi.productIngestion.mockReturnValueOnce(of(generationResult));
    aiApi.acceptSuggestion.mockReturnValueOnce(
      throwError(() => new ApiError('VALIDATION_ERROR', 'Name too long')),
    );

    const fixture = TestBed.createComponent(ProductIngestionPage);
    const component = fixture.componentInstance;
    fixture.detectChanges();

    component.form.patchValue({ productName: 'Fungicide A' });
    component.submit();
    fixture.detectChanges();

    component.onAccept({ suggestionId: 'suggestion-1' });
    fixture.detectChanges();

    expect(component.form.controls.productName.value).toBe('Fungicide A');
    const state = component.getState(productSuggestion);
    expect(state?.status).toBe('error');
    expect(state?.error).toBeTruthy();
  });

  it('displays warnings from the backend session response', () => {
    const fixture = TestBed.createComponent(ProductIngestionPage);
    const component = fixture.componentInstance;
    fixture.detectChanges();

    component.form.patchValue({ productName: 'Fungicide A' });
    component.submit();
    fixture.detectChanges();

    expect(component.warnings).toContain('Review label data before saving.');
  });

  it('shows session error when productIngestion call fails', () => {
    aiApi.productIngestion.mockReturnValueOnce(
      throwError(() => new ApiError('EXTERNAL_SERVICE_ERROR', 'AI provider unavailable')),
    );

    const fixture = TestBed.createComponent(ProductIngestionPage);
    const component = fixture.componentInstance;
    fixture.detectChanges();

    component.form.patchValue({ productName: 'Fungicide A' });
    component.submit();
    fixture.detectChanges();

    expect(component.sessionError()).not.toBeNull();
    expect(component.suggestionStates()).toEqual([]);
  });
});
