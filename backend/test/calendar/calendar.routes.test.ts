import type { FastifyInstance, LightMyRequestResponse } from "fastify";
import type { Pool } from "pg";
import { afterEach, beforeEach, describe, expect, it } from "vitest";

import { loadConfig } from "../../src/config/config.js";
import { createDbClient } from "../../src/db/db.js";
import type { DbClient } from "../../src/db/transaction.js";
import { KyselyAccountsRepository } from "../../src/modules/accounts/accounts.repository.js";
import type { AccountsRepository } from "../../src/modules/accounts/accounts.repository.js";
import type { Account } from "../../src/modules/accounts/accounts.types.js";
import { TestAuthAdapter } from "../../src/modules/auth/test-auth.adapter.js";
import { createTestPool, hasTestDatabase, resetAndApplyBaseline } from "../db/helpers/test-database.js";
import { AccountFixtureIds, insertAuthAccountFixtures } from "../helpers/accounts.js";
import { createTestApp } from "../helpers/app.js";
import { accountAAuthHeaders, accountBAuthHeaders } from "../helpers/auth.js";

const describeDatabase = hasTestDatabase() ? describe : describe.skip;

export const Phase19Ids = {
  placeA: "11111111-1111-4111-8111-111111111111",
  placeB: "22222222-2222-4222-8222-222222222222",
  plantA: "33333333-3333-4333-8333-333333333333",
  plantB: "44444444-4444-4444-8444-444444444444",
  bedA: "55555555-5555-4555-8555-555555555555",
  bedB: "66666666-6666-4666-8666-666666666666",
  productA: "77777777-7777-4777-8777-777777777777",
  productB: "88888888-8888-4888-8888-888888888888",
  activityA: "99999999-9999-4999-8999-999999999999",
  activityB: "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa",
  usageA: "bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb",
  usageB: "cccccccc-cccc-4ccc-8ccc-cccccccccccc",
  quarantineA: "dddddddd-dddd-4ddd-8ddd-dddddddddddd",
  quarantineB: "eeeeeeee-eeee-4eee-8eee-eeeeeeeeeeee",
  suggestedTaskA: "ffffffff-ffff-4fff-8fff-ffffffffffff",
  plannedTaskA: "12121212-1212-4212-8212-121212121212",
  taskB: "13131313-1313-4313-8313-131313131313",
  weatherA: "14141414-1414-4414-8414-141414141414",
  weatherB: "15151515-1515-4515-8515-151515151515",
  problemA: "16161616-1616-4616-8616-161616161616",
  problemB: "17171717-1717-4717-8717-171717171717"
} as const;

type CalendarResponse = {
  data: {
    activities: Array<{ id: string; type: string; activityType: string; dateTime: string; placeId: string; targetSummary: string }>;
    tasks: Array<{ id: string; type: string; taskType: string; dueDate: string; status: string; placeId: string; targetSummary: string }>;
    quarantinePeriods: Array<{ id: string; type: string; startsOn: string; endsOn: string; activityId: string; productId: string }>;
    weatherEvents: Array<{ id: string; type: string; date: string; eventType: string; userConfirmationStatus: string | null }>;
  };
};

describe("Calendar routes", () => {
  let app: FastifyInstance | undefined;

  afterEach(async () => {
    await app?.close();
    app = undefined;
  });

  it("protects calendar and returns canonical validation errors before service dispatch", async () => {
    app = await createTestApp({
      auth: {
        authPort: new TestAuthAdapter(),
        accountsRepository: new StaticAccountsRepository()
      }
    });

    const unauthenticated = await app.inject({ method: "GET", url: "/api/v1/calendar?from=2026-05-01&to=2026-05-31" });
    const missingFrom = await app.inject({ method: "GET", url: "/api/v1/calendar?to=2026-05-31", headers: accountAAuthHeaders() });
    const missingTo = await app.inject({ method: "GET", url: "/api/v1/calendar?from=2026-05-01", headers: accountAAuthHeaders() });
    const invalidRange = await app.inject({ method: "GET", url: "/api/v1/calendar?from=2026-06-01&to=2026-05-01", headers: accountAAuthHeaders() });

    expect(unauthenticated.statusCode).toBe(401);
    expect(missingFrom.statusCode).toBe(400);
    expect(missingFrom.json()).toMatchObject({ error: { code: "VALIDATION_ERROR" } });
    expect(missingTo.statusCode).toBe(400);
    expect(invalidRange.statusCode).toBe(400);
  });
});

