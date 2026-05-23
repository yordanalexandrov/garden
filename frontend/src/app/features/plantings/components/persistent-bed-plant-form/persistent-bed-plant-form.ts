import { ChangeDetectionStrategy, Component, effect, input, output } from '@angular/core';
import {
  AbstractControl,
  FormControl,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';

import { ApiError } from '../../../../core/errors/api-error';
import { ApiErrorSummary } from '../../../../shared/forms/api-error-summary/api-error-summary';
import { applyApiErrorToForm } from '../../../../shared/forms/api-error-summary/api-error-form';
import { PlantSelector } from '../../../../shared/selectors/plant-selector/plant-selector';
import {
  EDITABLE_PERSISTENT_BED_PLANT_STATUSES,
  PersistentBedPlantListItem,
  PersistentBedPlantStatus,
  UpdatePersistentBedPlantRequest,
} from '../../plantings.models';

type PersistentPlantFormGroup = FormGroup<{
  plantId: FormControl<string>;
  plantedYear: FormControl<number | string | null>;
  quantity: FormControl<number | string | null>;
  notes: FormControl<string>;
  status: FormControl<PersistentBedPlantStatus>;
}>;

@Component({
  selector: 'app-persistent-bed-plant-form',
  imports: [
    ApiErrorSummary,
    MatButtonModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    PlantSelector,
    ReactiveFormsModule,
  ],
  templateUrl: './persistent-bed-plant-form.html',
  styleUrl: './persistent-bed-plant-form.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PersistentBedPlantForm {
  readonly persistentPlant = input<PersistentBedPlantListItem | null>(null);
  readonly apiError = input<ApiError | null>(null);
  readonly saving = input(false);
  readonly submitted = output<UpdatePersistentBedPlantRequest>();
  readonly cancelled = output<void>();
  readonly statuses = EDITABLE_PERSISTENT_BED_PLANT_STATUSES;

  readonly form: PersistentPlantFormGroup = new FormGroup({
    plantId: new FormControl('', { nonNullable: true, validators: [Validators.required] }),
    plantedYear: new FormControl<number | string | null>(null, { validators: [saneYearValidator] }),
    quantity: new FormControl<number | string | null>(null, { validators: [nonNegativeValidator] }),
    notes: new FormControl('', { nonNullable: true }),
    status: new FormControl<PersistentBedPlantStatus>('active', { nonNullable: true }),
  });

  constructor() {
    effect(() => {
      const persistentPlant = this.persistentPlant();

      this.form.reset(
        {
          plantId: persistentPlant?.plantId ?? '',
          plantedYear: persistentPlant?.plantedYear ?? null,
          quantity: persistentPlant?.quantity ?? null,
          notes: persistentPlant?.notes ?? '',
          status:
            persistentPlant?.status === 'archived'
              ? 'active'
              : (persistentPlant?.status ?? 'active'),
        },
        { emitEvent: false },
      );
    });

    effect(() => {
      const error = this.apiError();

      if (error !== null) {
        applyApiErrorToForm(this.form, error);
      }
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
      plantedYear: nullableNumber(value.plantedYear),
      quantity: nullableNumber(value.quantity),
      notes: nullableText(value.notes),
      status: value.status,
    });
  }
}

export const saneYearValidator = (control: AbstractControl) => {
  const value = nullableNumber(control.value);

  return value === null || (value >= 1900 && value <= 3000) ? null : { saneYear: true };
};

export const nonNegativeValidator = (control: AbstractControl) => {
  const value = nullableNumber(control.value);

  return value === null || value >= 0 ? null : { nonNegative: true };
};

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
