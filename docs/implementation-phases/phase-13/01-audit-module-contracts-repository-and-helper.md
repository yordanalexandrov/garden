# Implementation Task - Phase 13 Step 1: Audit Module Contracts, Repository, and Helper

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
Create the backend audit module foundation with append-only repository behavior and a service/helper for critical mutation audit events.
```

## Branch

Use branch:

```text
feature/activity-correction-audit
```

---

# Scope

Implement only:

- [ ] Inspect existing backend app, route registration, auth actor context, database client, transaction abstraction, envelope helpers, validation helpers, activity, inventory, product/rule, place, and test helper patterns.
- [ ] Confirm Phase 12 activity transaction flow exists before wiring activity audit behavior; if Phase 12 is absent, stop and document the prerequisite gap.
- [ ] Create `backend/src/modules/audit/` structure following existing backend module conventions.
- [ ] Define audit input/domain/DTO types for actor/account/entity/action/before/after/metadata fields supported by the migrated `audit_logs` table.
- [ ] Implement `AuditLogsRepository.log(input, db?)` as append-only insert behavior.
- [ ] Implement an audit logging service/helper that normalizes action names, accepts actor/account context from backend auth, and can be called inside an existing transaction.
- [ ] Add secret-scrubbing or explicit field allowlisting so audit metadata does not store tokens, service role keys, raw authorization headers, passwords, or provider secrets.
- [ ] Add focused repository/helper tests where existing backend test style supports them.

Expected paths, unless existing code clearly establishes a better equivalent:

```text
backend/src/modules/audit/audit.types.ts
backend/src/modules/audit/audit.repository.ts
backend/src/modules/audit/audit.service.ts
backend/src/modules/audit/audit.dto.ts
backend/test/audit/
```

---

# Out of Scope

Do not implement:

- [ ] Activity correction endpoint or correction transaction behavior; that belongs to later Phase 13 steps.
- [ ] Broad audit integration in critical operations; that belongs to Step 2.
- [ ] Frontend pages, correction UI, AI, weather, storage, push, worker, deployment, or MCP tools.
- [ ] Schema changes or migrations unless the current schema cannot support required append-only audit rows and the blocker is documented.
- [ ] Updates, deletes, or archive behavior for `audit_logs`.
- [ ] Audit logging inside controllers.

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
- [ ] `docs/004_guards_and_triggers_gardening_helper.sql`
- [ ] `docs/implementation-phases/phase-12-backend-activity-transaction-flow.md`
- [ ] `docs/implementation-phases/phase-13-backend-activity-correction-and-audit-trail.md`
- [ ] `docs/TASK_TEMPLATE.md`
- [ ] Existing `backend/src/app/`, `backend/src/db/`, `backend/src/shared/`, `backend/src/modules/auth/`, and backend test helper files touched by the task.

---

# Domain Rules Affected

This task touches:

- [ ] account scoping
- [ ] activities
- [ ] inventory
- [ ] product usage rules
- [ ] API contract
- [ ] database/migrations
- [ ] auth/session boundary
- [ ] provider adapter boundary
- [ ] MCP tools / agent interface

Important rules to preserve:

```text
Backend owns business logic.
Controllers stay thin.
Services orchestrate workflows and transactions.
Repositories only access data.
All business records belong to an account.
Cross-account access is forbidden.
Critical operations should be auditable.
Audit logs are append-only traceability, not business truth.
Audit logging does not replace domain records or inventory movements.
Do not store secrets in audit logs.
MCP tools are not a privileged bypass channel and must call backend services/API.
```

---

# MCP Impact

This task:

- [ ] changes backend behavior used by future MCP tools

MCP tools affected:

```text
None in Phase 13. Future MCP mutation tools must preserve auditability through backend services/API.
```

Required MCP documentation updates:

```text
None.
```

---

# Required Implementation Details

Implement:

- [ ] backend audit module/domain types
- [ ] repository methods
- [ ] transaction-aware audit helper/service
- [ ] secret-safe metadata normalization
- [ ] tests
- [ ] docs/update notes only if audit event conventions need local implementation notes

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
None directly in this step.
```

Audit rows must support later service calls for canonical backend mutations and must never change public API envelopes unless a later step documents an endpoint response.

---

# Tests Required

Add or update tests for:

- [ ] happy path
- [ ] validation errors
- [ ] account scoping
- [ ] transaction rollback if existing helper tests support it
- [ ] edge cases

Specific test cases:

1. `AuditLogsRepository.log` inserts an audit row with actor, account, entity, action, and metadata.
2. Audit helper can write using a supplied transaction.
3. Audit helper excludes configured secret fields from before/after/metadata payloads.
4. Audit helper rejects or normalizes missing account/actor context according to existing backend conventions.
5. No update/delete repository method exists for normal audit log mutation.

---

# Acceptance Criteria

The task is complete when:

- [ ] Audit module files exist and follow backend module conventions.
- [ ] `AuditLogsRepository.log(input, db?)` is implemented as append-only insert behavior.
- [ ] Audit service/helper can be called inside existing service transactions.
- [ ] Audit metadata excludes secrets.
- [ ] Focused audit repository/helper tests are added or a precise reason is documented if existing test infrastructure makes them impractical.
- [ ] No correction endpoint, frontend, provider, schema redesign, or MCP behavior is included.

---

# Commands to Run

Run relevant commands from the backend package root:

```bash
npm run typecheck
npm run lint
npm test
npm run test:db
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
