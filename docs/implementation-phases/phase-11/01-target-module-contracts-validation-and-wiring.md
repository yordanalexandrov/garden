# Implementation Task - Phase 11 Step 1: Target Module Contracts, Validation, and Wiring

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
Prepare the backend target resolver module contracts, canonical validation helpers, result DTOs/read models, and dependency wiring needed for Phase 11 target resolution.
```

## Branch

Use branch:

```text
feature/backend-target-resolver
```

---

# Scope

Implement only:

- [ ] Inspect existing backend app, module registration, auth actor context, database client, transaction abstraction, envelope/error helpers, validation helpers, places/perennials/beds/plantings modules, and backend test helper patterns.
- [ ] Confirm Phase 6 growing-structure APIs and repositories exist before implementing target behavior; if Phase 6 prerequisites are absent, stop and document the prerequisite gap.
- [ ] Create the target resolver module/shared domain location following local backend conventions, such as `backend/src/modules/targets/` or an existing shared domain helper path.
- [ ] Define canonical target domain types for `TargetType`, `TargetScopeType`, `TargetSelection`, `TargetRef`, `TargetSummary`, resolver inputs, resolved target rows, and resolver dependencies.
- [ ] Define a `TargetResolver` contract compatible with the backend design pack and callable by future activity/task services.
- [ ] Define validation helpers for scope/selection shape: selected scopes require the matching non-empty ID field, whole-place/all-group scopes must not depend on irrelevant selected ID arrays, and `single_bed` requires exactly one bed ID.
- [ ] Define DTO/read-model mapping helpers for canonical `TargetRef` and optional `TargetSummary` output without treating labels as persisted truth.
- [ ] Wire resolver dependencies without opening database connections at import time.
- [ ] Add focused validation/type/DTO tests where existing backend test style supports them.

Expected paths, unless existing code clearly establishes a better equivalent:

```text
backend/src/modules/targets/target-resolver.types.ts
backend/src/modules/targets/target-resolver.validation.ts
backend/src/modules/targets/target-resolver.dto.ts
backend/src/modules/targets/target-resolver.service.ts
backend/src/modules/targets/target-resolver.repository.ts
backend/test/targets/
```

---

# Out of Scope

Do not implement:

- [ ] Repository queries beyond interfaces/stubs needed for wiring.
- [ ] Full resolver database behavior; whole-place/all-group scopes belong to Step 3 and selected scopes belong to Step 4.
- [ ] Activity or task service integration.
- [ ] Persisting `activity_targets` or `task_targets`.
- [ ] Frontend target selector behavior.
- [ ] Schema changes or migrations.
- [ ] New target enum values.
- [ ] Cross-place bulk targeting.
- [ ] Provider, deployment, notification, weather, AI, storage, or MCP tools.

---

# Required Documents

Read before coding:

- [ ] `AGENTS.md`
- [ ] `docs/gardening-helper-implementation-agent-instructions.md`
- [ ] `docs/gardening-helper-ai-implementation-handoff-readme-v1.md`
- [ ] `docs/gardening-helper-implementation-instructions-for-ai-v1.md`
- [ ] `docs/gardening-helper-domain-rules-and-invariants-v1.md`
- [ ] `docs/gardening-helper-canonical-api-contract-v1.md` sections 5.4, 5.5, and 6.1-6.3
- [ ] `docs/gardening-helper-testing-and-acceptance-spec-v1.md` TargetResolver tests
- [ ] `docs/gardening-helper-backend-application-design-pack-v1.md` section 10 and activity/task target workflow sections
- [ ] `docs/gardening-helper-technical-requirements-and-erd.md`
- [ ] `docs/001_initial_schema_gardening_helper.sql`
- [ ] `docs/004_guards_and_triggers_gardening_helper.sql`
- [ ] `docs/implementation-phases/phase-06-backend-growing-structure-api.md`
- [ ] `docs/implementation-phases/phase-11-backend-target-resolver.md`
- [ ] `docs/TASK_TEMPLATE.md`
- [ ] Existing backend `src/app/`, `src/db/`, `src/shared/`, `src/modules/auth/`, `src/modules/places/`, `src/modules/perennials/`, `src/modules/beds/`, `src/modules/plantings/`, and backend test helper files touched by the task.

---

# Domain Rules Affected

This task touches:

- [ ] account scoping
- [ ] target resolution
- [ ] activities
- [ ] tasks/reminders
- [ ] API contract
- [ ] database/migrations
- [ ] auth/session boundary
- [ ] MCP tools / agent interface

Important rules to preserve:

```text
Backend owns business logic.
Controllers stay thin.
Services orchestrate workflows and transactions.
Repositories only access data.
Activity/task targets must resolve to concrete target rows.
All-beds/all-perennials are scoped to one place.
Cross-place mixed targeting is not allowed in v1.
Target labels are read models and must not be persisted as truth.
Frontend never submits resolved target truth.
MCP tools are not a privileged bypass channel and must call backend services/API.
```

---

# MCP Impact

This task:

- [ ] changes backend behavior used by future MCP tools

MCP tools affected:

```text
None in Phase 11. Future activity/task MCP tools must use backend services/API and must not resolve targets directly.
```

Required MCP documentation updates:

```text
None.
```

---

# Required Implementation Details

Implement:

- [ ] backend module/domain types
- [ ] backend validation helper
- [ ] DTO/read-model mapping helper
- [ ] resolver service contract
- [ ] repository dependency contract
- [ ] transaction-compatible method signatures
- [ ] tests

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

---

# API Contract

Endpoints involved:

```text
None. This phase adds reusable backend behavior for future activity and task endpoints.
```

DTOs and values must follow:

```text
TargetType: place, perennial, bed, yearly_bed_planting, persistent_bed_plant.
TargetScopeType: whole_place, all_perennials_in_place, selected_perennials, all_beds_in_place, selected_beds, single_bed, selected_yearly_plantings, selected_persistent_bed_plants.
TargetSelection: perennialIds, bedIds, yearlyPlantingIds, persistentBedPlantIds.
TargetRef: targetType, targetId.
TargetSummary: targetType, targetId, label, placeId.
```

---

# Tests Required

Add or update tests for:

- [ ] validation errors
- [ ] API/DTO response shape helpers where relevant
- [ ] scope/selection edge cases

Specific test cases:

1. Validation accepts `whole_place` without selected ID arrays.
2. Validation accepts `all_perennials_in_place` and `all_beds_in_place` with a place context and no selected ID arrays.
3. Validation accepts `selected_perennials` only when `perennialIds` is non-empty.
4. Validation accepts `selected_beds` only when `bedIds` is non-empty.
5. Validation accepts `single_bed` only when `bedIds` contains exactly one ID.
6. Validation accepts `selected_yearly_plantings` only when `yearlyPlantingIds` is non-empty.
7. Validation accepts `selected_persistent_bed_plants` only when `persistentBedPlantIds` is non-empty.
8. Validation rejects irrelevant or empty selection arrays according to local validation policy.
9. DTO helpers emit canonical camelCase target refs/summaries and do not persist or trust labels.

---

# Acceptance Criteria

The task is complete when:

- [ ] Target resolver module/contracts exist in the locally appropriate backend path.
- [ ] Canonical target enum values and DTO shapes match the API contract.
- [ ] Scope/selection validation is explicit and tested.
- [ ] Resolver signatures accept optional transaction context.
- [ ] No activity/task persistence, frontend behavior, schema, provider, deployment, or MCP tools are introduced.
- [ ] Focused validation/DTO tests are added or a precise reason is documented if existing test style makes them impractical.

---

# Commands to Run

From the backend package root, run relevant commands:

```bash
npm run typecheck
npm run lint
npm test
```

If any command does not exist or fails due to pre-existing setup, report it clearly.
