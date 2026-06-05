# Implementation Task - Phase 19 Step 4: Calendar/Dashboard Routes and API Contract

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
Expose GET /api/v1/calendar and GET /api/v1/dashboard through thin Fastify routes with canonical envelopes, validation, and error handling.
```

## Branch

Use branch:

```text
feature/backend-calendar-dashboard
```

---

# Scope

Implement only:

- [ ] Inspect existing route/controller patterns for authenticated read endpoints.
- [ ] Wire `GET /api/v1/calendar` to `CalendarService.getCalendarFeed`.
- [ ] Wire `GET /api/v1/dashboard` to the dashboard read service.
- [ ] Ensure both endpoints require authentication and derive account scope from the backend actor context.
- [ ] Ensure calendar `from` and `to` are required query parameters.
- [ ] Ensure optional `placeId` uses UUID validation and backend account-scoped authorization.
- [ ] Return canonical success envelope `{ "data": ... }`.
- [ ] Return canonical error envelopes for validation, auth, forbidden/not-found place filter, and unexpected errors according to local conventions.
- [ ] Preserve calendar response section names exactly: `activities`, `tasks`, `quarantinePeriods`, `weatherEvents`.
- [ ] Preserve dashboard bucket names exactly: `upcomingTasks`, `suggestedTasks`, `activeQuarantinePeriods`, `recentActivities`, `openProblems`, `lowStockProducts`, `places`.
- [ ] Keep API DTO fields camelCase and avoid exposing raw database column names or `calendar_items_view` internals.
- [ ] Add route/API tests for status codes and response envelopes.

Expected paths, unless existing code clearly establishes a better equivalent:

```text
backend/src/modules/calendar/calendar.routes.ts
backend/src/modules/dashboard/dashboard.routes.ts
backend/src/app/routes.ts
backend/test/calendar/
backend/test/dashboard/
```

---

# Out of Scope

Do not implement:

- [ ] New mutations under `/calendar` or `/dashboard`.
- [ ] Task lifecycle mutation endpoints.
- [ ] Activity/problem/inventory mutation endpoints.
- [ ] Weather provider calls, rain confirmation, push notification, worker, AI, or MCP behavior.
- [ ] Frontend pages or frontend API services.
- [ ] Schema changes or migrations.

---

# Required Documents

Read before coding:

- [ ] `AGENTS.md`
- [ ] `docs/gardening-helper-implementation-agent-instructions.md`
- [ ] `docs/gardening-helper-ai-implementation-handoff-readme-v1.md`
- [ ] `docs/gardening-helper-implementation-instructions-for-ai-v1.md`
- [ ] `docs/gardening-helper-domain-rules-and-invariants-v1.md` sections 14, 15, and 16
- [ ] `docs/gardening-helper-canonical-api-contract-v1.md` sections 2, 3, 20.1, and 24.1
- [ ] `docs/gardening-helper-testing-and-acceptance-spec-v1.md` API contract/calendar/dashboard sections
- [ ] `docs/gardening-helper-backend-application-design-pack-v1.md` API design conventions and CalendarService sections
- [ ] `docs/implementation-phases/phase-18-backend-task-lifecycle-and-reminders.md`
- [ ] `docs/implementation-phases/phase-19-backend-calendar-and-dashboard-read-apis.md`
- [ ] `docs/TASK_TEMPLATE.md`
- [ ] Existing auth plugin, route registration, envelope, validation, error mapper, and route test helper files touched by the task.

---

# Domain Rules Affected

This task touches:

- [ ] account scoping
- [ ] activities
- [ ] inventory
- [ ] quarantine
- [ ] tasks/reminders
- [ ] problems/photos
- [ ] weather/rain confirmation
- [ ] API contract
- [ ] auth/session boundary

Important rules to preserve:

```text
Backend owns business logic.
Controllers stay thin.
Calendar and dashboard are read-only read models.
Calendar item types must remain distinguishable.
Suggested tasks are not planned tasks.
Reminders are created only for planned tasks.
Calendar/dashboard filters must not change business data.
API responses must not leak inaccessible data.
```

---

# MCP Impact

This task:

- [ ] changes backend behavior used by future MCP tools

MCP tools affected:

```text
None in Phase 19.
```

Required MCP documentation updates:

```text
None.
```

---

# Required Implementation Details

Implement:

- [ ] backend controller/route
- [ ] backend validation schema
- [ ] backend service method invocation
- [ ] tests

Remove or ignore template items that are not relevant.

---

# Required Infrastructure/Security Boundaries

Preserve these rules:

- [ ] no direct frontend access to application tables
- [ ] no bypass of the Fastify API for application data
- [ ] no business side-effect orchestration in database triggers
- [ ] backend validates JWTs and derives account context server-side
- [ ] account scoping enforced backend-side
- [ ] no provider calls from read routes

---

# API Contract

Endpoints involved:

```text
GET /api/v1/calendar
GET /api/v1/dashboard
```

Request/response must follow:

- `docs/gardening-helper-canonical-api-contract-v1.md`
- Canonical success and error envelopes

---

# Tests Required

Add or update tests for:

- [ ] happy path
- [ ] validation errors
- [ ] account scoping
- [ ] API response shape
- [ ] edge cases

Specific test cases:

1. `GET /api/v1/calendar?from=...&to=...` returns `{ data: { activities, tasks, quarantinePeriods, weatherEvents } }`.
2. `GET /api/v1/calendar` without `from` or `to` returns canonical `VALIDATION_ERROR`.
3. `GET /api/v1/dashboard` returns `{ data: { upcomingTasks, suggestedTasks, activeQuarantinePeriods, recentActivities, openProblems, lowStockProducts, places } }`.
4. Cross-account or inaccessible `placeId` is rejected or behaves as not found according to existing route conventions.
5. Unauthenticated requests are rejected according to the existing auth boundary.

---

# Acceptance Criteria

The task is complete when:

- [ ] Both read endpoints are registered under `/api/v1`.
- [ ] Both endpoints are authenticated and account-scoped.
- [ ] Response envelopes and section/bucket names match the canonical contract.
- [ ] Validation and error responses use canonical envelopes.
- [ ] No mutation behavior is introduced.
- [ ] No unrelated changes are included.

---

# Commands to Run

Run relevant commands from the backend package root:

```bash
npm run typecheck
npm run lint
npm test
npm run test:db
```

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
