# Implementation Task - Phase 7 Step 1: Garden Structure API Services and Feature Scaffold

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
Create the typed frontend API services, DTO/request models, route scaffolding, and feature folder structure needed by the Phase 7 garden structure pages.
```

## Branch

Use branch:

```text
feature/frontend-garden-structure
```

---

# Scope

Implement only:

- [ ] Inspect the existing Angular shell, routing, typed API client, auth token interceptor, API error mapper, shared UI patterns, and test setup from Phase 4.
- [ ] Create feature folders for `places`, `plants`, `perennials`, `beds`, and `plantings` using the existing frontend architecture.
- [ ] Define frontend DTO/request/filter types for Places, Plants, Perennials, Beds, Persistent Bed Plants, and Yearly Bed Plantings from the canonical API contract.
- [ ] Add typed API services for Phase 5 and Phase 6 endpoints.
- [ ] Use the existing API base client and envelope unwrapping; do not call `HttpClient` directly from feature components.
- [ ] Ensure no service request model includes trusted `accountId`.
- [ ] Add route entries for Phase 7 pages if placeholders exist from Phase 4; replace placeholders only inside this phase's routes.
- [ ] Keep later routes such as activities, problems, calendar, weather, products, inventory, and AI as placeholders or existing navigation entries.
- [ ] Add API service tests that verify canonical paths, query params, request bodies, envelope use, and no `accountId`.

Expected paths, unless existing code clearly establishes a better equivalent:

```text
frontend/src/app/features/places/
frontend/src/app/features/plants/
frontend/src/app/features/perennials/
frontend/src/app/features/beds/
frontend/src/app/features/plantings/
frontend/src/app/features/garden-structure/
frontend/src/app/shared/components/
frontend/src/app/shared/forms/
frontend/src/app/core/api/
frontend/src/app/app.routes.ts
frontend/src/app/features/**/*.spec.ts
```

---

# Out of Scope

Do not implement:

- [ ] Full page UI beyond route-safe empty shells needed for wiring.
- [ ] Create/edit forms; those are later Phase 7 steps.
- [ ] Backend endpoints or migrations.
- [ ] Direct Supabase application-table or storage calls.
- [ ] Activity, product, inventory, problem, task, calendar, weather, AI, push, storage, notification, or MCP behavior.
- [ ] Business decisions that belong to backend services.

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
- [ ] `docs/TASK_TEMPLATE.md`
- [ ] Existing frontend `core/api`, auth/session, routing, shell, shared UI, and test helper files

---

# Domain Rules Affected

This task touches:

- [ ] account scoping
- [ ] frontend forms
- [ ] API contract
- [ ] auth/session boundary

Important rules to preserve:

```text
Frontend is not business truth.
Frontend never talks directly to the database.
Frontend never accesses application tables directly.
All application data access goes through the Fastify API under /api/v1.
Frontend must not submit accountId for normal flows.
Backend derives account scope from the authenticated actor.
Use Supabase Auth only for login/session handling and bearer tokens.
API success and error envelopes must follow the canonical API contract.
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

- [ ] frontend API service
- [ ] frontend DTO/request/filter types
- [ ] feature route scaffolding
- [ ] feature folder structure
- [ ] tests
- [ ] static/boundary check updates if the existing project has a frontend boundary-check pattern

Remove or ignore template items that are not relevant.

---

# Required Infrastructure/Security Boundaries

Preserve these rules:

- [ ] no direct frontend access to application tables
- [ ] no bypass of the Fastify API for application data
- [ ] no business logic in Angular components
- [ ] no Supabase service role key in frontend code/env/build output/logs
- [ ] no direct Supabase Storage business calls
- [ ] backend validates JWTs and derives account context server-side
- [ ] account scoping enforced backend-side
- [ ] Supabase Auth used only for auth/session flows

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

Request/response must follow:

- `docs/gardening-helper-canonical-api-contract-v1.md`

---

# Tests Required

Add or update tests for:

- [ ] happy path
- [ ] API response shape
- [ ] auth/session behavior through existing interceptor tests if touched
- [ ] boundary/security checks
- [ ] edge cases

Specific test cases:

1. Places API service uses `/api/v1/places` endpoints and unwraps canonical envelopes through the existing API client.
2. Plants API service uses canonical plant endpoints and supports `q`, `lifecycleType`, `growingStyle`, `includeArchived`, `page`, and `pageSize`.
3. Perennials API service uses nested place list/create paths and direct detail/update/archive paths.
4. Beds API service uses nested place list/create paths and direct detail/update/archive paths.
5. Persistent bed plants API service uses canonical bed-nested and direct archive/update paths.
6. Yearly plantings API service uses canonical bed-nested and direct archive/update paths with `year` and `status` query params.
7. No Phase 7 API service request body includes `accountId`.
8. Route config maps the Phase 7 URLs without removing later-phase placeholder routes.
9. Raw `HttpClient` remains centralized in core API infrastructure.

---

# Acceptance Criteria

The task is complete when:

- [ ] Typed Phase 7 API services and models exist.
- [ ] API service paths exactly match the canonical API contract.
- [ ] Services use the existing API client/envelope behavior.
- [ ] No frontend code sends trusted `accountId`.
- [ ] Phase 7 route scaffolding exists without implementing later workflows.
- [ ] Tests cover service paths, query params, request bodies, and boundary rules.
- [ ] No backend, schema, provider, MCP, or unrelated frontend workflow changes are introduced.
- [ ] Relevant checks pass or unavailable commands are reported exactly.

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

If any command does not exist or fails due to pre-existing setup, report it clearly.

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

Do not redesign the product.

