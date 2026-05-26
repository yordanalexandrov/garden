import type { FastifyInstance } from "fastify";
import type { Pool } from "pg";
import { afterEach, beforeEach, describe, expect, it } from "vitest";

import { loadConfig } from "../../src/config/config.js";
import { createDbClient } from "../../src/db/db.js";
import type { DbClient } from "../../src/db/transaction.js";
import { KyselyAccountsRepository, type AccountsRepository } from "../../src/modules/accounts/accounts.repository.js";
import type { Account } from "../../src/modules/accounts/accounts.types.js";
import { TestAuthAdapter } from "../../src/modules/auth/test-auth.adapter.js";
import { createTestPool, hasTestDatabase, resetAndApplyBaseline } from "../db/helpers/test-database.js";
import { AccountFixtureIds, insertAuthAccountFixtures } from "../helpers/accounts.js";
import { createTestApp } from "../helpers/app.js";
import { accountAAuthHeaders, accountBAuthHeaders } from "../helpers/auth.js";

const describeDatabase = hasTestDatabase() ? describe : describe.skip;

const Ids = {
  placeA: "11111111-1111-4111-8111-111111111111",
  placeB: "22222222-2222-4222-8222-222222222222",
  plantA: "33333333-3333-4333-8333-333333333333",
  plantB: "44444444-4444-4444-8444-444444444444",
  bedA1: "55555555-5555-4555-8555-555555555555",
  bedA2: "66666666-6666-4666-8666-666666666666",
  bedB: "77777777-7777-4777-8777-777777777777",
  productA: "88888888-8888-4888-8888-888888888888",
  otherProductA: "89898989-8989-4898-8989-898989898989",
  productB: "99999999-9999-4999-8999-999999999999",
  ruleA: "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa",
  otherRuleA: "abababab-abab-4aba-8aba-abababababab",
  ruleB: "bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb",
  lotA1: "cccccccc-cccc-4ccc-8ccc-cccccccccccc",
  lotA2: "dddddddd-dddd-4ddd-8ddd-dddddddddddd"
} as const;

type CreateActivityResponse = {
  data: {
    activity: {
      id: string;
      targets: Array<{ targetType: string; targetId: string }>;
      productUsages: Array<{ id: string; productId: string; createdStockMovement: boolean }>;
    };
    inventoryEffects: Array<{ movementId: string; productId: string; quantity: number; unit: string }>;
    quarantinePeriods: Array<{ id: string; startsOn: string; endsOn: string }>;
    suggestedTasks: Array<{ id: string; type: string; dueDate: string; status: string }>;
    warnings: string[];
  };
};

type CorrectActivityResponse = {
  data: {
    activityId: string;
    correctionMovements: Array<{ movementId: string; productId: string; inventoryLotId: string; quantity: number; unit: string }>;
    lotEffects: Array<{ inventoryLotId: string; beforeQuantityRemaining: number; afterQuantityRemaining: number }>;
    auditLog: { id: string };
    warnings: string[];
  };
};

