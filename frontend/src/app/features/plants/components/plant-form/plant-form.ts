import { ChangeDetectionStrategy, Component, effect, input, output } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';

import { ApiError } from '../../../../core/errors/api-error';
import { ApiErrorSummary } from '../../../../shared/forms/api-error-summary/api-error-summary';
import { applyApiErrorToForm } from '../../../../shared/forms/api-error-summary/api-error-form';
import {
  CreatePlantRequest,
  GrowingStyle,
  LifecycleType,
  PLANT_GROWING_STYLES,
  PLANT_LIFECYCLE_TYPES,
  PlantDetail,
} from '../../plants.models';

type PlantFormGroup = FormGroup<{
  commonName: FormControl<string>;
  variety: FormControl<string>;
  plantCategory: FormControl<string>;
  lifecycleType: FormControl<LifecycleType>;
  growingStyle: FormControl<GrowingStyle>;
  notes: FormControl<string>;
}>;

@Component({
  selector: 'app-plant-form',
  imports: [
    ApiErrorSummary,
    MatButtonModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    ReactiveFormsModule,
  ],
  templateUrl: './plant-form.html',
  styleUrl: './plant-form.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PlantForm {
  readonly plant = input<PlantDetail | null>(null);
  readonly apiError = input<ApiError | null>(null);
  readonly saving = input(false);
  readonly submitted = output<CreatePlantRequest>();
  readonly cancelled = output<void>();

  readonly lifecycleTypes = PLANT_LIFECYCLE_TYPES;
  readonly growingStyles = PLANT_GROWING_STYLES;

  readonly form: PlantFormGroup = new FormGroup({
    commonName: new FormControl('', { nonNullable: true, validators: [Validators.required] }),
    variety: new FormControl('', { nonNullable: true }),
    plantCategory: new FormControl('', { nonNullable: true }),
    lifecycleType: new FormControl<LifecycleType>('annual', { nonNullable: true }),
    growingStyle: new FormControl<GrowingStyle>('other', { nonNullable: true }),
    notes: new FormControl('', { nonNullable: true }),
  });

  constructor() {
    effect(() => {
      const plant = this.plant();

      this.form.reset(
        {
          commonName: plant?.commonName ?? '',
          variety: plant?.variety ?? '',
          plantCategory: plant?.plantCategory ?? '',
          lifecycleType: plant?.lifecycleType ?? 'annual',
          growingStyle: plant?.growingStyle ?? 'other',
          notes: plant?.notes ?? '',
        },
        { emitEvent: false },
      );
    });

    effect(() => {
      applyApiErrorToForm(this.form, this.apiError());
    });
  }

  submit(): void {
    this.form.markAllAsTouched();

    if (this.form.invalid) {
      return;
    }

    const value = this.form.getRawValue();
    this.submitted.emit({
      commonName: value.commonName.trim(),
      variety: nullableText(value.variety),
      plantCategory: nullableText(value.plantCategory),
      lifecycleType: value.lifecycleType,
      growingStyle: value.growingStyle,
      notes: nullableText(value.notes),
    });
  }
}

const nullableText = (value: string): string | null => {
  const trimmed = value.trim();

  return trimmed.length > 0 ? trimmed : null;
};
