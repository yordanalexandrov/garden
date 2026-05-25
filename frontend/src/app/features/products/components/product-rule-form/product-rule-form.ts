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
  CreateProductUsageRuleRequest,
  PRODUCT_UNITS,
  ProductUnit,
  ProductUsageRuleDetail,
} from '../../products.models';

type ProductRuleFormGroup = FormGroup<{
  plantId: FormControl<string>;
  doseValue: FormControl<number>;
  doseUnit: FormControl<ProductUnit>;
  dilutionText: FormControl<string>;
  applicationMethod: FormControl<string>;
  reapplicationIntervalDays: FormControl<number | null>;
  quarantinePeriodDays: FormControl<number | null>;
  notes: FormControl<string>;
}>;

@Component({
  selector: 'app-product-rule-form',
  imports: [
    ApiErrorSummary,
    MatButtonModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    PlantSelector,
    ReactiveFormsModule,
  ],
  templateUrl: './product-rule-form.html',
  styleUrl: './product-rule-form.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ProductRuleForm {
  readonly rule = input<ProductUsageRuleDetail | null>(null);
  readonly apiError = input<ApiError | null>(null);
  readonly saving = input(false);
  readonly submitted = output<CreateProductUsageRuleRequest>();
  readonly cancelled = output<void>();

  readonly units = PRODUCT_UNITS;

  readonly form: ProductRuleFormGroup = new FormGroup({
    plantId: new FormControl('', { nonNullable: true, validators: [Validators.required] }),
    doseValue: new FormControl(1, { nonNullable: true, validators: [Validators.required, Validators.min(0.000001)] }),
    doseUnit: new FormControl<ProductUnit>('g', { nonNullable: true }),
    dilutionText: new FormControl('', { nonNullable: true }),
    applicationMethod: new FormControl('', { nonNullable: true }),
    reapplicationIntervalDays: new FormControl<number | null>(null, { validators: [Validators.min(0)] }),
    quarantinePeriodDays: new FormControl<number | null>(null, { validators: [Validators.min(0)] }),
    notes: new FormControl('', { nonNullable: true }),
  });

  constructor() {
    effect(() => {
      const rule = this.rule();
      this.form.reset(
        {
          plantId: rule?.plantId ?? '',
          doseValue: rule?.doseValue ?? 1,
          doseUnit: rule?.doseUnit ?? 'g',
          dilutionText: rule?.dilutionText ?? '',
          applicationMethod: rule?.applicationMethod ?? '',
          reapplicationIntervalDays: rule?.reapplicationIntervalDays ?? null,
          quarantinePeriodDays: rule?.quarantinePeriodDays ?? null,
          notes: rule?.notes ?? '',
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
      doseValue: value.doseValue,
      doseUnit: value.doseUnit,
      dilutionText: nullableText(value.dilutionText),
      applicationMethod: nullableText(value.applicationMethod),
      reapplicationIntervalDays: value.reapplicationIntervalDays,
      quarantinePeriodDays: value.quarantinePeriodDays,
      notes: nullableText(value.notes),
    });
  }
}

const nullableText = (value: string): string | null => {
  const trimmed = value.trim();

  return trimmed.length > 0 ? trimmed : null;
};

