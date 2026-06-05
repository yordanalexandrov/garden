# Implementation Task - Phase 22 Step 2: Place Weather Page and Forecast States

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

Implement the place weather tab/page that displays backend-normalized forecast data and clear enabled/disabled/error states.

## Branch

Use branch:

```text
feature/frontend-weather
```

---

# Scope

Implement only:

- [ ] Inspect the existing place detail shell/tab/navigation pattern and route data conventions.
- [ ] Add `/places/:placeId/weather` page integration using the Phase 22 `WeatherApiService`.
- [ ] Load forecast data from `GET /api/v1/places/:placeId/weather/forecast` using the authenticated API client.
- [ ] Render a clear disabled state when backend returns `enabled: false` and `forecast: []`.
- [ ] Render an enabled state with location label when present and forecast rows/cards from backend data.
- [ ] Present forecast as contextual information, not instructions or business truth.
- [ ] Display provider/API errors gracefully without blocking non-weather place detail use.
- [ ] Add loading/empty states using existing Angular Material/shared UI conventions.
- [ ] Add component/page tests for enabled forecast, disabled state, empty enabled forecast, loading, and errors.

---

# Out of Scope

Do not implement:

- [ ] Place weather settings editing unless already supported elsewhere and only route compatibility is needed.
- [ ] Rain confirmation prompt UI/actions; those are Step 3.
- [ ] Calendar weather markers; those are Step 4.
- [ ] Direct frontend weather provider calls.
- [ ] Weather-sensitive task business decisions.
- [ ] Treatment failure wording or status changes.
- [ ] Backend weather API fixes unless a blocking incompatibility with the canonical contract is documented.

---

# Required Documents

Read before coding:

- [ ] `AGENTS.md`
- [ ] `docs/gardening-helper-implementation-agent-instructions.md`
- [ ] `docs/gardening-helper-ai-implementation-handoff-readme-v1.md`
- [ ] `docs/gardening-helper-implementation-instructions-for-ai-v1.md`
- [ ] `docs/gardening-helper-domain-rules-and-invariants-v1.md` sections 5 and 17
- [ ] `docs/gardening-helper-canonical-api-contract-v1.md` Weather API section
- [ ] `docs/gardening-helper-testing-and-acceptance-spec-v1.md` weather acceptance sections
- [ ] `docs/gardening-helper-frontend-technical-spec-v1.md` place detail and Weather UX rules
- [ ] `docs/implementation-phases/phase-07-frontend-garden-structure-pages.md`
- [ ] `docs/implementation-phases/phase-21-backend-weather-and-rain-confirmation.md`
- [ ] `docs/implementation-phases/phase-22-frontend-weather-ux.md`
- [ ] Existing place detail shell, route tabs, API error components, loading patterns, and tests

---

# Domain Rules Affected

This task touches:

- [ ] weather/rain confirmation
- [ ] frontend forms
- [ ] API contract
- [ ] provider adapter boundary

Important rules to preserve:

```text
Weather appears only where enabled.
Weather forecast is advisory.
Forecasted rain does not mean rain happened.
Frontend must not decide whether treatment failed.
Frontend must not call Open-Meteo or any weather provider directly.
Provider/API errors should not block non-weather app use.
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

- [ ] frontend page/component
- [ ] API service consumption
- [ ] loading/empty/error states
- [ ] tests

---

# Required Infrastructure/Security Boundaries

Preserve these rules:

- [ ] no direct frontend access to application tables
- [ ] no bypass of the Fastify API for application data
- [ ] no business logic in Angular components
- [ ] no Open-Meteo/provider URLs or secrets in frontend code/config
- [ ] no frontend rain consequence decisions

---

# API Contract

Endpoints involved:

```text
GET /api/v1/places/:placeId/weather/forecast
```

Relevant response states:

```text
enabled: true, forecast: [...]
enabled: false, forecast: []
```

Errors must use the canonical error envelope.

---

# Tests Required

Add or update tests for:

- [ ] weather-disabled place shows disabled state
- [ ] enabled forecast renders forecast rows/cards
- [ ] enabled empty forecast renders a neutral empty state
- [ ] API/provider errors display without crashing
- [ ] page uses `WeatherApiService`
- [ ] no direct Open-Meteo/provider URL usage

Specific test cases:

1. Given `enabled: false`, the page does not render forecast rows and clearly shows weather is disabled for the place.
2. Given `enabled: true` with forecast items, the page renders backend-provided date, temperature, rain probability, and summary context.
3. Given an API error envelope, the page shows a recoverable weather error and the surrounding place detail shell remains usable.
4. Text on the page does not imply forecasted rain is observed rain or treatment failure.

---

# Acceptance Criteria

The task is complete when:

- [ ] `/places/:placeId/weather` works through the backend API.
- [ ] Enabled, disabled, empty, loading, and error states render.
- [ ] Forecast is presented as advisory context.
- [ ] No direct provider access or business consequence logic is introduced.
- [ ] Focused component/page tests pass.
