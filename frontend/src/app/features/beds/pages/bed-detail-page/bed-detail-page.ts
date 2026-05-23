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
import { StatusChip } from '../../../../shared/components/status-chip/status-chip';
import { YearSelector } from '../../../../shared/components/year-selector/year-selector';
import { ApiErrorSummary } from '../../../../shared/forms/api-error-summary/api-error-summary';
import { BedCurrentContentsComponent } from '../../components/bed-current-contents/bed-current-contents';
import { BedForm } from '../../components/bed-form/bed-form';
import { BedDetail, UpdateBedRequest } from '../../beds.models';
import { BedsApiService } from '../../beds-api.service';

@Component({
  selector: 'app-bed-detail-page',
  imports: [
    ApiErrorSummary,
    BedCurrentContentsComponent,
    BedForm,
    MatButtonModule,
    MatCardModule,
    MatIconModule,
    PageHeader,
    RouterLink,
    StatusChip,
    YearSelector,
  ],
  templateUrl: './bed-detail-page.html',
  styleUrl: './bed-detail-page.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BedDetailPage {
  readonly bed = signal<BedDetail | null>(null);
  readonly bedId = signal<string | null>(null);
  readonly selectedYear = signal(new Date().getFullYear());
  readonly loading = signal(false);
  readonly saving = signal(false);
  readonly formOpen = signal(false);
  readonly apiError = signal<ApiError | null>(null);

  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly bedsApi = inject(BedsApiService);
  private readonly archiveConfirmation = inject(ArchiveConfirmationService);
  private readonly snackbar = inject(SnackbarService);
  private readonly destroyRef = inject(DestroyRef);

  constructor() {
    this.route.paramMap.pipe(takeUntilDestroyed(this.destroyRef)).subscribe((params) => {
      this.bedId.set(params.get('bedId'));
      this.loadBed();
    });

    this.route.queryParamMap.pipe(takeUntilDestroyed(this.destroyRef)).subscribe((params) => {
      const rawYear = params.get('year');
      const year = rawYear === null ? new Date().getFullYear() : Number(rawYear);
      this.selectedYear.set(Number.isFinite(year) ? year : new Date().getFullYear());
      this.loadBed();
    });
  }

  selectYear(year: number): void {
    void this.router.navigate([], {
      relativeTo: this.route,
      queryParams: { year },
      queryParamsHandling: 'merge',
    });
  }

  openForm(): void {
    this.apiError.set(null);
    this.formOpen.set(true);
  }

  closeForm(): void {
    this.formOpen.set(false);
    this.apiError.set(null);
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
          this.closeForm();
          this.loadBed();
        },
        error: (error: unknown) => {
          this.saving.set(false);
          this.apiError.set(mapApiError(error));
        },
      });
  }

  archiveBed(): void {
    const bed = this.bed();

    if (bed === null) {
      return;
    }

    this.archiveConfirmation
      .confirmArchive(bed.name)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((confirmed) => {
        if (!confirmed) {
          return;
        }

        this.bedsApi
          .archive(bed.id)
          .pipe(takeUntilDestroyed(this.destroyRef))
          .subscribe({
            next: () => {
              this.snackbar.showMessage('Bed archived.');
              void this.router.navigate(['/places', bed.placeId, 'beds']);
            },
            error: (error: unknown) => {
              this.apiError.set(mapApiError(error));
            },
          });
      });
  }

  private loadBed(): void {
    const bedId = this.bedId();

    if (bedId === null) {
      return;
    }

    this.loading.set(true);
    this.apiError.set(null);

    this.bedsApi
      .get(bedId, this.selectedYear())
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
