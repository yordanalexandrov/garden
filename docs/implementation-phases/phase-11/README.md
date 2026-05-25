# Phase 11 Task Set - Backend Target Resolver

These files convert `docs/implementation-phases/phase-11-backend-target-resolver.md` into executable Implementation Agent tasks using `docs/TASK_TEMPLATE.md`.

Run the tasks in order on one branch:

```text
feature/backend-target-resolver
```

## Task Order

1. `01-target-module-contracts-validation-and-wiring.md`
2. `02-target-repository-lookup-helpers.md`
3. `03-place-and-whole-group-scope-resolution.md`
4. `04-selected-target-scope-resolution.md`
5. `05-target-resolver-account-place-and-archived-regression-tests.md`
6. `06-phase-11-verification-and-pr-readiness.md`

## Phase Boundary

Implement only the reusable backend target resolver:

- Backend-owned contracts, validation helpers, DTO/read-model mapping, and module wiring for target resolution.
- Repository lookup helpers needed to resolve places, perennials, beds, yearly bed plantings, and persistent bed plants.
- Support for every canonical `TargetScopeType`.
- Validation that selected IDs exist, belong to the authenticated account, and belong to the requested place where applicable.
- Empty-result rejection for every scope, including whole-group scopes.
- Cross-account, cross-place, archived-target, and scope/selection mismatch regression tests.
- Transaction-compatible resolver API usable later by activities and tasks.

Do not implement:

- Activity creation, activity target persistence, product usage, inventory consumption, quarantine, suggested tasks, task creation, task target persistence, frontend target selector UI, schema changes, provider integrations, deployment work, or MCP tools.
- New target enum values or cross-place bulk targeting behavior.
- Controller-owned target truth or frontend-owned resolved target truth.

## Common Required Documents

Every task in this folder requires the Implementation Agent to read:

- `AGENTS.md`
- `docs/gardening-helper-ai-implementation-handoff-readme-v1.md`
- `docs/gardening-helper-implementation-instructions-for-ai-v1.md`
- `docs/gardening-helper-domain-rules-and-invariants-v1.md`
- `docs/gardening-helper-canonical-api-contract-v1.md`
- `docs/gardening-helper-testing-and-acceptance-spec-v1.md`
- `docs/gardening-helper-implementation-agent-instructions.md`
- `docs/gardening-helper-backend-application-design-pack-v1.md`
- `docs/gardening-helper-technical-requirements-and-erd.md`
- `docs/001_initial_schema_gardening_helper.sql`
- `docs/002_views_gardening_helper.sql`
- `docs/004_guards_and_triggers_gardening_helper.sql`
- `docs/implementation-phases/phase-06-backend-growing-structure-api.md`
- `docs/implementation-phases/phase-11-backend-target-resolver.md`
- `docs/TASK_TEMPLATE.md`
- Existing backend app, auth actor context, db, transaction, validation, error, places, plants, perennials, beds, plantings, route, and test helper files touched by the task.

## Common Verification

At the end of the phase, from the backend package root, run:

```bash
npm run typecheck
npm run lint
npm test
npm run test:db
npm run build
```

If a command is unavailable or fails due to pre-existing setup, report the exact command, exit state, and reason. Never claim checks passed unless they were run.
