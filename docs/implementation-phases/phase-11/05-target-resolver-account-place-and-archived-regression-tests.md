# Implementation Task - Phase 11 Step 5: Target Resolver Account, Place, and Archived Regression Tests

## Role

You are the **Implementation Agent**.

Use:
- `AGENTS.md`
- `docs/gardening-helper-implementation-agent-instructions.md`
- `docs/gardening-helper-ai-implementation-handoff-readme-v1.md`
- all relevant specs for this task

The application data API remains the Fastify API under `/api/v1`.

---

# Task

## Goal

Implement:

```text
Complete Phase 11 regression coverage for account scoping, place consistency, archived target rejection, empty target rejection, scope/selection mismatch, and transaction-compatible target resolution.
```

## Branch

Use branch:

```text
feature/backend-target-resolver
```

---

# Scope

Implement only:

- [ ] Inspect all Phase 11 resolver, repository, validation, DTO, and tests added in Steps 1-4.
- [ ] Add or extend deterministic fixtures for account A/account B, place A/place B, active and archived perennials, active and archived beds, yearly bed plantings, and persistent bed plants.
- [ ] Add integration tests for all canonical scopes using account A and cross-account account B data.
- [ ] Add negative tests for missing IDs, archived IDs, cross-account IDs, cross-place IDs, empty all-group results, empty selected arrays, irrelevant selected fields, duplicate selected IDs if local policy rejects duplicates, and scope/selection mismatch.
- [ ] Add transaction pass-through tests that prove resolver repository calls can run inside an existing transaction where local test infrastructure supports this.
- [ ] Confirm error mapping uses existing backend error conventions such as `VALIDATION_ERROR`, `NOT_FOUND`, `FORBIDDEN`, or `BUSINESS_RULE_VIOLATION` consistently.
- [ ] Confirm target labels are returned only as read models and are not accepted from user input as truth.
- [ ] Confirm no controller, route, frontend, activity, or task layer duplicates target resolution logic.
- [ ] Add static/scope checks only if the existing project has a suitable backend boundary-check pattern.

Expected paths to inspect or update:

```text
backend/src/modules/targets/
backend/src/modules/activities/
backend/src/modules/tasks/
backend/test/targets/
backend/test/helpers/
backend/package.json
```

---

# Out of Scope

Do not implement:

- [ ] New resolver features beyond closing Phase 11 test gaps.
- [ ] Activity creation, task creation, target persistence, product usage, inventory consumption, quarantine, suggested task generation, reminders, or correction flows.
- [ ] Frontend target selector behavior.
- [ ] Schema changes or migrations.
- [ ] Provider, deployment, notification, weather, AI, storage, or MCP tools.

---

# Required Documents

Read before coding:

- [ ] `AGENTS.md`
- [ ] `docs/gardening-helper-implementation-agent-instructions.md`
- [ ] `docs/gardening-helper-ai-implementation-handoff-readme-v1.md`
- [ ] `docs/gardening-helper-implementation-instructions-for-ai-v1.md`
- [ ] `docs/gardening-helper-domain-rules-and-invariants-v1.md`
- [ ] `docs/gardening-helper-canonical-api-contract-v1.md`
- [ ] `docs/gardening-helper-testing-and-acceptance-spec-v1.md` TargetResolver tests
- [ ] `docs/gardening-helper-backend-application-design-pack-v1.md` section 10
- [ ] `docs/001_initial_schema_gardening_helper.sql`
- [ ] `docs/004_guards_and_triggers_gardening_helper.sql`
- [ ] `docs/implementation-phases/phase-11-backend-target-resolver.md`
- [ ] All prior files in `docs/implementation-phases/phase-11/`
- [ ] Existing target resolver, repository, fixtures, and test helper files touched by the task.

---

# Domain Rules Affected

This task touches:

- [ ] account scoping
- [ ] target resolution
- [ ] activities
- [ ] tasks/reminders
- [ ] API contract
- [ ] auth/session boundary
- [ ] database/migrations

Important rules to preserve:

```text
All business records belong to an account.
Cross-account access is forbidden.
Account consistency is mandatory.
Activity/task targets must resolve to concrete target rows.
Resolved targets must not be empty.
All-beds/all-perennials are scoped to one place.
Cross-place mixed targeting is not allowed in v1.
Archived targets are rejected or excluded for new workflows.
Backend service layer is the business logic source of truth.
```

---

# MCP Impact

This task:

- [ ] changes backend behavior used by future MCP tools

MCP tools affected:

```text
None in Phase 11.
```

Required MCP documentation updates:

```text
None.
```

---

# Required Implementation Details

Implement:

- [ ] tests
- [ ] fixture updates
- [ ] static/scope checks if locally established
- [ ] docs/update notes only if test commands or resolver setup require documentation

---

# Required Infrastructure/Security Boundaries

Preserve these rules:

- [ ] no direct frontend access to application tables
- [ ] no bypass of the Fastify API for application data
- [ ] no business logic in Angular components
- [ ] no business side-effect orchestration in database triggers
- [ ] no Supabase service role key in frontend code/env/build output/logs
- [ ] account scoping enforced backend-side

---

# API Contract

Endpoints involved:

```text
None.
```

Final tests must cover every canonical:

```text
TargetScopeType
TargetType
TargetSelection field
TargetRef result shape
```

---

# Tests Required

Add or update tests for:

- [ ] happy path
- [ ] validation errors
- [ ] account scoping
- [ ] transaction behavior
- [ ] edge cases
- [ ] static/scope regression

Specific test cases:

1. Resolve `whole_place`.
2. Resolve all active perennials, excluding archived.
3. Resolve selected perennials.
4. Resolve all active beds, excluding archived.
5. Resolve selected beds.
6. Resolve `single_bed` with exactly one bed.
7. Resolve selected yearly plantings through bed/place.
8. Resolve selected persistent bed plants through bed/place.
9. Reject missing IDs.
10. Reject archived IDs for new targets.
11. Reject cross-account targets.
12. Reject cross-place targets.
13. Reject empty all-beds/all-perennials result.
14. Reject empty selected ID arrays.
15. Reject scope/selection mismatch.
16. Verify resolver can run inside an existing transaction.
17. Verify no activity/task persistence occurs in Phase 11 resolver tests.

---

# Acceptance Criteria

The task is complete when:

- [ ] TargetResolver test coverage includes every canonical scope and major rejection path from the testing spec.
- [ ] Cross-account and cross-place failures are tested with deterministic fixtures.
- [ ] Archived and empty-result behavior is tested.
- [ ] Transaction-compatible invocation is tested or a precise infrastructure blocker is documented.
- [ ] Error codes follow established backend conventions.
- [ ] No activity/task persistence, frontend, schema, provider, deployment, or MCP behavior is added.

---

# Commands to Run

From the backend package root, run relevant commands:

```bash
npm run typecheck
npm run lint
npm test
npm run test:db
```

If any command does not exist or fails due to pre-existing setup, report it clearly.
