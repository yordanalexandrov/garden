## Role

You are the **Implementation Agent**.

Use:
- `AGENTS.md`
- `gardening-helper-implementation-agent-instructions.md`
- `gardening-helper-ai-implementation-handoff-readme-v1.md`
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

# Implementation Task - Phase 12 Step 5: Quarantine and Suggested Task Side Effects

## Goal

Add rule-derived quarantine periods and suggested follow-up tasks to the activity creation transaction.

## Branch

Use branch:

```text
feature/backend-activity-transaction
```

---

# Scope

- [ ] Build quarantine period helper from product usage rule context and activity performed date.
- [ ] Persist `quarantine_periods` when a supplied/validated rule has quarantine days.
- [ ] Document and test zero-day quarantine behavior if encountered.
- [ ] Build suggested follow-up task helper from reapplication interval rule context.
- [ ] Persist generated tasks with status `suggested`, source `activity`, and no reminders.
- [ ] Copy concrete activity targets into matching `task_targets`.
- [ ] Return canonical `quarantinePeriods` and `suggestedTasks` arrays.
- [ ] Add rollback tests for quarantine and suggested task creation failures.

---

# Out of Scope

- [ ] Planned tasks, reminders, task confirmation, task APIs, calendar feed, worker/scheduler.
- [ ] Weather-based task decisions.
- [ ] Frontend task display beyond returned create response.

---

# Required Documents

- [ ] `docs/gardening-helper-domain-rules-and-invariants-v1.md`
- [ ] `docs/gardening-helper-canonical-api-contract-v1.md`
- [ ] `docs/gardening-helper-backend-application-design-pack-v1.md`
- [ ] `docs/001_initial_schema_gardening_helper.sql`
- [ ] `docs/004_guards_and_triggers_gardening_helper.sql`
- [ ] `docs/implementation-phases/phase-12-backend-activity-transaction-flow.md`

---

# Domain Rules Affected

This task touches:

- [x] account scoping
- [x] target resolution
- [x] activities
- [ ] inventory
- [x] product usage rules
- [x] quarantine
- [x] tasks/reminders
- [ ] problems/photos
- [ ] AI suggestions
- [ ] weather/rain confirmation
- [ ] frontend forms
- [x] API contract
- [x] database/migrations
- [x] auth/session boundary
- [ ] storage/file access boundary
- [ ] provider adapter boundary
- [ ] worker/scheduler responsibility
- [ ] deployment/security docs
- [ ] MCP tools / agent interface

Important rules to preserve:

```text
Suggested tasks are not planned tasks.
Reminders are created only for planned tasks.
Weather is advisory and must not auto-fail treatments.
Activity side effects are transaction-safe.
```

---

# MCP Impact

This task has no MCP impact.

- [x] has no MCP impact

MCP tools affected:

```text
none
```

Required MCP documentation updates:

```text
none
```

---

# Required Infrastructure/Security Boundaries

Preserve these rules:

- [ ] no direct frontend access to application tables
- [ ] no bypass of the Fastify API for application data
- [ ] no business logic in Angular components
- [ ] no business side-effect orchestration in database triggers
- [ ] no Supabase service role key in frontend code/env/build output/logs
- [ ] no direct Supabase SDK usage inside domain services except behind adapters
- [ ] Supabase Studio protected if deployment/admin config is touched
- [ ] PostgreSQL not publicly exposed if deployment/admin config is touched
- [ ] backend validates JWTs and derives account context server-side if auth is touched
- [ ] account scoping enforced backend-side
- [ ] Supabase Auth used only for auth/session flows
- [ ] Supabase Storage used through `StoragePort`
- [ ] Open-Meteo used through `WeatherPort`
- [ ] raw Web Push used through `PushPort`
- [ ] worker/scheduler ownership is explicit for reminders/weather checks

---

# Tests Required

- [ ] Product rule with quarantine days creates quarantine periods for resolved targets as specified.
- [ ] Product rule with reapplication interval creates suggested tasks and matching task targets.
- [ ] Suggested tasks have status `suggested` and no reminders.
- [ ] Failure during quarantine or suggested task creation rolls back all activity/inventory writes.

---

# Acceptance Criteria

- [ ] Rule-derived side effects are backend-owned, transaction-safe, and visible in the create response.

---

# Commands to Run

Run from the backend package root:

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
