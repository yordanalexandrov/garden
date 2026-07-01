import { DatePipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, DestroyRef, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormControl, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatOptionModule } from '@angular/material/core';
import { MatSelectModule } from '@angular/material/select';
import { ActivatedRoute, RouterLink } from '@angular/router';

import { ApiError } from '../../../../core/errors/api-error';
import { mapApiError } from '../../../../core/errors/api-error.mapper';
import { EmptyState } from '../../../../shared/components/empty-state/empty-state';
import { PageHeader } from '../../../../shared/components/page-header/page-header';
import { ApiErrorSummary } from '../../../../shared/forms/api-error-summary/api-error-summary';
import { PlacesApiService } from '../../../places/places-api.service';
import { PlaceListItem } from '../../../places/places.models';
import { ProblemsApiService } from '../../problems-api.service';
import { LoadingIndicator } from '../../../../shared/components/loading-indicator/loading-indicator';
import {
  PROBLEM_CATEGORIES,
  PROBLEM_STATUSES,
  PROBLEM_TYPES,
  ProblemCategory,
  ProblemListItem,
  ProblemStatus,
  ProblemType,
} from '../../problems.models';

@Component({
  selector: 'app-problems-list-page',
  imports: [
    LoadingIndicator,
    ApiErrorSummary,
    DatePipe,
    EmptyState,
    MatButtonModule,
    MatCardModule,
    MatCheckboxModule,
    MatFormFieldModule,
    MatInputModule,
    MatOptionModule,
    MatSelectModule,
    PageHeader,
    ReactiveFormsModule,
    RouterLink,
  ],
  templateUrl: './problems-list-page.html',
  styleUrl: './problems-list-page.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ProblemsListPage {
  readonly problemTypes = PROBLEM_TYPES;
  readonly problemStatuses = PROBLEM_STATUSES;
  readonly problemCategories = PROBLEM_CATEGORIES;
  readonly problems = signal<readonly ProblemListItem[]>([]);
  readonly places = signal<readonly PlaceListItem[]>([]);
  readonly loading = signal(false);
  readonly error = signal<ApiError | null>(null);
  readonly filters = new FormGroup({
    placeId: new FormControl<string | null>(null),
    type: new FormControl<ProblemType | null>(null),
    status: new FormControl<ProblemStatus | null>(null),
    category: new FormControl<ProblemCategory | null>(null),
    from: new FormControl<string | null>(null),
    to: new FormControl<string | null>(null),
    includeArchived: new FormControl(false, { nonNullable: true }),
  });

  private readonly problemsApi = inject(ProblemsApiService);
  private readonly placesApi = inject(PlacesApiService);
  private readonly route = inject(ActivatedRoute);
  private readonly destroyRef = inject(DestroyRef);

  constructor() {
    const routePlaceId = this.route.parent?.snapshot.paramMap.get('placeId') ?? null;
    if (routePlaceId !== null) {
      this.filters.patchValue({ placeId: routePlaceId });
    }
    this.placesApi
      .list({ page: 1, pageSize: 100 })
      .pipe(takeUntilDestroyed())
      .subscribe((result) => this.places.set(result.items));
    this.search();
  }

  search(): void {
    this.loading.set(true);
    this.error.set(null);
    const value = this.filters.getRawValue();

    this.problemsApi
      .list({
        placeId: value.placeId || undefined,
        type: value.type || undefined,
        status: value.status || undefined,
        category: value.category || undefined,
        from: value.from ? new Date(value.from).toISOString() : undefined,
        to: value.to ? new Date(value.to).toISOString() : undefined,
        includeArchived: value.includeArchived,
        page: 1,
        pageSize: 20,
      })
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (result) => {
          this.problems.set(result.items);
          this.loading.set(false);
        },
        error: (error: unknown) => {
          this.error.set(mapApiError(error));
          this.loading.set(false);
        },
      });
  }
}
