import type { FastifyInstance, LightMyRequestResponse } from "fastify";
import type { Pool } from "pg";
import { afterEach, beforeEach, describe, expect, it } from "vitest";

import { loadConfig } from "../../src/config/config.js";
import { createDbClient } from "../../src/db/db.js";
import type { DbClient } from "../../src/db/transaction.js";
import { KyselyAccountsRepository } from "../../src/modules/accounts/accounts.repository.js";
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
  bedA: "55555555-5555-4555-8555-555555555555",
  bedB: "66666666-6666-4666-8666-666666666666",
  suggestedTaskA: "77777777-7777-4777-8777-777777777777",
  plannedTaskA: "88888888-8888-4888-8888-888888888888",
  suggestedTaskB: "99999999-9999-4999-8999-999999999999"
} as const;

type TaskDetailResponse = {
  data: {
    id: string;
    placeId: string;
    type: string;
    dueDate: string;
    status: string;
    sourceType: string;
    targetScopeType: string;
    targets: Array<{ targetType: string; targetId: string; label: string | null; placeId: string }>;
    reminders: Array<{ id: string; reminderType: string; scheduledFor: string; status: string }>;
    weatherEvents: unknown[];
    notes: string | null;
    confirmedAt: string | null;
    completedAt: string | null;
  };
};

type TaskListResponse = {
  data: {
    items: Array<{ id: string; status: string; targetSummary: string; sourceType: string }>;
    page: number;
    pageSize: number;
    total: number;
  };
};

type ConfirmResponse = {
  data: {
    id: string;
    status: "planned";
    confirmedAt: string;
    reminders: Array<{ reminderType: string; scheduledFor: string; status: string }>;
  };
};

describe("Tasks routes", () => {
  let app: FastifyInstance | undefined;

  afterEach(async () => {
    await app?.close();
    app = undefined;
  });

  it("protects task routes and validates unsupported client-owned fields before service dispatch", async () => {
    app = await createTestApp({
      auth: {
        authPort: new TestAuthAdapter(),
        accountsRepository: new StaticAccountsRepository()
      }
    });

    const unauthenticated = await app.inject({ method: "GET", url: "/api/v1/tasks" });
    const invalidQuery = await app.inject({ method: "GET", url: "/api/v1/tasks?pageSize=101", headers: accountAAuthHeaders() });
    const accountIdField = await app.inject({
      method: "POST",
      url: "/api/v1/tasks",
      headers: accountAAuthHeaders(),
      payload: { ...validCreatePayload(), accountId: AccountFixtureIds.accountB }
    });
    const reminderRows = await app.inject({
      method: "POST",
      url: "/api/v1/tasks",
      headers: accountAAuthHeaders(),
      payload: { ...validCreatePayload(), reminders: [] }
    });
    const invalidUuid = await app.inject({
      method: "POST",
      url: "/api/v1/tasks/not-a-uuid/confirm",
      headers: accountAAuthHeaders()
    });

    expect(unauthenticated.statusCode).toBe(401);
    expect(invalidQuery.statusCode).toBe(400);
    expect(accountIdField.statusCode).toBe(400);
    expect(reminderRows.statusCode).toBe(400);
    expect(invalidUuid.statusCode).toBe(400);
  });
});

