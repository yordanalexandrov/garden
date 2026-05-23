import type { FastifyInstance } from "fastify";
import type { Pool } from "pg";
import { afterEach, beforeEach, describe, expect, it } from "vitest";

import { loadConfig } from "../../src/config/config.js";
import { createDbClient } from "../../src/db/db.js";
import type { DbClient } from "../../src/db/transaction.js";
import { KyselyAccountsRepository } from "../../src/modules/accounts/accounts.repository.js";
import { TestAuthAdapter } from "../../src/modules/auth/test-auth.adapter.js";
import {
  createTestPool,
  hasTestDatabase,
  resetAndApplyBaseline
} from "../db/helpers/test-database.js";
import {
  FixtureIds,
  insertGrowingStructureFixture
} from "../db/helpers/fixtures.js";
import { createTestApp } from "../helpers/app.js";
import { accountAAuthHeaders } from "../helpers/auth.js";

const describeDatabase = hasTestDatabase() ? describe : describe.skip;
const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

type InjectResponse = {
  statusCode: number;
  body: string;
  json(): unknown;
};

type ListEnvelope<T> = {
  data: {
    items: T[];
    page: number;
    pageSize: number;
    total: number;
  };
};

type IdItem = {
  id: string;
};

type BedDetailEnvelope = {
  data: {
    persistentPlants: IdItem[];
    yearlyPlantings: Array<IdItem & { year: number }>;
  };
};

type MutationEnvelope = {
  data: {
    id: string;
  };
};

