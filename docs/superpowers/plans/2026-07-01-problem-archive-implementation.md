# Problem Archive + Create-Duplicate Fix Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Let a user archive a duplicate/erroneous top-level `problems` record (regardless of status) from the detail page, and stop the create-problem form from producing duplicates by redirecting to the new record on success.

**Architecture:** Follow the exact `archived_at` + `POST /:id/archive` + `includeArchived` list filter pattern already used by places/plants/beds/products in this codebase. The `problems` table gets its own `archived_at` column, orthogonal to `status`/`resolved_at`. Detail fetch never filters by `archived_at` (problems must stay readable per domain rule 13.1); list fetch does, unless `includeArchived=true`.

**Tech Stack:** Fastify + Zod + Kysely (backend), Angular standalone components + RxJS + Angular Material (frontend), Vitest (both backend and frontend test runners).

## Global Constraints

- Backend owns business logic; frontend only calls the REST API (`CLAUDE.md`).
- Account scoping is mandatory on every repository query (`WHERE account_id = ...`).
- Archiving is one-way — no unarchive/restore action anywhere in this codebase; do not add one here.
- A problem/observation can be archived regardless of `status` (open/monitoring/resolved).
- `GET /problems/:problemId` must never filter by `archived_at` — archived records stay fully readable (domain rule 13.1).
- `GET /problems` defaults to excluding archived records; `includeArchived=true` includes them.
- Follow existing code conventions exactly: this file already has two divergent-but-established patterns — reuse them as noted per task, don't invent a third style.
- DB-integration tests (`describeDatabase(...)` blocks) self-skip when `TEST_DATABASE_URL`/`DATABASE_URL` is unset. To actually run them locally, start a throwaway Postgres matching CI (`docker run --rm -d --name garden-test-pg -e POSTGRES_USER=postgres -e POSTGRES_PASSWORD=postgres -e POSTGRES_DB=garden_test -p 5432:5432 postgres:16-alpine`) and export `TEST_DATABASE_URL=postgres://postgres:postgres@localhost:5432/garden_test` before running `npm test -- --no-file-parallelism` from `backend/`.
- Frontend tests: `cd frontend && npm test -- --watch=false`.
- Backend unit tests (no DB needed): `cd backend && npm test`.

---

### Task 1: `problems` table `archived_at` column + type wiring

**Files:**
- Create: `docs/009_problems_archive.sql`
- Modify: `backend/src/db/migrations/baseline.ts`
- Modify: `backend/src/db/database.types.ts:233-247` (`ProblemsTable`)

**Interfaces:**
- Produces: `problems.archived_at` column (nullable `timestamptz`), available to later tasks as `ProblemsTable.archived_at: NullableTimestamp`.

- [ ] **Step 1: Create the migration file**

```sql
BEGIN;

ALTER TABLE problems
  ADD COLUMN IF NOT EXISTS archived_at timestamptz;

COMMIT;
```

Save as `docs/009_problems_archive.sql`.

- [ ] **Step 2: Register the migration in the baseline list**

In `backend/src/db/migrations/baseline.ts`, add a new entry after the `"008"` entry (before the closing `] as const satisfies ...`):

```ts
  {
    id: "009",
    label: "problems archive",
    filePath: resolve(docsDir, "009_problems_archive.sql"),
    containsSeedData: false
  }
```

- [ ] **Step 3: Add the column to the Kysely table type**

In `backend/src/db/database.types.ts`, inside `export interface ProblemsTable { ... }` (currently ends with `updated_at: GeneratedTimestamp;` around line 247), add:

```ts
  archived_at: NullableTimestamp;
```

right after `updated_at: GeneratedTimestamp;`.

- [ ] **Step 4: Verify the migration applies cleanly**

Start a throwaway Postgres and run the existing DB-integration suite (it will reset and reapply all baseline migrations, including the new one, before every test):

```bash
docker run --rm -d --name garden-test-pg -e POSTGRES_USER=postgres -e POSTGRES_PASSWORD=postgres -e POSTGRES_DB=garden_test -p 5432:5432 postgres:16-alpine
cd backend
TEST_DATABASE_URL=postgres://postgres:postgres@localhost:5432/garden_test npm test -- --no-file-parallelism test/problems/problems.routes.test.ts
```