describe("Activities routes", () => {
  let app: FastifyInstance | undefined;

  afterEach(async () => {
    await app?.close();
    app = undefined;
  });

  it("keeps health unauthenticated and protects activity routes", async () => {
    app = await createTestApp();

    const health = await app.inject({ method: "GET", url: "/api/v1/health" });
    const activities = await app.inject({ method: "GET", url: "/api/v1/activities" });

    expect(health.statusCode).toBe(200);
    expect(activities.statusCode).toBe(401);
  });

  it("validates activity payloads before service dispatch", async () => {
    app = await createTestApp({
      auth: {
        authPort: new TestAuthAdapter(),
        accountsRepository: new StaticAccountsRepository()
      }
    });

    const invalidType = await app.inject({
      method: "POST",
      url: "/api/v1/activities",
      headers: accountAAuthHeaders(),
      payload: {
        placeId: Ids.placeA,
        type: "spray",
        performedAt: "2026-05-13T08:00:00.000Z",
        targetScopeType: "whole_place"
      }
    });
    const targetMismatch = await app.inject({
      method: "POST",
      url: "/api/v1/activities",
      headers: accountAAuthHeaders(),
      payload: {
        placeId: Ids.placeA,
        type: "watering",
        performedAt: "2026-05-13T08:00:00.000Z",
        targetScopeType: "whole_place",
        targetSelection: { bedIds: [Ids.bedA1] }
      }
    });
    const badQuantity = await app.inject({
      method: "POST",
      url: "/api/v1/activities",
      headers: accountAAuthHeaders(),
      payload: {
        placeId: Ids.placeA,
        type: "treatment",
        performedAt: "2026-05-13T08:00:00.000Z",
        targetScopeType: "selected_beds",
        targetSelection: { bedIds: [Ids.bedA1] },
        productUsages: [{ productId: Ids.productA, quantityUsed: 0, unit: "g" }]
      }
    });
    const partialTargetFilter = await app.inject({
      method: "GET",
      url: "/api/v1/activities?targetType=bed",
      headers: accountAAuthHeaders()
    });
    const unsupportedCorrectionShape = await app.inject({
      method: "POST",
      url: `/api/v1/activities/${Ids.placeA}/correct`,
      headers: accountAAuthHeaders(),
      payload: {
        reason: "Wrong date",
        performedAt: "2026-05-14T08:00:00.000Z",
        inventoryCorrections: []
      }
    });

    expect(invalidType.statusCode).toBe(400);
    expect(targetMismatch.statusCode).toBe(400);
    expect(badQuantity.statusCode).toBe(400);
    expect(partialTargetFilter.statusCode).toBe(400);
    expect(unsupportedCorrectionShape.statusCode).toBe(400);
  });
});

