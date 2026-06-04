import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  effect,
  inject,
  input,
  output,
  signal,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatOptionModule } from '@angular/material/core';
import { MatSelectModule } from '@angular/material/select';
import { Observable, forkJoin, map, of, switchMap } from 'rxjs';

import {
  PROBLEM_TARGET_TYPES,
  ProblemTargetType,
} from '../../../features/problems/problems.models';
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

export interface ProblemTargetIntent {
  readonly targetType: ProblemTargetType;
  readonly targetId: string | null;
  readonly label: string | null;
  readonly summary: string;
}

@Component({
  selector: 'app-problem-target-selector',
  imports: [MatFormFieldModule, MatOptionModule, MatSelectModule, ReactiveFormsModule],
  templateUrl: './problem-target-selector.html',
  styleUrl: './problem-target-selector.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ProblemTargetSelector {
  readonly placeId = input<string | null>(null);
  readonly placeName = input<string | null>(null);
  readonly intentChange = output<ProblemTargetIntent>();

  readonly targetTypes = PROBLEM_TARGET_TYPES;
  readonly targetType = new FormControl<ProblemTargetType>('place', { nonNullable: true });
  readonly targetId = new FormControl<string | null>(null);
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
      this.placeName();
      this.targetId.setValue(null, { emitEvent: false });
      this.loadOptions(currentPlaceId, this.targetType.value);
      this.emitIntent();
    });

    this.targetType.valueChanges.pipe(takeUntilDestroyed()).subscribe((targetType) => {
      this.targetId.setValue(null, { emitEvent: false });
      this.loadOptions(this.placeId(), targetType);
      this.emitIntent();
    });

    this.targetId.valueChanges.pipe(takeUntilDestroyed()).subscribe(() => this.emitIntent());
  }

  isPlaceTarget(): boolean {
    return this.targetType.value === 'place';
  }

  hasSelection(): boolean {
    return this.resolvedTargetId() !== null;
  }

  resolvedTargetId(): string | null {
    if (this.isPlaceTarget()) {
      return this.placeId();
    }

    return this.targetId.value;
  }

  summary(): string {
    if (!this.placeId()) {
      return 'Select a place before choosing a target.';
    }

    if (this.isPlaceTarget()) {
      return `Place: ${this.placeName() ?? 'whole place'}`;
    }

    const id = this.targetId.value;

    if (!id) {
      return 'No target selected.';
    }

    const label = this.options().find((option) => option.id === id)?.label ?? id;

    return `${this.targetType.value.replaceAll('_', ' ')}: ${label}`;
  }

  private resolvedLabel(): string | null {
    if (this.isPlaceTarget()) {
      return this.placeName();
    }

    const id = this.targetId.value;

    if (!id) {
      return null;
    }

    return this.options().find((option) => option.id === id)?.label ?? null;
  }

  private loadOptions(placeId: string | null, targetType: ProblemTargetType): void {
    this.options.set([]);
    this.empty.set(false);

    if (!placeId || targetType === 'place') {
      this.loading.set(false);
      return;
    }

    this.loading.set(true);
    this.fetchOptions(placeId, targetType)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (options) => {
          this.options.set(options);
          this.empty.set(options.length === 0);
          this.loading.set(false);
        },
        error: () => {
          this.options.set([]);
          this.empty.set(true);
          this.loading.set(false);
        },
      });
  }

  private fetchOptions(
    placeId: string,
    targetType: ProblemTargetType,
  ): Observable<readonly TargetOption[]> {
    if (targetType === 'perennial') {
      return this.perennialsApi
        .listByPlace(placeId, { page: 1, pageSize: 100 })
        .pipe(map((result) => result.items.map(perennialLabel)));
    }

    if (targetType === 'bed') {
      return this.bedsApi
        .listByPlace(placeId, { page: 1, pageSize: 100 })
        .pipe(map((result) => result.items.map(bedLabel)));
    }

    return this.bedsApi.listByPlace(placeId, { page: 1, pageSize: 100 }).pipe(
      switchMap((beds) => {
        if (beds.items.length === 0) {
          return of<readonly TargetOption[]>([]);
        }

        const calls = beds.items.map((bed) =>
          targetType === 'yearly_bed_planting'
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
    this.intentChange.emit({
      targetType: this.targetType.value,
      targetId: this.resolvedTargetId(),
      label: this.resolvedLabel(),
      summary: this.summary(),
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

const persistentPlantLabel = (
  item: PersistentBedPlantListItem,
  bed: BedListItem,
): TargetOption => ({
  id: item.id,
  label: `${bed.name}: ${item.plantName}`,
});