Expected: all existing tests in that file still PASS (no new tests yet — this just proves the migration doesn't break anything).

- [ ] **Step 5: Commit**

```bash
git add docs/009_problems_archive.sql backend/src/db/migrations/baseline.ts backend/src/db/database.types.ts
git commit -m "feat(db): add archived_at column to problems table"
```

---

### Task 2: Backend `POST /problems/:problemId/archive` + `includeArchived` list filter

**Files:**
- Modify: `backend/src/modules/problems/problems.types.ts`
- Modify: `backend/src/modules/problems/problems.repository.ts`
- Modify: `backend/src/modules/problems/problems.service.ts`
- Modify: `backend/src/modules/problems/problems.routes.ts`
- Modify: `backend/src/modules/problems/problems.validation.ts`
- Modify: `backend/src/modules/problems/problems.dto.ts`
- Modify (tests): `backend/test/problems/problems.routes.test.ts`
- Modify (tests): `backend/test/problems/problems.dto.test.ts`
- Modify (tests): `backend/test/problems/problems.validation.test.ts`

**Interfaces:**
- Consumes: `ProblemsTable.archived_at` (Task 1), existing `AppError("NOT_FOUND", ...)` from `../../shared/errors/app-error.js`, existing `includeArchivedQuerySchema` from `../../shared/validation/common-schemas.js`.
- Produces: `ProblemsRepository.archive(accountId, problemId, db?): Promise<boolean>`, `ProblemsService.archiveProblem(actor, problemId): Promise<void>`, route `POST /:problemId/archive` returning `{ data: { archived: true } }`, `Problem.archivedAt: Date | null`, `ListProblemsFilters.includeArchived?: boolean`.

- [ ] **Step 1: Write the failing integration tests**

In `backend/test/problems/problems.routes.test.ts`, insert a new `describeDatabase` block immediately after the closing `});` of `describeDatabase("Observation CRUD and resolve/reopen", ...)` (i.e. right after line 728, before `function validCreatePayload(...)`):

```ts
describeDatabase("Problem archive", () => {
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

  it("POST /:problemId/archive → 200, hidden from list by default, visible with includeArchived", async () => {
    const problemId = await createProblem();

    const archiveRes = await app!.inject({
      method: "POST",
      url: `/api/v1/problems/${problemId}/archive`,
      headers: accountAAuthHeaders()
    });
    expect(archiveRes.statusCode).toBe(200);
    expect(parseJsonResponse<{ data: { archived: boolean } }>(archiveRes).data).toEqual({ archived: true });

    const defaultList = await app!.inject({
      method: "GET",
      url: "/api/v1/problems",
      headers: accountAAuthHeaders()
    });
    expect(
      parseJsonResponse<ListProblemsResponse>(defaultList).data.items.find((item) => item.id === problemId)
    ).toBeUndefined();

    const includeArchivedList = await app!.inject({
      method: "GET",
      url: "/api/v1/problems?includeArchived=true",
      headers: accountAAuthHeaders()
    });
    expect(
      parseJsonResponse<ListProblemsResponse>(includeArchivedList).data.items.find((item) => item.id === problemId)
    ).toBeDefined();
  });

  it("archived problem remains fully readable via GET /:problemId", async () => {
    const problemId = await createProblem();

    await app!.inject({
      method: "POST",
      url: `/api/v1/problems/${problemId}/archive`,
      headers: accountAAuthHeaders()
    });

    const detail = await app!.inject({
      method: "GET",
      url: `/api/v1/problems/${problemId}`,
      headers: accountAAuthHeaders()
    });
    expect(detail.statusCode).toBe(200);
    expect(parseJsonResponse<ProblemDetailResponse>(detail).data.id).toBe(problemId);
  });

  it("POST /:problemId/archive twice → 404 on the second call", async () => {
    const problemId = await createProblem();

    await app!.inject({
      method: "POST",
      url: `/api/v1/problems/${problemId}/archive`,
      headers: accountAAuthHeaders()
    });
    const secondRes = await app!.inject({
      method: "POST",
      url: `/api/v1/problems/${problemId}/archive`,
      headers: accountAAuthHeaders()
    });
    expect(secondRes.statusCode).toBe(404);
  });

  it("can archive regardless of status (open, monitoring, resolved)", async () => {
    const problemId = await createProblem();

    await app!.inject({ method: "POST", url: `/api/v1/problems/${problemId}/resolve`, headers: accountAAuthHeaders() });
    const archiveRes = await app!.inject({
      method: "POST",
      url: `/api/v1/problems/${problemId}/archive`,
      headers: accountAAuthHeaders()
    });
    expect(archiveRes.statusCode).toBe(200);
  });

  it("scope: account B cannot archive account A's problem → 404, record untouched", async () => {
    const problemId = await createProblem();

    const res = await app!.inject({
      method: "POST",
      url: `/api/v1/problems/${problemId}/archive`,
      headers: accountBAuthHeaders()
    });
    expect(res.statusCode).toBe(404);

    const detail = await app!.inject({
      method: "GET",
      url: `/api/v1/problems/${problemId}`,
      headers: accountAAuthHeaders()
    });
    expect(parseJsonResponse<ProblemDetailResponse>(detail).data.id).toBe(problemId);
  });
});
```

Also add `archivedAt: string | null;` to the `ListProblemsResponse` item type and to the `ProblemDetailResponse` data type near the top of the file (both currently list `resolvedAt: string | null;` — add the new field directly below it in each).

- [ ] **Step 2: Run the tests to verify they fail**

```bash
cd backend
TEST_DATABASE_URL=postgres://postgres:postgres@localhost:5432/garden_test npm test -- --no-file-parallelism test/problems/problems.routes.test.ts
```

Expected: FAIL — `POST /:problemId/archive` returns 404 (route doesn't exist) for all 5 new tests.

- [ ] **Step 3: Add `archivedAt` and `archive()` to the repository contract**

In `backend/src/modules/problems/problems.types.ts`:

Add `archivedAt: Date | null;` to the `Problem` type, right after `resolvedAt: Date | null;`:

```ts
export type Problem = {
  id: UUID;
  accountId: UUID;
  type: ProblemType;
  placeId: UUID;
  targetType: TargetType;
  targetId: UUID;
  title: string;
  description: string;
  category: ProblemCategory | null;
  severity: string | null;
  status: ProblemStatus;
  observedAt: Date;
  resolvedAt: Date | null;
  archivedAt: Date | null;
  linkedActivityId: UUID | null;
  createdAt: Date;
  updatedAt: Date;
};
```

Add `includeArchived?: boolean;` to `ListProblemsFilters`:

```ts
export type ListProblemsFilters = {
  placeId?: UUID;
  type?: ProblemType;
  status?: ProblemStatus;
  category?: ProblemCategory;
  from?: Date;
  to?: Date;
  includeArchived?: boolean;
  page: number;
  pageSize: number;
};
```

Add `archive` to the `ProblemsRepository` interface, right after `archiveObservation`:

```ts
  archiveObservation(problemId: UUID, obsId: UUID, db?: DbHandle): Promise<boolean>;
  archive(accountId: UUID, problemId: UUID, db?: DbHandle): Promise<boolean>;
```

- [ ] **Step 4: Implement the repository changes**

In `backend/src/modules/problems/problems.repository.ts`:

Add `"archived_at"` to `PROBLEM_COLUMNS` (after `"resolved_at"`):

```ts
const PROBLEM_COLUMNS = [
  "id",
  "account_id",
  "type",
  "place_id",
  "target_type",
  "target_id",
  "title",
  "description",
  "category",
  "severity",
  "status",
  "observed_at",
  "resolved_at",
  "archived_at",
  "linked_activity_id",
  "created_at",
  "updated_at"
] as const;
```

In `toProblem()`, add `archivedAt: row.archived_at` after `resolvedAt: row.resolved_at`:

```ts
function toProblem(row: SelectedProblem): Problem {
  return {
    id: row.id,
    accountId: row.account_id,
    type: row.type as ProblemType,
    placeId: row.place_id,
    targetType: row.target_type as TargetType,
    targetId: row.target_id,
    title: row.title,
    description: row.description,
    category: row.category as ProblemCategory | null,
    severity: row.severity,
    status: row.status as ProblemStatus,
    observedAt: row.observed_at,
    resolvedAt: row.resolved_at,
    archivedAt: row.archived_at,
    linkedActivityId: row.linked_activity_id,
    createdAt: row.created_at,
    updatedAt: row.updated_at
  };
}
```

In `list()`, add `"pr.archived_at"` to the items `.select([...])` array (after `"pr.resolved_at"`):

```ts
      .select([
        "pr.id",
        "pr.account_id",
        "pr.type",
        "pr.place_id",
        "pr.target_type",
        "pr.target_id",
        "pr.title",
        "pr.category",
        "pr.severity",
        "pr.status",
        "pr.observed_at",
        "pr.resolved_at",
        "pr.archived_at"
      ])
```

Add the `includeArchived` filter right after the `filters.placeId` block (before the `filters.type` block):

```ts
    if (!filters.includeArchived) {
      itemsQuery = itemsQuery.where("pr.archived_at", "is", null);
      countQuery = countQuery.where("pr.archived_at", "is", null);
    }
```

Add `archivedAt: row.archived_at` to the items mapping in the returned object (after `resolvedAt: row.resolved_at`):

```ts
      items: rows.map((row) => ({
        id: row.id,
        type: row.type as ProblemType,
        placeId: row.place_id,
        targetType: row.target_type as TargetType,
        targetId: row.target_id,
        targetLabel: row.target_label,
        title: row.title,
        category: row.category as ProblemCategory | null,
        severity: row.severity,
        status: row.status as ProblemStatus,
        observedAt: row.observed_at,
        resolvedAt: row.resolved_at,
        archivedAt: row.archived_at,
        photosCount: toCount({ count: row.photos_count ?? 0 })
      })),
```

In `getDetail()`, add `"pr.archived_at"` to its `.select([...])` array (after `"pr.resolved_at"` — do **not** add an `archived_at is null` filter here; the detail fetch must stay unfiltered):

```ts
      .select([
        "pr.id",
        "pr.account_id",
        "pr.type",
        "pr.place_id",
        "pr.target_type",
        "pr.target_id",
        "pr.title",
        "pr.description",
        "pr.category",
        "pr.severity",
        "pr.status",
        "pr.observed_at",
        "pr.resolved_at",
        "pr.archived_at",
        "pr.linked_activity_id",
        "pr.created_at",
        "pr.updated_at"
      ])
```

Add the `archive()` method right after `archiveObservation()`:

```ts
  async archive(accountId: UUID, problemId: UUID, db: DbHandle = this.dbHandle): Promise<boolean> {
    const result = await db.db
      .updateTable("problems")
      .set({ archived_at: new Date() })
      .where("account_id", "=", accountId)
      .where("id", "=", problemId)
      .where("archived_at", "is", null)
      .executeTakeFirst();

    return (result.numUpdatedRows ?? 0n) > 0n;
  }
```

- [ ] **Step 5: Implement the service method**

In `backend/src/modules/problems/problems.service.ts`, add `archiveProblem` right after `archiveObservation`:

```ts
  async archiveProblem(actor: AuthenticatedActor, problemId: UUID): Promise<void> {
    const archived = await this.problemsRepository.archive(actor.accountId, problemId);
    if (!archived) {
      throw new AppError("NOT_FOUND", "Problem not found");
    }
  }
```

- [ ] **Step 6: Add the route**

In `backend/src/modules/problems/problems.routes.ts`, add the route right after the `app.patch("/:problemId", ...)` block (before the `// Observation routes` comment):

```ts
  app.post("/:problemId/archive", protectedRoute, async (request) => {
    const actor = requireActor(request);
    const { params } = validateRequest(request, { params: problemParamsSchema });
    await requireProblemsService(problemsService).archiveProblem(actor, params.problemId);

    return successEnvelope({ archived: true });
  });

```

In the same file, inside `toListProblemsFilters()`, add `includeArchived: query.includeArchived,` as the first field:

```ts
function toListProblemsFilters(query: ProblemListQuery): ListProblemsFilters {
  const filters: ListProblemsFilters = {
    includeArchived: query.includeArchived,
    page: query.page,
    pageSize: query.pageSize
  };
```

- [ ] **Step 7: Add `includeArchived` to the query schema**

In `backend/src/modules/problems/problems.validation.ts`:

Change the import line to pull in the shared schema:

```ts
import { includeArchivedQuerySchema, paginationQuerySchema, uuidSchema } from "../../shared/validation/common-schemas.js";
```

Add `includeArchived: includeArchivedQuerySchema` to `problemListQuerySchema` (as the last field):

```ts
export const problemListQuerySchema = paginationQuerySchema.extend({
  placeId: z.preprocess((value) => (value === undefined || value === "" ? undefined : value), uuidSchema.optional()),
  type: z.enum(PROBLEM_TYPES).optional(),
  status: z.enum(PROBLEM_STATUSES).optional(),
  category: z.enum(PROBLEM_CATEGORIES).optional(),
  from: z.preprocess((value) => (value === undefined || value === "" ? undefined : value), z.string().datetime().optional()),
  to: z.preprocess((value) => (value === undefined || value === "" ? undefined : value), z.string().datetime().optional()),
  includeArchived: includeArchivedQuerySchema
});
```

- [ ] **Step 8: Add `archivedAt` to the DTOs**

In `backend/src/modules/problems/problems.dto.ts`:

In `toProblemListItemDto`, add `archivedAt: item.archivedAt ? item.archivedAt.toISOString() : null,` after `resolvedAt`:

```ts
export function toProblemListItemDto(item: ProblemListItem): ProblemListItemDto {
  return {
    id: item.id,
    type: item.type,
    placeId: item.placeId,
    targetType: item.targetType,
    targetId: item.targetId,
    targetLabel: item.targetLabel,
    title: item.title,
    category: item.category,
    severity: item.severity,
    status: item.status,
    observedAt: item.observedAt.toISOString(),
    resolvedAt: item.resolvedAt ? item.resolvedAt.toISOString() : null,
    archivedAt: item.archivedAt ? item.archivedAt.toISOString() : null,
    photosCount: item.photosCount
  };
}
```

In `toProblemDetailDto`, add the same field after `resolvedAt`:

```ts
export function toProblemDetailDto(problem: ProblemDetail): ProblemDetailDto {
  return {
    id: problem.id,
    type: problem.type,
    placeId: problem.placeId,
    targetType: problem.targetType,
    targetId: problem.targetId,
    targetLabel: problem.targetLabel,
    title: problem.title,
    description: problem.description,
    category: problem.category,
    severity: problem.severity,
    status: problem.status,
    observedAt: problem.observedAt.toISOString(),
    resolvedAt: problem.resolvedAt ? problem.resolvedAt.toISOString() : null,
    archivedAt: problem.archivedAt ? problem.archivedAt.toISOString() : null,
    photos: problem.photos,
    observations: problem.observations.map(toObservationDto),
    linkedActivity:
      problem.linkedActivity === null
        ? null
        : {
            id: problem.linkedActivity.id,
            type: problem.linkedActivity.type,
            performedAt: problem.linkedActivity.performedAt.toISOString()
          }
  };
}
```

Update the two DTO type aliases at the bottom of the file to include `archivedAt`:

```ts
type ProblemListItemDto = Omit<ProblemListItem, "observedAt" | "resolvedAt" | "archivedAt"> & {
  observedAt: string;
  resolvedAt: string | null;
  archivedAt: string | null;
};

type ProblemDetailDto = Omit<ProblemDetail, "observedAt" | "resolvedAt" | "archivedAt" | "linkedActivity" | "linkedActivityId" | "observations"> & {
  observedAt: string;
  resolvedAt: string | null;
  archivedAt: string | null;
  linkedActivity: { id: string; type: string; performedAt: string } | null;
  observations: ObservationDto[];
};
```

- [ ] **Step 9: Fix the now-broken DTO and validation unit tests**

In `backend/test/problems/problems.dto.test.ts`: add `resolvedAt: null,` is already there — add `archivedAt: null` right after `resolvedAt: null` in all three places it's needed: the `toProblemListItemDto` expected object (in the `it` block), `createProblem()`, and `createProblemListItem()`. Concretely:

```ts
  it("maps list read models to canonical camelCase fields", () => {
    expect(toProblemListItemDto(createProblemListItem())).toEqual({
      id: "123e4567-e89b-42d3-a456-426614174000",
      type: "problem",
      placeId: "223e4567-e89b-42d3-a456-426614174000",
      targetType: "bed",
      targetId: "323e4567-e89b-42d3-a456-426614174000",
      targetLabel: "Bed A",
      title: "Leaf spots",
      category: "fungus",
      severity: "medium",
      status: "open",
      observedAt: "2026-05-13T07:00:00.000Z",
      resolvedAt: null,
      archivedAt: null,
      photosCount: 0
    });
  });
```

```ts
function createProblem(): Problem {
  return {
    id: "123e4567-e89b-42d3-a456-426614174000",
    accountId: "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa",
    type: "problem",
    placeId: "223e4567-e89b-42d3-a456-426614174000",
    targetType: "bed",
    targetId: "323e4567-e89b-42d3-a456-426614174000",
    title: "Leaf spots",
    description: "Dark spots on lower leaves",
    category: "fungus",
    severity: "medium",
    status: "open",
    observedAt,
    resolvedAt: null,
    archivedAt: null,
    linkedActivityId: "423e4567-e89b-42d3-a456-426614174000",
    createdAt,
    updatedAt
  };
}

function createProblemListItem(): ProblemListItem {
  return {
    id: "123e4567-e89b-42d3-a456-426614174000",
    type: "problem",
    placeId: "223e4567-e89b-42d3-a456-426614174000",
    targetType: "bed",
    targetId: "323e4567-e89b-42d3-a456-426614174000",
    targetLabel: "Bed A",
    title: "Leaf spots",
    category: "fungus",
    severity: "medium",
    status: "open",
    observedAt,
    resolvedAt: null,
    archivedAt: null,
    photosCount: 0
  };
}
```

In `backend/test/problems/problems.validation.test.ts`, update the `"parses list filters with pagination defaults and limits"` test to expect `includeArchived: false` by default, and add a case for `includeArchived=true`:

```ts
  it("parses list filters with pagination defaults and limits", () => {
    expect(
      problemListQuerySchema.parse({
        placeId: validPlaceId,
        type: "problem",
        status: "open",
        category: "fungus",
        from: "2026-05-01T00:00:00.000Z",
        to: "2026-05-31T23:59:59.000Z",
        page: "2",
        pageSize: "10"
      })
    ).toEqual({
      placeId: validPlaceId,
      type: "problem",
      status: "open",
      category: "fungus",
      from: "2026-05-01T00:00:00.000Z",
      to: "2026-05-31T23:59:59.000Z",
      includeArchived: false,
      page: 2,
      pageSize: 10
    });
    expect(problemListQuerySchema.parse({})).toMatchObject({ page: 1, pageSize: 20, includeArchived: false });
    expect(problemListQuerySchema.parse({ includeArchived: "true" })).toMatchObject({ includeArchived: true });
    expect(problemListQuerySchema.safeParse({ pageSize: "101" }).success).toBe(false);
  });
```

- [ ] **Step 10: Run all backend problems tests and verify they pass**

```bash
cd backend
npm test -- test/problems/problems.dto.test.ts test/problems/problems.validation.test.ts
TEST_DATABASE_URL=postgres://postgres:postgres@localhost:5432/garden_test npm test -- --no-file-parallelism test/problems/problems.routes.test.ts
```

Expected: all PASS, including the 5 new archive tests from Step 1.

- [ ] **Step 11: Run the full backend suite to check for regressions**

```bash
cd backend
npm test
TEST_DATABASE_URL=postgres://postgres:postgres@localhost:5432/garden_test npm test -- --no-file-parallelism
docker rm -f garden-test-pg
```

Expected: PASS (unit run skips DB suites without `TEST_DATABASE_URL`; the second run exercises them all against the throwaway Postgres).

- [ ] **Step 12: Commit**

```bash
git add backend/src/modules/problems backend/test/problems
git commit -m "feat(problems): add POST /problems/:problemId/archive and includeArchived list filter"
```

---

### Task 3: Frontend models + `ProblemsApiService.archive()`

**Files:**
- Modify: `frontend/src/app/features/problems/problems.models.ts`
- Modify: `frontend/src/app/features/problems/problems-api.service.ts`
- Modify (tests): `frontend/src/app/features/problems/problems-api.service.spec.ts`

**Interfaces:**
- Consumes: existing `ApiClient.post<T>(path, body)`.
- Produces: `ProblemsApiService.archive(problemId: string): Observable<{ archived: boolean }>`; `ProblemListItem.archivedAt: string | null`; `ProblemDetail.archivedAt: string | null`; `ListProblemsFilters.includeArchived?: boolean`.

- [ ] **Step 1: Write the failing test**

In `frontend/src/app/features/problems/problems-api.service.spec.ts`, add a new test at the end of the `describe` block, after `'uploads problem photos with multipart field name file'`:

```ts
  it('archives a problem', () => {
    api.post.mockReturnValue(of({ archived: true }));
    const service = TestBed.inject(ProblemsApiService);

    service.archive('problem-1').subscribe();

    expect(api.post).toHaveBeenCalledWith('/problems/problem-1/archive', {});
  });
```

- [ ] **Step 2: Run the test to verify it fails**

```bash
cd frontend
npx ng test --watch=false --include='**/problems-api.service.spec.ts'
```

Expected: FAIL — `service.archive is not a function`.

- [ ] **Step 3: Add the model fields**

In `frontend/src/app/features/problems/problems.models.ts`, add `readonly archivedAt: string | null;` to `ProblemListItem` (after `readonly resolvedAt: string | null;`) and to `ProblemDetail` (after `readonly resolvedAt: string | null;`), and add `readonly includeArchived?: boolean;` to `ListProblemsFilters`:

```ts
export interface ProblemListItem {
  readonly id: string;
  readonly type: ProblemType;
  readonly placeId: string;
  readonly targetType: ProblemTargetType;
  readonly targetId: string;
  readonly targetLabel: string | null;
  readonly title: string;
  readonly category: ProblemCategory | null;
  readonly severity: string | null;
  readonly status: ProblemStatus;
  readonly observedAt: string;
  readonly resolvedAt: string | null;
  readonly archivedAt: string | null;
  readonly photosCount: number;
}
```

```ts
export interface ProblemDetail {
  readonly id: string;
  readonly type: ProblemType;
  readonly placeId: string;
  readonly targetType: ProblemTargetType;
  readonly targetId: string;
  readonly targetLabel: string | null;
  readonly title: string;
  readonly description: string;
  readonly category: ProblemCategory | null;
  readonly severity: string | null;
  readonly status: ProblemStatus;
  readonly observedAt: string;
  readonly resolvedAt: string | null;
  readonly archivedAt: string | null;
  readonly photos: readonly ProblemPhoto[];
  readonly observations: readonly ProblemObservation[];
  readonly linkedActivity: ProblemLinkedActivity | null;
}
```

```ts
export interface ListProblemsFilters extends PagedFilter {
  readonly placeId?: string;
  readonly type?: ProblemType;
  readonly status?: ProblemStatus;
  readonly category?: ProblemCategory;
  readonly from?: string;
  readonly to?: string;
  readonly includeArchived?: boolean;
}
```

- [ ] **Step 4: Add the `archive` method**

In `frontend/src/app/features/problems/problems-api.service.ts`, add after `reopen`:

```ts
  archive(problemId: string): Observable<{ archived: boolean }> {
    return this.api.post<{ archived: boolean }>(
      `/problems/${encodeURIComponent(problemId)}/archive`,
      {},
    );
  }
```

- [ ] **Step 5: Run the test to verify it passes**

```bash
cd frontend
npx ng test --watch=false --include='**/problems-api.service.spec.ts'
```

Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add frontend/src/app/features/problems/problems.models.ts frontend/src/app/features/problems/problems-api.service.ts frontend/src/app/features/problems/problems-api.service.spec.ts
git commit -m "feat(problems): add archive() to ProblemsApiService and archivedAt/includeArchived models"
```

---

### Task 4: Archive button on `problem-detail-page`

**Files:**
- Modify: `frontend/src/app/features/problems/pages/problem-detail-page/problem-detail-page.ts`
- Modify: `frontend/src/app/features/problems/pages/problem-detail-page/problem-detail-page.html`
- Modify (tests): `frontend/src/app/features/problems/problems-pages.spec.ts`

**Interfaces:**
- Consumes: `ProblemsApiService.archive` (Task 3), existing `ConfirmDialog`/`ConfirmDialogData` (already imported in this file for `archiveObservation`), existing `SnackbarService.showMessage(message: string): void`.
- Produces: `ProblemDetailPage.archive(): void`, `ProblemDetailPage.archiving: WritableSignal<boolean>`.

This page's other actions (`resolve`, `reopen`, `addObservation`, `editObservation`, `archiveObservation`) already use Bulgarian-language UI copy and a locally-opened `ConfirmDialog` (not the English-language `ArchiveConfirmationService` used by `plant-detail-page`). Follow that established in-file convention for text/dialog style, while still following `plant-detail-page.archivePlant()`'s success flow (snackbar + navigate away) for behavior after a successful archive.

- [ ] **Step 1: Write the failing test**

In `frontend/src/app/features/problems/problems-pages.spec.ts`:

Add `archive: vi.fn()` to the `problemsApi` mock object (after `uploadPhoto: vi.fn(),`):

```ts
  const problemsApi = {
    list: vi.fn(),
    get: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    uploadPhoto: vi.fn(),
    archive: vi.fn(),
  };
```

Add `Router` and `MatDialog` to the imports at the top of the file:

```ts
import { ActivatedRoute, Router, convertToParamMap, provideRouter } from '@angular/router';
import { MatDialog } from '@angular/material/dialog';
```

Add a new test at the end of the `describe` block, right before the final closing `});`:

```ts
  it('archives the problem after confirmation and navigates to the problems list', () => {
    problemsApi.archive.mockReturnValue(of({ archived: true }));
    const fixture = TestBed.createComponent(ProblemDetailPage);
    const component = fixture.componentInstance;
    fixture.detectChanges();

    const router = TestBed.inject(Router);
    const navigateSpy = vi.spyOn(router, 'navigate').mockResolvedValue(true);
    const dialog = TestBed.inject(MatDialog);
    vi.spyOn(dialog, 'open').mockReturnValue({
      afterClosed: () => of(true),
    } as ReturnType<MatDialog['open']>);

    component.archive();

    expect(problemsApi.archive).toHaveBeenCalledWith('problem-1');
    expect(navigateSpy).toHaveBeenCalledWith(['/problems']);
  });

  it('does not archive when the confirmation dialog is dismissed', () => {
    const fixture = TestBed.createComponent(ProblemDetailPage);
    const component = fixture.componentInstance;
    fixture.detectChanges();

    const dialog = TestBed.inject(MatDialog);
    vi.spyOn(dialog, 'open').mockReturnValue({
      afterClosed: () => of(false),
    } as ReturnType<MatDialog['open']>);

    component.archive();

    expect(problemsApi.archive).not.toHaveBeenCalled();
  });
