import type { DbHandle } from "../../db/transaction.js";
import { AppError } from "../../shared/errors/app-error.js";
import type { AuditService } from "../audit/audit.service.js";
import type { AuthenticatedActor, UUID } from "../auth/auth.types.js";
import type { PlantsRepository } from "../plants/plants.types.js";
import {
  PRODUCT_CATEGORIES,
  SIMPLE_UNITS,
  type CreateProductInput,
  type CreateProductUsageRuleInput,
  type ListProductsFilters,
  type PaginatedProducts,
  type Product,
  type ProductCategory,
  type ProductDetail,
  type ProductsRepository,
  type ProductUsageRule,
  type SimpleUnit,
  type UpdateProductInput,
  type UpdateProductUsageRuleInput
} from "./products.types.js";

export type CreateProductServiceInput = Omit<CreateProductInput, "accountId">;
export type CreateProductUsageRuleServiceInput = Omit<CreateProductUsageRuleInput, "accountId" | "productId">;

export class ProductsService {
  constructor(
    private readonly productsRepository: ProductsRepository,
    private readonly plantsRepository: PlantsRepository,
    private readonly auditService?: AuditService
  ) {}

  async listProducts(actor: AuthenticatedActor, filters: ListProductsFilters, db?: DbHandle): Promise<PaginatedProducts> {
    assertValidProductEnums(filters);

    return this.productsRepository.list(actor.accountId, filters, db);
  }

  async getProduct(actor: AuthenticatedActor, productId: UUID, db?: DbHandle): Promise<ProductDetail> {
    const product = await this.productsRepository.findById(actor.accountId, productId, db);

    if (product === null) {
      throw productNotFoundError();
    }

    const usageRules = await this.productsRepository.listUsageRules(actor.accountId, product.id, db);

    return {
      ...product,
      usageRules
    };
  }

  async createProduct(actor: AuthenticatedActor, input: CreateProductServiceInput, db?: DbHandle): Promise<Product> {
    assertValidProductCreateInput(input);

    try {
      return await this.productsRepository.create(
        {
          ...input,
          accountId: actor.accountId
        },
        db
      );
    } catch (error) {
      mapProductWriteError(error);
    }
  }

  async updateProduct(
    actor: AuthenticatedActor,
    productId: UUID,
    patch: UpdateProductInput,
    db?: DbHandle
  ): Promise<Product> {
    const existing = await this.productsRepository.findById(actor.accountId, productId, db);

    if (existing === null) {
      throw productNotFoundError();
    }

    assertValidProductPatchInput(patch);

    try {
      const updated = await this.productsRepository.update(actor.accountId, productId, patch, db);

      if (updated === null) {
        throw productNotFoundError();
      }

      await this.auditService?.logActorEvent(
        {
          actor,
          entityType: "product",
          entityId: updated.id,
          action: "product.updated",
          beforeJson: {
            name: existing.name,
            category: existing.category,
            defaultUnit: existing.defaultUnit
          },
          afterJson: {
            name: updated.name,
            category: updated.category,
            defaultUnit: updated.defaultUnit
          }
        },
        db
      );

      return updated;
    } catch (error) {
      mapProductWriteError(error);
    }
  }

  async archiveProduct(actor: AuthenticatedActor, productId: UUID, db?: DbHandle): Promise<void> {
    const existing = await this.productsRepository.findById(actor.accountId, productId, db);

    if (existing === null) {
      throw productNotFoundError();
    }

    const archived = await this.productsRepository.archive(actor.accountId, productId, db);

    if (!archived) {
      throw productNotFoundError();
    }

    await this.auditService?.logActorEvent(
      {
        actor,
        entityType: "product",
        entityId: productId,
        action: "product.archived",
        beforeJson: {
          archivedAt: existing.archivedAt?.toISOString() ?? null
        },
        afterJson: {
          archived: true
        }
      },
      db
    );
  }

