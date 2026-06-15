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
  AcceptSuggestionResult,
  AiGenerationResult,
  AiSuggestionDto,
  AiSuggestionStatus,
  AiSuggestionUiState,
} from '../../ai.models';
import { AiApiService } from '../../data-access/ai-api.service';
import {
  AiSuggestionCard,
  AiSuggestionAcceptEvent,
  AiSuggestionRejectEvent,
} from '../../components/ai-suggestion-card/ai-suggestion-card';

@Component({
  selector: 'app-plant-ingestion-page',
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
  templateUrl: './plant-ingestion-page.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PlantIngestionPage {
  private readonly aiApi = inject(AiApiService);
  private readonly fb = inject(FormBuilder);
  private readonly destroyRef = inject(DestroyRef);

  readonly form = this.fb.group({
    plantName: ['', Validators.required],
    notes: [''],
  });

  readonly submitting = signal(false);
  readonly sessionError = signal<ReturnType<typeof mapApiError> | null>(null);
  readonly result = signal<AiGenerationResult | null>(null);
  readonly suggestionStates = signal<AiSuggestionUiState[]>([]);

  get warnings(): readonly string[] {
    return this.result()?.warnings ?? [];
  }

  submit(): void {
    if (this.form.invalid || this.submitting()) return;

    this.submitting.set(true);
    this.sessionError.set(null);
    this.result.set(null);
    this.suggestionStates.set([]);

    const { plantName, notes } = this.form.getRawValue();

    this.aiApi
      .plantIngestion({
        plantName: plantName ?? '',
        ...(notes ? { notes } : {}),
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

    const request =
      event.editedPayload !== undefined ? { editedPayload: event.editedPayload } : {};

    this.aiApi
      .acceptSuggestion(event.suggestionId, request)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (res: AcceptSuggestionResult) => {
          this.updateState(event.suggestionId, {
            status: 'accepted',
            acceptResult: res,
            error: null,
          });
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

  getState(suggestion: AiSuggestionDto): AiSuggestionUiState | undefined {
    return this.suggestionStates().find((s) => s.suggestion.id === suggestion.id);
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
