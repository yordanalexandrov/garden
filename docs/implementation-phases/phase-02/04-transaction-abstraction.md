# Implementation Task - Phase 2 Step 4: Transaction Abstraction

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
Add the explicit DbClient.transaction<T>(fn) wrapper and DbTransaction type that later services and repositories must use for atomic writes.
```

## Branch

Use branch:

```text
feature/database-foundation
```

---

# Scope

Implement only:

- [ ] Add `DbTransaction` as the transaction-scoped typed database handle.
- [ ] Add `DbClient.transaction<T>(fn: (trx: DbTransaction) => Promise<T>): Promise<T>`.
- [ ] Ensure successful callbacks commit and return the callback result.
- [ ] Ensure thrown/rejected callbacks roll back all writes from the transaction.
- [ ] Prevent or explicitly reject unmanaged nested transaction behavior according to the chosen database library.
- [ ] Document how later repositories should accept the normal DB handle or `DbTransaction`.
- [ ] Keep transaction behavior service-facing; repositories in later phases should not open their own unmanaged transactions.

Expected path, unless existing code clearly establishes a better equivalent:

```text
backend/src/db/transaction.ts
```

---

# Out of Scope

Do not implement:

- [ ] Domain repositories.
- [ ] Domain services.
- [ ] Activity/inventory/task transaction workflows.
- [ ] Target resolution.
- [ ] Auth/JWT validation or account context.
- [ ] Domain API endpoints.
- [ ] Frontend code.
- [ ] Provider adapters.
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
- [ ] `docs/implementation-phases/phase-02-database-migration-and-transaction-foundation.md`
- [ ] Prior files in `docs/implementation-phases/phase-02/`
- [ ] Existing backend database source and tests from prior Phase 2 steps

---

# Domain Rules Affected

This task touches:

- [ ] database/migrations
- [ ] inventory
- [ ] activities
- [ ] tasks/reminders
- [ ] AI suggestions
- [ ] API contract

Important rules to preserve:

```text
Backend service layer is the business logic source of truth.
Repository + transaction abstraction is mandatory.
Services orchestrate workflows and transactions.
Repositories only access data.
Critical mutation endpoints should be transaction-safe.
Creating an activity with product usage must be transactional.
Confirming task is transactional.
Never mutate stock without an inventory movement.
```

Inventory, activity, task, and AI rules are affected only because this task creates the foundation those later workflows must use. Do not implement those workflows here.

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

- [ ] `DbClient.transaction<T>(fn)` wrapper
- [ ] `DbTransaction` type/interface
- [ ] transaction handling
- [ ] tests
- [ ] docs/update notes if repository transaction usage needs clarification

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
- [ ] Supabase Studio protected if deployment/admin config is touched
- [ ] PostgreSQL not publicly exposed if deployment/admin config is touched
- [ ] account scoping enforced backend-side when business endpoints exist
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

Request/response must follow:

- `docs/gardening-helper-canonical-api-contract-v1.md`

---

# Tests Required

Add or update tests for:

- [ ] happy path
- [ ] transaction rollback
- [ ] edge cases

Specific test cases:

1. Transaction helper commits writes and returns the successful callback result.
2. Transaction helper rolls back writes when the callback throws or rejects.
3. Transaction helper closes or releases the transaction connection after commit and rollback.
4. Nested/unmanaged transaction behavior is either rejected or documented and covered according to the selected library.

---

# Acceptance Criteria

The task is complete when:

- [ ] `DbClient.transaction<T>(fn)` is the only service-facing transaction entrypoint.
- [ ] `DbTransaction` can be passed to later repositories without exposing random connection objects.
- [ ] Commit and rollback smoke tests prove transaction behavior.
- [ ] No domain workflow has been implemented.
- [ ] No public API endpoints or frontend code are added.
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

Run transaction tests against a dedicated local/test PostgreSQL-compatible database if required by the implementation. If no database is available, report that exactly and do not claim rollback behavior passed.

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

The goal is a reusable transaction foundation, not domain behavior.

Do not let later repositories silently open independent transactions for critical writes.

Do not claim rollback tests passed unless they exercised a real transaction boundary.
