# Implementation Task - Phase 22 Step 1: Weather API Services and Feature Scaffold

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

Implement the typed frontend Weather API service, DTO/request models, route scaffold, and feature folder structure needed by Phase 22 weather pages and rain confirmation UI.

## Branch

Use branch:

```text
feature/frontend-weather
```

---

# Scope

Implement only:

- [ ] Inspect the existing Angular shell, place-detail routes/tabs, typed API client, auth token interceptor, API error mapper, shared UI controls, calendar/task/activity context components, and test setup from earlier frontend phases.
- [ ] Create a weather feature structure using the existing frontend architecture.
- [ ] Define frontend DTO/request types for forecast responses, disabled weather responses, calendar weather events if needed by later steps, rain confirmation requests, and rain confirmation responses from the canonical API contract.
- [ ] Add typed `WeatherApiService` methods for `GET /api/v1/places/:placeId/weather/forecast` and `POST /api/v1/weather/events/:weatherEventId/confirm-rain`.
- [ ] Use the existing API base client and envelope unwrapping; do not call `HttpClient` directly from feature components.
- [ ] Ensure no service request model includes trusted `accountId`.
- [ ] Add route scaffolding for `/places/:placeId/weather`, replacing only existing Phase 22 placeholders where present.
- [ ] Keep task/activity prompt UI and calendar marker rendering for later Phase 22 steps.
- [ ] Add API service and route tests for canonical paths, request body values, envelope mapping, and no `accountId`.

Expected paths, unless existing code clearly establishes a better equivalent:

```text
frontend/src/app/features/weather/
frontend/src/app/features/weather/data-access/
frontend/src/app/features/weather/pages/
frontend/src/app/features/weather/components/
frontend/src/app/core/api/
frontend/src/app/app.routes.ts
frontend/src/app/features/**/*.spec.ts
```

---

# Out of Scope

Do not implement:

- [ ] Full weather page UI beyond route-safe empty shells needed for wiring.
- [ ] Rain confirmation prompt UI or actions; those are Step 3.
- [ ] Calendar weather marker rendering; that is Step 4.
- [ ] Backend endpoints, weather provider adapters, migrations, scheduler behavior, or weather-event persistence.
- [ ] Direct Open-Meteo calls or frontend weather provider configuration.
- [ ] Frontend rain consequence decisions, treatment invalidation, task cancellation, or planned-task creation.
- [ ] Push notifications, AI advice, deployment, or MCP behavior.

---

# Required Documents

Read before coding:

- [ ] `AGENTS.md`
- [ ] `docs/gardening-helper-implementation-agent-instructions.md`
- [ ] `docs/gardening-helper-ai-implementation-handoff-readme-v1.md`
- [ ] `docs/gardening-helper-implementation-instructions-for-ai-v1.md`
- [ ] `docs/gardening-helper-domain-rules-and-invariants-v1.md` weather invariants and frontend boundary sections
- [ ] `docs/gardening-helper-canonical-api-contract-v1.md` Weather API and shared envelope/error sections
- [ ] `docs/gardening-helper-testing-and-acceptance-spec-v1.md` weather rain prompt and frontend acceptance sections
- [ ] `docs/gardening-helper-frontend-technical-spec-v1.md` route map, API integration, and Weather UX rules
- [ ] `docs/implementation-phases/phase-04-frontend-project-foundation.md`
- [ ] `docs/implementation-phases/phase-07-frontend-garden-structure-pages.md`
- [ ] `docs/implementation-phases/phase-21-backend-weather-and-rain-confirmation.md`
- [ ] `docs/implementation-phases/phase-22-frontend-weather-ux.md`
- [ ] `docs/TASK_TEMPLATE.md`
- [ ] Existing frontend API client, auth/session, routing, place-detail shell, calendar/task/activity components, and test helper files

---

# Domain Rules Affected

This task touches:

- [ ] weather/rain confirmation
- [ ] frontend forms
- [ ] API contract
- [ ] auth/session boundary
- [ ] provider adapter boundary

Important rules to preserve:

```text
Frontend is not business truth.
Frontend never talks directly to the database.
All application data access goes through the Fastify API under /api/v1.
Frontend must not submit accountId for normal flows.
Weather is advisory.
Forecasted rain does not mean rain happened.
The user confirms observed rain.
Rain confirmation does not automatically invalidate treatment.
Open-Meteo is used through WeatherPort backend-side only.
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
- [ ] no direct weather provider calls from frontend code
- [ ] no Open-Meteo URLs or provider secrets in frontend config
- [ ] backend validates JWTs and derives account context server-side
- [ ] account scoping enforced backend-side
- [ ] Supabase Auth used only for auth/session flows
- [ ] Open-Meteo used through `WeatherPort` backend-side

---

# API Contract

Endpoints involved:

```text
GET /api/v1/places/:placeId/weather/forecast
POST /api/v1/weather/events/:weatherEventId/confirm-rain
```

Confirmation request values:

```text
confirmed_yes
confirmed_no
ignored
```

Request/response must follow:

- `docs/gardening-helper-canonical-api-contract-v1.md`

---

# Tests Required

Add or update tests for:

- [ ] API response envelope mapping
- [ ] canonical endpoint paths
- [ ] confirmation request body values
- [ ] disabled forecast response mapping
- [ ] no trusted `accountId`
- [ ] feature route registration
- [ ] boundary/static checks where configured

Specific test cases:

1. `WeatherApiService` fetches forecast through `GET /api/v1/places/:placeId/weather/forecast`.
2. `WeatherApiService` confirms rain through `POST /api/v1/weather/events/:weatherEventId/confirm-rain`.
3. Confirmation request fixtures use only `response` with canonical values and do not include `accountId`.
4. Weather route scaffolding registers `/places/:placeId/weather` through the existing routing pattern.

---

# Acceptance Criteria

The task is complete when:

- [ ] Weather feature scaffolding and route shell exist.
- [ ] Typed Weather API service consumes canonical endpoints through the existing API client.
- [ ] Weather DTO/request types match the canonical contract.
- [ ] No direct provider/table/storage access or raw component `HttpClient` usage is introduced.
- [ ] Focused API service/route tests pass.
