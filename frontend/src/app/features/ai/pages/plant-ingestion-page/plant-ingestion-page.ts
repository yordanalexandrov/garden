import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  inject,
  signal,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import {
  AbstractControl,
  FormBuilder,
  ReactiveFormsModule,
  ValidationErrors,
} from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatRadioModule } from '@angular/material/radio';

import { mapApiError } from '../../../../core/errors/api-error.mapper';
import { ApiErrorSummary } from '../../../../shared/forms/api-error-summary/api-error-summary';
import { PageHeader } from '../../../../shared/components/page-header/page-header';
import { compressImage, fileToDataUrl } from '../../../../shared/utils/image-compression';
import {
  AcceptSuggestionResult,
  AiGenerationResult,
  AiSuggestionDto,
  AiSuggestionStatus,
  AiSuggestionUiState,
  FollowUpQuestion,
  FollowupQuestionsPayload,
  PlantIngestionRequest,
} from '../../ai.models';
import { AiApiService } from '../../data-access/ai-api.service';
import {
  AiSuggestionCard,
  AiSuggestionAcceptEvent,
  AiSuggestionRejectEvent,
} from '../../components/ai-suggestion-card/ai-suggestion-card';

const ALLOWED_PHOTO_MIME_TYPES = ['image/jpeg', 'image/png', 'image/webp'] as const;
const MAX_PHOTO_BYTES = 5 * 1024 * 1024;

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
    MatRadioModule,
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

  /** Compressed photo kept in memory so a refine request can resend it. */
  readonly photoFile = signal<File | null>(null);
  readonly photoPreviewUrl = signal<string | null>(null);
  readonly photoError = signal<string | null>(null);

  private readonly requireNameOrPhoto = (control: AbstractControl): ValidationErrors | null => {
    const plantName = control.get('plantName')?.value?.trim();
    if (!plantName && this.photoFile() === null) {
      return { requireNameOrPhoto: true };
    }
    return null;
  };

  readonly form = this.fb.group(
    {
      plantName: [''],
      group: [''],
      variety: [''],
      notes: [''],
    },
    { validators: this.requireNameOrPhoto },
  );

  readonly submitting = signal(false);
  readonly sessionError = signal<ReturnType<typeof mapApiError> | null>(null);
  readonly result = signal<AiGenerationResult | null>(null);
  readonly suggestionStates = signal<AiSuggestionUiState[]>([]);
  readonly followUpAnswers = signal<Record<number, string>>({});

  get warnings(): readonly string[] {
    return this.result()?.warnings ?? [];
  }

  /** Plant suggestion states; followup_questions are rendered separately. */
  plantSuggestionStates(): AiSuggestionUiState[] {
    return this.suggestionStates().filter(
      (s) => s.suggestion.suggestionType !== 'followup_questions',
    );
  }

  followUpQuestions(): readonly FollowUpQuestion[] {
    const state = this.suggestionStates().find(
      (s) => s.suggestion.suggestionType === 'followup_questions',
    );
    const payload = state?.suggestion.payload as FollowupQuestionsPayload | undefined;
    return payload?.questions ?? [];
  }

  async onPhotoChange(event: Event): Promise<void> {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0] ?? null;
    input.value = '';

    if (file === null) return;

    if (!(ALLOWED_PHOTO_MIME_TYPES as readonly string[]).includes(file.type)) {
      this.photoError.set('Неподдържан формат. Позволени: JPEG, PNG, WebP.');
      return;
    }
    if (file.size > MAX_PHOTO_BYTES) {
      this.photoError.set('Файлът е твърде голям. Максимум 5 MB.');
      return;
    }

    this.photoError.set(null);
    const compressed = await compressImage(file);
    this.replacePhoto(compressed);
    this.form.updateValueAndValidity();
  }

  removePhoto(): void {
    this.replacePhoto(null);
    this.photoError.set(null);
    this.form.updateValueAndValidity();
  }

  submit(): void {
    if (this.form.invalid || this.submitting()) return;

    this.followUpAnswers.set({});
    void this.callPlantIngestion();
  }

  submitFollowUp(): void {
    if (this.form.invalid || this.submitting()) return;

    const questions = this.followUpQuestions();
    const answers = this.followUpAnswers();

    const followUpAnswers = questions
      .map((q, i) => ({ question: q.text, answer: answers[i]?.trim() ?? '' }))
      .filter((a) => a.answer.length > 0);

    this.followUpAnswers.set({});
    void this.callPlantIngestion(followUpAnswers);
  }

  setAnswer(index: number, value: string): void {
    this.followUpAnswers.update((a) => ({ ...a, [index]: value }));
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

  private async callPlantIngestion(
    followUpAnswers?: { question: string; answer: string }[],
  ): Promise<void> {
    this.submitting.set(true);
    this.sessionError.set(null);
    this.result.set(null);
    this.suggestionStates.set([]);

    const { plantName, group, variety, notes } = this.form.getRawValue();

    let photoDataUrl: string | undefined;
    const photo = this.photoFile();
    if (photo !== null) {
      try {
        photoDataUrl = await fileToDataUrl(photo);
      } catch {
        this.photoError.set('Снимката не можа да бъде прочетена. Опитайте с друга.');
        this.submitting.set(false);
        return;
      }
    }

    const request: PlantIngestionRequest = {
      ...(plantName?.trim() ? { plantName: plantName.trim() } : {}),
      ...(group?.trim() ? { group: group.trim() } : {}),
      ...(variety?.trim() ? { variety: variety.trim() } : {}),
      ...(notes?.trim() ? { notes: notes.trim() } : {}),
      ...(photoDataUrl !== undefined ? { photoDataUrl } : {}),
      ...(followUpAnswers !== undefined && followUpAnswers.length > 0
        ? { followUpAnswers }
        : {}),
    };

    this.aiApi
      .plantIngestion(request)
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

  private replacePhoto(file: File | null): void {
    const previous = this.photoPreviewUrl();
    if (previous !== null) {
      URL.revokeObjectURL(previous);
    }
    this.photoFile.set(file);
    this.photoPreviewUrl.set(file !== null ? URL.createObjectURL(file) : null);
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
