# Implementation Task - Phase 3 Step 7: Verification and PR Readiness

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
Complete Phase 3 verification, confirm scope boundaries, run checks, and prepare the PR description for auth and account boundary foundation.
```

## Branch

Use branch:

```text
feature/auth-account-boundary
```

---

# Scope

Implement only:

- [ ] Review all Phase 3 implementation files for consistency with the phase spec.
- [ ] Confirm `AuthPort` is defined and service-facing auth contracts are provider-neutral.
- [ ] Confirm Supabase Auth verification is isolated behind the auth adapter boundary.
- [ ] Confirm `SUPABASE_JWT_SECRET` and `SUPABASE_SERVICE_ROLE_KEY` remain backend-only and redacted.
- [ ] Confirm `AccountsRepository` uses the existing `accounts` table and documented account lookup policy.
- [ ] Confirm missing/invalid tokens return canonical `UNAUTHORIZED` envelopes.
- [ ] Confirm valid account A/account B tokens derive distinct actor/account context server-side.
- [ ] Confirm health and any other bootstrap route intended to stay public remains unauthenticated.
- [ ] Confirm no public domain CRUD endpoints, frontend login UI, provider adapters outside auth, MCP tools, or schema redesign were added.
- [ ] Run all required backend checks.
- [ ] Run database-backed account tests against a dedicated local/test PostgreSQL-compatible database if the implementation requires one.
- [ ] Prepare a PR description using the Phase 3 expected PR summary.

---

# Out of Scope

Do not implement:

- [ ] New domain features.
- [ ] Places, plants, growing-structure, products, inventory, activity, problem, task, weather, AI, file, push, or MCP workflows.
- [ ] Frontend project or auth UI.
- [ ] General role/permission system beyond v1 account scoping.
- [ ] Deployment files beyond minimal docs required for auth secret/config expectations.
- [ ] Extra refactors unrelated to Phase 3.
- [ ] Schema redesign unless a blocking executable mismatch was already documented in a new forward migration.

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
- [ ] `docs/env.example`
- [ ] `docs/001_initial_schema_gardening_helper.sql`
- [ ] `docs/implementation-phases/phase-03-auth-and-account-boundary.md`
- [ ] All prior files in `docs/implementation-phases/phase-03/`
- [ ] All backend source, test, config, package, and docs files changed in Phase 3

---

# Domain Rules Affected

This task touches:

- [ ] account scoping
- [ ] auth/session boundary
- [ ] API contract
- [ ] provider adapter boundary
- [ ] deployment/security docs
- [ ] MCP tools / agent interface

Important rules to preserve:

```text
All business records belong to an account.
Cross-account access is forbidden.
Account consistency is mandatory.
Frontend must not submit accountId for normal flows.
Backend validates Supabase Auth JWTs through AuthPort.
Backend derives authenticated user/account context server-side.
Supabase service role key is backend-only.
Angular must not access application tables directly.
MCP tools are not a privileged bypass channel and must call backend services/API.
```

---

# MCP Impact

This task:

- [ ] changes backend behavior used by future MCP tools

MCP tools affected:

```text
None in Phase 3.
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
- [ ] PR description
- [ ] verification checklist
- [ ] static/scope checks

Remove or ignore template items that are not relevant.

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

# API Contract

Endpoints involved:

```text
GET /api/v1/health remains unauthenticated.
No public business endpoints are introduced in Phase 3.
Any protected test route remains test-only and non-public.
```

Authentication behavior must follow:

- `Authorization: Bearer <access_token>`
- canonical `UNAUTHORIZED` error envelope for missing/invalid tokens
- documented `UNAUTHORIZED` or `FORBIDDEN` policy for account lookup failures

---

# Tests Required

Add or update tests for:

- [ ] happy path
- [ ] validation errors
- [ ] account scoping
- [ ] API response shape
- [ ] edge cases

Specific test cases:

1. `AuthPort` contract and auth adapter compile without leaking provider SDK types into service-facing modules.
2. Missing token returns canonical `UNAUTHORIZED`.
3. Invalid token returns canonical `UNAUTHORIZED`.
4. Valid account A token derives account A actor context.
5. Valid account B token derives account B actor context.
6. Account lookup failure returns the documented canonical error.
7. Static checks prove no service role key exposure and no frontend direct table access introduced by Phase 3.
8. Static checks prove no public domain CRUD routes were added in Phase 3.

---

# Acceptance Criteria

The task is complete when:

- [ ] `AuthPort` is defined.
- [ ] Supabase Auth adapter or production-shaped boundary exists.
- [ ] Deterministic test auth adapter exists.
- [ ] Fastify auth hook protects future business route groups.
- [ ] Actor/account context is available to future controllers/services.
- [ ] `AccountsRepository` exists.
- [ ] Missing token returns `UNAUTHORIZED`.
- [ ] Invalid token returns `UNAUTHORIZED`.
- [ ] Valid token resolves actor/account context.
- [ ] Account A/account B test helper pattern exists.
- [ ] No service role key is exposed to frontend code/config/logs.
- [ ] No domain API or frontend auth UI has been implemented.
- [ ] Backend tests/typecheck/lint/build pass where configured, or failures are reported exactly.

---

# Commands to Run

Run from the backend package root:

```bash
npm run typecheck
npm run lint
npm test
npm run build
```

Run database-backed account/auth tests against a dedicated local/test PostgreSQL-compatible database if required. If no database is available, report the exact missing prerequisite and do not claim those tests passed.

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

Suggested PR summary:

```md
## Summary
Implemented backend auth and account boundary foundation.

## Scope
- Added AuthPort and auth adapter boundary.
- Added Fastify auth hook and authenticated actor context.
- Added AccountsRepository and account-scoped test helpers.

## Domain rules preserved
- Backend validates JWTs through AuthPort.
- Backend derives account context server-side.
- Supabase service role key remains backend-only.

## Tests
- <commands run and results>

## Deferred work
- Frontend login UI and all domain APIs remain deferred.

## Review focus
- Account context derivation.
- AuthPort isolation.
- Secret handling.
- Cross-account test fixture readiness.
```

---

# Notes for Implementation Agent

The phase is ready only if later business endpoint authors have a clear, tested way to receive account context without trusting frontend-provided `accountId`.
