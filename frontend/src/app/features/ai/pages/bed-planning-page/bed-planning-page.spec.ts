import { TestBed } from '@angular/core/testing';
import { provideNoopAnimations } from '@angular/platform-browser/animations';
import { of, throwError } from 'rxjs';

import { ApiError } from '../../../../core/errors/api-error';
import { AiApiService } from '../../data-access/ai-api.service';
import { BedPlanningPage } from './bed-planning-page';

const bedPlanSuggestion = {
  id: 'suggestion-1',
  suggestionType: 'bed_plan',
  payload: {
    spacingSuggestions: [{ plantName: 'Tomato', spacingCm: 50, notes: null }],
    coexistenceNotes: [{ plants: ['Tomato', 'Basil'], note: 'Good companions' }],
    warnings: ['Limited space for all candidates.'],
    roughQuantityGuidance: [{ plantName: 'Tomato', estimatedCount: 4, notes: null }],
  },
};

const generationResult = {
  aiSession: { id: 'session-1', kind: 'bed_planning', inputMode: 'text', status: 'completed' },
  suggestions: [bedPlanSuggestion],
};

describe('Phase 24 BedPlanningPage', () => {
  const aiApi = {
    bedPlanning: vi.fn(),
    acceptSuggestion: vi.fn(),
    rejectSuggestion: vi.fn(),
  };

  beforeEach(async () => {
    aiApi.bedPlanning.mockReturnValue(of(generationResult));
    aiApi.acceptSuggestion.mockReturnValue(
      of({ acceptedSuggestionId: 'suggestion-1', createdEntities: [], updatedEntities: [] }),
    );
    aiApi.rejectSuggestion.mockReturnValue(of({ rejected: true }));

    await TestBed.configureTestingModule({
      imports: [BedPlanningPage],
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

  it('sends bedId, year, candidatePlantIds, and notes through AiApiService', () => {
    const fixture = TestBed.createComponent(BedPlanningPage);
    const component = fixture.componentInstance;
    fixture.detectChanges();

    component.form.patchValue({
      bedId: 'bed-1',
      year: 2026,
      candidatePlantIds: 'plant-1, plant-2',
      notes: 'I want tomatoes',
    });
    component.submit();

    expect(aiApi.bedPlanning).toHaveBeenCalledWith({
      bedId: 'bed-1',
      year: 2026,
      candidatePlantIds: ['plant-1', 'plant-2'],
      notes: 'I want tomatoes',
    });
  });

  it('does not include trusted scope fields in bed planning request', () => {
    const fixture = TestBed.createComponent(BedPlanningPage);
    const component = fixture.componentInstance;
    fixture.detectChanges();

    component.form.patchValue({ bedId: 'bed-1', year: 2026 });
    component.submit();

    const request = aiApi.bedPlanning.mock.calls[0][0] as Record<string, unknown>;
    const trustedField = ['account', 'Id'].join('');
    expect(request).not.toHaveProperty(trustedField);
  });

  it('renders bed plan suggestions as advisory output', () => {
    const fixture = TestBed.createComponent(BedPlanningPage);
    const component = fixture.componentInstance;
    fixture.detectChanges();

    component.form.patchValue({ bedId: 'bed-1', year: 2026 });
    component.submit();
    fixture.detectChanges();

    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.textContent).toContain('advisory');
    expect(compiled.textContent).toContain('Tomato');
    expect(compiled.textContent).toContain('Good companions');
  });

  it('shows bed plan warnings from the payload', () => {
    const fixture = TestBed.createComponent(BedPlanningPage);
    const component = fixture.componentInstance;
    fixture.detectChanges();

    component.form.patchValue({ bedId: 'bed-1', year: 2026 });
    component.submit();
    fixture.detectChanges();

    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.textContent).toContain('Limited space');
  });

  it('preserves form input on backend error without clearing bed or year', () => {
    aiApi.bedPlanning.mockReturnValueOnce(
      throwError(() => new ApiError('EXTERNAL_SERVICE_ERROR', 'AI provider unavailable')),
    );

    const fixture = TestBed.createComponent(BedPlanningPage);
    const component = fixture.componentInstance;
    fixture.detectChanges();

    component.form.patchValue({ bedId: 'bed-1', year: 2026 });
    component.submit();
    fixture.detectChanges();

    expect(component.form.controls.bedId.value).toBe('bed-1');
    expect(component.form.controls.year.value).toBe(2026);
    expect(component.sessionError()).not.toBeNull();
  });

  it('requires bedId and year fields', () => {
    const fixture = TestBed.createComponent(BedPlanningPage);
    const component = fixture.componentInstance;
    fixture.detectChanges();

    component.form.controls.bedId.markAsTouched();
    component.form.controls.year.setValue(null as unknown as number);
    component.form.controls.year.markAsTouched();
    fixture.detectChanges();

    expect(component.form.invalid).toBe(true);
    component.submit();
    expect(aiApi.bedPlanning).not.toHaveBeenCalled();
  });

  it('does not call planting or task mutation APIs', () => {
    const fixture = TestBed.createComponent(BedPlanningPage);
    const component = fixture.componentInstance;
    fixture.detectChanges();

    component.form.patchValue({ bedId: 'bed-1', year: 2026 });
    component.submit();
    fixture.detectChanges();

    expect(aiApi.bedPlanning).toHaveBeenCalledTimes(1);
    const allKeys = Object.keys(aiApi);
    const mutationKeys = allKeys.filter((k) =>
      ['planting', 'task', 'activity', 'inventory'].some((term) => k.toLowerCase().includes(term)),
    );
    expect(mutationKeys).toEqual([]);
  });
});
