import { ChangeDetectionStrategy, Component, effect, input, output, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
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

  /**
   * False while the area is derived live from width × length; true once the user
   * types an explicit area (e.g. an irregular bed). Clearing the area resumes auto mode.
   */
  readonly areaOverridden = signal(false);

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
      const widthM = bed?.widthM ?? null;
      const lengthM = bed?.lengthM ?? null;
      const areaM2 = bed?.areaM2 ?? null;

      this.form.reset(
        {
          name: bed?.name ?? '',
          description: bed?.description ?? '',
          notes: bed !== null && 'notes' in bed ? (bed.notes ?? '') : '',
          widthM,
          lengthM,
          areaM2,
          status: bed?.status === 'archived' ? 'active' : (bed?.status ?? 'active'),
        },
        { emitEvent: false },
      );

      // A stored area that does not match width × length is treated as a manual override.
      this.areaOverridden.set(areaM2 !== null && areaM2 !== deriveArea(widthM, lengthM));
    });

    effect(() => {
      applyApiErrorToForm(this.form, this.apiError());
    });

    const recomputeIfAuto = (): void => {
      if (!this.areaOverridden()) {
        this.recomputeArea();
      }
    };

    this.form.controls.widthM.valueChanges.pipe(takeUntilDestroyed()).subscribe(recomputeIfAuto);
    this.form.controls.lengthM.valueChanges.pipe(takeUntilDestroyed()).subscribe(recomputeIfAuto);

    // Only fires on user input — programmatic area updates use { emitEvent: false }.
    this.form.controls.areaM2.valueChanges.pipe(takeUntilDestroyed()).subscribe((value) => {
      if (nullableNumber(value) === null) {
        this.areaOverridden.set(false);
        this.recomputeArea();
      } else {
        this.areaOverridden.set(true);
      }
    });
  }

  resetAreaToAuto(): void {
    this.areaOverridden.set(false);
    this.recomputeArea();
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

  private recomputeArea(): void {
    const area = deriveArea(
      nullableNumber(this.form.controls.widthM.value),
      nullableNumber(this.form.controls.lengthM.value),
    );

    this.form.controls.areaM2.setValue(area, { emitEvent: false });
  }
}

export const positiveNumberValidator = (control: AbstractControl) => {
  const value = nullableNumber(control.value);

  return value === null || value > 0 ? null : { positiveNumber: true };
};

const deriveArea = (widthM: number | null, lengthM: number | null): number | null => {
  if (widthM === null || lengthM === null || widthM <= 0 || lengthM <= 0) {
    return null;
  }

  return Number((widthM * lengthM).toFixed(6));
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
