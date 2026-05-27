import { DatePipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, DestroyRef, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { MatCardModule } from '@angular/material/card';
import { ActivatedRoute, RouterLink } from '@angular/router';

import { ApiError } from '../../../../core/errors/api-error';
import { mapApiError } from '../../../../core/errors/api-error.mapper';
import { PageHeader } from '../../../../shared/components/page-header/page-header';
import { ApiErrorSummary } from '../../../../shared/forms/api-error-summary/api-error-summary';
import { ActivitiesApiService } from '../../activities-api.service';
import { ActivityDetail } from '../../activities.models';

@Component({
  selector: 'app-activity-detail-page',
  imports: [ApiErrorSummary, DatePipe, MatCardModule, PageHeader, RouterLink],
  templateUrl: './activity-detail-page.html',
  styleUrl: './activity-detail-page.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ActivityDetailPage {
  readonly activity = signal<ActivityDetail | null>(null);
  readonly loading = signal(false);
  readonly error = signal<ApiError | null>(null);

  private readonly activitiesApi = inject(ActivitiesApiService);
  private readonly route = inject(ActivatedRoute);
  private readonly destroyRef = inject(DestroyRef);

  constructor() {
    this.loadActivity();
  }

  private loadActivity(): void {
    const activityId = this.route.snapshot.paramMap.get('activityId');

    if (!activityId) {
      return;
    }

    this.loading.set(true);
    this.activitiesApi
      .get(activityId)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (activity) => {
          this.activity.set(activity);
          this.loading.set(false);
        },
        error: (error: unknown) => {
          this.error.set(mapApiError(error));
          this.loading.set(false);
        },
      });
  }
}
