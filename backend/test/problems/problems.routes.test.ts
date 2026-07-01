import type { FastifyInstance, LightMyRequestResponse } from "fastify";
import type { Pool } from "pg";
import { afterEach, beforeEach, describe, expect, it } from "vitest";

import { loadConfig } from "../../src/config/config.js";
import { createDbClient } from "../../src/db/db.js";
import type { DbClient } from "../../src/db/transaction.js";
import { KyselyAccountsRepository } from "../../src/modules/accounts/accounts.repository.js";
import { TestAuthAdapter } from "../../src/modules/auth/test-auth.adapter.js";
import { TestStorageAdapter } from "../../src/modules/files/test-storage.adapter.js";
import { createTestPool, hasTestDatabase, resetAndApplyBaseline } from "../db/helpers/test-database.js";
import { AccountFixtureIds, insertAuthAccountFixtures } from "../helpers/accounts.js";
import { createTestApp } from "../helpers/app.js";
import { accountAAuthHeaders, accountBAuthHeaders } from "../helpers/auth.js";

const describeDatabase = hasTestDatabase() ? describe : describe.skip;

const Ids = {
  placeA: "11111111-1111-4111-8111-111111111111",
  placeA2: "12121212-1212-4121-8121-121212121212",
  placeB: "22222222-2222-4222-8222-222222222222",
  bedA: "33333333-3333-4333-8333-333333333333",
  bedA2: "34343434-3434-4343-8343-343434343434",
  bedB: "44444444-4444-4444-8444-444444444444",
  activityA: "55555555-5555-4555-8555-555555555555",
  activityA2: "56565656-5656-4565-8565-565656565656",
  activityB: "66666666-6666-4666-8666-666666666666"
} as const;

type CreateProblemResponse = {
  data: {
    id: string;
  };
};

type ListProblemsResponse = {
  data: {
    items: Array<{
      id: string;
      type: string;
      placeId: string;
      targetType: string;
      targetId: string;
      targetLabel: string | null;
      title: string;
      category: string | null;
      severity: string | null;
      status: string;
      observedAt: string;
      photosCount: number;
    }>;
    page: number;
    pageSize: number;
    total: number;
  };
};

type ProblemDetailResponse = {
  data: {
    id: string;
    type: string;
    placeId: string;
    targetType: string;
    targetId: string;
    targetLabel: string | null;
    title: string;
    description: string;
    category: string | null;
    severity: string | null;
    status: string;
    observedAt: string;
    resolvedAt: string | null;
    photos: Array<{ id: string; url: string; mimeType: string | null; originalFilename?: string | null; fileSizeBytes?: number | null }>;
    observations: Array<{ id: string; problemId: string; summary: string; recommendation: string | null; source: string; createdAt: string; updatedAt: string }>;
    linkedActivity: { id: string; type: string; performedAt: string } | null;
  };
};

describe("Problems routes", () => {
  let app: FastifyInstance | undefined;

  afterEach(async () => {
    await app?.close();
    app = undefined;
  });

  it("protects problem routes and validates payloads before service dispatch", async () => {
    app = await createTestApp({
      auth: {
        authPort: new TestAuthAdapter(),
        accountsRepository: new StaticAccountsRepository()
      }
    });

    const unauthenticated = await app.inject({ method: "GET", url: "/api/v1/problems" });
    const invalidType = await app.inject({
      method: "POST",
      url: "/api/v1/problems",
      headers: accountAAuthHeaders(),
      payload: { ...validCreatePayload(), type: "incident" }
    });
    const missingTitle = await app.inject({
      method: "POST",
      url: "/api/v1/problems",
      headers: accountAAuthHeaders(),
      payload: { ...validCreatePayload(), title: "" }
    });
    const photoField = await app.inject({
      method: "POST",
      url: "/api/v1/problems",
      headers: accountAAuthHeaders(),
      payload: { ...validCreatePayload(), photos: [] }
    });
    const accountIdField = await app.inject({
      method: "POST",
      url: "/api/v1/problems",
      headers: accountAAuthHeaders(),
      payload: { ...validCreatePayload(), accountId: AccountFixtureIds.accountB }
    });
    const invalidQuery = await app.inject({
      method: "GET",
      url: "/api/v1/problems?pageSize=101",
      headers: accountAAuthHeaders()
    });

    expect(unauthenticated.statusCode).toBe(401);
    expect(invalidType.statusCode).toBe(400);
    expect(missingTitle.statusCode).toBe(400);
    expect(photoField.statusCode).toBe(400);
    expect(accountIdField.statusCode).toBe(400);
    expect(invalidQuery.statusCode).toBe(400);
  });
});

