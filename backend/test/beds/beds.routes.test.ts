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

const PlaceIds = {
  placeA: "11111111-1111-4111-8111-111111111111",
  otherPlaceA: "22222222-2222-4222-8222-222222222222",
  placeB: "33333333-3333-4333-8333-333333333333"
} as const;

const PlantIds = {
  tomatoA: "44444444-4444-4444-8444-444444444444",
  strawberryA: "55555555-5555-4555-8555-555555555555",
  pepperA: "66666666-6666-4666-8666-666666666666",
  tomatoB: "77777777-7777-4777-8777-777777777777"
} as const;

const BedIds = {
  activeA: "88888888-8888-4888-8888-888888888888",
  archivedA: "99999999-9999-4999-8999-999999999999",
  activeB: "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa"
} as const;

const PersistentPlantIds = {
  strawberryA: "bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb"
} as const;

const YearlyPlantingIds = {
  tomato2027A: "cccccccc-cccc-4ccc-8ccc-cccccccccccc",
  pepper2026A: "dddddddd-dddd-4ddd-8ddd-dddddddddddd"
} as const;

type BedCurrentContentsResponse = {
  persistentPlants: Array<{
    id: string;
    plantName: string;
    quantity: number | null;
  }>;
  yearlyPlantings: Array<{
    id: string;
    plantName: string;
    year: number;
    quantity: number | null;
    status: string;
  }>;
};

type BedMutationResponse = {
  data: {
    id: string;
  };
};

type BedArchiveResponse = {
  data: {
    archived: boolean;
  };
};

type BedListItemResponse = {
  id: string;
  placeId: string;
  name: string;
  description: string | null;
  widthM: number | null;
  lengthM: number | null;
  areaM2: number | null;
  status: string;
  currentContents: BedCurrentContentsResponse;
};

type BedListResponse = {
  data: {
    items: BedListItemResponse[];
    page: number;
    pageSize: number;
    total: number;
  };
};

type BedDetailResponse = {
  data: BedListItemResponse & {
    notes: string | null;
    persistentPlants: BedCurrentContentsResponse["persistentPlants"];
    yearlyPlantings: BedCurrentContentsResponse["yearlyPlantings"];
    recentActivities: unknown[];
    openProblems: unknown[];
    createdAt: string;
    updatedAt: string;
    archivedAt: string | null;
  };
};

