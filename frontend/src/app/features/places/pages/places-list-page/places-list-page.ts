import { ChangeDetectionStrategy, Component, DestroyRef, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { RouterLink } from '@angular/router';

import { ApiError } from '../../../../core/errors/api-error';
import { mapApiError } from '../../../../core/errors/api-error.mapper';
import { SnackbarService } from '../../../../core/notifications/snackbar.service';
import { ArchiveConfirmationService } from '../../../../shared/components/confirm-dialog/confirm-dialog';
import { EmptyState } from '../../../../shared/components/empty-state/empty-state';
import { PageHeader } from '../../../../shared/components/page-header/page-header';
import { ApiErrorSummary } from '../../../../shared/forms/api-error-summary/api-error-summary';
import { PlaceForm } from '../../components/place-form/place-form';
import { CreatePlaceRequest, PlaceListItem } from '../../places.models';
import { PlacesApiService } from '../../places-api.service';

@Component({
  selector: 'app-places-list-page',
  imports: [
    ApiErrorSummary,
    EmptyState,
    MatButtonModule,
    MatCardModule,
    MatIconModule,
    PageHeader,
    PlaceForm,
    RouterLink,
  ],
  templateUrl: './places-list-page.html',
  styleUrl: './places-list-page.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PlacesListPage {
  readonly places = signal<readonly PlaceListItem[]>([]);
  readonly loading = signal(false);
  readonly saving = signal(false);
  readonly formOpen = signal(false);
  readonly editingPlace = signal<PlaceListItem | null>(null);
  readonly listError = signal<ApiError | null>(null);
  readonly formError = signal<ApiError | null>(null);

  private readonly placesApi = inject(PlacesApiService);
  private readonly archiveConfirmation = inject(ArchiveConfirmationService);
  private readonly snackbar = inject(SnackbarService);
  private readonly destroyRef = inject(DestroyRef);

  constructor() {
    this.loadPlaces();
  }

  loadPlaces(): void {
    this.loading.set(true);
    this.listError.set(null);

    this.placesApi
      .list()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (result) => {
          this.places.set(result.items);
          this.loading.set(false);
        },
        error: (error: unknown) => {
          this.listError.set(mapApiError(error));
          this.loading.set(false);
        },
      });
  }

  openCreateForm(): void {
    this.editingPlace.set(null);
    this.formError.set(null);
    this.formOpen.set(true);
  }

  openEditForm(place: PlaceListItem): void {
    this.editingPlace.set(place);
    this.formError.set(null);
    this.formOpen.set(true);
  }

  closeForm(): void {
    this.formOpen.set(false);
    this.editingPlace.set(null);
    this.formError.set(null);
  }

  savePlace(request: CreatePlaceRequest): void {
    const editingPlace = this.editingPlace();
    this.saving.set(true);
    this.formError.set(null);
    const saveRequest =
      editingPlace === null
        ? this.placesApi.create(request)
        : this.placesApi.update(editingPlace.id, request);

    saveRequest.pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: () => {
        this.saving.set(false);
        this.snackbar.showMessage(editingPlace === null ? 'Place created.' : 'Place updated.');
        this.closeForm();
        this.loadPlaces();
      },
      error: (error: unknown) => {
        this.saving.set(false);
        this.formError.set(mapApiError(error));
      },
    });
  }

  archivePlace(place: PlaceListItem): void {
    this.archiveConfirmation
      .confirmArchive(place.name)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((confirmed) => {
        if (!confirmed) {
          return;
        }

        this.placesApi
          .archive(place.id)
          .pipe(takeUntilDestroyed(this.destroyRef))
          .subscribe({
            next: () => {
              this.snackbar.showMessage('Place archived.');
              this.loadPlaces();
            },
            error: (error: unknown) => {
              this.listError.set(mapApiError(error));
            },
          });
      });
  }
}