describeDatabase("Problems routes with database", () => {
  let pool: Pool;
  let dbClient: DbClient;
  let app: FastifyInstance | undefined;
  let storage: TestStorageAdapter;

  beforeEach(async () => {
    pool = createTestPool();
    await resetAndApplyBaseline(pool);
    await insertAuthAccountFixtures(pool);
    await insertProblemsFixture(pool);
    dbClient = createDbClient(
      loadConfig({
        NODE_ENV: "test",
        DATABASE_URL: process.env.TEST_DATABASE_URL ?? process.env.DATABASE_URL
      })
    );
    storage = new TestStorageAdapter();
    app = await createTestApp({
      db: dbClient,
      storage,
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

  it("creates problem and observation metadata without photo rows", async () => {
    const problem = await app!.inject({
      method: "POST",
      url: "/api/v1/problems",
      headers: accountAAuthHeaders(),
      payload: validCreatePayload()
    });
    const observation = await app!.inject({
      method: "POST",
      url: "/api/v1/problems",
      headers: accountAAuthHeaders(),
      payload: {
        ...validCreatePayload(),
        type: "observation",
        title: "New growth",
        description: "Fresh shoots look healthy",
        category: null,
        status: "monitoring",
        linkedActivityId: null
      }
    });

    expect(problem.statusCode).toBe(200);
    expect(observation.statusCode).toBe(200);
    const problemBody = parseJsonResponse<CreateProblemResponse>(problem);
    const observationBody = parseJsonResponse<CreateProblemResponse>(observation);
    expect(problemBody.data.id).toEqual(expect.any(String));
    expect(observationBody.data.id).toEqual(expect.any(String));

    const photos = await pool.query<{ count: string }>("select count(*) from problem_photos");
    expect(photos.rows[0]?.count).toBe("0");
  });

  it("lists, filters, gets detail, and patches canonical response fields", async () => {
    const createdProblem = parseJsonResponse<CreateProblemResponse>(
      await app!.inject({
        method: "POST",
        url: "/api/v1/problems",
        headers: accountAAuthHeaders(),
        payload: validCreatePayload()
      })
    ).data.id;
    await app!.inject({
      method: "POST",
      url: "/api/v1/problems",
      headers: accountAAuthHeaders(),
      payload: {
        ...validCreatePayload(),
        type: "observation",
        title: "Beneficial insects",
        description: "Ladybugs observed",
        category: "other",
        status: "monitoring",
        observedAt: "2026-05-14T07:00:00.000Z",
        linkedActivityId: null
      }
    });
    await app!.inject({
      method: "POST",
      url: "/api/v1/problems",
      headers: accountBAuthHeaders(),
      payload: validCreatePayload({ placeId: Ids.placeB, targetId: Ids.bedB, linkedActivityId: Ids.activityB })
    });

    const list = await app!.inject({
      method: "GET",
      url: "/api/v1/problems?placeId=11111111-1111-4111-8111-111111111111&type=problem&status=open&category=fungus&from=2026-05-01T00:00:00.000Z&to=2026-05-31T23:59:59.000Z&page=1&pageSize=10",
      headers: accountAAuthHeaders()
    });
    expect(list.statusCode).toBe(200);
    const listBody = parseJsonResponse<ListProblemsResponse>(list);
    expect(listBody.data).toMatchObject({ page: 1, pageSize: 10, total: 1 });
    expect(listBody.data.items).toEqual([
      expect.objectContaining({
        id: createdProblem,
        type: "problem",
        placeId: Ids.placeA,
        targetType: "bed",
        targetId: Ids.bedA,
        targetLabel: "Bed A",
        category: "fungus",
        severity: "medium",
        status: "open",
        photosCount: 0
      })
    ]);

    const detail = await app!.inject({
      method: "GET",
      url: `/api/v1/problems/${createdProblem}`,
      headers: accountAAuthHeaders()
    });
    expect(detail.statusCode).toBe(200);
    expect(parseJsonResponse<ProblemDetailResponse>(detail).data).toMatchObject({
      id: createdProblem,
      title: "Leaf spots on tomatoes",
      description: "Dark spots on lower leaves",
      targetLabel: "Bed A",
      photos: [],
      linkedActivity: { id: Ids.activityA, type: "treatment" }
    });

    const patched = await app!.inject({
      method: "PATCH",
      url: `/api/v1/problems/${createdProblem}`,
      headers: accountAAuthHeaders(),
      payload: {
        status: "resolved",
        severity: "low",
        description: "Resolved after treatment"
      }
    });
    expect(patched.statusCode).toBe(200);
    expect(parseJsonResponse<CreateProblemResponse>(patched).data.id).toBe(createdProblem);

    const patchedDetail = await app!.inject({
      method: "GET",
      url: `/api/v1/problems/${createdProblem}`,
      headers: accountAAuthHeaders()
    });
    expect(parseJsonResponse<ProblemDetailResponse>(patchedDetail).data).toMatchObject({
      status: "resolved",
      severity: "low",
      description: "Resolved after treatment"
    });
  });

  it("rejects target, place, and linked activity scope violations", async () => {
    const targetOtherPlace = await app!.inject({
      method: "POST",
      url: "/api/v1/problems",
      headers: accountAAuthHeaders(),
      payload: validCreatePayload({ targetId: Ids.bedA2 })
    });
    const targetOtherAccount = await app!.inject({
      method: "POST",
      url: "/api/v1/problems",
      headers: accountAAuthHeaders(),
      payload: validCreatePayload({ targetId: Ids.bedB })
    });
    const missingPlace = await app!.inject({
      method: "POST",
      url: "/api/v1/problems",
      headers: accountAAuthHeaders(),
      payload: validCreatePayload({ placeId: Ids.placeB })
    });
    const linkedOtherAccount = await app!.inject({
      method: "POST",
      url: "/api/v1/problems",
      headers: accountAAuthHeaders(),
      payload: validCreatePayload({ linkedActivityId: Ids.activityB })
    });
    const linkedOtherPlace = await app!.inject({
      method: "POST",
      url: "/api/v1/problems",
      headers: accountAAuthHeaders(),
      payload: validCreatePayload({ linkedActivityId: Ids.activityA2 })
    });

    expect(targetOtherPlace.statusCode).toBe(422);
    expect(targetOtherPlace.json()).toMatchObject({ error: { code: "BUSINESS_RULE_VIOLATION" } });
    expect(targetOtherAccount.statusCode).toBe(404);
    expect(missingPlace.statusCode).toBe(404);
    expect(linkedOtherAccount.statusCode).toBe(404);
    expect(linkedOtherPlace.statusCode).toBe(422);
  });

  it("keeps account B problems inaccessible to account A and does not expose photo upload", async () => {
    const createdA = parseJsonResponse<CreateProblemResponse>(
      await app!.inject({ method: "POST", url: "/api/v1/problems", headers: accountAAuthHeaders(), payload: validCreatePayload() })
    ).data.id;
    await app!.inject({
      method: "POST",
      url: "/api/v1/problems",
      headers: accountBAuthHeaders(),
      payload: validCreatePayload({ placeId: Ids.placeB, targetId: Ids.bedB, linkedActivityId: Ids.activityB })
    });

    const accountAList = await app!.inject({ method: "GET", url: "/api/v1/problems", headers: accountAAuthHeaders() });
    expect(parseJsonResponse<ListProblemsResponse>(accountAList).data.items.map((item) => item.id)).toEqual([createdA]);

    const getFromB = await app!.inject({ method: "GET", url: `/api/v1/problems/${createdA}`, headers: accountBAuthHeaders() });
    const patchFromB = await app!.inject({
      method: "PATCH",
      url: `/api/v1/problems/${createdA}`,
      headers: accountBAuthHeaders(),
      payload: { status: "resolved" }
    });
    const photoRoute = await app!.inject({
      method: "POST",
      url: `/api/v1/problems/${createdA}/photos`,
      headers: accountAAuthHeaders(),
      payload: {}
    });

    expect(getFromB.statusCode).toBe(404);
    expect(patchFromB.statusCode).toBe(404);
    expect(photoRoute.statusCode).toBe(400);
  });

  it("uploads valid problem photos, persists metadata only, and maps controlled detail URLs", async () => {
    const createdProblem = parseJsonResponse<CreateProblemResponse>(
      await app!.inject({ method: "POST", url: "/api/v1/problems", headers: accountAAuthHeaders(), payload: validCreatePayload() })
    ).data.id;
    const multipart = multipartPayload({ filename: "leaf spot.jpg", contentType: "image/jpeg; charset=binary", body: Buffer.from("jpeg") });

    const upload = await app!.inject({
      method: "POST",
      url: `/api/v1/problems/${createdProblem}/photos`,
      headers: { ...accountAAuthHeaders(), ...multipart.headers },
      payload: multipart.body
    });

    expect(upload.statusCode).toBe(200);
    const uploadBody = parseJsonResponse<{ data: { id: string; storageKey: string } }>(upload);
    expect(typeof uploadBody.data.id).toBe("string");
    expect(uploadBody.data.storageKey).toContain(`problems/${AccountFixtureIds.accountA}/${createdProblem}/`);
    expect(storage.objects.has(uploadBody.data.storageKey)).toBe(true);

    const rows = await pool.query<{ storage_key: string; original_filename: string; mime_type: string; file_size_bytes: string }>(
      "select storage_key, original_filename, mime_type, file_size_bytes from problem_photos where problem_id = $1",
      [createdProblem]
    );
    expect(rows.rows).toEqual([
      {
        storage_key: uploadBody.data.storageKey,
        original_filename: "leaf spot.jpg",
        mime_type: "image/jpeg",
        file_size_bytes: "4"
      }
    ]);

    const detail = await app!.inject({ method: "GET", url: `/api/v1/problems/${createdProblem}`, headers: accountAAuthHeaders() });
    expect(detail.statusCode).toBe(200);
    const detailPhotos = parseJsonResponse<ProblemDetailResponse>(detail).data.photos;
    expect(detailPhotos).toHaveLength(1);
    expect(detailPhotos[0]?.id).toBe(uploadBody.data.id);
    expect(detailPhotos[0]?.url).toContain("https://storage.test/signed/");
    expect(detailPhotos[0]?.mimeType).toBe("image/jpeg");
    expect(detailPhotos[0]?.originalFilename).toBe("leaf spot.jpg");
    expect(detailPhotos[0]?.fileSizeBytes).toBe(4);
  });

  it("rejects observation, cross-account, invalid MIME, and oversized photo uploads before unsafe side effects", async () => {
    const problem = parseJsonResponse<CreateProblemResponse>(
      await app!.inject({ method: "POST", url: "/api/v1/problems", headers: accountAAuthHeaders(), payload: validCreatePayload() })
    ).data.id;
    const observation = parseJsonResponse<CreateProblemResponse>(
      await app!.inject({
        method: "POST",
        url: "/api/v1/problems",
        headers: accountAAuthHeaders(),
        payload: { ...validCreatePayload(), type: "observation", title: "Healthy growth", category: null, linkedActivityId: null }
      })
    ).data.id;
    const accountBProblem = parseJsonResponse<CreateProblemResponse>(
      await app!.inject({
        method: "POST",
        url: "/api/v1/problems",
        headers: accountBAuthHeaders(),
        payload: validCreatePayload({ placeId: Ids.placeB, targetId: Ids.bedB, linkedActivityId: Ids.activityB })
      })
    ).data.id;

    const textFile = multipartPayload({ filename: "notes.txt", contentType: "text/plain", body: Buffer.from("text") });
    const oversized = multipartPayload({ filename: "large.jpg", contentType: "image/jpeg", body: Buffer.alloc(6 * 1024 * 1024, 1) });
    const image = multipartPayload({ filename: "leaf.jpg", contentType: "image/jpeg", body: Buffer.from("jpeg") });

    const invalidMime = await app!.inject({
      method: "POST",
      url: `/api/v1/problems/${problem}/photos`,
      headers: { ...accountAAuthHeaders(), ...textFile.headers },
      payload: textFile.body
    });
    const tooLarge = await app!.inject({
      method: "POST",
      url: `/api/v1/problems/${problem}/photos`,
      headers: { ...accountAAuthHeaders(), ...oversized.headers },
      payload: oversized.body
    });
    const observationUpload = await app!.inject({
      method: "POST",
      url: `/api/v1/problems/${observation}/photos`,
      headers: { ...accountAAuthHeaders(), ...image.headers },
      payload: image.body
    });
    const crossAccount = await app!.inject({
      method: "POST",
      url: `/api/v1/problems/${accountBProblem}/photos`,
      headers: { ...accountAAuthHeaders(), ...image.headers },
      payload: image.body
    });

    expect(invalidMime.statusCode).toBe(400);
    expect(parseJsonResponse<{ error: { code: string } }>(invalidMime)).toMatchObject({ error: { code: "VALIDATION_ERROR" } });
    expect(tooLarge.statusCode).toBe(400);
    expect(observationUpload.statusCode).toBe(422);
    expect(parseJsonResponse<{ error: { code: string } }>(observationUpload)).toMatchObject({ error: { code: "BUSINESS_RULE_VIOLATION" } });
    expect(crossAccount.statusCode).toBe(404);
    expect(storage.objects.size).toBe(0);
  });

  it("GET /:problemId returns empty observations array on a freshly created problem", async () => {
    const createRes = await app!.inject({
      method: "POST",
      url: "/api/v1/problems",
      headers: accountAAuthHeaders(),
      payload: validCreatePayload()
    });
    const { data: { id: problemId } } = parseJsonResponse<CreateProblemResponse>(createRes);

    const res = await app!.inject({
      method: "GET",
      url: `/api/v1/problems/${problemId}`,
      headers: accountAAuthHeaders()
    });
    expect(res.statusCode).toBe(200);
    const body = parseJsonResponse<ProblemDetailResponse>(res);
    expect(body.data.observations).toEqual([]);
    expect(body.data.resolvedAt).toBeNull();
  });

  it("maps storage provider upload failures without creating metadata", async () => {
    const createdProblem = parseJsonResponse<CreateProblemResponse>(
      await app!.inject({ method: "POST", url: "/api/v1/problems", headers: accountAAuthHeaders(), payload: validCreatePayload() })
    ).data.id;
    await app!.close(); // destroys dbClient via onClose hook
    storage = new TestStorageAdapter({ failUploads: true });
    const freshDbClient = createDbClient(loadConfig({ NODE_ENV: "test", DATABASE_URL: process.env.TEST_DATABASE_URL ?? process.env.DATABASE_URL }));
    app = await createTestApp({
      db: freshDbClient,
      storage,
      auth: {
        authPort: new TestAuthAdapter(),
        accountsRepository: new KyselyAccountsRepository(freshDbClient)
      }
    });
    const image = multipartPayload({ filename: "leaf.jpg", contentType: "image/jpeg", body: Buffer.from("jpeg") });

    const response = await app.inject({
      method: "POST",
      url: `/api/v1/problems/${createdProblem}/photos`,
      headers: { ...accountAAuthHeaders(), ...image.headers },
      payload: image.body
    });

    expect(response.statusCode).toBe(502);
    expect(parseJsonResponse<{ error: { code: string } }>(response)).toMatchObject({ error: { code: "EXTERNAL_SERVICE_ERROR" } });
    const photos = await pool.query<{ count: string }>("select count(*) from problem_photos where problem_id = $1", [createdProblem]);
    expect(photos.rows[0]?.count).toBe("0");
  });
});

describeDatabase("Observation CRUD and resolve/reopen", () => {
  let pool: Pool;
  let dbClient: DbClient;
  let app: FastifyInstance | undefined;

  beforeEach(async () => {
    pool = createTestPool();
    await resetAndApplyBaseline(pool);
    await insertAuthAccountFixtures(pool);
    await insertProblemsFixture(pool);
    dbClient = createDbClient(
      loadConfig({
        NODE_ENV: "test",
        DATABASE_URL: process.env.TEST_DATABASE_URL ?? process.env.DATABASE_URL
      })
    );
    app = await createTestApp({
      db: dbClient,
      storage: new TestStorageAdapter(),
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

  async function createProblem(): Promise<string> {
    const res = await app!.inject({
      method: "POST",
      url: "/api/v1/problems",
      headers: accountAAuthHeaders(),
      payload: validCreatePayload()
    });
    return (parseJsonResponse<CreateProblemResponse>(res)).data.id;
  }

  it("POST /observations → 201, appears in GET detail", async () => {
    const problemId = await createProblem();

    const postRes = await app!.inject({
      method: "POST",
      url: `/api/v1/problems/${problemId}/observations`,
      headers: accountAAuthHeaders(),
      payload: { summary: "Fungal spots", recommendation: "Treat with copper" }
    });
    expect(postRes.statusCode).toBe(201);
    const obs = (parseJsonResponse<{ data: { id: string; summary: string; recommendation: string | null } }>(postRes)).data;
    expect(obs.summary).toBe("Fungal spots");
    expect(obs.recommendation).toBe("Treat with copper");

    const detailRes = await app!.inject({ method: "GET", url: `/api/v1/problems/${problemId}`, headers: accountAAuthHeaders() });
    const detail = parseJsonResponse<{ data: { observations: unknown[] } }>(detailRes);
    expect(detail.data.observations).toHaveLength(1);
  });

  it("PATCH /observations/:obsId → 200 updated", async () => {
    const problemId = await createProblem();

    const createRes = await app!.inject({
      method: "POST",
      url: `/api/v1/problems/${problemId}/observations`,
      headers: accountAAuthHeaders(),
      payload: { summary: "Initial" }
    });
    const obsId = (parseJsonResponse<{ data: { id: string } }>(createRes)).data.id;

    const patchRes = await app!.inject({
      method: "PATCH",
      url: `/api/v1/problems/${problemId}/observations/${obsId}`,
      headers: accountAAuthHeaders(),
      payload: { summary: "Updated" }
    });
    expect(patchRes.statusCode).toBe(200);
    expect((parseJsonResponse<{ data: { summary: string } }>(patchRes)).data.summary).toBe("Updated");
  });

  it("PATCH /observations/:obsId with empty body → 400", async () => {
    const problemId = await createProblem();

    const createRes = await app!.inject({
      method: "POST",
      url: `/api/v1/problems/${problemId}/observations`,
      headers: accountAAuthHeaders(),
      payload: { summary: "Initial" }
    });
    const obsId = (parseJsonResponse<{ data: { id: string } }>(createRes)).data.id;

    const patchRes = await app!.inject({
      method: "PATCH",
      url: `/api/v1/problems/${problemId}/observations/${obsId}`,
      headers: accountAAuthHeaders(),
      payload: {}
    });
    expect(patchRes.statusCode).toBe(400);
  });

  it("POST /observations/:obsId/archive → 200, no longer appears in GET detail", async () => {
    const problemId = await createProblem();

    const createRes = await app!.inject({
      method: "POST",
      url: `/api/v1/problems/${problemId}/observations`,
      headers: accountAAuthHeaders(),
      payload: { summary: "To archive" }
    });
    const obsId = (parseJsonResponse<{ data: { id: string } }>(createRes)).data.id;

    const archiveRes = await app!.inject({
      method: "POST",
      url: `/api/v1/problems/${problemId}/observations/${obsId}/archive`,
      headers: accountAAuthHeaders()
    });
    expect(archiveRes.statusCode).toBe(200);

    const detail = await app!.inject({
      method: "GET",
      url: `/api/v1/problems/${problemId}`,
      headers: accountAAuthHeaders()
    });
    const data = (parseJsonResponse<{ data: { observations: unknown[] } }>(detail)).data;
    expect(data.observations).toEqual([]);
  });

  it("POST /observations/:obsId/archive twice → 404 on the second call", async () => {
    const problemId = await createProblem();

    const createRes = await app!.inject({
      method: "POST",
      url: `/api/v1/problems/${problemId}/observations`,
      headers: accountAAuthHeaders(),
      payload: { summary: "To archive" }
    });
    const obsId = (parseJsonResponse<{ data: { id: string } }>(createRes)).data.id;

    await app!.inject({
      method: "POST",
      url: `/api/v1/problems/${problemId}/observations/${obsId}/archive`,
      headers: accountAAuthHeaders()
    });
    const secondRes = await app!.inject({
      method: "POST",
      url: `/api/v1/problems/${problemId}/observations/${obsId}/archive`,
      headers: accountAAuthHeaders()
    });
    expect(secondRes.statusCode).toBe(404);
  });

  it("POST /resolve → 200, status=resolved, resolvedAt set", async () => {
    const problemId = await createProblem();

    const res = await app!.inject({ method: "POST", url: `/api/v1/problems/${problemId}/resolve`, headers: accountAAuthHeaders() });
    expect(res.statusCode).toBe(200);

    const detail = await app!.inject({ method: "GET", url: `/api/v1/problems/${problemId}`, headers: accountAAuthHeaders() });
    const data = (parseJsonResponse<{ data: { status: string; resolvedAt: string | null } }>(detail)).data;
    expect(data.status).toBe("resolved");
    expect(data.resolvedAt).not.toBeNull();
  });

  it("POST /resolve twice → 409", async () => {
    const problemId = await createProblem();

    await app!.inject({ method: "POST", url: `/api/v1/problems/${problemId}/resolve`, headers: accountAAuthHeaders() });
    const res = await app!.inject({ method: "POST", url: `/api/v1/problems/${problemId}/resolve`, headers: accountAAuthHeaders() });
    expect(res.statusCode).toBe(409);
  });

  it("POST /reopen after resolve → 200, status=open, resolvedAt=null", async () => {
    const problemId = await createProblem();

    await app!.inject({ method: "POST", url: `/api/v1/problems/${problemId}/resolve`, headers: accountAAuthHeaders() });
    const res = await app!.inject({ method: "POST", url: `/api/v1/problems/${problemId}/reopen`, headers: accountAAuthHeaders() });
    expect(res.statusCode).toBe(200);

    const detail = await app!.inject({ method: "GET", url: `/api/v1/problems/${problemId}`, headers: accountAAuthHeaders() });
    const data = (parseJsonResponse<{ data: { status: string; resolvedAt: string | null } }>(detail)).data;
    expect(data.status).toBe("open");
    expect(data.resolvedAt).toBeNull();
  });

  it("POST /reopen on open problem → 409", async () => {
    const problemId = await createProblem();

    const res = await app!.inject({ method: "POST", url: `/api/v1/problems/${problemId}/reopen`, headers: accountAAuthHeaders() });
    expect(res.statusCode).toBe(409);
  });

  it("scope: account B cannot add observation to account A problem → 404", async () => {
    const problemId = await createProblem();

    const res = await app!.inject({
      method: "POST",
      url: `/api/v1/problems/${problemId}/observations`,
      headers: accountBAuthHeaders(),
      payload: { summary: "Attacker" }
    });
    expect(res.statusCode).toBe(404);
  });
});

function validCreatePayload(overrides: Record<string, unknown> = {}): Record<string, unknown> {
  return {
    type: "problem",
    placeId: Ids.placeA,
    targetType: "bed",
    targetId: Ids.bedA,
    title: "Leaf spots on tomatoes",
    description: "Dark spots on lower leaves",
    category: "fungus",
    severity: "medium",
    status: "open",
    observedAt: "2026-05-13T07:00:00.000Z",
    linkedActivityId: Ids.activityA,
    ...overrides
  };
}

async function insertProblemsFixture(pool: Pool): Promise<void> {
  await pool.query(
    `insert into places (id, account_id, name)
     values
       ($1, $2, 'Home Garden'),
       ($3, $2, 'Orchard'),
       ($4, $5, 'Other Garden')`,
    [Ids.placeA, AccountFixtureIds.accountA, Ids.placeA2, Ids.placeB, AccountFixtureIds.accountB]
  );
  await pool.query(
    `insert into beds (id, account_id, place_id, name, status)
     values
       ($1, $2, $3, 'Bed A', 'active'),
       ($4, $2, $5, 'Bed A2', 'active'),
       ($6, $7, $8, 'Bed B', 'active')`,
    [Ids.bedA, AccountFixtureIds.accountA, Ids.placeA, Ids.bedA2, Ids.placeA2, Ids.bedB, AccountFixtureIds.accountB, Ids.placeB]
  );
  await pool.query(
    `insert into activities (id, account_id, place_id, type, performed_at, target_scope_type, notes)
     values
       ($1, $2, $3, 'treatment', '2026-05-12T07:00:00.000Z', 'single_bed', null),
       ($4, $2, $5, 'observation', '2026-05-12T08:00:00.000Z', 'whole_place', null),
       ($6, $7, $8, 'treatment', '2026-05-12T09:00:00.000Z', 'single_bed', null)`,
    [Ids.activityA, AccountFixtureIds.accountA, Ids.placeA, Ids.activityA2, Ids.placeA2, Ids.activityB, AccountFixtureIds.accountB, Ids.placeB]
  );
}

function parseJsonResponse<T>(response: LightMyRequestResponse): T {
  return response.json<T>();
}

function multipartPayload(input: { filename: string; contentType: string; body: Buffer }): { headers: Record<string, string>; body: Buffer } {
  const boundary = `----garden-${Math.random().toString(16).slice(2)}`;
  const prefix = Buffer.from(
    `--${boundary}\r\nContent-Disposition: form-data; name="file"; filename="${input.filename}"\r\nContent-Type: ${input.contentType}\r\n\r\n`,
    "latin1"
  );
  const suffix = Buffer.from(`\r\n--${boundary}--\r\n`, "latin1");

  return {
    headers: { "content-type": `multipart/form-data; boundary=${boundary}` },
    body: Buffer.concat([prefix, input.body, suffix])
  };
}

class StaticAccountsRepository {
  findById(accountId: string) {
    return Promise.resolve({
      id: accountId,
      email: `${accountId}@example.test`,
      displayName: accountId,
      createdAt: new Date(),
      updatedAt: new Date(),
      archivedAt: null
    });
  }
}
