# Implementation Task - Phase 1 Step 2: Fastify App Bootstrap

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
Create the Fastify app factory, server entrypoint, and route registration pattern under /api/v1 without adding domain routes.
```

## Branch

Use branch:

```text
feature/backend-foundation
```

---

# Scope

Implement only:

- [ ] Create a Fastify app factory that can be imported by tests.
- [ ] Ensure the app factory does not open a network listener.
- [ ] Create a server entrypoint that starts the listener only for runtime execution.
- [ ] Add centralized route registration under `/api/v1`.
- [ ] Add a route registration module that later feature modules can plug into.
- [ ] Keep handlers/controllers thin and framework-focused.
- [ ] Add a minimal app instantiation smoke test if not already covered.

---

# Out of Scope

Do not implement:

- [ ] `GET /api/v1/health` behavior unless it is implemented in Step 6.
- [ ] Domain CRUD endpoints.
- [ ] Database connectivity.
- [ ] Transaction helpers.
- [ ] Auth hooks or JWT validation.
- [ ] Account scoping.
- [ ] Frontend code.
- [ ] Provider adapters or provider SDK initialization.

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
- [ ] `docs/implementation-phases/phase-01/01-backend-package-and-tooling.md`
- [ ] Existing backend package/source files

---

# Domain Rules Affected

This task touches:

- [ ] API contract

Important rules to preserve:

```text
Backend owns business logic.
Controllers stay thin.
Services orchestrate workflows and transactions.
Repositories only access data.
External integrations go through ports/adapters.
API uses standard response envelopes.
```

---

# Required Implementation Details

Implement:

- [ ] Fastify app factory
- [ ] server entrypoint
- [ ] versioned route registration under `/api/v1`
- [ ] tests

Remove or ignore template items that are not relevant.

---

# Required Infrastructure/Security Boundaries

Preserve these rules:

- [ ] no direct frontend access to application tables
- [ ] no bypass of the Fastify API for application data
- [ ] no business side-effect orchestration in database triggers
- [ ] no Supabase service role key in frontend code/env/build output/logs
- [ ] no direct Supabase SDK usage inside domain services except behind adapters
- [ ] Supabase Studio protected if deployment/admin config is touched
- [ ] PostgreSQL not publicly exposed if deployment/admin config is touched
- [ ] Supabase Auth used only for auth/session flows
- [ ] Supabase Storage used through `StoragePort`
- [ ] Open-Meteo used through `WeatherPort`
- [ ] raw Web Push used through `PushPort`

---

# API Contract

Endpoints involved:

```text
No public endpoint is required in this step.
All future public endpoints must be registered under /api/v1.
```

Request/response must follow:

- `docs/gardening-helper-canonical-api-contract-v1.md`

---

# Tests Required

Add or update tests for:

- [ ] happy path
- [ ] API response shape where applicable

Specific test cases:

1. Fastify app factory can create an app instance without opening a listener.
2. App can be closed cleanly after a test.
3. Versioned route registration is reachable by later modules without registering non-versioned business routes.

---

# Acceptance Criteria

The task is complete when:

- [ ] `createApp` or equivalent app factory exists.
- [ ] Server entrypoint and test app factory are separated.
- [ ] Route registration convention under `/api/v1` exists.
- [ ] Tests can instantiate the Fastify app without binding a port.
- [ ] No domain CRUD or provider adapter behavior is introduced.
- [ ] Relevant checks pass or unavailable commands are reported exactly.

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

---

# Notes for Implementation Agent

Do not add placeholder domain routes that imply unsupported behavior.

Do not initialize database, Supabase, weather, AI, storage, or push providers in the app foundation.

Do not claim tests passed unless they were actually run.
