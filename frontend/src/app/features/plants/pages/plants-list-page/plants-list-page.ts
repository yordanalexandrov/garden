import { ChangeDetectionStrategy, Component, DestroyRef, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormControl, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { RouterLink } from '@angular/router';

import { ApiError } from '../../../../core/errors/api-error';
import { mapApiError } from '../../../../core/errors/api-error.mapper';
import { EmptyState } from '../../../../shared/components/empty-state/empty-state';
import { PageHeader } from '../../../../shared/components/page-header/page-header';
import { ApiErrorSummary } from '../../../../shared/forms/api-error-summary/api-error-summary';
import {
  GrowingStyle,
  LifecycleType,
  PLANT_GROWING_STYLES,
  PLANT_LIFECYCLE_TYPES,
  PlantListItem,
} from '../../plants.models';
import { PlantsApiService } from '../../plants-api.service';

type PlantFilterForm = FormGroup<{
  q: FormControl<string>;
  lifecycleType: FormControl<LifecycleType | ''>;
  growingStyle: FormControl<GrowingStyle | ''>;
  includeArchived: FormControl<boolean>;
}>;

@Component({
  selector: 'app-plants-list-page',
  imports: [
    ApiErrorSummary,
    EmptyState,
    MatButtonModule,
    MatCardModule,
    MatCheckboxModule,
    MatFormFieldModule,
    MatIconModule,
    MatInputModule,
    MatSelectModule,
    PageHeader,
    ReactiveFormsModule,
    RouterLink,
  ],
  templateUrl: './plants-list-page.html',
  styleUrl: './plants-list-page.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PlantsListPage {
  readonly lifecycleTypes = PLANT_LIFECYCLE_TYPES;
  readonly growingStyles = PLANT_GROWING_STYLES;
  readonly plants = signal<readonly PlantListItem[]>([]);
  readonly loading = signal(false);
  readonly error = signal<ApiError | null>(null);

  readonly filters: PlantFilterForm = new FormGroup({
    q: new FormControl('', { nonNullable: true }),
    lifecycleType: new FormControl<LifecycleType | ''>('', { nonNullable: true }),
    growingStyle: new FormControl<GrowingStyle | ''>('', { nonNullable: true }),
    includeArchived: new FormControl(false, { nonNullable: true }),
  });

  private readonly plantsApi = inject(PlantsApiService);
  private readonly destroyRef = inject(DestroyRef);

  constructor() {
    this.search();
  }

  search(): void {
    const filters = this.filters.getRawValue();
    this.loading.set(true);
    this.error.set(null);

    this.plantsApi
      .list({
        q: filters.q.trim() || undefined,
        lifecycleType: filters.lifecycleType || undefined,
        growingStyle: filters.growingStyle || undefined,
        includeArchived: filters.includeArchived,
        page: 1,
        pageSize: 20,
      })
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (result) => {
          this.plants.set(result.items);
          this.loading.set(false);
        },
        error: (error: unknown) => {
          this.error.set(mapApiError(error));
          this.loading.set(false);
        },
      });
  }

  displayPlant(plant: PlantListItem): string {
    return plant.variety === null || plant.variety.trim().length === 0
      ? plant.commonName
      : `${plant.commonName} (${plant.variety})`;
  }
}