describe("Beds routes", () => {
  let app: FastifyInstance | undefined;

  afterEach(async () => {
    await app?.close();
    app = undefined;
  });

  it("returns UNAUTHORIZED for unauthenticated requests", async () => {
    app = await createAuthenticatedTestApp();

    const response = await app.inject({
      method: "GET",
      url: `/api/v1/places/${PlaceIds.placeA}/beds`
    });

    expect(response.statusCode).toBe(401);
    expect(response.json()).toEqual({
      error: {
        code: "UNAUTHORIZED",
        message: "Unauthorized",
        details: {}
      }
    });
  });

  it("returns VALIDATION_ERROR for invalid create payloads before service dispatch", async () => {
    app = await createAuthenticatedTestApp();

    const response = await app.inject({
      method: "POST",
      url: `/api/v1/places/${PlaceIds.placeA}/beds`,
      headers: accountAAuthHeaders(),
      payload: {
        description: "Missing name",
        widthM: -1
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

  it("returns VALIDATION_ERROR for invalid detail year and patch status before service dispatch", async () => {
    app = await createAuthenticatedTestApp();

    const invalidYearResponse = await app.inject({
      method: "GET",
      url: `/api/v1/beds/${BedIds.activeA}?year=3001`,
      headers: accountAAuthHeaders()
    });
    const invalidStatusResponse = await app.inject({
      method: "PATCH",
      url: `/api/v1/beds/${BedIds.activeA}`,
      headers: accountAAuthHeaders(),
      payload: {
        status: "inactive"
      }
    });

    expect(invalidYearResponse.statusCode).toBe(400);
    expect(invalidYearResponse.json()).toMatchObject({
      error: {
        code: "VALIDATION_ERROR",
        message: "Invalid input"
      }
    });
    expect(invalidStatusResponse.statusCode).toBe(400);
    expect(invalidStatusResponse.json()).toMatchObject({
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
      url: `/api/v1/places/${PlaceIds.placeA}/beds`,
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

describeDatabase("Beds routes with database", () => {
  let pool: Pool;
  let dbClient: DbClient;
  let app: FastifyInstance | undefined;

  beforeEach(async () => {
    pool = createTestPool();
    await resetAndApplyBaseline(pool);
    await insertAuthAccountFixtures(pool);
    await insertBasePlacesAndPlants(pool);
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

  it("lists account-owned beds for a place with selected-year current contents", async () => {
    await insertBed(pool, {
      id: BedIds.activeA,
      accountId: AccountFixtureIds.accountA,
      placeId: PlaceIds.placeA,
      name: "Bed A",
      description: "North bed",
      notes: "Mulched",
      widthM: 1.2,
      lengthM: 4,
      areaM2: 4.8
    });
    await insertBed(pool, {
      id: BedIds.archivedA,
      accountId: AccountFixtureIds.accountA,
      placeId: PlaceIds.placeA,
      name: "Archived bed",
      status: "archived",
      archivedAt: new Date("2026-05-18T00:00:00.000Z")
    });
    await insertBed(pool, {
      id: BedIds.activeB,
      accountId: AccountFixtureIds.accountB,
      placeId: PlaceIds.placeB,
      name: "Other account bed"
    });
    await insertPersistentBedPlant(pool, {
      id: PersistentPlantIds.strawberryA,
      accountId: AccountFixtureIds.accountA,
      bedId: BedIds.activeA,
      plantId: PlantIds.strawberryA,
      quantity: 10
    });
    await insertYearlyBedPlanting(pool, {
      id: YearlyPlantingIds.tomato2027A,
      accountId: AccountFixtureIds.accountA,
      bedId: BedIds.activeA,
      plantId: PlantIds.tomatoA,
      year: 2027,
      quantity: 12,
      status: "planted"
    });
    await insertYearlyBedPlanting(pool, {
      id: YearlyPlantingIds.pepper2026A,
      accountId: AccountFixtureIds.accountA,
      bedId: BedIds.activeA,
      plantId: PlantIds.pepperA,
      year: 2026,
      quantity: 8,
      status: "planted"
    });

    const response = await app!.inject({
      method: "GET",
      url: `/api/v1/places/${PlaceIds.placeA}/beds?year=2027`,
      headers: accountAAuthHeaders()
    });

    expect(response.statusCode).toBe(200);
    expect(parseJsonResponse<BedListResponse>(response)).toEqual({
      data: {
        items: [
          {
            id: BedIds.activeA,
            placeId: PlaceIds.placeA,
            name: "Bed A",
            description: "North bed",
            widthM: 1.2,
            lengthM: 4,
            areaM2: 4.8,
            status: "active",
            currentContents: {
              persistentPlants: [
                {
                  id: PersistentPlantIds.strawberryA,
                  plantName: "Strawberry",
                  quantity: 10
                }
              ],
              yearlyPlantings: [
                {
                  id: YearlyPlantingIds.tomato2027A,
                  plantName: "Tomato (San Marzano)",
                  year: 2027,
                  quantity: 12,
                  status: "planted"
                }
              ]
            }
          }
        ],
        page: 1,
        pageSize: 20,
        total: 1
      }
    });
  });

  it("creates an account-scoped bed, ignores client accountId, and returns the mutation envelope", async () => {
    const response = await app!.inject({
      method: "POST",
      url: `/api/v1/places/${PlaceIds.placeA}/beds`,
      headers: accountAAuthHeaders(),
      payload: {
        accountId: AccountFixtureIds.accountB,
        name: "New Bed",
        description: "Raised bed",
        notes: "South edge",
        widthM: 1.5,
        lengthM: 3
      }
    });

    expect(response.statusCode).toBe(200);
    const body = parseJsonResponse<BedMutationResponse>(response);

    expect(body.data.id).toMatch(uuidPattern);
    expect(body).toEqual({
      data: {
        id: body.data.id
      }
    });

    const stored = await pool.query<{
      account_id: string;
      place_id: string;
      width_m: number;
      length_m: number;
      area_m2: number;
      status: string;
    }>(
      `select account_id, place_id, width_m::float8, length_m::float8, area_m2::float8, status
       from beds
       where id = $1`,
      [body.data.id]
    );
    expect(stored.rows[0]).toEqual({
      account_id: AccountFixtureIds.accountA,
      place_id: PlaceIds.placeA,
      width_m: 1.5,
      length_m: 3,
      area_m2: 4.5,
      status: "active"
    });
  });

  it("rejects cross-account place references during create", async () => {
    const response = await app!.inject({
      method: "POST",
      url: `/api/v1/places/${PlaceIds.placeB}/beds`,
      headers: accountAAuthHeaders(),
      payload: {
        name: "Nope"
      }
    });

    expect(response.statusCode).toBe(404);
    expect(response.json()).toEqual({
      error: {
        code: "NOT_FOUND",
        message: "Place not found",
        details: {}
      }
    });
  });

  it("returns detail contents for the selected year and does not expose cross-account beds", async () => {
    await insertBed(pool, {
      id: BedIds.activeA,
      accountId: AccountFixtureIds.accountA,
      placeId: PlaceIds.placeA,
      name: "Bed A",
      description: "North bed",
      notes: "Mulched",
      widthM: 1.2,
      lengthM: 4,
      areaM2: 4.8
    });
    await insertBed(pool, {
      id: BedIds.activeB,
      accountId: AccountFixtureIds.accountB,
      placeId: PlaceIds.placeB,
      name: "Other account bed"
    });
    await insertPersistentBedPlant(pool, {
      id: PersistentPlantIds.strawberryA,
      accountId: AccountFixtureIds.accountA,
      bedId: BedIds.activeA,
      plantId: PlantIds.strawberryA,
      quantity: 10
    });
    await insertYearlyBedPlanting(pool, {
      id: YearlyPlantingIds.tomato2027A,
      accountId: AccountFixtureIds.accountA,
      bedId: BedIds.activeA,
      plantId: PlantIds.tomatoA,
      year: 2027,
      quantity: 12,
      status: "planted"
    });

    const detailResponse = await app!.inject({
      method: "GET",
      url: `/api/v1/beds/${BedIds.activeA}?year=2027`,
      headers: accountAAuthHeaders()
    });
    const crossAccountResponse = await app!.inject({
      method: "GET",
      url: `/api/v1/beds/${BedIds.activeB}`,
      headers: accountAAuthHeaders()
    });

    expect(detailResponse.statusCode).toBe(200);
    const body = parseJsonResponse<BedDetailResponse>(detailResponse);

    expect(body.data.createdAt).toMatch(isoTimestampPattern);
    expect(body.data.updatedAt).toMatch(isoTimestampPattern);
    expect(body).toEqual({
      data: {
        id: BedIds.activeA,
        placeId: PlaceIds.placeA,
        name: "Bed A",
        description: "North bed",
        notes: "Mulched",
        widthM: 1.2,
        lengthM: 4,
        areaM2: 4.8,
        status: "active",
        currentContents: {
          persistentPlants: [
            {
              id: PersistentPlantIds.strawberryA,
              plantName: "Strawberry",
              quantity: 10
            }
          ],
          yearlyPlantings: [
            {
              id: YearlyPlantingIds.tomato2027A,
              plantName: "Tomato (San Marzano)",
              year: 2027,
              quantity: 12,
              status: "planted"
            }
          ]
        },
        persistentPlants: [
          {
            id: PersistentPlantIds.strawberryA,
            plantName: "Strawberry",
            quantity: 10
          }
        ],
        yearlyPlantings: [
          {
            id: YearlyPlantingIds.tomato2027A,
            plantName: "Tomato (San Marzano)",
            year: 2027,
            quantity: 12,
            status: "planted"
          }
        ],
        recentActivities: [],
        openProblems: [],
        createdAt: body.data.createdAt,
        updatedAt: body.data.updatedAt,
        archivedAt: null
      }
    });
    expect(crossAccountResponse.statusCode).toBe(404);
    expect(crossAccountResponse.json()).toMatchObject({
      error: {
        code: "NOT_FOUND"
      }
    });
  });

  it("updates only actor-account beds and returns the canonical mutation envelope", async () => {
    await insertBed(pool, {
      id: BedIds.activeA,
      accountId: AccountFixtureIds.accountA,
      placeId: PlaceIds.placeA,
      name: "Bed A",
      widthM: 1.2,
      lengthM: 4,
      areaM2: 4.8
    });
    await insertBed(pool, {
      id: BedIds.activeB,
      accountId: AccountFixtureIds.accountB,
      placeId: PlaceIds.placeB,
      name: "Other account bed"
    });

    const updateResponse = await app!.inject({
      method: "PATCH",
      url: `/api/v1/beds/${BedIds.activeA}`,
      headers: accountAAuthHeaders(),
      payload: {
        name: "Updated Bed A",
        widthM: 2,
        status: "removed",
        notes: null
      }
    });
    const crossAccountResponse = await app!.inject({
      method: "PATCH",
      url: `/api/v1/beds/${BedIds.activeB}`,
      headers: accountAAuthHeaders(),
      payload: {
        name: "Leaked bed"
      }
    });

    expect(updateResponse.statusCode).toBe(200);
    expect(updateResponse.json()).toEqual({
      data: {
        id: BedIds.activeA
      }
    });
    expect(crossAccountResponse.statusCode).toBe(404);

    const stored = await pool.query<{ name: string; width_m: number; area_m2: number; status: string; notes: string | null }>(
      "select name, width_m::float8, area_m2::float8, status, notes from beds where id = $1",
      [BedIds.activeA]
    );
    expect(stored.rows[0]).toEqual({
      name: "Updated Bed A",
      width_m: 2,
      area_m2: 8,
      status: "removed",
      notes: null
    });
  });

  it("archives beds without hard deleting and excludes archived rows from the default list", async () => {
    await insertBed(pool, {
      id: BedIds.activeA,
      accountId: AccountFixtureIds.accountA,
      placeId: PlaceIds.placeA,
      name: "Bed A"
    });

    const archiveResponse = await app!.inject({
      method: "POST",
      url: `/api/v1/beds/${BedIds.activeA}/archive`,
      headers: accountAAuthHeaders()
    });
    const listResponse = await app!.inject({
      method: "GET",
      url: `/api/v1/places/${PlaceIds.placeA}/beds`,
      headers: accountAAuthHeaders()
    });

    expect(archiveResponse.statusCode).toBe(200);
    expect(parseJsonResponse<BedArchiveResponse>(archiveResponse)).toEqual({
      data: {
        archived: true
      }
    });
    expect(listResponse.statusCode).toBe(200);
    expect(listResponse.json()).toEqual({
      data: {
        items: [],
        page: 1,
        pageSize: 20,
        total: 0
      }
    });

    const archived = await pool.query<{ status: string; archived_at: Date | null }>(
      "select status, archived_at from beds where id = $1",
      [BedIds.activeA]
    );
    expect(archived.rowCount).toBe(1);
    expect(archived.rows[0]).toMatchObject({ status: "archived" });
    expect(archived.rows[0]?.archived_at).toBeInstanceOf(Date);
  });

  it("keeps account B authenticated requests scoped to account B", async () => {
    await insertBed(pool, {
      id: BedIds.activeA,
      accountId: AccountFixtureIds.accountA,
      placeId: PlaceIds.placeA,
      name: "Account A bed"
    });
    await insertBed(pool, {
      id: BedIds.activeB,
      accountId: AccountFixtureIds.accountB,
      placeId: PlaceIds.placeB,
      name: "Other account bed"
    });

    const response = await app!.inject({
      method: "GET",
      url: `/api/v1/places/${PlaceIds.placeB}/beds`,
      headers: accountBAuthHeaders()
    });

    expect(response.statusCode).toBe(200);
    expect(response.json()).toMatchObject({
      data: {
        items: [
          {
            id: BedIds.activeB,
            name: "Other account bed"
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
  const createdAt = new Date("2026-05-21T08:00:00.000Z");

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

async function insertBasePlacesAndPlants(pool: Pool): Promise<void> {
  await insertPlace(pool, {
    id: PlaceIds.placeA,
    accountId: AccountFixtureIds.accountA,
    name: "Home Garden"
  });
  await insertPlace(pool, {
    id: PlaceIds.otherPlaceA,
    accountId: AccountFixtureIds.accountA,
    name: "Allotment"
  });
  await insertPlace(pool, {
    id: PlaceIds.placeB,
    accountId: AccountFixtureIds.accountB,
    name: "Other Account Garden"
  });
  await insertPlant(pool, {
    id: PlantIds.tomatoA,
    accountId: AccountFixtureIds.accountA,
    commonName: "Tomato",
    variety: "San Marzano",
    lifecycleType: "annual",
    growingStyle: "vegetable"
  });
  await insertPlant(pool, {
    id: PlantIds.strawberryA,
    accountId: AccountFixtureIds.accountA,
    commonName: "Strawberry",
    lifecycleType: "perennial",
    growingStyle: "berry"
  });
  await insertPlant(pool, {
    id: PlantIds.pepperA,
    accountId: AccountFixtureIds.accountA,
    commonName: "Pepper",
    lifecycleType: "annual",
    growingStyle: "vegetable"
  });
  await insertPlant(pool, {
    id: PlantIds.tomatoB,
    accountId: AccountFixtureIds.accountB,
    commonName: "Tomato",
    lifecycleType: "annual",
    growingStyle: "vegetable"
  });
}

async function insertPlace(
  pool: Pool,
  input: {
    id: string;
    accountId: string;
    name: string;
  }
): Promise<void> {
  await pool.query("insert into places (id, account_id, name) values ($1, $2, $3)", [
    input.id,
    input.accountId,
    input.name
  ]);
}

async function insertPlant(
  pool: Pool,
  input: {
    id: string;
    accountId: string;
    commonName: string;
    variety?: string | null;
    lifecycleType: "annual" | "biennial" | "perennial";
    growingStyle: "tree" | "shrub" | "vine" | "herb" | "vegetable" | "berry" | "flower" | "other";
  }
): Promise<void> {
  await pool.query(
    `insert into plants (id, account_id, common_name, variety, lifecycle_type, growing_style)
     values ($1, $2, $3, $4, $5, $6)`,
    [input.id, input.accountId, input.commonName, input.variety ?? null, input.lifecycleType, input.growingStyle]
  );
}

async function insertBed(
  pool: Pool,
  input: {
    id: string;
    accountId: string;
    placeId: string;
    name: string;
    description?: string | null;
    notes?: string | null;
    widthM?: number | null;
    lengthM?: number | null;
    areaM2?: number | null;
    status?: "active" | "removed" | "archived";
    archivedAt?: Date | null;
  }
): Promise<void> {
  await pool.query(
    `insert into beds (
       id, account_id, place_id, name, description, notes, width_m, length_m, area_m2, status, archived_at
     )
     values ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)`,
    [
      input.id,
      input.accountId,
      input.placeId,
      input.name,
      input.description ?? null,
      input.notes ?? null,
      input.widthM ?? null,
      input.lengthM ?? null,
      input.areaM2 ?? null,
      input.status ?? "active",
      input.archivedAt ?? null
    ]
  );
}

async function insertPersistentBedPlant(
  pool: Pool,
  input: {
    id: string;
    accountId: string;
    bedId: string;
    plantId: string;
    quantity?: number | null;
    status?: "active" | "removed" | "archived";
  }
): Promise<void> {
  await pool.query(
    `insert into persistent_bed_plants (id, account_id, bed_id, plant_id, quantity, status)
     values ($1, $2, $3, $4, $5, $6)`,
    [input.id, input.accountId, input.bedId, input.plantId, input.quantity ?? null, input.status ?? "active"]
  );
}

async function insertYearlyBedPlanting(
  pool: Pool,
  input: {
    id: string;
    accountId: string;
    bedId: string;
    plantId: string;
    year: number;
    quantity?: number | null;
    status?: "planned" | "planted" | "removed" | "harvested" | "archived";
  }
): Promise<void> {
  await pool.query(
    `insert into yearly_bed_plantings (id, account_id, bed_id, plant_id, year, quantity, status)
     values ($1, $2, $3, $4, $5, $6, $7)`,
    [input.id, input.accountId, input.bedId, input.plantId, input.year, input.quantity ?? null, input.status ?? "planted"]
  );
}
