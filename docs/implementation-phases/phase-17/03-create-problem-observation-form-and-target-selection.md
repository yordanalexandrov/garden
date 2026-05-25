# Implementation Task - Phase 17 Step 3: Create Problem/Observation Form and Target Selection

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

Implement the Reactive Forms create flow for problem and observation metadata with target selection and visible target summary.

## Branch

Use branch:

```text
feature/frontend-problems-photos
```

---

## Scope

- [ ] Build `/problems/new` metadata form with `type`, `placeId`, `targetType`, `targetId`, `title`, `description`, `category`, `severity`, `status`, `observedAt`, and optional linked activity where supported.
- [ ] Reuse existing place/target selector patterns where possible.
- [ ] Show selected place, target type, target label, and target summary before save.
- [ ] Use client validation for required fields and enum choices while keeping backend validation authoritative.
- [ ] Submit canonical metadata payload without trusted `accountId`.
- [ ] Preserve form data on backend validation/business-rule errors.
- [ ] Add component tests for required fields, type switching, target summary, request shape, and API errors.

## Out of Scope

- [ ] Photo uploader implementation beyond reserving the section for Step 4.
- [ ] Backend target validation.
- [ ] Observation photos.

## Domain Rules

- Problems and observations require place/target context.
- Frontend shows user intent but backend validates account/place/target truth.

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

- [ ] Problem and observation metadata can be submitted through the UI.
- [ ] Target summary is visible before save and backend errors do not clear input.

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
