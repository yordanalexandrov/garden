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
import { BedDetail, BedListItem, BedStatus, EDITABLE_BED_STATUSES, UpdateBedRequest } from '../../beds.models';

type BedFormGroup = FormGroup<{
  name: FormControl<string>;
  description: FormControl<string>;
  notes: FormControl<string>;
  widthM: FormControl<number | string | null>;
  lengthM: FormControl<number | string | null>;
  areaM2: FormControl<number | string | null>;
  status: FormControl<BedStatus>;
}>;

@Component({
  selector: 'app-bed-form',
  imports: [
    ApiErrorSummary,
    MatButtonModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    ReactiveFormsModule,
  ],
  templateUrl: './bed-form.html',
  styleUrl: './bed-form.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BedForm {
  readonly bed = input<BedDetail | BedListItem | null>(null);
  readonly apiError = input<ApiError | null>(null);
  readonly saving = input(false);
  readonly submitted = output<UpdateBedRequest>();
  readonly cancelled = output<void>();
  readonly statuses = EDITABLE_BED_STATUSES;

  readonly form: BedFormGroup = new FormGroup({
    name: new FormControl('', { nonNullable: true, validators: [Validators.required] }),
    description: new FormControl('', { nonNullable: true }),
    notes: new FormControl('', { nonNullable: true }),
    widthM: new FormControl<number | string | null>(null, { validators: [positiveNumberValidator] }),
    lengthM: new FormControl<number | string | null>(null, { validators: [positiveNumberValidator] }),
    areaM2: new FormControl<number | string | null>(null, { validators: [positiveNumberValidator] }),
    status: new FormControl<BedStatus>('active', { nonNullable: true }),
  });

  constructor() {
    effect(() => {
      const bed = this.bed();

      this.form.reset(
        {
          name: bed?.name ?? '',
          description: bed?.description ?? '',
          notes: bed !== null && 'notes' in bed ? (bed.notes ?? '') : '',
          widthM: bed?.widthM ?? null,
          lengthM: bed?.lengthM ?? null,
          areaM2: bed?.areaM2 ?? null,
          status: bed?.status === 'archived' ? 'active' : (bed?.status ?? 'active'),
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

  submit(): void {
    this.form.markAllAsTouched();

    if (this.form.invalid) {
      return;
    }

    const value = this.form.getRawValue();
    this.submitted.emit({
      name: value.name.trim(),
      description: nullableText(value.description),
      notes: nullableText(value.notes),
      widthM: nullableNumber(value.widthM),
      lengthM: nullableNumber(value.lengthM),
      areaM2: nullableNumber(value.areaM2),
      status: value.status,
    });
  }
}

export const positiveNumberValidator = (control: AbstractControl) => {
  const value = nullableNumber(control.value);

  return value === null || value > 0 ? null : { positiveNumber: true };
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
