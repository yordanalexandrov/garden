import type { FastifyInstance } from "fastify";
import type { Pool } from "pg";
import { afterEach, beforeEach, describe, expect, it } from "vitest";

import { createDbClient } from "../../src/db/db.js";
import type { DbClient } from "../../src/db/transaction.js";
import { KyselyAccountsRepository } from "../../src/modules/accounts/accounts.repository.js";
import type { AccountsRepository } from "../../src/modules/accounts/accounts.repository.js";
import type { Account } from "../../src/modules/accounts/accounts.types.js";
import { TestAuthAdapter, TestAuthIds } from "../../src/modules/auth/test-auth.adapter.js";
import { loadConfig } from "../../src/config/config.js";
import { createTestPool, hasTestDatabase, resetAndApplyBaseline } from "../db/helpers/test-database.js";
import { AccountFixtureIds, insertAuthAccountFixtures } from "../helpers/accounts.js";
import { createTestApp } from "../helpers/app.js";
import { accountAAuthHeaders, accountBAuthHeaders } from "../helpers/auth.js";

const describeDatabase = hasTestDatabase() ? describe : describe.skip;
const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const isoTimestampPattern = /^\d{4}-\d{2}-\d{2}T/;

const PlantIds = {
  tomatoA: "11111111-1111-4111-8111-111111111111",
  archivedA: "22222222-2222-4222-8222-222222222222",
  pepperA: "33333333-3333-4333-8333-333333333333",
  tomatoB: "44444444-4444-4444-8444-444444444444"
} as const;

type PlantMutationResponse = {
  data: {
    id: string;
  };
};

type PlantListResponse = {
  data: {
    items: Array<{
      id: string;
      commonName: string;
      variety: string | null;
      plantCategory: string | null;
      lifecycleType: string;
      growingStyle: string;
      notes: string | null;
      archivedAt: string | null;
    }>;
    page: number;
    pageSize: number;
    total: number;
  };
};

type PlantDetailResponse = {
  data: PlantListResponse["data"]["items"][number] & {
    createdAt: string;
    updatedAt: string;
  };
};

