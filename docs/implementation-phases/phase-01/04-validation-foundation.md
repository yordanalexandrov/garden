# Implementation Task - Phase 1 Step 4: Validation Foundation

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
Add centralized typed request validation setup, preferably with Zod, and canonical validation error mapping.
```

## Branch

Use branch:

```text
feature/backend-foundation
```

---

# Scope

Implement only:

- [ ] Add a shared validation helper/plugin for params, query, and body validation.
- [ ] Prefer Zod unless existing project tooling strongly indicates another schema library.
- [ ] Convert validation failures into `VALIDATION_ERROR`.
- [ ] Include useful field-level validation details in the canonical error envelope.
- [ ] Keep validation at the controller/route boundary.
- [ ] Add a test-only route or test fixture for validation failure tests if no production route can safely exercise it.
- [ ] Add tests for validation detail shape and status code.

---

# Out of Scope

Do not implement:

- [ ] Service-layer cross-entity validation.
- [ ] Database constraints.
- [ ] Domain request schemas for future CRUD routes.
- [ ] Auth/account validation.
- [ ] Multipart upload validation.
- [ ] AI payload validation.
- [ ] Frontend form validation.

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
- [ ] `docs/implementation-phases/phase-01/03-api-envelopes-and-error-model.md`
- [ ] Existing backend validation/error/app files

---

# Domain Rules Affected

This task touches:

- [ ] API contract

Important rules to preserve:

```text
Backend validation is authoritative.
Validation exists at multiple layers.
Controller layer validates request shape before service invocation.
Cross-entity validation belongs in the service layer, not in controllers or repositories.
API uses standard response envelopes.
```

---

# Required Implementation Details

Implement:

- [ ] backend validation schema/helper foundation
- [ ] validation error mapper
- [ ] test-only validation fixture where appropriate
- [ ] tests

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
- [ ] account scoping enforced backend-side where business endpoints exist

---

# API Contract

Endpoints involved:

```text
No business endpoint is introduced.
A test-only validation route/fixture is allowed only for API contract tests and must not become domain behavior.
```

Request/response must follow:

- `docs/gardening-helper-canonical-api-contract-v1.md`

Validation error response must use:

```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Invalid input",
    "details": {
      "field": ["message"]
    }
  }
}
```

---

# Tests Required

Add or update tests for:

- [ ] validation errors
- [ ] API response shape
- [ ] edge cases

Specific test cases:

1. Invalid request body maps to HTTP 400 and `VALIDATION_ERROR`.
2. Invalid params or query maps to HTTP 400 and `VALIDATION_ERROR`.
3. Validation error details include field-level messages.
4. Validation response uses canonical `{ error: { code, message, details } }`.
5. Valid request against the validation fixture reaches the handler.

---

# Acceptance Criteria

The task is complete when:

- [ ] Central validation setup exists and is typed.
- [ ] Validation failures produce canonical `VALIDATION_ERROR` envelopes.
- [ ] Field details are useful for frontend display.
- [ ] Validation behavior is covered by tests.
- [ ] No domain workflows are implemented.
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

Do not put cross-resource business validation in the validation helper. That belongs in later service-layer tasks.

Do not expose test-only validation fixtures as documented application behavior.

Do not claim tests passed unless they were actually run.
