# Implementation Task - Phase 21 Step 6: Phase 21 Verification and PR Readiness

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
Verify Phase 21 end to end, update implementation status, commit focused backend weather changes, and open a PR.
```

## Branch

Use branch:

```text
feature/backend-weather-rain
```

---

# Scope

Implement only:

- [ ] Review all Phase 21 changed files for scope control and source-of-truth compliance.
- [ ] Confirm no frontend weather UX, push, AI, scheduled worker, schema redesign, or unrelated phase work slipped into the PR.
- [ ] Confirm `WeatherPort` exists and all Open-Meteo/provider access is isolated to the adapter/integration layer.
- [ ] Confirm deterministic test/dev adapter exists and automated tests do not require real Open-Meteo network access.
- [ ] Confirm forecast endpoint handles weather-enabled and weather-disabled places.
- [ ] Confirm disabled weather place forecast does not call the provider.
- [ ] Confirm rain confirmation maps yes/no/ignore exactly.
- [ ] Confirm provider failures map to canonical `EXTERNAL_SERVICE_ERROR`.
- [ ] Confirm account scoping applies to place forecast and weather event confirmation.
- [ ] Confirm rain confirmation does not mutate activity/task status, reminders, quarantine, inventory, suggested tasks, follow-up tasks, or planned tasks.
- [ ] Run required checks and record exact commands/results.
- [ ] Update `docs/gardening-helper-implementation-status-handoff.md` to mark Phase 21 implemented only after all Phase 21 implementation and verification are complete.
- [ ] Commit focused changes.
- [ ] Open a PR with a clear description and review focus.

---

# Out of Scope

Do not implement:

- [ ] New behavior beyond final fixes needed to satisfy Phase 21 specs and tests.
- [ ] Frontend weather UX.
- [ ] Scheduled weather worker unless already explicitly introduced and tested in Phase 21.
- [ ] Push notifications.
- [ ] AI weather advice.
- [ ] Weather-based treatment failure, treatment cancellation, task cancellation, follow-up task creation, or planned task creation.
- [ ] Phase 22 or later work.

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
- [ ] `docs/gardening-helper-backend-application-design-pack-v1.md`
- [ ] `docs/gardening-helper-technical-requirements-and-erd.md`
- [ ] `docs/001_initial_schema_gardening_helper.sql`
- [ ] `docs/004_guards_and_triggers_gardening_helper.sql`
- [ ] `docs/implementation-phases/phase-21-backend-weather-and-rain-confirmation.md`
- [ ] All files changed during Phase 21.

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
- [ ] MCP tools / agent interface

Important rules to preserve:

```text
Weather is advisory.
Observed rain is user-confirmed.
Rain confirmation does not automatically fail treatments.
Rain confirmation does not cancel tasks.
Rain confirmation does not create follow-up tasks or planned tasks.
Weather provider access goes through WeatherPort.
Weather-disabled places do not require forecast context.
The backend owns account scoping and service workflows.
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
Only update MCP docs if the implemented backend weather behavior differs from the existing MCP design. Prefer preserving the documented design instead.
```

---

# Required Implementation Details

Implement:

- [ ] final test fixes
- [ ] status handoff update
- [ ] PR description

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

Run the relevant backend checks from the backend package root:

```bash
npm run typecheck
npm run lint
npm test
npm run test:db
npm run build
```

Also run any narrower weather tests added during the phase if they are not included by the broader commands.

Specific verification cases:

1. Forecast enabled/disabled/API response tests pass.
2. Provider failure and provider boundary tests pass.
3. Rain confirmation mapping tests pass.
4. Account scoping tests pass.
5. Advisory-only side-effect tests pass.
6. Typecheck, lint, and build pass where configured.

---

# Acceptance Criteria

The task is complete when:

- [ ] All Phase 21 implementation tasks are complete.
- [ ] All relevant checks have been run and results are recorded.
- [ ] `docs/gardening-helper-implementation-status-handoff.md` marks Phase 21 implemented only after implementation is complete.
- [ ] The PR description lists scope, tests, deferred work, and review focus.
- [ ] No frontend, push, AI, deployment, schema redesign, or unrelated phase work is included.

---

# Expected PR Description

```md
## Summary
Implemented backend Weather and Rain Confirmation.

## Scope
- Added WeatherPort and weather adapters.
- Added place forecast endpoint.
- Added rain confirmation endpoint and persistence.
- Added regression tests for account scoping, provider boundaries, confirmation mapping, and no autonomous side effects.

## Domain rules preserved
- Weather is advisory.
- Observed rain is user-confirmed.
- Rain confirmation does not auto-fail treatment, cancel tasks, or create planned tasks.
- Open-Meteo access stays behind WeatherPort.

## Tests
- <commands run and results>

## Deferred work
- Frontend weather UX, scheduled weather worker if not included, push, and AI remain deferred.

## Review focus
- Advisory-only semantics.
- Port boundary.
- Confirmation mapping.
- Account scoping.
- API contract shape.
```
