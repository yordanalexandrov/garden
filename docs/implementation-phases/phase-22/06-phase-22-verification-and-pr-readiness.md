# Implementation Task - Phase 22 Step 6: Phase 22 Verification and PR Readiness

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

Verify the full Phase 22 frontend weather UX, update implementation status, commit focused changes, and open the implementation PR.

## Branch

Use branch:

```text
feature/frontend-weather
```

---

# Scope

Implement only:

- [ ] Review all Phase 22 code and tests against `docs/implementation-phases/phase-22-frontend-weather-ux.md`.
- [ ] Verify place weather page, enabled forecast state, disabled state, rain confirmation prompt/actions, calendar markers if implemented, and error states.
- [ ] Run the configured frontend checks.
- [ ] Run the configured frontend boundary/static checks.
- [ ] Run targeted static searches for prohibited weather/provider/business-truth shortcuts.
- [ ] Update `docs/gardening-helper-implementation-status-handoff.md` to mark Phase 22 implemented only after implementation is complete and verified.
- [ ] Ensure Phase 23 remains the next implementation phase after Phase 22 implementation is complete.
- [ ] Commit focused Phase 22 implementation changes.
- [ ] Open a PR with a clear description.

---

# Out of Scope

Do not implement:

- [ ] Backend weather/provider/scheduler behavior.
- [ ] Phase 23 AI workflows.
- [ ] Phase 25 push notifications.
- [ ] Deployment or MCP work.
- [ ] Broad unrelated refactors.

---

# Required Documents

Read before verification:

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
- [ ] `docs/gardening-helper-implementation-status-handoff.md`
- [ ] Changed frontend files and tests

---

# Domain Rules Affected

This task touches:

- [ ] weather/rain confirmation
- [ ] tasks/reminders
- [ ] activities
- [ ] frontend forms
- [ ] API contract
- [ ] provider adapter boundary

Important rules to verify:

```text
Weather is advisory.
Weather prompts ask for observed rain confirmation.
Rain confirmation does not automatically invalidate treatment.
No frontend weather provider calls exist.
No frontend weather provider secrets exist.
No frontend business side effects are derived from forecast or confirmation.
No trusted accountId is submitted.
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
- [ ] docs/update notes

---

# Required Infrastructure/Security Boundaries

Verify these rules:

- [ ] no direct frontend access to application tables
- [ ] no bypass of the Fastify API for application data
- [ ] no business logic in Angular components
- [ ] no Supabase service role key in frontend code/env/build output/logs
- [ ] no direct weather provider calls from frontend code
- [ ] no Open-Meteo URLs or provider secrets in frontend config
- [ ] no frontend treatment-failure, rain-consequence, task-cancellation, or planned-task creation decisions
- [ ] backend API is the only weather data source for the frontend

---

# Commands to Run

From the frontend package root, run:

```bash
npm run typecheck
npm run lint
npm test
npm run build
npm run check:frontend-boundaries
```

Also run targeted static checks equivalent to:

```bash
rg -n "open-meteo|api.open-meteo|OPEN_METEO|WEATHER_API_KEY|weather provider" frontend
rg -n "treatment failed|failed treatment|auto.*fail|auto.*cancel|auto.*planned task" frontend
rg -n "accountId" frontend/src/app/features/weather frontend/src/app/features/calendar frontend/src/app/features/tasks frontend/src/app/features/activities
```

Adapt paths to the actual repo structure. If a command is unavailable or fails due to pre-existing setup, report the exact command, exit state, and reason. Never claim checks passed unless they were run.

---

# PR Requirements

PR description must include:

- Summary
- Scope
- Domain rules preserved
- API changes
- Tests run
- Weather/provider boundary status
- Deferred work
- Review focus

Suggested PR description:

```md
## Summary
Implemented frontend Weather UX.

## Scope
- Added typed Weather API service.
- Added place weather page and forecast states.
- Added rain confirmation prompt/actions.
- Added calendar weather markers where backend calendar data supports them.

## Domain rules preserved
- Weather is advisory.
- Rain is user-confirmed.
- UI does not auto-fail treatments.
- Frontend consumes backend weather APIs only.

## API changes
- None. Consumes existing Phase 21 weather endpoints.

## Tests
- <commands run and results>

## Deferred work
- Push notifications, scheduled weather jobs, backend provider behavior, and AI advice remain deferred.

## Review focus
- Advisory wording.
- Backend API boundary.
- Disabled/enabled states.
- Rain confirmation request values.
```

---

# Acceptance Criteria

The task is complete when:

- [ ] All Phase 22 task acceptance criteria are met.
- [ ] Frontend checks pass or failures are documented as pre-existing.
- [ ] Static searches confirm no direct Open-Meteo/provider calls or secrets.
- [ ] Static searches confirm no treatment auto-failure wording or frontend weather-consequence automation.
- [ ] `docs/gardening-helper-implementation-status-handoff.md` reflects Phase 22 implementation progress accurately.
- [ ] Changes are committed and a PR is opened.
