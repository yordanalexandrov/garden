# Implementation Task - Phase 21 Step 4: Rain Confirmation Service and Route

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
Implement backend-owned user rain confirmation persistence for weather rain-check events.
```

## Branch

Use branch:

```text
feature/backend-weather-rain
```

---

# Scope

Implement only:

- [ ] Inspect existing authenticated mutation routes, service transaction conventions, weather repository helpers, tasks/activities status fields, audit helper conventions if present, and route tests.
- [ ] Implement `WeatherService.confirmRain(actor, weatherEventId, response)`.
- [ ] Account-scope weather event lookup using the authenticated actor.
- [ ] Validate that the weather event exists and belongs to the actor account.
- [ ] Validate that `event_type = rain_check`; reject other event types with a canonical validation/business error.
- [ ] Map response exactly:
  - [ ] `confirmed_yes` -> `user_confirmation_status = confirmed_yes`, `observed_rain = true`
  - [ ] `confirmed_no` -> `user_confirmation_status = confirmed_no`, `observed_rain = false`
  - [ ] `ignored` -> `user_confirmation_status = ignored`, `observed_rain = null`
- [ ] Persist only the weather event fields and optional audit log if the audit pattern already exists.
- [ ] Return canonical response with `id`, `userConfirmationStatus`, and `observedRain`.
- [ ] Ensure confirmation does not mutate activity status, task status, reminders, quarantine, inventory, or planned/suggested task state.
- [ ] Add API/service tests for yes/no/ignore, event type validation, account scoping, and no autonomous side effects.

Expected paths, unless existing code clearly establishes a better equivalent:

```text
backend/src/modules/weather/weather.repository.ts
backend/src/modules/weather/weather.service.ts
backend/src/modules/weather/weather.routes.ts
backend/test/weather/
```

---

# Out of Scope

Do not implement:

- [ ] Forecast retrieval changes except what is required to share repository/service types.
- [ ] Scheduled rain-check worker.
- [ ] Frontend rain confirmation UX.
- [ ] Push notifications.
- [ ] AI weather advice.
- [ ] Treatment failure, treatment cancellation, task cancellation, follow-up task creation, or planned task creation from weather.
- [ ] Reminder creation or cancellation.
- [ ] Inventory/quarantine changes.
- [ ] Schema changes or migrations unless a blocking mismatch is documented.

---

# Required Documents

Read before coding:

- [ ] `AGENTS.md`
- [ ] `docs/gardening-helper-implementation-agent-instructions.md`
- [ ] `docs/gardening-helper-ai-implementation-handoff-readme-v1.md`
- [ ] `docs/gardening-helper-implementation-instructions-for-ai-v1.md`
- [ ] `docs/gardening-helper-domain-rules-and-invariants-v1.md` sections 3.5 and weather/rain invariants
- [ ] `docs/gardening-helper-canonical-api-contract-v1.md` sections 5.16 and 21.2
- [ ] `docs/gardening-helper-testing-and-acceptance-spec-v1.md` rain confirmation sections
- [ ] `docs/gardening-helper-backend-application-design-pack-v1.md` WeatherRepository and RecordRainConfirmation sections
- [ ] `docs/gardening-helper-technical-requirements-and-erd.md` `weather_events`, tasks, activities, and audit sections
- [ ] `docs/001_initial_schema_gardening_helper.sql`
- [ ] `docs/004_guards_and_triggers_gardening_helper.sql`
- [ ] `docs/implementation-phases/phase-21-backend-weather-and-rain-confirmation.md`
- [ ] `docs/TASK_TEMPLATE.md`
- [ ] Existing backend weather, tasks, activities, audit, route, validation, transaction, error, repository, and test helper files.

---

# Domain Rules Affected

This task touches:

- [ ] account scoping
- [ ] activities
- [ ] tasks/reminders
- [ ] weather/rain confirmation
- [ ] API contract
- [ ] database/migrations
- [ ] auth/session boundary
- [ ] MCP tools / agent interface

Important rules to preserve:

```text
Weather is advisory and not business truth.
Rain actually happened only when the user confirms it.
Rain confirmation must not automatically fail treatments.
Rain confirmation must not cancel tasks.
Rain confirmation must not create follow-up tasks.
Rain confirmation must not create planned tasks.
Reminders are created only for planned tasks, not from weather confirmation.
The backend derives account scope from the authenticated actor.
MCP weather confirmation must use backend services/API and must not bypass account scoping or confirmation rules.
```

---

# MCP Impact

This task:

- [ ] changes backend behavior used by future MCP tools

MCP tools affected:

```text
weather.confirm_rain
```

Required MCP documentation updates:

```text
None unless backend endpoint path, payload, or confirmation behavior differs from existing MCP design. Do not introduce such a difference without documenting the source-of-truth reason.
```

---

# Required Implementation Details

Implement:

- [ ] backend controller/route
- [ ] backend validation schema
- [ ] backend service method
- [ ] repository methods
- [ ] transaction handling if the local mutation pattern requires it
- [ ] optional audit integration if already locally established
- [ ] tests

---

# Required Infrastructure/Security Boundaries

Preserve these rules:

- [ ] no direct frontend access to application tables
- [ ] no bypass of the Fastify API for application data
- [ ] no business logic in Angular components
- [ ] no business side-effect orchestration in database triggers
- [ ] backend validates JWTs and derives account context server-side
- [ ] account scoping enforced backend-side
- [ ] no direct provider calls are needed for rain confirmation persistence

---

# API Contract

Endpoints involved:

```text
POST /api/v1/weather/events/:weatherEventId/confirm-rain
```

Request:

```json
{
  "response": "confirmed_yes"
}
```

Response:

```json
{
  "data": {
    "id": "uuid",
    "userConfirmationStatus": "confirmed_yes",
    "observedRain": true
  }
}
```

Allowed response values:

```text
confirmed_yes
confirmed_no
ignored
```

Errors must use the canonical error envelope.

---

# Tests Required

Add or update tests for:

- [ ] happy path
- [ ] validation errors
- [ ] account scoping
- [ ] API response shape
- [ ] edge cases

Specific test cases:

1. Confirm rain `confirmed_yes` sets `user_confirmation_status = confirmed_yes` and `observed_rain = true`.
2. Confirm rain `confirmed_no` sets `user_confirmation_status = confirmed_no` and `observed_rain = false`.
3. Confirm rain `ignored` sets `user_confirmation_status = ignored` and `observed_rain = null`.
4. Invalid response value returns canonical validation error.
5. Cross-account weather event confirmation is rejected.
6. Non-`rain_check` weather event confirmation is rejected.
7. Confirmed rain does not change related activity status.
8. Confirmed rain does not change related task status or create reminders.
9. Confirmed rain does not create planned tasks or follow-up tasks.

---

# Acceptance Criteria

The task is complete when:

- [ ] Rain confirmation endpoint persists exact yes/no/ignore mapping.
- [ ] Only account-scoped `rain_check` events can be confirmed.
- [ ] Response shape matches the canonical API contract.
- [ ] Confirmation side effects are limited to the weather event and optional audit log.
- [ ] Tests prove activity/task/reminder/planned-task state is not mutated by rain confirmation.
- [ ] No frontend, worker, push, AI, inventory, quarantine, or autonomous weather decision scope is included.

---

# Commands to Run

From the backend package root, run relevant commands:

```bash
npm run typecheck
npm run lint
npm test
npm run test:db
```

If a command is unavailable or fails due to pre-existing setup, report the exact command, exit state, and reason. Never claim checks passed unless they were run.