describeDatabase("Activities routes with database", () => {
  let pool: Pool;
  let dbClient: DbClient;
  let app: FastifyInstance | undefined;

  beforeEach(async () => {
    pool = createTestPool();
    await resetAndApplyBaseline(pool);
    await insertAuthAccountFixtures(pool);
    await insertActivitiesFixture(pool);
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
    await dbClient.destroy();
    await pool.end();
  });

  it("creates watering activity with resolved target rows and empty side-effect arrays", async () => {
    const response = await app!.inject({
      method: "POST",
      url: "/api/v1/activities",
      headers: accountAAuthHeaders(),
      payload: {
        placeId: Ids.placeA,
        type: "watering",
        performedAt: "2026-05-13T08:00:00.000Z",
        targetScopeType: "all_beds_in_place",
        notes: "Watered beds"
      }
    });

    expect(response.statusCode).toBe(200);
    const body = parseJsonResponse<CreateActivityResponse>(response);
    expect(body.data.activity.targets.map((target) => target.targetId)).toEqual([Ids.bedA1, Ids.bedA2]);
    expect(body.data.inventoryEffects).toEqual([]);
    expect(body.data.quarantinePeriods).toEqual([]);
    expect(body.data.suggestedTasks).toEqual([]);
    expect(body.data.warnings).toEqual([]);

    const targetRows = await pool.query<{ count: string }>("select count(*) from activity_targets where activity_id = $1", [
      body.data.activity.id
    ]);
    expect(targetRows.rows[0]?.count).toBe("2");
  });

  it("creates treatment side effects transactionally from rule and FEFO inventory", async () => {
    const response = await app!.inject({
      method: "POST",
      url: "/api/v1/activities",
      headers: accountAAuthHeaders(),
      payload: {
        placeId: Ids.placeA,
        type: "treatment",
        performedAt: "2026-05-13T08:00:00.000Z",
        targetScopeType: "selected_beds",
        targetSelection: { bedIds: [Ids.bedA1] },
        productUsages: [
          {
            productId: Ids.productA,
            productUsageRuleId: Ids.ruleA,
            quantityUsed: 30,
            unit: "g",
            notes: "Preventive spray"
          }
        ],
        allowInventoryShortage: false
      }
    });

    expect(response.statusCode).toBe(200);
    const body = parseJsonResponse<CreateActivityResponse>(response);
    expect(body.data.inventoryEffects).toEqual([
      expect.objectContaining({ productId: Ids.productA, quantity: 20, unit: "g" }),
      expect.objectContaining({ productId: Ids.productA, quantity: 10, unit: "g" })
    ]);
    expect(body.data.quarantinePeriods).toEqual([
      expect.objectContaining({ startsOn: "2026-05-13", endsOn: "2026-05-27" })
    ]);
    expect(body.data.suggestedTasks).toEqual([
      expect.objectContaining({ type: "spraying", dueDate: "2026-05-23", status: "suggested" })
    ]);

    const state = await pool.query<{
      lot1: string;
      lot2: string;
      movements: string;
      first_movement_at: Date;
      quarantines: string;
      tasks: string;
      reminders: string;
    }>(
      `select
         (select quantity_remaining from inventory_lots where id = $1) as lot1,
         (select quantity_remaining from inventory_lots where id = $2) as lot2,
         (select count(*) from inventory_movements where activity_id = $3 and movement_type = 'consumption') as movements,
         (select min(occurred_at) from inventory_movements where activity_id = $3 and movement_type = 'consumption') as first_movement_at,
         (select count(*) from quarantine_periods where activity_id = $3) as quarantines,
         (select count(*) from tasks where source_reference_id = $3 and status = 'suggested') as tasks,
         (select count(*) from task_reminders tr join tasks t on t.id = tr.task_id where t.source_reference_id = $3) as reminders`,
      [Ids.lotA1, Ids.lotA2, body.data.activity.id]
    );
    expect(state.rows[0]).toMatchObject({
      lot1: "0",
      lot2: "40",
      movements: "2",
      first_movement_at: new Date("2026-05-13T08:00:00.000Z"),
      quarantines: "1",
      tasks: "1",
      reminders: "0"
    });

    const audit = await pool.query<{ action: string }>(
      "select action from audit_logs where entity_type = 'activity' and entity_id = $1",
      [body.data.activity.id]
    );
    expect(audit.rows).toEqual([expect.objectContaining({ action: "activity.created" })]);
  });

  it("corrects supported activity inventory usage with correction movement, lot update, and audit row", async () => {
    const created = await app!.inject({
      method: "POST",
      url: "/api/v1/activities",
      headers: accountAAuthHeaders(),
      payload: {
        placeId: Ids.placeA,
        type: "treatment",
        performedAt: "2026-05-13T08:00:00.000Z",
        targetScopeType: "selected_beds",
        targetSelection: { bedIds: [Ids.bedA1] },
        productUsages: [{ productId: Ids.productA, quantityUsed: 10, unit: "g" }],
        allowInventoryShortage: false
      }
    });
    const activityId = parseJsonResponse<CreateActivityResponse>(created).data.activity.id;
    const originalMovementId = parseJsonResponse<CreateActivityResponse>(created).data.inventoryEffects[0]!.movementId;

    const corrected = await app!.inject({
      method: "POST",
      url: `/api/v1/activities/${activityId}/correct`,
      headers: accountAAuthHeaders(),
      payload: {
        reason: "Recorded 5 g too much",
        inventoryCorrections: [
          {
            inventoryMovementId: originalMovementId,
            direction: "increase_lot",
            quantity: 5,
            unit: "g"
          }
        ]
      }
    });

    expect(corrected.statusCode).toBe(200);
    const correctionBody = parseJsonResponse<CorrectActivityResponse>(corrected);
    expect(correctionBody.data.activityId).toBe(activityId);
    expect(correctionBody.data.correctionMovements).toEqual([
      expect.objectContaining({ productId: Ids.productA, inventoryLotId: Ids.lotA1, quantity: 5, unit: "g" })
    ]);
    expect(correctionBody.data.lotEffects).toEqual([
      { inventoryLotId: Ids.lotA1, beforeQuantityRemaining: 10, afterQuantityRemaining: 15 }
    ]);
    expect(correctionBody.data.auditLog.id).toEqual(expect.any(String));
    expect(correctionBody.data.warnings).toEqual([]);

    const state = await pool.query<{
      lot_remaining: string;
      original_movements: string;
      correction_movements: string;
      activity_rows: string;
      audit_rows: string;
    }>(
      `select
         (select quantity_remaining from inventory_lots where id = $1) as lot_remaining,
         (select count(*) from inventory_movements where id = $2 and movement_type = 'consumption') as original_movements,
         (select count(*) from inventory_movements where activity_id = $3 and movement_type = 'correction') as correction_movements,
         (select count(*) from activities where id = $3) as activity_rows,
         (select count(*) from audit_logs where entity_id = $3 and action = 'activity.corrected') as audit_rows`,
      [Ids.lotA1, originalMovementId, activityId]
    );
    expect(state.rows[0]).toMatchObject({
      lot_remaining: "15",
      original_movements: "1",
      correction_movements: "1",
      activity_rows: "1",
      audit_rows: "1"
    });
  });

  it("rejects correction for account B activity access and unsupported generated side effects", async () => {
    const created = await app!.inject({
      method: "POST",
      url: "/api/v1/activities",
      headers: accountAAuthHeaders(),
      payload: {
        placeId: Ids.placeA,
        type: "treatment",
        performedAt: "2026-05-13T08:00:00.000Z",
        targetScopeType: "selected_beds",
        targetSelection: { bedIds: [Ids.bedA1] },
        productUsages: [{ productId: Ids.productA, productUsageRuleId: Ids.ruleA, quantityUsed: 5, unit: "g" }],
        allowInventoryShortage: false
      }
    });
    const body = parseJsonResponse<CreateActivityResponse>(created);
    const activityId = body.data.activity.id;
    const originalMovementId = body.data.inventoryEffects[0]!.movementId;

    const crossAccount = await app!.inject({
      method: "POST",
      url: `/api/v1/activities/${activityId}/correct`,
      headers: accountBAuthHeaders(),
      payload: {
        reason: "Not mine",
        inventoryCorrections: [
          { inventoryMovementId: originalMovementId, direction: "increase_lot", quantity: 1, unit: "g" }
        ]
      }
    });
    const unsupported = await app!.inject({
      method: "POST",
      url: `/api/v1/activities/${activityId}/correct`,
      headers: accountAAuthHeaders(),
      payload: {
        reason: "Would also need quarantine/task compensation",
        inventoryCorrections: [
          { inventoryMovementId: originalMovementId, direction: "increase_lot", quantity: 1, unit: "g" }
        ]
      }
    });

    expect(crossAccount.statusCode).toBe(404);
    expect(unsupported.statusCode).toBe(422);
    expect(unsupported.json()).toMatchObject({ error: { code: "BUSINESS_RULE_VIOLATION" } });

    const state = await pool.query<{ corrections: string; audit_rows: string }>(
      `select
         (select count(*) from inventory_movements where activity_id = $1 and movement_type = 'correction') as corrections,
         (select count(*) from audit_logs where entity_id = $1 and action = 'activity.corrected') as audit_rows`,
      [activityId]
    );
    expect(state.rows[0]).toEqual({ corrections: "0", audit_rows: "0" });
  });

  it("rejects correction that would make a lot negative without partial writes", async () => {
    const created = await app!.inject({
      method: "POST",
      url: "/api/v1/activities",
      headers: accountAAuthHeaders(),
      payload: {
        placeId: Ids.placeA,
        type: "treatment",
        performedAt: "2026-05-13T08:00:00.000Z",
        targetScopeType: "selected_beds",
        targetSelection: { bedIds: [Ids.bedA1] },
        productUsages: [{ productId: Ids.productA, quantityUsed: 10, unit: "g" }],
        allowInventoryShortage: false
      }
    });
    const body = parseJsonResponse<CreateActivityResponse>(created);
    const activityId = body.data.activity.id;
    const originalMovementId = body.data.inventoryEffects[0]!.movementId;

    const response = await app!.inject({
      method: "POST",
      url: `/api/v1/activities/${activityId}/correct`,
      headers: accountAAuthHeaders(),
      payload: {
        reason: "Impossible extra usage",
        inventoryCorrections: [
          { inventoryMovementId: originalMovementId, direction: "decrease_lot", quantity: 11, unit: "g" }
        ]
      }
    });

    expect(response.statusCode).toBe(422);
    expect(response.json()).toMatchObject({ error: { code: "INVENTORY_SHORTAGE" } });

    const state = await pool.query<{ lot_remaining: string; corrections: string; audit_rows: string }>(
      `select
         (select quantity_remaining from inventory_lots where id = $1) as lot_remaining,
         (select count(*) from inventory_movements where activity_id = $2 and movement_type = 'correction') as corrections,
         (select count(*) from audit_logs where entity_id = $2 and action = 'activity.corrected') as audit_rows`,
      [Ids.lotA1, activityId]
    );
    expect(state.rows[0]).toEqual({ lot_remaining: "10", corrections: "0", audit_rows: "0" });
  });

  it("rejects inventory shortage by default and rolls back activity writes", async () => {
    const response = await app!.inject({
      method: "POST",
      url: "/api/v1/activities",
      headers: accountAAuthHeaders(),
      payload: {
        placeId: Ids.placeA,
        type: "treatment",
        performedAt: "2026-05-13T08:00:00.000Z",
        targetScopeType: "selected_beds",
        targetSelection: { bedIds: [Ids.bedA1] },
        productUsages: [{ productId: Ids.productA, quantityUsed: 100, unit: "g" }]
      }
    });

    expect(response.statusCode).toBe(422);
    expect(response.json()).toMatchObject({ error: { code: "INVENTORY_SHORTAGE" } });

    const state = await pool.query(
      `select
         (select count(*) from activities where account_id = $1) as activities,
         (select count(*) from activity_targets) as targets,
         (select count(*) from activity_product_usages) as usages,
         (select count(*) from inventory_movements where movement_type = 'consumption') as movements,
         (select quantity_remaining from inventory_lots where id = $2) as lot1`,
      [AccountFixtureIds.accountA, Ids.lotA1]
    );
    expect(state.rows[0]).toMatchObject({ activities: "0", targets: "0", usages: "0", movements: "0", lot1: "20" });
  });

  it("allows explicit shortage without negative stock and returns warning", async () => {
    const response = await app!.inject({
      method: "POST",
      url: "/api/v1/activities",
      headers: accountAAuthHeaders(),
      payload: {
        placeId: Ids.placeA,
        type: "treatment",
        performedAt: "2026-05-13T08:00:00.000Z",
        targetScopeType: "selected_beds",
        targetSelection: { bedIds: [Ids.bedA1] },
        productUsages: [{ productId: Ids.productA, quantityUsed: 100, unit: "g" }],
        allowInventoryShortage: true
      }
    });

    expect(response.statusCode).toBe(200);
    const body = parseJsonResponse<CreateActivityResponse>(response);
    expect(body.data.inventoryEffects.map((effect) => effect.quantity)).toEqual([20, 50]);
    expect(body.data.warnings.some((warning) => warning.includes("30 g was not covered"))).toBe(true);

    const lots = await pool.query("select id, quantity_remaining from inventory_lots where id in ($1, $2) order by expiry_date", [
      Ids.lotA1,
      Ids.lotA2
    ]);
    expect(lots.rows).toEqual([
      { id: Ids.lotA1, quantity_remaining: "0" },
      { id: Ids.lotA2, quantity_remaining: "0" }
    ]);
  });

  it("rejects cross-account target and product rule mismatch without side effects", async () => {
    const crossAccountTarget = await app!.inject({
      method: "POST",
      url: "/api/v1/activities",
      headers: accountAAuthHeaders(),
      payload: {
        placeId: Ids.placeA,
        type: "watering",
        performedAt: "2026-05-13T08:00:00.000Z",
        targetScopeType: "selected_beds",
        targetSelection: { bedIds: [Ids.bedB] }
      }
    });
    const ruleMismatch = await app!.inject({
      method: "POST",
      url: "/api/v1/activities",
      headers: accountAAuthHeaders(),
      payload: {
        placeId: Ids.placeA,
        type: "treatment",
        performedAt: "2026-05-13T08:00:00.000Z",
        targetScopeType: "selected_beds",
        targetSelection: { bedIds: [Ids.bedA1] },
        productUsages: [{ productId: Ids.productA, productUsageRuleId: Ids.otherRuleA, quantityUsed: 1, unit: "g" }]
      }
    });

    expect(crossAccountTarget.statusCode).toBe(422);
    expect(ruleMismatch.statusCode).toBe(422);

    const rows = await pool.query<{ count: string }>("select count(*) from activities");
    expect(rows.rows[0]?.count).toBe("0");
  });

  it("lists and reads only actor-account activities", async () => {
    const created = await app!.inject({
      method: "POST",
      url: "/api/v1/activities",
      headers: accountAAuthHeaders(),
      payload: {
        placeId: Ids.placeA,
        type: "watering",
        performedAt: "2026-05-13T08:00:00.000Z",
        targetScopeType: "selected_beds",
        targetSelection: { bedIds: [Ids.bedA1] }
      }
    });
    const activityId = parseJsonResponse<CreateActivityResponse>(created).data.activity.id;

    const accountAList = await app!.inject({
      method: "GET",
      url: `/api/v1/activities?placeId=${Ids.placeA}&pageSize=10`,
      headers: accountAAuthHeaders()
    });
    const accountBList = await app!.inject({
      method: "GET",
      url: "/api/v1/activities",
      headers: accountBAuthHeaders()
    });
    const accountBRead = await app!.inject({
      method: "GET",
      url: `/api/v1/activities/${activityId}`,
      headers: accountBAuthHeaders()
    });

    expect(accountAList.statusCode).toBe(200);
    expect(parseJsonResponse<{ data: { items: Array<{ id: string }> } }>(accountAList).data.items).toEqual([
      expect.objectContaining({ id: activityId })
    ]);
    expect(accountBList.statusCode).toBe(200);
    expect(parseJsonResponse<{ data: { items: unknown[] } }>(accountBList).data.items).toEqual([]);
    expect(accountBRead.statusCode).toBe(404);
  });
});