```

- [ ] **Step 2: Run the tests to verify they fail**

```bash
cd frontend
npx ng test --watch=false --include='**/problems-pages.spec.ts'
```

Expected: FAIL — `component.archive is not a function`.

- [ ] **Step 3: Implement the component method**

In `frontend/src/app/features/problems/pages/problem-detail-page/problem-detail-page.ts`:

Change the `@angular/router` import to include `Router`:

```ts
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
```

Add the `SnackbarService` import (after the `ApiErrorSummary` import):

```ts
import { SnackbarService } from '../../../../core/notifications/snackbar.service';
```

Add two fields after `resolving`:

```ts
  readonly resolving = signal(false);
  readonly archiving = signal(false);
```

Add two injected dependencies after `dialog`:

```ts
  private readonly dialog = inject(MatDialog);
  private readonly router = inject(Router);
  private readonly snackbar = inject(SnackbarService);
```

Add the `archive()` method after `reopen()`:

```ts
  archive(): void {
    const problem = this.problem();
    if (!problem || this.archiving()) return;
    this.error.set(null);

    this.dialog
      .open<ConfirmDialog, ConfirmDialogData, boolean>(ConfirmDialog, {
        data: {
          title: 'Архивирай проблема',
          message:
            'Сигурен ли си, че искаш да архивираш този запис? Той ще остане видим в историята, но ще изчезне от списъка по подразбиране.',
          confirmLabel: 'Архивирай',
        },
      })
      .afterClosed()
      .pipe(
        takeUntilDestroyed(this.destroyRef),
        switchMap((confirmed) => {
          if (!confirmed) return EMPTY;
          this.archiving.set(true);
          return this.problemsApi.archive(problem.id);
        }),
        catchError((err) => {
          this.archiving.set(false);
          this.error.set(mapApiError(err));
          return EMPTY;
        }),
      )
      .subscribe(() => {
        this.archiving.set(false);
        this.snackbar.showMessage('Проблемът е архивиран.');
        void this.router.navigate(['/problems']);
      });
  }
