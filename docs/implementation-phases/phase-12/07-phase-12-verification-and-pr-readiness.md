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

# Implementation Task - Phase 12 Step 7: Phase 12 Verification and PR Readiness

## Goal

Verify Phase 12 backend activity transaction work, update implementation status, commit focused changes, and open the implementation PR.

## Branch

Use branch:

```text
feature/backend-activity-transaction
```

---

# Scope

- [ ] Review the final diff for accidental scope creep into Phase 13 correction, Phase 14 frontend, Phase 18 tasks/reminders, weather, AI, push, storage, deployment, or MCP tools.
- [ ] Verify controllers are thin and activity orchestration is in service layer transactions.
- [ ] Verify target resolver reuse, account scoping, inventory ledger behavior, quarantine generation, suggested task behavior, response shapes, and rollback coverage.
- [ ] Run configured backend checks.
- [ ] Update `docs/gardening-helper-implementation-status-handoff.md` to mark Phase 12 implemented only if the implementation and checks are complete.
- [ ] Commit focused changes and open a PR with the expected Phase 12 summary from the top-level phase spec.

---

# Domain Rules Affected

This task touches:

- [x] account scoping
- [x] target resolution
- [x] activities
- [x] inventory
- [x] product usage rules
- [x] quarantine
- [x] tasks/reminders
- [ ] problems/photos
- [ ] AI suggestions
- [ ] weather/rain confirmation
- [ ] frontend forms
- [x] API contract
- [ ] database/migrations
- [x] auth/session boundary
- [ ] storage/file access boundary
- [ ] provider adapter boundary
- [x] worker/scheduler responsibility
- [ ] deployment/security docs
- [ ] MCP tools / agent interface

Important rules to preserve:

```text
Controllers stay thin.
Activity creation with product usage must be transactional.
Target resolver is reused instead of duplicating target truth.
Stock changes create inventory movements and never make lots negative.
Suggested tasks remain suggested and do not create reminders.
No direct frontend access to application tables.
No Supabase service role key exposed to frontend.
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

# Acceptance Criteria

- [ ] All Phase 12 task docs are complete.
- [ ] Implementation status handoff reflects actual implementation progress.
- [ ] PR is open and ready for Review Agent review.

---

# Commands to Run

From the backend package root, run where configured:

```bash
npm run typecheck
npm run lint
npm test
npm run test:db
npm run build
```

Also run any project boundary/static checks that verify backend/frontend separation, no frontend service-role exposure, controller/service/repository layering, and no direct frontend table access.

---

# PR Requirements

PR description must include:

- [ ] Summary of activity list/detail/create APIs.
- [ ] Transaction boundary and side effects included.
- [ ] Domain rules preserved.
- [ ] Tests run with exact commands and results.
- [ ] Deferred work: correction/audit expansion, frontend create activity, task confirmation/reminders, calendar, weather, and AI.
- [ ] Review focus: transaction safety, inventory ledger correctness, target resolver reuse, quarantine/suggested task behavior.