async function insertActivitiesFixture(pool: Pool): Promise<void> {
  await pool.query("insert into places (id, account_id, name) values ($1, $2, 'Place A'), ($3, $4, 'Place B')", [
    Ids.placeA,
    AccountFixtureIds.accountA,
    Ids.placeB,
    AccountFixtureIds.accountB
  ]);
  await pool.query(
    `insert into plants (id, account_id, common_name, lifecycle_type, growing_style)
     values ($1, $2, 'Tomato', 'annual', 'vegetable'), ($3, $4, 'Pepper', 'annual', 'vegetable')`,
    [Ids.plantA, AccountFixtureIds.accountA, Ids.plantB, AccountFixtureIds.accountB]
  );
  await pool.query(
    `insert into beds (id, account_id, place_id, name, status)
     values ($1, $2, $3, 'Bed A1', 'active'), ($4, $2, $3, 'Bed A2', 'active'), ($5, $6, $7, 'Bed B', 'active')`,
    [Ids.bedA1, AccountFixtureIds.accountA, Ids.placeA, Ids.bedA2, Ids.bedB, AccountFixtureIds.accountB, Ids.placeB]
  );
  await pool.query(
    `insert into products (id, account_id, name, category, default_unit)
     values ($1, $2, 'Copper', 'fungicide', 'g'),
            ($3, $2, 'Sulfur', 'fungicide', 'g'),
            ($4, $5, 'Other Copper', 'fungicide', 'g')`,
    [Ids.productA, AccountFixtureIds.accountA, Ids.otherProductA, Ids.productB, AccountFixtureIds.accountB]
  );
  await pool.query(
    `insert into product_usage_rules (
       id, account_id, product_id, plant_id, dose_value, dose_unit, reapplication_interval_days, quarantine_period_days, notes
     )
     values ($1, $2, $3, $4, 10, 'g', 10, 14, 'Rule A'),
            ($5, $2, $6, $4, 10, 'g', null, null, null),
            ($7, $8, $9, $10, 10, 'g', null, null, null)`,
    [
      Ids.ruleA,
      AccountFixtureIds.accountA,
      Ids.productA,
      Ids.plantA,
      Ids.otherRuleA,
      Ids.otherProductA,
      Ids.ruleB,
      AccountFixtureIds.accountB,
      Ids.productB,
      Ids.plantB
    ]
  );
  await pool.query(
    `insert into inventory_lots (
       id, account_id, product_id, quantity_initial, quantity_remaining, unit, purchase_date, expiry_date
     )
     values ($1, $2, $3, 20, 20, 'g', '2026-01-01', '2026-06-01'),
            ($4, $2, $3, 50, 50, 'g', '2026-01-01', '2027-06-01')`,
    [Ids.lotA1, AccountFixtureIds.accountA, Ids.productA, Ids.lotA2]
  );
}

function parseJsonResponse<T>(response: { json(): unknown }): T {
  return response.json() as T;
}

class StaticAccountsRepository implements AccountsRepository {
  findById(accountId: string): Promise<Account | null> {
    return Promise.resolve({
      id: accountId,
      email: "account@example.com",
      displayName: "Account",
      createdAt: new Date("2026-05-18T00:00:00.000Z"),
      updatedAt: new Date("2026-05-18T00:00:00.000Z"),
      archivedAt: null
    });
  }
}
