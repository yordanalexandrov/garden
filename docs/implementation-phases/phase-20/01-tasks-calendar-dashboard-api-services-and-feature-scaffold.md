# Implementation Task - Phase 20 Step 1: Tasks, Calendar, and Dashboard API Services and Feature Scaffold

## Role

You are the **Implementation Agent**.

Use `AGENTS.md`, `docs/gardening-helper-implementation-agent-instructions.md`, `docs/gardening-helper-ai-implementation-handoff-readme-v1.md`, and all relevant specs for this task.

Final infrastructure/provider decisions: Hetzner VPS + Docker Compose; self-hosted Supabase Postgres/Auth/Storage through backend-owned ports; Open-Meteo through `WeatherPort`; raw Web Push with VAPID through `PushPort`; hybrid correction workflow. The application data API remains the Fastify API under `/api/v1`.

---

# Task

## Goal

Implement:

```text
Create typed frontend Tasks, Calendar, and Dashboard API services, DTO/request models, route scaffolding, and feature folders needed by Phase 20 pages.
```

## Branch

Use branch:

```text
feature/frontend-tasks-calendar
```

---

# Scope

Implement only:

- [ ] Inspect the existing Angular shell, routing, typed API client, auth token interceptor, API error mapper, shared UI/form controls, status chips, selectors, and test setup from earlier frontend phases.
- [ ] Create `features/tasks`, `features/calendar`, and `features/dashboard` structure using the existing frontend architecture.
- [ ] Define frontend DTO/request/filter types for tasks, task targets, reminders, weather-event read models, calendar items, quarantine calendar ranges, and dashboard widgets from the canonical API contract.
- [ ] Add typed `TasksApiService` methods for list, create manual task if included by the route plan, detail, update editable fields, confirm, dismiss, complete, and skip.
- [ ] Add typed `CalendarApiService` method for `GET /calendar` using canonical `from`, `to`, and optional `placeId` query params.
- [ ] Add typed `DashboardApiService` method for `GET /dashboard` using optional `placeId`.
- [ ] Use the existing API base client and envelope unwrapping; do not call `HttpClient` directly from feature components.
- [ ] Ensure no request model includes trusted `accountId`.
- [ ] Add route entries for `/dashboard`, `/calendar`, and `/tasks/:taskId`, replacing only existing Phase 20 placeholders where present.
- [ ] Keep weather UX, AI, push notifications, notification settings, and backend-only worker behavior as placeholders or existing entries.
- [ ] Add API service and route tests that verify canonical paths, query params, request bodies, envelope use, mutation methods, and no `accountId`.

Expected paths, unless existing code clearly establishes a better equivalent:

```text
frontend/src/app/features/tasks/
frontend/src/app/features/calendar/
frontend/src/app/features/dashboard/
frontend/src/app/core/api/
frontend/src/app/app.routes.ts
frontend/src/app/features/**/*.spec.ts
```

---

# Out of Scope

Do not implement:

- [ ] Full page UI beyond route-safe shells needed for wiring.
- [ ] Dashboard widgets, task detail behavior, task actions, calendar rendering, or calendar item interactions; those are later Phase 20 steps.
- [ ] Backend endpoints, migrations, services, repositories, reminder scheduler, calendar aggregation, or dashboard aggregation.
- [ ] Frontend-created reminders, reminder timers, or worker behavior.
- [ ] Direct Supabase application-table, PostgREST, or Storage calls.
- [ ] Frontend business truth for task confirmation, reminder creation, target resolution, calendar aggregation, quarantine periods, weather decisions, or AI acceptance.
- [ ] Push notification registration, weather rain confirmation, AI pages, provider, deployment, or MCP behavior.

---

# Required Documents

Read before coding:

