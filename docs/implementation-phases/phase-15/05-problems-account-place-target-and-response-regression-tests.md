# Implementation Task - Phase 15 Step 5: Problems Account, Place, Target, and Response Regression Tests

## Role

You are the **Implementation Agent**.

Use:
- `AGENTS.md`
- `docs/gardening-helper-implementation-agent-instructions.md`
- `docs/gardening-helper-ai-implementation-handoff-readme-v1.md`
- all relevant specs for this task

Final infrastructure/provider decisions:
- Deployment: Hetzner VPS + Docker Compose
- Database: self-hosted Supabase Postgres
- Auth: self-hosted Supabase Auth through `AuthPort`
- Storage: self-hosted Supabase Storage through `StoragePort`
- Weather: Open-Meteo through `WeatherPort`
- Push: raw Web Push with VAPID through `PushPort`
- Correction workflow: hybrid correction model

The application data API remains the Fastify API under `/api/v1`.

---

# Task

## Goal

Implement:

```text
Add Phase 15 regression coverage for account scoping, place/target consistency, optional linked activity validation, and canonical problem/observation response shapes.
```

## Branch

Use branch:

```text
feature/backend-problems
```

---

# Scope

Implement only:

- [ ] Inspect existing backend integration/API test helper patterns, fixture builders, database reset behavior, auth actor helpers, and cross-account test conventions.
- [ ] Add deterministic fixtures for account A/account B, places, targetable growing-structure rows, activities for linked activity validation, problems, and observations as needed.
- [ ] Cover problem and observation create/list/detail/update happy paths.
- [ ] Cover target existence, target account, and target place rejection paths.
- [ ] Cover optional linked activity account/place rejection paths.
- [ ] Cover account A cannot list, get, or update account B problems.
- [ ] Cover canonical response envelopes, filters, pagination fields, target labels, `photosCount`, and empty detail `photos` behavior.
- [ ] Cover validation behavior for invalid problem type/status/category/target type and missing required fields.
- [ ] Cover that Phase 15 does not create problem photo metadata and does not expose upload/storage behavior.
- [ ] Add any missing unit tests for service/repository helpers that are difficult to validate only through routes.

Expected paths, unless existing code clearly establishes a better equivalent:

```text
backend/test/problems/problems.routes.test.ts
backend/test/problems/problems.service.test.ts
backend/test/problems/problems.repository.test.ts
backend/test/helpers/
```

---

# Out of Scope

Do not implement:

- [ ] New product, inventory, task, AI, weather, push, frontend, storage, deployment, or MCP behavior.
- [ ] Problem photo upload endpoint tests beyond confirming the endpoint is out of Phase 15 scope or absent.
- [ ] Multipart upload fixtures.
- [ ] Activity correction or activity creation side-effect tests.
- [ ] Schema changes or migrations unless a blocking mismatch is documented.

---

# Required Documents

Read before coding:

- [ ] `AGENTS.md`
- [ ] `docs/gardening-helper-implementation-agent-instructions.md`
- [ ] `docs/gardening-helper-ai-implementation-handoff-readme-v1.md`
- [ ] `docs/gardening-helper-implementation-instructions-for-ai-v1.md`
- [ ] `docs/gardening-helper-domain-rules-and-invariants-v1.md` sections 4, 8, 13, and 25.6
- [ ] `docs/gardening-helper-canonical-api-contract-v1.md` sections 2, 3, 4, 5, 18, and 27
- [ ] `docs/gardening-helper-testing-and-acceptance-spec-v1.md` problem, API, and account-scope cases
- [ ] `docs/gardening-helper-backend-application-design-pack-v1.md`
- [ ] `docs/001_initial_schema_gardening_helper.sql`
- [ ] `docs/004_guards_and_triggers_gardening_helper.sql`
- [ ] `docs/implementation-phases/phase-11-backend-target-resolver.md`
- [ ] `docs/implementation-phases/phase-15-backend-problems-and-observations-api.md`
- [ ] Existing backend problem, activity, target, auth, route, service, repository, fixture, and database test helper files touched by the task.

---

# Domain Rules Affected

This task touches:

- [ ] account scoping
- [ ] target resolution
- [ ] activities
- [ ] problems/photos
- [ ] API contract
- [ ] database/migrations
- [ ] auth/session boundary
- [ ] storage/file access boundary

Important rules to preserve:

```text
All business records belong to an account.
Cross-account access is forbidden.
Account consistency is mandatory.
Problem/observation target must belong to the same account and place.
Linked treatment/activity is optional and must be validated when supplied.
Problem creation works without photos.
Observations do not support photos in v1.
Photo upload and storage are deferred to Phase 16.
```

---

# MCP Impact

This task:

- [ ] changes backend behavior used by future MCP tools

MCP tools affected:

```text
None in Phase 15.
```

Required MCP documentation updates:

```text
None.
```

---

# Required Implementation Details

Implement:

- [ ] tests
- [ ] fixtures/test helpers
- [ ] small verification fixes only if tests expose Phase 15 defects

Remove or ignore template items that are not relevant.

---

# Required Infrastructure/Security Boundaries

Preserve these rules:

- [ ] no direct frontend access to application tables
- [ ] no bypass of the Fastify API for application data
- [ ] no business side-effect orchestration in database triggers
- [ ] no Supabase service role key in frontend code/env/build output/logs
- [ ] no direct Supabase SDK usage inside domain services except behind adapters
- [ ] backend validates JWTs and derives account context server-side
- [ ] account scoping enforced backend-side
- [ ] no storage upload or signed URL behavior in Phase 15

---

# API Contract

Endpoints under regression:

```text
GET /api/v1/problems
POST /api/v1/problems
GET /api/v1/problems/:problemId
PATCH /api/v1/problems/:problemId
```

Confirm these endpoints preserve:

```text
Canonical success and error envelopes.
Canonical pagination fields.
Canonical problem/observation enum values.
Canonical target type fields.
No `accountId` accepted as trusted user input for normal flows.
No photo upload/storage behavior in Phase 15.
```

---

# Tests Required

Add or update tests for:

- [ ] happy path
- [ ] validation errors
- [ ] account scoping
- [ ] API response shape
- [ ] edge cases

Specific test cases:

1. Create problem without photo succeeds.
2. Create observation without photo succeeds.
3. List problems by `placeId`, `type`, `status`, `category`, `from`, and `to`.
4. Get problem detail returns canonical fields and empty `photos` behavior.
5. Patch problem status and editable metadata fields.
6. Target from another place is rejected.
7. Target from another account is rejected.
8. Linked activity from another account is rejected.
9. Linked activity from another place is rejected where place context conflicts.
10. Account A cannot list/get/update account B problems.
11. Invalid problem type/status/category/target type is rejected.
12. Missing title/description/place/target is rejected.
13. Phase 15 create/update does not create `problem_photos` metadata.
14. Photo upload route is not introduced by this phase.

---

# Acceptance Criteria

The task is complete when:

- [ ] Phase 15 has focused regression coverage for metadata routes/services/repositories.
- [ ] Account/place/target/linked activity invariants are covered.
- [ ] Canonical response and error envelopes are covered.
- [ ] Photo/storage absence is covered.
- [ ] Tests pass where configured.
- [ ] No unrelated implementation scope slipped in.
