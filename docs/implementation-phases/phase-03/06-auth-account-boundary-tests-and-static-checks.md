# Implementation Task - Phase 3 Step 6: Auth Account Boundary Tests and Static Checks

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
Add focused Phase 3 tests and static checks that prove auth failures, account context derivation, and secret/provider boundaries.
```

## Branch

Use branch:

```text
feature/auth-account-boundary
```

---

# Scope

Implement only:

- [ ] Review the tests added in Steps 1 through 5 and close any coverage gaps from the Phase 3 spec.
- [ ] Add API-level tests for missing, malformed, invalid, expired, and valid account tokens.
- [ ] Add account A/account B tests proving request context differs by authenticated account.
- [ ] Add account lookup failure tests using the documented 401/403 policy.
- [ ] Add static/security checks where practical for:
  - [ ] no `SUPABASE_SERVICE_ROLE_KEY` references in frontend paths
  - [ ] no backend-only auth secrets in frontend-safe config
  - [ ] auth provider code isolated under auth adapter/module paths
  - [ ] no business route accepts trusted `accountId` from request body in Phase 3 code
- [ ] Confirm test-only protected routes remain excluded from the public canonical API.
- [ ] Keep checks precise enough to avoid blocking unrelated future work without a clear reason.

---

# Out of Scope

Do not implement:

- [ ] Domain CRUD endpoint tests.
- [ ] Full cross-account business data access tests for places, activities, inventory, tasks, problems, AI, weather, or files.
- [ ] Frontend login/session tests.
- [ ] Supabase Storage/weather/push/AI provider checks.
- [ ] Deployment hardening beyond auth secret static checks.
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
- [ ] `docs/env.example`
- [ ] `docs/implementation-phases/phase-03-auth-and-account-boundary.md`
- [ ] Prior files in `docs/implementation-phases/phase-03/`
- [ ] All backend source, tests, config, package, and docs changed so far in Phase 3

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
Backend validates Supabase Auth JWTs through AuthPort.
Backend derives authenticated user/account context server-side.
Backend enforces account scoping on every application data read/write.
Cross-account access is forbidden.
Supabase service role key is backend-only.
Angular must not access application tables directly.
MCP tools are not a privileged bypass channel and must call backend services/API.
```

MCP is touched only by preserving the future boundary: do not add MCP tools or bypasses in this phase.

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

- [ ] auth API behavior tests
- [ ] account context tests
- [ ] account lookup failure tests
- [ ] static secret-boundary checks
- [ ] static provider-boundary checks
- [ ] test-only route scope checks
- [ ] docs/update notes if auth test helper usage needs clarification

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
- [ ] worker/scheduler ownership is explicit for reminders/weather checks

---

# API Contract

Endpoints involved:

```text
GET /api/v1/health remains unauthenticated.
Any protected test route remains test-only and non-public.
```

Auth errors must use the canonical error envelope and the `UNAUTHORIZED` or documented `FORBIDDEN` code according to `docs/gardening-helper-canonical-api-contract-v1.md`.

---

# Tests Required

Add or update tests for:

- [ ] happy path
- [ ] validation errors
- [ ] account scoping
- [ ] API response shape
- [ ] edge cases

Specific test cases:

1. Missing token on protected test route returns 401 canonical `UNAUTHORIZED`.
2. Malformed bearer header returns 401 canonical `UNAUTHORIZED`.
3. Invalid token returns 401 canonical `UNAUTHORIZED`.
4. Expired token returns 401 canonical `UNAUTHORIZED` if JWT expiry verification is implemented in Phase 3.
5. Valid account A token exposes account A context and not account B.
6. Valid account B token exposes account B context and not account A.
7. Missing or archived account lookup returns the documented 401/403 canonical error.
8. Static check proves service role key is not referenced from frontend paths.
9. Static check proves auth provider code stays behind auth adapter/module paths.
10. Static check proves Phase 3 did not introduce public domain CRUD routes or request-body `accountId` trust.

---

# Acceptance Criteria

The task is complete when:

- [ ] Phase 3 auth and account boundary tests cover the required failure and success paths.
- [ ] Account A/account B helper pattern is proven.
- [ ] Secret/provider boundary static checks exist where practical.
- [ ] Health remains unauthenticated.
- [ ] No public domain endpoint, frontend UI, MCP tool, or schema redesign is introduced.
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

If database-backed account tests require a local/test PostgreSQL-compatible database and one is unavailable, report the exact missing prerequisite.

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

Prefer narrow static checks that catch the known Phase 3 risks. Do not add broad scans that will create noisy failures for unrelated future code.
