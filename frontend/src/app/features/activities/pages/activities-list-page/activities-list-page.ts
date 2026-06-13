import { DatePipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, DestroyRef, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormControl, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
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
import { ActivitiesApiService } from '../../activities-api.service';
import { ACTIVITY_TYPES, ActivityListItem, ActivityType } from '../../activities.models';
import { LoadingIndicator } from '../../../../shared/components/loading-indicator/loading-indicator';

@Component({
  selector: 'app-activities-list-page',
  imports: [
    LoadingIndicator,
    ApiErrorSummary,
    DatePipe,
    EmptyState,
    MatButtonModule,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatOptionModule,
    MatSelectModule,
    PageHeader,
    ReactiveFormsModule,
    RouterLink,
  ],
  templateUrl: './activities-list-page.html',
  styleUrl: './activities-list-page.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ActivitiesListPage {
  readonly activityTypes = ACTIVITY_TYPES;
  readonly activities = signal<readonly ActivityListItem[]>([]);
  readonly places = signal<readonly PlaceListItem[]>([]);
  readonly loading = signal(false);
  readonly error = signal<ApiError | null>(null);
  readonly filters = new FormGroup({
    placeId: new FormControl<string | null>(null),
    type: new FormControl<ActivityType | null>(null),
    from: new FormControl<string | null>(null),
    to: new FormControl<string | null>(null),
  });

  private readonly activitiesApi = inject(ActivitiesApiService);
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

    this.activitiesApi
      .list({
        placeId: value.placeId || undefined,
        type: value.type || undefined,
        from: value.from || undefined,
        to: value.to || undefined,
        page: 1,
        pageSize: 20,
      })
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (result) => {
          this.activities.set(result.items);
          this.loading.set(false);
        },
        error: (error: unknown) => {
          this.error.set(mapApiError(error));
          this.loading.set(false);
        },
      });
  }
}
