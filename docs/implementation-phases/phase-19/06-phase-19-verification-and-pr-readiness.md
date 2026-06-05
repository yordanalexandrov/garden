# Implementation Task - Phase 19 Step 6: Phase 19 Verification and PR Readiness

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

Verify Phase 19 backend read API work, update implementation status, commit focused changes, and open the implementation PR.

## Branch

Use branch:

```text
feature/backend-calendar-dashboard
```

---

## Scope

- [ ] Review final diff for accidental frontend, task mutation, weather generation, push, AI, storage, MCP, migration, or provider scope creep.
- [ ] Verify `GET /api/v1/calendar` and `GET /api/v1/dashboard` are read-only and authenticated.
- [ ] Verify calendar response sections are `activities`, `tasks`, `quarantinePeriods`, and `weatherEvents`.
- [ ] Verify dashboard buckets are `upcomingTasks`, `suggestedTasks`, `activeQuarantinePeriods`, `recentActivities`, `openProblems`, `lowStockProducts`, and `places`.
- [ ] Verify suggested and planned tasks remain distinct in read models.
- [ ] Verify active quarantine, recent activity, open problem, low-stock, and place summaries are account-scoped.
- [ ] Run backend checks.
- [ ] Update `docs/gardening-helper-implementation-status-handoff.md` to mark Phase 19 implemented only if implementation and checks are complete.
- [ ] Commit focused changes and open a PR with the expected Phase 19 summary from the top-level phase spec.

## Required Verification Commands

From the backend package root, run where configured:

```bash
npm run typecheck
npm run lint
npm test
npm run test:db
npm run build
```

If route or repository tests require a database, run them against a dedicated local/private PostgreSQL-compatible test database using `TEST_DATABASE_URL` or the existing safe test database configuration.

---

# Domain Rules Affected

This task touches:

- [ ] account scoping
- [ ] activities
- [ ] inventory
- [ ] quarantine
- [ ] tasks/reminders
- [ ] problems/photos
- [ ] weather/rain confirmation
- [ ] API contract
- [ ] database/migrations
- [ ] auth/session boundary

Important rules to preserve:

```text
Calendar is a read model only.
Dashboard is a read model only.
Quarantine remains a read-only overlay.
Suggested and planned tasks remain distinct.
Reminders exist only for planned tasks.
Inventory reads must not mutate stock or movement history.
Weather events are included only if already present; Phase 19 does not call WeatherPort.
API responses must not leak inaccessible data.
```

---

# MCP Impact

This task:

- [ ] has no direct MCP impact

MCP tools affected:

```text
None.
```

Required MCP documentation updates:

```text
None.
```

---

# Required Infrastructure/Security Boundaries

Preserve these rules:

- [ ] no direct frontend access to application tables
- [ ] no bypass of the Fastify API for application data
- [ ] no business logic in Angular components
- [ ] no business side-effect orchestration in database triggers
- [ ] no Supabase service role key in frontend code/env/build output/logs
- [ ] backend validates JWTs and derives account context server-side
- [ ] account scoping enforced backend-side
- [ ] no `WeatherPort`, `PushPort`, `StoragePort`, or AI provider calls from Phase 19 reads

---

## Acceptance Criteria

- [ ] `GET /api/v1/calendar` is implemented and tested.
- [ ] `GET /api/v1/dashboard` is implemented and tested.
- [ ] Calendar response sections are separate and contract-compatible.
- [ ] Dashboard buckets are populated from existing domain data.
- [ ] Suggested and planned tasks remain distinguishable.
- [ ] Quarantine periods remain read-only overlays.
- [ ] Date/place filters are account-scoped.
- [ ] Read APIs do not mutate data.
- [ ] Status handoff is updated accurately.
- [ ] PR is open and ready for Review Agent review.

---

# Commands to Run

From the backend package root, run relevant commands:

```bash
npm run typecheck
npm run lint
npm test
npm run test:db
npm run build
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
