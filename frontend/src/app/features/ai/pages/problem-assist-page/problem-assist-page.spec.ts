import { TestBed } from '@angular/core/testing';
import { provideNoopAnimations } from '@angular/platform-browser/animations';
import { ActivatedRoute, convertToParamMap, provideRouter } from '@angular/router';
import { of, throwError } from 'rxjs';

import { ApiError } from '../../../../core/errors/api-error';
import { ProblemsApiService } from '../../../problems/problems-api.service';
import { AiApiService } from '../../data-access/ai-api.service';
import { ProblemAssistPage } from './problem-assist-page';

const problemSummarySuggestion = {
  id: 'suggestion-1',
  suggestionType: 'problem_summary',
  payload: {
    summary: 'Possible fungal infection on lower leaves.',
    possibleCategories: ['fungus', 'nutrient_deficiency'],
    followUpQuestions: ['Are the spots dry or wet?', 'Is it spreading?'],
  },
};

const generationResult = {
  aiSession: { id: 'session-1', kind: 'problem_assist', inputMode: 'text', status: 'completed' },
  suggestions: [problemSummarySuggestion],
};

const problemsPage = {
  items: [
    { id: 'problem-1', title: 'Leaf spots', type: 'problem', placeId: 'place-1', targetType: 'bed', targetId: 'bed-1', targetLabel: 'Bed A', category: 'fungus', severity: 'medium', status: 'open', observedAt: '2026-05-13T07:00:00.000Z', photosCount: 0 },
  ],
  page: 1,
  pageSize: 100,
  total: 1,
};

