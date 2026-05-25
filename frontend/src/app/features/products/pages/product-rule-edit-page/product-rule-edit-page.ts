import { ChangeDetectionStrategy, Component, DestroyRef, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { ActivatedRoute, Router } from '@angular/router';

import { ApiError } from '../../../../core/errors/api-error';
import { mapApiError } from '../../../../core/errors/api-error.mapper';
import { SnackbarService } from '../../../../core/notifications/snackbar.service';
import { ArchiveConfirmationService } from '../../../../shared/components/confirm-dialog/confirm-dialog';
import { PageHeader } from '../../../../shared/components/page-header/page-header';
import { ProductRuleForm } from '../../components/product-rule-form/product-rule-form';
import {
  CreateProductUsageRuleRequest,
  ProductUsageRuleDetail,
} from '../../products.models';
import { ProductRulesApiService } from '../../products-api.service';

@Component({
  selector: 'app-product-rule-edit-page',
  imports: [MatButtonModule, MatIconModule, PageHeader, ProductRuleForm],
  templateUrl: './product-rule-edit-page.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ProductRuleEditPage {
  readonly rule = signal<ProductUsageRuleDetail | null>(null);
  readonly saving = signal(false);
  readonly error = signal<ApiError | null>(null);

  private readonly rulesApi = inject(ProductRulesApiService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly snackbar = inject(SnackbarService);
  private readonly archiveConfirmation = inject(ArchiveConfirmationService);
  private readonly destroyRef = inject(DestroyRef);

  constructor() {
    this.loadRule();
  }

  updateRule(request: CreateProductUsageRuleRequest): void {
    const rule = this.rule();

    if (rule === null) {
      return;
    }

    this.saving.set(true);
    this.error.set(null);
    this.rulesApi
      .update(rule.id, request)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => {
          this.snackbar.showMessage('Usage rule updated.');
          void this.router.navigate(['/products', rule.productId]);
        },
        error: (error: unknown) => {
          this.error.set(mapApiError(error));
          this.saving.set(false);
        },
      });
  }

  archiveRule(): void {
    const rule = this.rule();

    if (rule === null) {
      return;
    }

    this.archiveConfirmation
      .confirmArchive('usage rule')
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((confirmed) => {
        if (!confirmed) {
          return;
        }

        this.rulesApi
          .archive(rule.id)
          .pipe(takeUntilDestroyed(this.destroyRef))
          .subscribe({
            next: () => {
              this.snackbar.showMessage('Usage rule archived.');
              void this.router.navigate(['/products', rule.productId]);
            },
            error: (error: unknown) => this.error.set(mapApiError(error)),
          });
      });
  }

  cancel(): void {
    const productId = this.rule()?.productId;
    void this.router.navigate(productId ? ['/products', productId] : ['/products']);
  }

  private loadRule(): void {
    const ruleId = this.route.snapshot.paramMap.get('ruleId');

    if (ruleId === null) {
      this.error.set(new ApiError('VALIDATION_ERROR', 'Rule id is required.'));
      return;
    }

    this.rulesApi
      .get(ruleId)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (rule) => this.rule.set(rule),
        error: (error: unknown) => this.error.set(mapApiError(error)),
      });
  }
}

