import type { FastifyInstance } from "fastify";
import type { Pool } from "pg";
import { afterEach, beforeEach, describe, expect, it } from "vitest";

import { loadConfig } from "../../src/config/config.js";
import { createDbClient } from "../../src/db/db.js";
import type { DbClient } from "../../src/db/transaction.js";
import { KyselyAccountsRepository, type AccountsRepository } from "../../src/modules/accounts/accounts.repository.js";
import type { Account } from "../../src/modules/accounts/accounts.types.js";
import { TestAuthAdapter, TestAuthIds } from "../../src/modules/auth/test-auth.adapter.js";
import { createTestPool, hasTestDatabase, resetAndApplyBaseline } from "../db/helpers/test-database.js";
import { AccountFixtureIds, insertAuthAccountFixtures } from "../helpers/accounts.js";
import { createTestApp } from "../helpers/app.js";
import { accountAAuthHeaders, accountBAuthHeaders } from "../helpers/auth.js";

const describeDatabase = hasTestDatabase() ? describe : describe.skip;
const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const isoTimestampPattern = /^\d{4}-\d{2}-\d{2}T/;

const ProductIds = {
  copperA: "11111111-1111-4111-8111-111111111111",
  archivedA: "22222222-2222-4222-8222-222222222222",
  copperB: "33333333-3333-4333-8333-333333333333"
} as const;

const PlantIds = {
  tomatoA: "44444444-4444-4444-8444-444444444444",
  pepperA: "55555555-5555-4555-8555-555555555555",
  tomatoB: "66666666-6666-4666-8666-666666666666"
} as const;

const RuleIds = {
  tomatoA: "77777777-7777-4777-8777-777777777777",
  pepperA: "88888888-8888-4888-8888-888888888888",
  tomatoB: "99999999-9999-4999-8999-999999999999"
} as const;

type MutationResponse = {
  data: {
    id: string;
  };
};

type ProductDetailResponse = {
  data: {
    id: string;
    name: string;
    usageRules: Array<{ id: string; plantId: string; doseValue: number }>;
    inventorySummary: { quantityRemaining: number; unit: string; lotsCount: number; expiredLotsCount: number };
    recentMovements: unknown[];
    createdAt: string;
    updatedAt: string;
  };
};

type ProductUsageRuleDetailResponse = {
  data: {
    id: string;
    productId: string;
    plantId: string;
    doseValue: number;
    doseUnit: string;
    createdAt: string;
    updatedAt: string;
  };
};

describe("Products routes", () => {
  let app: FastifyInstance | undefined;

  afterEach(async () => {
    await app?.close();
    app = undefined;
  });

  it("returns UNAUTHORIZED for unauthenticated product requests", async () => {
    app = await createAuthenticatedTestApp();

    const response = await app.inject({ method: "GET", url: "/api/v1/products" });

    expect(response.statusCode).toBe(401);
    expect(response.json()).toEqual({
      error: {
        code: "UNAUTHORIZED",
        message: "Unauthorized",
        details: {}
      }
    });
  });

  it("returns VALIDATION_ERROR for invalid product payloads before service dispatch", async () => {
    app = await createAuthenticatedTestApp();

    const response = await app.inject({
      method: "POST",
      url: "/api/v1/products",
      headers: accountAAuthHeaders(),
      payload: {
        name: "Invalid Product",
        category: "fungal",
        defaultUnit: "oz"
      }
    });

    expect(response.statusCode).toBe(400);
    expect(response.json()).toMatchObject({
      error: {
        code: "VALIDATION_ERROR",
        message: "Invalid input"
      }
    });
  });

  it("returns VALIDATION_ERROR for invalid rule payloads before service dispatch", async () => {
    app = await createAuthenticatedTestApp();

    const response = await app.inject({
      method: "POST",
      url: `/api/v1/products/${ProductIds.copperA}/rules`,
      headers: accountAAuthHeaders(),
      payload: {
        plantId: PlantIds.tomatoA,
        doseValue: 0,
        doseUnit: "g"
      }
    });

    expect(response.statusCode).toBe(400);
    expect(response.json()).toMatchObject({
      error: {
        code: "VALIDATION_ERROR"
      }
    });
  });

  it("does not leak route dependency details when db wiring is unavailable", async () => {
    app = await createAuthenticatedTestApp();

    const response = await app.inject({
      method: "GET",
      url: "/api/v1/products",
      headers: accountAAuthHeaders()
    });

    expect(response.statusCode).toBe(500);
    expect(response.json()).toEqual({
      error: {
        code: "INTERNAL_ERROR",
        message: "Unexpected server error",
        details: {}
      }
    });
  });
});

