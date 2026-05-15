# Implementation Task - Phase 3 Step 3: Accounts Repository and Account Lookup

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
Add AccountsRepository and the account lookup policy that connects verified auth identity to an active application account.
```

## Branch

Use branch:

```text
feature/auth-account-boundary
```

---

# Scope

Implement only:

- [ ] Inspect the `accounts` table schema, Phase 2 database client/transaction API, and backend design pack repository contract.
- [ ] Add `Account` domain/read model type for the existing `accounts` table.
- [ ] Implement `AccountsRepository.findById(accountId, db?)`.
- [ ] Add any additional minimal lookup method required by the documented auth mapping policy, if `findById` alone is insufficient.
- [ ] Decide and document the account lookup/creation policy used by auth:
  - [ ] Prefer explicit lookup of an existing active account when the JWT contains an application account ID claim.
  - [ ] If email-based lookup or just-in-time account creation is required, document why and keep it transaction-safe.
- [ ] Ensure archived accounts are not treated as active authenticated accounts.
- [ ] Map missing/inactive account lookup failures to `UNAUTHORIZED` or `FORBIDDEN` consistently and document the choice.
- [ ] Keep account lookup server-side; do not accept trusted `accountId` from request bodies.

Expected paths, unless existing code clearly establishes a better equivalent:

```text
backend/src/modules/accounts/accounts.types.ts
backend/src/modules/accounts/accounts.repository.ts
backend/test/accounts/accounts.repository.test.ts
```

---

# Out of Scope

Do not implement:

- [ ] Places/plants/beds/products or other domain repositories.
- [ ] General user-management or invite features.
- [ ] Role/permission model beyond v1 account scoping.
- [ ] Frontend auth UI.
- [ ] Protected route plugin wiring unless needed only for a local test harness in a later step.
- [ ] Schema redesign.

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
- [ ] `docs/001_initial_schema_gardening_helper.sql`
- [ ] `docs/implementation-phases/phase-03-auth-and-account-boundary.md`
- [ ] Prior files in `docs/implementation-phases/phase-03/`
- [ ] Existing backend database client, transaction, type, migration, and test helper files

---

# Domain Rules Affected

This task touches:

- [ ] account scoping
- [ ] auth/session boundary
- [ ] database/migrations
- [ ] API contract

Important rules to preserve:

```text
Every business record must be scoped to the authenticated account.
Cross-account access is forbidden.
Account consistency is mandatory.
Frontend must not submit accountId for normal flows.
Backend derives authenticated user/account context server-side.
Archive historical business records instead of hard-deleting them.
```

This step prepares account lookup for future services. It must not add business CRUD behavior.

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

- [ ] `Account` type/read model
- [ ] `AccountsRepository`
- [ ] account lookup/creation policy notes
- [ ] account lookup error mapping
- [ ] repository tests using account A/account B rows
- [ ] transaction-aware repository method signatures

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

Account lookup failures must be documented for later route-level mapping to canonical `UNAUTHORIZED` or `FORBIDDEN` envelopes.

---

# Tests Required

Add or update tests for:

- [ ] happy path
- [ ] account scoping
- [ ] edge cases
- [ ] transaction compatibility

Specific test cases:

1. `AccountsRepository.findById` returns active account A by ID.
2. `AccountsRepository.findById` returns active account B by ID.
3. `AccountsRepository.findById` returns `null` for unknown IDs.
4. Archived accounts are not accepted by the auth lookup policy.
5. Repository methods can run with a transaction-scoped database handle when Phase 2 transaction support exists.
6. Any account auto-create policy is transaction-safe and covered, or explicitly not implemented.

---

# Acceptance Criteria

The task is complete when:

- [ ] `AccountsRepository` exists and follows the backend repository contract.
- [ ] Account lookup uses the existing `accounts` table.
- [ ] The auth-to-account mapping policy is explicit.
- [ ] Archived/missing accounts cannot become authenticated active context.
- [ ] No domain CRUD endpoints, frontend code, or schema redesign are introduced.
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

Run repository tests against a dedicated local/test PostgreSQL-compatible database if required by the implementation. If no database is available, report that exactly.

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

Do not let seeded demo accounts become production authorization truth. Account context must come from verified auth plus backend account lookup.