describeDatabase("Calendar routes with database", () => {
  let pool: Pool;
  let dbClient: DbClient;
  let app: FastifyInstance | undefined;

  beforeEach(async () => {
    pool = createTestPool();
    await resetAndApplyBaseline(pool);
    await insertAuthAccountFixtures(pool);
    await insertCalendarDashboardFixture(pool);
    dbClient = createDbClient(
      loadConfig({ NODE_ENV: "test", DATABASE_URL: process.env.TEST_DATABASE_URL ?? process.env.DATABASE_URL })
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
    await dbClient.destroy();
    await pool.end();
  });

  it("returns sectioned calendar data with task statuses, quarantine overlaps, weather events, and account scoping", async () => {
    const response = await app!.inject({
      method: "GET",
      url: "/api/v1/calendar?from=2026-05-12&to=2026-05-25",
      headers: accountAAuthHeaders()
    });
    const accountB = await app!.inject({
      method: "GET",
      url: "/api/v1/calendar?from=2026-05-12&to=2026-05-25",
      headers: accountBAuthHeaders()
    });

    expect(response.statusCode).toBe(200);
    const body = parseJsonResponse<CalendarResponse>(response).data;
    expect(body.activities.map((item) => item.id)).toEqual([Phase19Ids.activityA]);
    expect(body.activities[0]).toMatchObject({ type: "activity", activityType: "treatment", targetSummary: "1 target" });
    expect(body.tasks.map((item) => ({ id: item.id, status: item.status }))).toEqual([
      { id: Phase19Ids.suggestedTaskA, status: "suggested" },
      { id: Phase19Ids.plannedTaskA, status: "planned" }
    ]);
    expect(body.quarantinePeriods).toEqual([
      expect.objectContaining({ id: Phase19Ids.quarantineA, type: "quarantine", activityId: Phase19Ids.activityA, productId: Phase19Ids.productA })
    ]);
    expect(body.weatherEvents).toEqual([
      expect.objectContaining({ id: Phase19Ids.weatherA, type: "weather", date: "2026-05-23", eventType: "rain_check" })
    ]);

    expect(parseJsonResponse<CalendarResponse>(accountB).data.activities.map((item) => item.id)).toEqual([Phase19Ids.activityB]);
  });

  it("applies place filters through account-scoped authorization and does not mutate source tables", async () => {
    const before = await readRelevantCounts(pool);
    const filtered = await app!.inject({
      method: "GET",
      url: `/api/v1/calendar?from=2026-05-12&to=2026-05-25&placeId=${Phase19Ids.placeA}`,
      headers: accountAAuthHeaders()
    });
    const inaccessiblePlace = await app!.inject({
      method: "GET",
      url: `/api/v1/calendar?from=2026-05-12&to=2026-05-25&placeId=${Phase19Ids.placeB}`,
      headers: accountAAuthHeaders()
    });
    const after = await readRelevantCounts(pool);

    expect(filtered.statusCode).toBe(200);
    const body = parseJsonResponse<CalendarResponse>(filtered).data;
    expect(body.activities).toHaveLength(1);
    expect(body.tasks).toHaveLength(2);
    expect(body.quarantinePeriods).toHaveLength(1);
    expect(body.weatherEvents).toHaveLength(1);
    expect(inaccessiblePlace.statusCode).toBe(404);
    expect(after).toEqual(before);
  });
});

export async function insertCalendarDashboardFixture(pool: Pool): Promise<void> {
  await pool.query(
    `insert into places (id, account_id, name, weather_enabled, timezone)
     values ($1, $2, 'Place A', true, 'Europe/Sofia'), ($3, $4, 'Place B', false, 'UTC')`,
    [Phase19Ids.placeA, AccountFixtureIds.accountA, Phase19Ids.placeB, AccountFixtureIds.accountB]
  );
  await pool.query(
    `insert into plants (id, account_id, common_name, lifecycle_type, growing_style)
     values ($1, $2, 'Tomato', 'annual', 'vegetable'), ($3, $4, 'Pepper', 'annual', 'vegetable')`,
    [Phase19Ids.plantA, AccountFixtureIds.accountA, Phase19Ids.plantB, AccountFixtureIds.accountB]
  );
  await pool.query(
    `insert into beds (id, account_id, place_id, name, status)
     values ($1, $2, $3, 'Bed A', 'active'), ($4, $5, $6, 'Bed B', 'active')`,
    [Phase19Ids.bedA, AccountFixtureIds.accountA, Phase19Ids.placeA, Phase19Ids.bedB, AccountFixtureIds.accountB, Phase19Ids.placeB]
  );
  await pool.query(
    `insert into products (id, account_id, name, category, default_unit)
     values ($1, $2, 'Zero Stock A', 'fungicide', 'ml'), ($3, $4, 'Zero Stock B', 'fungicide', 'ml')`,
    [Phase19Ids.productA, AccountFixtureIds.accountA, Phase19Ids.productB, AccountFixtureIds.accountB]
  );
  await insertActivity(pool, Phase19Ids.activityA, AccountFixtureIds.accountA, Phase19Ids.placeA, Phase19Ids.bedA, "2026-05-13T08:00:00.000Z");
  await insertActivity(pool, Phase19Ids.activityB, AccountFixtureIds.accountB, Phase19Ids.placeB, Phase19Ids.bedB, "2026-05-14T08:00:00.000Z");
  await insertTask(pool, Phase19Ids.suggestedTaskA, AccountFixtureIds.accountA, Phase19Ids.placeA, Phase19Ids.bedA, "suggested", "2026-05-23");
  await insertTask(pool, Phase19Ids.plannedTaskA, AccountFixtureIds.accountA, Phase19Ids.placeA, Phase19Ids.bedA, "planned", "2026-05-24");
  await insertTask(pool, Phase19Ids.taskB, AccountFixtureIds.accountB, Phase19Ids.placeB, Phase19Ids.bedB, "planned", "2026-05-24");
  await insertUsageAndQuarantine(pool, Phase19Ids.usageA, Phase19Ids.quarantineA, AccountFixtureIds.accountA, Phase19Ids.placeA, Phase19Ids.activityA, Phase19Ids.productA);
  await insertUsageAndQuarantine(pool, Phase19Ids.usageB, Phase19Ids.quarantineB, AccountFixtureIds.accountB, Phase19Ids.placeB, Phase19Ids.activityB, Phase19Ids.productB);
  await pool.query(
    `insert into weather_events (id, account_id, place_id, related_entity_type, related_entity_id, event_type, user_confirmation_status)
     values ($1, $2, $3, 'task', $4, 'rain_check', 'pending'), ($5, $6, $7, 'task', $8, 'rain_check', 'pending')`,
    [Phase19Ids.weatherA, AccountFixtureIds.accountA, Phase19Ids.placeA, Phase19Ids.suggestedTaskA, Phase19Ids.weatherB, AccountFixtureIds.accountB, Phase19Ids.placeB, Phase19Ids.taskB]
  );
  await pool.query(
    `insert into problems (id, account_id, type, place_id, target_type, target_id, title, description, status, observed_at)
     values ($1, $2, 'problem', $3, 'bed', $4, 'Mildew', 'White spots', 'open', '2026-05-20T10:00:00.000Z'),
            ($5, $6, 'problem', $7, 'bed', $8, 'Pests', 'Pest pressure', 'open', '2026-05-20T10:00:00.000Z')`,
    [Phase19Ids.problemA, AccountFixtureIds.accountA, Phase19Ids.placeA, Phase19Ids.bedA, Phase19Ids.problemB, AccountFixtureIds.accountB, Phase19Ids.placeB, Phase19Ids.bedB]
  );
}

async function insertActivity(
  pool: Pool,
  id: string,
  accountId: string,
  placeId: string,
  bedId: string,
  performedAt: string
): Promise<void> {
  await pool.query(
    `insert into activities (id, account_id, place_id, type, performed_at, target_scope_type, notes)
     values ($1, $2, $3, 'treatment', $4, 'selected_beds', 'Treatment')`,
    [id, accountId, placeId, performedAt]
  );
  await pool.query("insert into activity_targets (activity_id, target_type, target_id) values ($1, 'bed', $2)", [id, bedId]);
}

async function insertTask(
  pool: Pool,
  id: string,
  accountId: string,
  placeId: string,
  bedId: string,
  status: "planned" | "suggested",
  dueDate: string
): Promise<void> {
  await pool.query(
    `insert into tasks (id, account_id, place_id, type, due_date, source_type, target_scope_type, status, confirmed_at)
     values ($1, $2, $3, 'spraying', $4, 'manual', 'selected_beds', $5, case when $5 = 'planned' then now() else null end)`,
    [id, accountId, placeId, dueDate, status]
  );
  await pool.query("insert into task_targets (task_id, target_type, target_id) values ($1, 'bed', $2)", [id, bedId]);
}

async function insertUsageAndQuarantine(
  pool: Pool,
  usageId: string,
  quarantineId: string,
  accountId: string,
  placeId: string,
  activityId: string,
  productId: string
): Promise<void> {
  await pool.query(
    `insert into activity_product_usages (id, activity_id, product_id, quantity_used, unit, created_quarantine)
     values ($1, $2, $3, 10, 'ml', true)`,
    [usageId, activityId, productId]
  );
  await pool.query(
    `insert into quarantine_periods (id, account_id, place_id, activity_id, activity_product_usage_id, product_id, starts_on, ends_on)
     values ($1, $2, $3, $4, $5, $6, current_date - interval '1 day', current_date + interval '7 days')`,
    [quarantineId, accountId, placeId, activityId, usageId, productId]
  );
}

async function readRelevantCounts(pool: Pool): Promise<Record<string, string>> {
  const result = await pool.query<Record<string, string>>(
    `select
       (select count(*) from activities) as activities,
       (select count(*) from tasks) as tasks,
       (select count(*) from quarantine_periods) as quarantine_periods,
       (select count(*) from weather_events) as weather_events,
       (select count(*) from problems) as problems,
       (select count(*) from inventory_lots) as inventory_lots,
       (select count(*) from places) as places`
  );
  return result.rows[0]!;
}

function parseJsonResponse<T>(response: LightMyRequestResponse): T {
  return response.json<T>();
}

class StaticAccountsRepository implements AccountsRepository {
  findById(): Promise<Account | null> {
    return Promise.resolve({
      id: AccountFixtureIds.accountA,
      email: "account-a@example.com",
      displayName: "Account A",
      createdAt: new Date("2026-05-18T00:00:00.000Z"),
      updatedAt: new Date("2026-05-18T00:00:00.000Z"),
      archivedAt: null
    });
  }
}
