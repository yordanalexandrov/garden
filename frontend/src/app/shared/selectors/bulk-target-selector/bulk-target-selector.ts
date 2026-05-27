import { ChangeDetectionStrategy, Component, DestroyRef, effect, inject, input, output, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatOptionModule } from '@angular/material/core';
import { MatSelectModule } from '@angular/material/select';
import { forkJoin, map, of, switchMap } from 'rxjs';

import {
  TARGET_SCOPE_TYPES,
  TargetScopeType,
  TargetSelection,
} from '../../../features/activities/activities.models';
import { BedsApiService } from '../../../features/beds/beds-api.service';
import { BedListItem } from '../../../features/beds/beds.models';
import { PerennialsApiService } from '../../../features/perennials/perennials-api.service';
import { PerennialListItem } from '../../../features/perennials/perennials.models';
import { PersistentBedPlantsApiService } from '../../../features/plantings/persistent-bed-plants-api.service';
import { YearlyBedPlantingsApiService } from '../../../features/plantings/yearly-bed-plantings-api.service';
import {
  PersistentBedPlantListItem,
  YearlyBedPlantingListItem,
} from '../../../features/plantings/plantings.models';

interface TargetOption {
  readonly id: string;
  readonly label: string;
}

export interface BulkTargetIntent {
  readonly targetScopeType: TargetScopeType;
  readonly targetSelection?: TargetSelection;
  readonly selectedLabels: readonly string[];
}

const selectedScopeKeys: Partial<Record<TargetScopeType, keyof TargetSelection>> = {
  selected_perennials: 'perennialIds',
  selected_beds: 'bedIds',
  single_bed: 'bedIds',
  selected_yearly_plantings: 'yearlyPlantingIds',
  selected_persistent_bed_plants: 'persistentBedPlantIds',
};

@Component({
  selector: 'app-bulk-target-selector',
  imports: [
    MatCheckboxModule,
    MatFormFieldModule,
    MatInputModule,
    MatOptionModule,
    MatSelectModule,
    ReactiveFormsModule,
  ],
  templateUrl: './bulk-target-selector.html',
  styleUrl: './bulk-target-selector.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BulkTargetSelector {
  readonly placeId = input<string | null>(null);
  readonly intentChange = output<BulkTargetIntent>();

  readonly scopeOptions = TARGET_SCOPE_TYPES;
  readonly scope = new FormControl<TargetScopeType>('whole_place', { nonNullable: true });
  readonly selectedIds = new FormControl<readonly string[]>([], { nonNullable: true });
  readonly options = signal<readonly TargetOption[]>([]);
  readonly loading = signal(false);
  readonly empty = signal(false);

  private readonly bedsApi = inject(BedsApiService);
  private readonly perennialsApi = inject(PerennialsApiService);
  private readonly yearlyPlantingsApi = inject(YearlyBedPlantingsApiService);
  private readonly persistentPlantsApi = inject(PersistentBedPlantsApiService);
  private readonly destroyRef = inject(DestroyRef);

  constructor() {
    effect(() => {
      const currentPlaceId = this.placeId();
      this.selectedIds.setValue([], { emitEvent: false });
      this.loadOptions(currentPlaceId, this.scope.value);
      this.emitIntent();
    });

    this.scope.valueChanges.pipe(takeUntilDestroyed()).subscribe((scope) => {
      this.selectedIds.setValue([], { emitEvent: false });
      this.loadOptions(this.placeId(), scope);
      this.emitIntent();
    });

    this.selectedIds.valueChanges.pipe(takeUntilDestroyed()).subscribe(() => this.emitIntent());
  }

  requiresSelection(): boolean {
    return this.scope.value in selectedScopeKeys;
  }

  selectedCount(): number {
    return this.requiresSelection() ? this.selectedIds.value.length : this.options().length;
  }

  targetSummary(): string {
    if (!this.placeId()) {
      return 'Select a place before choosing targets.';
    }

    if (!this.requiresSelection()) {
      return this.scope.value === 'whole_place'
        ? 'Whole place'
        : `${this.selectedCount()} eligible targets`;
    }

    return `${this.selectedIds.value.length} selected`;
  }

  private loadOptions(placeId: string | null, scope: TargetScopeType): void {
    this.options.set([]);
    this.empty.set(false);

    if (!placeId) {
      this.loading.set(false);
      return;
    }

    this.loading.set(true);
    this.fetchOptions(placeId, scope)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (options) => {
          this.options.set(options);
          this.empty.set(options.length === 0 && scope !== 'whole_place');
          this.loading.set(false);
        },
        error: () => {
          this.options.set([]);
          this.empty.set(true);
          this.loading.set(false);
        },
      });
  }

  private fetchOptions(placeId: string, scope: TargetScopeType) {
    if (scope === 'whole_place') {
      return of([{ id: placeId, label: 'Whole place' }]);
    }

    if (scope === 'all_perennials_in_place' || scope === 'selected_perennials') {
      return this.perennialsApi
        .listByPlace(placeId, { page: 1, pageSize: 100 })
        .pipe(map((result) => result.items.map(perennialLabel)));
    }

    if (scope === 'all_beds_in_place' || scope === 'selected_beds' || scope === 'single_bed') {
      return this.bedsApi
        .listByPlace(placeId, { page: 1, pageSize: 100 })
        .pipe(map((result) => result.items.map(bedLabel)));
    }

    return this.bedsApi.listByPlace(placeId, { page: 1, pageSize: 100 }).pipe(
      switchMap((beds) => {
        if (beds.items.length === 0) {
          return of([]);
        }

        const calls = beds.items.map((bed) =>
          scope === 'selected_yearly_plantings'
            ? this.yearlyPlantingsApi
                .listByBed(bed.id, { page: 1, pageSize: 100 })
                .pipe(map((result) => result.items.map((item) => yearlyPlantingLabel(item, bed))))
            : this.persistentPlantsApi
                .listByBed(bed.id, { page: 1, pageSize: 100 })
                .pipe(map((result) => result.items.map((item) => persistentPlantLabel(item, bed)))),
        );

        return forkJoin(calls).pipe(map((groups) => groups.flat()));
      }),
    );
  }

  private emitIntent(): void {
    const scope = this.scope.value;
    const key = selectedScopeKeys[scope];
    const selectedIds = this.selectedIds.value;
    const selectedLabels = this.options()
      .filter((option) => selectedIds.includes(option.id))
      .map((option) => option.label);

    this.intentChange.emit({
      targetScopeType: scope,
      targetSelection: key ? { [key]: selectedIds } : undefined,
      selectedLabels,
    });
  }
}

const perennialLabel = (item: PerennialListItem): TargetOption => ({
  id: item.id,
  label: item.label || item.plantName,
});

const bedLabel = (item: BedListItem): TargetOption => ({
  id: item.id,
  label: item.name,
});

const yearlyPlantingLabel = (item: YearlyBedPlantingListItem, bed: BedListItem): TargetOption => ({
  id: item.id,
  label: `${bed.name}: ${item.plantName} ${item.year}`,
});

const persistentPlantLabel = (item: PersistentBedPlantListItem, bed: BedListItem): TargetOption => ({
  id: item.id,
  label: `${bed.name}: ${item.plantName}`,
});
