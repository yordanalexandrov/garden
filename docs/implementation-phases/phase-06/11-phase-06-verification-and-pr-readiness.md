# Implementation Task - Phase 6 Step 11: Phase 6 Verification and PR Readiness

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
Complete Phase 6 verification, confirm scope boundaries, run backend checks, update required docs, and prepare the PR description for account-scoped growing structure APIs.
```

## Branch

Use branch:

```text
feature/backend-growing-structure
```

---

# Scope

Implement only:

- [ ] Inspect all Phase 6 implementation files for consistency with the phase spec and task files.
- [ ] Confirm all canonical Perennials API endpoints are implemented and tested.
- [ ] Confirm all canonical Beds API endpoints are implemented and tested.
- [ ] Confirm all canonical Persistent Bed Plants API endpoints are implemented and tested.
- [ ] Confirm all canonical Yearly Bed Plantings API endpoints are implemented and tested.
- [ ] Confirm account scope comes from authenticated actor context and never from request bodies.
- [ ] Confirm controllers are thin, services own cross-entity validation/archive behavior, and repositories only access data.
- [ ] Confirm all repository queries/writes filter by `account_id`.
- [ ] Confirm parent/child consistency checks are performed for place, bed, and plant references.
- [ ] Confirm archive uses historical-preserving metadata/status and no hard delete behavior was introduced.
- [ ] Confirm duplicate same bed/plant/year yearly planting rows are allowed.
- [ ] Confirm historical bed occupancy remains readable.
- [ ] Confirm bed current contents honor selected year.
- [ ] Confirm DTOs are camelCase and no raw snake_case rows are returned.
- [ ] Confirm no frontend pages, provider calls, MCP tools, target resolver, activities, inventory, products, problems, tasks, calendar, weather, AI, storage, push, or notifications behavior slipped in.
- [ ] Confirm no schema migration was added unless a blocking mismatch is documented.
- [ ] Run all required backend checks.
- [ ] Update backend README or implementation notes only if run commands, environment setup, or Phase 6 API availability need documentation.
- [ ] Prepare the PR description using the Phase 6 expected PR summary.

Expected paths to review:

```text
backend/src/modules/perennials/
backend/src/modules/beds/
backend/src/modules/plantings/
backend/src/app/
backend/src/db/
backend/src/shared/
backend/test/perennials/
backend/test/beds/
backend/test/plantings/
backend/test/helpers/
backend/README.md
docs/implementation-phases/phase-06-backend-growing-structure-api.md
```

---

# Out of Scope

Do not implement:

- [ ] New domain features beyond fixing Phase 6 verification gaps.
- [ ] Frontend work.
- [ ] Target resolver, activities, inventory, products, product usage rules, problems, tasks, calendar, weather forecast, rain confirmation, AI, storage, push, notifications, or MCP tools.
- [ ] Schema redesign.
- [ ] Broad refactors unrelated to Phase 6.

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
- [ ] All backend source, test, config, package, and docs files changed in Phase 6

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
Persistent bed plants must not be automatically removed when year changes.
Yearly bed plantings are calendar-year based.
Duplicate same plant/bed/year rows are allowed.
Historical bed occupancy must remain readable.
Archive historical business records instead of hard-deleting them.
Backend validation is authoritative.
Controllers stay thin.
Services orchestrate workflows.
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
- [ ] docs/update notes if needed
- [ ] PR description
- [ ] verification checklist
- [ ] static/scope checks

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
- [ ] Supabase Studio protected if deployment/admin config is touched
- [ ] PostgreSQL not publicly exposed if deployment/admin config is touched
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

Final verification must confirm:

```text
List responses use { data: { items, page, pageSize, total } } where specified.
Mutations use { data: { id } } or the existing canonical mutation envelope.
Errors use { error: { code, message, details } }.
Perennials use plantId, label, plantedYear, notes, status, and plantName in reads.
Beds use name, description, notes, widthM, lengthM, areaM2, status, and selected-year contents.
Bed detail responses include `recentActivities` and `openProblems` as contract-required arrays; Phase 6 may return them empty.
Persistent bed plants use plantId, plantedYear, quantity, notes, and status.
Yearly bed plantings use plantId, year, quantity, notes, and status.
Status values match the canonical API and SQL checks.
```

---

# Tests Required

Add or update tests for:

- [ ] happy path
- [ ] validation errors
- [ ] account scoping
- [ ] archive behavior
- [ ] parent/child consistency
- [ ] selected-year contents
- [ ] duplicate yearly plantings
- [ ] API response shape
- [ ] edge cases
- [ ] scope regression checks

Specific test cases:

1. Every Phase 6 endpoint has at least one success-path API test.
2. Account A/account B cross-access is tested for every Phase 6 resource type.
3. Archive behavior is tested for perennials, beds, persistent bed plants, and yearly bed plantings.
4. Validation failures are tested for statuses, years, dimensions, and quantities.
5. Parent/child consistency is tested for place, bed, and plant references.
6. Bed list/detail selected-year contents are tested, including empty `recentActivities` and `openProblems` arrays on bed detail.
7. Duplicate same bed/plant/year yearly plantings are tested and allowed.
8. List pagination/envelope shape is tested where endpoints are paginated.
9. Phase 6 checks prove no frontend direct DB access, provider-call drift, target resolver, activity, inventory, problem, task, MCP, schema redesign, or hard-delete behavior was introduced.

---

# Acceptance Criteria

The task is complete when:

- [ ] All Perennials API endpoints are implemented.
- [ ] All Beds API endpoints are implemented.
- [ ] All Persistent Bed Plants API endpoints are implemented.
- [ ] All Yearly Bed Plantings API endpoints are implemented.
- [ ] All queries and writes are account-scoped.
- [ ] Parent/child account consistency is enforced backend-side.
- [ ] Archive preserves historical rows and does not hard delete.
- [ ] Duplicate yearly planting rows are allowed.
- [ ] Historical bed occupancy remains readable.
- [ ] Bed current contents honor selected year.
- [ ] DTOs are camelCase and contract-compatible.
- [ ] API errors use canonical envelope.
- [ ] Backend tests/typecheck/lint/build pass where configured, or unavailable checks are reported exactly.
- [ ] PR description is ready and includes the required Phase 6 content.

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

If any command does not exist, cannot run safely, or fails due to pre-existing setup, report the exact command, exit state, and reason.

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

Suggested PR body:

```md
## Summary
Implemented backend growing structure APIs.

## Scope
- Added perennials, beds, persistent bed plants, and yearly plantings APIs.
- Added parent/account consistency checks and tests.
- Added selected-year bed contents read behavior.

## Domain rules preserved
- Growing structure records are account-scoped.
- Historical bed occupancy remains readable.
- Persistent and yearly plantings are distinct.
- Duplicate yearly planting rows remain allowed.

## Tests
- <commands run and results>

## Deferred work
- Target resolver, activity/task/problem workflows, and frontend pages remain deferred.

## Review focus
- Parent-child account consistency.
- Archive/status behavior.
- Bed contents by year.
- Target-resolver readiness.
```

---

# Notes for Implementation Agent

Do not redesign the product.

Do not claim tests passed unless they were actually run.
