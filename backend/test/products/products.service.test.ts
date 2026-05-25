import { describe, expect, it } from "vitest";

import { TestAuthIds, createTestActor } from "../../src/modules/auth/test-auth.adapter.js";
import { ProductsService } from "../../src/modules/products/products.service.js";
import type {
  CreateProductInput,
  CreateProductUsageRuleInput,
  ListProductsFilters,
  PaginatedProducts,
  Product,
  ProductsRepository,
  ProductUsageRule,
  UpdateProductInput,
  UpdateProductUsageRuleInput
} from "../../src/modules/products/products.types.js";
import type {
  CreatePlantInput,
  ListPlantsFilters,
  PaginatedPlants,
  Plant,
  PlantsRepository,
  UpdatePlantInput
} from "../../src/modules/plants/plants.types.js";

const actorA = createTestActor({
  userId: TestAuthIds.userA,
  accountId: TestAuthIds.accountA,
  email: "account-a@example.com"
});

describe("ProductsService", () => {
  it("derives product account scope from the actor and maps duplicate names to CONFLICT", async () => {
    const productsRepository = new StubProductsRepository();
    const service = new ProductsService(productsRepository, new StubPlantsRepository());

    await service.createProduct(actorA, {
      name: "Copper Fungicide",
      category: "fungicide",
      defaultUnit: "g"
    });

    expect(productsRepository.createdProducts).toEqual([
      expect.objectContaining({
        accountId: TestAuthIds.accountA,
        name: "Copper Fungicide"
      })
    ]);

    productsRepository.createProductError = duplicateProductNameError();

    await expect(
      service.createProduct(actorA, {
        name: "Copper Fungicide",
        category: "fungicide",
        defaultUnit: "g"
      })
    ).rejects.toMatchObject({
      code: "CONFLICT",
      details: {
        name: ["Duplicate active product name"]
      }
    });
  });

  it("validates product category and unit before repository writes", async () => {
    const productsRepository = new StubProductsRepository();
    const service = new ProductsService(productsRepository, new StubPlantsRepository());

    await expect(
      service.createProduct(actorA, {
        name: "Invalid Product",
        category: "fungal",
        defaultUnit: "g"
      } as never)
    ).rejects.toMatchObject({
      code: "VALIDATION_ERROR",
      details: {
        category: [
          "Must be one of: insecticide, fungicide, pesticide, fertilizer, foliar_fertilizer, biostimulant, soil_amendment, other_preparation"
        ]
      }
    });
    await expect(
      service.updateProduct(actorA, productsRepository.product!.id, {
        defaultUnit: "oz"
      } as never)
    ).rejects.toMatchObject({
      code: "VALIDATION_ERROR",
      details: {
        defaultUnit: ["Must be one of: ml, l, g, kg"]
      }
    });
    expect(productsRepository.createdProducts).toHaveLength(0);
    expect(productsRepository.updatedProducts).toHaveLength(0);
  });

  it("returns product detail with active usage rules and maps missing products to NOT_FOUND", async () => {
    const productsRepository = new StubProductsRepository();
    productsRepository.rules = [createRule()];
    const service = new ProductsService(productsRepository, new StubPlantsRepository());

    await expect(service.getProduct(actorA, productsRepository.product!.id)).resolves.toMatchObject({
      id: productsRepository.product!.id,
      usageRules: [
        {
          id: productsRepository.rules[0]!.id
        }
      ]
    });

    productsRepository.product = null;

    await expect(service.getProduct(actorA, "99999999-9999-4999-8999-999999999999")).rejects.toMatchObject({
      code: "NOT_FOUND"
    });
  });

  it("validates product and plant ownership before creating usage rules", async () => {
    const productsRepository = new StubProductsRepository();
    const plantsRepository = new StubPlantsRepository();
    const service = new ProductsService(productsRepository, plantsRepository);

    await service.createProductUsageRule(actorA, productsRepository.product!.id, {
      plantId: plantsRepository.plant!.id,
      doseValue: 20,
      doseUnit: "g"
    });

    expect(productsRepository.createdRules).toEqual([
      expect.objectContaining({
        accountId: TestAuthIds.accountA,
        productId: productsRepository.product!.id,
        plantId: plantsRepository.plant!.id
      })
    ]);

    plantsRepository.plant = null;

    await expect(
      service.createProductUsageRule(actorA, productsRepository.product!.id, {
        plantId: "44444444-4444-4444-8444-444444444444",
        doseValue: 20,
        doseUnit: "g"
      })
    ).rejects.toMatchObject({
      code: "NOT_FOUND",
      message: "Plant not found"
    });
  });

  it("maps product usage rule database account guard errors by Postgres code", async () => {
    const productsRepository = new StubProductsRepository();
    const plantsRepository = new StubPlantsRepository();
    const service = new ProductsService(productsRepository, plantsRepository);
    productsRepository.createRuleError = productUsageRuleAccountGuardError();

    await expect(
      service.createProductUsageRule(actorA, productsRepository.product!.id, {
        plantId: plantsRepository.plant!.id,
        doseValue: 20,
        doseUnit: "g"
      })
    ).rejects.toMatchObject({
      code: "BUSINESS_RULE_VIOLATION",
      message: "Product usage rule account references are inconsistent"
    });
  });

  it("rejects invalid usage rule values before repository writes", async () => {
    const productsRepository = new StubProductsRepository();
    const plantsRepository = new StubPlantsRepository();
    const service = new ProductsService(productsRepository, plantsRepository);

    await expect(
      service.createProductUsageRule(actorA, productsRepository.product!.id, {
        plantId: plantsRepository.plant!.id,
        doseValue: 0,
        doseUnit: "g"
      })
    ).rejects.toMatchObject({
      code: "VALIDATION_ERROR",
      details: {
        doseValue: ["Must be greater than 0"]
      }
    });
    await expect(
      service.createProductUsageRule(actorA, productsRepository.product!.id, {
        plantId: plantsRepository.plant!.id,
        doseValue: 20,
        doseUnit: "oz"
      } as never)
    ).rejects.toMatchObject({
      code: "VALIDATION_ERROR",
      details: {
        doseUnit: ["Must be one of: ml, l, g, kg"]
      }
    });

    expect(productsRepository.createdRules).toHaveLength(0);
  });

  it("enforces one active usage rule per product and plant and allows archived replacement", async () => {
    const productsRepository = new StubProductsRepository();
    const plantsRepository = new StubPlantsRepository();
    const service = new ProductsService(productsRepository, plantsRepository);
    productsRepository.activeRule = createRule();

    await expect(
      service.createProductUsageRule(actorA, productsRepository.product!.id, {
        plantId: plantsRepository.plant!.id,
        doseValue: 20,
        doseUnit: "g"
      })
    ).rejects.toMatchObject({
      code: "CONFLICT"
    });

    productsRepository.activeRule = null;

    await expect(
      service.createProductUsageRule(actorA, productsRepository.product!.id, {
        plantId: plantsRepository.plant!.id,
        doseValue: 20,
        doseUnit: "g"
      })
    ).resolves.toMatchObject({
      productId: productsRepository.product!.id,
      plantId: plantsRepository.plant!.id
    });
  });

  it("validates duplicate active rule policy when updating a rule", async () => {
    const productsRepository = new StubProductsRepository();
    const plantsRepository = new StubPlantsRepository();
    const service = new ProductsService(productsRepository, plantsRepository);
    productsRepository.rule = createRule();
    productsRepository.activeRule = createRule({ id: "55555555-5555-4555-8555-555555555555" });

    await expect(
      service.updateProductUsageRule(actorA, productsRepository.rule.id, {
        plantId: plantsRepository.plant!.id
      })
    ).rejects.toMatchObject({
      code: "CONFLICT"
    });

    productsRepository.activeRule = null;

    await expect(
      service.updateProductUsageRule(actorA, productsRepository.rule.id, {
        doseValue: 25,
        quarantinePeriodDays: null
      })
    ).resolves.toMatchObject({
      id: productsRepository.rule.id,
      doseValue: 25,
      quarantinePeriodDays: null
    });
  });

  it("updates existing rule fields without revalidating archived product or unchanged plant", async () => {
    const productsRepository = new StubProductsRepository();
    const plantsRepository = new StubPlantsRepository();
    const service = new ProductsService(productsRepository, plantsRepository);
    productsRepository.rule = createRule();
    productsRepository.product = null;
    plantsRepository.plant = null;

    await expect(
      service.updateProductUsageRule(actorA, productsRepository.rule.id, {
        doseValue: 25
      })
    ).resolves.toMatchObject({
      id: productsRepository.rule.id,
      doseValue: 25
    });
  });

  it("validates the new plant only when moving a rule to another plant", async () => {
    const productsRepository = new StubProductsRepository();
    const plantsRepository = new StubPlantsRepository();
    const service = new ProductsService(productsRepository, plantsRepository);
    productsRepository.rule = createRule();
    productsRepository.product = null;
    plantsRepository.plant = null;

    await expect(
      service.updateProductUsageRule(actorA, productsRepository.rule.id, {
        plantId: "77777777-7777-4777-8777-777777777777"
      })
    ).rejects.toMatchObject({
      code: "NOT_FOUND",
      message: "Plant not found"
    });
  });
});

