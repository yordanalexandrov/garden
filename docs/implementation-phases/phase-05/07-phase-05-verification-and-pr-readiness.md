# Implementation Task - Phase 5 Step 7: Phase 5 Verification and PR Readiness

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
Complete Phase 5 verification, confirm scope boundaries, run backend checks, update required docs, and prepare the PR description for account-scoped Places and Plants APIs.
```

## Branch

Use branch:

```text
feature/backend-places-plants
```

---

# Scope

Implement only:

- [ ] Inspect all Phase 5 implementation files for consistency with the phase spec and task files.
- [ ] Confirm all canonical Places API endpoints are implemented and tested.
- [ ] Confirm all canonical Plants API endpoints are implemented and tested.
- [ ] Confirm account scope comes from authenticated actor context and never from request bodies.
- [ ] Confirm controllers are thin, services own validation/archive behavior, and repositories only access data.
- [ ] Confirm all repository queries/writes filter by `account_id`.
- [ ] Confirm archive uses `archived_at` and no hard delete behavior was introduced.
- [ ] Confirm `includeArchived` defaults to excluding archived records.
- [ ] Confirm DTOs are camelCase and no raw snake_case rows are returned.
- [ ] Confirm no growing structure, frontend pages, weather provider calls, product rules, target resolver, activity, problem, task, AI, storage, push, or MCP behavior slipped in.
- [ ] Confirm no schema migration was added unless a blocking mismatch is documented.
- [ ] Run all required backend checks.
- [ ] Update backend README or implementation notes only if run commands, environment setup, or Phase 5 API availability need documentation.
- [ ] Prepare the PR description using the Phase 5 expected PR summary.

Expected paths to review:

```text
backend/src/modules/places/
backend/src/modules/plants/
backend/src/app/
backend/src/db/
backend/src/shared/
backend/test/places/
backend/test/plants/
backend/test/helpers/
backend/README.md
docs/implementation-phases/phase-05-backend-places-and-plants-api.md
```

---

# Out of Scope

Do not implement:

- [ ] New domain features beyond fixing Phase 5 verification gaps.
- [ ] Frontend work.
- [ ] Perennials, beds, products, inventory, activities, target resolver, problems, tasks, weather forecast, rain confirmation, AI, storage, push, notifications, or MCP tools.
- [ ] Schema redesign.
- [ ] Broad refactors unrelated to Phase 5.

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
- [ ] `docs/004_guards_and_triggers_gardening_helper.sql`
- [ ] `docs/implementation-phases/phase-05-backend-places-and-plants-api.md`
- [ ] All prior files in `docs/implementation-phases/phase-05/`
- [ ] `docs/TASK_TEMPLATE.md`
- [ ] All backend source, test, config, package, and docs files changed in Phase 5

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
Frontend must not submit accountId for normal flows.
Places are top-level garden locations.
Weather is optional per place.
Weather location must be explicit.
Places should be archived instead of hard-deleted.
Plants are reusable user-maintained references.
Plant records should not be duplicated unnecessarily, but database should not over-enforce uniqueness for varieties/local names.
Plant records with history should be archived instead of deleted.
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

Final verification must confirm:

```text
List responses use { data: { items, page, pageSize, total } }.
Mutations use { data: { id, ... } } or { data: { archived: true } }.
Errors use { error: { code, message, details } }.
Places use name, description, notes, weatherEnabled, weatherLocationLabel, latitude, longitude, timezone.
Plants use commonName, variety, plantCategory, lifecycleType, growingStyle, notes.
LifecycleType values are annual, biennial, perennial.
GrowingStyle values are tree, shrub, vine, herb, vegetable, berry, flower, other.
```

---

# Tests Required

Add or update tests for:

- [ ] happy path
- [ ] validation errors
- [ ] account scoping
- [ ] archive behavior
- [ ] includeArchived behavior
- [ ] duplicate active place conflict
- [ ] API response shape
- [ ] edge cases
- [ ] scope regression checks

Specific test cases:

1. Every Phase 5 endpoint has at least one success-path API test.
2. Account A/account B cross-access is tested for both places and plants.
3. Archive behavior is tested for both places and plants.
4. Validation failures are tested for place weather metadata and plant enums.
5. List pagination/envelope shape is tested for both places and plants.
6. Duplicate active place name maps to `CONFLICT`.
7. Phase 5 checks prove no frontend direct DB access, provider-call drift, or hard-delete behavior was introduced.

---

# Acceptance Criteria

The task is complete when:

- [ ] All Places API endpoints are implemented.
- [ ] All Plants API endpoints are implemented.
- [ ] All queries and writes are account-scoped.
- [ ] Weather-enabled place validation is enforced backend-side.
- [ ] Archive uses `archived_at`, not hard delete.
- [ ] DTOs are camelCase and contract-compatible.
- [ ] List endpoints return pagination envelope.
- [ ] API errors use canonical envelope.
- [ ] Backend tests/typecheck/lint/build pass where configured, or unavailable checks are reported exactly.
- [ ] PR description is ready and includes the required Phase 5 content.

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

Also run any new targeted Phase 5 test/static scripts added during the phase.

If any command is unavailable or fails due to pre-existing setup or missing local/private test database configuration, report the exact command, exit state, and reason.

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

Use this Phase 5 PR summary shape:

```md
## Summary
Implemented account-scoped backend Places and Plants APIs.

## Scope
- Added places repository/service/controller/validation.
- Added plants repository/service/controller/validation.
- Added account-scoped route tests.

## Domain rules preserved
- Places and plants are account-scoped.
- Weather-enabled places require explicit location data.
- Records are archived instead of hard-deleted.

## Tests
- List exact commands run and results.

## Deferred work
- Growing structure, frontend pages, weather forecast, targets, and activities remain deferred.

## Review focus
- Account scoping.
- API contract shape.
- Archive behavior.
- Weather-location validation.
```

---

# Notes for Implementation Agent

Before opening the PR, inspect the diff for scope drift. The clean Phase 5 PR should look like backend modules, backend route registration, backend tests, and narrowly necessary docs.

Do not claim tests passed unless they were actually run.
