# Implementation Task - Phase 13 Step 6: Phase 13 Verification and PR Readiness

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
Complete Phase 13 verification, confirm correction/audit boundaries, run backend checks, update required docs, and prepare the PR description for backend Activity Correction and Audit Trail.
```

## Branch

Use branch:

```text
feature/activity-correction-audit
```

---

# Scope

Implement only:

- [ ] Review all Phase 13 implementation files for consistency with the phase spec and task files.
- [ ] Confirm `AuditLogsRepository` exists and is append-only in normal application flows.
- [ ] Confirm audit logging service/helper excludes secrets and uses authenticated actor/account context.
- [ ] Confirm representative critical operations create audit rows as documented.
- [ ] Confirm `POST /api/v1/activities/:activityId/correct` is implemented and account-scoped.
- [ ] Confirm supported v1 correction payloads are documented.
- [ ] Confirm unsupported correction shapes fail explicitly with canonical errors.
- [ ] Confirm supported side-effecting corrections append compensating domain records instead of mutating original history.
- [ ] Confirm original activities, targets, product usages, inventory movements, quarantine rows, and suggested tasks remain readable after correction.
- [ ] Confirm correction movements and lot updates are in the same transaction.
- [ ] Confirm audit rows for correction are in the same transaction where consistency matters.
- [ ] Confirm no lot can become negative through correction behavior.
- [ ] Confirm controllers are thin, services own workflows/transactions, and repositories only access data.
- [ ] Confirm no correction UI, frontend work, arbitrary history rewrite, AI, weather, push, storage, provider, deployment, or MCP behavior slipped in.
- [ ] Run all required backend checks.
- [ ] Update backend README or implementation notes only if supported correction cases, limitations, run commands, or environment setup need documentation.
- [ ] Update `docs/gardening-helper-implementation-status-handoff.md` only if Phase 13 implementation progress changes; do not mark complete until this phase is fully implemented and verified.
- [ ] Prepare the PR description using the Phase 13 expected PR summary.

Expected paths to review:

```text
backend/src/modules/audit/
backend/src/modules/activities/
backend/src/modules/inventory/
backend/src/modules/products/
backend/src/modules/places/
backend/src/app/
backend/src/db/
backend/src/shared/
backend/test/audit/
backend/test/activities/
backend/test/inventory/
backend/test/helpers/
backend/README.md
docs/implementation-phases/phase-13-backend-activity-correction-and-audit-trail.md
docs/implementation-phases/phase-13/
docs/gardening-helper-implementation-status-handoff.md
```

---

# Out of Scope

Do not implement:

- [ ] New domain features beyond fixing Phase 13 verification gaps.
- [ ] Frontend correction UI or activity pages.
- [ ] Full arbitrary history rewrite.
- [ ] Weather, AI, push, storage, provider, deployment, notifications, or MCP tools.
- [ ] Schema redesign.
- [ ] Broad refactors unrelated to Phase 13.
- [ ] Status changes for other phases unless directly true in the current branch and required by project status rules.

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
- [ ] `docs/002_views_gardening_helper.sql`
- [ ] `docs/004_guards_and_triggers_gardening_helper.sql`
- [ ] `docs/implementation-phases/phase-09-backend-inventory-ledger-api.md`
- [ ] `docs/implementation-phases/phase-11-backend-target-resolver.md`
- [ ] `docs/implementation-phases/phase-12-backend-activity-transaction-flow.md`
- [ ] `docs/implementation-phases/phase-13-backend-activity-correction-and-audit-trail.md`
- [ ] All prior files in `docs/implementation-phases/phase-13/`
- [ ] `docs/TASK_TEMPLATE.md`
- [ ] All backend source, test, config, package, and docs files changed in Phase 13.

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
- [ ] provider adapter boundary
- [ ] MCP tools / agent interface

Important rules to preserve:

```text
Activity correction should be explicit.
Archive historical business records instead of hard-deleting.
Inventory corrections append movement history.
Never mutate stock without an inventory movement.
Audit logs are append-only.
Audit logging does not replace domain records.
Activity records that created side effects must not be silently rewritten.
Critical operations should be auditable.
Critical mutation endpoints should be transaction-safe.
Backend owns business logic.
Controllers stay thin.
Services orchestrate workflows and transactions.
Repositories only access data.
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
None, unless the implementation PR adds MCP documentation for future correction/audit tools. Do not add correction/audit MCP tools in Phase 13.
```

---

# Required Implementation Details

Implement:

- [ ] tests
- [ ] docs/update notes if needed
- [ ] PR description
- [ ] verification checklist
- [ ] static/scope checks

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
Existing mutation endpoints with added audit logging from Step 2.
```

Final verification must confirm:

```text
Correction endpoint uses canonical success/error envelopes.
Correction response summarizes created correction records/entities.
Unsupported correction shape returns BUSINESS_RULE_VIOLATION or VALIDATION_ERROR.
Inaccessible activity returns NOT_FOUND or FORBIDDEN according to existing backend convention.
Existing audited mutation endpoints preserve their request and response shapes.
```

---

# Tests Required

Add or update tests for:

- [ ] happy path
- [ ] validation errors
- [ ] account scoping
- [ ] transaction rollback
- [ ] API response shape
- [ ] edge cases
- [ ] static/scope regression

Specific test cases:

1. Audit repository/helper tests from Step 1 pass.
2. Representative critical operation audit tests from Step 2 pass.
3. Correction validation and route tests from Step 3 pass.
4. Supported correction transaction tests from Step 4 pass.
5. Account A/account B correction tests from Step 5 pass.
6. Rollback tests from Step 5 pass.
7. Append-only audit tests from Step 5 pass.
8. Original historical records remain readable after correction.
9. Unsupported correction shape tests pass.
10. Static/scope regression confirms no frontend, provider, deployment, or MCP behavior was introduced.

---

# Acceptance Criteria

The task is complete when:

- [ ] Audit logging foundation exists.
- [ ] Representative critical operations create audit rows.
- [ ] Activity correction endpoint supports documented v1 cases.
- [ ] Side-effecting corrections preserve history and append compensating records.
- [ ] Correction/audit behavior is tested and account-scoped.
- [ ] Unsupported correction cases fail explicitly.
- [ ] Backend checks pass where configured or failures are documented with exact commands and reasons.
- [ ] `docs/gardening-helper-implementation-status-handoff.md` accurately reflects Phase 13 progress without overstating completion.
- [ ] PR description is complete.

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

Also run any backend boundary/static checks configured by the project. If a command is unavailable or fails due to pre-existing setup, report the exact command, exit state, and reason. Never claim checks passed unless they were run.

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

Use this PR summary structure:

```md
## Summary
Implemented backend activity correction and audit trail foundation.

## Scope
- Added AuditLogsRepository and audit logging service.
- Added audit rows for selected critical operations.
- Added activity correction endpoint and supported correction cases.

## Domain rules preserved
- Historical activity side effects are not silently rewritten.
- Inventory corrections append movement history.
- Audit logs are append-only traceability, not business truth.

## Tests
- <commands run and results>

## Deferred work
- Correction UI and future AI/weather/push audit events remain deferred.

## Review focus
- Hybrid correction model.
- Transaction safety.
- Append-only audit behavior.
- Supported correction limitations.
```