class StubProductsRepository implements ProductsRepository {
  product: Product | null = createProduct();
  rule: ProductUsageRule | null = createRule();
  activeRule: ProductUsageRule | null = null;
  rules: ProductUsageRule[] = [];
  createdProducts: CreateProductInput[] = [];
  updatedProducts: UpdateProductInput[] = [];
  createdRules: CreateProductUsageRuleInput[] = [];
  updatedRules: UpdateProductUsageRuleInput[] = [];
  createProductError: Error | undefined;
  createRuleError: Error | undefined;

  list(_accountId: string, filters: ListProductsFilters): Promise<PaginatedProducts> {
    return Promise.resolve({
      items: this.product === null ? [] : [{ ...this.product, rulesCount: this.rules.length }],
      page: filters.page,
      pageSize: filters.pageSize,
      total: this.product === null ? 0 : 1
    });
  }

  findById(): Promise<Product | null> {
    return Promise.resolve(this.product);
  }

  create(input: CreateProductInput): Promise<Product> {
    this.createdProducts.push(input);

    if (this.createProductError !== undefined) {
      return Promise.reject(this.createProductError);
    }

    return Promise.resolve(createProduct(input));
  }

  update(_accountId: string, _productId: string, patch: UpdateProductInput): Promise<Product | null> {
    this.updatedProducts.push(patch);

    if (this.product === null) {
      return Promise.resolve(null);
    }

    return Promise.resolve({
      ...this.product,
      ...patch
    });
  }

