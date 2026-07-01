import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  computed,
  inject,
  signal,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { EMPTY, catchError } from 'rxjs';
import { AbstractControl, FormBuilder, ReactiveFormsModule, ValidationErrors, ValidatorFn } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatRadioModule } from '@angular/material/radio';
import { MatSelectModule } from '@angular/material/select';
import { ActivatedRoute } from '@angular/router';

import { mapApiError } from '../../../../core/errors/api-error.mapper';
import { ApiErrorSummary } from '../../../../shared/forms/api-error-summary/api-error-summary';
import { PageHeader } from '../../../../shared/components/page-header/page-header';
import {
  AcceptSuggestionRequest,
  AcceptSuggestionResult,
  AiGenerationResult,
  AiSuggestionStatus,
  AiSuggestionUiState,
  ProblemAssistRequest,
  ProblemSummarySuggestionPayload,
} from '../../ai.models';
import { AiApiService } from '../../data-access/ai-api.service';
import { AiSuggestionCard, AiSuggestionAcceptEvent, AiSuggestionRejectEvent } from '../../components/ai-suggestion-card/ai-suggestion-card';
import { ProblemsApiService } from '../../../problems/problems-api.service';
import { ProblemListItem } from '../../../problems/problems.models';

const requireProblemIdOrText: ValidatorFn = (control: AbstractControl): ValidationErrors | null => {
  const problemId = control.get('problemId')?.value?.trim();
  const text = control.get('text')?.value?.trim();
  if (!problemId && !text) {
    return { requireProblemIdOrText: true };
  }
  return null;
};

