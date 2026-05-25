# Implementation Task - Phase 11 Step 4: Selected Target Scope Resolution

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
Implement TargetResolver behavior for all selected target scopes, including all selected-ID validation and place derivation rules.
```

## Branch

Use branch:

```text
feature/backend-target-resolver
```

---

# Scope

Implement only:

- [ ] Inspect Steps 1-3 and existing repository helpers before editing resolver behavior.
- [ ] Implement `selected_perennials` by validating every selected perennial exists, is active, belongs to the account, and belongs to the requested place.
- [ ] Implement `selected_beds` by validating every selected bed exists, is active, belongs to the account, and belongs to the requested place.
- [ ] Implement `single_bed` by validating exactly one selected bed exists, is active, belongs to the account, and belongs to the requested place.
- [ ] Implement `selected_yearly_plantings` by validating every selected yearly planting exists, belongs to the account, and belongs to the requested place through its bed.
- [ ] Implement `selected_persistent_bed_plants` by validating every selected persistent bed plant exists, is active where applicable, belongs to the account, and belongs to the requested place through its bed.
- [ ] Reject partial success: if any selected ID is missing, archived, cross-account, or cross-place, the whole resolution fails.
- [ ] Deduplicate only if existing local validation policy already does so; otherwise reject duplicates to keep persistence predictable.
- [ ] Preserve input-independent target labels as read models only.
- [ ] Ensure resolver methods accept optional transaction context and pass it to repository helpers.
- [ ] Add focused resolver tests for selected scopes.

Expected paths to inspect or update:

```text
backend/src/modules/targets/
backend/test/targets/
backend/test/helpers/
```

---

# Out of Scope

Do not implement:

- [ ] Activity or task target persistence.
- [ ] New API endpoints.
- [ ] Frontend target selector behavior.
- [ ] Schema changes or migrations.
- [ ] Cross-place mixed targeting.
- [ ] Product usage, inventory consumption, quarantine, suggested tasks, task reminders, provider integrations, deployment work, or MCP tools.

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
- [ ] `docs/implementation-phases/phase-11/03-place-and-whole-group-scope-resolution.md`
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
Activity/task targets must resolve to concrete target rows.
Cross-account access is forbidden.
Account consistency is mandatory.
Cross-place mixed targeting is not allowed in v1.
All selected IDs must be validated as a set.
Selected yearly bed plantings and persistent bed plants derive place through their bed.
Archived targets are rejected for new activity/task workflows.
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
selected_perennials
selected_beds
single_bed
selected_yearly_plantings
selected_persistent_bed_plants
```

---

# Tests Required

Add or update tests for:

- [ ] happy path
- [ ] validation errors
- [ ] account scoping
- [ ] edge cases

Specific test cases:

1. `selected_perennials` resolves the exact requested active perennial IDs in the requested place.
2. `selected_perennials` rejects missing, archived, cross-account, or cross-place IDs.
3. `selected_beds` resolves the exact requested active bed IDs in the requested place.
4. `selected_beds` rejects missing, archived, cross-account, or cross-place IDs.
5. `single_bed` resolves exactly one bed and rejects zero, multiple, missing, archived, cross-account, or cross-place beds.
6. `selected_yearly_plantings` resolves selected yearly plantings through their bed/place relationship.
7. `selected_yearly_plantings` rejects missing, cross-account, or cross-place plantings.
8. `selected_persistent_bed_plants` resolves selected persistent bed plants through their bed/place relationship.
9. `selected_persistent_bed_plants` rejects missing, archived/removed where applicable, cross-account, or cross-place persistent plants.
10. Every selected scope rejects partial success when any selected ID is invalid.
11. Resolver can run with optional transaction context.

---

# Acceptance Criteria

The task is complete when:

- [ ] Every selected canonical target scope is implemented.
- [ ] Selected IDs are validated as a complete set.
- [ ] Cross-account and cross-place selected targets fail.
- [ ] Archived targets fail for new workflows.
- [ ] Yearly and persistent bed plant targets derive place through bed.
- [ ] Tests cover happy paths and rejection paths.
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
