import { ChangeDetectionStrategy, Component, DestroyRef, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { ActivatedRoute, Router } from '@angular/router';

import { ApiError } from '../../../../core/errors/api-error';
import { mapApiError } from '../../../../core/errors/api-error.mapper';
import { SnackbarService } from '../../../../core/notifications/snackbar.service';
import { ArchiveConfirmationService } from '../../../../shared/components/confirm-dialog/confirm-dialog';
import { PageHeader } from '../../../../shared/components/page-header/page-header';
import { ApiErrorSummary } from '../../../../shared/forms/api-error-summary/api-error-summary';
import { PlantForm } from '../../components/plant-form/plant-form';
import { CreatePlantRequest, PlantDetail } from '../../plants.models';
import { PlantsApiService } from '../../plants-api.service';
import { LoadingIndicator } from '../../../../shared/components/loading-indicator/loading-indicator';

@Component({
  selector: 'app-plant-detail-page',
  imports: [
    LoadingIndicator,
    ApiErrorSummary,
    MatButtonModule,
    MatCardModule,
    MatIconModule,
    PageHeader,
    PlantForm,
  ],
  templateUrl: './plant-detail-page.html',
  styleUrl: './plant-detail-page.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PlantDetailPage {
  readonly plant = signal<PlantDetail | null>(null);
  readonly loading = signal(false);
  readonly saving = signal(false);
  readonly apiError = signal<ApiError | null>(null);

  private readonly route = inject(ActivatedRoute);
  private readonly plantsApi = inject(PlantsApiService);
  private readonly archiveConfirmation = inject(ArchiveConfirmationService);
  private readonly snackbar = inject(SnackbarService);
  private readonly router = inject(Router);
  private readonly destroyRef = inject(DestroyRef);

  constructor() {
    this.route.paramMap.pipe(takeUntilDestroyed(this.destroyRef)).subscribe((params) => {
      const plantId = params.get('plantId');

      if (plantId !== null) {
        this.loadPlant(plantId);
      }
    });
  }

  cancelEdit(): void {
    const plant = this.plant();

    if (plant !== null) {
      this.loadPlant(plant.id);
    }
  }

  savePlant(request: CreatePlantRequest): void {
    const plant = this.plant();

    if (plant === null) {
      return;
    }

    this.saving.set(true);
    this.apiError.set(null);

    this.plantsApi
      .update(plant.id, request)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => {
          this.saving.set(false);
          this.snackbar.showMessage('Plant updated.');
          this.loadPlant(plant.id);
        },
        error: (error: unknown) => {
          this.saving.set(false);
          this.apiError.set(mapApiError(error));
        },
      });
  }

  archivePlant(): void {
    const plant = this.plant();

    if (plant === null) {
      return;
    }

    this.archiveConfirmation
      .confirmArchive(plant.commonName)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((confirmed) => {
        if (!confirmed) {
          return;
        }

        this.plantsApi
          .archive(plant.id)
          .pipe(takeUntilDestroyed(this.destroyRef))
          .subscribe({
            next: () => {
              this.snackbar.showMessage('Plant archived.');
              void this.router.navigate(['/plants']);
            },
            error: (error: unknown) => {
              this.apiError.set(mapApiError(error));
            },
          });
      });
  }

  private loadPlant(plantId: string): void {
    this.loading.set(true);
    this.apiError.set(null);

    this.plantsApi
      .get(plantId)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (plant) => {
          this.plant.set(plant);
          this.loading.set(false);
        },
        error: (error: unknown) => {
          this.apiError.set(mapApiError(error));
          this.loading.set(false);
        },
      });
  }
}
