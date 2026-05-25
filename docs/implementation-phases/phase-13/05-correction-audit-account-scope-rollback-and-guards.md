# Implementation Task - Phase 13 Step 5: Correction/Audit Account Scope, Rollback, and Guards

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
Harden Phase 13 correction and audit behavior with account-scope, rollback, append-only, response-shape, and boundary regression tests.
```

## Branch

Use branch:

```text
feature/activity-correction-audit
```

---

# Scope

Implement only:

- [ ] Inspect all Phase 13 implementation files from Steps 1-4.
- [ ] Add or complete tests proving account A cannot audit/correct account B records.
- [ ] Add rollback tests for correction failures after activity lookup, movement creation, lot update, and audit creation where failure injection is available.
- [ ] Add append-only audit tests proving normal application flows do not update or delete audit rows.
- [ ] Add regression tests proving original activity records, original targets, original product usages, original inventory movements, original quarantine rows, and original suggested tasks remain readable after supported corrections.
- [ ] Add tests proving correction cannot create negative lot quantities.
- [ ] Add tests proving unsupported correction shapes fail explicitly and do not create partial writes.
- [ ] Add static/boundary checks where project patterns support them.
- [ ] Fix only Phase 13 defects found by these tests.

---

# Out of Scope

Do not implement:

- [ ] New correction features beyond closing Phase 13 correctness gaps.
- [ ] Frontend work.
- [ ] New audit APIs for browsing/searching audit logs.
- [ ] AI, weather, push, storage, provider, deployment, or MCP behavior.
- [ ] Schema redesign.
- [ ] Broad refactors unrelated to correction/audit safety.

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
All business records belong to an account.
Cross-account access is forbidden.
Account consistency is mandatory.
Activity correction should be explicit.
Side-effecting activity correction must not silently mutate inventory ledger, quarantine periods, or suggested tasks.
Inventory is ledger-based.
Never mutate stock without an inventory movement.
No lot goes negative.
Audit logs are append-only.
Audit logging does not replace domain records.
Critical mutation endpoints should be transaction-safe.
MCP tools are not a privileged bypass channel and must call backend services/API.
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

- [ ] tests
- [ ] transaction rollback hardening
- [ ] account-scope hardening
- [ ] static/scope checks
- [ ] docs/update notes if tests reveal supported correction limitations need clarification

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
Existing mutation endpoints with added audit logging from Step 2.
```

Final verification must confirm:

```text
Correction success responses use { data: ... }.
List/detail responses for original activities remain readable.
Errors use { error: { code, message, details } }.
Unsupported correction shapes do not create partial writes.
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

1. Account A cannot correct account B activity.
2. Account A cannot create correction movements against account B lots or movements.
3. Correction rollback leaves no new movement, lot update, or audit row after injected failure.
4. Unsupported correction payload leaves no correction writes.
5. Audit logs are inserted and normal application code has no update/delete audit workflow.
6. Original activity detail remains readable after correction.
7. Original inventory movements remain readable after correction.
8. Correction cannot make any lot negative.
9. API response shapes match the canonical success/error envelope.
10. Static/boundary checks confirm no correction logic was placed in controllers, repositories, database triggers, frontend code, or MCP tools.

---

# Acceptance Criteria

The task is complete when:

- [ ] Phase 13 account-scope tests cover audit and correction flows.
- [ ] Rollback tests cover critical correction partial-failure points.
- [ ] Append-only audit behavior is tested.
- [ ] Original historical records remain readable after correction.
- [ ] Unsupported correction cases are tested.
- [ ] Boundary/static checks pass where configured.
- [ ] Only Phase 13 defects are fixed.

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