describeDatabase("Products routes with database", () => {
  let pool: Pool;
  let dbClient: DbClient;
  let app: FastifyInstance | undefined;

  beforeEach(async () => {
    pool = createTestPool();
    await resetAndApplyBaseline(pool);
    await insertAuthAccountFixtures(pool);
    dbClient = createDbClient(
      loadConfig({
        NODE_ENV: "test",
        DATABASE_URL: process.env.TEST_DATABASE_URL ?? process.env.DATABASE_URL
      })
    );
    app = await createTestApp({
      db: dbClient,
      auth: {
        authPort: new TestAuthAdapter(),
        accountsRepository: new KyselyAccountsRepository(dbClient)
      }
    });
  });

  afterEach(async () => {
    await app?.close();
    app = undefined;
    await pool.end();
  });

  it("creates products for the authenticated actor account and ignores client accountId", async () => {
    const response = await app!.inject({
      method: "POST",
      url: "/api/v1/products",
      headers: accountAAuthHeaders(),
      payload: {
        accountId: AccountFixtureIds.accountB,
        name: "Copper Fungicide",
        category: "fungicide",
        activeSubstance: "Copper",
        manufacturer: "Example Co",
        formulation: "WG",
        defaultUnit: "g",
        notes: "Use with care"
      }
    });

    expect(response.statusCode).toBe(200);
    const body = parseJsonResponse<MutationResponse>(response);

    expect(body.data.id).toMatch(uuidPattern);
    expect(body).toEqual({
      data: {
        id: body.data.id
      }
    });

    const stored = await pool.query<{ account_id: string }>("select account_id from products where id = $1", [
      body.data.id
    ]);
    expect(stored.rows[0]?.account_id).toBe(AccountFixtureIds.accountA);
  });

  it("lists only actor-account products and honors filters with canonical shape", async () => {
    await insertProduct(pool, {
      id: ProductIds.copperA,
      accountId: AccountFixtureIds.accountA,
      name: "Copper Fungicide",
      activeSubstance: "Copper"
    });
    await insertProduct(pool, {
      id: ProductIds.archivedA,
      accountId: AccountFixtureIds.accountA,
      name: "Archived Copper",
      archivedAt: new Date("2026-05-18T00:00:00.000Z")
    });
    await insertProduct(pool, {
      id: ProductIds.copperB,
      accountId: AccountFixtureIds.accountB,
      name: "Other Account Copper"
    });
    await insertPlant(pool, PlantIds.tomatoA, AccountFixtureIds.accountA, "Tomato");
    await insertUsageRule(pool, RuleIds.tomatoA, AccountFixtureIds.accountA, ProductIds.copperA, PlantIds.tomatoA);

    const response = await app!.inject({
      method: "GET",
      url: "/api/v1/products?q=copper&category=fungicide",
      headers: accountAAuthHeaders()
    });

    expect(response.statusCode).toBe(200);
    expect(response.json()).toEqual({
      data: {
        items: [
          {
            id: ProductIds.copperA,
            name: "Copper Fungicide",
            category: "fungicide",
            activeSubstance: "Copper",
            manufacturer: null,
            formulation: null,
            defaultUnit: "g",
            stockSummary: {
              quantityRemaining: 0,
              unit: "g"
            },
            rulesCount: 1,
            archivedAt: null
          }
        ],
        page: 1,
        pageSize: 20,
        total: 1
      }
    });

    const archivedResponse = await app!.inject({
      method: "GET",
      url: "/api/v1/products?includeArchived=true",
      headers: accountAAuthHeaders()
    });

    expect(archivedResponse.statusCode).toBe(200);
    expect(archivedResponse.json()).toMatchObject({
      data: {
        total: 2
      }
    });
  });

  it("returns product detail with usage rules and empty inventory placeholders", async () => {
    await insertProduct(pool, {
      id: ProductIds.copperA,
      accountId: AccountFixtureIds.accountA,
      name: "Copper Fungicide"
    });
    await insertPlant(pool, PlantIds.tomatoA, AccountFixtureIds.accountA, "Tomato");
    await insertUsageRule(pool, RuleIds.tomatoA, AccountFixtureIds.accountA, ProductIds.copperA, PlantIds.tomatoA);

    const response = await app!.inject({
      method: "GET",
      url: `/api/v1/products/${ProductIds.copperA}`,
      headers: accountAAuthHeaders()
    });

    expect(response.statusCode).toBe(200);
    const body = parseJsonResponse<ProductDetailResponse>(response);

    expect(body.data.createdAt).toMatch(isoTimestampPattern);
    expect(body.data.updatedAt).toMatch(isoTimestampPattern);
    expect(body).toMatchObject({
      data: {
        id: ProductIds.copperA,
        name: "Copper Fungicide",
        usageRules: [
          {
            id: RuleIds.tomatoA,
            plantId: PlantIds.tomatoA,
            doseValue: 20
          }
        ],
        inventorySummary: {
          quantityRemaining: 0,
          unit: "g",
          lotsCount: 0,
          expiredLotsCount: 0
        },
        recentMovements: []
      }
    });
  });

  it("does not expose or mutate cross-account products", async () => {
    await insertProduct(pool, {
      id: ProductIds.copperB,
      accountId: AccountFixtureIds.accountB,
      name: "Other Account Copper"
    });

    const getResponse = await app!.inject({
      method: "GET",
      url: `/api/v1/products/${ProductIds.copperB}`,
      headers: accountAAuthHeaders()
    });
    const patchResponse = await app!.inject({
      method: "PATCH",
      url: `/api/v1/products/${ProductIds.copperB}`,
      headers: accountAAuthHeaders(),
      payload: {
        name: "Leaked"
      }
    });
    const archiveResponse = await app!.inject({
      method: "POST",
      url: `/api/v1/products/${ProductIds.copperB}/archive`,
      headers: accountAAuthHeaders()
    });

    expect(getResponse.statusCode).toBe(404);
    expect(patchResponse.statusCode).toBe(404);
    expect(archiveResponse.statusCode).toBe(404);

    const stored = await pool.query<{ name: string; archived_at: Date | null }>("select name, archived_at from products where id = $1", [
      ProductIds.copperB
    ]);
    expect(stored.rows[0]).toEqual({
      name: "Other Account Copper",
      archived_at: null
    });
  });

  it("maps duplicate active product names to CONFLICT and allows same name in another account", async () => {
    await insertProduct(pool, {
      id: ProductIds.copperA,
      accountId: AccountFixtureIds.accountA,
      name: "Copper Fungicide"
    });

    const duplicateResponse = await app!.inject({
      method: "POST",
      url: "/api/v1/products",
      headers: accountAAuthHeaders(),
      payload: {
        name: "Copper Fungicide",
        category: "fungicide",
        defaultUnit: "g"
      }
    });
    const accountBResponse = await app!.inject({
      method: "POST",
      url: "/api/v1/products",
      headers: accountBAuthHeaders(),
      payload: {
        name: "Copper Fungicide",
        category: "fungicide",
        defaultUnit: "g"
      }
    });

    expect(duplicateResponse.statusCode).toBe(409);
    expect(duplicateResponse.json()).toMatchObject({
      error: {
        code: "CONFLICT",
        details: {
          name: ["Duplicate active product name"]
        }
      }
    });
    expect(accountBResponse.statusCode).toBe(200);
  });

  it("creates, lists, reads, updates, and archives usage rules through canonical routes", async () => {
    await insertProduct(pool, {
      id: ProductIds.copperA,
      accountId: AccountFixtureIds.accountA,
      name: "Copper Fungicide"
    });
    await insertPlant(pool, PlantIds.tomatoA, AccountFixtureIds.accountA, "Tomato");

    const createResponse = await app!.inject({
      method: "POST",
      url: `/api/v1/products/${ProductIds.copperA}/rules`,
      headers: accountAAuthHeaders(),
      payload: {
        accountId: AccountFixtureIds.accountB,
        plantId: PlantIds.tomatoA,
        doseValue: 20,
        doseUnit: "g",
        dilutionText: "20 g / 10 l water",
        applicationMethod: "foliar spray",
        reapplicationIntervalDays: 10,
        quarantinePeriodDays: 14,
        notes: "Rule notes"
      }
    });

    expect(createResponse.statusCode).toBe(200);
    const createBody = parseJsonResponse<MutationResponse>(createResponse);
    expect(createBody.data.id).toMatch(uuidPattern);

    const listResponse = await app!.inject({
      method: "GET",
      url: `/api/v1/products/${ProductIds.copperA}/rules`,
      headers: accountAAuthHeaders()
    });

    expect(listResponse.statusCode).toBe(200);
    expect(listResponse.json()).toMatchObject({
      data: {
        items: [
          {
            id: createBody.data.id,
            productId: ProductIds.copperA,
            plantId: PlantIds.tomatoA,
            doseValue: 20,
            doseUnit: "g",
            quarantinePeriodDays: 14,
            archivedAt: null
          }
        ]
      }
    });

    const detailResponse = await app!.inject({
      method: "GET",
      url: `/api/v1/product-rules/${createBody.data.id}`,
      headers: accountAAuthHeaders()
    });
    const detailBody = parseJsonResponse<ProductUsageRuleDetailResponse>(detailResponse);

    expect(detailResponse.statusCode).toBe(200);
    expect(detailBody.data.createdAt).toMatch(isoTimestampPattern);
    expect(detailBody.data.updatedAt).toMatch(isoTimestampPattern);
    expect(detailBody).toMatchObject({
      data: {
        id: createBody.data.id,
        productId: ProductIds.copperA,
        plantId: PlantIds.tomatoA,
        doseValue: 20,
        doseUnit: "g"
      }
    });

    const patchResponse = await app!.inject({
      method: "PATCH",
      url: `/api/v1/product-rules/${createBody.data.id}`,
      headers: accountAAuthHeaders(),
      payload: {
        doseValue: 25,
        quarantinePeriodDays: null
      }
    });

    expect(patchResponse.statusCode).toBe(200);
    expect(patchResponse.json()).toEqual({
      data: {
        id: createBody.data.id
      }
    });

    const archiveResponse = await app!.inject({
      method: "POST",
      url: `/api/v1/product-rules/${createBody.data.id}/archive`,
      headers: accountAAuthHeaders()
    });

    expect(archiveResponse.statusCode).toBe(200);
    expect(archiveResponse.json()).toEqual({
      data: {
        archived: true
      }
    });

    const archived = await pool.query<{ archived_at: Date | null }>(
      "select archived_at from product_usage_rules where id = $1",
      [createBody.data.id]
    );
    expect(archived.rows[0]?.archived_at).toBeInstanceOf(Date);
  });

  it("enforces rule product/plant account consistency and duplicate active rule conflicts", async () => {
    await insertProduct(pool, {
      id: ProductIds.copperA,
      accountId: AccountFixtureIds.accountA,
      name: "Copper Fungicide"
    });
    await insertPlant(pool, PlantIds.tomatoA, AccountFixtureIds.accountA, "Tomato");
    await insertPlant(pool, PlantIds.tomatoB, AccountFixtureIds.accountB, "Other Tomato");
    await insertUsageRule(pool, RuleIds.tomatoA, AccountFixtureIds.accountA, ProductIds.copperA, PlantIds.tomatoA);

    const crossAccountPlantResponse = await app!.inject({
      method: "POST",
      url: `/api/v1/products/${ProductIds.copperA}/rules`,
      headers: accountAAuthHeaders(),
      payload: {
        plantId: PlantIds.tomatoB,
        doseValue: 20,
        doseUnit: "g"
      }
    });
    const duplicateResponse = await app!.inject({
      method: "POST",
      url: `/api/v1/products/${ProductIds.copperA}/rules`,
      headers: accountAAuthHeaders(),
      payload: {
        plantId: PlantIds.tomatoA,
        doseValue: 30,
        doseUnit: "g"
      }
    });

    expect(crossAccountPlantResponse.statusCode).toBe(404);
    expect(crossAccountPlantResponse.json()).toMatchObject({
      error: {
        code: "NOT_FOUND",
        message: "Plant not found"
      }
    });
    expect(duplicateResponse.statusCode).toBe(409);
    expect(duplicateResponse.json()).toMatchObject({
      error: {
        code: "CONFLICT"
      }
    });
  });

  it("does not expose cross-account rules and allows replacement after archive", async () => {
    await insertProduct(pool, {
      id: ProductIds.copperA,
      accountId: AccountFixtureIds.accountA,
      name: "Copper Fungicide"
    });
    await insertProduct(pool, {
      id: ProductIds.copperB,
      accountId: AccountFixtureIds.accountB,
      name: "Other Account Copper"
    });
    await insertPlant(pool, PlantIds.tomatoA, AccountFixtureIds.accountA, "Tomato");
    await insertPlant(pool, PlantIds.tomatoB, AccountFixtureIds.accountB, "Other Tomato");
    await insertUsageRule(pool, RuleIds.tomatoA, AccountFixtureIds.accountA, ProductIds.copperA, PlantIds.tomatoA);
    await insertUsageRule(pool, RuleIds.tomatoB, AccountFixtureIds.accountB, ProductIds.copperB, PlantIds.tomatoB);

    const getResponse = await app!.inject({
      method: "GET",
      url: `/api/v1/product-rules/${RuleIds.tomatoB}`,
      headers: accountAAuthHeaders()
    });
    const archiveResponse = await app!.inject({
      method: "POST",
      url: `/api/v1/product-rules/${RuleIds.tomatoA}/archive`,
      headers: accountAAuthHeaders()
    });
    const replacementResponse = await app!.inject({
      method: "POST",
      url: `/api/v1/products/${ProductIds.copperA}/rules`,
      headers: accountAAuthHeaders(),
      payload: {
        plantId: PlantIds.tomatoA,
        doseValue: 30,
        doseUnit: "g"
      }
    });

    expect(getResponse.statusCode).toBe(404);
    expect(archiveResponse.statusCode).toBe(200);
    expect(replacementResponse.statusCode).toBe(200);
  });

  it("does not create out-of-scope inventory, activity, task, AI, or MCP side effects", async () => {
    await insertProduct(pool, {
      id: ProductIds.copperA,
      accountId: AccountFixtureIds.accountA,
      name: "Copper Fungicide"
    });
    await insertPlant(pool, PlantIds.tomatoA, AccountFixtureIds.accountA, "Tomato");

    await app!.inject({
      method: "POST",
      url: `/api/v1/products/${ProductIds.copperA}/rules`,
      headers: accountAAuthHeaders(),
      payload: {
        plantId: PlantIds.tomatoA,
        doseValue: 20,
        doseUnit: "g"
      }
    });

    await expectTableCount(pool, "inventory_lots", 0);
    await expectTableCount(pool, "inventory_movements", 0);
    await expectTableCount(pool, "activities", 0);
    await expectTableCount(pool, "tasks", 0);
    await expectTableCount(pool, "ai_sessions", 0);
    await expectTableCount(pool, "ai_suggestions", 0);
  });
});