```

- [ ] **Step 4: Add the button to the template**

In `frontend/src/app/features/problems/pages/problem-detail-page/problem-detail-page.html`, replace the self-closing header:

```html
  <app-page-header
    title="Problem Detail"
    titleId="problem-detail-title"
    subtitle="Backend problem or observation record"
    icon="bug_report"
  />
```

with a header that projects an archive button:

```html
  <app-page-header
    title="Problem Detail"
    titleId="problem-detail-title"
    subtitle="Backend problem or observation record"
    icon="bug_report"
  >
    <button mat-button type="button" color="warn" page-actions [disabled]="archiving()" (click)="archive()">
      <mat-icon aria-hidden="true">archive</mat-icon>
      Архивирай
    </button>
  </app-page-header>
```

Also show an archived indicator in the first `mat-card-content` block, right after the `<p>{{ item.description }}</p>` line:

```html
          <p>{{ item.description }}</p>
          @if (item.archivedAt) {
            <p class="archived-label">Архивиран на: {{ item.archivedAt | date: 'dd.MM.yyyy' }}</p>
          }
          <p>Status: {{ item.status }}</p>
```

- [ ] **Step 5: Run the tests to verify they pass**

```bash
cd frontend
npx ng test --watch=false --include='**/problems-pages.spec.ts'
```

Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add frontend/src/app/features/problems/pages/problem-detail-page frontend/src/app/features/problems/problems-pages.spec.ts
git commit -m "feat(problems): add archive button to problem detail page"
```

