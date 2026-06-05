# Implementation Task - Phase 21 Step 5: Weather Account, Provider, and Side-Effect Regression Tests

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
Add focused Phase 21 regression coverage for account scoping, provider boundaries, API shapes, rain confirmation mapping, and advisory-only weather behavior.
```

## Branch

Use branch:

```text
feature/backend-weather-rain
```

---

# Scope

Implement only:

- [ ] Inspect existing backend test helpers, database fixture patterns, route/API tests, static boundary checks, and provider adapter test patterns.
- [ ] Add deterministic weather-enabled and weather-disabled place fixtures.
- [ ] Add weather event fixtures for pending rain checks linked to task/activity records where existing schema and prior phases support them.
- [ ] Add cross-account fixtures for places and weather events.
- [ ] Add API contract tests for forecast response envelopes and rain confirmation response envelopes.
- [ ] Add regression tests proving weather-disabled places do not call `WeatherPort`.
- [ ] Add provider failure tests proving forecast errors return canonical `EXTERNAL_SERVICE_ERROR`.
- [ ] Add confirmation mapping tests for `confirmed_yes`, `confirmed_no`, and `ignored`.
- [ ] Add account scoping tests for inaccessible places and weather events.
- [ ] Add side-effect boundary tests proving rain confirmation does not mutate activity/task status, reminders, quarantine, inventory, suggested tasks, planned tasks, or follow-up tasks.
- [ ] Add static/security boundary checks proving Open-Meteo/provider calls are isolated to the weather adapter and no frontend provider calls were added.
- [ ] Keep tests deterministic and independent from real Open-Meteo network access.

Expected paths, unless existing code clearly establishes a better equivalent:

```text
backend/test/weather/
backend/test/static/
```

---

# Out of Scope

Do not implement:

- [ ] New feature behavior beyond what is needed to make Phase 21 tests pass.
- [ ] Frontend weather tests; those belong to Phase 22.
- [ ] Scheduled worker tests unless a worker was explicitly introduced in this phase.
- [ ] Push notification tests.
- [ ] AI weather advice tests.
- [ ] Real Open-Meteo network tests in normal automated test runs.
- [ ] Schema redesign or migrations unless a blocking mismatch is documented.

---

# Required Documents

Read before coding:

- [ ] `AGENTS.md`
- [ ] `docs/gardening-helper-implementation-agent-instructions.md`
- [ ] `docs/gardening-helper-ai-implementation-handoff-readme-v1.md`
- [ ] `docs/gardening-helper-implementation-instructions-for-ai-v1.md`
- [ ] `docs/gardening-helper-domain-rules-and-invariants-v1.md` weather/rain, account, task/reminder, and provider boundary sections
- [ ] `docs/gardening-helper-canonical-api-contract-v1.md` sections 5.16, 8, and 21
- [ ] `docs/gardening-helper-testing-and-acceptance-spec-v1.md` sections 6.22 through 6.24, 8 weather/API sections, 9.13, 10.8, and final acceptance checklist weather items
- [ ] `docs/gardening-helper-backend-application-design-pack-v1.md` WeatherRepository, WeatherPort, and RecordRainConfirmation sections
- [ ] `docs/gardening-helper-technical-requirements-and-erd.md` `weather_events`, tasks, activities, reminders, and audit sections
- [ ] `docs/001_initial_schema_gardening_helper.sql`
- [ ] `docs/004_guards_and_triggers_gardening_helper.sql`
- [ ] `docs/implementation-phases/phase-21-backend-weather-and-rain-confirmation.md`
- [ ] `docs/TASK_TEMPLATE.md`
- [ ] Existing backend weather, places, tasks, activities, calendar, test fixtures, route tests, static boundary tests, and test helper files.

---

# Domain Rules Affected

This task touches:

- [ ] account scoping
- [ ] activities
- [ ] inventory
- [ ] quarantine
- [ ] tasks/reminders
- [ ] weather/rain confirmation
- [ ] API contract
- [ ] provider adapter boundary
- [ ] worker/scheduler responsibility

Important rules to preserve:

```text
Weather is enabled per place.
Weather is advisory and must not auto-fail treatments.
Observed rain is user-confirmed.
Weather confirmation must not auto-create planned tasks.
Suggested tasks are not planned tasks.
Reminders are created only for planned tasks.
External integrations go through ports/adapters.
All application data access goes through the backend API.
Account scoping applies to places and weather events.
```

---

# MCP Impact

This task:

- [ ] changes backend behavior used by future MCP tools

MCP tools affected:

```text
weather.confirm_rain
calendar.feed if weather events are included in calendar read models
```

Required MCP documentation updates:

```text
None unless tests reveal an implementation/API mismatch with existing MCP design.
```

---

# Required Implementation Details

Implement:

- [ ] tests
- [ ] deterministic fixtures
- [ ] provider adapter boundary checks
- [ ] API contract assertions
- [ ] account-scope assertions
- [ ] side-effect boundary assertions
- [ ] docs/update notes only if test commands or deterministic adapter behavior need documenting

---

# Required Infrastructure/Security Boundaries

Preserve these rules:

- [ ] no direct frontend access to application tables
- [ ] no bypass of the Fastify API for application data
- [ ] no business logic in Angular components
- [ ] no business side-effect orchestration in database triggers
- [ ] no direct provider calls outside `WeatherPort` adapters
- [ ] Open-Meteo used through `WeatherPort`
- [ ] account scoping enforced backend-side
- [ ] no real provider credentials or network access required by automated tests

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

- [ ] happy path
- [ ] validation errors
- [ ] account scoping
- [ ] API response shape
- [ ] provider adapter boundary
- [ ] edge cases

Specific test cases:

1. Weather-disabled place forecast returns `enabled: false`, `forecast: []`, and does not call provider.
2. Weather-enabled place forecast returns normalized canonical forecast items.
3. Weather-enabled place without explicit weather location is rejected.
4. Provider failure maps to `EXTERNAL_SERVICE_ERROR`.
5. Forecast for another account's place is rejected.
6. Rain confirmation yes/no/ignore mapping persists and returns canonical DTOs.
7. Rain confirmation for another account's weather event is rejected.
8. Rain confirmation for non-rain-check event is rejected.
9. Rain confirmation does not mutate related activity status or correction/audit business state except optional audit log.
10. Rain confirmation does not mutate task status, create reminders, create planned tasks, or create follow-up tasks.
11. Static boundary check confirms provider code is isolated to weather adapter/integration paths.
12. Static boundary check confirms no frontend Open-Meteo/provider access was introduced.

---

# Acceptance Criteria

The task is complete when:

- [ ] Phase 21 has regression coverage for account scoping, provider boundaries, API shapes, confirmation mapping, and advisory-only behavior.
- [ ] Tests use deterministic local adapters and fixtures.
- [ ] No test depends on real Open-Meteo credentials or network access.
- [ ] Side-effect tests prove rain confirmation is limited to weather event and optional audit persistence.
- [ ] No frontend, worker, push, AI, or unrelated feature work is included.

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
