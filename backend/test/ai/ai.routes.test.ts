import type { FastifyInstance } from "fastify";
import type { Pool } from "pg";
import { afterEach, beforeEach, describe, expect, it } from "vitest";

import { TestAiAdapter } from "../../src/integrations/ai/test-ai.adapter.js";
import { loadConfig } from "../../src/config/config.js";
import { createDbClient } from "../../src/db/db.js";
import type { DbClient } from "../../src/db/transaction.js";
import { KyselyAccountsRepository } from "../../src/modules/accounts/accounts.repository.js";
import { TestAuthAdapter } from "../../src/modules/auth/test-auth.adapter.js";
import { createTestPool, hasTestDatabase, resetAndApplyBaseline } from "../db/helpers/test-database.js";
import { insertAuthAccountFixtures } from "../helpers/accounts.js";
import { createTestApp } from "../helpers/app.js";
import { accountAAuthHeaders } from "../helpers/auth.js";

const describeDatabase = hasTestDatabase() ? describe : describe.skip;

const Ids = {
  placeA: "11111111-1111-4111-8111-111111111111",
  placeB: "22222222-2222-4222-8222-222222222222",
  bedA: "33333333-3333-4333-8333-333333333333",
  bedB: "44444444-4444-4444-8444-444444444444",
  plantA: "55555555-5555-4555-8555-555555555555",
  plantB: "66666666-6666-4666-8666-666666666666",
  problemA: "77777777-7777-4777-8777-777777777777",
  problemB: "88888888-8888-4888-8888-888888888888"
} as const;

type GenerationResponse = {
  data: {
    aiSession: { id: string; kind: string; inputMode: string; status: string };
    suggestions: Array<{ id: string; suggestionType: string; payload: unknown }>;
    warnings?: string[];
  };
};

type AcceptResponse = {
  data: {
    acceptedSuggestionId: string;
    createdEntities: Array<{ entityType: string; entityId: string }>;
    updatedEntities: Array<{ entityType: string; entityId: string }>;
  };
};

type RejectResponse = {
  data: { rejected: boolean };
};

