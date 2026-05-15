# Implementation Task - Phase 3 Step 2: Supabase Auth Adapter Boundary

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
Add the production-shaped Supabase Auth adapter behind AuthPort, including backend-only config validation and canonical failure mapping.
```

## Branch

Use branch:

```text
feature/auth-account-boundary
```

---

# Scope

Implement only:

- [ ] Inspect existing backend config and logger secret redaction behavior.
- [ ] Choose the minimal JWT verification dependency or standard-library approach needed to verify self-hosted Supabase Auth access tokens.
- [ ] Implement a Supabase Auth adapter behind `AuthPort`.
- [ ] Validate token signature, issuer/audience/expiry behavior as supported by the selected JWT library and configured self-hosted Supabase values.
- [ ] Derive provider user identity and any configured application account claim from verified claims without trusting request bodies.
- [ ] If the final `AuthenticatedActor` requires active account lookup, expose a clear composition point for Step 3 or Step 4 to complete that lookup through `AccountsRepository`.
- [ ] Normalize provider/JWT failures to canonical `UNAUTHORIZED` errors.
- [ ] Keep `SUPABASE_JWT_SECRET` and `SUPABASE_SERVICE_ROLE_KEY` backend-only and redacted.
- [ ] Add a factory or dependency-injection point so tests can use a deterministic auth adapter instead of real Supabase tokens.
- [ ] Avoid importing Supabase SDK or provider details into services/controllers except through the adapter boundary.

Expected paths, unless existing code clearly establishes a better equivalent:

```text
backend/src/integrations/auth/supabase-auth.adapter.ts
backend/src/integrations/auth/auth-adapter.factory.ts
backend/test/auth/supabase-auth.adapter.test.ts
```

---

# Out of Scope

Do not implement:

- [ ] `AccountsRepository` or account database lookup.
- [ ] Automatic account creation unless it is deferred to Step 3 and documented there.
- [ ] Fastify auth plugin/hook wiring.
- [ ] Frontend Supabase Auth login/session code.
- [ ] Supabase Storage, Open-Meteo, AI, or Push adapters.
- [ ] Domain business endpoints.
- [ ] Schema changes.

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
- [ ] `docs/implementation-phases/phase-03-auth-and-account-boundary.md`
- [ ] Prior files in `docs/implementation-phases/phase-03/`
- [ ] Existing backend config, logger, auth contract, package, and tests

---

# Domain Rules Affected

This task touches:

- [ ] account scoping
- [ ] auth/session boundary
- [ ] provider adapter boundary
- [ ] deployment/security docs

Important rules to preserve:

```text
Fastify validates JWTs through AuthPort.
Fastify derives authenticated actor/account context server-side.
Fastify rejects invalid, expired, missing, or mismatched tokens.
Supabase service role key is backend-only.
Supabase Auth is used through AuthPort.
Integrations remain behind ports/adapters.
```

This step proves the provider boundary, not route authorization or account repository behavior. Active account existence is verified in a later step unless this adapter is explicitly composed with `AccountsRepository`.

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

- [ ] Supabase Auth adapter through `AuthPort`
- [ ] backend-only JWT/auth config validation
- [ ] canonical auth error mapping
- [ ] adapter dependency injection/factory
- [ ] logger/config redaction coverage for auth secrets
- [ ] unit tests for valid and invalid token handling

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
None in this step.
```

Adapter failures must be suitable for route-level mapping to:

```text
401 UNAUTHORIZED
```

with the canonical error envelope from `docs/gardening-helper-canonical-api-contract-v1.md`.

---

# Tests Required

Add or update tests for:

- [ ] happy path
- [ ] validation errors
- [ ] edge cases
- [ ] secret-boundary behavior

Specific test cases:

1. Adapter verifies a deterministic test JWT signed with configured `SUPABASE_JWT_SECRET`.
2. Adapter rejects expired tokens with `UNAUTHORIZED`.
3. Adapter rejects malformed or unverifiable tokens with `UNAUTHORIZED`.
4. Adapter rejects tokens with missing required user identity or account-claim data according to the documented policy.
5. Config/logger tests do not expose `SUPABASE_JWT_SECRET` or `SUPABASE_SERVICE_ROLE_KEY`.
6. Service-facing auth modules do not import provider SDK details.

---

# Acceptance Criteria

The task is complete when:

- [ ] Supabase Auth verification is isolated behind `AuthPort`.
- [ ] Auth secret config remains backend-only and redacted.
- [ ] Invalid/expired/malformed provider tokens map to canonical unauthorized errors.
- [ ] The adapter can be swapped for deterministic tests.
- [ ] No account repository, protected routes, frontend code, or domain endpoints are added.
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

Do not use Supabase service role key to bypass JWT validation. The adapter must validate the access token and return backend-owned context.
