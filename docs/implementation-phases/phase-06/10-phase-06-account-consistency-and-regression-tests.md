# Implementation Task - Phase 6 Step 10: Account Consistency and Regression Tests

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
Complete Phase 6 cross-cutting tests and regression checks proving account scoping, parent/child account consistency, archive defaults, historical occupancy, duplicate yearly planting allowance, API envelopes, and forbidden-scope boundaries across all growing structure APIs.
```

## Branch

Use branch:

```text
feature/backend-growing-structure
```

---

# Scope

Implement only:

- [ ] Review Phase 6 code from Steps 1-9 for missing tests and behavior gaps.
- [ ] Add or strengthen account A/account B fixtures for places, plants, perennials, beds, persistent bed plants, and yearly bed plantings.
- [ ] Prove nested list endpoints never include cross-account records in items or totals.
- [ ] Prove detail/update/archive endpoints cannot access cross-account records.
- [ ] Prove create/update endpoints reject cross-account parent and plant references.
- [ ] Prove archived records are excluded from default active/list behavior.
- [ ] Prove archive operations preserve rows and do not hard delete.
- [ ] Prove selected-year bed contents preserve historical occupancy and return the requested year's yearly plantings.
- [ ] Prove duplicate yearly planting rows for the same bed/plant/year are allowed.
- [ ] Add DB guard smoke tests for representative mismatched account references.
- [ ] Prove canonical success/error envelope shape for representative endpoints in each entity group.
- [ ] Add regression checks that no frontend code, provider calls, MCP tools, target resolver, activity, inventory, problem, task, AI, weather, storage, push, or schema redesign drift was introduced by Phase 6.
- [ ] Keep database-backed tests safely skipped or clearly reported when no local/private test database is configured, following existing project patterns.

Expected paths, unless existing code clearly establishes a better equivalent:

```text
backend/test/perennials/
backend/test/beds/
backend/test/plantings/
backend/test/helpers/
backend/test/db/helpers/fixtures.ts
backend/test/phase-06/
```

---

# Out of Scope

Do not implement:

- [ ] New application behavior beyond filling Phase 6 test gaps.
- [ ] Target resolver, activities, inventory, products, product rules, problems, tasks, calendar, weather forecast, rain confirmation, AI, push, storage, frontend pages, or MCP tools.
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
- [ ] `docs/002_views_gardening_helper.sql`
- [ ] `docs/004_guards_and_triggers_gardening_helper.sql`
- [ ] `docs/implementation-phases/phase-06-backend-growing-structure-api.md`
- [ ] All prior files in `docs/implementation-phases/phase-06/`
- [ ] `docs/TASK_TEMPLATE.md`
- [ ] All backend files changed in Phase 6 Steps 1-9
- [ ] Existing backend test helpers and fixtures

---

# Domain Rules Affected

This task touches:

- [ ] account scoping
- [ ] API contract
- [ ] database/migrations
- [ ] auth/session boundary
- [ ] MCP tools / agent interface

Important rules to preserve:

```text
All business records belong to an account.
Cross-account access is forbidden.
Account consistency is mandatory.
Perennials are individually tracked growing units.
Beds are physical growing areas.
Persistent bed plants stay until explicitly removed or archived.
Yearly bed plantings are calendar-year based.
Duplicate same plant/bed/year rows are allowed.
Historical bed occupancy must remain readable.
Archive historical business records instead of hard-deleting them.
Controllers stay thin.
Services orchestrate workflows and cross-entity validation.
Repositories only access data.
MCP tools are not a privileged bypass channel and must call backend services/API.
```

---

# MCP Impact

This task:

- [ ] changes backend behavior used by future MCP tools

MCP tools affected:

```text
None in Phase 6.
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
- [ ] database guard smoke tests
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
GET /api/v1/places/:placeId/perennials
POST /api/v1/places/:placeId/perennials
GET /api/v1/perennials/:perennialId
PATCH /api/v1/perennials/:perennialId
POST /api/v1/perennials/:perennialId/archive
GET /api/v1/places/:placeId/beds
POST /api/v1/places/:placeId/beds
GET /api/v1/beds/:bedId
PATCH /api/v1/beds/:bedId
POST /api/v1/beds/:bedId/archive
GET /api/v1/beds/:bedId/persistent-plants
POST /api/v1/beds/:bedId/persistent-plants
PATCH /api/v1/persistent-bed-plants/:id
POST /api/v1/persistent-bed-plants/:id/archive
GET /api/v1/beds/:bedId/plantings
POST /api/v1/beds/:bedId/plantings
PATCH /api/v1/plantings/:plantingId
POST /api/v1/plantings/:plantingId/archive
```

Regression tests must verify:

```text
Success envelopes use { data: ... }.
List envelopes use { data: { items, page, pageSize, total } } when endpoint is paginated.
Errors use { error: { code, message, details } }.
Auth failures use UNAUTHORIZED.
Missing/inaccessible records use the implementation's documented NOT_FOUND/FORBIDDEN policy consistently.
Validation failures use VALIDATION_ERROR unless the service explicitly maps a domain rule to BUSINESS_RULE_VIOLATION.
Cross-account parent/plant references are rejected.
```

---

# Tests Required

Add or update tests for:

- [ ] account scoping
- [ ] API response shapes
- [ ] validation errors
- [ ] archive behavior
- [ ] parent/child account consistency
- [ ] selected-year bed contents
- [ ] duplicate yearly planting allowance
- [ ] database guard triggers
- [ ] static/scope regressions

Specific test cases:

1. Account A perennials list excludes account B items and account B totals.
2. Account A beds list excludes account B items and account B totals.
3. Account A persistent bed plants list excludes account B items.
4. Account A yearly plantings list excludes account B items and account B totals.
5. Account A cannot get, patch, or archive account B perennial.
6. Account A cannot get, patch, or archive account B bed.
7. Account A cannot patch or archive account B persistent bed plant.
8. Account A cannot patch or archive account B yearly planting.
9. Cross-account place, bed, and plant references are rejected on create/update.
10. Archived rows remain in the database after archive endpoints return.
11. Archived rows are excluded from default active/list behavior.
12. Bed contents for 2026 and 2027 return the correct yearly rows without deleting either year.
13. Duplicate same bed/plant/year yearly plantings are both persisted and returned.
14. Guard triggers reject representative mismatched account inserts for perennials, beds, persistent bed plants, and yearly bed plantings.
15. Phase 6 code does not import frontend modules, Open-Meteo/weather adapters, storage adapters, push adapters, AI adapters, inventory modules, activity modules, task modules, problem modules, or MCP tools.
16. Phase 6 did not add migrations unless the PR documents a blocking mismatch.

---

# Acceptance Criteria

The task is complete when:

- [ ] Growing structure account scoping is proven at repository/service/API levels where relevant.
- [ ] Cross-account reads and writes are blocked consistently.
- [ ] Parent/child account consistency is tested for places, plants, beds, perennials, persistent bed plants, and yearly plantings.
- [ ] Archive behavior is tested for every Phase 6 resource type.
- [ ] Selected-year bed contents and historical occupancy are tested.
- [ ] Duplicate yearly planting behavior is tested and preserved.
- [ ] Canonical success, pagination, and error envelopes are tested.
- [ ] Scope regression checks show no frontend, provider, MCP, target resolver, activity, inventory, problem, task, weather, AI, storage, push, or schema redesign drift.
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

The goal of this step is proof, not new surface area. If a missing behavior is discovered, fix the smallest Phase 6 implementation gap and add the regression test that would have caught it.

Do not claim tests passed unless they were actually run.

