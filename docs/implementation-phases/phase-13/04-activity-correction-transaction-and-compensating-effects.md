# Implementation Task - Phase 13 Step 4: Activity Correction Transaction and Compensating Effects

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
Implement supported activity correction workflows as backend-owned transactions that append compensating domain records and audit rows without mutating historical side effects.
```

## Branch

Use branch:

```text
feature/activity-correction-audit
```

---

# Scope

Implement only:

- [ ] Inspect existing activity detail reads, activity product usage rows, inventory movements/lots, quarantine periods, suggested tasks/task targets, audit helper, and transaction abstraction.
- [ ] Implement correction service orchestration for documented supported v1 correction payloads.
- [ ] Load the original activity and side effects within authenticated account scope.
- [ ] Distinguish side-effect-free activities from side-effecting activities according to documented policy.
- [ ] For supported product/inventory usage corrections, append `correction` inventory movements and update affected lot quantities in the same transaction.
- [ ] Preserve original activity rows, original activity targets, original product usages, original inventory movements, original quarantine periods, and original suggested tasks as readable history.
- [ ] Create audit row(s) in the same transaction summarizing the correction.
- [ ] Return a canonical success envelope summarizing correction records/entities created.
- [ ] Reject unsupported correction cases explicitly with `BUSINESS_RULE_VIOLATION` or `VALIDATION_ERROR`.
- [ ] Add integration/API tests for supported correction happy paths and unsupported cases.

If quarantine or suggested task compensating behavior cannot be represented safely by the existing schema, document that limitation and reject those correction shapes explicitly rather than mutating original rows.

---

# Out of Scope

Do not implement:

- [ ] Arbitrary full history rewrite.
- [ ] Deletion or mutation of original inventory movement history.
- [ ] Deletion or mutation of original activity rows to hide prior effects.
- [ ] Planned task/reminder creation from corrections unless explicitly required by a supported correction case and contract.
- [ ] Correction UI or frontend behavior.
- [ ] AI, weather, push, storage, provider, deployment, or MCP behavior.
- [ ] Schema changes unless a blocking support gap is documented and approved as the smallest forward migration.

---

# Required Documents

Read before coding:

- [ ] `AGENTS.md`
- [ ] `docs/gardening-helper-implementation-agent-instructions.md`
- [ ] `docs/gardening-helper-ai-implementation-handoff-readme-v1.md`
- [ ] `docs/gardening-helper-implementation-instructions-for-ai-v1.md`
- [ ] `docs/gardening-helper-domain-rules-and-invariants-v1.md`
- [ ] `docs/gardening-helper-canonical-api-contract-v1.md` section 17.4
- [ ] `docs/gardening-helper-testing-and-acceptance-spec-v1.md`
- [ ] `docs/gardening-helper-backend-application-design-pack-v1.md` section 11.6
- [ ] `docs/gardening-helper-technical-requirements-and-erd.md`
- [ ] `docs/001_initial_schema_gardening_helper.sql`
- [ ] `docs/002_views_gardening_helper.sql`
- [ ] `docs/004_guards_and_triggers_gardening_helper.sql`
- [ ] `docs/implementation-phases/phase-09-backend-inventory-ledger-api.md`
- [ ] `docs/implementation-phases/phase-12-backend-activity-transaction-flow.md`
- [ ] `docs/implementation-phases/phase-13-backend-activity-correction-and-audit-trail.md`
- [ ] `docs/TASK_TEMPLATE.md`
- [ ] Existing backend activity, inventory, audit, transaction, validation, error, route, and test helper files touched by the task.

---

# Domain Rules Affected

This task touches:

- [ ] account scoping
- [ ] target resolution
- [ ] activities
- [ ] inventory
- [ ] product usage rules
- [ ] quarantine
- [ ] tasks/reminders
- [ ] API contract
- [ ] database/migrations
- [ ] auth/session boundary
- [ ] MCP tools / agent interface

Important rules to preserve:

```text
Activity correction should be explicit.
Side-effecting activity correction must not silently mutate inventory ledger, quarantine periods, or suggested tasks.
Corrections must append or create reverse/adjust operations rather than hiding prior business history.
Inventory is ledger-based.
Never mutate stock without an inventory movement.
Inventory corrections append movement history.
Audit logs are append-only.
Audit logging does not replace domain records.
Original activity remains readable.
Critical mutation endpoints should be transaction-safe.
```

---

# MCP Impact

This task:

- [ ] changes backend behavior used by future MCP tools

MCP tools affected:

```text
None in Phase 13.
```

Required MCP documentation updates:

```text
None.
```

---

# Required Implementation Details

Implement:

- [ ] backend service method
- [ ] repository methods
- [ ] transaction handling
- [ ] inventory correction movement creation
- [ ] inventory lot updates tied to correction movements
- [ ] audit helper calls
- [ ] API response DTO mapping
- [ ] tests
- [ ] docs/update notes for supported correction cases and explicit limitations

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
POST /api/v1/activities/:activityId/correct
```

Final response should summarize:

```text
Original activity id.
Correction audit id or audit summary if ids are not exposed.
Inventory correction movements created.
Lot quantity effects.
Unsupported/deferred side-effect correction categories, if relevant.
Warnings array when the supported payload produces documented non-fatal warnings.
```

All responses must use canonical success and error envelopes.

---

# Tests Required

Add or update tests for:

- [ ] happy path
- [ ] validation errors
- [ ] account scoping
- [ ] transaction rollback
- [ ] API response shape
- [ ] edge cases

Specific test cases:

1. Supported correction for a product-consuming activity creates `correction` movement(s) and updates lot quantity in one transaction.
2. Correction does not delete or mutate original inventory movement rows.
3. Correction does not delete or hide original activity rows.
4. Correction creates audit row(s) in the same transaction.
5. Correction response uses canonical `{ data: ... }` envelope and summarizes created correction records.
6. Unsupported quarantine/task/target/date/type rewrite returns `BUSINESS_RULE_VIOLATION` or `VALIDATION_ERROR`.
7. Account A cannot correct account B activity.
8. Inaccessible activity returns `NOT_FOUND` or `FORBIDDEN` according to existing backend convention.
9. Failure during movement creation rolls back all correction writes.
10. Failure during audit creation rolls back correction movements and lot updates for transaction-sensitive corrections.

---

# Acceptance Criteria

The task is complete when:

- [ ] Supported v1 correction workflows are implemented and documented.
- [ ] Side-effecting corrections append compensating records instead of rewriting historical side effects.
- [ ] Inventory correction movements and lot updates are transactional.
- [ ] Audit rows are created for corrections.
- [ ] Original activity and original side effects remain readable.
- [ ] Unsupported correction cases fail explicitly.
- [ ] Integration/API tests cover happy path, account scope, response shape, and rollback behavior.

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
