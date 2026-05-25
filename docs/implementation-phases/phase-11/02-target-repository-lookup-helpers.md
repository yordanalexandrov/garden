# Implementation Task - Phase 11 Step 2: Target Repository Lookup Helpers

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
Add account-scoped repository lookup helpers needed by the TargetResolver to validate places, perennials, beds, yearly bed plantings, and persistent bed plants.
```

## Branch

Use branch:

```text
feature/backend-target-resolver
```

---

# Scope

Implement only:

- [ ] Inspect existing repository patterns for places, perennials, beds, persistent bed plants, yearly bed plantings, transaction arguments, archived filtering, and account scoping.
- [ ] Add or reuse repository methods that fetch one place by account/id.
- [ ] Add or reuse repository methods that fetch active perennials in a place and selected perennials by account/place/ids.
- [ ] Add or reuse repository methods that fetch active beds in a place and selected beds by account/place/ids.
- [ ] Add or reuse repository methods that fetch selected yearly bed plantings by account/place/ids by deriving place through their bed.
- [ ] Add or reuse repository methods that fetch selected persistent bed plants by account/place/ids by deriving place through their bed.
- [ ] Ensure lookup helpers can use an optional `DbTransaction`.
- [ ] Ensure selected-ID helpers return enough information for the service to detect missing, archived, wrong-account, or wrong-place IDs as failures.
- [ ] Add repository tests or service-facing repository contract tests where local patterns support them.

Expected paths to inspect or update:

```text
backend/src/modules/targets/
backend/src/modules/places/
backend/src/modules/perennials/
backend/src/modules/beds/
backend/src/modules/plantings/
backend/src/db/
backend/test/targets/
backend/test/helpers/
```

---

# Out of Scope

Do not implement:

- [ ] Resolver branching for all scopes; that belongs to Steps 3 and 4.
- [ ] Activity or task target persistence.
- [ ] New API endpoints.
- [ ] Frontend behavior.
- [ ] Schema changes or migrations.
- [ ] Cross-place or cross-account permissive behavior.
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
- [ ] `docs/gardening-helper-testing-and-acceptance-spec-v1.md`
- [ ] `docs/gardening-helper-backend-application-design-pack-v1.md` section 10
- [ ] `docs/gardening-helper-technical-requirements-and-erd.md`
- [ ] `docs/001_initial_schema_gardening_helper.sql`
- [ ] `docs/004_guards_and_triggers_gardening_helper.sql`
- [ ] `docs/implementation-phases/phase-06-backend-growing-structure-api.md`
- [ ] `docs/implementation-phases/phase-11-backend-target-resolver.md`
- [ ] `docs/implementation-phases/phase-11/01-target-module-contracts-validation-and-wiring.md`
- [ ] Existing backend repository and test helper files touched by the task.

---

# Domain Rules Affected

This task touches:

- [ ] account scoping
- [ ] target resolution
- [ ] API contract
- [ ] database/migrations
- [ ] auth/session boundary

Important rules to preserve:

```text
All business records belong to an account.
Cross-account access is forbidden.
Account consistency is mandatory.
Activity/task targets must resolve to concrete target rows.
All-beds/all-perennials are scoped to one place.
Selected yearly and persistent bed plant targets derive place through their bed.
Repositories only access data.
Services own business validation decisions.
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

- [ ] repository methods
- [ ] transaction-compatible query signatures
- [ ] account/place-scoped lookup filters
- [ ] active/non-archived lookup filters where required
- [ ] tests

---

# Required Infrastructure/Security Boundaries

Preserve these rules:

- [ ] no direct frontend access to application tables
- [ ] no bypass of the Fastify API for application data
- [ ] no business side-effect orchestration in database triggers
- [ ] no direct Supabase SDK usage inside domain services except behind adapters
- [ ] account scoping enforced backend-side

---

# API Contract

Endpoints involved:

```text
None.
```

Repository helpers must provide data needed to build canonical:

```text
TargetRef
TargetSummary
```

---

# Tests Required

Add or update tests for:

- [ ] happy path
- [ ] account scoping
- [ ] edge cases

Specific test cases:

1. Place lookup returns only a place owned by the actor account.
2. Active perennials-in-place lookup excludes archived perennials.
3. Selected perennial lookup does not return archived, wrong-account, or wrong-place rows as valid selected targets.
4. Active beds-in-place lookup excludes archived beds.
5. Selected bed lookup does not return archived, wrong-account, or wrong-place rows as valid selected targets.
6. Selected yearly planting lookup derives place through bed and rejects wrong-place rows.
7. Selected persistent bed plant lookup derives place through bed and rejects wrong-place rows.
8. Lookup helpers accept optional transaction context without changing behavior.

---

# Acceptance Criteria

The task is complete when:

- [ ] Repository lookup helpers exist or equivalent existing methods are reused.
- [ ] Helpers enforce account and place filters in SQL/repository access.
- [ ] Helpers expose enough result detail for the service to fail invalid selected IDs as a whole.
- [ ] Archived rows are excluded or detectable for new target workflows according to the Phase 11 resolver design.
- [ ] No resolver persistence, activity/task integration, frontend, schema, provider, deployment, or MCP behavior is added.

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