---

### Task 5: `includeArchived` filter + archived badge on `problems-list-page`

**Files:**
- Modify: `frontend/src/app/features/problems/pages/problems-list-page/problems-list-page.ts`
- Modify: `frontend/src/app/features/problems/pages/problems-list-page/problems-list-page.html`
- Modify (tests): `frontend/src/app/features/problems/problems-pages.spec.ts`

**Interfaces:**
- Consumes: `ListProblemsFilters.includeArchived` (Task 3).
- Produces: no new public API — internal filter form control and template rendering only.

- [ ] **Step 1: Write the failing tests**

In `frontend/src/app/features/problems/problems-pages.spec.ts`, update the `problemsApi.list` default mock (in the outer `beforeEach`) to include `archivedAt: null` on the existing item, and update the existing filter assertion to include `includeArchived: false`:

```ts
    problemsApi.list.mockReturnValue(
      of({
        items: [
          {
            id: 'problem-1',
            type: 'problem',
            placeId: 'place-1',
            targetType: 'bed',
            targetId: 'bed-1',
            targetLabel: 'Bed A',
            title: 'Leaf spots',
            category: 'fungus',
            severity: 'medium',
            status: 'open',
            observedAt: '2026-05-13T07:00:00.000Z',
            archivedAt: null,
            photosCount: 2,
          },
        ],
        page: 1,
        pageSize: 20,
        total: 1,
      }),
    );
```

