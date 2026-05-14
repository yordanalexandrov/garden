# Implementation Task - Phase 1 Step 6: Health Route

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
Add unauthenticated GET /api/v1/health using the canonical success envelope.
```

## Branch

Use branch:

```text
feature/backend-foundation
```

---

# Scope

Implement only:

- [ ] Add a `health` backend module or equivalent route file.
- [ ] Register `GET /api/v1/health`.
- [ ] Return canonical success envelope with `status: "ok"` and ISO timestamp.
- [ ] Keep the health handler free of domain logic.
- [ ] Keep the health handler unauthenticated because the canonical contract allows it.
- [ ] Add route tests for success shape and no-auth access.

---

# Out of Scope

Do not implement:

- [ ] Database health checks.
- [ ] Provider health checks.
- [ ] Auth/JWT validation.
- [ ] Account scoping.
- [ ] Domain CRUD endpoints.
- [ ] Frontend health display.
- [ ] Operational readiness/deployment checks.

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
- [ ] `docs/implementation-phases/phase-01/02-fastify-app-bootstrap.md`
- [ ] `docs/implementation-phases/phase-01/03-api-envelopes-and-error-model.md`
- [ ] Existing backend app/route/api files

---

# Domain Rules Affected

This task touches:

- [ ] API contract

Important rules to preserve:

```text
Backend owns API behavior.
Controllers stay thin.
API uses standard response envelopes.
No domain CRUD or provider integrations are introduced in this phase.
Health is unauthenticated only because the canonical API contract allows it.
```

---

# Required Implementation Details

Implement:

- [ ] backend controller/route
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
- [ ] backend validates JWTs and derives account context server-side if auth is touched
- [ ] Supabase Storage used through `StoragePort`
- [ ] Open-Meteo used through `WeatherPort`
- [ ] raw Web Push used through `PushPort`

---

# API Contract

Endpoints involved:

```text
GET /api/v1/health
```

Request shape:

```text
No body.
No authentication required.
```

Response must follow:

- `docs/gardening-helper-canonical-api-contract-v1.md`

Success response:

```json
{
  "data": {
    "status": "ok",
    "timestamp": "2026-05-13T12:00:00.000Z"
  }
}
```

---

# Tests Required

Add or update tests for:

- [ ] happy path
- [ ] API response shape
- [ ] edge cases

Specific test cases:

1. `GET /api/v1/health` returns HTTP 200.
2. Response body is `{ data: { status: "ok", timestamp: "ISO timestamp string" } }`.
3. Timestamp is valid ISO 8601.
4. Request succeeds without an `Authorization` header.
5. Health route does not require database/provider environment variables.

---

# Acceptance Criteria

The task is complete when:

- [ ] `GET /api/v1/health` is registered under `/api/v1`.
- [ ] The route returns the canonical success envelope.
- [ ] The route is unauthenticated.
- [ ] The route has no domain, database, or provider side effects.
- [ ] API tests cover status, envelope, timestamp, and no-auth behavior.
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

Do not add database/provider readiness checks to Phase 1 health.

Do not add authentication to health.

Do not claim tests passed unless they were actually run.