  async listProductUsageRules(actor: AuthenticatedActor, productId: UUID, db?: DbHandle): Promise<ProductUsageRule[]> {
    const product = await this.productsRepository.findById(actor.accountId, productId, db);

    if (product === null) {
      throw productNotFoundError();
    }

    return this.productsRepository.listUsageRules(actor.accountId, product.id, db);
  }

  async getProductUsageRule(actor: AuthenticatedActor, ruleId: UUID, db?: DbHandle): Promise<ProductUsageRule> {
    const rule = await this.productsRepository.findUsageRuleById(actor.accountId, ruleId, db);

    if (rule === null) {
      throw productUsageRuleNotFoundError();
    }

    return rule;
  }

  async createProductUsageRule(
    actor: AuthenticatedActor,
    productId: UUID,
    input: CreateProductUsageRuleServiceInput,
    db?: DbHandle
  ): Promise<ProductUsageRule> {
    assertValidProductUsageRuleCreateInput(input);
    await this.assertProductAndPlantInActorAccount(actor, productId, input.plantId, db);
    await this.assertNoActiveRuleForProductPlant(actor.accountId, productId, input.plantId, undefined, db);

    try {
      return await this.productsRepository.createUsageRule(
        {
          ...input,
          accountId: actor.accountId,
          productId
        },
        db
      );
    } catch (error) {
      mapProductUsageRuleWriteError(error);
    }
  }

  async updateProductUsageRule(
    actor: AuthenticatedActor,
    ruleId: UUID,
    patch: UpdateProductUsageRuleInput,
    db?: DbHandle
  ): Promise<ProductUsageRule> {
    const existing = await this.productsRepository.findUsageRuleById(actor.accountId, ruleId, db);

    if (existing === null) {
      throw productUsageRuleNotFoundError();
    }

    assertValidProductUsageRulePatchInput(patch);

    const nextPlantId = patch.plantId ?? existing.plantId;

    if (patch.plantId !== undefined) {
      await this.assertPlantInActorAccount(actor, patch.plantId, db);
    }

    await this.assertNoActiveRuleForProductPlant(actor.accountId, existing.productId, nextPlantId, existing.id, db);

    try {
      const updated = await this.productsRepository.updateUsageRule(actor.accountId, ruleId, patch, db);

      if (updated === null) {
        throw productUsageRuleNotFoundError();
      }

      await this.auditService?.logActorEvent(
        {
          actor,
          entityType: "product_usage_rule",
          entityId: updated.id,
          action: "product_usage_rule.updated",
          beforeJson: {
            productId: existing.productId,
            plantId: existing.plantId,
            doseValue: existing.doseValue,
            doseUnit: existing.doseUnit
          },
          afterJson: {
            productId: updated.productId,
            plantId: updated.plantId,
            doseValue: updated.doseValue,
            doseUnit: updated.doseUnit
          }
        },
        db
      );

      return updated;
    } catch (error) {
      mapProductUsageRuleWriteError(error);
    }
  }

  async archiveProductUsageRule(actor: AuthenticatedActor, ruleId: UUID, db?: DbHandle): Promise<void> {
    const existing = await this.productsRepository.findUsageRuleById(actor.accountId, ruleId, db);

    if (existing === null) {
      throw productUsageRuleNotFoundError();
    }

    const archived = await this.productsRepository.archiveUsageRule(actor.accountId, ruleId, db);

    if (!archived) {
      throw productUsageRuleNotFoundError();
    }

    await this.auditService?.logActorEvent(
      {
        actor,
        entityType: "product_usage_rule",
        entityId: ruleId,
        action: "product_usage_rule.archived",
        beforeJson: {
          archivedAt: existing.archivedAt?.toISOString() ?? null
        },
        afterJson: {
          archived: true
        }
      },
      db
    );
  }

  private async assertProductAndPlantInActorAccount(
    actor: AuthenticatedActor,
    productId: UUID,
    plantId: UUID,
    db?: DbHandle
  ): Promise<void> {
    const product = await this.productsRepository.findById(actor.accountId, productId, db);

    if (product === null) {
      throw productNotFoundError();
    }

    const plant = await this.plantsRepository.findById(actor.accountId, plantId, db);

    if (plant === null) {
      throw plantNotFoundError();
    }
  }

