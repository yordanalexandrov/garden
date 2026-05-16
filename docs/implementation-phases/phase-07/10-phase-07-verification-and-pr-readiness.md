# Implementation Task - Phase 7 Step 10: Phase 7 Verification and PR Readiness

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
Complete Phase 7 verification, confirm frontend boundary rules, run frontend checks, update required docs, and prepare the PR description for frontend garden structure pages.
```

## Branch

Use branch:

```text
feature/frontend-garden-structure
```

---

# Scope

Implement only:

- [ ] Inspect all Phase 7 implementation files for consistency with the phase spec and task files.
- [ ] Confirm `/places` list/create/edit/archive works and is tested.
- [ ] Confirm `/places/:placeId` and `/places/:placeId/overview` place detail shell/overview works and is tested.
- [ ] Confirm `/places/:placeId/perennials` list/create/edit/archive works and is tested.
- [ ] Confirm `/places/:placeId/beds` list/detail/create/edit/archive works and is tested.
- [ ] Confirm persistent bed plant add/edit/archive flows work and are tested.
- [ ] Confirm yearly bed planting add/edit/archive flows work and are tested.
- [ ] Confirm `/plants`, `/plants/new`, and `/plants/:plantId` list/search/create/edit/archive works and is tested.
- [ ] Confirm all business data access goes through typed API services and `/api/v1`.
- [ ] Confirm no Phase 7 component uses raw `HttpClient` directly.
- [ ] Confirm no frontend request body sends trusted `accountId`.
- [ ] Confirm all forms use Reactive Forms.
- [ ] Confirm archive actions require confirmation and use POST archive endpoints.
- [ ] Confirm persistent and yearly bed contents are visually distinct.
- [ ] Confirm year selector changes query/view only and does not mutate planting data.
- [ ] Confirm backend validation/business-rule errors render to users.
- [ ] Confirm mobile layouts remain usable for dense lists/forms.
- [ ] Confirm no backend, schema, provider, MCP, product, inventory, activity, problem, task/calendar behavior, weather forecast, AI, push, storage, or notification behavior slipped in.
- [ ] Run all required frontend checks and static boundary checks.
- [ ] Update frontend README or implementation notes only if run commands, environment setup, or Phase 7 page availability need documentation.
- [ ] Prepare the PR description using the Phase 7 expected PR summary.

Expected paths to review:

```text
frontend/src/app/features/places/
frontend/src/app/features/plants/
frontend/src/app/features/perennials/
frontend/src/app/features/beds/
frontend/src/app/features/plantings/
frontend/src/app/shared/
frontend/src/app/core/
frontend/src/app/app.routes.ts
frontend/test/
frontend/scripts/
frontend/README.md
docs/implementation-phases/phase-07-frontend-garden-structure-pages.md
```

---

# Out of Scope

Do not implement:

- [ ] New domain features beyond fixing Phase 7 verification gaps.
- [ ] Backend work beyond tiny documented bug fixes for Phase 5/6 API compatibility.
- [ ] Products, inventory, activities, problems/photos, tasks/calendar behavior, weather forecast, rain confirmation, AI, storage, push, notifications, or MCP tools.
- [ ] Schema redesign.
- [ ] Broad refactors unrelated to Phase 7.

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
- [ ] `docs/gardening-helper-frontend-technical-spec-v1.md`
- [ ] `docs/implementation-phases/phase-04-frontend-project-foundation.md`
- [ ] `docs/implementation-phases/phase-05-backend-places-and-plants-api.md`
- [ ] `docs/implementation-phases/phase-06-backend-growing-structure-api.md`
- [ ] `docs/implementation-phases/phase-07-frontend-garden-structure-pages.md`
- [ ] All prior files in `docs/implementation-phases/phase-07/`
- [ ] `docs/TASK_TEMPLATE.md`
- [ ] All frontend source, test, config, package, and docs files changed in Phase 7

---

# Domain Rules Affected

This task touches:

- [ ] account scoping
- [ ] target resolution
- [ ] activities
- [ ] problems/photos
- [ ] tasks/reminders
- [ ] frontend forms
- [ ] API contract
- [ ] auth/session boundary
- [ ] storage/file access boundary
- [ ] provider adapter boundary
- [ ] MCP tools / agent interface

Important rules to preserve:

```text
Frontend is not business truth.
Frontend must not submit accountId for normal flows.
Frontend never talks directly to the database.
Frontend never accesses application tables directly.
All application data access goes through the Fastify API under /api/v1.
Backend derives authenticated actor/account context server-side.
Archive historical business records instead of hard-deleting them.
Plant database is reusable reference data.
Persistent bed plants stay until explicitly removed or archived.
Yearly bed plantings are calendar-year based.
Duplicate same plant/bed/year yearly planting rows are allowed.
Historical bed occupancy must remain readable.
Year selector must not mutate planting data.
Activities, target resolver, problems/photos, tasks, weather, AI, storage, push, inventory, and MCP tools are out of scope.
```

---

# MCP Impact

This task:

- [ ] has no MCP impact

MCP tools affected:

```text
None.
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
- [ ] frontend boundary/static checks
- [ ] manual smoke notes if a dev server is used

