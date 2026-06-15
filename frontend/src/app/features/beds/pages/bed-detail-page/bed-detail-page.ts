import { ChangeDetectionStrategy, Component, DestroyRef, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { combineLatest } from 'rxjs';

import { ApiError } from '../../../../core/errors/api-error';
import { mapApiError } from '../../../../core/errors/api-error.mapper';
import { SnackbarService } from '../../../../core/notifications/snackbar.service';
import { ArchiveConfirmationService } from '../../../../shared/components/confirm-dialog/confirm-dialog';
import { PageHeader } from '../../../../shared/components/page-header/page-header';
import { StatusChip } from '../../../../shared/components/status-chip/status-chip';
import { YearSelector } from '../../../../shared/components/year-selector/year-selector';
import { ApiErrorSummary } from '../../../../shared/forms/api-error-summary/api-error-summary';
import { PersistentBedPlantForm } from '../../../plantings/components/persistent-bed-plant-form/persistent-bed-plant-form';
import { YearlyBedPlantingForm } from '../../../plantings/components/yearly-bed-planting-form/yearly-bed-planting-form';
import { PersistentBedPlantsApiService } from '../../../plantings/persistent-bed-plants-api.service';
import {
  PersistentBedPlantListItem,
  UpdatePersistentBedPlantRequest,
  UpdateYearlyBedPlantingRequest,
  YearlyBedPlantingListItem,
} from '../../../plantings/plantings.models';
import { YearlyBedPlantingsApiService } from '../../../plantings/yearly-bed-plantings-api.service';
import { BedCurrentContentsComponent } from '../../components/bed-current-contents/bed-current-contents';
import { BedDetail } from '../../beds.models';
import { BedsApiService } from '../../beds-api.service';
import { LoadingIndicator } from '../../../../shared/components/loading-indicator/loading-indicator';

@Component({
  selector: 'app-bed-detail-page',
  imports: [
    LoadingIndicator,
    ApiErrorSummary,
    BedCurrentContentsComponent,
    MatButtonModule,
    MatCardModule,
    MatIconModule,
    PageHeader,
    PersistentBedPlantForm,
    RouterLink,
    StatusChip,
    YearSelector,
    YearlyBedPlantingForm,
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
  readonly plantingSaving = signal(false);
  readonly activePlantingForm = signal<'persistent' | 'yearly' | null>(null);
  readonly editingPersistentPlant = signal<PersistentBedPlantListItem | null>(null);
  readonly editingYearlyPlanting = signal<YearlyBedPlantingListItem | null>(null);
  readonly persistentPlants = signal<readonly PersistentBedPlantListItem[]>([]);
  readonly yearlyPlantings = signal<readonly YearlyBedPlantingListItem[]>([]);
  readonly apiError = signal<ApiError | null>(null);
  readonly plantingError = signal<ApiError | null>(null);

  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly bedsApi = inject(BedsApiService);
  private readonly persistentPlantsApi = inject(PersistentBedPlantsApiService);
  private readonly yearlyPlantingsApi = inject(YearlyBedPlantingsApiService);
  private readonly archiveConfirmation = inject(ArchiveConfirmationService);
  private readonly snackbar = inject(SnackbarService);
  private readonly destroyRef = inject(DestroyRef);

  constructor() {
    combineLatest([this.route.paramMap, this.route.queryParamMap])
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(([params, queryParams]) => {
        this.bedId.set(params.get('bedId'));
        const rawYear = queryParams.get('year');
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

  openPersistentForm(row: PersistentBedPlantListItem | null = null): void {
    this.editingPersistentPlant.set(row);
    this.editingYearlyPlanting.set(null);
    this.plantingError.set(null);
    this.activePlantingForm.set('persistent');
  }

  openYearlyForm(row: YearlyBedPlantingListItem | null = null): void {
    this.editingYearlyPlanting.set(row);
    this.editingPersistentPlant.set(null);
    this.plantingError.set(null);
    this.activePlantingForm.set('yearly');
  }

  closePlantingForm(): void {
    this.activePlantingForm.set(null);
    this.editingPersistentPlant.set(null);
    this.editingYearlyPlanting.set(null);
    this.plantingError.set(null);
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

  savePersistentPlant(request: UpdatePersistentBedPlantRequest): void {
    const bedId = this.bedId();

    if (bedId === null || request.plantId === undefined) {
      return;
    }

    const editing = this.editingPersistentPlant();
    this.plantingSaving.set(true);
    this.plantingError.set(null);
    const saveRequest =
      editing === null
        ? this.persistentPlantsApi.create(bedId, {
            plantId: request.plantId,
            plantedYear: request.plantedYear,
            quantity: request.quantity,
            notes: request.notes,
          })
        : this.persistentPlantsApi.update(editing.id, request);

    saveRequest.pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: () => {
        this.plantingSaving.set(false);
        this.snackbar.showMessage(
          editing === null ? 'Persistent plant added.' : 'Persistent plant updated.',
        );
        this.closePlantingForm();
        this.loadBed();
      },
      error: (error: unknown) => {
        this.plantingSaving.set(false);
        this.plantingError.set(mapApiError(error));
      },
    });
  }

  saveYearlyPlanting(request: UpdateYearlyBedPlantingRequest): void {
    const bedId = this.bedId();

    if (bedId === null || request.plantId === undefined || request.year === undefined) {
      return;
    }

    const editing = this.editingYearlyPlanting();
    this.plantingSaving.set(true);
    this.plantingError.set(null);
    const saveRequest =
      editing === null
        ? this.yearlyPlantingsApi.create(bedId, {
            plantId: request.plantId,
            year: request.year,
            quantity: request.quantity,
            notes: request.notes,
            status: request.status ?? 'planned',
          })
        : this.yearlyPlantingsApi.update(editing.id, request);

    saveRequest.pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: () => {
        this.plantingSaving.set(false);
        this.snackbar.showMessage(
          editing === null ? 'Yearly planting added.' : 'Yearly planting updated.',
        );
        this.closePlantingForm();
        this.loadBed();
      },
      error: (error: unknown) => {
        this.plantingSaving.set(false);
        this.plantingError.set(mapApiError(error));
      },
    });
  }

  archivePersistentPlant(row: PersistentBedPlantListItem): void {
    this.archiveConfirmation
      .confirmArchive(row.plantName)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((confirmed) => {
        if (!confirmed) {
          return;
        }

        this.persistentPlantsApi
          .archive(row.id)
          .pipe(takeUntilDestroyed(this.destroyRef))
          .subscribe({
            next: () => {
              this.snackbar.showMessage('Persistent plant archived.');
              this.loadBed();
            },
            error: (error: unknown) => {
              this.plantingError.set(mapApiError(error));
            },
          });
      });
  }

  archiveYearlyPlanting(row: YearlyBedPlantingListItem): void {
    this.archiveConfirmation
      .confirmArchive(row.plantName)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((confirmed) => {
        if (!confirmed) {
          return;
        }

        this.yearlyPlantingsApi
          .archive(row.id)
          .pipe(takeUntilDestroyed(this.destroyRef))
          .subscribe({
            next: () => {
              this.snackbar.showMessage('Yearly planting archived.');
              this.loadBed();
            },
            error: (error: unknown) => {
              this.plantingError.set(mapApiError(error));
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
          this.loadPersistentPlants(bed.id);
          this.loadYearlyPlantings(bed.id);
        },
        error: (error: unknown) => {
          this.apiError.set(mapApiError(error));
          this.loading.set(false);
        },
      });
  }

  private loadPersistentPlants(bedId: string): void {
    this.persistentPlantsApi
      .listByBed(bedId, { page: 1, pageSize: 100 })
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (result) => {
          this.persistentPlants.set(result.items);
        },
        error: (error: unknown) => {
          this.plantingError.set(mapApiError(error));
        },
      });
  }

  private loadYearlyPlantings(bedId: string): void {
    this.yearlyPlantingsApi
      .listByBed(bedId, { year: this.selectedYear(), page: 1, pageSize: 100 })
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (result) => {
          this.yearlyPlantings.set(result.items);
        },
        error: (error: unknown) => {
          this.plantingError.set(mapApiError(error));
        },
      });
  }
}
