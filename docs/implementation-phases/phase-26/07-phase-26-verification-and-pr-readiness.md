# Implementation Task - Phase 26 Step 7: Phase 26 Verification and PR Readiness

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

Verify the full Phase 26 frontend notification settings and PWA registration experience, update implementation status, commit focused changes, and open the implementation PR.

## Branch

Use branch:

```text
feature/frontend-notifications
```

---

# Scope

Implement only:

- [ ] Review all Phase 26 code and tests against `docs/implementation-phases/phase-26-frontend-notifications-and-pwa-registration.md`.
- [ ] Verify notification settings route/page, permission states, service worker subscription flow, backend register/deactivate/re-register calls, API error states, unsupported/denied/offline states, and app-shell/settings entry points.
- [ ] Verify tasks, calendar, and dashboard remain usable without notifications.
- [ ] Run the configured frontend checks.
- [ ] Run the configured frontend boundary/static checks.
- [ ] Run targeted static searches for prohibited push/secret/reminder/business-truth shortcuts.
- [ ] Update `docs/gardening-helper-implementation-status-handoff.md` to mark Phase 26 implemented only after implementation is complete and verified.
- [ ] Keep Phase 27 as the next implementation phase after Phase 26 implementation is complete, unless the status handoff already records a newer source-of-truth sequence.
- [ ] Commit focused Phase 26 implementation changes.
- [ ] Open a PR with a clear description.

---

# Out of Scope

Do not implement:

- [ ] Backend push subscription APIs, `PushPort`, raw Web Push adapter, worker/scheduler behavior, or migrations.
- [ ] Phase 27 deployment and operations readiness.
- [ ] Frontend reminder delivery, task status changes, or business scheduling truth.
- [ ] AI, weather, MCP, activity, inventory, or problem-photo work.
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
- [ ] `docs/implementation-phases/phase-25-backend-push-notifications-and-worker-scheduler.md`
- [ ] `docs/implementation-phases/phase-26-frontend-notifications-and-pwa-registration.md`
- [ ] All Phase 26 step files
- [ ] `docs/gardening-helper-implementation-status-handoff.md`
- [ ] Changed frontend files and tests

---

# Domain Rules Affected

This task touches:

- [ ] tasks/reminders
- [ ] frontend forms
- [ ] API contract
- [ ] auth/session boundary
- [ ] provider adapter boundary
- [ ] deployment/security docs

Important rules to verify:

```text
Notifications are optional.
Tasks, calendar, and dashboard work without notifications.
Registration goes through the Fastify API only.
Reminder delivery remains backend-owned.
Frontend does not implement reminder timers, schedulers, delivery workers, or reminder payload creation.
Notification permission, subscription, or delivery state does not change task status.
No trusted accountId is submitted.
VAPID public key may be frontend-visible.
VAPID private key is absent from frontend code/config/tests/docs examples.
No direct push_subscriptions table access exists.
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
- [ ] implementation status update

---

# Required Infrastructure/Security Boundaries

Verify these rules:

- [ ] no direct frontend access to application tables
- [ ] no bypass of the Fastify API for application data
- [ ] no business logic in Angular components beyond UI orchestration
- [ ] no Supabase service role key in frontend code/env/build output/logs
- [ ] no VAPID private key in frontend code/env/build output/logs/tests/docs examples
- [ ] no direct `push_subscriptions` table access
- [ ] no direct Supabase/PostgREST push subscription calls
- [ ] no frontend reminder scheduler/timer/delivery worker
- [ ] no frontend-created reminder payloads
- [ ] no task status changes from notification state
- [ ] backend API is the only application-data source for notification subscription persistence

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
rg -n "VAPID_PRIVATE|VAPID_PRIVATE_KEY|privateKey|private_key" frontend
rg -n "push_subscriptions|from\\(['\\\"]push|\\.from\\(['\\\"]push|PostgREST" frontend
rg -n "setTimeout|setInterval|timer\\(|interval\\(|reminder.*scheduler|notification.*scheduler|delivery worker" frontend/src/app
rg -n "accountId" frontend/src/app/features/settings frontend/src/app/features/notifications frontend/src/app/features/tasks frontend/src/app/features/calendar frontend/src/app/features/dashboard
rg -n "complete\\(|skip\\(|dismiss\\(|confirm\\(" frontend/src/app/features/settings frontend/src/app/features/notifications
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
- Push/PWA/secret boundary status
- Deferred work
- Review focus

Suggested PR description:

```md
## Summary
Implemented frontend Notifications and PWA registration.

## Scope
- Added typed notification API service.
- Added notification settings page and permission states.
- Added browser service worker push subscription registration.
- Added backend subscription register/deactivate/re-register UI.

## Domain rules preserved
- Notifications remain optional.
- Reminder delivery remains backend-owned.
- Tasks/calendar/dashboard work without notifications.
- VAPID private key is not exposed.

## API changes
- None. Consumes existing Phase 25 push subscription endpoints.

## Tests
- <commands run and results>

## Push/PWA/secret boundary status
- Registration goes through the Fastify API.
- Browser uses VAPID public key only.
- No frontend reminder scheduler or task status mutation from notification state.

## Deferred work
- Production deployment wiring remains in the deployment readiness phase.

## Review focus
- Secret boundary.
- Optional notification UX.
- Browser unsupported/denied/offline states.
- No frontend reminder delivery logic.
```

---

# Acceptance Criteria

- [ ] Phase 26 implementation matches the top-level phase spec and step docs.
- [ ] Configured frontend checks and boundary/static checks pass or failures are documented exactly.
- [ ] `docs/gardening-helper-implementation-status-handoff.md` is updated only after implementation is complete and verified.
- [ ] Focused commit exists on `feature/frontend-notifications`.
- [ ] PR is open with the required description.
