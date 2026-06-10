import {
  ChangeDetectionStrategy,
  Component,
  EventEmitter,
  Input,
  OnChanges,
  Output,
  SimpleChanges,
  signal,
} from '@angular/core';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatChipsModule } from '@angular/material/chips';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';

import { mapApiError } from '../../../../core/errors/api-error.mapper';
import { ApiErrorSummary } from '../../../../shared/forms/api-error-summary/api-error-summary';
import {
  AcceptSuggestionResult,
  AiEntityRef,
  AiSuggestionDto,
  AiSuggestionStatus,
} from '../../ai.models';

export interface AiSuggestionAcceptEvent {
  readonly suggestionId: string;
  readonly editedPayload?: unknown;
}

export interface AiSuggestionRejectEvent {
  readonly suggestionId: string;
}

@Component({
  selector: 'app-ai-suggestion-card',
  imports: [
    ApiErrorSummary,
    MatButtonModule,
    MatCardModule,
    MatChipsModule,
    MatFormFieldModule,
    MatIconModule,
    MatInputModule,
    ReactiveFormsModule,
  ],
  templateUrl: './ai-suggestion-card.html',
  styleUrl: './ai-suggestion-card.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AiSuggestionCard implements OnChanges {
  @Input({ required: true }) suggestion!: AiSuggestionDto;
  @Input() status: AiSuggestionStatus = 'unaccepted';
  @Input() error: unknown | null = null;
  @Input() acceptResult: AcceptSuggestionResult | null = null;
  @Input() warnings: readonly string[] = [];

  @Output() readonly accept = new EventEmitter<AiSuggestionAcceptEvent>();
  @Output() readonly reject = new EventEmitter<AiSuggestionRejectEvent>();

  readonly editPayloadControl = new FormControl<string>('');
  readonly mappedError = signal<ReturnType<typeof mapApiError> | null>(null);

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['error'] && this.error !== null) {
      this.mappedError.set(mapApiError(this.error));
    } else if (changes['error'] && this.error === null) {
      this.mappedError.set(null);
    }

    if (changes['suggestion'] && this.suggestion) {
      const payload = this.suggestion.payload;
      if (payload !== null && payload !== undefined) {
        try {
          this.editPayloadControl.setValue(JSON.stringify(payload, null, 2));
        } catch {
          this.editPayloadControl.setValue('');
        }
      }
    }
  }

  get isActing(): boolean {
    return this.status === 'accepting' || this.status === 'rejecting';
  }

  get isAccepted(): boolean {
    return this.status === 'accepted';
  }

  get isRejected(): boolean {
    return this.status === 'rejected';
  }

  get payloadAsRecord(): Record<string, unknown> {
    const p = this.suggestion?.payload;
    if (p && typeof p === 'object' && !Array.isArray(p)) {
      return p as Record<string, unknown>;
    }
    return {};
  }

  get payloadEntries(): Array<{ key: string; value: unknown }> {
    return Object.entries(this.payloadAsRecord).map(([key, value]) => ({ key, value }));
  }

  get createdEntities(): readonly AiEntityRef[] {
    return this.acceptResult?.createdEntities ?? [];
  }

  get updatedEntities(): readonly AiEntityRef[] {
    return this.acceptResult?.updatedEntities ?? [];
  }

  onAccept(): void {
    if (this.isActing || this.isAccepted || this.isRejected) return;

    const raw = this.editPayloadControl.value?.trim();
    let editedPayload: unknown | undefined;

    if (raw) {
      try {
        editedPayload = JSON.parse(raw);
      } catch {
        editedPayload = undefined;
      }
    }

    const event: AiSuggestionAcceptEvent = { suggestionId: this.suggestion.id };
    if (editedPayload !== undefined) {
      (event as { suggestionId: string; editedPayload?: unknown }).editedPayload = editedPayload;
    }

    this.accept.emit(event);
  }

  onReject(): void {
    if (this.isActing || this.isAccepted || this.isRejected) return;

    this.reject.emit({ suggestionId: this.suggestion.id });
  }

  formatValue(value: unknown): string {
    if (value === null || value === undefined) return '—';
    if (typeof value === 'object') return JSON.stringify(value);
    return String(value);
  }
}
