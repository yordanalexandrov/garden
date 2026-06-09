import { DatePipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, DestroyRef, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';

import { ApiError } from '../../../../core/errors/api-error';
import { mapApiError } from '../../../../core/errors/api-error.mapper';
import { SnackbarService } from '../../../../core/notifications/snackbar.service';
import { ArchiveConfirmationService } from '../../../../shared/components/confirm-dialog/confirm-dialog';
import { PageHeader } from '../../../../shared/components/page-header/page-header';
import { ApiErrorSummary } from '../../../../shared/forms/api-error-summary/api-error-summary';
import { ActivitiesApiService } from '../../activities-api.service';
import { ActivityDetail } from '../../activities.models';

@Component({
  selector: 'app-activity-detail-page',
  imports: [ApiErrorSummary, DatePipe, MatButtonModule, MatCardModule, MatIconModule, PageHeader, RouterLink],
  templateUrl: './activity-detail-page.html',
  styleUrl: './activity-detail-page.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ActivityDetailPage {
  readonly activity = signal<ActivityDetail | null>(null);
  readonly loading = signal(false);
  readonly archiving = signal(false);
  readonly error = signal<ApiError | null>(null);

  private readonly activitiesApi = inject(ActivitiesApiService);
  private readonly archiveConfirmation = inject(ArchiveConfirmationService);
  private readonly snackbar = inject(SnackbarService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly destroyRef = inject(DestroyRef);

  constructor() {
    this.loadActivity();
  }

  archiveActivity(): void {
    const activity = this.activity();

    if (activity === null) {
      return;
    }

    this.archiveConfirmation
      .confirmArchive(activity.type.replaceAll('_', ' '))
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((confirmed) => {
        if (!confirmed) {
          return;
        }

        this.archiving.set(true);
        this.error.set(null);

        this.activitiesApi
          .archive(activity.id)
          .pipe(takeUntilDestroyed(this.destroyRef))
          .subscribe({
            next: () => {
              this.snackbar.showMessage('Activity archived and inventory reversed.');
              void this.router.navigate(['/activities']);
            },
            error: (err: unknown) => {
              this.error.set(mapApiError(err));
              this.archiving.set(false);
            },
          });
      });
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