  archive(): Promise<boolean> {
    return Promise.resolve(this.product !== null);
  }

  listUsageRules(): Promise<ProductUsageRule[]> {
    return Promise.resolve(this.rules);
  }

  findUsageRuleById(): Promise<ProductUsageRule | null> {
    return Promise.resolve(this.rule);
  }

  findActiveUsageRuleForProductPlant(): Promise<ProductUsageRule | null> {
    return Promise.resolve(this.activeRule);
  }

  createUsageRule(input: CreateProductUsageRuleInput): Promise<ProductUsageRule> {
    this.createdRules.push(input);

    if (this.createRuleError !== undefined) {
      return Promise.reject(this.createRuleError);
    }

    return Promise.resolve(createRule(input));
  }

  updateUsageRule(_accountId: string, _ruleId: string, patch: UpdateProductUsageRuleInput): Promise<ProductUsageRule | null> {
    this.updatedRules.push(patch);

    if (this.rule === null) {
      return Promise.resolve(null);
    }

    return Promise.resolve({
      ...this.rule,
      ...patch
    });
  }

  archiveUsageRule(): Promise<boolean> {
    return Promise.resolve(this.rule !== null);
  }
}

class StubPlantsRepository implements PlantsRepository {
  plant: Plant | null = createPlant();

  list(_accountId: string, filters: ListPlantsFilters): Promise<PaginatedPlants> {
    return Promise.resolve({
      items: this.plant === null ? [] : [this.plant],
      page: filters.page,
      pageSize: filters.pageSize,
      total: this.plant === null ? 0 : 1
    });
  }

  findById(): Promise<Plant | null> {
    return Promise.resolve(this.plant);
  }

  create(input: CreatePlantInput): Promise<Plant> {
    return Promise.resolve(createPlant(input));
  }

  update(_accountId: string, _plantId: string, patch: UpdatePlantInput): Promise<Plant | null> {
    if (this.plant === null) {
      return Promise.resolve(null);
    }

    return Promise.resolve({
      ...this.plant,
      ...patch
    });
  }

  archive(): Promise<boolean> {
    return Promise.resolve(this.plant !== null);
  }
}

function createProduct(overrides: Partial<Product> = {}): Product {
  const now = new Date("2026-05-25T08:00:00.000Z");

  return {
    id: "11111111-1111-4111-8111-111111111111",
    accountId: TestAuthIds.accountA,
    name: "Copper Fungicide",
    category: "fungicide",
    activeSubstance: "Copper",
    manufacturer: "Example Co",
    formulation: "WG",
    defaultUnit: "g",
    notes: null,
    createdAt: now,
    updatedAt: now,
    archivedAt: null,
    ...overrides
  };
}

function createRule(overrides: Partial<ProductUsageRule> = {}): ProductUsageRule {
  const now = new Date("2026-05-25T08:00:00.000Z");

  return {
    id: "33333333-3333-4333-8333-333333333333",
    accountId: TestAuthIds.accountA,
    productId: "11111111-1111-4111-8111-111111111111",
    plantId: "22222222-2222-4222-8222-222222222222",
    doseValue: 20,
    doseUnit: "g",
    dilutionText: null,
    applicationMethod: null,
    reapplicationIntervalDays: null,
    quarantinePeriodDays: null,
    notes: null,
    createdAt: now,
    updatedAt: now,
    archivedAt: null,
    ...overrides
  };
}

function createPlant(overrides: Partial<Plant> = {}): Plant {
  const now = new Date("2026-05-25T08:00:00.000Z");

  return {
    id: "22222222-2222-4222-8222-222222222222",
    accountId: TestAuthIds.accountA,
    commonName: "Tomato",
    variety: null,
    plantCategory: "vegetable",
    lifecycleType: "annual",
    growingStyle: "vegetable",
    notes: null,
    createdAt: now,
    updatedAt: now,
    archivedAt: null,
    ...overrides
  };
}

function duplicateProductNameError(): Error {
  return Object.assign(new Error("duplicate active product name"), {
    code: "23505",
    constraint: "uq_products_account_name_active"
  });
}

function productUsageRuleAccountGuardError(): Error {
  return Object.assign(new Error("product_usage_rule account guard failed"), {
    code: "23514"
  });
}
