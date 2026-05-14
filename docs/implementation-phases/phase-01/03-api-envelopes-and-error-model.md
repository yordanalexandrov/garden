# Implementation Task - Phase 1 Step 3: API Envelopes and Error Model

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
Add canonical API success/error envelope helpers, AppError, standard error codes, and Fastify error mapping.
```

## Branch

Use branch:

```text
feature/backend-foundation
```

---

# Scope

Implement only:

- [ ] Add typed success envelope helper returning `{ data: ... }`.
- [ ] Add typed error envelope helper returning `{ error: { code, message, details } }`.
- [ ] Add `AppError` or equivalent application error class.
- [ ] Add canonical error code constants/types.
- [ ] Map canonical error codes to HTTP statuses.
- [ ] Register a centralized Fastify error handler.
- [ ] Register a not-found handler that returns canonical error envelope.
- [ ] Ensure unexpected errors return `INTERNAL_ERROR` without leaking internals.
- [ ] Add unit/API tests for envelope and error mapping behavior.

Canonical foundation error codes:

```text
VALIDATION_ERROR
UNAUTHORIZED
FORBIDDEN
NOT_FOUND
CONFLICT
BUSINESS_RULE_VIOLATION
INVENTORY_SHORTAGE
EXTERNAL_SERVICE_ERROR
INTERNAL_ERROR
```

---

# Out of Scope

Do not implement:

- [ ] Domain-specific services or repositories.
- [ ] Real auth/JWT validation.
- [ ] Database error translation beyond generic future-safe placeholders.
- [ ] Provider-specific error adapters.
- [ ] Frontend error handling.
- [ ] Domain CRUD routes.

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
- [ ] `docs/implementation-phases/phase-01/02-fastify-app-bootstrap.md`
- [ ] Existing backend app/error/api files

---

# Domain Rules Affected

This task touches:

- [ ] API contract

Important rules to preserve:

```text
Backend owns business logic.
Controllers stay thin.
API uses standard response envelopes.
API responses must not leak inaccessible data.
Provider secrets must not be logged.
Do not throw raw strings.
Map application errors to standard API error codes.
```

---

# Required Implementation Details

Implement:

- [ ] shared API envelope helpers
- [ ] standard error code type/constants
- [ ] `AppError` class or equivalent
- [ ] error-to-status mapper
- [ ] Fastify error handler
- [ ] Fastify not-found handler
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
- [ ] account scoping enforced backend-side where business endpoints exist
- [ ] Supabase Storage used through `StoragePort`
- [ ] Open-Meteo used through `WeatherPort`
- [ ] raw Web Push used through `PushPort`

---

# API Contract

Endpoints involved:

```text
Framework-level unknown route behavior.
No domain endpoint is introduced in this step.
```

Request/response must follow:

- `docs/gardening-helper-canonical-api-contract-v1.md`

Expected success envelope:

```json
{ "data": {} }
```

Expected error envelope:

```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Invalid input",
    "details": {}
  }
}
```

---

# Tests Required

Add or update tests for:

- [ ] validation errors if validation behavior is already present
- [ ] API response shape
- [ ] edge cases

Specific test cases:

1. Success envelope helper returns exactly `{ data: value }`.
2. Error envelope helper returns exactly `{ error: { code, message, details } }`.
3. Each canonical `AppError` code maps to the expected HTTP status from the API contract.
4. Unknown route returns `NOT_FOUND` in the canonical error envelope.
5. Unexpected thrown error returns `INTERNAL_ERROR` without exposing stack traces or raw error text to the response.

---

# Acceptance Criteria

The task is complete when:

- [ ] Success responses have a shared canonical helper.
- [ ] Error responses have a shared canonical helper.
- [ ] Standard error codes match the canonical API contract.
- [ ] Fastify maps known and unknown errors to canonical envelopes.
- [ ] Unexpected errors are logged server-side and sanitized client-side.
- [ ] Tests cover envelope helpers and error mapping.
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

Do not return unwrapped raw objects from public route handlers.

Do not include internal stack traces, provider secrets, environment values, or database details in client-visible errors.

Do not claim tests passed unless they were actually run.