  private async assertPlantInActorAccount(actor: AuthenticatedActor, plantId: UUID, db?: DbHandle): Promise<void> {
    const plant = await this.plantsRepository.findById(actor.accountId, plantId, db);

    if (plant === null) {
      throw plantNotFoundError();
    }
  }

  private async assertNoActiveRuleForProductPlant(
    accountId: UUID,
    productId: UUID,
    plantId: UUID,
    excludeRuleId?: UUID,
    db?: DbHandle
  ): Promise<void> {
    const existing = await this.productsRepository.findActiveUsageRuleForProductPlant(
      accountId,
      productId,
      plantId,
      excludeRuleId,
      db
    );

    if (existing !== null) {
      throw duplicateActiveProductUsageRuleError();
    }
  }
}

function assertValidProductCreateInput(input: Partial<CreateProductServiceInput>): void {
  if (typeof input.name !== "string" || input.name.trim().length === 0) {
    throw new AppError("VALIDATION_ERROR", "Product name is required", {
      name: ["Required"]
    });
  }

  if (typeof input.category !== "string" || input.category.trim().length === 0) {
    throw new AppError("VALIDATION_ERROR", "Product category is required", {
      category: ["Required"]
    });
  }

  if (typeof input.defaultUnit !== "string" || input.defaultUnit.trim().length === 0) {
    throw new AppError("VALIDATION_ERROR", "Product defaultUnit is required", {
      defaultUnit: ["Required"]
    });
  }

  assertValidProductEnums(input);
}

function assertValidProductPatchInput(input: Partial<CreateProductServiceInput>): void {
  if (input.name !== undefined && (typeof input.name !== "string" || input.name.trim().length === 0)) {
    throw new AppError("VALIDATION_ERROR", "Product name is required", {
      name: ["Required"]
    });
  }

  assertValidProductEnums(input);
}

function assertValidProductEnums(input: { category?: unknown; defaultUnit?: unknown }): void {
  if (input.category !== undefined && !isProductCategory(input.category)) {
    throw new AppError("VALIDATION_ERROR", "Invalid product category", {
      category: ["Must be one of: insecticide, fungicide, pesticide, fertilizer, foliar_fertilizer, biostimulant, soil_amendment, other_preparation"]
    });
  }

  if (input.defaultUnit !== undefined && !isSimpleUnit(input.defaultUnit)) {
    throw new AppError("VALIDATION_ERROR", "Invalid product defaultUnit", {
      defaultUnit: ["Must be one of: ml, l, g, kg"]
    });
  }
}

function assertValidProductUsageRuleCreateInput(input: Partial<CreateProductUsageRuleServiceInput>): void {
  if (typeof input.plantId !== "string" || input.plantId.trim().length === 0) {
    throw new AppError("VALIDATION_ERROR", "Product usage rule plantId is required", {
      plantId: ["Required"]
    });
  }

  if (typeof input.doseValue !== "number") {
    throw new AppError("VALIDATION_ERROR", "Product usage rule doseValue is required", {
      doseValue: ["Required"]
    });
  }

  if (typeof input.doseUnit !== "string" || input.doseUnit.trim().length === 0) {
    throw new AppError("VALIDATION_ERROR", "Product usage rule doseUnit is required", {
      doseUnit: ["Required"]
    });
  }

  assertValidProductUsageRuleFields(input);
}

function assertValidProductUsageRulePatchInput(input: Partial<CreateProductUsageRuleServiceInput>): void {
  assertValidProductUsageRuleFields(input);
}

