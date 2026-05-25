# Implementation Task - Phase 14 Step 1: Activities API Services and Feature Scaffold

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
Create the typed frontend Activities API service, DTO/request models, route scaffolding, and feature folder structure needed by the Phase 14 activities pages and create activity flow.
```

## Branch

Use branch:

```text
feature/frontend-create-activity
```

---

# Scope

Implement only:

- [ ] Inspect the existing Angular shell, routing, typed API client, auth token interceptor, API error mapper, shared UI/form controls, selectors, and test setup from Phase 4, Phase 7, and Phase 10.
- [ ] Create `features/activities` structure using the existing frontend architecture.
- [ ] Define frontend DTO/request/filter types for activities, activity targets, product usage requests, inventory effects, quarantine periods, suggested tasks, warnings, and list/detail filters from the canonical API contract.
- [ ] Add typed `ActivitiesApiService` methods for list, detail, and create endpoints.
- [ ] Use the existing API base client and envelope unwrapping; do not call `HttpClient` directly from feature components.
- [ ] Ensure no service request model includes trusted `accountId`.
- [ ] Add route entries for `/activities`, `/activities/new`, and `/activities/:activityId`, replacing only existing Phase 14 placeholders where present.
- [ ] Keep correction, weather, tasks, AI, problems, push, notifications, and settings routes as placeholders or existing entries.
- [ ] Add API service tests that verify canonical paths, query params, request bodies, envelope use, and no `accountId`.

Expected paths, unless existing code clearly establishes a better equivalent:

```text
frontend/src/app/features/activities/
frontend/src/app/features/activities/data-access/
frontend/src/app/features/activities/pages/
frontend/src/app/shared/selectors/
frontend/src/app/shared/forms/
frontend/src/app/core/api/
frontend/src/app/app.routes.ts
frontend/src/app/features/**/*.spec.ts
```

---

# Out of Scope

Do not implement:

- [ ] Full page UI beyond route-safe empty shells needed for wiring.
- [ ] Bulk target selector, product usage form array, or create activity form; those are later Phase 14 steps.
- [ ] Backend endpoints, migrations, services, repositories, target resolver, or activity transaction logic.
- [ ] Direct Supabase application-table or storage calls.
- [ ] Frontend target resolution as business truth.
- [ ] Frontend inventory allocation, FEFO allocation, quarantine generation, suggested task generation, or stock mutation logic.
- [ ] Activity correction, weather rain prompts, task confirmation, AI suggestions, problems/photos, push, storage, notification, provider, deployment, or MCP behavior.

---

# Required Documents

Read before coding:

- [ ] `AGENTS.md`
- [ ] `docs/gardening-helper-implementation-agent-instructions.md`
- [ ] `docs/gardening-helper-ai-implementation-handoff-readme-v1.md`
- [ ] `docs/gardening-helper-implementation-instructions-for-ai-v1.md`
- [ ] `docs/gardening-helper-domain-rules-and-invariants-v1.md`
- [ ] `docs/gardening-helper-canonical-api-contract-v1.md` Activities API and shared enum/target sections
- [ ] `docs/gardening-helper-testing-and-acceptance-spec-v1.md`
- [ ] `docs/gardening-helper-frontend-technical-spec-v1.md` activities, routing, API service, form, state, and boundary sections
- [ ] `docs/implementation-phases/phase-04-frontend-project-foundation.md`
- [ ] `docs/implementation-phases/phase-07-frontend-garden-structure-pages.md`
- [ ] `docs/implementation-phases/phase-10-frontend-products-and-inventory-pages.md`
- [ ] `docs/implementation-phases/phase-12-backend-activity-transaction-flow.md`
- [ ] `docs/implementation-phases/phase-14-frontend-activities-and-create-activity-flow.md`
- [ ] `docs/TASK_TEMPLATE.md`
- [ ] Existing frontend `core/api`, auth/session, routing, shell, shared UI, selectors, forms, and test helper files

---

# Domain Rules Affected

This task touches:

- [ ] account scoping
- [ ] target resolution
- [ ] activities
- [ ] inventory
- [ ] product usage rules
- [ ] quarantine
- [ ] tasks/reminders
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
Activity/task targets must resolve to concrete target rows backend-side.
Frontend must not calculate concrete resolved target rows as final truth.
Frontend must not allocate inventory across lots.
Frontend must display backend-returned side effects and warnings.
API success, list, mutation, and error envelopes must follow the canonical API contract.
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
- [ ] no target resolution truth, FEFO allocation, stock mutation, quarantine generation, or suggested-task generation in frontend code

---

# API Contract

Endpoints involved:

```text
GET /api/v1/activities
POST /api/v1/activities
GET /api/v1/activities/:activityId
Supporting selector/list endpoints for places, beds, perennials, yearly plantings, persistent plants, products, and rules
```

Request/response must follow:

- `docs/gardening-helper-canonical-api-contract-v1.md`

---

# Tests Required

Add or update tests for:

- [ ] API response envelope mapping
- [ ] canonical endpoint paths and query params
- [ ] create request shape
- [ ] no trusted `accountId`
- [ ] feature route registration
- [ ] boundary/static checks where configured

Specific test cases:

1. `ActivitiesApiService` lists activities through `GET /api/v1/activities` with filters using canonical query params.
2. `ActivitiesApiService` fetches detail through `GET /api/v1/activities/:activityId`.
3. `ActivitiesApiService` creates activities through `POST /api/v1/activities` with canonical target and product usage fields.
4. Create request models and test fixtures do not include `accountId`.

---

# Acceptance Criteria

The task is complete when:

- [ ] Activities feature scaffolding and routes exist.
- [ ] Typed Activities API service consumes canonical endpoints through the existing API client.
- [ ] Activity DTO/request/filter types match the canonical contract.
- [ ] No direct table/storage access or raw component `HttpClient` usage is introduced.
- [ ] Focused API service/route tests pass.