describe("Plants routes", () => {
  let app: FastifyInstance | undefined;

  afterEach(async () => {
    await app?.close();
    app = undefined;
  });

  it("returns UNAUTHORIZED for unauthenticated requests", async () => {
    app = await createAuthenticatedTestApp();

    const response = await app.inject({ method: "GET", url: "/api/v1/plants" });

    expect(response.statusCode).toBe(401);
    expect(response.json()).toEqual({
      error: {
        code: "UNAUTHORIZED",
        message: "Unauthorized",
        details: {}
      }
    });
  });

  it("returns VALIDATION_ERROR for missing commonName before service dispatch", async () => {
    app = await createAuthenticatedTestApp();

    const response = await app.inject({
      method: "POST",
      url: "/api/v1/plants",
      headers: accountAAuthHeaders(),
      payload: {
        lifecycleType: "annual",
        growingStyle: "vegetable"
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

  it("returns VALIDATION_ERROR for invalid plant enum values before service dispatch", async () => {
    app = await createAuthenticatedTestApp();

    const response = await app.inject({
      method: "POST",
      url: "/api/v1/plants",
      headers: accountAAuthHeaders(),
      payload: {
        commonName: "Tomato",
        lifecycleType: "seasonal",
        growingStyle: "crop"
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

  it("does not leak internal route dependency details when db wiring is unavailable", async () => {
    app = await createAuthenticatedTestApp();

    const response = await app.inject({
      method: "GET",
      url: "/api/v1/plants",
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

describeDatabase("Plants routes with database", () => {
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

  it("creates a plant for the authenticated actor account and ignores client-supplied accountId", async () => {
    const response = await app!.inject({
      method: "POST",
      url: "/api/v1/plants",
      headers: accountAAuthHeaders(),
      payload: {
        accountId: AccountFixtureIds.accountB,
        commonName: "Tomato",
        variety: "Roma",
        plantCategory: "vegetable",
        lifecycleType: "annual",
        growingStyle: "vegetable",
        notes: "Seed indoors"
      }
    });

    expect(response.statusCode).toBe(200);
    const body = parseJsonResponse<PlantMutationResponse>(response);

    expect(body.data.id).toMatch(uuidPattern);
    expect(body).toEqual({
      data: {
        id: body.data.id
      }
    });

    const stored = await pool.query<{ account_id: string }>("select account_id from plants where id = $1", [
      body.data.id
    ]);
    expect(stored.rows[0]?.account_id).toBe(AccountFixtureIds.accountA);
  });

  it("lists only active plants for the actor account by default and preserves pagination shape", async () => {
    await insertPlant(pool, {
      id: PlantIds.tomatoA,
      accountId: AccountFixtureIds.accountA,
      commonName: "Tomato",
      variety: "Roma",
      plantCategory: "vegetable",
      notes: "Seed indoors"
    });
    await insertPlant(pool, {
      id: PlantIds.archivedA,
      accountId: AccountFixtureIds.accountA,
      commonName: "Old Tomato",
      archivedAt: new Date("2026-05-18T00:00:00.000Z")
    });
    await insertPlant(pool, {
      id: PlantIds.tomatoB,
      accountId: AccountFixtureIds.accountB,
      commonName: "Other Account Tomato"
    });

    const response = await app!.inject({
      method: "GET",
      url: "/api/v1/plants",
      headers: accountAAuthHeaders()
    });

    expect(response.statusCode).toBe(200);
    expect(response.json()).toEqual({
      data: {
        items: [
          {
            id: PlantIds.tomatoA,
            commonName: "Tomato",
            variety: "Roma",
            plantCategory: "vegetable",
            lifecycleType: "annual",
            growingStyle: "vegetable",
            notes: "Seed indoors",
            archivedAt: null
          }
        ],
        page: 1,
        pageSize: 20,
        total: 1
      }
    });
  });

  it("includes archived actor-account plants only when includeArchived is true", async () => {
    await insertPlant(pool, {
      id: PlantIds.tomatoA,
      accountId: AccountFixtureIds.accountA,
      commonName: "Tomato"
    });
    await insertPlant(pool, {
      id: PlantIds.archivedA,
      accountId: AccountFixtureIds.accountA,
      commonName: "Old Tomato",
      archivedAt: new Date("2026-05-18T00:00:00.000Z")
    });
    await insertPlant(pool, {
      id: PlantIds.tomatoB,
      accountId: AccountFixtureIds.accountB,
      commonName: "Other Account Tomato"
    });

    const response = await app!.inject({
      method: "GET",
      url: "/api/v1/plants?includeArchived=true",
      headers: accountAAuthHeaders()
    });

    expect(response.statusCode).toBe(200);
    const body = parseJsonResponse<PlantListResponse>(response);

    expect(body.data.items.map((plant) => plant.id).sort()).toEqual([PlantIds.archivedA, PlantIds.tomatoA].sort());
    expect(body.data.total).toBe(2);
  });

  it("supports q, lifecycleType, and growingStyle filters inside the actor account", async () => {
    await insertPlant(pool, {
      id: PlantIds.tomatoA,
      accountId: AccountFixtureIds.accountA,
      commonName: "Tomato",
      variety: "Roma",
      plantCategory: "vegetable",
      lifecycleType: "annual",
      growingStyle: "vegetable",
      notes: "Seed indoors"
    });
    await insertPlant(pool, {
      id: PlantIds.pepperA,
      accountId: AccountFixtureIds.accountA,
      commonName: "Pepper",
      plantCategory: "vegetable",
      lifecycleType: "annual",
      growingStyle: "vegetable"
    });
    await insertPlant(pool, {
      id: PlantIds.tomatoB,
      accountId: AccountFixtureIds.accountB,
      commonName: "Tomato",
      variety: "Roma",
      plantCategory: "vegetable",
      lifecycleType: "annual",
      growingStyle: "vegetable"
    });

    const response = await app!.inject({
      method: "GET",
      url: "/api/v1/plants?q=roma&lifecycleType=annual&growingStyle=vegetable",
      headers: accountAAuthHeaders()
    });

    expect(response.statusCode).toBe(200);
    expect(response.json()).toMatchObject({
      data: {
        items: [
          {
            id: PlantIds.tomatoA,
            commonName: "Tomato",
            variety: "Roma"
          }
        ],
        total: 1
      }
    });
  });

  it("returns plant detail with camelCase fields", async () => {
    await insertPlant(pool, {
      id: PlantIds.tomatoA,
      accountId: AccountFixtureIds.accountA,
      commonName: "Tomato",
      variety: "Roma",
      plantCategory: "vegetable",
      notes: "Seed indoors"
    });

    const response = await app!.inject({
      method: "GET",
      url: `/api/v1/plants/${PlantIds.tomatoA}`,
      headers: accountAAuthHeaders()
    });

    expect(response.statusCode).toBe(200);
    const body = parseJsonResponse<PlantDetailResponse>(response);

    expect(body.data.createdAt).toMatch(isoTimestampPattern);
    expect(body.data.updatedAt).toMatch(isoTimestampPattern);
    expect(body).toEqual({
      data: {
        id: PlantIds.tomatoA,
        commonName: "Tomato",
        variety: "Roma",
        plantCategory: "vegetable",
        lifecycleType: "annual",
        growingStyle: "vegetable",
        notes: "Seed indoors",
        archivedAt: null,
        createdAt: body.data.createdAt,
        updatedAt: body.data.updatedAt
      }
    });
  });

  it("does not expose cross-account plants through detail routes", async () => {
    await insertPlant(pool, {
      id: PlantIds.tomatoB,
      accountId: AccountFixtureIds.accountB,
      commonName: "Other Account Tomato"
    });

    const response = await app!.inject({
      method: "GET",
      url: `/api/v1/plants/${PlantIds.tomatoB}`,
      headers: accountAAuthHeaders()
    });

    expect(response.statusCode).toBe(404);
    expect(response.json()).toMatchObject({
      error: {
        code: "NOT_FOUND"
      }
    });
  });

  it("updates only actor-account plants and returns the canonical mutation envelope", async () => {
    await insertPlant(pool, {
      id: PlantIds.tomatoA,
      accountId: AccountFixtureIds.accountA,
      commonName: "Tomato"
    });

    const response = await app!.inject({
      method: "PATCH",
      url: `/api/v1/plants/${PlantIds.tomatoA}`,
      headers: accountAAuthHeaders(),
      payload: {
        commonName: "Updated Tomato",
        notes: null
      }
    });

    expect(response.statusCode).toBe(200);
    expect(response.json()).toEqual({
      data: {
        id: PlantIds.tomatoA
      }
    });

    const stored = await pool.query<{ common_name: string; notes: string | null }>(
      "select common_name, notes from plants where id = $1",
      [PlantIds.tomatoA]
    );
    expect(stored.rows[0]).toEqual({
      common_name: "Updated Tomato",
      notes: null
    });
  });

  it("archives actor-account plants and returns the canonical archive envelope", async () => {
    await insertPlant(pool, {
      id: PlantIds.tomatoA,
      accountId: AccountFixtureIds.accountA,
      commonName: "Tomato"
    });

    const response = await app!.inject({
      method: "POST",
      url: `/api/v1/plants/${PlantIds.tomatoA}/archive`,
      headers: accountAAuthHeaders()
    });

    expect(response.statusCode).toBe(200);
    expect(response.json()).toEqual({
      data: {
        archived: true
      }
    });

    const archived = await pool.query<{ archived_at: Date | null }>("select archived_at from plants where id = $1", [
      PlantIds.tomatoA
    ]);
    expect(archived.rows[0]?.archived_at).toBeInstanceOf(Date);
  });

  it("allows duplicate same-name plants within one account unless the schema rejects them", async () => {
    const first = await app!.inject({
      method: "POST",
      url: "/api/v1/plants",
      headers: accountAAuthHeaders(),
      payload: {
        commonName: "Tomato",
        lifecycleType: "annual",
        growingStyle: "vegetable"
      }
    });
    const second = await app!.inject({
      method: "POST",
      url: "/api/v1/plants",
      headers: accountAAuthHeaders(),
      payload: {
        commonName: "Tomato",
        variety: "Roma",
        lifecycleType: "annual",
        growingStyle: "vegetable"
      }
    });

    expect(first.statusCode).toBe(200);
    expect(second.statusCode).toBe(200);

    const stored = await pool.query<{ count: string }>(
      "select count(*) from plants where account_id = $1 and common_name = 'Tomato'",
      [AccountFixtureIds.accountA]
    );
    expect(Number(stored.rows[0]?.count ?? 0)).toBe(2);
  });

  it("keeps account B authenticated requests scoped to account B", async () => {
    await insertPlant(pool, {
      id: PlantIds.tomatoA,
      accountId: AccountFixtureIds.accountA,
      commonName: "Tomato"
    });
    await insertPlant(pool, {
      id: PlantIds.tomatoB,
      accountId: AccountFixtureIds.accountB,
      commonName: "Other Account Tomato"
    });

    const response = await app!.inject({
      method: "GET",
      url: "/api/v1/plants",
      headers: accountBAuthHeaders()
    });

    expect(response.statusCode).toBe(200);
    expect(response.json()).toMatchObject({
      data: {
        items: [
          {
            id: PlantIds.tomatoB,
            commonName: "Other Account Tomato"
          }
        ],
        total: 1
      }
    });
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

async function insertPlant(
  pool: Pool,
  input: {
    id: string;
    accountId: string;
    commonName: string;
    variety?: string | null;
    plantCategory?: string | null;
    lifecycleType?: string;
    growingStyle?: string;
    notes?: string | null;
    archivedAt?: Date | null;
  }
): Promise<void> {
  await pool.query(
    `insert into plants (
       id, account_id, common_name, variety, plant_category, lifecycle_type,
       growing_style, notes, archived_at
     )
     values ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
    [
      input.id,
      input.accountId,
      input.commonName,
      input.variety ?? null,
      input.plantCategory ?? null,
      input.lifecycleType ?? "annual",
      input.growingStyle ?? "vegetable",
      input.notes ?? null,
      input.archivedAt ?? null
    ]
  );
}
