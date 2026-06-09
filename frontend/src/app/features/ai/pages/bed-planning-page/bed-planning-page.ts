import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  inject,
  signal,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';

import { mapApiError } from '../../../../core/errors/api-error.mapper';
import { ApiErrorSummary } from '../../../../shared/forms/api-error-summary/api-error-summary';
import { PageHeader } from '../../../../shared/components/page-header/page-header';
import {
  AiGenerationResult,
  AiSuggestionStatus,
  AiSuggestionUiState,
  BedPlanSuggestionPayload,
  AcceptSuggestionResult,
} from '../../ai.models';
import { AiApiService } from '../../data-access/ai-api.service';
import { AiSuggestionCard, AiSuggestionAcceptEvent, AiSuggestionRejectEvent } from '../../components/ai-suggestion-card/ai-suggestion-card';

@Component({
  selector: 'app-bed-planning-page',
  imports: [
    ApiErrorSummary,
    AiSuggestionCard,
    MatButtonModule,
    MatFormFieldModule,
    MatIconModule,
    MatInputModule,
    MatProgressSpinnerModule,
    PageHeader,
    ReactiveFormsModule,
  ],
  templateUrl: './bed-planning-page.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BedPlanningPage {
  private readonly aiApi = inject(AiApiService);
  private readonly fb = inject(FormBuilder);
  private readonly destroyRef = inject(DestroyRef);

  readonly form = this.fb.group({
    bedId: ['', Validators.required],
    year: [new Date().getFullYear(), [Validators.required, Validators.min(2000), Validators.max(2100)]],
    candidatePlantIds: [''],
    notes: [''],
  });

  readonly submitting = signal(false);
  readonly sessionError = signal<ReturnType<typeof mapApiError> | null>(null);
  readonly result = signal<AiGenerationResult | null>(null);
  readonly suggestionStates = signal<AiSuggestionUiState[]>([]);

  get warnings(): readonly string[] {
    return this.result()?.warnings ?? [];
  }

  bedPlanPayload(state: AiSuggestionUiState): BedPlanSuggestionPayload | null {
    if (state.suggestion.suggestionType !== 'bed_plan') return null;
    const p = state.suggestion.payload;
    if (p && typeof p === 'object' && !Array.isArray(p)) {
      return p as BedPlanSuggestionPayload;
    }
    return null;
  }

  submit(): void {
    if (this.form.invalid || this.submitting()) return;

    this.submitting.set(true);
    this.sessionError.set(null);
    this.result.set(null);
    this.suggestionStates.set([]);

    const { bedId, year, candidatePlantIds, notes } = this.form.getRawValue();
    const plantIds = (candidatePlantIds ?? '')
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean);

    this.aiApi
      .bedPlanning({
        bedId: bedId!,
        year: year!,
        candidatePlantIds: plantIds,
        notes: notes || undefined,
      })
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (res) => {
          this.result.set(res);
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

  onAccept(event: AiSuggestionAcceptEvent): void {
    this.updateState(event.suggestionId, { status: 'accepting', error: null });

    const request = event.editedPayload !== undefined ? { editedPayload: event.editedPayload } : {};

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

  private updateState(
    suggestionId: string,
    patch: Partial<Omit<AiSuggestionUiState, 'suggestion' | 'editedPayload'>>,
  ): void {
    this.suggestionStates.update((states) =>
      states.map((s) => (s.suggestion.id === suggestionId ? { ...s, ...patch } : s)),
    );
  }
}
