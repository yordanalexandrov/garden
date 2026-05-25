# Phase 15 Task Set - Backend Problems and Observations API

These files convert `docs/implementation-phases/phase-15-backend-problems-and-observations-api.md` into executable Implementation Agent tasks using `docs/TASK_TEMPLATE.md`.

Run the tasks in order on one branch:

```text
feature/backend-problems
```

## Task Order

1. `01-problems-module-contracts-validation-and-route-wiring.md`
2. `02-problems-repository-and-read-models.md`
3. `03-problems-service-create-update-and-linked-activity-validation.md`
4. `04-problems-routes-and-api-contract.md`
5. `05-problems-account-place-target-and-response-regression-tests.md`
6. `06-phase-15-verification-and-pr-readiness.md`

## Phase Boundary

Implement only the backend Problems and Observations metadata API:

- Account-scoped problem/observation contracts, validation schemas, DTO mapping, routes, service methods, repository methods, and tests.
- Canonical `/api/v1/problems` metadata endpoints from API contract section 18, excluding photo upload.
- Place, target, account, and optional linked activity validation before writes.
- List/detail DTOs with target labels where available and `photosCount`/empty `photos` metadata compatible with the canonical contract.
- Problem and observation status/metadata updates with account-scoped access checks.
- Regression coverage for happy paths, filters, response envelopes, target/place/account rejection, and linked activity rejection.

Do not implement:

- `POST /api/v1/problems/:problemId/photos`.
- Storage, signed URLs, `StoragePort`, or `problem_photos` metadata creation.
- Frontend problem/photo pages.
- AI problem assist.
- Activity correction or treatment-linking workflows beyond optional linked activity validation.
- Schema redesign or new migrations unless a blocking mismatch is documented.
- Direct Supabase SDK usage inside domain services.

## Common Required Documents

Every task in this folder requires the Implementation Agent to read:

- `AGENTS.md`
- `docs/gardening-helper-ai-implementation-handoff-readme-v1.md`
- `docs/gardening-helper-implementation-instructions-for-ai-v1.md`
- `docs/gardening-helper-domain-rules-and-invariants-v1.md`
- `docs/gardening-helper-canonical-api-contract-v1.md`
- `docs/gardening-helper-testing-and-acceptance-spec-v1.md`
- `docs/gardening-helper-implementation-agent-instructions.md`
- `docs/gardening-helper-backend-application-design-pack-v1.md`
- `docs/gardening-helper-technical-requirements-and-erd.md`
- `docs/001_initial_schema_gardening_helper.sql`
- `docs/004_guards_and_triggers_gardening_helper.sql`
- `docs/implementation-phases/phase-11-backend-target-resolver.md`
- `docs/implementation-phases/phase-15-backend-problems-and-observations-api.md`
- `docs/TASK_TEMPLATE.md`
- Existing backend app, auth, db, transaction, validation, error, activities, target lookup/resolver, route, and test helper files touched by the task.

## Common Verification

At the end of the phase, from the backend package root, run:

```bash
npm run typecheck
npm run lint
npm test
npm run test:db
npm run build
```

If route or repository tests require a database, run them against a dedicated local/private PostgreSQL-compatible test database using `TEST_DATABASE_URL` or the existing safe test database configuration. If a command is unavailable or fails due to pre-existing setup, report the exact command, exit state, and reason. Never claim checks passed unless they were run.