describeDatabase("Tasks routes with database", () => {
  let pool: Pool;
  let dbClient: DbClient;
  let app: FastifyInstance | undefined;

  beforeEach(async () => {
    pool = createTestPool();
    await resetAndApplyBaseline(pool);
    await insertAuthAccountFixtures(pool);
    await insertTasksFixture(pool);
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

  it("lists and gets account-scoped task details with targets, reminders, and weatherEvents", async () => {
    const list = await app!.inject({
      method: "GET",
      url: "/api/v1/tasks?status=suggested&type=spraying&sourceType=activity&dueFrom=2026-05-01&dueTo=2026-05-31&page=1&pageSize=10",
      headers: accountAAuthHeaders()
    });
    const detail = await app!.inject({
      method: "GET",
      url: `/api/v1/tasks/${Ids.plannedTaskA}`,
      headers: accountAAuthHeaders()
    });
    const crossAccount = await app!.inject({
      method: "GET",
      url: `/api/v1/tasks/${Ids.suggestedTaskA}`,
      headers: accountBAuthHeaders()
    });

    expect(list.statusCode).toBe(200);
    expect(parseJsonResponse<TaskListResponse>(list).data).toMatchObject({
      page: 1,
      pageSize: 10,
      total: 1,
      items: [expect.objectContaining({ id: Ids.suggestedTaskA, targetSummary: "1 target", sourceType: "activity" })]
    });
    expect(detail.statusCode).toBe(200);
    expect(parseJsonResponse<TaskDetailResponse>(detail).data).toMatchObject({
      id: Ids.plannedTaskA,
      targets: [expect.objectContaining({ targetType: "bed", targetId: Ids.bedA, label: "Bed A" })],
      reminders: [
        expect.objectContaining({ reminderType: "day_before", status: "scheduled" }),
        expect.objectContaining({ reminderType: "same_day", status: "scheduled" })
      ],
      weatherEvents: []
    });
    expect(crossAccount.statusCode).toBe(404);
  });

  it("creates manual planned and suggested tasks with correct reminder behavior", async () => {
    const planned = await app!.inject({
      method: "POST",
      url: "/api/v1/tasks",
      headers: accountAAuthHeaders(),
      payload: validCreatePayload({ status: "planned" })
    });
    const suggested = await app!.inject({
      method: "POST",
      url: "/api/v1/tasks",
      headers: accountAAuthHeaders(),
      payload: validCreatePayload({ status: "suggested", dueDate: "2026-06-02" })
    });

    expect(planned.statusCode).toBe(200);
    expect(suggested.statusCode).toBe(200);
    const plannedBody = parseJsonResponse<TaskDetailResponse>(planned);
    expect(plannedBody.data.status).toBe("planned");
    expect(plannedBody.data.sourceType).toBe("manual");
    expect(typeof plannedBody.data.confirmedAt).toBe("string");
    expect(plannedBody.data.reminders.map((reminder) => reminder.reminderType)).toEqual(["day_before", "same_day"]);
    expect(parseJsonResponse<TaskDetailResponse>(suggested).data).toMatchObject({
      status: "suggested",
      sourceType: "manual",
      confirmedAt: null,
      reminders: []
    });
  });

  it("confirms suggested task transactionally and rejects duplicate confirm without duplicate reminders", async () => {
    const confirmed = await app!.inject({
      method: "POST",
      url: `/api/v1/tasks/${Ids.suggestedTaskA}/confirm`,
      headers: accountAAuthHeaders()
    });
    const duplicate = await app!.inject({
      method: "POST",
      url: `/api/v1/tasks/${Ids.suggestedTaskA}/confirm`,
      headers: accountAAuthHeaders()
    });

    expect(confirmed.statusCode).toBe(200);
    const confirmBody = parseJsonResponse<ConfirmResponse>(confirmed);
    expect(confirmBody.data.id).toBe(Ids.suggestedTaskA);
    expect(confirmBody.data.status).toBe("planned");
    expect(typeof confirmBody.data.confirmedAt).toBe("string");
    expect(confirmBody.data.reminders.map((reminder) => ({ reminderType: reminder.reminderType, status: reminder.status }))).toEqual([
      { reminderType: "day_before", status: "scheduled" },
      { reminderType: "same_day", status: "scheduled" }
    ]);
    expect(duplicate.statusCode).toBe(422);
    expect(duplicate.json()).toMatchObject({ error: { code: "BUSINESS_RULE_VIOLATION" } });

    const state = await pool.query<{ status: string; reminders: string; audit_rows: string }>(
      `select
         (select status from tasks where id = $1) as status,
         (select count(*) from task_reminders where task_id = $1) as reminders,
         (select count(*) from audit_logs where entity_id = $1 and action = 'task.confirmed') as audit_rows`,
      [Ids.suggestedTaskA]
    );
    expect(state.rows[0]).toEqual({ status: "planned", reminders: "2", audit_rows: "1" });
  });

  it("patches editable fields and re-resolves targets while rejecting cross-place targets", async () => {
    const patched = await app!.inject({
      method: "PATCH",
      url: `/api/v1/tasks/${Ids.suggestedTaskA}`,
      headers: accountAAuthHeaders(),
      payload: {
        dueDate: "2026-05-25",
        notes: "Updated task",
        targetScopeType: "whole_place"
      }
    });
    const crossPlace = await app!.inject({
      method: "PATCH",
      url: `/api/v1/tasks/${Ids.suggestedTaskA}`,
      headers: accountAAuthHeaders(),
      payload: {
        targetScopeType: "selected_beds",
        targetSelection: { bedIds: [Ids.bedB] }
      }
    });

    expect(patched.statusCode).toBe(200);
    expect(parseJsonResponse<TaskDetailResponse>(patched).data).toMatchObject({
      dueDate: "2026-05-25",
      notes: "Updated task",
      targetScopeType: "whole_place",
      targets: [expect.objectContaining({ targetType: "place", targetId: Ids.placeA })]
    });
    expect(crossPlace.statusCode).toBe(422);
  });

  it("dismisses, completes, and skips only valid task states without creating activities", async () => {
    const dismissed = await app!.inject({
      method: "POST",
      url: `/api/v1/tasks/${Ids.suggestedTaskA}/dismiss`,
      headers: accountAAuthHeaders()
    });
    const completed = await app!.inject({
      method: "POST",
      url: `/api/v1/tasks/${Ids.plannedTaskA}/complete`,
      headers: accountAAuthHeaders()
    });
    const plannedForSkip = parseJsonResponse<TaskDetailResponse>(
      await app!.inject({
        method: "POST",
        url: "/api/v1/tasks",
        headers: accountAAuthHeaders(),
        payload: validCreatePayload({ status: "planned", dueDate: "2026-06-05" })
      })
    ).data.id;
    const skipped = await app!.inject({
      method: "POST",
      url: `/api/v1/tasks/${plannedForSkip}/skip`,
      headers: accountAAuthHeaders()
    });

    expect(dismissed.statusCode).toBe(200);
    expect(parseJsonResponse<TaskDetailResponse>(dismissed).data.status).toBe("canceled");
    expect(completed.statusCode).toBe(200);
    const completedBody = parseJsonResponse<TaskDetailResponse>(completed);
    expect(completedBody.data.status).toBe("done");
    expect(typeof completedBody.data.completedAt).toBe("string");
    expect(skipped.statusCode).toBe(200);
    expect(parseJsonResponse<TaskDetailResponse>(skipped).data.status).toBe("skipped");

    const state = await pool.query<{ activities: string; completed_reminders: string }>(
      `select
         (select count(*) from activities) as activities,
         (select count(*) from task_reminders where task_id = $1 and status = 'canceled') as completed_reminders`,
      [Ids.plannedTaskA]
    );
    expect(state.rows[0]).toEqual({ activities: "0", completed_reminders: "2" });
  });

  it("rejects DB reminder rows for suggested tasks", async () => {
    await expect(
      pool.query(
        `insert into task_reminders (task_id, reminder_type, scheduled_for, status)
         values ($1, 'same_day', now(), 'scheduled')`,
        [Ids.suggestedTaskA]
      )
    ).rejects.toThrow(/task reminders may only be attached to planned tasks/);
  });
});

async function insertTasksFixture(pool: Pool): Promise<void> {
  await pool.query(
    `insert into places (id, account_id, name, timezone)
     values ($1, $2, 'Place A', 'Europe/Sofia'), ($3, $4, 'Place B', 'UTC')`,
    [Ids.placeA, AccountFixtureIds.accountA, Ids.placeB, AccountFixtureIds.accountB]
  );
  await pool.query(
    `insert into plants (id, account_id, common_name, lifecycle_type, growing_style)
     values ($1, $2, 'Tomato', 'annual', 'vegetable'), ($3, $4, 'Pepper', 'annual', 'vegetable')`,
    [Ids.plantA, AccountFixtureIds.accountA, Ids.plantB, AccountFixtureIds.accountB]
  );
  await pool.query(
    `insert into beds (id, account_id, place_id, name, status)
     values ($1, $2, $3, 'Bed A', 'active'), ($4, $5, $6, 'Bed B', 'active')`,
    [Ids.bedA, AccountFixtureIds.accountA, Ids.placeA, Ids.bedB, AccountFixtureIds.accountB, Ids.placeB]
  );
  await insertTask(pool, {
    id: Ids.suggestedTaskA,
    accountId: AccountFixtureIds.accountA,
    placeId: Ids.placeA,
    status: "suggested",
    sourceType: "activity",
    dueDate: "2026-05-23"
  });
  await insertTask(pool, {
    id: Ids.plannedTaskA,
    accountId: AccountFixtureIds.accountA,
    placeId: Ids.placeA,
    status: "planned",
    sourceType: "manual",
    dueDate: "2026-05-24"
  });
  await insertTask(pool, {
    id: Ids.suggestedTaskB,
    accountId: AccountFixtureIds.accountB,
    placeId: Ids.placeB,
    status: "suggested",
    sourceType: "manual",
    dueDate: "2026-05-23"
  });
}

async function insertTask(
  pool: Pool,
  input: {
    id: string;
    accountId: string;
    placeId: string;
    status: "suggested" | "planned";
    sourceType: "activity" | "manual";
    dueDate: string;
  }
): Promise<void> {
  await pool.query(
    `insert into tasks (id, account_id, place_id, type, due_date, notes, source_type, target_scope_type, status, confirmed_at)
     values ($1, $2, $3, 'spraying', $4, 'Fixture task', $5, 'selected_beds', $6, case when $6 = 'planned' then now() else null end)`,
    [input.id, input.accountId, input.placeId, input.dueDate, input.sourceType, input.status]
  );
  await pool.query("insert into task_targets (task_id, target_type, target_id) values ($1, 'bed', $2)", [
    input.id,
    input.accountId === AccountFixtureIds.accountA ? Ids.bedA : Ids.bedB
  ]);

  if (input.status === "planned") {
    await pool.query(
      `insert into task_reminders (task_id, reminder_type, scheduled_for, status)
       values ($1, 'day_before', '2026-05-23T06:00:00.000Z', 'scheduled'),
              ($1, 'same_day', '2026-05-24T06:00:00.000Z', 'scheduled')`,
      [input.id]
    );
  }
}

function validCreatePayload(patch: Record<string, unknown> = {}): Record<string, unknown> {
  return {
    placeId: Ids.placeA,
    type: "fertilizing",
    dueDate: "2026-06-01",
    status: "planned",
    targetScopeType: "selected_beds",
    targetSelection: { bedIds: [Ids.bedA] },
    notes: "Feed bed",
    ...patch
  };
}

function parseJsonResponse<T>(response: LightMyRequestResponse): T {
  return response.json<T>();
}

class StaticAccountsRepository extends KyselyAccountsRepository {
  constructor() {
    super({ db: undefined as never });
  }

  override findById() {
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
