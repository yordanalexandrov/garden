import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  OnInit,
  inject,
  signal,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormBuilder, FormControl, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSelectModule } from '@angular/material/select';

import { mapApiError } from '../../../../core/errors/api-error.mapper';
import { ApiErrorSummary } from '../../../../shared/forms/api-error-summary/api-error-summary';
import { PageHeader } from '../../../../shared/components/page-header/page-header';
import { PlantListItem } from '../../../plants/plants.models';
import { PlantsApiService } from '../../../plants/plants-api.service';
import { ProductListItem } from '../../../products/products.models';
import { ProductsApiService } from '../../../products/products-api.service';
import {
  AcceptSuggestionResult,
  AiGenerationResult,
  AiSuggestionDto,
  AiSuggestionStatus,
  AiSuggestionUiState,
  ProductRuleSuggestionPayload,
} from '../../ai.models';
import { AiApiService } from '../../data-access/ai-api.service';
import { AiSuggestionCard, AiSuggestionAcceptEvent, AiSuggestionRejectEvent } from '../../components/ai-suggestion-card/ai-suggestion-card';

@Component({
  selector: 'app-product-ingestion-page',
  imports: [
    ApiErrorSummary,
    AiSuggestionCard,
    MatButtonModule,
    MatFormFieldModule,
    MatIconModule,
    MatInputModule,
    MatProgressSpinnerModule,
    MatSelectModule,
    PageHeader,
    ReactiveFormsModule,
  ],
  templateUrl: './product-ingestion-page.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ProductIngestionPage implements OnInit {
  private readonly aiApi = inject(AiApiService);
  private readonly fb = inject(FormBuilder);
  private readonly productsApi = inject(ProductsApiService);
  private readonly plantsApi = inject(PlantsApiService);
  private readonly destroyRef = inject(DestroyRef);

  readonly form = this.fb.group({
    productName: ['', Validators.required],
    labelText: [''],
  });

  readonly submitting = signal(false);
  readonly sessionError = signal<ReturnType<typeof mapApiError> | null>(null);
  readonly result = signal<AiGenerationResult | null>(null);
  readonly suggestionStates = signal<AiSuggestionUiState[]>([]);

  // Account context used to resolve a product_rule suggestion's target rows to
  // concrete ids before acceptance (no manual UUID entry / JSON editing).
  readonly products = signal<readonly ProductListItem[]>([]);
  readonly plants = signal<readonly PlantListItem[]>([]);
  readonly productControl = new FormControl<string | null>(null);
  readonly plantSelections = signal<Record<string, string | null>>({});

  get warnings(): readonly string[] {
    return this.result()?.warnings ?? [];
  }

  ngOnInit(): void {
    this.productsApi
      .list({ page: 1, pageSize: 200 })
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({ next: (res) => this.products.set(res.items) });

    this.plantsApi
      .list({ page: 1, pageSize: 200 })
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({ next: (res) => this.plants.set(res.items) });
  }

  isProductRule(suggestion: AiSuggestionDto): boolean {
    return suggestion.suggestionType === 'product_rule';
  }

  plantLabel(plant: PlantListItem): string {
    return plant.variety ? `${plant.commonName} — ${plant.variety}` : plant.commonName;
  }

  selectedPlantId(suggestionId: string): string | null {
    return this.plantSelections()[suggestionId] ?? null;
  }

  setSelectedPlantId(suggestionId: string, plantId: string): void {
    this.plantSelections.update((selections) => ({ ...selections, [suggestionId]: plantId }));
  }

  submit(): void {
    if (this.form.invalid || this.submitting()) return;

    this.submitting.set(true);
    this.sessionError.set(null);
    this.result.set(null);
    this.suggestionStates.set([]);

    const { productName, labelText } = this.form.getRawValue();

    this.aiApi
      .productIngestion({
        productName: productName ?? undefined,
        labelText: labelText || undefined,
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
          this.prefillPlantSelections(res.suggestions);
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

    const request = this.buildAcceptRequest(event);

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
          this.captureCreatedProductId(res);
        },
        error: (err: unknown) => {
          this.updateState(event.suggestionId, { status: 'error', error: err });
        },
      });
  }

  // For a product_rule suggestion, merge the resolved productId/plantId into the
  // payload so acceptance targets concrete rows without manual JSON editing.
  private buildAcceptRequest(event: AiSuggestionAcceptEvent): { editedPayload?: unknown } {
    const state = this.suggestionStates().find((s) => s.suggestion.id === event.suggestionId);

    if (state === undefined || !this.isProductRule(state.suggestion)) {
      return event.editedPayload !== undefined ? { editedPayload: event.editedPayload } : {};
    }

    const base =
      event.editedPayload !== undefined && typeof event.editedPayload === 'object' && event.editedPayload !== null
        ? (event.editedPayload as Record<string, unknown>)
        : { ...(state.suggestion.payload as Record<string, unknown>) };

    const merged: Record<string, unknown> = { ...base };
    const productId = this.productControl.value;
    const plantId = this.selectedPlantId(event.suggestionId);

    if (productId) merged['productId'] = productId;
    if (plantId) merged['plantId'] = plantId;

    return { editedPayload: merged };
  }

  // After a product suggestion is accepted, default the rule product select to it.
  private captureCreatedProductId(result: AcceptSuggestionResult): void {
    const created = result.createdEntities.find((entity) => entity.entityType === 'product');

    if (created !== undefined && !this.productControl.value) {
      this.productControl.setValue(created.entityId);
    }
  }

  private prefillPlantSelections(suggestions: readonly AiSuggestionDto[]): void {
    const selections: Record<string, string | null> = {};

    for (const suggestion of suggestions) {
      if (suggestion.suggestionType !== 'product_rule') continue;

      const payload = suggestion.payload as ProductRuleSuggestionPayload;
      const match = this.matchPlantByName(payload.plantName);
      selections[suggestion.id] = match?.id ?? null;
    }

    this.plantSelections.set(selections);
  }

  private matchPlantByName(name: string | undefined): PlantListItem | undefined {
    if (!name) return undefined;

    const needle = name.trim().toLowerCase();
    if (needle.length === 0) return undefined;

    return this.plants().find((plant) => {
      const common = plant.commonName.toLowerCase();
      const variety = plant.variety?.toLowerCase() ?? '';
      return common === needle || variety === needle || common.includes(needle) || needle.includes(common);
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
