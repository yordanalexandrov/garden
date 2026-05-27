import { DatePipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, DestroyRef, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatOptionModule } from '@angular/material/core';
import { MatSelectModule } from '@angular/material/select';
import { RouterLink } from '@angular/router';

import { ApiError } from '../../../../core/errors/api-error';
import { mapApiError } from '../../../../core/errors/api-error.mapper';
import { PageHeader } from '../../../../shared/components/page-header/page-header';
import { ApiErrorSummary } from '../../../../shared/forms/api-error-summary/api-error-summary';
import { ProductUsageFormArray } from '../../../../shared/forms/product-usage-form-array/product-usage-form-array';
import { BulkTargetIntent, BulkTargetSelector } from '../../../../shared/selectors/bulk-target-selector/bulk-target-selector';
import { PlacesApiService } from '../../../places/places-api.service';
import { PlaceListItem } from '../../../places/places.models';
import { ActivitiesApiService } from '../../activities-api.service';
import {
  ACTIVITY_TYPES,
  ActivityProductUsageRequest,
  ActivityType,
  CreateActivityRequest,
  CreateActivityResult,
  TargetScopeType,
} from '../../activities.models';

function localDateTimeString(): string {
  const now = new Date();
  return new Date(now.getTime() - now.getTimezoneOffset() * 60_000).toISOString().slice(0, 16);
}

@Component({
  selector: 'app-activity-create-page',
  imports: [
    ApiErrorSummary,
    BulkTargetSelector,
    DatePipe,
    MatButtonModule,
    MatCardModule,
    MatCheckboxModule,
    MatFormFieldModule,
    MatInputModule,
    MatOptionModule,
    MatSelectModule,
    PageHeader,
    ProductUsageFormArray,
    ReactiveFormsModule,
    RouterLink,
  ],
  templateUrl: './activity-create-page.html',
  styleUrl: './activity-create-page.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ActivityCreatePage {
  readonly activityTypes = ACTIVITY_TYPES;
  readonly places = signal<readonly PlaceListItem[]>([]);
  readonly reviewOpen = signal(false);
  readonly saving = signal(false);
  readonly error = signal<ApiError | null>(null);
  readonly result = signal<CreateActivityResult | null>(null);
  readonly targetIntent = signal<BulkTargetIntent | null>(null);
  readonly productUsages = signal<readonly ActivityProductUsageRequest[]>([]);
  readonly shortageOverrideVisible = signal(false);

  readonly form = new FormGroup({
    placeId: new FormControl('', { nonNullable: true, validators: [Validators.required] }),
    type: new FormControl<ActivityType>('watering', { nonNullable: true, validators: [Validators.required] }),
    performedAt: new FormControl(localDateTimeString(), {
      nonNullable: true,
      validators: [Validators.required],
    }),
    notes: new FormControl('', { nonNullable: true }),
    allowInventoryShortage: new FormControl(false, { nonNullable: true }),
  });

  private readonly activitiesApi = inject(ActivitiesApiService);
  private readonly placesApi = inject(PlacesApiService);
  private readonly destroyRef = inject(DestroyRef);

  constructor() {
    this.placesApi
      .list({ page: 1, pageSize: 100 })
      .pipe(takeUntilDestroyed())
      .subscribe((result) => this.places.set(result.items));
  }

  selectedPlaceName(): string {
    return this.places().find((place) => place.id === this.form.controls.placeId.value)?.name ?? '';
  }

  updateTargetIntent(intent: BulkTargetIntent): void {
    this.targetIntent.set(intent);
  }

  updateProductUsages(rows: readonly ActivityProductUsageRequest[]): void {
    this.productUsages.set(rows);
  }

  openReview(): void {
    this.form.markAllAsTouched();
    this.error.set(null);

    if (!this.form.valid || !this.targetIntentIsValid()) {
      this.reviewOpen.set(false);
      return;
    }

    this.reviewOpen.set(true);
  }

  submit(): void {
    if (this.saving()) {
      return;
    }

    this.openReview();

    if (!this.reviewOpen()) {
      return;
    }

    this.saving.set(true);
    this.error.set(null);

    this.activitiesApi
      .create(this.buildRequest())
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (result) => {
          this.result.set(result);
          this.saving.set(false);
        },
        error: (error: unknown) => {
          const apiError = mapApiError(error);
          this.error.set(apiError);
          if (apiError.code === 'INVENTORY_SHORTAGE') {
            this.shortageOverrideVisible.set(true);
          }
          this.saving.set(false);
        },
      });
  }

  buildRequest(): CreateActivityRequest {
    const value = this.form.getRawValue();
    const intent = this.targetIntent();

    return {
      placeId: value.placeId,
      type: value.type,
      performedAt: new Date(value.performedAt).toISOString(),
      targetScopeType: intent?.targetScopeType ?? 'whole_place',
      targetSelection: intent?.targetSelection,
      notes: value.notes || null,
      productUsages: this.productUsages(),
      allowInventoryShortage: value.allowInventoryShortage,
    };
  }

  targetIntentIsValid(): boolean {
    const intent = this.targetIntent();

    if (!intent) {
      return false;
    }

    const selectedScopes: readonly TargetScopeType[] = [
      'selected_perennials',
      'selected_beds',
      'single_bed',
      'selected_yearly_plantings',
      'selected_persistent_bed_plants',
    ];

    if (!selectedScopes.includes(intent.targetScopeType)) {
      return true;
    }

    const ids = [
      ...(intent.targetSelection?.perennialIds ?? []),
      ...(intent.targetSelection?.bedIds ?? []),
      ...(intent.targetSelection?.yearlyPlantingIds ?? []),
      ...(intent.targetSelection?.persistentBedPlantIds ?? []),
    ];

    return intent.targetScopeType === 'single_bed' ? ids.length === 1 : ids.length > 0;
  }
}