async function createAuthenticatedTestApp(): Promise<FastifyInstance> {
  return createTestApp({
    auth: {
      authPort: new TestAuthAdapter(),
      accountsRepository: new InMemoryAccountsRepository([
        createAccount(TestAuthIds.accountA, "account-a@example.com", "Account A"),
        createAccount(TestAuthIds.accountB, "account-b@example.com", "Account B")
      ])
    }
  });
}

class InMemoryAccountsRepository implements AccountsRepository {
  readonly #accountsById: Map<string, Account>;

  constructor(accounts: readonly Account[]) {
    this.#accountsById = new Map(accounts.map((account) => [account.id, account]));
  }

  findById(accountId: string): Promise<Account | null> {
    const account = this.#accountsById.get(accountId);

    if (account === undefined || account.archivedAt !== null) {
      return Promise.resolve(null);
    }

    return Promise.resolve(account);
  }
}

function createAccount(id: string, email: string, displayName: string): Account {
  const createdAt = new Date("2026-05-18T00:00:00.000Z");

  return {
    id,
    email,
    displayName,
    createdAt,
    updatedAt: createdAt,
    archivedAt: null
  };
}

function parseJsonResponse<T>(response: { body: string }): T {
  const parsed: unknown = JSON.parse(response.body);

  return parsed as T;
}

