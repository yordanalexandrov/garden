import { ChangeDetectionStrategy, Component, DestroyRef, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormControl, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { ActivatedRoute, RouterLink } from '@angular/router';

import { ApiError } from '../../../../core/errors/api-error';
import { mapApiError } from '../../../../core/errors/api-error.mapper';
import { SnackbarService } from '../../../../core/notifications/snackbar.service';
import { ArchiveConfirmationService } from '../../../../shared/components/confirm-dialog/confirm-dialog';
import { EmptyState } from '../../../../shared/components/empty-state/empty-state';
import { LoadingIndicator } from '../../../../shared/components/loading-indicator/loading-indicator';
import { StatusChip } from '../../../../shared/components/status-chip/status-chip';
import { ApiErrorSummary } from '../../../../shared/forms/api-error-summary/api-error-summary';
import { PERENNIAL_STATUSES, PerennialListItem, PerennialStatus } from '../../perennials.models';
import { PerennialsApiService } from '../../perennials-api.service';

type PerennialFilterForm = FormGroup<{
  q: FormControl<string>;
  status: FormControl<PerennialStatus | ''>;
}>;

@Component({
  selector: 'app-place-perennials-page',
  imports: [
    ApiErrorSummary,
    EmptyState,
    LoadingIndicator,
    MatButtonModule,
    MatCardModule,
    MatFormFieldModule,
    MatIconModule,
    MatInputModule,
    MatSelectModule,
    ReactiveFormsModule,
    RouterLink,
    StatusChip,
  ],
  templateUrl: './place-perennials-page.html',
  styleUrl: './place-perennials-page.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PlacePerennialsPage {
  readonly statuses = PERENNIAL_STATUSES;
  readonly perennials = signal<readonly PerennialListItem[]>([]);
  readonly loading = signal(false);
  readonly listError = signal<ApiError | null>(null);
  readonly placeId = signal<string | null>(null);

  readonly filters: PerennialFilterForm = new FormGroup({
    q: new FormControl('', { nonNullable: true }),
    status: new FormControl<PerennialStatus | ''>('', { nonNullable: true }),
  });

  private readonly route = inject(ActivatedRoute);
  private readonly perennialsApi = inject(PerennialsApiService);
  private readonly archiveConfirmation = inject(ArchiveConfirmationService);
  private readonly snackbar = inject(SnackbarService);
  private readonly destroyRef = inject(DestroyRef);

  constructor() {
    this.route.parent?.paramMap.pipe(takeUntilDestroyed(this.destroyRef)).subscribe((params) => {
      const placeId = params.get('placeId');
      this.placeId.set(placeId);

      if (placeId !== null) {
        this.loadPerennials();
      }
    });
  }

  loadPerennials(): void {
    const placeId = this.placeId();

    if (placeId === null) {
      return;
    }

    const filters = this.filters.getRawValue();
    this.loading.set(true);
    this.listError.set(null);

    this.perennialsApi
      .listByPlace(placeId, {
        q: filters.q.trim() || undefined,
        status: filters.status || undefined,
        page: 1,
        pageSize: 20,
      })
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (result) => {
          this.perennials.set(result.items);
          this.loading.set(false);
        },
        error: (error: unknown) => {
          this.listError.set(mapApiError(error));
          this.loading.set(false);
        },
      });
  }

  archivePerennial(perennial: PerennialListItem): void {
    this.archiveConfirmation
      .confirmArchive(perennial.label ?? perennial.plantName)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((confirmed) => {
        if (!confirmed) {
          return;
        }

        this.perennialsApi
          .archive(perennial.id)
          .pipe(takeUntilDestroyed(this.destroyRef))
          .subscribe({
            next: () => {
              this.snackbar.showMessage('Perennial archived.');
              this.loadPerennials();
            },
            error: (error: unknown) => {
              this.listError.set(mapApiError(error));
            },
          });
      });
  }
}
