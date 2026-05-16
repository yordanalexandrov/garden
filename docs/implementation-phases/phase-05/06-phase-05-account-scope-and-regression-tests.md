# Implementation Task - Phase 5 Step 6: Account Scope and Regression Tests

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
Complete Phase 5 cross-cutting tests and regression checks proving account scoping, archive defaults, validation, response shapes, and forbidden-scope boundaries across Places and Plants.
```

## Branch

Use branch:

```text
feature/backend-places-plants
```

---

# Scope

Implement only:

- [ ] Review Places and Plants code from Steps 1-5 for missing tests and behavior gaps.
- [ ] Add or strengthen account A/account B fixtures for Phase 5 API and repository tests.
- [ ] Prove list endpoints never include cross-account records in items or totals.
- [ ] Prove detail/update/archive endpoints cannot access cross-account records.
- [ ] Prove archived records are excluded by default and included only with explicit `includeArchived`.
- [ ] Prove archive operations use `archived_at` and do not hard delete.
- [ ] Prove Places weather metadata validation and Plants enum validation through API-level tests.
- [ ] Prove canonical success/error envelope shape for representative Places and Plants endpoints.
- [ ] Add regression checks that no frontend code, provider calls, MCP tools, or schema migrations were introduced by Phase 5.
- [ ] Keep database-backed tests safely skipped or clearly reported when no local/private test database is configured, following existing project patterns.

Expected paths, unless existing code clearly establishes a better equivalent:

```text
backend/test/places/
backend/test/plants/
backend/test/helpers/
backend/test/db/helpers/fixtures.ts
backend/test/auth/
backend/test/phase-05/
```

---

# Out of Scope

Do not implement:

- [ ] New application behavior beyond filling Phase 5 test gaps.
- [ ] Perennials, beds, products, inventory, activities, target resolver, problems, tasks, weather forecast, rain confirmation, AI, push, storage, or MCP tools.
- [ ] Frontend pages or frontend API services.
- [ ] Schema redesign.
- [ ] Test shortcuts that bypass the Fastify API when testing API behavior.

---

# Required Documents

Read before coding:

- [ ] `AGENTS.md`
- [ ] `docs/gardening-helper-implementation-agent-instructions.md`
- [ ] `docs/gardening-helper-ai-implementation-handoff-readme-v1.md`
- [ ] `docs/gardening-helper-implementation-instructions-for-ai-v1.md`
- [ ] `docs/gardening-helper-domain-rules-and-invariants-v1.md`
- [ ] `docs/gardening-helper-canonical-api-contract-v1.md`
- [ ] `docs/gardening-helper-testing-and-acceptance-spec-v1.md`
- [ ] `docs/gardening-helper-backend-application-design-pack-v1.md`
- [ ] `docs/gardening-helper-technical-requirements-and-erd.md`
- [ ] `docs/001_initial_schema_gardening_helper.sql`
- [ ] `docs/implementation-phases/phase-05-backend-places-and-plants-api.md`
- [ ] All prior files in `docs/implementation-phases/phase-05/`
- [ ] `docs/TASK_TEMPLATE.md`
- [ ] All backend files changed in Phase 5 Steps 1-5
- [ ] Existing backend test helpers and fixtures

---

# Domain Rules Affected

This task touches:

- [ ] account scoping
- [ ] API contract
- [ ] database/migrations
- [ ] auth/session boundary
- [ ] weather/rain confirmation
- [ ] product usage rules
- [ ] MCP tools / agent interface

Important rules to preserve:

```text
All business records belong to an account.
Cross-account access is forbidden.
Account consistency is mandatory.
Frontend must not submit accountId for normal flows.
Places are top-level garden locations.
Weather is optional per place.
Weather location must be explicit.
Plants are reusable user-maintained references.
Archive historical business records instead of hard-deleting them.
Backend validation is authoritative.
MCP tools are not a privileged bypass channel and must call backend services/API.
```

Weather and product rules are affected only through metadata/future references. Do not implement weather calls or product rules here.

---

# MCP Impact

This task:

- [ ] changes backend behavior used by future MCP tools

MCP tools affected:

```text
None in Phase 5.
```

Required MCP documentation updates:

```text
None.
```

---

# Required Implementation Details

Implement:

- [ ] tests
- [ ] test fixtures
- [ ] static/scope regression checks
- [ ] docs/update notes only if test commands or setup changed

Remove or ignore template items that are not relevant.

---

# Required Infrastructure/Security Boundaries

Preserve these rules:

- [ ] no direct frontend access to application tables
- [ ] no bypass of the Fastify API for application data
- [ ] no business logic in Angular components
- [ ] no business side-effect orchestration in database triggers
- [ ] no Supabase service role key in frontend code/env/build output/logs
- [ ] no direct Supabase SDK usage inside domain services except behind adapters
- [ ] backend validates JWTs and derives account context server-side if auth is touched
- [ ] account scoping enforced backend-side
- [ ] Supabase Auth used only for auth/session flows
- [ ] Supabase Storage used through `StoragePort`
- [ ] Open-Meteo used through `WeatherPort`
- [ ] raw Web Push used through `PushPort`

---

# API Contract

Endpoints involved:

```text
GET /api/v1/places
POST /api/v1/places
GET /api/v1/places/:placeId
PATCH /api/v1/places/:placeId
POST /api/v1/places/:placeId/archive
GET /api/v1/plants
POST /api/v1/plants
GET /api/v1/plants/:plantId
PATCH /api/v1/plants/:plantId
POST /api/v1/plants/:plantId/archive
```

Regression tests must verify:

```text
Success envelopes use { data: ... }.
List envelopes use { data: { items, page, pageSize, total } }.
Errors use { error: { code, message, details } }.
Auth failures use UNAUTHORIZED.
Missing/inaccessible records use the implementation's documented NOT_FOUND/FORBIDDEN policy consistently.
Validation failures use VALIDATION_ERROR unless the service explicitly maps a domain rule to BUSINESS_RULE_VIOLATION.
Duplicate active place names map to CONFLICT.
```

---

# Tests Required

Add or update tests for:

- [ ] account scoping
- [ ] API response shapes
- [ ] validation errors
- [ ] archive behavior
- [ ] includeArchived behavior
- [ ] cross-account mutation denial
- [ ] static/scope regressions

Specific test cases:

1. Account A Places list excludes account B items and account B totals.
2. Account A Plants list excludes account B items and account B totals.
3. Account A cannot get, patch, or archive account B place.
4. Account A cannot get, patch, or archive account B plant.
5. Archived places and plants are excluded by default.
6. `includeArchived=true` includes only archived records from the actor account.
7. Archived rows remain in the database after archive endpoints return.
8. Places weather metadata invalid input returns canonical error envelope.
9. Plants invalid enum input returns canonical error envelope.
10. Duplicate active place name returns `CONFLICT`.
11. Phase 5 code does not import Open-Meteo/weather adapters, storage adapters, push adapters, AI adapters, or frontend modules.
12. Phase 5 did not add migrations unless the PR documents a blocking mismatch.

---

# Acceptance Criteria

The task is complete when:

- [ ] Places and Plants account scoping is proven at repository/service/API levels where relevant.
- [ ] Cross-account reads and writes are blocked consistently.
- [ ] Archive and `includeArchived` behavior are tested for both resource types.
- [ ] Places weather metadata validation and Plants enum validation are tested.
- [ ] Canonical success, pagination, and error envelopes are tested.
- [ ] Scope regression checks show no frontend, provider, MCP, or schema redesign drift.
- [ ] Relevant checks pass or unavailable commands are reported exactly.

---

# Commands to Run

Run from the backend package root:

```bash
npm run typecheck
npm run lint
npm test
npm run test:db
npm run build
```

If any database-backed command cannot run because no safe local/private test database is configured, report the exact command and missing prerequisite.

---

# PR Requirements

PR description must include:

- Summary
- Scope
- Domain rules affected
- API changes
- Database changes
- Tests run
- Integration/provider status
- Review focus

---

# Notes for Implementation Agent

The goal of this step is proof, not new surface area. If a missing behavior is discovered, fix the smallest Phase 5 implementation gap and add the regression test that would have caught it.

Do not claim tests passed unless they were actually run.

