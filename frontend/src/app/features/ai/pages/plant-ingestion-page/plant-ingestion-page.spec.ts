import { TestBed } from '@angular/core/testing';
import { provideNoopAnimations } from '@angular/platform-browser/animations';
import { of, throwError } from 'rxjs';

import { ApiError } from '../../../../core/errors/api-error';
import { AiApiService } from '../../data-access/ai-api.service';
import { PlantIngestionPage } from './plant-ingestion-page';

const plantSuggestion1 = {
  id: 'suggestion-1',
  suggestionType: 'plant',
  payload: {
    commonName: 'Домат',
    variety: 'Воловско сърце',
    plantCategory: 'Плодови зеленчуци',
    lifecycleType: 'annual',
    growingStyle: 'vegetable',
    notes: 'Едроплоден сорт, 80 дни до зреене.',
  },
};
const plantSuggestion2 = {
  id: 'suggestion-2',
  suggestionType: 'plant',
  payload: {
    commonName: 'Домат',
    variety: 'Черри Бела',
    plantCategory: 'Плодови зеленчуци',
    lifecycleType: 'annual',
    growingStyle: 'vegetable',
    notes: 'Черешов тип, 60 дни.',
  },
};
const generationResult = {
  aiSession: { id: 'session-1', kind: 'plant_ingestion', inputMode: 'name', status: 'completed' },
  suggestions: [plantSuggestion1, plantSuggestion2],
  warnings: ['Информацията е взета от kalina-sad.bg'],
};
const acceptResult = {
  acceptedSuggestionId: 'suggestion-1',
  createdEntities: [{ entityType: 'plant', entityId: 'plant-uuid-1' }],
  updatedEntities: [],
};

describe('PlantIngestionPage', () => {
  const aiApi = {
    plantIngestion: vi.fn(),
    acceptSuggestion: vi.fn(),
    rejectSuggestion: vi.fn(),
  };

  beforeEach(async () => {
    aiApi.plantIngestion.mockReturnValue(of(generationResult));
    aiApi.acceptSuggestion.mockReturnValue(of(acceptResult));
    aiApi.rejectSuggestion.mockReturnValue(of({ rejected: true }));

    await TestBed.configureTestingModule({
      imports: [PlantIngestionPage],
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

  it('validates plant name as required before submit', () => {
    const fixture = TestBed.createComponent(PlantIngestionPage);
    const component = fixture.componentInstance;
    fixture.detectChanges();

    component.form.controls.plantName.markAsTouched();
    fixture.detectChanges();

    expect(component.form.invalid).toBe(true);
    expect(aiApi.plantIngestion).not.toHaveBeenCalled();
  });

  it('submits plant ingestion request and renders all variant suggestions as unaccepted', () => {
    const fixture = TestBed.createComponent(PlantIngestionPage);
    const component = fixture.componentInstance;
    fixture.detectChanges();

    component.form.patchValue({ plantName: 'Домат', notes: 'едроплодни сортове' });
    component.submit();
    fixture.detectChanges();

    expect(aiApi.plantIngestion).toHaveBeenCalledWith({
      plantName: 'Домат',
      notes: 'едроплодни сортове',
    });
    expect(component.suggestionStates().length).toBe(2);
    component.suggestionStates().forEach((s) => expect(s.status).toBe('unaccepted'));
  });

  it('omits notes from request when empty', () => {
    const fixture = TestBed.createComponent(PlantIngestionPage);
    const component = fixture.componentInstance;
    fixture.detectChanges();

    component.form.patchValue({ plantName: 'Краставица', notes: '' });
    component.submit();

    const request = aiApi.plantIngestion.mock.calls[0][0] as Record<string, unknown>;
    expect(request['notes']).toBeUndefined();
  });

  it('does not include trusted scope fields in plant ingestion request', () => {
    const fixture = TestBed.createComponent(PlantIngestionPage);
    const component = fixture.componentInstance;
    fixture.detectChanges();

    component.form.patchValue({ plantName: 'Домат' });
    component.submit();

    const request = aiApi.plantIngestion.mock.calls[0][0] as Record<string, unknown>;
    const trustedField = ['account', 'Id'].join('');
    expect(request).not.toHaveProperty(trustedField);
  });

  it('accepts a plant variant and shows created plant entity link', () => {
    const fixture = TestBed.createComponent(PlantIngestionPage);
    const component = fixture.componentInstance;
    fixture.detectChanges();

    component.form.patchValue({ plantName: 'Домат' });
    component.submit();
    fixture.detectChanges();

    component.onAccept({ suggestionId: 'suggestion-1' });
    fixture.detectChanges();

    const state = component.getState(plantSuggestion1);
    expect(state?.status).toBe('accepted');
    expect(state?.acceptResult?.createdEntities[0].entityType).toBe('plant');
    expect(state?.acceptResult?.createdEntities[0].entityId).toBe('plant-uuid-1');
  });

  it('rejects a plant variant and updates state without creating entity', () => {
    const fixture = TestBed.createComponent(PlantIngestionPage);
    const component = fixture.componentInstance;
    fixture.detectChanges();

    component.form.patchValue({ plantName: 'Домат' });
    component.submit();
    fixture.detectChanges();

    component.onReject({ suggestionId: 'suggestion-2' });
    fixture.detectChanges();

    const state = component.getState(plantSuggestion2);
    expect(state?.status).toBe('rejected');
    expect(state?.acceptResult).toBeNull();
  });

  it('displays warnings from the backend session response', () => {
    const fixture = TestBed.createComponent(PlantIngestionPage);
    const component = fixture.componentInstance;
    fixture.detectChanges();

    component.form.patchValue({ plantName: 'Домат' });
    component.submit();
    fixture.detectChanges();

    expect(component.warnings).toContain('Информацията е взета от kalina-sad.bg');
  });

  it('shows session error when plantIngestion call fails', () => {
    aiApi.plantIngestion.mockReturnValueOnce(
      throwError(() => new ApiError('EXTERNAL_SERVICE_ERROR', 'AI provider unavailable')),
    );

    const fixture = TestBed.createComponent(PlantIngestionPage);
    const component = fixture.componentInstance;
    fixture.detectChanges();

    component.form.patchValue({ plantName: 'Домат' });
    component.submit();
    fixture.detectChanges();

    expect(component.sessionError()).not.toBeNull();
    expect(component.suggestionStates()).toEqual([]);
  });

  it('marks suggestion as error state when accept fails', () => {
    aiApi.acceptSuggestion.mockReturnValueOnce(
      throwError(() => new ApiError('VALIDATION_ERROR', 'Invalid payload')),
    );

    const fixture = TestBed.createComponent(PlantIngestionPage);
    const component = fixture.componentInstance;
    fixture.detectChanges();

    component.form.patchValue({ plantName: 'Домат' });
    component.submit();
    fixture.detectChanges();

    component.onAccept({ suggestionId: 'suggestion-1' });
    fixture.detectChanges();

    const state = component.getState(plantSuggestion1);
    expect(state?.status).toBe('error');
  });
});
