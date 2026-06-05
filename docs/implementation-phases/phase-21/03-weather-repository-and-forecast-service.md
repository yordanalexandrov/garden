# Implementation Task - Phase 21 Step 3: Weather Repository and Forecast Service

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
Implement account-scoped weather repository helpers and backend-owned forecast service/API behavior for places.
```

## Branch

Use branch:

```text
feature/backend-weather-rain
```

---

# Scope

Implement only:

- [ ] Inspect existing places repository/service, account scoping patterns, route handler patterns, error mapping, and integration dependency injection.
- [ ] Implement weather repository read/write helpers needed by Phase 21 without provider calls in the repository.
- [ ] Add repository support for weather event creation and lookup where needed by on-demand rain-check or forecast snapshot behavior.
- [ ] Add service method for `getForecastForPlace(actor, placeId)`.
- [ ] Account-scope the place lookup using the authenticated actor.
- [ ] If the place is weather-disabled, return canonical disabled response with `enabled: false` and `forecast: []`.
- [ ] Ensure weather-disabled places do not call `WeatherPort`.
- [ ] If the place is weather-enabled, require explicit weather location data already stored on the place: location label or both latitude and longitude.
- [ ] Call `WeatherPort` only from the service/integration boundary, not from controllers or repositories.
- [ ] Return canonical forecast DTO with `placeId`, `enabled`, `locationLabel` when enabled, and normalized `forecast` items.
- [ ] Map provider failures to canonical `EXTERNAL_SERVICE_ERROR`.
- [ ] Add API tests for enabled, disabled, inaccessible, invalid-place, missing-location, and provider-failure behavior.

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

- [ ] Rain confirmation persistence; that belongs to Step 4.
- [ ] Scheduled weather worker.
- [ ] Frontend weather UX.
- [ ] Push notifications or AI weather advice.
- [ ] Weather-based treatment failure, treatment cancellation, task cancellation, follow-up task creation, or planned task creation.
- [ ] Direct provider calls in controllers, repositories, or frontend.
- [ ] Schema changes or migrations unless a blocking mismatch is documented.

---

# Required Documents

Read before coding:

- [ ] `AGENTS.md`
- [ ] `docs/gardening-helper-implementation-agent-instructions.md`
- [ ] `docs/gardening-helper-ai-implementation-handoff-readme-v1.md`
- [ ] `docs/gardening-helper-implementation-instructions-for-ai-v1.md`
- [ ] `docs/gardening-helper-domain-rules-and-invariants-v1.md` sections 3.5, 5.2, and 5.3
- [ ] `docs/gardening-helper-canonical-api-contract-v1.md` sections 8 and 21.1
- [ ] `docs/gardening-helper-testing-and-acceptance-spec-v1.md` weather forecast sections
- [ ] `docs/gardening-helper-backend-application-design-pack-v1.md` WeatherRepository and WeatherPort sections
- [ ] `docs/gardening-helper-technical-requirements-and-erd.md` place weather fields and `weather_events`
- [ ] `docs/001_initial_schema_gardening_helper.sql`
- [ ] `docs/004_guards_and_triggers_gardening_helper.sql`
- [ ] `docs/implementation-phases/phase-21-backend-weather-and-rain-confirmation.md`
- [ ] `docs/TASK_TEMPLATE.md`
- [ ] Existing backend places, weather, config, route, validation, error, repository, and test helper files.

---

# Domain Rules Affected

This task touches:

- [ ] account scoping
- [ ] weather/rain confirmation
- [ ] API contract
- [ ] provider adapter boundary

Important rules to preserve:

```text
Weather is optional per place.
If weather is disabled, no forecast context is required and no provider call should happen.
If weather is enabled, the place must have explicit weather location information.
Weather forecast is advisory.
Provider payload is not core domain truth.
Open-Meteo is used through WeatherPort.
The backend derives account scope from the authenticated actor.
```

---

# MCP Impact

This task:

- [ ] changes backend behavior used by future MCP tools

MCP tools affected:

```text
Future calendar/weather read tooling may consume backend weather forecasts or weather events through backend services/API.
```

Required MCP documentation updates:

```text
None in Phase 21 unless existing MCP docs reference a changed weather API path or payload.
```

---

# Required Implementation Details

Implement:

- [ ] backend controller/route
- [ ] backend service method
- [ ] repository methods
- [ ] provider adapter through port
- [ ] account-scoped place lookup
- [ ] canonical error mapping
- [ ] tests

---

# Required Infrastructure/Security Boundaries

Preserve these rules:

- [ ] no direct frontend access to application tables
- [ ] no bypass of the Fastify API for application data
- [ ] no business logic in Angular components
- [ ] no business side-effect orchestration in database triggers
- [ ] no direct provider calls inside controllers or repositories
- [ ] Open-Meteo used through `WeatherPort`
- [ ] account scoping enforced backend-side

---

# API Contract

Endpoints involved:

```text
GET /api/v1/places/:placeId/weather/forecast
```

Enabled response:

```json
{
  "data": {
    "placeId": "uuid",
    "enabled": true,
    "locationLabel": "Ruse, Bulgaria",
    "forecast": [
      {
        "date": "2026-05-13",
        "temperatureMinC": 12,
        "temperatureMaxC": 24,
        "rainProbability": 0.4,
        "summary": "Possible rain"
      }
    ]
  }
}
```

Disabled response:

```json
{
  "data": {
    "placeId": "uuid",
    "enabled": false,
    "forecast": []
  }
}
```

Errors must use the canonical error envelope.

---

# Tests Required

Add or update tests for:

- [ ] happy path
- [ ] validation errors
- [ ] account scoping
- [ ] API response shape
- [ ] provider failure
- [ ] edge cases

Specific test cases:

1. Forecast for a weather-disabled place returns `enabled: false` and `forecast: []`.
2. Forecast for a weather-disabled place does not call `WeatherPort`.
3. Forecast for a weather-enabled place calls `WeatherPort` through the configured adapter.
4. Forecast response uses canonical envelope and camelCase fields.
5. Weather-enabled place without explicit weather location is rejected with a canonical validation/business error.
6. Provider failure maps to `EXTERNAL_SERVICE_ERROR`.
7. Cross-account or inaccessible place forecast is rejected with `NOT_FOUND` or `FORBIDDEN` according to local convention.

---

# Acceptance Criteria

The task is complete when:

- [ ] Forecast endpoint handles enabled and disabled places exactly as the canonical contract defines.
- [ ] Weather-disabled places do not call the provider.
- [ ] Enabled forecasts use `WeatherPort` and normalized forecast DTOs.
- [ ] Account scoping applies to place forecast reads.
- [ ] Provider failures map to canonical errors.
- [ ] No rain confirmation, frontend, worker, push, AI, or autonomous weather side effects are included.

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
