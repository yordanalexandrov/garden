# Implementation Task - Phase 19 Step 1: Calendar/Dashboard Module Contracts, Validation, and Route Wiring

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
Prepare backend calendar/dashboard read-model contracts, query validation, DTO types, and narrow route wiring for Phase 19 read APIs.
```

## Branch

Use branch:

```text
feature/backend-calendar-dashboard
```

---

# Scope

Implement only:

- [ ] Inspect existing backend app route registration, authenticated actor context, envelope helpers, validation helpers, error helpers, database client, and test patterns.
- [ ] Confirm Phase 12 activity/quarantine/suggested task data, Phase 15 problem data, and Phase 18 task/reminder data exist before implementing route behavior; if a prerequisite is absent, stop and document the prerequisite gap.
- [ ] Create calendar/dashboard module structure following local conventions.
- [ ] Define request/query types for `GET /api/v1/calendar` and `GET /api/v1/dashboard`.
- [ ] Define calendar DTO types for `activities`, `tasks`, `quarantinePeriods`, and `weatherEvents`.
- [ ] Define dashboard DTO types for `upcomingTasks`, `suggestedTasks`, `activeQuarantinePeriods`, `recentActivities`, `openProblems`, `lowStockProducts`, and `places`.
- [ ] Add validation schemas for required calendar `from`, required calendar `to`, optional `placeId`, and optional dashboard `placeId`.
- [ ] Validate date ranges without changing business data; reject missing `from`/`to` with canonical `VALIDATION_ERROR`.
- [ ] Add DTO mapping helpers that convert repository/database snake_case rows to canonical camelCase fields.
- [ ] Add route registration and dependency wiring without opening database connections at import time.
- [ ] Keep controllers thin and delegate reads to services.
- [ ] Add focused validation/DTO tests where existing test style supports them.

Expected paths, unless existing code clearly establishes a better equivalent:

```text
backend/src/modules/calendar/calendar.types.ts
backend/src/modules/calendar/calendar.validation.ts
backend/src/modules/calendar/calendar.dto.ts
backend/src/modules/calendar/calendar.routes.ts
backend/src/modules/calendar/calendar.service.ts
backend/src/modules/calendar/calendar.repository.ts
backend/src/modules/dashboard/dashboard.types.ts
backend/src/modules/dashboard/dashboard.dto.ts
backend/src/modules/dashboard/dashboard.routes.ts
backend/src/modules/dashboard/dashboard.service.ts
backend/src/modules/dashboard/dashboard.repository.ts
backend/src/app/routes.ts
backend/test/calendar/
backend/test/dashboard/
```

---

# Out of Scope

Do not implement:

- [ ] Repository SQL beyond interfaces/stubs needed for wiring.
- [ ] Full service aggregation beyond interface/stub behavior needed for later steps.
- [ ] Calendar item mutations or writable calendar records.
- [ ] Task confirmation, dismissal, completion, reminder generation, or other Phase 18 mutation behavior.
- [ ] Weather generation or calls to `WeatherPort`.
- [ ] Frontend pages or frontend API services.
- [ ] Push, worker/scheduler, AI, storage, deployment, or MCP behavior.
- [ ] Schema changes or migrations.
- [ ] Raw `calendar_items_view` rows in API responses.

---

# Required Documents

Read before coding:

- [ ] `AGENTS.md`
- [ ] `docs/gardening-helper-implementation-agent-instructions.md`
- [ ] `docs/gardening-helper-ai-implementation-handoff-readme-v1.md`
- [ ] `docs/gardening-helper-implementation-instructions-for-ai-v1.md`
- [ ] `docs/gardening-helper-domain-rules-and-invariants-v1.md` sections 14, 15, and 16
- [ ] `docs/gardening-helper-canonical-api-contract-v1.md` sections 20.1 and 24.1
- [ ] `docs/gardening-helper-testing-and-acceptance-spec-v1.md` calendar/dashboard aggregation and API response sections
- [ ] `docs/gardening-helper-backend-application-design-pack-v1.md` CalendarService and API response sections
- [ ] `docs/gardening-helper-technical-requirements-and-erd.md`
- [ ] `docs/001_initial_schema_gardening_helper.sql`
- [ ] `docs/002_views_gardening_helper.sql`
- [ ] `docs/004_guards_and_triggers_gardening_helper.sql`
- [ ] `docs/implementation-phases/phase-12-backend-activity-transaction-flow.md`
- [ ] `docs/implementation-phases/phase-15-backend-problems-and-observations-api.md`
- [ ] `docs/implementation-phases/phase-18-backend-task-lifecycle-and-reminders.md`
- [ ] `docs/implementation-phases/phase-19-backend-calendar-and-dashboard-read-apis.md`
- [ ] `docs/TASK_TEMPLATE.md`
- [ ] Existing backend app, auth, route registration, validation, error, DTO, db, transaction, and test helper files touched by the task.

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
- [ ] database/migrations
- [ ] auth/session boundary

Important rules to preserve:

```text
Backend owns business logic.
Controllers stay thin.
Services orchestrate workflows.
Repositories only access data.
Calendar is a read model, not a source of truth.
Calendar item types must remain distinguishable.
Quarantine periods are read-only overlays.
Changing calendar filters only changes display.
Suggested tasks are not planned tasks.
Reminders are created only for planned tasks.
Weather is advisory and must not be generated or confirmed by calendar/dashboard reads.
API responses must not leak inaccessible data.
```

---

# MCP Impact

This task:

- [ ] changes backend behavior used by future MCP tools

MCP tools affected:

```text
None in Phase 19. Future calendar/dashboard MCP tools must use backend services/API and must not query tables directly.
```

Required MCP documentation updates:

```text
None.
```

---

# Required Implementation Details

Implement:

- [ ] backend route wiring
- [ ] backend validation schema
- [ ] backend module/domain types
- [ ] DTO mapping helpers
- [ ] authenticated actor/dependency access conventions
- [ ] tests

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
- [ ] backend validates JWTs and derives account context server-side
- [ ] account scoping enforced backend-side
- [ ] no `WeatherPort`, `PushPort`, `StoragePort`, or AI provider calls in Phase 19 reads

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

- [ ] validation errors
- [ ] API response shape
- [ ] route wiring
- [ ] DTO mapping

Specific test cases:

1. Calendar query validation rejects missing `from`.
2. Calendar query validation rejects missing `to`.
3. Calendar/dashboard DTO helpers produce camelCase contract-compatible sections.
4. Route registration keeps endpoints authenticated and under `/api/v1`.

---

# Acceptance Criteria

The task is complete when:

- [ ] Calendar/dashboard module contracts, validation, and DTO helpers exist.
- [ ] Route wiring follows existing backend conventions.
- [ ] No read endpoint mutates data or calls external providers.
- [ ] Tests are added/updated for validation and DTO helpers where local style supports it.
- [ ] No unrelated changes are included.

---

# Commands to Run

Run relevant commands from the backend package root:

```bash
npm run typecheck
npm run lint
npm test
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
