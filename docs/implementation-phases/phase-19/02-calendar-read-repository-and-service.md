# Implementation Task - Phase 19 Step 2: Calendar Read Repository and Service

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
Build the account-scoped calendar read repository and CalendarService for GET /api/v1/calendar without making calendar a mutable source of truth.
```

## Branch

Use branch:

```text
feature/backend-calendar-dashboard
```

---

# Scope

Implement only:

- [ ] Inspect existing activity, task, quarantine, weather-event, place, and repository query patterns.
- [ ] Implement calendar repository reads for activities in the requested date range.
- [ ] Implement calendar repository reads for tasks in the requested date range, preserving `status`.
- [ ] Implement calendar repository reads for quarantine periods overlapping the requested date range.
- [ ] Implement calendar repository reads for weather events only if weather events already exist in schema/code.
- [ ] Apply authenticated `accountId` scope to every query.
- [ ] Apply optional `placeId` filter only after confirming the place belongs to the actor account.
- [ ] Use `from`/`to` date filtering so date-range overlap works for quarantine windows.
- [ ] Return separate repository result sets or DTO-ready groups for `activities`, `tasks`, `quarantinePeriods`, and `weatherEvents`.
- [ ] Implement `CalendarService.getCalendarFeed(actor, input)` as read-only orchestration.
- [ ] Map results to the canonical response shape using camelCase DTOs.
- [ ] Do not update, insert, delete, confirm, dismiss, complete, or generate anything from calendar reads.
- [ ] Add focused tests for service/repository behavior where local test infrastructure supports it.

Expected paths, unless existing code clearly establishes a better equivalent:

```text
backend/src/modules/calendar/calendar.repository.ts
backend/src/modules/calendar/calendar.service.ts
backend/src/modules/calendar/calendar.dto.ts
backend/test/calendar/
```

---

# Out of Scope

Do not implement:

- [ ] `GET /api/v1/dashboard`.
- [ ] Calendar mutations or a writable calendar table.
- [ ] Task status changes or reminder creation.
- [ ] Activity correction or creation behavior.
- [ ] Quarantine creation, deletion, or correction behavior.
- [ ] Weather event generation, provider calls, rain confirmation, or scheduler behavior.
- [ ] Frontend calendar UI.
- [ ] Schema changes or migrations.
- [ ] A single ambiguous merged item array as the API response.

---

# Required Documents

Read before coding:

- [ ] `AGENTS.md`
- [ ] `docs/gardening-helper-implementation-agent-instructions.md`
- [ ] `docs/gardening-helper-ai-implementation-handoff-readme-v1.md`
- [ ] `docs/gardening-helper-implementation-instructions-for-ai-v1.md`
- [ ] `docs/gardening-helper-domain-rules-and-invariants-v1.md` sections 14, 15, and 16
- [ ] `docs/gardening-helper-canonical-api-contract-v1.md` section 20.1
- [ ] `docs/gardening-helper-testing-and-acceptance-spec-v1.md` calendar aggregation and account-scope sections
- [ ] `docs/gardening-helper-backend-application-design-pack-v1.md` CalendarService and API response sections
- [ ] `docs/001_initial_schema_gardening_helper.sql`
- [ ] `docs/002_views_gardening_helper.sql`
- [ ] `docs/004_guards_and_triggers_gardening_helper.sql`
- [ ] `docs/implementation-phases/phase-12-backend-activity-transaction-flow.md`
- [ ] `docs/implementation-phases/phase-18-backend-task-lifecycle-and-reminders.md`
- [ ] `docs/implementation-phases/phase-19-backend-calendar-and-dashboard-read-apis.md`
- [ ] `docs/TASK_TEMPLATE.md`
- [ ] Existing activity, task, quarantine, weather, place, db, repository, transaction, and backend test helper files touched by the task.

---

# Domain Rules Affected

This task touches:

- [ ] account scoping
- [ ] activities
- [ ] quarantine
- [ ] tasks/reminders
- [ ] weather/rain confirmation
- [ ] API contract
- [ ] database/migrations

Important rules to preserve:

```text
Calendar is a read model.
Calendar item types must remain distinguishable.
Quarantine periods are read-only overlays.
Calendar filters must not change business data.
Suggested tasks are not planned tasks.
Reminders are created only for planned tasks.
Weather is advisory and must not be generated or confirmed by calendar reads.
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

- [ ] backend service method
- [ ] repository methods
- [ ] DTO mapping helpers
- [ ] account/place/date filtering
- [ ] tests

Remove or ignore template items that are not relevant.

---

# Required Infrastructure/Security Boundaries

Preserve these rules:

- [ ] no direct frontend access to application tables
- [ ] no bypass of the Fastify API for application data
- [ ] no business side-effect orchestration in database triggers
- [ ] backend validates JWTs and derives account context server-side
- [ ] account scoping enforced backend-side on every query
- [ ] Open-Meteo used only through `WeatherPort`, and `WeatherPort` is not called in Phase 19 calendar reads
- [ ] raw Web Push used only through `PushPort`, and `PushPort` is not called in Phase 19 calendar reads

---

# API Contract

Endpoint involved:

```text
GET /api/v1/calendar
```

Response sections:

```text
activities
tasks
quarantinePeriods
weatherEvents
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

1. Calendar returns activities, tasks, quarantine periods, and seeded weather events in separate arrays.
2. Calendar preserves suggested and planned task statuses.
3. Date range filters include quarantine periods that overlap the requested range.
4. Optional `placeId` limits results to that place.
5. Account A cannot see Account B calendar items.
6. Calendar read does not mutate task, activity, quarantine, or weather rows.

---

# Acceptance Criteria

The task is complete when:

- [ ] `CalendarService.getCalendarFeed` returns contract-compatible sectioned data.
- [ ] Date/place filters are account-scoped.
- [ ] Suggested and planned tasks remain distinguishable.
- [ ] Quarantine periods remain read-only overlays.
- [ ] Tests cover calendar shape, filters, account scoping, and read-only behavior.
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
