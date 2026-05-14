# Implementation Task - Phase 1 Step 7: Foundation Tests and PR Readiness

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
Complete Phase 1 test coverage, run verification commands, confirm scope boundaries, and prepare the PR description.
```

## Branch

Use branch:

```text
feature/backend-foundation
```

---

# Scope

Implement only:

- [ ] Review all Phase 1 implementation files for consistency.
- [ ] Ensure tests cover app instantiation, health route, success envelopes, error envelopes, validation error mapping, unknown route mapping, and secret redaction.
- [ ] Ensure scripts run from the backend package root.
- [ ] Add or update backend README/package notes only if needed for local commands/env expectations.
- [ ] Run all required backend checks.
- [ ] Confirm no out-of-scope database/auth/frontend/provider/domain code was added.
- [ ] Prepare a PR description using the Phase 1 expected PR summary.

---

# Out of Scope

Do not implement:

- [ ] New domain features.
- [ ] Database client, migrations, repositories, or transactions.
- [ ] Auth/JWT/account context.
- [ ] Frontend project setup.
- [ ] Provider adapters.
- [ ] Deployment files beyond minimal docs required for backend commands.
- [ ] Extra refactors unrelated to Phase 1.

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
- [ ] `docs/implementation-phases/phase-01-backend-project-foundation.md`
- [ ] All prior files in `docs/implementation-phases/phase-01/`
- [ ] All backend source and test files changed in Phase 1

---

# Domain Rules Affected

This task touches:

- [ ] API contract
- [ ] deployment/security docs

Important rules to preserve:

```text
Backend owns business logic.
Controllers stay thin.
Services orchestrate workflows and transactions.
Repositories only access data.
External integrations go through ports/adapters.
Supabase service role key is backend-only.
Provider secrets must not be logged.
API uses standard response envelopes.
No hidden business side effects are implemented in database triggers.
```

---

# Required Implementation Details

Implement:

- [ ] tests
- [ ] docs/update notes
- [ ] PR description
- [ ] verification checklist

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
- [ ] account scoping enforced backend-side where business endpoints exist
- [ ] Supabase Auth used only for auth/session flows
- [ ] Supabase Storage used through `StoragePort`
- [ ] Open-Meteo used through `WeatherPort`
- [ ] raw Web Push used through `PushPort`
- [ ] worker/scheduler ownership is explicit for reminders/weather checks

---

# API Contract

Endpoints involved:

```text
GET /api/v1/health
Unknown route framework behavior
Test-only validation fixture, if one exists
```

Request/response must follow:

- `docs/gardening-helper-canonical-api-contract-v1.md`

---

# Tests Required

Add or update tests for:

- [ ] happy path
- [ ] validation errors
- [ ] API response shape
- [ ] edge cases

Specific test cases:

1. Fastify app can be created in tests without opening a network listener.
2. `GET /api/v1/health` returns 200 and canonical success envelope.
3. Unknown route returns canonical `NOT_FOUND` error envelope.
4. Validation failure returns 400 and canonical `VALIDATION_ERROR` envelope with details.
5. Envelope helper returns canonical success shape.
6. Error mapper maps all standard error codes to expected HTTP statuses.
7. Config/logger tests or static checks prevent logging service role keys, JWT secrets, VAPID private keys, AI keys, database URLs, and database passwords.

---

# Acceptance Criteria

The task is complete when:

- [ ] Backend package/project structure exists.
- [ ] `GET /api/v1/health` returns `{ data: ... }`.
- [ ] Errors use `{ error: { code, message, details } }`.
- [ ] Standard error codes match the canonical API contract.
- [ ] Fastify app can be created in tests without opening a port.
- [ ] `npm run typecheck` passes for backend.
- [ ] `npm run lint` passes for backend if configured.
- [ ] `npm test` passes for backend.
- [ ] `npm run build` passes for backend.
- [ ] No domain CRUD or provider adapters were added.
- [ ] No secrets are hardcoded or logged.
- [ ] PR description is complete.

---

# Commands to Run

Run from the backend package root:

```bash
npm run typecheck
npm run lint
npm test
npm run build
```

If any command does not exist or fails due to pre-existing setup, report it clearly.

Optional static/scope checks:

```bash
rg -n "SUPABASE_SERVICE_ROLE_KEY|VAPID_PRIVATE_KEY|AI_API_KEY|POSTGRES_PASSWORD|DATABASE_URL" backend
rg -n "from '@supabase|createClient|open-meteo|web-push|OpenAI" backend/src
```

Use the static checks to verify secrets/providers are not introduced incorrectly. If expected references exist in config redaction tests, explain them in the PR.

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

Suggested PR description:

```md
## Summary
Implemented backend project foundation for Gardening Helper.

## Scope
- Added Fastify/TypeScript backend skeleton.
- Added `/api/v1` route registration and health endpoint.
- Added shared API envelope, error, validation, config, logger, and test setup.

## Domain Rules Preserved
- Backend owns API behavior.
- Controllers remain thin.
- No domain workflows or provider integrations were introduced.

## API Changes
- Added unauthenticated `GET /api/v1/health`.

## Database Changes
- None.

## Tests
- List each command that was run and its actual result.

## Integration/Provider Status
- No Supabase, Open-Meteo, AI, Push, or Storage adapters were initialized.

## Deferred Work
- Database, auth/account scoping, domain APIs, frontend, and provider adapters remain deferred to later phases.

## Review Focus
- API envelope correctness.
- Error mapping.
- Validation error shape.
- Config/logger secret handling.
- Phase 1 scope boundaries.
```

---

# Notes for Implementation Agent

Do not claim tests passed unless they were actually run.

Do not include unrelated documentation or source changes in the commit.

If a check cannot run, state exactly why in the PR description.