@Component({
  selector: 'app-problem-assist-page',
  imports: [
    ApiErrorSummary,
    AiSuggestionCard,
    MatButtonModule,
    MatFormFieldModule,
    MatIconModule,
    MatInputModule,
    MatProgressSpinnerModule,
    MatRadioModule,
    MatSelectModule,
    PageHeader,
    ReactiveFormsModule,
  ],
  templateUrl: './problem-assist-page.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ProblemAssistPage {
  private readonly aiApi = inject(AiApiService);
  private readonly fb = inject(FormBuilder);
  private readonly destroyRef = inject(DestroyRef);
  private readonly problemsApi = inject(ProblemsApiService);
  private readonly route = inject(ActivatedRoute);

  readonly problems = signal<readonly ProblemListItem[]>([]);
  readonly submitting = signal(false);
  readonly sessionError = signal<ReturnType<typeof mapApiError> | null>(null);
  readonly result = signal<AiGenerationResult | null>(null);
  readonly suggestionStates = signal<AiSuggestionUiState[]>([]);
  readonly followUpAnswers = signal<Record<number, string>>({});

  /** Selected problem ID for the problem_summary accept flow. */
  readonly acceptProblemId = signal<string | null>(null);
  /** Selected category override for the problem_summary accept flow. */
  readonly acceptCategory = signal<string | null>(null);
  /** Resolved problem list item for the currently selected acceptProblemId. */
  readonly selectedProblem = computed(() => {
    const id = this.acceptProblemId();
    return id ? (this.problems().find((p) => p.id === id) ?? null) : null;
  });

  readonly form = this.fb.group(
    {
      inputMode: ['text'],
      problemId: [''],
      text: [''],
    },
    { validators: requireProblemIdOrText },
  );

  constructor() {
    this.problemsApi
      .list({ pageSize: 100 })
      .pipe(
        takeUntilDestroyed(this.destroyRef),
        catchError(() => EMPTY),
      )
      .subscribe((page) => this.problems.set(page.items));

    const problemId = this.route.snapshot.queryParamMap.get('problemId');
    if (problemId) {
      this.form.patchValue({ inputMode: 'problem', problemId });
    }
  }

  get warnings(): readonly string[] {
    return this.result()?.warnings ?? [];
  }

  problemSummaryPayload(state: AiSuggestionUiState): ProblemSummarySuggestionPayload | null {
    if (state.suggestion.suggestionType !== 'problem_summary') return null;
    const p = state.suggestion.payload;
    if (p && typeof p === 'object' && !Array.isArray(p)) {
      return p as ProblemSummarySuggestionPayload;
    }
    return null;
  }

  currentSummaryPayload(): ProblemSummarySuggestionPayload | null {
    const state = this.suggestionStates().find(
      (s) => s.suggestion.suggestionType === 'problem_summary',
    );
    return state ? this.problemSummaryPayload(state) : null;
  }

  /** Selects a problem for the accept flow and resets the category selection. */
  selectAcceptProblem(problemId: string | null): void {
    this.acceptProblemId.set(problemId);
    this.acceptCategory.set(null);
  }

  setAnswer(index: number, value: string): void {
    this.followUpAnswers.update((a) => ({ ...a, [index]: value }));
  }

  submit(): void {
    if (this.form.invalid || this.submitting()) return;

    const { inputMode, problemId, text } = this.form.getRawValue();
    const request: ProblemAssistRequest =
      inputMode === 'problem'
        ? { problemId: problemId?.trim() || undefined }
        : { text: text?.trim() || undefined };

    this.followUpAnswers.set({});
    this.callProblemAssist(request);
  }

  submitFollowUp(): void {
    if (this.form.invalid || this.submitting()) return;

    const summary = this.currentSummaryPayload();
    const questions = summary?.followUpQuestions ?? [];
    const answers = this.followUpAnswers();

    const followUpAnswers = questions
      .map((q, i) => ({ question: q.text, answer: answers[i] ?? '' }))
      .filter((a) => a.answer.length > 0);

    const { inputMode, problemId, text } = this.form.getRawValue();
    const base: ProblemAssistRequest =
      inputMode === 'problem'
        ? { problemId: problemId?.trim() || undefined }
        : { text: text?.trim() || undefined };

    this.followUpAnswers.set({});
    this.callProblemAssist({ ...base, followUpAnswers });
  }

  onAccept(event: AiSuggestionAcceptEvent): void {
    const state = this.suggestionStates().find((s) => s.suggestion.id === event.suggestionId);
    const isSummary = state?.suggestion.suggestionType === 'problem_summary';

    const request: AcceptSuggestionRequest = {
      ...(event.editedPayload !== undefined ? { editedPayload: event.editedPayload } : {}),
      ...(isSummary && this.acceptProblemId() ? { problemId: this.acceptProblemId()! } : {}),
      ...(isSummary && this.acceptCategory() ? { acceptedCategory: this.acceptCategory()! } : {}),
    };

    this.updateState(event.suggestionId, { status: 'accepting', error: null });

    this.aiApi
      .acceptSuggestion(event.suggestionId, request)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (res: AcceptSuggestionResult) => {
          this.updateState(event.suggestionId, { status: 'accepted', acceptResult: res, error: null });
        },
        error: (err: unknown) => {
          this.updateState(event.suggestionId, { status: 'error', error: err });
        },
      });
  }

  onReject(event: AiSuggestionRejectEvent): void {
    this.updateState(event.suggestionId, { status: 'rejecting', error: null });

    this.aiApi
      .rejectSuggestion(event.suggestionId)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => {
          this.updateState(event.suggestionId, { status: 'rejected', error: null });
        },
        error: (err: unknown) => {
          this.updateState(event.suggestionId, { status: 'error', error: err });
        },
      });
  }

  private callProblemAssist(request: ProblemAssistRequest): void {
    this.submitting.set(true);
    this.sessionError.set(null);
    this.result.set(null);
    this.suggestionStates.set([]);
    this.acceptProblemId.set(null);
    this.acceptCategory.set(null);

    this.aiApi
      .problemAssist(request)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (res) => {
          this.result.set(res);
          // Pre-select the problem when the user analysed a specific existing problem
          const { inputMode, problemId } = this.form.getRawValue();
          if (inputMode === 'problem' && problemId) {
            this.acceptProblemId.set(problemId);
          }
          this.suggestionStates.set(
            res.suggestions.map((s) => ({
              suggestion: s,
              status: 'unaccepted' as AiSuggestionStatus,
              error: null,
              acceptResult: null,
              editedPayload: null,
            })),
          );
          this.submitting.set(false);
        },
        error: (err: unknown) => {
          this.sessionError.set(mapApiError(err));
          this.submitting.set(false);
        },
      });
  }

  private updateState(
    suggestionId: string,
    patch: Partial<Omit<AiSuggestionUiState, 'suggestion' | 'editedPayload'>>,
  ): void {
    this.suggestionStates.update((states) =>
      states.map((s) => (s.suggestion.id === suggestionId ? { ...s, ...patch } : s)),
    );
  }
}
