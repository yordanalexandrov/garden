import { ChangeDetectionStrategy, Component, effect, input, output } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';

import { ApiError } from '../../../../core/errors/api-error';
import { ApiErrorSummary } from '../../../../shared/forms/api-error-summary/api-error-summary';
import { applyApiErrorToForm } from '../../../../shared/forms/api-error-summary/api-error-form';
import { PlantSelector } from '../../../../shared/selectors/plant-selector/plant-selector';
import {
  EDITABLE_YEARLY_BED_PLANTING_STATUSES,
  UpdateYearlyBedPlantingRequest,
  YearlyBedPlantingListItem,
  YearlyBedPlantingStatus,
} from '../../plantings.models';
import { nonNegativeValidator, saneYearValidator } from '../persistent-bed-plant-form/persistent-bed-plant-form';

type YearlyPlantingFormGroup = FormGroup<{
  plantId: FormControl<string>;
  year: FormControl<number | string | null>;
  quantity: FormControl<number | string | null>;
  notes: FormControl<string>;
  status: FormControl<YearlyBedPlantingStatus>;
}>;

@Component({
  selector: 'app-yearly-bed-planting-form',
  imports: [
    ApiErrorSummary,
    MatButtonModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    PlantSelector,
    ReactiveFormsModule,
  ],
  templateUrl: './yearly-bed-planting-form.html',
  styleUrl: './yearly-bed-planting-form.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class YearlyBedPlantingForm {
  readonly planting = input<YearlyBedPlantingListItem | null>(null);
  readonly defaultYear = input(new Date().getFullYear());
  readonly apiError = input<ApiError | null>(null);
  readonly saving = input(false);
  readonly submitted = output<UpdateYearlyBedPlantingRequest>();
  readonly cancelled = output<void>();
  readonly statuses = EDITABLE_YEARLY_BED_PLANTING_STATUSES;

  readonly form: YearlyPlantingFormGroup = new FormGroup({
    plantId: new FormControl('', { nonNullable: true, validators: [Validators.required] }),
    year: new FormControl<number | string | null>(new Date().getFullYear(), {
      validators: [Validators.required, saneYearValidator],
    }),
    quantity: new FormControl<number | string | null>(null, { validators: [nonNegativeValidator] }),
    notes: new FormControl('', { nonNullable: true }),
    status: new FormControl<YearlyBedPlantingStatus>('planned', { nonNullable: true }),
  });

  constructor() {
    effect(() => {
      const planting = this.planting();

      this.form.reset(
        {
          plantId: planting?.plantId ?? '',
          year: planting?.year ?? this.defaultYear(),
          quantity: planting?.quantity ?? null,
          notes: planting?.notes ?? '',
          status: planting?.status === 'archived' ? 'planned' : (planting?.status ?? 'planned'),
        },
        { emitEvent: false },
      );
    });

    effect(() => {
      applyApiErrorToForm(this.form, this.apiError());
    });
  }

  updatePlant(plantId: string | null): void {
    this.form.controls.plantId.setValue(plantId ?? '');
    this.form.controls.plantId.markAsTouched();
  }

  submit(): void {
    this.form.markAllAsTouched();

    if (this.form.invalid) {
      return;
    }

    const value = this.form.getRawValue();
    this.submitted.emit({
      plantId: value.plantId,
      year: Number(value.year),
      quantity: nullableNumber(value.quantity),
      notes: nullableText(value.notes),
      status: value.status,
    });
  }
}

const nullableText = (value: string): string | null => {
  const trimmed = value.trim();

  return trimmed.length > 0 ? trimmed : null;
};

const nullableNumber = (value: unknown): number | null => {
  if (value === null || value === undefined || value === '') {
    return null;
  }

  const parsed = Number(value);

  return Number.isFinite(parsed) ? parsed : null;
};