```ts
  it('filters the problems list and renders backend rows', () => {
    const fixture = TestBed.createComponent(ProblemsListPage);

    fixture.componentInstance.filters.patchValue({
      placeId: 'place-1',
      type: 'problem',
      status: 'open',
    });
    fixture.componentInstance.search();
    fixture.detectChanges();

    expect(problemsApi.list).toHaveBeenLastCalledWith({
      placeId: 'place-1',
      type: 'problem',
      status: 'open',
      category: undefined,
      from: undefined,
      to: undefined,
      includeArchived: false,
      page: 1,
      pageSize: 20,
    });
    const text = (fixture.nativeElement as HTMLElement).textContent ?? '';
    expect(text).toContain('Leaf spots');
    expect(text).toContain('Bed A');
    expect(text).toContain('Photos: 2');
  });
```

Add two new tests right after it:

```ts
  it('requests includeArchived when the checkbox is checked', () => {
    const fixture = TestBed.createComponent(ProblemsListPage);

    fixture.componentInstance.filters.patchValue({ includeArchived: true });
    fixture.componentInstance.search();
    fixture.detectChanges();

    expect(problemsApi.list).toHaveBeenLastCalledWith(
      expect.objectContaining({ includeArchived: true }),
    );
  });

  it('shows an archived indicator for archived rows', () => {
    problemsApi.list.mockReturnValue(
      of({
        items: [
          {
            id: 'problem-1',
            type: 'problem',
            placeId: 'place-1',
            targetType: 'bed',
            targetId: 'bed-1',
            targetLabel: 'Bed A',
            title: 'Leaf spots',
            category: 'fungus',
            severity: 'medium',
            status: 'open',
            observedAt: '2026-05-13T07:00:00.000Z',
            archivedAt: '2026-06-01T00:00:00.000Z',
            photosCount: 0,
          },
        ],
        page: 1,
        pageSize: 20,
        total: 1,
      }),
    );
    const fixture = TestBed.createComponent(ProblemsListPage);
    fixture.detectChanges();

    const text = (fixture.nativeElement as HTMLElement).textContent ?? '';
    expect(text).toContain('(archived)');
  });
```

- [ ] **Step 2: Run the tests to verify they fail**

```bash
cd frontend
npx ng test --watch=false --include='**/problems-pages.spec.ts'
```

Expected: FAIL — `includeArchived: false` missing from the actual call, no `(archived)` text, `filters.patchValue({ includeArchived: true })` throws (no such control).

- [ ] **Step 3: Add the form control and pass it through**

In `frontend/src/app/features/problems/pages/problems-list-page/problems-list-page.ts`, add `MatCheckboxModule` to the imports:

```ts
import { MatCheckboxModule } from '@angular/material/checkbox';
```

and to the component's `imports` array (after `MatCardModule`):

```ts
  imports: [
    LoadingIndicator,
    ApiErrorSummary,
    DatePipe,
    EmptyState,
    MatButtonModule,
    MatCardModule,
    MatCheckboxModule,
    MatFormFieldModule,
    MatInputModule,
    MatOptionModule,
    MatSelectModule,
    PageHeader,
    ReactiveFormsModule,
    RouterLink,
  ],
```

Add the control to `filters`:

```ts
  readonly filters = new FormGroup({
    placeId: new FormControl<string | null>(null),
    type: new FormControl<ProblemType | null>(null),
    status: new FormControl<ProblemStatus | null>(null),
    category: new FormControl<ProblemCategory | null>(null),
    from: new FormControl<string | null>(null),
    to: new FormControl<string | null>(null),
    includeArchived: new FormControl(false, { nonNullable: true }),
  });
```

Add it to the `search()` request:

```ts
  search(): void {
    this.loading.set(true);
    this.error.set(null);
    const value = this.filters.getRawValue();

    this.problemsApi
      .list({
        placeId: value.placeId || undefined,
        type: value.type || undefined,
        status: value.status || undefined,
        category: value.category || undefined,
        from: value.from ? new Date(value.from).toISOString() : undefined,
        to: value.to ? new Date(value.to).toISOString() : undefined,
        includeArchived: value.includeArchived,
        page: 1,
        pageSize: 20,
      })
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (result) => {
          this.problems.set(result.items);
          this.loading.set(false);
        },
        error: (error: unknown) => {
          this.error.set(mapApiError(error));
          this.loading.set(false);
        },
      });
  }
```

- [ ] **Step 4: Add the checkbox and archived indicator to the template**

In `frontend/src/app/features/problems/pages/problems-list-page/problems-list-page.html`, add the checkbox right before the `Filter` button:

```html
    <mat-checkbox formControlName="includeArchived">Include archived</mat-checkbox>

    <button mat-flat-button type="submit">Filter</button>
```

Add the archived indicator next to the title:

```html
            <mat-card-title>
              <a [routerLink]="['/problems', problem.id]">{{ problem.title }}</a>
              @if (problem.archivedAt) {
                <span class="archived-tag">(archived)</span>
              }
            </mat-card-title>
```

- [ ] **Step 5: Run the tests to verify they pass**

```bash
cd frontend
npx ng test --watch=false --include='**/problems-pages.spec.ts'
```

Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add frontend/src/app/features/problems/pages/problems-list-page frontend/src/app/features/problems/problems-pages.spec.ts
git commit -m "feat(problems): add includeArchived filter and archived indicator to problems list"
```

---

### Task 6: Fix create-page duplicate-submission bug

**Files:**
- Modify: `frontend/src/app/features/problems/pages/problem-create-page/problem-create-page.ts`
- Modify: `frontend/src/app/features/problems/pages/problem-create-page/problem-create-page.html`
- Modify (tests): `frontend/src/app/features/problems/problems-pages.spec.ts`

**Interfaces:**
- Consumes: nothing new.
- Produces: nothing new (internal behavior change only — removes `created` signal, navigates on success instead).

- [ ] **Step 1: Update the failing/changing tests first**

In `frontend/src/app/features/problems/problems-pages.spec.ts`, add `Router` to the `@angular/router` import if not already added by Task 4 (it will already be there after Task 4; skip re-adding).

Replace the three create-page tests that reference `component.created()`:

```ts
  it('shows the uploader for problems and submits without a photo', () => {
    const fixture = TestBed.createComponent(ProblemCreatePage);
    const component = fixture.componentInstance;
    fixture.detectChanges();

    const router = TestBed.inject(Router);
    const navigateSpy = vi.spyOn(router, 'navigate').mockResolvedValue(true);

    component.form.patchValue({
      type: 'problem',
      placeId: 'place-1',
      title: 'Leaf spots',
      description: 'Dark spots',
    });
    fixture.detectChanges();

    expect(component.isProblemType()).toBe(true);
    expect(component.uploader()?.enabled()).toBe(true);
    expect(component.targetIsValid()).toBe(true);

    component.submit();

    expect(problemsApi.create).toHaveBeenCalledWith(
      expect.objectContaining({
        type: 'problem',
        placeId: 'place-1',
        targetType: 'place',
        targetId: 'place-1',
        title: 'Leaf spots',
        description: 'Dark spots',
        status: 'open',
      }),
    );
    expect(problemsApi.uploadPhoto).not.toHaveBeenCalled();
    expect(navigateSpy).toHaveBeenCalledWith(['/problems', 'problem-1']);
  });
```

```ts
  it('uploads the selected photo after creating a problem', () => {
    const fixture = TestBed.createComponent(ProblemCreatePage);
    const component = fixture.componentInstance;
    fixture.detectChanges();

    const router = TestBed.inject(Router);
    const navigateSpy = vi.spyOn(router, 'navigate').mockResolvedValue(true);

    component.form.patchValue({
      type: 'problem',
      placeId: 'place-1',
      title: 'Leaf spots',
      description: 'Dark spots',
    });
    fixture.detectChanges();

    const file = new File(['binary'], 'leaf.jpg', { type: 'image/jpeg' });
    component.uploader()?.onFileChange(fileChangeEvent(file));
    component.submit();

    expect(problemsApi.create).toHaveBeenCalledTimes(1);
    expect(problemsApi.uploadPhoto).toHaveBeenCalledWith('problem-1', file);
    expect(component.uploader()?.items().find((i) => i.status === 'done')).toBeTruthy();
    expect(navigateSpy).toHaveBeenCalledWith(['/problems', 'problem-1']);
  });
```

```ts
  it('keeps metadata and navigates even when photo upload fails', () => {
    problemsApi.uploadPhoto.mockReturnValueOnce(
      throwError(() => new ApiError('EXTERNAL_SERVICE_ERROR', 'Storage unavailable')),
    );
    const fixture = TestBed.createComponent(ProblemCreatePage);
    const component = fixture.componentInstance;
    fixture.detectChanges();

    const router = TestBed.inject(Router);
    const navigateSpy = vi.spyOn(router, 'navigate').mockResolvedValue(true);

    component.form.patchValue({
      type: 'problem',
      placeId: 'place-1',
      title: 'Keep this title',
      description: 'Keep this description',
    });
    fixture.detectChanges();

    const file = new File(['binary'], 'leaf.jpg', { type: 'image/jpeg' });
    component.uploader()?.onFileChange(fileChangeEvent(file));
    component.submit();

    expect(component.form.controls.title.value).toBe('Keep this title');
    expect(component.form.controls.description.value).toBe('Keep this description');
    expect(
      component.uploader()?.items().find((i) => i.status === 'error')?.errorMsg,
    ).toBe('Storage unavailable');
    expect(navigateSpy).toHaveBeenCalledWith(['/problems', 'problem-1']);
  });
```

- [ ] **Step 2: Run the tests to verify they fail**

```bash
cd frontend
npx ng test --watch=false --include='**/problems-pages.spec.ts'
```

Expected: FAIL — `navigateSpy` never called (create page doesn't navigate yet); `component.created` still exists but is no longer asserted, which is fine.

- [ ] **Step 3: Implement the redirect in the component**

In `frontend/src/app/features/problems/pages/problem-create-page/problem-create-page.ts`:

Change the `@angular/router` import to include `Router`:

```ts
import { Router, RouterLink } from '@angular/router';
```

Remove `ProblemMutationResult` from the models import (no longer used):

```ts
import {
  CreateProblemRequest,
  PROBLEM_CATEGORIES,
  PROBLEM_STATUSES,
  PROBLEM_TYPES,
  ProblemCategory,
  ProblemStatus,
  ProblemType,
} from '../../problems.models';
```

Remove the `created` signal field entirely:

```ts
  readonly saving = signal(false);
  readonly error = signal<ApiError | null>(null);
