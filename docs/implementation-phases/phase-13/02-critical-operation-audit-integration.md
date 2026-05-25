# Implementation Task - Phase 13 Step 2: Critical Operation Audit Integration

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
Add audit log creation to representative already implemented critical backend mutations without changing their domain semantics or API response shapes.
```

## Branch

Use branch:

```text
feature/activity-correction-audit
```

---

# Scope

Implement only:

- [ ] Inspect existing activity creation, inventory adjustment, inventory lot creation, product/rule archive or update, and place/archive operation services.
- [ ] Add audit helper calls in service-layer workflows after business decisions are made.
- [ ] Ensure audit writes for transaction-sensitive operations happen inside the same transaction as the audited mutation.
- [ ] Add audit logging for activity creation if Phase 12 implementation exists.
- [ ] Add audit logging for inventory lot creation and manual adjustment if not already present.
- [ ] Add audit logging for product/rule archive or update where practical and already implemented.
- [ ] Add audit logging for place archive/update where practical and already implemented.
- [ ] Preserve existing API response shapes and canonical envelopes.
- [ ] Add representative tests asserting audit rows are created for selected critical operations.

---

# Out of Scope

Do not implement:

- [ ] Activity correction endpoint or correction transaction behavior.
- [ ] Audit integration for unimplemented AI, weather, push, storage, problem photo, task reminder, deployment, or MCP behavior.
- [ ] New public audit log listing APIs unless a higher-priority contract already requires them.
- [ ] API response shape changes for existing mutations unless already defined by the canonical contract.
- [ ] Schema redesign or broad refactors.
- [ ] Controller-owned audit decisions.

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
- [ ] `docs/implementation-phases/phase-09-backend-inventory-ledger-api.md`
- [ ] `docs/implementation-phases/phase-12-backend-activity-transaction-flow.md`
- [ ] `docs/implementation-phases/phase-13-backend-activity-correction-and-audit-trail.md`
- [ ] `docs/TASK_TEMPLATE.md`
- [ ] Existing backend activity, inventory, product/rule, place, audit, transaction, route, and test helper files touched by the task.

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
- [ ] MCP tools / agent interface

Important rules to preserve:

```text
Backend owns business logic.
Services orchestrate workflows and transactions.
Repositories only access data.
Critical operations should be auditable.
Audit logs are append-only traceability, not business truth.
Activity creation with product usage must remain transactional.
Inventory is ledger-based.
Never mutate stock without an inventory movement.
Archive historical business records instead of hard-deleting them.
Existing canonical API response envelopes must be preserved.
```

---

# MCP Impact

This task:

- [ ] changes backend behavior used by future MCP tools

MCP tools affected:

```text
None in Phase 13. Future MCP mutation tools should receive auditability through the backend workflows touched here.
```

Required MCP documentation updates:

```text
None.
```

---

# Required Implementation Details

Implement:

- [ ] service-layer audit helper calls
- [ ] transaction handling
- [ ] tests
- [ ] docs/update notes only if the implementation documents supported audit event names

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
Existing mutation endpoints already implemented before Phase 13, including representative activity, inventory, product/rule, and place mutations where present.
```

Final verification must confirm:

```text
Existing request and response shapes remain compatible with the canonical API contract.
Errors still use { error: { code, message, details } }.
Audit logging failures inside transactional critical flows roll back with the audited mutation unless explicitly documented otherwise.
```

---

# Tests Required

Add or update tests for:

- [ ] happy path
- [ ] account scoping
- [ ] transaction rollback
- [ ] API response shape
- [ ] edge cases

Specific test cases:

1. Activity creation creates an audit row when Phase 12 activity creation exists.
2. Inventory adjustment creates an audit row in the same transaction as the movement and lot update.
3. Product or rule archive/update creates an audit row where included in scope.
4. Place archive/update creates an audit row where included in scope.
5. Existing mutation responses remain unchanged after audit integration.
6. Failure to write audit row in a transaction-sensitive critical flow rolls back the audited mutation or is explicitly handled according to documented service policy.
7. Audit rows include the authenticated account and actor, not user-supplied account IDs.

---

# Acceptance Criteria

The task is complete when:

- [ ] Representative critical operations create audit rows.
- [ ] Transaction-sensitive audit writes happen inside the audited mutation transaction.
- [ ] Existing endpoint response shapes and domain behavior remain unchanged.
- [ ] Tests cover representative audit creation and transactional behavior.
- [ ] No correction endpoint, frontend, provider, deployment, or MCP behavior is included.

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