Remove or ignore template items that are not relevant.

---

# Required Infrastructure/Security Boundaries

Preserve these rules:

- [ ] no direct frontend access to application tables
- [ ] no bypass of the Fastify API for application data
- [ ] no business logic in Angular components
- [ ] no Supabase service role key in frontend code/env/build output/logs
- [ ] no direct Supabase Storage business calls
- [ ] Supabase Studio protected if deployment/admin config is touched
- [ ] PostgreSQL not publicly exposed if deployment/admin config is touched
- [ ] backend validates JWTs and derives account context server-side
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
List responses are consumed as { data: { items, page, pageSize, total } }.
Mutation responses are consumed as canonical { data: ... } envelopes.
Errors render from { error: { code, message, details } }.
Archive flows call POST /archive endpoints.
No request sends trusted accountId.
No frontend component treats backend-derived business truth as locally authoritative.
```

---

# Tests Required

Add or update tests for:

- [ ] happy path
- [ ] validation errors
- [ ] API response shape
- [ ] frontend form behavior
- [ ] archive confirmation
- [ ] year selector behavior
- [ ] mobile layout smoke
- [ ] boundary/security checks
- [ ] edge cases

Specific test cases:

1. Every Phase 7 page has at least one render/success-path component test.
2. Every Phase 7 API service has canonical path and envelope tests.
3. Place, plant, perennial, bed, persistent plant, and yearly planting forms use Reactive Forms.
4. Backend API errors render on representative forms.
5. Archive confirmation is tested for places, plants, perennials, beds, persistent bed plants, and yearly plantings.
6. Year selector changes visible yearly plantings without mutation calls.
7. Persistent and yearly bed contents render separately.
8. No request body sends `accountId`.
9. Boundary checks prove no direct Supabase application-table access, no direct Supabase Storage business access, no frontend service role key, and no feature component raw `HttpClient`.
10. Scope checks prove no products, inventory, activities, problems/photos, task/calendar behavior, weather forecast, AI, push, backend schema, provider, or MCP work was introduced.

---

# Acceptance Criteria

The task is complete when:

- [ ] Places list/detail/overview pages work.
- [ ] Plants list/search/create/edit/archive pages work.
- [ ] Perennials list/create/edit/archive flow works.
- [ ] Beds list/detail/create/edit/archive flow works.
- [ ] Persistent bed plants add/edit/archive flow works.
- [ ] Yearly plantings add/edit/archive flow works with year selector.
- [ ] API errors are displayed.
- [ ] Forms use Reactive Forms.
- [ ] Archive actions require confirmation and use canonical POST archive endpoints.
- [ ] Persistent and yearly contents remain distinct.
- [ ] No Phase 7 UI sends trusted `accountId`.
- [ ] Static search confirms no direct Supabase application-table access.
- [ ] Frontend tests/typecheck/lint/build pass where configured, or unavailable checks are reported exactly.
- [ ] PR description is ready and includes the required Phase 7 content.

---

# Commands to Run

From the frontend package root, run relevant commands:

```bash
npm run typecheck
npm run lint
npm test
npm run build
```

Run frontend boundary/static checks if configured.

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
Implemented frontend garden structure pages.

## Scope
- Added places, plants, perennials, beds, persistent plant, and yearly planting UI.
- Added typed API services and shared selectors/forms.
- Added validation, archive confirmations, and API error display.

## Domain rules preserved
- Frontend uses Fastify API only.
- Persistent and yearly bed contents remain distinct.
- Archive behavior is used instead of delete.

## Tests
- <commands run and results>

## Deferred work
- Products, inventory, activities, problems, tasks, weather, AI, and push remain deferred.

## Review focus
- Frontend/backend boundary.
- Component structure.
- Reactive Forms and API error handling.
- Mobile usability.
```

---

# Notes for Implementation Agent

Do not redesign the product.

Do not claim tests passed unless they were actually run.