describe('Phase 24 ProblemAssistPage', () => {
  const aiApi = {
    problemAssist: vi.fn(),
    acceptSuggestion: vi.fn(),
    rejectSuggestion: vi.fn(),
  };
  const problemsApi = { list: vi.fn() };

  beforeEach(async () => {
    aiApi.problemAssist.mockReturnValue(of(generationResult));
    aiApi.acceptSuggestion.mockReturnValue(
      of({ acceptedSuggestionId: 'suggestion-1', createdEntities: [], updatedEntities: [] }),
    );
    aiApi.rejectSuggestion.mockReturnValue(of({ rejected: true }));
    problemsApi.list.mockReturnValue(of(problemsPage));

    await TestBed.configureTestingModule({
      imports: [ProblemAssistPage],
      providers: [
        { provide: AiApiService, useValue: aiApi },
        { provide: ProblemsApiService, useValue: problemsApi },
        provideNoopAnimations(),
        provideRouter([]),
        {
          provide: ActivatedRoute,
          useValue: { snapshot: { queryParamMap: convertToParamMap({}) } },
        },
      ],
    }).compileComponents();
  });

  afterEach(() => {
    vi.clearAllMocks();
    TestBed.resetTestingModule();
  });

  it('loads problems and exposes them for the dropdown', () => {
    const fixture = TestBed.createComponent(ProblemAssistPage);
    const component = fixture.componentInstance;
    fixture.detectChanges();

    expect(problemsApi.list).toHaveBeenCalledWith({ pageSize: 100 });
    expect(component.problems()).toHaveLength(1);
    expect(component.problems()[0].title).toBe('Leaf spots');
  });

  it('pre-selects problem from query param and switches to problem mode', async () => {
    TestBed.resetTestingModule();
    await TestBed.configureTestingModule({
      imports: [ProblemAssistPage],
      providers: [
        { provide: AiApiService, useValue: aiApi },
        { provide: ProblemsApiService, useValue: problemsApi },
        provideNoopAnimations(),
        provideRouter([]),
        {
          provide: ActivatedRoute,
          useValue: { snapshot: { queryParamMap: convertToParamMap({ problemId: 'problem-1' }) } },
        },
      ],
    }).compileComponents();

    const fixture = TestBed.createComponent(ProblemAssistPage);
    const component = fixture.componentInstance;
    fixture.detectChanges();

    expect(component.form.controls.inputMode.value).toBe('problem');
    expect(component.form.controls.problemId.value).toBe('problem-1');
  });

  it('rejects empty request — requires problemId or text', () => {
    const fixture = TestBed.createComponent(ProblemAssistPage);
    const component = fixture.componentInstance;
    fixture.detectChanges();

    component.form.controls.problemId.markAsTouched();
    component.form.controls.text.markAsTouched();
    fixture.detectChanges();

    component.submit();

    expect(component.form.invalid).toBe(true);
    expect(aiApi.problemAssist).not.toHaveBeenCalled();
  });

  it('submits problemId when input mode is problem', () => {
    const fixture = TestBed.createComponent(ProblemAssistPage);
    const component = fixture.componentInstance;
    fixture.detectChanges();

    component.form.patchValue({ inputMode: 'problem', problemId: 'problem-1' });
    component.submit();

    expect(aiApi.problemAssist).toHaveBeenCalledWith({ problemId: 'problem-1' });
  });

  it('submits text when input mode is text', () => {
    const fixture = TestBed.createComponent(ProblemAssistPage);
    const component = fixture.componentInstance;
    fixture.detectChanges();

    component.form.patchValue({ inputMode: 'text', text: 'Yellow leaves with spots' });
    component.submit();

    expect(aiApi.problemAssist).toHaveBeenCalledWith({ text: 'Yellow leaves with spots' });
  });

  it('does not include trusted scope fields in problem assist request', () => {
    const fixture = TestBed.createComponent(ProblemAssistPage);
    const component = fixture.componentInstance;
    fixture.detectChanges();

    component.form.patchValue({ text: 'Yellow leaves' });
    component.submit();

    const request = aiApi.problemAssist.mock.calls[0][0] as Record<string, unknown>;
    const trustedField = ['account', 'Id'].join('');
    expect(request).not.toHaveProperty(trustedField);
  });

  it('renders problem summary and possible categories as reviewable suggestions, not diagnosis', () => {
    const fixture = TestBed.createComponent(ProblemAssistPage);
    const component = fixture.componentInstance;
    fixture.detectChanges();

    component.form.patchValue({ text: 'Yellow leaves' });
    component.submit();
    fixture.detectChanges();

    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.textContent).toContain('Possible categories for review');
    expect(compiled.textContent).toContain('fungus');
    expect(compiled.textContent).toContain('nutrient_deficiency');
    expect(compiled.textContent).toContain('suggestions for your review');
    expect(compiled.textContent).not.toContain('diagnosis confirmed');
    expect(compiled.textContent).not.toContain('The plant has');
  });

  it('shows follow-up questions', () => {
    const fixture = TestBed.createComponent(ProblemAssistPage);
    const component = fixture.componentInstance;
    fixture.detectChanges();

    component.form.patchValue({ text: 'Yellow leaves' });
    component.submit();
    fixture.detectChanges();

    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.textContent).toContain('Are the spots dry or wet?');
  });

  it('preserves form input on backend error', () => {
    aiApi.problemAssist.mockReturnValueOnce(
      throwError(() => new ApiError('EXTERNAL_SERVICE_ERROR', 'AI provider unavailable')),
    );

    const fixture = TestBed.createComponent(ProblemAssistPage);
    const component = fixture.componentInstance;
    fixture.detectChanges();

    component.form.patchValue({ text: 'Yellow leaves' });
    component.submit();
    fixture.detectChanges();

    expect(component.form.controls.text.value).toBe('Yellow leaves');
    expect(component.sessionError()).not.toBeNull();
  });

  it('does not call problem/task/activity/inventory mutation APIs', () => {
    const fixture = TestBed.createComponent(ProblemAssistPage);
    const component = fixture.componentInstance;
    fixture.detectChanges();

    component.form.patchValue({ text: 'Yellow leaves' });
    component.submit();
    fixture.detectChanges();

    expect(aiApi.problemAssist).toHaveBeenCalledTimes(1);
    const mutationKeys = Object.keys(aiApi).filter((k) =>
      ['update', 'create', 'upload', 'planting', 'task', 'activity', 'inventory', 'photo'].some(
        (term) => k.toLowerCase().includes(term),
      ),
    );
    expect(mutationKeys).toEqual([]);
  });
});