async function insertProduct(
  pool: Pool,
  input: {
    id: string;
    accountId: string;
    name: string;
    activeSubstance?: string | null;
    archivedAt?: Date | null;
  }
): Promise<void> {
  await pool.query(
    `insert into products (id, account_id, name, category, active_substance, default_unit, archived_at)
     values ($1, $2, $3, 'fungicide', $4, 'g', $5)`,
    [input.id, input.accountId, input.name, input.activeSubstance ?? null, input.archivedAt ?? null]
  );
}

async function insertPlant(pool: Pool, id: string, accountId: string, name: string): Promise<void> {
  await pool.query(
    `insert into plants (id, account_id, common_name, lifecycle_type, growing_style)
     values ($1, $2, $3, 'annual', 'vegetable')`,
    [id, accountId, name]
  );
}

async function insertUsageRule(
  pool: Pool,
  id: string,
  accountId: string,
  productId: string,
  plantId: string
): Promise<void> {
  await pool.query(
    `insert into product_usage_rules (id, account_id, product_id, plant_id, dose_value, dose_unit)
     values ($1, $2, $3, $4, 20, 'g')`,
    [id, accountId, productId, plantId]
  );
}

async function expectTableCount(pool: Pool, tableName: string, expectedCount: number): Promise<void> {
  const result = await pool.query<{ count: string }>(`select count(*) from ${tableName}`);

  expect(Number(result.rows[0]?.count ?? 0)).toBe(expectedCount);
}
