# Implementation Task - Phase 11 Step 3: Place and Whole-Group Scope Resolution

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
Implement TargetResolver behavior for whole-place and whole-group place-scoped target scopes.
```

## Branch

Use branch:

```text
feature/backend-target-resolver
```

---

# Scope

Implement only:

- [ ] Inspect Step 1 contracts and Step 2 repository helpers before editing resolver behavior.
- [ ] Implement `whole_place` resolution by validating the place belongs to the actor account and returning exactly one `place` target.
- [ ] Implement `all_perennials_in_place` resolution by validating the place belongs to the actor account and returning all active perennials in that place.
- [ ] Implement `all_beds_in_place` resolution by validating the place belongs to the actor account and returning all active beds in that place.
- [ ] Reject empty resolved target sets for `all_perennials_in_place` and `all_beds_in_place`.
- [ ] Ensure place-scoped whole-group resolution never reads globally across places.
- [ ] Ensure resolved targets include canonical target type/id and optional label/place summary fields only as read models.
- [ ] Ensure resolver methods accept optional transaction context and pass it to repository helpers.
- [ ] Add focused resolver tests for whole-place and whole-group scopes.

Expected paths to inspect or update:

```text
backend/src/modules/targets/
backend/test/targets/
backend/test/helpers/
```

---

# Out of Scope

Do not implement:

- [ ] Selected target scopes; those belong to Step 4.
- [ ] Activity or task target persistence.
- [ ] New API endpoints.
- [ ] Frontend target selector behavior.
- [ ] Schema changes or migrations.
- [ ] Cross-place bulk operations.
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
- [ ] `docs/implementation-phases/phase-11-backend-target-resolver.md`
- [ ] `docs/implementation-phases/phase-11/01-target-module-contracts-validation-and-wiring.md`
- [ ] `docs/implementation-phases/phase-11/02-target-repository-lookup-helpers.md`
- [ ] Existing target resolver, repository, and test helper files touched by the task.

---

# Domain Rules Affected

This task touches:

- [ ] account scoping
- [ ] target resolution
- [ ] activities
- [ ] tasks/reminders
- [ ] API contract

Important rules to preserve:

```text
Backend service layer is the business logic source of truth.
Activity/task targets must resolve to concrete target rows.
All-beds/all-perennials are scoped to one place.
Resolved targets must not be empty.
Target ownership must be validated backend-side.
Target labels are read models.
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

- [ ] backend service method behavior
- [ ] repository helper usage
- [ ] transaction handling/pass-through
- [ ] tests

---

# Required Infrastructure/Security Boundaries

Preserve these rules:

- [ ] no direct frontend access to application tables
- [ ] no bypass of the Fastify API for application data
- [ ] no business logic in Angular components
- [ ] no business side-effect orchestration in database triggers
- [ ] account scoping enforced backend-side

---

# API Contract

Endpoints involved:

```text
None.
```

Target scopes implemented:

```text
whole_place
all_perennials_in_place
all_beds_in_place
```

---

# Tests Required

Add or update tests for:

- [ ] happy path
- [ ] validation errors
- [ ] account scoping
- [ ] edge cases

Specific test cases:

1. `whole_place` resolves exactly one `place` target for a place owned by the account.
2. `whole_place` rejects a missing or cross-account place.
3. `all_perennials_in_place` returns only active perennials in the requested place and excludes archived perennials.
4. `all_perennials_in_place` rejects an empty active perennial result.
5. `all_beds_in_place` returns only active beds in the requested place and excludes archived beds.
6. `all_beds_in_place` rejects an empty active bed result.
7. Whole-group scopes do not include targets from another place or account.
8. Resolver can run with optional transaction context.

---

# Acceptance Criteria

The task is complete when:

- [ ] `whole_place`, `all_perennials_in_place`, and `all_beds_in_place` are implemented.
- [ ] Whole-group scopes are strictly place-scoped and account-scoped.
- [ ] Empty whole-group target sets are rejected.
- [ ] Resolved targets are concrete canonical target refs.
- [ ] Tests cover happy paths and rejection paths.
- [ ] No selected-scope, activity/task persistence, frontend, schema, provider, deployment, or MCP behavior is added.

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
