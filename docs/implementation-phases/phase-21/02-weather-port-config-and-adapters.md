# Implementation Task - Phase 21 Step 2: Weather Port, Config, and Adapters

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
Create the backend WeatherPort contract, backend-only weather configuration, deterministic test/dev adapter, and Open-Meteo adapter boundary needed by Phase 21.
```

## Branch

Use branch:

```text
feature/backend-weather-rain
```

---

# Scope

Implement only:

- [ ] Inspect existing backend config, dependency injection, integration port, auth/storage adapter, logger, error, HTTP client/fetch, and test adapter patterns.
- [ ] Define `WeatherPort` with the Phase 21 methods supported by local implementation needs: `getForecastForPlace`, `getRainRiskForDate`, and `captureForecastSnapshot` where used.
- [ ] Define typed inputs/results for place forecast, rain risk, forecast snapshot, normalized daily forecast items, and provider failure metadata.
- [ ] Add backend-only weather configuration for `WEATHER_PROVIDER` and `OPEN_METEO_BASE_URL` using existing config conventions.
- [ ] Ensure config validation never exposes provider configuration details in frontend code, public config, logs, build output, or client-visible errors.
- [ ] Implement a deterministic test/dev weather adapter behind `WeatherPort` that returns stable forecasts and can simulate provider failure without network access.
- [ ] Implement an Open-Meteo adapter behind `WeatherPort` if the existing dependency/config pattern supports it; otherwise document production adapter status and leave a typed boundary with no domain-service provider calls.
- [ ] Normalize Open-Meteo/provider output into canonical backend forecast fields before it reaches services.
- [ ] Map provider timeouts/errors to an internal error that routes can expose as canonical `EXTERNAL_SERVICE_ERROR`.
- [ ] Add focused unit tests for config parsing, deterministic adapter behavior, provider normalization, and adapter boundary.

Expected paths, unless existing code clearly establishes a better equivalent:

```text
backend/src/integrations/weather/weather.port.ts
backend/src/integrations/weather/weather.types.ts
backend/src/integrations/weather/test-weather.adapter.ts
backend/src/integrations/weather/open-meteo.adapter.ts
backend/src/config/
backend/test/weather/
```

---

# Out of Scope

Do not implement:

- [ ] Forecast route/service behavior beyond wiring the port dependency; that belongs to Step 3.
- [ ] Rain confirmation persistence; that belongs to Step 4.
- [ ] Scheduled weather checker worker.
- [ ] Frontend weather calls or UI.
- [ ] Push notifications or AI advice.
- [ ] Provider-specific code in domain services or repositories.
- [ ] Storing provider payload as canonical business truth.
- [ ] Schema changes or migrations.

---

# Required Documents

Read before coding:

- [ ] `AGENTS.md`
- [ ] `docs/gardening-helper-implementation-agent-instructions.md`
- [ ] `docs/gardening-helper-ai-implementation-handoff-readme-v1.md`
- [ ] `docs/gardening-helper-implementation-instructions-for-ai-v1.md`
- [ ] `docs/gardening-helper-domain-rules-and-invariants-v1.md` sections 2.1 and 3.5
- [ ] `docs/gardening-helper-canonical-api-contract-v1.md` section 21
- [ ] `docs/gardening-helper-testing-and-acceptance-spec-v1.md` weather provider and rain confirmation sections
- [ ] `docs/gardening-helper-backend-application-design-pack-v1.md` section 7.2
- [ ] `docs/implementation-phases/phase-21-backend-weather-and-rain-confirmation.md`
- [ ] `docs/env.example`
- [ ] `docs/TASK_TEMPLATE.md`
- [ ] Existing backend config, integration adapter, dependency injection, logger, error, and test helper files.

---

# Domain Rules Affected

This task touches:

- [ ] weather/rain confirmation
- [ ] provider adapter boundary
- [ ] deployment/security docs

Important rules to preserve:

```text
Open-Meteo is used through WeatherPort.
External integrations go through ports/adapters.
Weather is advisory and normalized results, not provider payloads, drive backend behavior.
Provider config stays backend-side.
No Open-Meteo calls from frontend.
No provider-specific code in services or repositories.
Provider failures must not leak secrets.
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

- [ ] provider adapter through port
- [ ] backend config validation
- [ ] deterministic test/dev adapter
- [ ] provider result normalization
- [ ] provider error mapping
- [ ] tests
- [ ] docs/update notes only if weather configuration or production adapter status changes

---

# Required Infrastructure/Security Boundaries

Preserve these rules:

- [ ] no direct frontend access to application tables
- [ ] no bypass of the Fastify API for application data
- [ ] no business logic in Angular components
- [ ] no business side-effect orchestration in database triggers
- [ ] no direct provider calls inside domain services except through `WeatherPort`
- [ ] Open-Meteo used through `WeatherPort`
- [ ] backend-only provider configuration
- [ ] worker/scheduler ownership is explicit if weather checks are touched

---

# API Contract

Endpoints involved:

```text
None directly in this step.
```

This step prepares the weather boundary used later by:

```text
GET /api/v1/places/:placeId/weather/forecast
POST /api/v1/weather/events/:weatherEventId/confirm-rain
```

Request/response must follow:

- `docs/gardening-helper-canonical-api-contract-v1.md` section 21

---

# Tests Required

Add or update tests for:

- [ ] provider adapter boundary
- [ ] validation errors
- [ ] edge cases

Specific test cases:

1. Weather config accepts `WEATHER_PROVIDER=open-meteo` and `OPEN_METEO_BASE_URL` using backend config conventions.
2. Deterministic test weather adapter returns stable normalized forecasts without network access.
3. Deterministic test weather adapter can simulate provider failure.
4. Open-Meteo adapter maps provider response to canonical normalized fields.
5. Provider errors map to an internal error that the route layer can expose as `EXTERNAL_SERVICE_ERROR`.
6. Static or unit guard confirms Open-Meteo/provider calls are confined to the weather adapter.

---

# Acceptance Criteria

The task is complete when:

- [ ] `WeatherPort` and typed weather inputs/results exist.
- [ ] A deterministic test/dev adapter exists and needs no provider credentials or network access.
- [ ] Open-Meteo adapter exists or production adapter status is explicitly documented.
- [ ] Weather config is backend-only and secret-safe.
- [ ] Provider output is normalized before services use it.
- [ ] No route behavior, rain confirmation persistence, frontend, schema, push, AI, or worker scope is included.

---

# Commands to Run

From the backend package root, run relevant commands:

```bash
npm run typecheck
npm run lint
npm test
```

If a command is unavailable or fails due to pre-existing setup, report the exact command, exit state, and reason. Never claim checks passed unless they were run.
