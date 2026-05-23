import { ChangeDetectionStrategy, Component, DestroyRef, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormControl, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { ActivatedRoute, RouterLink } from '@angular/router';

import { ApiError } from '../../../../core/errors/api-error';
import { mapApiError } from '../../../../core/errors/api-error.mapper';
import { SnackbarService } from '../../../../core/notifications/snackbar.service';
import { ArchiveConfirmationService } from '../../../../shared/components/confirm-dialog/confirm-dialog';
import { EmptyState } from '../../../../shared/components/empty-state/empty-state';
import { StatusChip } from '../../../../shared/components/status-chip/status-chip';
import { YearSelector } from '../../../../shared/components/year-selector/year-selector';
import { ApiErrorSummary } from '../../../../shared/forms/api-error-summary/api-error-summary';
import { BedCurrentContentsComponent } from '../../components/bed-current-contents/bed-current-contents';
import { BedForm } from '../../components/bed-form/bed-form';
import { BedListItem, UpdateBedRequest } from '../../beds.models';
import { BedsApiService } from '../../beds-api.service';

@Component({
  selector: 'app-place-beds-page',
  imports: [
    ApiErrorSummary,
    BedCurrentContentsComponent,
    BedForm,
    EmptyState,
    MatButtonModule,
    MatCardModule,
    MatFormFieldModule,
    MatIconModule,
    MatInputModule,
    ReactiveFormsModule,
    RouterLink,
    StatusChip,
    YearSelector,
  ],
  templateUrl: './place-beds-page.html',
  styleUrl: './place-beds-page.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PlaceBedsPage {
  readonly beds = signal<readonly BedListItem[]>([]);
  readonly loading = signal(false);
  readonly saving = signal(false);
  readonly formOpen = signal(false);
  readonly editingBed = signal<BedListItem | null>(null);
  readonly listError = signal<ApiError | null>(null);
  readonly formError = signal<ApiError | null>(null);
  readonly placeId = signal<string | null>(null);
  readonly selectedYear = signal(new Date().getFullYear());

  readonly filters = new FormGroup({
    q: new FormControl('', { nonNullable: true }),
  });

  private readonly route = inject(ActivatedRoute);
  private readonly bedsApi = inject(BedsApiService);
  private readonly archiveConfirmation = inject(ArchiveConfirmationService);
  private readonly snackbar = inject(SnackbarService);
  private readonly destroyRef = inject(DestroyRef);

  constructor() {
    this.route.parent?.paramMap.pipe(takeUntilDestroyed(this.destroyRef)).subscribe((params) => {
      const placeId = params.get('placeId');
      this.placeId.set(placeId);

      if (placeId !== null) {
        this.loadBeds();
      }
    });
  }

  selectYear(year: number): void {
    this.selectedYear.set(year);
    this.loadBeds();
  }

  loadBeds(): void {
    const placeId = this.placeId();

    if (placeId === null) {
      return;
    }

    this.loading.set(true);
    this.listError.set(null);

    this.bedsApi
      .listByPlace(placeId, {
        q: this.filters.controls.q.value.trim() || undefined,
        year: this.selectedYear(),
        page: 1,
        pageSize: 20,
      })
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (result) => {
          this.beds.set(result.items);
          this.loading.set(false);
        },
        error: (error: unknown) => {
          this.listError.set(mapApiError(error));
          this.loading.set(false);
        },
      });
  }

  openCreateForm(): void {
    this.editingBed.set(null);
    this.formError.set(null);
    this.formOpen.set(true);
  }

  openEditForm(bed: BedListItem): void {
    this.editingBed.set(bed);
    this.formError.set(null);
    this.formOpen.set(true);
  }

  closeForm(): void {
    this.formOpen.set(false);
    this.editingBed.set(null);
    this.formError.set(null);
  }

  saveBed(request: UpdateBedRequest): void {
    const placeId = this.placeId();

    if (placeId === null || request.name === undefined) {
      return;
    }

    const editing = this.editingBed();
    this.saving.set(true);
    this.formError.set(null);
    const saveRequest =
      editing === null
        ? this.bedsApi.create(placeId, {
            name: request.name,
            description: request.description,
            notes: request.notes,
            widthM: request.widthM,
            lengthM: request.lengthM,
            areaM2: request.areaM2,
          })
        : this.bedsApi.update(editing.id, request);

    saveRequest.pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: () => {
        this.saving.set(false);
        this.snackbar.showMessage(editing === null ? 'Bed created.' : 'Bed updated.');
        this.closeForm();
        this.loadBeds();
      },
      error: (error: unknown) => {
        this.saving.set(false);
        this.formError.set(mapApiError(error));
      },
    });
  }

  archiveBed(bed: BedListItem): void {
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
              this.loadBeds();
            },
            error: (error: unknown) => {
              this.listError.set(mapApiError(error));
            },
          });
      });
  }
}
