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

# Implementation Task - Phase 12 Step 2: Activities Repository, List, and Detail Reads

## Goal

Implement account-scoped activity repository read methods plus `GET /activities` and `GET /activities/:activityId`.

## Branch

Use branch:

```text
feature/backend-activity-transaction
```

---

# Scope

- [ ] Implement `ActivitiesRepository` list/detail reads using account-scoped queries.
- [ ] Include activity header, target summaries, product usages, inventory effects where available, quarantine periods, suggested task references where available, and warnings/read metadata according to canonical response needs.
- [ ] Implement `ActivitiesService.listActivities` and `getActivity`.
- [ ] Implement filters/pagination supported by the canonical contract and local query patterns.
- [ ] Return `NOT_FOUND` for inaccessible activity detail.
- [ ] Add API/repository tests for list pagination, filters, detail shape, and account scoping.

---

# Out of Scope

- [ ] `POST /activities`.
- [ ] Activity correction.
- [ ] Frontend pages.
- [ ] Weather rain confirmation or calendar/dashboard aggregation.

---

# Required Documents

- [ ] `docs/gardening-helper-canonical-api-contract-v1.md`
- [ ] `docs/gardening-helper-domain-rules-and-invariants-v1.md`
- [ ] `docs/gardening-helper-backend-application-design-pack-v1.md`
- [ ] `docs/001_initial_schema_gardening_helper.sql`
- [ ] `docs/002_views_gardening_helper.sql`
- [ ] `docs/implementation-phases/phase-12-backend-activity-transaction-flow.md`
- [ ] Existing repository and route tests.

---

# Domain Rules Affected

This task touches:

- [x] account scoping
- [x] target resolution
- [x] activities
- [ ] inventory
- [ ] product usage rules
- [ ] quarantine
- [ ] tasks/reminders
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
Activities are historical records.
Account scoping is mandatory for all reads.
Target labels are read models only.
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

- [ ] Account A cannot list or read account B activities.
- [ ] List response uses canonical pagination envelope.
- [ ] Detail response includes targets/product usages and canonical arrays.
- [ ] Inaccessible ID returns canonical `NOT_FOUND` or `FORBIDDEN` per local convention.

---

# Acceptance Criteria

- [ ] Activity reads are available and account-scoped.
- [ ] Response shapes are compatible with the future frontend.

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
