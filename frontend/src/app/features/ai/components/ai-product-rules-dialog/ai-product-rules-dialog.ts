import { ChangeDetectionStrategy, Component, DestroyRef, OnInit, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { MatButtonModule } from '@angular/material/button';
import { MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';

import { mapApiError } from '../../../../core/errors/api-error.mapper';
import { ApiErrorSummary } from '../../../../shared/forms/api-error-summary/api-error-summary';
import {
  AcceptSuggestionResult,
  AiGenerationResult,
  AiSuggestionDto,
  AiSuggestionStatus,
  AiSuggestionUiState,
} from '../../ai.models';
import { AiApiService } from '../../data-access/ai-api.service';
import {
  AiSuggestionAcceptEvent,
  AiSuggestionCard,
  AiSuggestionRejectEvent,
} from '../ai-suggestion-card/ai-suggestion-card';

export interface AiProductRulesDialogData {
  readonly productId: string;
  readonly productName?: string;
}

@Component({
  selector: 'app-ai-product-rules-dialog',
  imports: [
    ApiErrorSummary,
    AiSuggestionCard,
    MatButtonModule,
    MatDialogModule,
    MatIconModule,
    MatProgressSpinnerModule,
  ],
  templateUrl: './ai-product-rules-dialog.html',
  styleUrl: './ai-product-rules-dialog.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AiProductRulesDialog implements OnInit {
  readonly data = inject<AiProductRulesDialogData>(MAT_DIALOG_DATA);
  private readonly aiApi = inject(AiApiService);
  private readonly destroyRef = inject(DestroyRef);

  readonly loading = signal(true);
  readonly sessionError = signal<ReturnType<typeof mapApiError> | null>(null);
  readonly result = signal<AiGenerationResult | null>(null);
  readonly suggestionStates = signal<AiSuggestionUiState[]>([]);

  get warnings(): readonly string[] {
    return this.result()?.warnings ?? [];
  }

  ngOnInit(): void {
    this.aiApi
      .productRuleGeneration({ productId: this.data.productId })
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (res) => {
          this.result.set(res);
          this.suggestionStates.set(
            res.suggestions.map((suggestion) => ({
              suggestion,
              status: 'unaccepted' as AiSuggestionStatus,
              error: null,
              acceptResult: null,
              editedPayload: null,
            })),
          );
          this.loading.set(false);
        },
        error: (err: unknown) => {
          this.sessionError.set(mapApiError(err));
          this.loading.set(false);
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
