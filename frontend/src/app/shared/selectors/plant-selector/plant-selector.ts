import { ChangeDetectionStrategy, Component, DestroyRef, inject, input, output, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSelectChange, MatSelectModule } from '@angular/material/select';

import { ApiError } from '../../../core/errors/api-error';
import { mapApiError } from '../../../core/errors/api-error.mapper';
import { PlantsApiService } from '../../../features/plants/plants-api.service';
import { PlantListItem } from '../../../features/plants/plants.models';
import { ApiErrorSummary } from '../../forms/api-error-summary/api-error-summary';

@Component({
  selector: 'app-plant-selector',
  imports: [
    ApiErrorSummary,
    MatButtonModule,
    MatFormFieldModule,
    MatIconModule,
    MatInputModule,
    MatProgressSpinnerModule,
    MatSelectModule,
  ],
  templateUrl: './plant-selector.html',
  styleUrl: './plant-selector.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PlantSelector {
  readonly selectedPlantId = input<string | null>(null);
  readonly selectedPlantIdChange = output<string | null>();
  readonly label = input('Plant');

  readonly plants = signal<readonly PlantListItem[]>([]);
  readonly loading = signal(false);
  readonly error = signal<ApiError | null>(null);
  readonly searchText = signal('');

  private readonly plantsApi = inject(PlantsApiService);
  private readonly destroyRef = inject(DestroyRef);

  search(): void {
    this.loading.set(true);
    this.error.set(null);

    this.plantsApi
      .list({
        q: this.searchText().trim() || undefined,
        page: 1,
        pageSize: 20,
      })
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (result) => {
          this.plants.set(result.items);
          this.loading.set(false);
        },
        error: (error: unknown) => {
          this.error.set(mapApiError(error));
          this.loading.set(false);
        },
      });
  }

  updateSearchText(event: Event): void {
    const inputElement = event.target as HTMLInputElement | null;
    this.searchText.set(inputElement?.value ?? '');
  }

  selectPlant(event: MatSelectChange): void {
    this.selectedPlantIdChange.emit(typeof event.value === 'string' ? event.value : null);
  }

  displayPlant(plant: PlantListItem): string {
    return plant.variety === null || plant.variety.trim().length === 0
      ? plant.commonName
      : `${plant.commonName} (${plant.variety})`;
  }
}