describeDatabase("Phase 6 account consistency and API regressions", () => {
  let pool: Pool;
  let dbClient: DbClient | undefined;
  let app: FastifyInstance | undefined;

  beforeEach(async () => {
    pool = createTestPool();
    await resetAndApplyBaseline(pool);
    await insertGrowingStructureFixture(pool);

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
    await dbClient?.destroy();
    dbClient = undefined;
    await pool.end();
  });

  it("keeps nested list endpoints scoped to the actor account without leaking items or totals", async () => {
    const perennials = await injectAccountA("GET", `/api/v1/places/${FixtureIds.placeA}/perennials`);
    const beds = await injectAccountA("GET", `/api/v1/places/${FixtureIds.placeA}/beds?year=2026`);
    const persistentPlants = await injectAccountA("GET", `/api/v1/beds/${FixtureIds.bedA}/persistent-plants`);
    const yearlyPlantings = await injectAccountA("GET", `/api/v1/beds/${FixtureIds.bedA}/plantings?year=2026`);

    expectListIds(perennials, [FixtureIds.perennialA]);
    expectListIds(beds, [FixtureIds.bedA]);
    expectListIds(persistentPlants, [FixtureIds.persistentBedPlantA]);
    expectListIds(yearlyPlantings, [FixtureIds.yearlyBedPlantingA2026]);
  });

  it("blocks cross-account detail, update, and archive access for every Phase 6 resource group", async () => {
    const requests: Array<{ method: "GET" | "PATCH" | "POST"; url: string; payload?: Record<string, unknown> }> = [
      { method: "GET", url: `/api/v1/perennials/${FixtureIds.perennialB}` },
      { method: "PATCH", url: `/api/v1/perennials/${FixtureIds.perennialB}`, payload: { label: "Nope" } },
      { method: "POST", url: `/api/v1/perennials/${FixtureIds.perennialB}/archive` },
      { method: "GET", url: `/api/v1/beds/${FixtureIds.bedB}?year=2026` },
      { method: "PATCH", url: `/api/v1/beds/${FixtureIds.bedB}`, payload: { name: "Nope" } },
      { method: "POST", url: `/api/v1/beds/${FixtureIds.bedB}/archive` },
      {
        method: "PATCH",
        url: `/api/v1/persistent-bed-plants/${FixtureIds.persistentBedPlantB}`,
        payload: { notes: "Nope" }
      },
      { method: "POST", url: `/api/v1/persistent-bed-plants/${FixtureIds.persistentBedPlantB}/archive` },
      {
        method: "PATCH",
        url: `/api/v1/plantings/${FixtureIds.yearlyBedPlantingB2026}`,
        payload: { notes: "Nope" }
      },
      { method: "POST", url: `/api/v1/plantings/${FixtureIds.yearlyBedPlantingB2026}/archive` }
    ];

    for (const request of requests) {
      const response = await injectAccountA(request.method, request.url, request.payload);

      expectNotFoundEnvelope(response);
    }
  });

  it("rejects cross-account parent and plant references on create and update", async () => {
    const requests: Array<{ method: "PATCH" | "POST"; url: string; payload: Record<string, unknown> }> = [
      {
        method: "POST",
        url: `/api/v1/places/${FixtureIds.placeB}/perennials`,
        payload: { plantId: FixtureIds.plantA }
      },
      {
        method: "POST",
        url: `/api/v1/places/${FixtureIds.placeA}/perennials`,
        payload: { plantId: FixtureIds.plantB }
      },
      {
        method: "PATCH",
        url: `/api/v1/perennials/${FixtureIds.perennialA}`,
        payload: { plantId: FixtureIds.plantB }
      },
      {
        method: "POST",
        url: `/api/v1/places/${FixtureIds.placeB}/beds`,
        payload: { name: "Wrong account bed" }
      },
      {
        method: "POST",
        url: `/api/v1/beds/${FixtureIds.bedB}/persistent-plants`,
        payload: { plantId: FixtureIds.plantA }
      },
      {
        method: "POST",
        url: `/api/v1/beds/${FixtureIds.bedA}/persistent-plants`,
        payload: { plantId: FixtureIds.plantB }
      },
      {
        method: "PATCH",
        url: `/api/v1/persistent-bed-plants/${FixtureIds.persistentBedPlantA}`,
        payload: { plantId: FixtureIds.plantB }
      },
      {
        method: "POST",
        url: `/api/v1/beds/${FixtureIds.bedB}/plantings`,
        payload: { plantId: FixtureIds.plantA, year: 2026, status: "planted" }
      },
      {
        method: "POST",
        url: `/api/v1/beds/${FixtureIds.bedA}/plantings`,
        payload: { plantId: FixtureIds.plantB, year: 2026, status: "planted" }
      },
      {
        method: "PATCH",
        url: `/api/v1/plantings/${FixtureIds.yearlyBedPlantingA2026}`,
        payload: { plantId: FixtureIds.plantB }
      }
    ];

    for (const request of requests) {
      const response = await injectAccountA(request.method, request.url, request.payload);

      expectNotFoundEnvelope(response);
    }
  });

  it("preserves rows while archive endpoints exclude archived records from default lists", async () => {
    await expectArchiveAndDefaultListExclusion(
      `/api/v1/perennials/${FixtureIds.perennialA}/archive`,
      `/api/v1/places/${FixtureIds.placeA}/perennials`,
      "perennials",
      FixtureIds.perennialA
    );
    await expectArchiveAndDefaultListExclusion(
      `/api/v1/persistent-bed-plants/${FixtureIds.persistentBedPlantA}/archive`,
      `/api/v1/beds/${FixtureIds.bedA}/persistent-plants`,
      "persistent_bed_plants",
      FixtureIds.persistentBedPlantA
    );
    await expectArchiveAndDefaultListExclusion(
      `/api/v1/plantings/${FixtureIds.yearlyBedPlantingA2026}/archive`,
      `/api/v1/beds/${FixtureIds.bedA}/plantings?year=2026`,
      "yearly_bed_plantings",
      FixtureIds.yearlyBedPlantingA2026
    );
    await expectArchiveAndDefaultListExclusion(
      `/api/v1/beds/${FixtureIds.bedA}/archive`,
      `/api/v1/places/${FixtureIds.placeA}/beds?year=2026`,
      "beds",
      FixtureIds.bedA
    );
  });

  it("returns selected-year bed contents without deleting historical yearly plantings", async () => {
    const detail2026 = await injectAccountA("GET", `/api/v1/beds/${FixtureIds.bedA}?year=2026`);
    const detail2027 = await injectAccountA("GET", `/api/v1/beds/${FixtureIds.bedA}?year=2027`);

    expect(detail2026.statusCode).toBe(200);
    expect(detail2027.statusCode).toBe(200);

    const body2026 = parseJsonResponse<BedDetailEnvelope>(detail2026);
    const body2027 = parseJsonResponse<BedDetailEnvelope>(detail2027);

    expect(body2026.data.persistentPlants.map((item) => item.id)).toEqual([FixtureIds.persistentBedPlantA]);
    expect(body2026.data.yearlyPlantings.map((item) => item.id)).toEqual([FixtureIds.yearlyBedPlantingA2026]);
    expect(body2027.data.persistentPlants.map((item) => item.id)).toEqual([FixtureIds.persistentBedPlantA]);
    expect(body2027.data.yearlyPlantings.map((item) => item.id)).toEqual([FixtureIds.yearlyBedPlantingA2027]);
    expect(await countRows("yearly_bed_plantings", "bed_id", FixtureIds.bedA)).toBe(2);
  });

  it("allows duplicate yearly planting rows for the same bed, plant, and year", async () => {
    const response = await injectAccountA("POST", `/api/v1/beds/${FixtureIds.bedA}/plantings`, {
      plantId: FixtureIds.plantA,
      year: 2026,
      quantity: 3,
      status: "planted"
    });

    expect(response.statusCode).toBe(200);
    expect(parseJsonResponse<MutationEnvelope>(response).data.id).toMatch(uuidPattern);

    const duplicateRows = await pool.query<{ count: number }>(
      `select count(*)::int as count
       from yearly_bed_plantings
       where bed_id = $1 and plant_id = $2 and year = 2026`,
      [FixtureIds.bedA, FixtureIds.plantA]
    );

    expect(duplicateRows.rows[0]?.count).toBe(2);
  });

  it("keeps representative success and validation responses in canonical envelopes", async () => {
    const successResponses = await Promise.all([
      injectAccountA("GET", `/api/v1/places/${FixtureIds.placeA}/perennials`),
      injectAccountA("GET", `/api/v1/places/${FixtureIds.placeA}/beds?year=2026`),
      injectAccountA("GET", `/api/v1/beds/${FixtureIds.bedA}/persistent-plants`),
      injectAccountA("GET", `/api/v1/beds/${FixtureIds.bedA}/plantings?year=2026`)
    ]);

    for (const response of successResponses) {
      expect(response.statusCode).toBe(200);
      const body = parseJsonResponse<{ data?: unknown; error?: unknown }>(response);

      expect(body.data).toBeDefined();
      expect(body.error).toBeUndefined();
    }

    const validationResponses = await Promise.all([
      injectAccountA("POST", `/api/v1/places/${FixtureIds.placeA}/perennials`, {}),
      injectAccountA("POST", `/api/v1/places/${FixtureIds.placeA}/beds`, {}),
      injectAccountA("POST", `/api/v1/beds/${FixtureIds.bedA}/persistent-plants`, {}),
      injectAccountA("POST", `/api/v1/beds/${FixtureIds.bedA}/plantings`, { status: "planted" })
    ]);

    for (const response of validationResponses) {
      expect(response.statusCode).toBe(400);
      const body = parseJsonResponse<{
        data?: unknown;
        error?: { code?: unknown; message?: unknown; details?: unknown };
      }>(response);

      expect(body.error).toMatchObject({
        code: "VALIDATION_ERROR",
        message: "Invalid input"
      });
      expect(body.error?.details).toBeDefined();
      expect(body.data).toBeUndefined();
    }
  });

  async function injectAccountA(
    method: "GET" | "PATCH" | "POST",
    url: string,
    payload?: Record<string, unknown>
  ): Promise<InjectResponse> {
    if (payload === undefined) {
      return app!.inject({
        method,
        url,
        headers: accountAAuthHeaders()
      });
    }

    return app!.inject({
      method,
      url,
      headers: accountAAuthHeaders(),
      payload
    });
  }

  async function expectArchiveAndDefaultListExclusion(
    archiveUrl: string,
    listUrl: string,
    tableName: "beds" | "perennials" | "persistent_bed_plants" | "yearly_bed_plantings",
    id: string
  ): Promise<void> {
    const archiveResponse = await injectAccountA("POST", archiveUrl);
    const listResponse = await injectAccountA("GET", listUrl);

    expect(archiveResponse.statusCode).toBe(200);
    expect(archiveResponse.json()).toEqual({ data: { archived: true } });
    expect(parseJsonResponse<ListEnvelope<IdItem>>(listResponse).data).toMatchObject({ items: [], total: 0 });
    expect(await countRows(tableName, "id", id)).toBe(1);
  }

  async function countRows(
    tableName: "beds" | "perennials" | "persistent_bed_plants" | "yearly_bed_plantings",
    columnName: "bed_id" | "id",
    value: string
  ): Promise<number> {
    const result = await pool.query<{ count: number }>(
      `select count(*)::int as count from ${tableName} where ${columnName} = $1`,
      [value]
    );

    return result.rows[0]?.count ?? 0;
  }
});

function expectListIds(response: InjectResponse, expectedIds: string[]): void {
  expect(response.statusCode).toBe(200);

  const body = parseJsonResponse<ListEnvelope<IdItem>>(response);

  expect(body.data.items.map((item) => item.id)).toEqual(expectedIds);
  expect(body.data.total).toBe(expectedIds.length);
  expect(body.data.page).toBe(1);
  expect(body.data.pageSize).toBe(20);
}

function expectNotFoundEnvelope(response: InjectResponse): void {
  expect(response.statusCode).toBe(404);
  expect(response.json()).toMatchObject({
    error: {
      code: "NOT_FOUND",
      details: {}
    }
  });
  expect(response.json()).not.toHaveProperty("data");
}

function parseJsonResponse<T>(response: { body: string }): T {
  return JSON.parse(response.body) as T;
}
