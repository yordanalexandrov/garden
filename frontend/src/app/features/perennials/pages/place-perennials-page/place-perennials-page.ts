import { ChangeDetectionStrategy, Component, DestroyRef, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormControl, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { ActivatedRoute } from '@angular/router';

import { ApiError } from '../../../../core/errors/api-error';
import { mapApiError } from '../../../../core/errors/api-error.mapper';
import { SnackbarService } from '../../../../core/notifications/snackbar.service';
import { ArchiveConfirmationService } from '../../../../shared/components/confirm-dialog/confirm-dialog';
import { EmptyState } from '../../../../shared/components/empty-state/empty-state';
import { StatusChip } from '../../../../shared/components/status-chip/status-chip';
import { ApiErrorSummary } from '../../../../shared/forms/api-error-summary/api-error-summary';
import { PerennialForm } from '../../components/perennial-form/perennial-form';
import {
  PERENNIAL_STATUSES,
  PerennialListItem,
  PerennialStatus,
  UpdatePerennialRequest,
} from '../../perennials.models';
import { PerennialsApiService } from '../../perennials-api.service';
import { LoadingIndicator } from '../../../../shared/components/loading-indicator/loading-indicator';

type PerennialFilterForm = FormGroup<{
  q: FormControl<string>;
  status: FormControl<PerennialStatus | ''>;
}>;

@Component({
  selector: 'app-place-perennials-page',
  imports: [
    LoadingIndicator,
    ApiErrorSummary,
    EmptyState,
    MatButtonModule,
    MatCardModule,
    MatFormFieldModule,
    MatIconModule,
    MatInputModule,
    MatSelectModule,
    PerennialForm,
    ReactiveFormsModule,
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
  readonly saving = signal(false);
  readonly formOpen = signal(false);
  readonly editingPerennial = signal<PerennialListItem | null>(null);
  readonly listError = signal<ApiError | null>(null);
  readonly formError = signal<ApiError | null>(null);
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

  openCreateForm(): void {
    this.editingPerennial.set(null);
    this.formError.set(null);
    this.formOpen.set(true);
  }

  openEditForm(perennial: PerennialListItem): void {
    this.editingPerennial.set(perennial);
    this.formError.set(null);
    this.formOpen.set(true);
  }

  closeForm(): void {
    this.formOpen.set(false);
    this.editingPerennial.set(null);
    this.formError.set(null);
  }

  savePerennial(request: UpdatePerennialRequest): void {
    const placeId = this.placeId();

    if (placeId === null || request.plantId === undefined) {
      return;
    }

    const editing = this.editingPerennial();
    this.saving.set(true);
    this.formError.set(null);
    const saveRequest =
      editing === null
        ? this.perennialsApi.create(placeId, {
            plantId: request.plantId,
            label: request.label,
            plantedYear: request.plantedYear,
            notes: request.notes,
          })
        : this.perennialsApi.update(editing.id, request);

    saveRequest.pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: () => {
        this.saving.set(false);
        this.snackbar.showMessage(editing === null ? 'Perennial created.' : 'Perennial updated.');
        this.closeForm();
        this.loadPerennials();
      },
      error: (error: unknown) => {
        this.saving.set(false);
        this.formError.set(mapApiError(error));
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
