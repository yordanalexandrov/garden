import { ChangeDetectionStrategy, Component, DestroyRef, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';

import { ApiError } from '../../../../core/errors/api-error';
import { mapApiError } from '../../../../core/errors/api-error.mapper';
import { SnackbarService } from '../../../../core/notifications/snackbar.service';
import { LoadingIndicator } from '../../../../shared/components/loading-indicator/loading-indicator';
import { PageHeader } from '../../../../shared/components/page-header/page-header';
import { ApiErrorSummary } from '../../../../shared/forms/api-error-summary/api-error-summary';
import { BedForm } from '../../components/bed-form/bed-form';
import { BedDetail, UpdateBedRequest } from '../../beds.models';
import { BedsApiService } from '../../beds-api.service';

@Component({
  selector: 'app-bed-edit-page',
  imports: [
    ApiErrorSummary,
    BedForm,
    LoadingIndicator,
    MatButtonModule,
    MatCardModule,
    PageHeader,
    RouterLink,
  ],
  templateUrl: './bed-edit-page.html',
  styleUrl: './bed-edit-page.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BedEditPage {
  readonly bed = signal<BedDetail | null>(null);
  readonly bedId = signal<string | null>(null);
  readonly loading = signal(false);
  readonly saving = signal(false);
  readonly apiError = signal<ApiError | null>(null);

  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly bedsApi = inject(BedsApiService);
  private readonly snackbar = inject(SnackbarService);
  private readonly destroyRef = inject(DestroyRef);

  constructor() {
    this.route.paramMap.pipe(takeUntilDestroyed(this.destroyRef)).subscribe((params) => {
      const bedId = params.get('bedId');
      this.bedId.set(bedId);

      if (bedId !== null) {
        this.loadBed(bedId);
      }
    });
  }

  saveBed(request: UpdateBedRequest): void {
    const bedId = this.bedId();

    if (bedId === null) {
      return;
    }

    this.saving.set(true);
    this.apiError.set(null);

    this.bedsApi
      .update(bedId, request)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => {
          this.saving.set(false);
          this.snackbar.showMessage('Bed updated.');
          void this.router.navigate(['/beds', bedId]);
        },
        error: (error: unknown) => {
          this.saving.set(false);
          this.apiError.set(mapApiError(error));
        },
      });
  }

  cancel(): void {
    const bedId = this.bedId();
    void this.router.navigate(bedId === null ? ['/places'] : ['/beds', bedId]);
  }

  private loadBed(bedId: string): void {
    this.loading.set(true);
    this.apiError.set(null);

    this.bedsApi
      .get(bedId)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (bed) => {
          this.bed.set(bed);
          this.loading.set(false);
        },
        error: (error: unknown) => {
          this.apiError.set(mapApiError(error));
          this.loading.set(false);
        },
      });
  }
}
