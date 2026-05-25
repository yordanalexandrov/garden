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
  CreateProductRequest,
  PRODUCT_CATEGORIES,
  PRODUCT_UNITS,
  ProductCategory,
  ProductDetail,
  ProductUnit,
} from '../../products.models';

type ProductFormGroup = FormGroup<{
  name: FormControl<string>;
  category: FormControl<ProductCategory>;
  activeSubstance: FormControl<string>;
  manufacturer: FormControl<string>;
  formulation: FormControl<string>;
  defaultUnit: FormControl<ProductUnit>;
  notes: FormControl<string>;
}>;

@Component({
  selector: 'app-product-form',
  imports: [
    ApiErrorSummary,
    MatButtonModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    ReactiveFormsModule,
  ],
  templateUrl: './product-form.html',
  styleUrl: './product-form.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ProductForm {
  readonly product = input<ProductDetail | null>(null);
  readonly apiError = input<ApiError | null>(null);
  readonly saving = input(false);
  readonly submitted = output<CreateProductRequest>();
  readonly cancelled = output<void>();

  readonly categories = PRODUCT_CATEGORIES;
  readonly units = PRODUCT_UNITS;

  readonly form: ProductFormGroup = new FormGroup({
    name: new FormControl('', { nonNullable: true, validators: [Validators.required] }),
    category: new FormControl<ProductCategory>('other_preparation', { nonNullable: true }),
    activeSubstance: new FormControl('', { nonNullable: true }),
    manufacturer: new FormControl('', { nonNullable: true }),
    formulation: new FormControl('', { nonNullable: true }),
    defaultUnit: new FormControl<ProductUnit>('g', { nonNullable: true }),
    notes: new FormControl('', { nonNullable: true }),
  });

  constructor() {
    effect(() => {
      const product = this.product();
      this.form.reset(
        {
          name: product?.name ?? '',
          category: product?.category ?? 'other_preparation',
          activeSubstance: product?.activeSubstance ?? '',
          manufacturer: product?.manufacturer ?? '',
          formulation: product?.formulation ?? '',
          defaultUnit: product?.defaultUnit ?? 'g',
          notes: product?.notes ?? '',
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
      name: value.name.trim(),
      category: value.category,
      activeSubstance: nullableText(value.activeSubstance),
      manufacturer: nullableText(value.manufacturer),
      formulation: nullableText(value.formulation),
      defaultUnit: value.defaultUnit,
      notes: nullableText(value.notes),
    });
  }
}

const nullableText = (value: string): string | null => {
  const trimmed = value.trim();

  return trimmed.length > 0 ? trimmed : null;
};