describeDatabase("AI routes with database", () => {
  let pool: Pool;
  let dbClient: DbClient;
  let app: FastifyInstance | undefined;
  let ai: TestAiAdapter;

  beforeEach(async () => {
    pool = createTestPool();
    await resetAndApplyBaseline(pool);
    await insertAuthAccountFixtures(pool);
    await insertAiFixtures(pool);
    dbClient = createDbClient(
      loadConfig({
        NODE_ENV: "test",
        DATABASE_URL: process.env.TEST_DATABASE_URL ?? process.env.DATABASE_URL
      })
    );
    ai = new TestAiAdapter();
    app = await createTestApp({
      db: dbClient,
      ai,
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

  describe("authentication", () => {
    it("rejects unauthenticated requests to all AI routes", async () => {
      const routes = [
        { method: "POST" as const, url: "/api/v1/ai/product-ingestion", body: { productName: "Test" } },
        { method: "POST" as const, url: "/api/v1/ai/bed-planning", body: { bedId: Ids.bedA, year: 2026, candidatePlantIds: [Ids.plantA] } },
        { method: "POST" as const, url: "/api/v1/ai/problem-assist", body: { text: "test" } },
        {
          method: "POST" as const,
          url: "/api/v1/ai/suggestions/11111111-1111-4111-8111-111111111111/accept",
          body: {}
        },
        {
          method: "POST" as const,
          url: "/api/v1/ai/suggestions/11111111-1111-4111-8111-111111111111/reject",
          body: {}
        }
      ];

      for (const route of routes) {
        const response = await app!.inject({
          method: route.method,
          url: route.url,
          payload: route.body
        });

        expect(response.statusCode, `${route.url} should require auth`).toBe(401);
      }
    });
  });

  describe("product ingestion", () => {
    it("creates session and suggestions only, no products created before acceptance", async () => {
      const response = await app!.inject({
        method: "POST",
        url: "/api/v1/ai/product-ingestion",
        headers: accountAAuthHeaders(),
        payload: { productName: "Test Fungicide" }
      });

      expect(response.statusCode).toBe(200);

      const body = parseJsonResponse<GenerationResponse>(response);

      expect(body.data.aiSession.kind).toBe("product_ingestion");
      expect(body.data.aiSession.status).toBe("completed");
      expect(body.data.suggestions.length).toBeGreaterThan(0);
      expect(body.data.warnings).toBeDefined();

      const productCountBefore = await pool.query<{ count: string }>("select count(*) from products where account_id = $1", ["aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa"]);
      expect(Number(productCountBefore.rows[0]?.count)).toBe(0);
    });

    it("includes warnings from provider when present", async () => {
      const response = await app!.inject({
        method: "POST",
        url: "/api/v1/ai/product-ingestion",
        headers: accountAAuthHeaders(),
        payload: { labelText: "Active substance: Copper" }
      });

      expect(response.statusCode).toBe(200);

      const body = parseJsonResponse<GenerationResponse>(response);

      expect(body.data.warnings).toBeDefined();
      expect(body.data.warnings!.length).toBeGreaterThan(0);
    });

    it("maps provider failure to EXTERNAL_SERVICE_ERROR", async () => {
      const failingApp = await createTestApp({
        db: dbClient,
        ai: new TestAiAdapter({ failRequests: true }),
        auth: {
          authPort: new TestAuthAdapter(),
          accountsRepository: new KyselyAccountsRepository(dbClient)
        }
      });

      const response = await failingApp.inject({
        method: "POST",
        url: "/api/v1/ai/product-ingestion",
        headers: accountAAuthHeaders(),
        payload: { productName: "Test" }
      });

      await failingApp.close();

      expect(response.statusCode).toBe(502);

      const body = JSON.parse(response.body) as { error: { code: string } };

      expect(body.error.code).toBe("EXTERNAL_SERVICE_ERROR");
    });

    it("validates that at least one of productName or labelText is provided", async () => {
      const response = await app!.inject({
        method: "POST",
        url: "/api/v1/ai/product-ingestion",
        headers: accountAAuthHeaders(),
        payload: {}
      });

      expect(response.statusCode).toBe(400);
    });
  });

  describe("bed planning", () => {
    it("creates guidance suggestion only, no plantings created", async () => {
      const response = await app!.inject({
        method: "POST",
        url: "/api/v1/ai/bed-planning",
        headers: accountAAuthHeaders(),
        payload: {
          bedId: Ids.bedA,
          year: 2026,
          candidatePlantIds: [Ids.plantA]
        }
      });

      expect(response.statusCode).toBe(200);

      const body = parseJsonResponse<GenerationResponse>(response);

      expect(body.data.aiSession.kind).toBe("bed_planning");
      expect(body.data.suggestions.some((s) => s.suggestionType === "bed_plan")).toBe(true);

      const plantingCount = await pool.query<{ count: string }>("select count(*) from yearly_bed_plantings");

      expect(Number(plantingCount.rows[0]?.count)).toBe(0);
    });

    it("rejects bed from another account", async () => {
      const response = await app!.inject({
        method: "POST",
        url: "/api/v1/ai/bed-planning",
        headers: accountAAuthHeaders(),
        payload: {
          bedId: Ids.bedB,
          year: 2026,
          candidatePlantIds: [Ids.plantA]
        }
      });

      expect(response.statusCode).toBe(404);
    });

    it("rejects plant from another account", async () => {
      const response = await app!.inject({
        method: "POST",
        url: "/api/v1/ai/bed-planning",
        headers: accountAAuthHeaders(),
        payload: {
          bedId: Ids.bedA,
          year: 2026,
          candidatePlantIds: [Ids.plantB]
        }
      });

      expect(response.statusCode).toBe(404);
    });
  });

  describe("problem assist", () => {
    it("creates suggestion only, no problem updates", async () => {
      const response = await app!.inject({
        method: "POST",
        url: "/api/v1/ai/problem-assist",
        headers: accountAAuthHeaders(),
        payload: { problemId: Ids.problemA }
      });

      expect(response.statusCode).toBe(200);

      const body = parseJsonResponse<GenerationResponse>(response);

      expect(body.data.aiSession.kind).toBe("problem_assist");
      expect(body.data.suggestions.length).toBeGreaterThan(0);
    });

    it("accepts ad hoc text input", async () => {
      const response = await app!.inject({
        method: "POST",
        url: "/api/v1/ai/problem-assist",
        headers: accountAAuthHeaders(),
        payload: { text: "Yellow spots on leaves" }
      });

      expect(response.statusCode).toBe(200);
    });

    it("rejects problem from another account", async () => {
      const response = await app!.inject({
        method: "POST",
        url: "/api/v1/ai/problem-assist",
        headers: accountAAuthHeaders(),
        payload: { problemId: Ids.problemB }
      });

      expect(response.statusCode).toBe(404);
    });
  });

  describe("accept suggestion", () => {
    it("accepts product suggestion and creates product", async () => {
      const { suggestionId } = await createProductSuggestion(app!);

      const response = await app!.inject({
        method: "POST",
        url: `/api/v1/ai/suggestions/${suggestionId}/accept`,
        headers: accountAAuthHeaders(),
        payload: {}
      });

      expect(response.statusCode).toBe(200);

      const body = parseJsonResponse<AcceptResponse>(response);

      expect(body.data.acceptedSuggestionId).toBe(suggestionId);
      expect(body.data.createdEntities).toHaveLength(1);
      const createdEntity = body.data.createdEntities[0];
      expect(createdEntity?.entityType).toBe("product");
      expect(body.data.updatedEntities).toHaveLength(0);

      const productCount = await pool.query<{ count: string }>(
        "select count(*) from products where id = $1",
        [createdEntity?.entityId]
      );

      expect(Number(productCount.rows[0]?.count)).toBe(1);
    });

    it("returns CONFLICT when suggestion already accepted", async () => {
      const { suggestionId } = await createProductSuggestion(app!);

      await app!.inject({
        method: "POST",
        url: `/api/v1/ai/suggestions/${suggestionId}/accept`,
        headers: accountAAuthHeaders(),
        payload: {}
      });

      const secondResponse = await app!.inject({
        method: "POST",
        url: `/api/v1/ai/suggestions/${suggestionId}/accept`,
        headers: accountAAuthHeaders(),
        payload: {}
      });

      expect(secondResponse.statusCode).toBe(409);
    });

    it("account A cannot accept account B suggestion", async () => {
      const { suggestionId } = await createProductSuggestionForAccountB(pool);

      const response = await app!.inject({
        method: "POST",
        url: `/api/v1/ai/suggestions/${suggestionId}/accept`,
        headers: accountAAuthHeaders(),
        payload: {}
      });

      expect(response.statusCode).toBe(404);
    });

    it("accepts edited payload and validates it through backend rules", async () => {
      const { suggestionId } = await createProductSuggestion(app!);

      const response = await app!.inject({
        method: "POST",
        url: `/api/v1/ai/suggestions/${suggestionId}/accept`,
        headers: accountAAuthHeaders(),
        payload: {
          editedPayload: {
            name: "Edited Product Name",
            category: "fungicide",
            defaultUnit: "g"
          }
        }
      });

      expect(response.statusCode).toBe(200);

      const body = parseJsonResponse<AcceptResponse>(response);

      const product = await pool.query<{ name: string }>(
        "select name from products where id = $1",
        [body.data.createdEntities[0]?.entityId]
      );

      expect(product.rows[0]?.name).toBe("Edited Product Name");
    });

    it("rejects invalid edited payload and leaves suggestion unaccepted", async () => {
      const { suggestionId } = await createProductSuggestion(app!);

      const response = await app!.inject({
        method: "POST",
        url: `/api/v1/ai/suggestions/${suggestionId}/accept`,
        headers: accountAAuthHeaders(),
        payload: {
          editedPayload: {
            name: "",
            category: "not_a_valid_category",
            defaultUnit: "g"
          }
        }
      });

      expect(response.statusCode).toBe(400);

      const suggestionRow = await pool.query<{ accepted: boolean | null }>("select accepted from ai_suggestions where id = $1", [suggestionId]);

      expect(suggestionRow.rows[0]?.accepted).toBeNull();
    });

    it("guidance-only suggestions create no business records", async () => {
      const { suggestionId } = await createGuidanceSuggestion(pool, "bed_plan");

      const response = await app!.inject({
        method: "POST",
        url: `/api/v1/ai/suggestions/${suggestionId}/accept`,
        headers: accountAAuthHeaders(),
        payload: {}
      });

      expect(response.statusCode).toBe(200);

      const body = parseJsonResponse<AcceptResponse>(response);

      expect(body.data.createdEntities).toHaveLength(0);
      expect(body.data.updatedEntities).toHaveLength(0);
    });
  });

  describe("reject suggestion", () => {
    it("rejects suggestion and creates no business records", async () => {
      const { suggestionId } = await createProductSuggestion(app!);

      const response = await app!.inject({
        method: "POST",
        url: `/api/v1/ai/suggestions/${suggestionId}/reject`,
        headers: accountAAuthHeaders(),
        payload: {}
      });

      expect(response.statusCode).toBe(200);

      const body = parseJsonResponse<RejectResponse>(response);

      expect(body.data.rejected).toBe(true);

      const productCount = await pool.query<{ count: string }>("select count(*) from products where account_id = $1", ["aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa"]);

      expect(Number(productCount.rows[0]?.count)).toBe(0);

      const suggestionRow = await pool.query<{ accepted: boolean | null }>("select accepted from ai_suggestions where id = $1", [suggestionId]);

      expect(suggestionRow.rows[0]?.accepted).toBe(false);
    });

    it("account A cannot reject account B suggestion", async () => {
      const { suggestionId } = await createProductSuggestionForAccountB(pool);

      const response = await app!.inject({
        method: "POST",
        url: `/api/v1/ai/suggestions/${suggestionId}/reject`,
        headers: accountAAuthHeaders(),
        payload: {}
      });

      expect(response.statusCode).toBe(404);
    });

    it("rejected suggestion cannot be accepted", async () => {
      const { suggestionId } = await createProductSuggestion(app!);

      await app!.inject({
        method: "POST",
        url: `/api/v1/ai/suggestions/${suggestionId}/reject`,
        headers: accountAAuthHeaders(),
        payload: {}
      });

      const acceptResponse = await app!.inject({
        method: "POST",
        url: `/api/v1/ai/suggestions/${suggestionId}/accept`,
        headers: accountAAuthHeaders(),
        payload: {}
      });

      expect(acceptResponse.statusCode).toBe(409);
    });
  });

  describe("AI generation boundary - no auto-creation of business records", () => {
    it("product ingestion does not create products or rules before acceptance", async () => {
      await app!.inject({
        method: "POST",
        url: "/api/v1/ai/product-ingestion",
        headers: accountAAuthHeaders(),
        payload: { productName: "Test Fungicide" }
      });

      const products = await pool.query<{ count: string }>("select count(*) from products");
      const rules = await pool.query<{ count: string }>("select count(*) from product_usage_rules");

      expect(Number(products.rows[0]?.count)).toBe(0);
      expect(Number(rules.rows[0]?.count)).toBe(0);
    });

    it("bed planning does not create plantings, tasks, or reminders", async () => {
      await app!.inject({
        method: "POST",
        url: "/api/v1/ai/bed-planning",
        headers: accountAAuthHeaders(),
        payload: { bedId: Ids.bedA, year: 2026, candidatePlantIds: [Ids.plantA] }
      });

      const plantings = await pool.query<{ count: string }>("select count(*) from yearly_bed_plantings");
      const tasks = await pool.query<{ count: string }>("select count(*) from tasks");

      expect(Number(plantings.rows[0]?.count)).toBe(0);
      expect(Number(tasks.rows[0]?.count)).toBe(0);
    });

    it("problem assist does not create activities, tasks, or problem updates", async () => {
      const problemsBefore = await pool.query<{ updated_at: Date }>("select updated_at from problems where id = $1", [Ids.problemA]);

      await app!.inject({
        method: "POST",
        url: "/api/v1/ai/problem-assist",
        headers: accountAAuthHeaders(),
        payload: { problemId: Ids.problemA }
      });

      const activities = await pool.query<{ count: string }>("select count(*) from activities");
      const tasks = await pool.query<{ count: string }>("select count(*) from tasks");
      const problemsAfter = await pool.query<{ updated_at: Date }>("select updated_at from problems where id = $1", [Ids.problemA]);

      expect(Number(activities.rows[0]?.count)).toBe(0);
      expect(Number(tasks.rows[0]?.count)).toBe(0);
      expect(problemsAfter.rows[0]?.updated_at.getTime()).toBe(problemsBefore.rows[0]?.updated_at.getTime());
    });
  });
});

async function insertAiFixtures(pool: Pool): Promise<void> {
  const accountA = "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa";
  const accountB = "bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb";

  await pool.query(
    `insert into places (id, account_id, name) values
     ($1, $2, 'Place A'),
     ($3, $4, 'Place B')`,
    [Ids.placeA, accountA, Ids.placeB, accountB]
  );

  await pool.query(
    `insert into beds (id, account_id, place_id, name) values
     ($1, $2, $3, 'Bed A'),
     ($4, $5, $6, 'Bed B')`,
    [Ids.bedA, accountA, Ids.placeA, Ids.bedB, accountB, Ids.placeB]
  );

  await pool.query(
    `insert into plants (id, account_id, name, type) values
     ($1, $2, 'Plant A', 'vegetable'),
     ($3, $4, 'Plant B', 'vegetable')`,
    [Ids.plantA, accountA, Ids.plantB, accountB]
  );

  await pool.query(
    `insert into problems (id, account_id, place_id, kind, title, status) values
     ($1, $2, $3, 'observation', 'Spotted leaves', 'open'),
     ($4, $5, $6, 'observation', 'Problem B', 'open')`,
    [Ids.problemA, accountA, Ids.placeA, Ids.problemB, accountB, Ids.placeB]
  );
}

async function createProductSuggestion(app: FastifyInstance): Promise<{ suggestionId: string }> {
  const ingestResponse = await app.inject({
    method: "POST",
    url: "/api/v1/ai/product-ingestion",
    headers: accountAAuthHeaders(),
    payload: { productName: "Test Fungicide" }
  });

  const body = parseJsonResponse<GenerationResponse>(ingestResponse);
  const productSuggestion = body.data.suggestions.find((s) => s.suggestionType === "product");

  if (productSuggestion === undefined) {
    throw new Error("No product suggestion found in response");
  }

  return { suggestionId: productSuggestion.id };
}

async function createProductSuggestionForAccountB(pool: Pool): Promise<{ suggestionId: string }> {
  const accountB = "bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb";
  const sessionId = "eeeeeeee-eeee-4eee-aeee-eeeeeeeeeeee";
  const suggestionId = "ffffffff-ffff-4fff-afff-ffffffffffff";

  await pool.query(
    `insert into ai_sessions (id, account_id, kind, input_mode, status)
     values ($1, $2, 'product_ingestion', 'name', 'completed')`,
    [sessionId, accountB]
  );

  await pool.query(
    `insert into ai_suggestions (id, ai_session_id, suggestion_type, payload)
     values ($1, $2, 'product', $3)`,
    [suggestionId, sessionId, JSON.stringify({ name: "Account B Product", category: "fungicide", defaultUnit: "g" })]
  );

  return { suggestionId };
}

async function createGuidanceSuggestion(pool: Pool, suggestionType: string): Promise<{ suggestionId: string }> {
  const accountA = "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa";
  const sessionId = "cccccccc-cccc-4ccc-accc-cccccccccccc";
  const suggestionId = "dddddddd-dddd-4ddd-addd-dddddddddddd";

  await pool.query(
    `insert into ai_sessions (id, account_id, kind, input_mode, status)
     values ($1, $2, 'bed_planning', 'text', 'completed')`,
    [sessionId, accountA]
  );

  await pool.query(
    `insert into ai_suggestions (id, ai_session_id, suggestion_type, payload)
     values ($1, $2, $3, $4)`,
    [suggestionId, sessionId, suggestionType, JSON.stringify({ spacingSuggestions: [], coexistenceNotes: [], warnings: [], roughQuantityGuidance: [] })]
  );

  return { suggestionId };
}

function parseJsonResponse<T>(response: { body: string }): T {
  return JSON.parse(response.body) as T;
}