function assertValidProductUsageRuleFields(input: {
  doseValue?: unknown;
  doseUnit?: unknown;
  reapplicationIntervalDays?: unknown;
  quarantinePeriodDays?: unknown;
}): void {
  if (input.doseValue !== undefined && (typeof input.doseValue !== "number" || input.doseValue <= 0)) {
    throw new AppError("VALIDATION_ERROR", "Invalid product usage rule doseValue", {
      doseValue: ["Must be greater than 0"]
    });
  }

  if (input.doseUnit !== undefined && !isSimpleUnit(input.doseUnit)) {
    throw new AppError("VALIDATION_ERROR", "Invalid product usage rule doseUnit", {
      doseUnit: ["Must be one of: ml, l, g, kg"]
    });
  }

  assertNullableNonNegativeInteger(input.reapplicationIntervalDays, "reapplicationIntervalDays");
  assertNullableNonNegativeInteger(input.quarantinePeriodDays, "quarantinePeriodDays");
}

function assertNullableNonNegativeInteger(
  value: unknown,
  field: "reapplicationIntervalDays" | "quarantinePeriodDays"
): void {
  if (value === undefined || value === null) {
    return;
  }

  if (typeof value !== "number" || !Number.isInteger(value) || value < 0) {
    throw new AppError("VALIDATION_ERROR", `Invalid product usage rule ${field}`, {
      [field]: ["Must be null or a non-negative integer"]
    });
  }
}

function mapProductWriteError(error: unknown): never {
  if (isPostgresConstraintError(error, "uq_products_account_name_active")) {
    throw new AppError("CONFLICT", "An active product with this name already exists", {
      name: ["Duplicate active product name"]
    });
  }

  rethrowUnknownWriteError(error);
}

function mapProductUsageRuleWriteError(error: unknown): never {
  if (isPostgresConstraintError(error, "uq_product_usage_rules_product_plant_active")) {
    throw duplicateActiveProductUsageRuleError();
  }

  if (isProductUsageRuleAccountGuardError(error)) {
    throw new AppError("BUSINESS_RULE_VIOLATION", "Product usage rule account references are inconsistent");
  }

  rethrowUnknownWriteError(error);
}

function isPostgresConstraintError(error: unknown, constraint: string): boolean {
  return (
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    "constraint" in error &&
    error.code === "23505" &&
    error.constraint === constraint
  );
}

function isProductUsageRuleAccountGuardError(error: unknown): boolean {
  return isPostgresErrorCode(error, "23514") && isProductUsageRuleRelatedError(error);
}

function isPostgresErrorCode(error: unknown, code: string): boolean {
  return typeof error === "object" && error !== null && "code" in error && error.code === code;
}

function isProductUsageRuleRelatedError(error: unknown): boolean {
  if (typeof error !== "object" || error === null) {
    return false;
  }

  if ("table" in error && error.table !== undefined && error.table !== "product_usage_rules") {
    return false;
  }

  if ("constraint" in error && error.constraint !== undefined) {
    return typeof error.constraint === "string" && error.constraint.startsWith("product_usage_rules_");
  }

  return true;
}

function rethrowUnknownWriteError(error: unknown): never {
  if (error instanceof Error) {
    throw error;
  }

  throw new Error("Unexpected non-error thrown while writing product data");
}

function duplicateActiveProductUsageRuleError(): AppError {
  return new AppError("CONFLICT", "An active product usage rule for this product and plant already exists", {
    plantId: ["Duplicate active product usage rule for product and plant"]
  });
}

function productNotFoundError(): AppError {
  return new AppError("NOT_FOUND", "Product not found");
}

function productUsageRuleNotFoundError(): AppError {
  return new AppError("NOT_FOUND", "Product usage rule not found");
}

function plantNotFoundError(): AppError {
  return new AppError("NOT_FOUND", "Plant not found");
}

function isProductCategory(value: unknown): value is ProductCategory {
  return typeof value === "string" && (PRODUCT_CATEGORIES as readonly string[]).includes(value);
}

function isSimpleUnit(value: unknown): value is SimpleUnit {
  return typeof value === "string" && (SIMPLE_UNITS as readonly string[]).includes(value);
}
