# Implementation Task - Phase 17 Step 1: Problems API Services and Feature Scaffold

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

Create the frontend problems feature scaffold and typed API services for metadata and photo upload endpoints.

## Branch

Use branch:

```text
feature/frontend-problems-photos
```

---

## Scope

- [ ] Inspect existing Angular routes, API client, auth interceptor, error mapper, shared controls, selectors, and Phase 10 feature patterns.
- [ ] Create `src/app/features/problems/` structure following local conventions.
- [ ] Add routes for `/problems`, `/problems/new`, and `/problems/:problemId`.
- [ ] Define frontend DTO/types for canonical problem, observation, photo, filters, create/update payloads, and upload responses.
- [ ] Implement `ProblemsApiService` for `GET/POST/PATCH /api/v1/problems` and `POST /api/v1/problems/:problemId/photos`.
- [ ] Ensure services do not send trusted `accountId` and do not call Supabase Storage directly.
- [ ] Add API service tests for canonical endpoints and multipart field name `file`.

## Out of Scope

- [ ] Page UI beyond minimal scaffold.
- [ ] Direct storage access.
- [ ] Backend API changes.
- [ ] AI problem assist.

## Required Documents

- [ ] `docs/gardening-helper-frontend-technical-spec-v1.md`
- [ ] `docs/gardening-helper-canonical-api-contract-v1.md`
- [ ] `docs/implementation-phases/phase-15-backend-problems-and-observations-api.md`
- [ ] `docs/implementation-phases/phase-16-backend-problem-photo-storage.md`
- [ ] Existing frontend API service and routing files.

---

# Domain Rules Affected

This task touches:

- [ ] account scoping
- [ ] problems/photos
- [ ] API contract
- [ ] auth/session boundary
- [ ] storage/file access boundary
- [ ] frontend forms

Important rules to preserve:

```text
Frontend is not business truth.
Frontend never talks directly to the database.
Frontend never accesses application tables directly.
All application data access goes through the Fastify API under /api/v1.
Frontend must not submit accountId for normal flows.
Problem photos are supported only for problems in v1; observation photos are not supported.
Frontend must not directly access Supabase Storage buckets.
Photo display must use backend-provided URLs only.
Service role key must never appear in frontend code, env files, build config, or tests.
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

# Required Infrastructure/Security Boundaries

Preserve these rules:

- [ ] no direct frontend access to application tables
- [ ] no bypass of the Fastify API for application data
- [ ] no business logic in Angular components
- [ ] no Supabase service role key in frontend code/env/build output/logs
- [ ] no direct Supabase Storage business calls from frontend code
- [ ] backend validates JWTs and derives account context server-side
- [ ] account scoping enforced backend-side
- [ ] Supabase Auth used only for auth/session flows
- [ ] no trusted accountId submitted from frontend payloads
- [ ] no observation photo upload path in frontend code
- [ ] photo display uses backend-provided URLs only

---

## Acceptance Criteria

- [ ] Problems routes and API service are scaffolded with typed canonical request/response shapes.
- [ ] No direct database/storage access or trusted `accountId` is introduced.

---

# Commands to Run

From the frontend package root, run relevant commands:

```bash
npm run typecheck
npm run lint
npm test
npm run build
npm run check:frontend-boundaries
```

Also run any configured frontend boundary/static checks. If any command is unavailable or fails due to pre-existing setup, report it clearly.

---

# PR Requirements

PR description must include:

- Summary
- Scope
- Domain rules affected
- API changes
- Tests run
- Storage/upload boundary status
- Review focus
