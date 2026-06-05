# Implementation Task - Phase 21 Step 1: Weather Module Contracts, Validation, and Route Wiring

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
Prepare the backend weather module contracts, validation schemas, DTO mapping, and route wiring needed for Phase 21 forecast and rain confirmation APIs.
```

## Branch

Use branch:

```text
feature/backend-weather-rain
```

---

# Scope

Implement only:

- [ ] Inspect existing backend app, route registration, auth actor context, config, dependency injection, envelope helpers, validation helpers, places module, tasks/activities modules, calendar read patterns, and test helper patterns.
- [ ] Confirm Phase 5 places API exists before forecast work; if it is absent, stop and document the prerequisite gap.
- [ ] Confirm Phase 18 task lifecycle and Phase 19 calendar/dashboard context exist if the implementation links weather events to tasks/calendar; if either is absent, limit this step to contracts/wiring and document the prerequisite gap.
- [ ] Create `backend/src/modules/weather/` structure following existing backend module conventions.
- [ ] Define weather domain/input/DTO types for forecast responses, forecast day items, weather events, rain confirmation request/response, and provider-normalized forecast results.
- [ ] Define canonical enum constants for `RainConfirmationResponse`, weather event type values, related entity type values, and user confirmation status values.
- [ ] Define validation schemas for UUID params and rain confirmation payloads.
- [ ] Define DTO mapping helpers that convert database snake_case fields to canonical API camelCase fields.
- [ ] Add route registration and dependency wiring for weather routes without opening database connections or calling Open-Meteo at import time.
- [ ] Preserve `GET /api/v1/health` as unauthenticated and keep test-only routes isolated.
- [ ] Add focused validation/schema/DTO tests where existing test style supports them.

Expected paths, unless existing code clearly establishes a better equivalent:

```text
backend/src/modules/weather/weather.types.ts
backend/src/modules/weather/weather.validation.ts
backend/src/modules/weather/weather.dto.ts
backend/src/modules/weather/weather.routes.ts
backend/src/modules/weather/weather.service.ts
backend/src/modules/weather/weather.repository.ts
backend/src/app/routes.ts
backend/test/weather/
```

---

# Out of Scope

Do not implement:

- [ ] Open-Meteo provider calls; that belongs to Step 2.
- [ ] Forecast service behavior beyond interface stubs needed for wiring; that belongs to Step 3.
- [ ] Rain confirmation persistence behavior beyond validation/DTO helpers; that belongs to Step 4.
- [ ] Scheduled weather worker behavior.
- [ ] Frontend weather UX, push notifications, AI weather advice, deployment changes, or MCP tools.
- [ ] Weather-based treatment failure, treatment cancellation, task cancellation, follow-up task creation, or planned task creation.
- [ ] Schema changes or migrations.
- [ ] Direct Open-Meteo calls from frontend or core services.

---

# Required Documents

Read before coding:

- [ ] `AGENTS.md`
- [ ] `docs/gardening-helper-implementation-agent-instructions.md`
- [ ] `docs/gardening-helper-ai-implementation-handoff-readme-v1.md`
- [ ] `docs/gardening-helper-implementation-instructions-for-ai-v1.md`
- [ ] `docs/gardening-helper-domain-rules-and-invariants-v1.md` sections 2.1, 3.5, 5.2, and 5.3
- [ ] `docs/gardening-helper-canonical-api-contract-v1.md` sections 5.16, 8, and 21
- [ ] `docs/gardening-helper-testing-and-acceptance-spec-v1.md` weather/rain confirmation sections
- [ ] `docs/gardening-helper-backend-application-design-pack-v1.md` WeatherRepository, WeatherPort, and RecordRainConfirmation sections
- [ ] `docs/gardening-helper-technical-requirements-and-erd.md` place weather fields and `weather_events`
- [ ] `docs/001_initial_schema_gardening_helper.sql`
- [ ] `docs/004_guards_and_triggers_gardening_helper.sql`
- [ ] `docs/implementation-phases/phase-21-backend-weather-and-rain-confirmation.md`
- [ ] `docs/TASK_TEMPLATE.md`
- [ ] Existing backend app, config, places, tasks, activities, calendar, route, validation, error, and test helper files touched by the task.

---

# Domain Rules Affected

This task touches:

- [ ] account scoping
- [ ] tasks/reminders
- [ ] weather/rain confirmation
- [ ] API contract
- [ ] database/migrations
- [ ] auth/session boundary
- [ ] provider adapter boundary
- [ ] worker/scheduler responsibility
- [ ] MCP tools / agent interface

Important rules to preserve:

```text
Backend owns business logic.
Controllers stay thin.
Services orchestrate workflows.
Repositories only access data.
Open-Meteo is used through WeatherPort.
Weather is advisory and not business truth.
Observed rain is user-confirmed.
Weather-disabled places require no forecast context and no rain prompt.
If weather is enabled, the place must have explicit weather location data.
Rain confirmation must not automatically fail treatments, cancel tasks, create follow-up tasks, or create planned tasks.
The Fastify API remains the application data API under /api/v1.
MCP tools are not a privileged bypass channel and must call backend services/API.
```

---

# MCP Impact

This task:

- [ ] changes backend behavior used by future MCP tools

MCP tools affected:

```text
Future weather.confirm_rain MCP tooling must call the backend service/API and preserve confirmation/account/audit boundaries.
```

Required MCP documentation updates:

```text
None in Phase 21 unless existing MCP docs reference a changed weather API path or payload.
```

---

# Required Implementation Details

Implement:

- [ ] backend controller/route
- [ ] backend validation schema
- [ ] backend module/domain types
- [ ] DTO mapping helpers
- [ ] route dependency wiring
- [ ] authenticated actor/dependency access conventions
- [ ] tests
- [ ] docs/update notes only if backend startup or dependency injection commands change

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
- [ ] Open-Meteo used through `WeatherPort`
- [ ] worker/scheduler ownership is explicit if weather checks are touched

---

# API Contract

Endpoints involved:

```text
GET /api/v1/places/:placeId/weather/forecast
POST /api/v1/weather/events/:weatherEventId/confirm-rain
```

Request/response must follow:

- `docs/gardening-helper-canonical-api-contract-v1.md` section 21

---

# Tests Required

Add or update tests for:

- [ ] validation errors
- [ ] API response shape
- [ ] DTO mapping
- [ ] edge cases

Specific test cases:

1. Rain confirmation validation accepts only `confirmed_yes`, `confirmed_no`, and `ignored`.
2. Weather forecast DTO maps canonical camelCase fields and does not expose provider-specific payload as the canonical response.
3. Rain confirmation DTO maps `user_confirmation_status` and `observed_rain` to `userConfirmationStatus` and `observedRain`.
4. Route registration keeps weather endpoints authenticated and health endpoint unauthenticated.

---

# Acceptance Criteria

The task is complete when:

- [ ] Weather module contracts, validation schemas, DTO helpers, and route wiring exist.
- [ ] Canonical endpoint paths are registered or prepared using existing backend route conventions.
- [ ] Provider calls and persistence behavior are still deferred to later Phase 21 steps.
- [ ] Tests cover the validation/DTO/wiring introduced in this step.
- [ ] No frontend, schema, worker, push, AI, or autonomous weather side-effect work is included.

---

# Commands to Run

From the backend package root, run relevant commands:

```bash
npm run typecheck
npm run lint
npm test
```

If a command is unavailable or fails due to pre-existing setup, report the exact command, exit state, and reason. Never claim checks passed unless they were run.