```

(delete the `readonly created = signal<ProblemMutationResult | null>(null);` line that followed `error`)

Add `private readonly router = inject(Router);` next to the other injected services:

```ts
  private readonly problemsApi = inject(ProblemsApiService);
  private readonly placesApi = inject(PlacesApiService);
  private readonly activitiesApi = inject(ActivitiesApiService);
  private readonly router = inject(Router);
  private readonly destroyRef = inject(DestroyRef);
```

Update `submit()` to drop `this.created.set(result)` and call the renamed navigation helper:

```ts
  submit(): void {
    if (this.saving()) {
      return;
    }

    this.form.markAllAsTouched();
    this.error.set(null);

    if (!this.form.valid || !this.targetIsValid()) {
      return;
    }

    this.saving.set(true);

    // Snapshot the type at submit time so an in-flight type change cannot make
    // the upload step disagree with the record that was actually created.
    const isProblem = this.form.controls.type.value === 'problem';

    this.problemsApi
      .create(this.buildRequest())
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (result) => {
          this.uploadPhotoThenNavigate(result.id, isProblem);
        },
        error: (error: unknown) => {
          const apiError = mapApiError(error);
          applyApiErrorToForm(this.form, apiError);
          this.error.set(apiError);
          this.saving.set(false);
        },
      });
  }
```

Replace `uploadPhotoIfNeeded` with `uploadPhotoThenNavigate`:

```ts
  private uploadPhotoThenNavigate(problemId: string, isProblem: boolean): void {
    const uploader = this.uploader();

    if (!isProblem || uploader === undefined || !uploader.hasFiles()) {
      void this.router.navigate(['/problems', problemId]);
      return;
    }

    uploader
      .upload(problemId)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(() => {
        void this.router.navigate(['/problems', problemId]);
      });
  }
```

- [ ] **Step 4: Remove the now-dead success card from the template**

In `frontend/src/app/features/problems/pages/problem-create-page/problem-create-page.html`, delete this entire block (it referenced the removed `created` signal):

```html
  @if (created(); as createdProblem) {
    <mat-card class="success">
      <mat-card-header>
        <mat-card-title>
          {{ form.controls.type.value === 'problem' ? 'Problem' : 'Observation' }} created
        </mat-card-title>
        <mat-card-subtitle>Record saved through the backend API</mat-card-subtitle>
      </mat-card-header>
      <mat-card-content>
        @if (saving()) {
          <p class="status">Uploading photo, please wait...</p>
        } @else {
          <a [routerLink]="['/problems', createdProblem.id]">Open detail</a>
          <a routerLink="/problems">Back to problems</a>
        }
      </mat-card-content>
    </mat-card>
  }

```

- [ ] **Step 5: Run the tests to verify they pass**

```bash
cd frontend
npx ng test --watch=false --include='**/problems-pages.spec.ts'
```

Expected: PASS.

- [ ] **Step 6: Run the full frontend suite to check for regressions**

```bash
cd frontend
npm test -- --watch=false
```

Expected: PASS. (Also grep for any other reference to the removed API: `grep -rn "\.created(" frontend/src/app/features/problems` should return nothing.)

- [ ] **Step 7: Commit**

```bash
git add frontend/src/app/features/problems/pages/problem-create-page frontend/src/app/features/problems/problems-pages.spec.ts
git commit -m "fix(problems): redirect to detail page after create instead of leaving a resubmittable form"
```

---

### Task 7: Update canonical API contract documentation

**Files:**
- Modify: `docs/gardening-helper-canonical-api-contract-v1.md`

**Interfaces:**
- Consumes: nothing (documentation only).
- Produces: nothing (documentation only).

- [ ] **Step 1: Document `includeArchived` and `archivedAt` on `GET /problems` (section 18.1)**

Change the query parameter list:

```
Query:
- `placeId`
- `type`
- `status`
- `category`
- `from`
- `to`
- `includeArchived` (boolean, default `false`)
- pagination
```

Add `"archivedAt": null,` to the response example, right after `"resolvedAt": null,`:

```json
      {
        "id": "uuid",
        "type": "problem",
        "placeId": "uuid",
        "targetType": "bed",
        "targetId": "uuid",
        "targetLabel": "Bed A",
        "title": "Leaf spots",
        "category": "fungus",
        "severity": "medium",
        "status": "open",
        "observedAt": "2026-05-13T10:00:00+03:00",
        "resolvedAt": null,
        "archivedAt": null,
        "photosCount": 2
      }
```

- [ ] **Step 2: Document `archivedAt` on `GET /problems/:problemId` (section 18.4)**

Add `"archivedAt": null,` right after `"resolvedAt": null,` in the response example.

- [ ] **Step 3: Add section 18.9 for the archive endpoint**

Insert right after section 18.8 (`POST /problems/:problemId/reopen`), before the next `---` separator:

```markdown
## 18.9 POST /problems/:problemId/archive

Archives the problem or observation regardless of its current `status`. The record remains fully readable via `GET /problems/:problemId` afterward (problems are historical records per domain rule 13.1); it is excluded from `GET /problems` unless `includeArchived=true` is passed. Archiving is one-way — there is no unarchive/restore action.

Response (200): `{ "data": { "archived": true } }`. 404 if not found/owned or already archived.
```

- [ ] **Step 4: Verify the doc renders sensibly**

```bash
grep -n "18.9\|includeArchived\|archivedAt" docs/gardening-helper-canonical-api-contract-v1.md | grep -A2 -B2 "18\."
```

Confirm section 18.9 exists once, and `includeArchived`/`archivedAt` appear in 18.1 and 18.4.

- [ ] **Step 5: Commit**

```bash
git add docs/gardening-helper-canonical-api-contract-v1.md
git commit -m "docs(api): document problems archive endpoint, includeArchived filter, and archivedAt field"
```

---

## Final Verification

After all 7 tasks are committed, run everything once more from a clean throwaway Postgres to confirm the whole slice works end to end:

```bash
docker run --rm -d --name garden-test-pg -e POSTGRES_USER=postgres -e POSTGRES_PASSWORD=postgres -e POSTGRES_DB=garden_test -p 5432:5432 postgres:16-alpine
cd backend && npm test && TEST_DATABASE_URL=postgres://postgres:postgres@localhost:5432/garden_test npm test -- --no-file-parallelism
cd ../frontend && npm test -- --watch=false
docker rm -f garden-test-pg
```

Expected: all backend and frontend suites pass with no skipped-but-should-run tests and no regressions in unrelated files.
