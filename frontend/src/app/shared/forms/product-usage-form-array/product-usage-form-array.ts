import { ChangeDetectionStrategy, Component, DestroyRef, computed, inject, output, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormArray, FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatOptionModule } from '@angular/material/core';
import { MatSelectModule } from '@angular/material/select';

import { ActivityProductUsageRequest } from '../../../features/activities/activities.models';
import {
  PRODUCT_UNITS,
  ProductListItem,
  ProductUnit,
  ProductUsageRule,
} from '../../../features/products/products.models';
import {
  ProductRulesApiService,
  ProductsApiService,
} from '../../../features/products/products-api.service';

type ProductUsageRow = FormGroup<{
  productId: FormControl<string>;
  productUsageRuleId: FormControl<string | null>;
  quantityUsed: FormControl<number | null>;
  unit: FormControl<ProductUnit>;
  notes: FormControl<string>;
}>;

@Component({
  selector: 'app-product-usage-form-array',
  imports: [
    MatButtonModule,
    MatFormFieldModule,
    MatIconModule,
    MatInputModule,
    MatOptionModule,
    MatSelectModule,
    ReactiveFormsModule,
  ],
  templateUrl: './product-usage-form-array.html',
  styleUrl: './product-usage-form-array.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ProductUsageFormArray {
  readonly productUsagesChange = output<readonly ActivityProductUsageRequest[]>();
  readonly products = signal<readonly ProductListItem[]>([]);
  readonly rulesByRow = signal<Record<number, readonly ProductUsageRule[]>>({});
  readonly units = PRODUCT_UNITS;
  readonly rows = new FormArray<ProductUsageRow>([]);
  readonly valid = computed(() => this.rows.valid);

  private readonly productsApi = inject(ProductsApiService);
  private readonly rulesApi = inject(ProductRulesApiService);
  private readonly destroyRef = inject(DestroyRef);

  constructor() {
    this.productsApi
      .list({ page: 1, pageSize: 100 })
      .pipe(takeUntilDestroyed())
      .subscribe((result) => this.products.set(result.items));

    this.rows.valueChanges.pipe(takeUntilDestroyed()).subscribe(() => this.emitRows());
  }

  addRow(): void {
    const row = new FormGroup({
      productId: new FormControl('', { nonNullable: true, validators: [Validators.required] }),
      productUsageRuleId: new FormControl<string | null>(null),
      quantityUsed: new FormControl<number | null>(null, [Validators.required, Validators.min(0.000001)]),
      unit: new FormControl<ProductUnit>('ml', { nonNullable: true, validators: [Validators.required] }),
      notes: new FormControl('', { nonNullable: true }),
    });
    const index = this.rows.length;

    row.controls.productId.valueChanges.pipe(takeUntilDestroyed(this.destroyRef)).subscribe((productId) => {
      row.controls.productUsageRuleId.setValue(null);
      this.loadRules(index, productId);
      const product = this.products().find((item) => item.id === productId);
      if (product) {
        row.controls.unit.setValue(product.defaultUnit);
      }
    });

    this.rows.push(row);
    this.emitRows();
  }

  removeRow(index: number): void {
    this.rows.removeAt(index);
    const nextRules: Record<number, readonly ProductUsageRule[]> = {};
    this.rows.controls.forEach((_, rowIndex) => {
      nextRules[rowIndex] = this.rulesByRow()[rowIndex >= index ? rowIndex + 1 : rowIndex] ?? [];
    });
    this.rulesByRow.set(nextRules);
    this.emitRows();
  }

  missingRule(index: number): boolean {
    const row = this.rows.at(index);
    return Boolean(row?.controls.productId.value) && !row?.controls.productUsageRuleId.value;
  }

  inconsistentRule(index: number): boolean {
    const row = this.rows.at(index);
    const ruleId = row?.controls.productUsageRuleId.value;

    if (!row || !ruleId) {
      return false;
    }

    const rule = this.rulesByRow()[index]?.find((item) => item.id === ruleId);
    return Boolean(rule && rule.productId !== row.controls.productId.value);
  }

  productLabel(productId: string): string {
    return this.products().find((item) => item.id === productId)?.name ?? productId;
  }

  private loadRules(index: number, productId: string): void {
    if (!productId) {
      this.rulesByRow.update((rules) => ({ ...rules, [index]: [] }));
      return;
    }

    this.rulesApi
      .listByProduct(productId)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((result) => {
        this.rulesByRow.update((rules) => ({ ...rules, [index]: result.items }));
      });
  }

  private emitRows(): void {
    const rows = this.rows.controls
      .filter((row) => row.valid)
      .map((row) => ({
        productId: row.controls.productId.value,
        productUsageRuleId: row.controls.productUsageRuleId.value,
        quantityUsed: Number(row.controls.quantityUsed.value),
        unit: row.controls.unit.value,
        notes: row.controls.notes.value || null,
      }));

    this.productUsagesChange.emit(rows);
  }
}
