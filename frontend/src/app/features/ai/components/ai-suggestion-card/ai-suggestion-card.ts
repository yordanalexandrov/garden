import {
  ChangeDetectionStrategy,
  Component,
  EventEmitter,
  Input,
  OnChanges,
  Output,
  SimpleChanges,
  inject,
  signal,
} from '@angular/core';
import { FormControl } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatChipsModule } from '@angular/material/chips';
import { MatDialog } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';

import { mapApiError } from '../../../../core/errors/api-error.mapper';
import { ApiErrorSummary } from '../../../../shared/forms/api-error-summary/api-error-summary';
import {
  AcceptSuggestionResult,
  AiEntityRef,
  AiSuggestionDto,
  AiSuggestionStatus,
} from '../../ai.models';
import { AiPayloadDialog, AiPayloadDialogData } from '../ai-payload-dialog/ai-payload-dialog';

// Technical identifiers/flags resolved server-side: kept in the JSON payload
// (and the JSON modal) but hidden from the human-readable key/value view.
const HIDDEN_PAYLOAD_KEYS = new Set(['productId', 'plantId', 'ruleId', 'operation']);

export interface AiSuggestionAcceptEvent {
  readonly suggestionId: string;
  readonly editedPayload?: unknown;
}

export interface AiSuggestionRejectEvent {
  readonly suggestionId: string;
}

@Component({
  selector: 'app-ai-suggestion-card',
  imports: [ApiErrorSummary, MatButtonModule, MatCardModule, MatChipsModule, MatIconModule],
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

  private readonly dialog = inject(MatDialog);

  readonly editPayloadControl = new FormControl<string>('');
  readonly mappedError = signal<ReturnType<typeof mapApiError> | null>(null);
  private originalPayloadJson = '';

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
          this.originalPayloadJson = JSON.stringify(payload, null, 2);
          this.editPayloadControl.setValue(this.originalPayloadJson);
        } catch {
          this.originalPayloadJson = '';
          this.editPayloadControl.setValue('');
        }
      }
    }
  }

  /** True once the user has changed the payload JSON away from the AI's original. */
  get isPayloadEdited(): boolean {
    return (this.editPayloadControl.value ?? '') !== this.originalPayloadJson;
  }

  openPayloadDialog(): void {
    if (this.isActing || this.isAccepted || this.isRejected) return;

    this.dialog
      .open<AiPayloadDialog, AiPayloadDialogData, string | undefined>(AiPayloadDialog, {
        data: { payloadJson: this.editPayloadControl.value ?? '', editable: true },
        autoFocus: false,
      })
      .afterClosed()
      .subscribe((result) => {
        if (result !== undefined) {
          this.editPayloadControl.setValue(result);
        }
      });
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

  get payloadEntries(): { key: string; value: unknown }[] {
    return Object.entries(this.payloadAsRecord)
      .filter(([key]) => !HIDDEN_PAYLOAD_KEYS.has(key))
      .map(([key, value]) => ({ key, value }));
  }

  /** "Ново правило" / "Опресняване" for product-rule generation suggestions, else null. */
  get operationLabel(): string | null {
    const operation = this.payloadAsRecord['operation'];
    if (operation === 'create') return 'Ново правило';
    if (operation === 'update') return 'Опресняване';
    return null;
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
