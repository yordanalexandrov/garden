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
  EDITABLE_PERENNIAL_STATUSES,
  PerennialListItem,
  PerennialStatus,
  UpdatePerennialRequest,
} from '../../perennials.models';

type PerennialFormGroup = FormGroup<{
  plantId: FormControl<string>;
  label: FormControl<string>;
  plantedYear: FormControl<number | string | null>;
  notes: FormControl<string>;
  status: FormControl<PerennialStatus>;
}>;

@Component({
  selector: 'app-perennial-form',
  imports: [
    ApiErrorSummary,
    MatButtonModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    PlantSelector,
    ReactiveFormsModule,
  ],
  templateUrl: './perennial-form.html',
  styleUrl: './perennial-form.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PerennialForm {
  readonly perennial = input<PerennialListItem | null>(null);
  readonly apiError = input<ApiError | null>(null);
  readonly saving = input(false);
  readonly submitted = output<UpdatePerennialRequest>();
  readonly cancelled = output<void>();
  readonly statuses = EDITABLE_PERENNIAL_STATUSES;

  readonly form: PerennialFormGroup = new FormGroup({
    plantId: new FormControl('', { nonNullable: true, validators: [Validators.required] }),
    label: new FormControl('', { nonNullable: true }),
    plantedYear: new FormControl<number | string | null>(null, {
      validators: [saneYearValidator],
    }),
    notes: new FormControl('', { nonNullable: true }),
    status: new FormControl<PerennialStatus>('active', { nonNullable: true }),
  });

  constructor() {
    effect(() => {
      const perennial = this.perennial();

      this.form.reset(
        {
          plantId: perennial?.plantId ?? '',
          label: perennial?.label ?? '',
          plantedYear: perennial?.plantedYear ?? null,
          notes: perennial?.notes ?? '',
          status: perennial?.status === 'archived' ? 'active' : (perennial?.status ?? 'active'),
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
      label: nullableText(value.label),
      plantedYear: nullableNumber(value.plantedYear),
      notes: nullableText(value.notes),
      status: value.status,
    });
  }
}

export const saneYearValidator = (control: AbstractControl) => {
  const value = nullableNumber(control.value);

  return value === null || (value >= 1900 && value <= 3000) ? null : { saneYear: true };
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