- [ ] `AGENTS.md`
- [ ] `docs/gardening-helper-implementation-agent-instructions.md`
- [ ] `docs/gardening-helper-ai-implementation-handoff-readme-v1.md`
- [ ] `docs/gardening-helper-implementation-instructions-for-ai-v1.md`
- [ ] `docs/gardening-helper-domain-rules-and-invariants-v1.md`
- [ ] `docs/gardening-helper-canonical-api-contract-v1.md` shared enum, Tasks API, Calendar API, and Dashboard API sections
- [ ] `docs/gardening-helper-testing-and-acceptance-spec-v1.md`
- [ ] `docs/gardening-helper-frontend-technical-spec-v1.md` dashboard, calendar, task detail, API service, state, routing, and boundary sections
- [ ] `docs/implementation-phases/phase-04-frontend-project-foundation.md`
- [ ] `docs/implementation-phases/phase-07-frontend-garden-structure-pages.md`
- [ ] `docs/implementation-phases/phase-18-backend-task-lifecycle-and-reminders.md`
- [ ] `docs/implementation-phases/phase-19-backend-calendar-and-dashboard-read-apis.md`
- [ ] `docs/implementation-phases/phase-20-frontend-tasks-calendar-and-dashboard.md`
- [ ] `docs/TASK_TEMPLATE.md`
- [ ] Existing frontend `core/api`, auth/session, routing, shell, shared UI, selectors, status chips, forms, and test helper files

---

# Domain Rules Affected

This task touches account scoping, target resolution, quarantine, tasks/reminders, weather/rain confirmation, frontend forms, API contract, and auth/session boundary.

Important rules to preserve:

```text
Frontend is not business truth.
Frontend never talks directly to the database.
Frontend never accesses application tables directly.
All application data access goes through the Fastify API under /api/v1.
Frontend must not submit accountId for normal flows.
Backend derives account scope from the authenticated actor.
Suggested tasks are not planned tasks.
Reminders are created only for planned tasks through backend workflows.
Calendar is a read-only display/read model.
Quarantine is a read-only overlay in frontend calendar UI.
API success, list, mutation, and error envelopes must follow the canonical API contract.
```

---

# MCP Impact

This task has no MCP impact.

---

# Required Implementation Details

Implement frontend API services, DTO/request/filter types, feature route scaffolding, feature folder structure, tests, and static/boundary check updates if the existing project has a frontend boundary-check pattern.

---

# Required Infrastructure/Security Boundaries

Preserve: no direct frontend access to application tables; no Fastify API bypass; no business logic in Angular components; no Supabase service role key in frontend code/env/build output/logs; no direct Supabase Storage business calls; backend owns JWT/account context; no frontend reminder scheduler/timer; no frontend task confirmation/reminder side-effect orchestration; no frontend calendar or quarantine mutation path.

---

# API Contract

Endpoints involved:

```text
GET /api/v1/tasks
POST /api/v1/tasks
GET /api/v1/tasks/:taskId
PATCH /api/v1/tasks/:taskId
POST /api/v1/tasks/:taskId/confirm
POST /api/v1/tasks/:taskId/dismiss
POST /api/v1/tasks/:taskId/complete
POST /api/v1/tasks/:taskId/skip
GET /api/v1/calendar
GET /api/v1/dashboard
```

Request/response must follow `docs/gardening-helper-canonical-api-contract-v1.md`.

---

# Tests Required

Add or update tests for API response envelope mapping, canonical endpoint paths/query params, task mutation methods, dashboard/calendar query params, no trusted `accountId`, feature route registration, and boundary/static checks where configured.

Specific test cases:

1. `TasksApiService` lists tasks through `GET /api/v1/tasks` with status/type/place/due-range pagination filters using canonical query params.
2. `TasksApiService` calls detail, update, confirm, dismiss, complete, and skip canonical task endpoints and unwraps canonical envelopes.
3. `CalendarApiService` calls `GET /api/v1/calendar` with required `from`/`to` and optional `placeId`.
4. `DashboardApiService` calls `GET /api/v1/dashboard` with optional `placeId`.
5. Request models and test fixtures do not include `accountId` or reminder creation payloads.

---

# Acceptance Criteria

- [ ] Tasks, Calendar, and Dashboard feature scaffolding and routes exist.
- [ ] Typed API services consume canonical endpoints through the existing API client.
- [ ] DTO/request/filter types match the canonical contract for Phase 20 consumers.
- [ ] No direct table/storage access, raw component `HttpClient`, trusted `accountId`, or frontend reminder side-effect code is introduced.
- [ ] Focused API service/route tests pass.
