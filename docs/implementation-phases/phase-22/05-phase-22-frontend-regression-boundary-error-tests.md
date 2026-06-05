# Implementation Task - Phase 22 Step 5: Frontend Regression, Boundary, and Error Tests

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

Add the focused Phase 22 regression, boundary, and error-display tests that prove the frontend Weather UX preserves backend-owned weather semantics.

## Branch

Use branch:

```text
feature/frontend-weather
```

---

# Scope

Implement only:

- [ ] Inspect all tests added in Phase 22 Steps 1-4 and the existing frontend boundary/static check pattern.
- [ ] Add missing regression tests for enabled forecast, disabled weather, rain prompt actions, advisory wording, calendar weather markers if implemented, and API errors.
- [ ] Add or update boundary/static checks to prevent direct Open-Meteo/provider calls from frontend code.
- [ ] Add or update boundary/static checks to prevent weather provider secrets in frontend config.
- [ ] Add or update boundary/static checks to prevent frontend treatment-failure, rain-consequence, planned-task creation, or task-cancellation decisions in weather UI.
- [ ] Verify no Phase 22 request fixture or API service sends trusted `accountId`.
- [ ] Verify weather feature components use typed API services instead of raw component `HttpClient`.
- [ ] Keep tests deterministic with mocked backend API responses.

---

# Out of Scope

Do not implement:

- [ ] New Phase 22 product features.
- [ ] Backend weather tests.
- [ ] E2E-only coverage as a substitute for focused component/API tests.
- [ ] Broad unrelated frontend boundary rewrites.
- [ ] Push, AI, deployment, or MCP tests.

---

# Required Documents

Read before coding:

- [ ] `AGENTS.md`
- [ ] `docs/gardening-helper-implementation-agent-instructions.md`
- [ ] `docs/gardening-helper-ai-implementation-handoff-readme-v1.md`
- [ ] `docs/gardening-helper-implementation-instructions-for-ai-v1.md`
- [ ] `docs/gardening-helper-domain-rules-and-invariants-v1.md`
- [ ] `docs/gardening-helper-canonical-api-contract-v1.md`
- [ ] `docs/gardening-helper-testing-and-acceptance-spec-v1.md`
- [ ] `docs/gardening-helper-frontend-technical-spec-v1.md`
- [ ] `docs/implementation-phases/phase-22-frontend-weather-ux.md`
- [ ] All Phase 22 step files
- [ ] Existing frontend test setup, boundary check scripts, and weather/calendar/task/activity test files touched by this task

---

# Domain Rules Affected

This task touches:

- [ ] weather/rain confirmation
- [ ] tasks/reminders
- [ ] activities
- [ ] frontend forms
- [ ] API contract
- [ ] provider adapter boundary

Important rules to preserve:

```text
Weather is advisory.
Weather prompts ask for observed rain confirmation.
Rain confirmation does not automatically invalidate treatment.
Frontend must not decide weather consequences.
Frontend must not call Open-Meteo directly.
Frontend must not submit accountId for normal flows.
All application data access goes through the Fastify API under /api/v1.
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

- [ ] tests
- [ ] boundary/static check updates where configured

---

# Required Infrastructure/Security Boundaries

Preserve and test these rules:

- [ ] no direct frontend access to application tables
- [ ] no bypass of the Fastify API for application data
- [ ] no business logic in Angular components
- [ ] no Supabase service role key in frontend code/env/build output/logs
- [ ] no direct weather provider calls from frontend code
- [ ] no Open-Meteo URLs or provider secrets in frontend config
- [ ] no frontend rain consequence, task creation, task cancellation, or treatment failure decisions
- [ ] no trusted `accountId` submitted from frontend payloads

---

# API Contract

Endpoints covered:

```text
GET /api/v1/places/:placeId/weather/forecast
POST /api/v1/weather/events/:weatherEventId/confirm-rain
Existing calendar endpoint if weather markers are implemented
```

Request/response must follow:

- `docs/gardening-helper-canonical-api-contract-v1.md`

---

# Tests Required

Add or update tests for:

- [ ] Weather API service endpoint paths, envelopes, and request bodies
- [ ] weather-disabled state
- [ ] enabled forecast display
- [ ] pending rain confirmation prompt visibility
- [ ] yes/no/ignore confirmation actions
- [ ] prompt wording not saying treatment failed
- [ ] confirmation response UI update
- [ ] API/provider error display
- [ ] calendar weather marker rendering if included in scope
- [ ] no direct Open-Meteo/provider calls
- [ ] no weather provider secrets in frontend config
- [ ] no trusted `accountId`
- [ ] no raw component `HttpClient` bypasses

Specific test cases:

1. Disabled forecast response renders disabled weather state and no rain prompt.
2. Enabled forecast response renders backend-provided forecast as context.
3. Pending rain-check event renders confirmation prompt with advisory wording.
4. Yes/no/ignore actions submit only canonical `response` values.
5. Confirmation API error renders a recoverable error.
6. Static/boundary search fails if frontend code introduces Open-Meteo URLs or provider secrets.
7. Static/boundary search fails if Phase 22 UI introduces treatment-failure automation wording or frontend-side weather consequences.

---

# Acceptance Criteria

The task is complete when:

- [ ] Phase 22 frontend weather behavior has focused tests.
- [ ] Boundary/static checks cover provider and business-truth restrictions.
- [ ] Error-display tests cover forecast and confirmation failures.
- [ ] Tests prove no trusted `accountId` is submitted.
- [ ] Relevant frontend checks pass or failures are clearly documented as pre-existing.
