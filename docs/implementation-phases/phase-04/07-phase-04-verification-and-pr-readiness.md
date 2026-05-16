# Implementation Task - Phase 4 Step 7: Phase 4 Verification and PR Readiness

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
Complete Phase 4 verification by tightening frontend tests, static boundary checks, build scripts, documentation, and PR readiness for the frontend foundation.
```

## Branch

Use branch:

```text
feature/frontend-foundation
```

---

# Scope

Implement only:

- [ ] Inspect all frontend changes from Phase 4 Steps 1-6.
- [ ] Fill any missing tests required by the Phase 4 frontend foundation spec.
- [ ] Add or finalize static boundary checks for forbidden frontend Supabase table/storage usage and backend-only secrets.
- [ ] Add or finalize a check that raw `HttpClient` usage remains limited to core API/interceptor infrastructure.
- [ ] Verify route placeholders, shell, auth token behavior, API error mapping, and PWA/build setup.
- [ ] Update frontend README or docs with commands, environment variables, and integration/provider status where needed.
- [ ] Confirm Phase 4 did not add business feature pages or workflows beyond placeholders.
- [ ] Prepare the PR description with summary, scope, domain rules, API status, database status, tests, integration status, and review focus.

Expected paths, unless existing code clearly establishes a better equivalent:

```text
frontend/package.json
frontend/README.md
frontend/src/app/**/*.spec.ts
frontend/scripts/
```

---

# Out of Scope

Do not implement:

- [ ] new domain pages beyond placeholders.
- [ ] business forms or business workflows.
- [ ] backend CRUD/API phases.
- [ ] target resolver, activity transaction flow, inventory ledger, problem photos, tasks, calendar, AI, weather, or push notification registration.
- [ ] direct Supabase application-table or storage behavior.
- [ ] deployment changes beyond documenting frontend-safe config.

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
- [ ] `docs/env.example`
- [ ] `docs/implementation-phases/phase-04-frontend-project-foundation.md`
- [ ] `docs/TASK_TEMPLATE.md`
- [ ] all frontend files changed in Phase 4
- [ ] existing backend health route/envelope files if a smoke check references them

---

# Domain Rules Affected

This task touches:

- [ ] frontend forms
- [ ] API contract
- [ ] auth/session boundary
- [ ] storage/file access boundary
- [ ] provider adapter boundary
- [ ] deployment/security docs

Important rules to preserve:

```text
Frontend is not business truth.
Frontend never talks directly to the database.
Frontend never accesses application tables directly.
Frontend may use Supabase Auth only for login/session handling.
All application data access goes through the Fastify API.
Supabase service role key is backend-only.
Frontend must display API errors clearly.
PWA setup must not imply offline write sync.
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

- [ ] missing frontend foundation tests
- [ ] static frontend boundary checks
- [ ] package scripts for static checks if not already added
- [ ] frontend README/docs updates
- [ ] final verification fixes
- [ ] PR description notes

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
- [ ] backend validates JWTs and derives account context server-side if auth is touched
- [ ] account scoping enforced backend-side
- [ ] Supabase Auth used only for auth/session flows
- [ ] Supabase Storage used through `StoragePort`
- [ ] Open-Meteo used through `WeatherPort`
- [ ] raw Web Push used through `PushPort`

---

# API Contract

Endpoints involved:

```text
GET /api/v1/health
```

Request/response must follow:

- `docs/gardening-helper-canonical-api-contract-v1.md`

This phase must not introduce new backend API endpoints.

---

# Tests Required

Add or update tests for:

- [ ] happy path
- [ ] API response shape
- [ ] frontend form/shell behavior
- [ ] auth/session behavior
- [ ] edge cases

Specific test cases:

1. App shell renders primary navigation and router outlet.
2. Mobile navigation opens and closes.
3. Placeholder routes render without crashing.
4. Auth interceptor attaches bearer token when session token exists.
5. Auth interceptor omits auth header when no token exists.
6. Auth interceptor ignores non-API/Supabase Auth requests.
7. API error mapper handles canonical error envelopes.
8. Global error display shows backend `message` and validation details where available.
9. Static boundary check finds no direct Supabase table query calls in app code.
10. Static boundary check finds no direct Supabase Storage business calls in app code.
11. Static boundary check finds no backend-only environment variables in frontend code/config.
12. Static check finds no raw `HttpClient` usage outside approved core API/interceptor files.

---

# Acceptance Criteria

The task is complete when:

- [ ] Angular app shell exists
- [ ] Angular Material is configured
- [ ] PWA/service worker baseline is configured
- [ ] route placeholders exist for the documented route map where practical
- [ ] typed API base client targets `/api/v1`
- [ ] auth token interceptor sends bearer token to Fastify API calls
- [ ] API error mapper supports canonical error envelope
- [ ] app initialization/loading states exist
- [ ] `npm run typecheck` passes for frontend
- [ ] `npm run lint` passes for frontend if configured
- [ ] `npm test` passes for frontend
- [ ] `npm run build` passes for frontend
- [ ] static search/check confirms no direct application-table or storage access
- [ ] static search/check confirms no service role key or backend-only secret in frontend
- [ ] no domain pages or business workflows are implemented beyond placeholders
- [ ] PR description is complete

---

# Commands to Run

From the frontend package root, run:

```bash
npm run typecheck
npm run lint
npm test
npm run build
```

Run the frontend boundary/static checks, for example through the package script added during this phase:

```bash
npm run check:frontend-boundaries
```

If any command does not exist or fails due to pre-existing setup, report the exact command, exit state, and reason.

Never claim checks passed unless they were run.

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
Implemented frontend project foundation.

## Scope
- Added Angular Material PWA shell.
- Added route placeholders and typed API client foundation.
- Added auth token and API error interceptors.

## Domain rules preserved
- Frontend uses Fastify API for application data.
- Supabase usage is limited to auth/session handling.
- No frontend business truth was introduced.

## API changes
- No backend API endpoints added.
- Frontend client targets `/api/v1` and consumes `GET /api/v1/health` for smoke testing.

## Database changes
- None.

## Tests
- <commands run and results>

## Integration/provider status
- Auth: frontend Supabase Auth session bootstrap only.
- Storage: no frontend storage integration.
- Weather: not touched.
- AI: not touched.
- Push: PWA baseline only; no push subscription flow.

## Deferred work
- Domain pages, forms, notifications, AI, weather, storage, and business workflows remain deferred.

## Review focus
- Frontend/backend boundary.
- API envelope handling.
- Secret handling.
- Shell responsiveness.
```

---

# Notes for Implementation Agent

This is the phase closeout task. Keep changes focused on verification, tests, static checks, and documentation. Do not use this step to slip in feature pages or business workflows.
