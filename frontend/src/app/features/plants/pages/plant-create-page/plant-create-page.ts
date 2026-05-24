import { ChangeDetectionStrategy, Component, DestroyRef, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { MatCardModule } from '@angular/material/card';
import { Router } from '@angular/router';

import { ApiError } from '../../../../core/errors/api-error';
import { mapApiError } from '../../../../core/errors/api-error.mapper';
import { SnackbarService } from '../../../../core/notifications/snackbar.service';
import { PageHeader } from '../../../../shared/components/page-header/page-header';
import { PlantForm } from '../../components/plant-form/plant-form';
import { CreatePlantRequest } from '../../plants.models';
import { PlantsApiService } from '../../plants-api.service';

@Component({
  selector: 'app-plant-create-page',
  imports: [MatCardModule, PageHeader, PlantForm],
  templateUrl: './plant-create-page.html',
  styleUrl: './plant-create-page.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PlantCreatePage {
  readonly saving = signal(false);
  readonly apiError = signal<ApiError | null>(null);

  private readonly plantsApi = inject(PlantsApiService);
  private readonly router = inject(Router);
  private readonly snackbar = inject(SnackbarService);
  private readonly destroyRef = inject(DestroyRef);

  savePlant(request: CreatePlantRequest): void {
    this.saving.set(true);
    this.apiError.set(null);

    this.plantsApi
      .create(request)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (result) => {
          this.saving.set(false);
          this.snackbar.showMessage('Plant created.');
          void this.router.navigate(['/plants', result.id]);
        },
        error: (error: unknown) => {
          this.saving.set(false);
          this.apiError.set(mapApiError(error));
        },
      });
  }

  cancel(): void {
    void this.router.navigate(['/plants']);
  }
}
