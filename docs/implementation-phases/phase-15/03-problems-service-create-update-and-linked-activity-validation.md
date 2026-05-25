# Implementation Task - Phase 15 Step 3: Problems Service Create, Update, and Linked Activity Validation

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
Add ProblemsService workflows for create, list, detail, and update with authoritative place, target, account, and optional linked activity validation.
```

## Branch

Use branch:

```text
feature/backend-problems
```

---

# Scope

Implement only:

- [ ] Inspect existing service patterns for auth actor context, error codes, transaction use, target lookup/resolver integration, place validation, and activities read access.
- [ ] Implement `ProblemsService` create/list/detail/update methods for metadata-only problem and observation records.
- [ ] Validate `placeId` belongs to the authenticated account before create/update operations that set or depend on place context.
- [ ] Validate `targetType` and `targetId` exist, belong to the authenticated account, and belong to the supplied place.
- [ ] Reuse Phase 11 target lookup/resolver helpers where appropriate, but do not persist resolved target rows for problems.
- [ ] Validate optional `linkedActivityId` belongs to the same authenticated account and is compatible with the same place context.
- [ ] Support both `problem` and `observation` metadata records.
- [ ] Preserve observations as metadata-only records and do not allow Phase 15 service inputs to attach photos.
- [ ] Enforce account-scoped detail/update access and canonical not-found behavior.
- [ ] Keep create/update transactional where local write patterns require it, especially if audit logging is added.
- [ ] Add service tests for happy paths and validation/rejection behavior.

Expected paths, unless existing code clearly establishes a better equivalent:

```text
backend/src/modules/problems/problems.service.ts
backend/src/modules/problems/problems.repository.ts
backend/src/modules/activities/
backend/src/modules/targets/ or backend/src/shared/targets/
backend/test/problems/problems.service.test.ts
```

---

# Out of Scope

Do not implement:

- [ ] Photo upload endpoint, storage writes, signed URLs, or `StoragePort`.
- [ ] Problem photo metadata creation.
- [ ] AI problem assist.
- [ ] Frontend pages or frontend API services.
- [ ] Activity correction, activity creation from problem, or treatment linking workflows beyond validating the optional existing linked activity.
- [ ] New target resolution behavior for activities/tasks.
- [ ] Schema changes or migrations unless a blocking mismatch is documented.
- [ ] Direct Supabase SDK usage inside domain services.

---

# Required Documents

Read before coding:

- [ ] `AGENTS.md`
- [ ] `docs/gardening-helper-implementation-agent-instructions.md`
- [ ] `docs/gardening-helper-ai-implementation-handoff-readme-v1.md`
- [ ] `docs/gardening-helper-implementation-instructions-for-ai-v1.md`
- [ ] `docs/gardening-helper-domain-rules-and-invariants-v1.md` sections 4, 8, 13, and 25.6
- [ ] `docs/gardening-helper-canonical-api-contract-v1.md` sections 5.4, 18, and 27
- [ ] `docs/gardening-helper-testing-and-acceptance-spec-v1.md` problem and account-scope cases
- [ ] `docs/gardening-helper-backend-application-design-pack-v1.md` problem flow and error conventions
- [ ] `docs/001_initial_schema_gardening_helper.sql`
- [ ] `docs/004_guards_and_triggers_gardening_helper.sql`
- [ ] `docs/implementation-phases/phase-11-backend-target-resolver.md`
- [ ] `docs/implementation-phases/phase-15-backend-problems-and-observations-api.md`
- [ ] Existing places, target lookup/resolver, activities read, transaction, error, and service test helper files touched by the task.

---

# Domain Rules Affected

This task touches:

- [ ] account scoping
- [ ] target resolution
- [ ] activities
- [ ] problems/photos
- [ ] API contract
- [ ] auth/session boundary
- [ ] storage/file access boundary

Important rules to preserve:

```text
Backend service layer is the business logic source of truth.
Services orchestrate workflows and transactions.
Problem target must belong to same account and same place as the problem.
Cross-account references are forbidden.
Polymorphic targets require service guards.
Linked treatment/activity is optional.
Photos are not required and are supported only for problems in v1; Phase 15 does not upload or persist photo metadata.
Weather, AI, tasks, inventory, and activity side effects are out of scope.
```

---

# MCP Impact

This task:

- [ ] changes backend behavior used by future MCP tools

MCP tools affected:

```text
None in Phase 15. Future problem MCP mutation tools must preserve this service validation and must not bypass it.
```

Required MCP documentation updates:

```text
None.
```

---

# Required Implementation Details

Implement:

- [ ] backend service method
- [ ] repository method calls
- [ ] target/place/account validation
- [ ] linked activity validation
- [ ] transaction handling where local write patterns require it
- [ ] tests

Remove or ignore template items that are not relevant.

---

# Required Infrastructure/Security Boundaries

Preserve these rules:

- [ ] no direct frontend access to application tables
- [ ] no bypass of the Fastify API for application data
- [ ] no business side-effect orchestration in database triggers
- [ ] no Supabase service role key in frontend code/env/build output/logs
- [ ] no direct Supabase SDK usage inside domain services except behind adapters
- [ ] backend validates JWTs and derives account context server-side
- [ ] account scoping enforced backend-side
- [ ] no storage upload or signed URL behavior in Phase 15

---

# API Contract

Service behavior must support:

```text
GET /api/v1/problems
POST /api/v1/problems
GET /api/v1/problems/:problemId
PATCH /api/v1/problems/:problemId
```

Validation and errors must use canonical envelopes/codes:

```text
VALIDATION_ERROR for invalid shapes/enums.
NOT_FOUND for inaccessible or missing records where local conventions use not found.
FORBIDDEN or BUSINESS_RULE_VIOLATION for cross-account/cross-place references according to existing backend error policy.
```

---

# Tests Required

Add or update tests for:

- [ ] happy path
- [ ] validation errors
- [ ] account scoping
- [ ] transaction rollback where write workflow uses transactions
- [ ] edge cases

Specific test cases:

1. Create problem without photo succeeds for a valid place and target.
2. Create observation without photo succeeds for a valid place and target.
3. Target from another place is rejected.
4. Target from another account is rejected.
5. Missing or inaccessible place is rejected.
6. Linked activity from another account is rejected.
7. Linked activity from another place is rejected where place context conflicts.
8. Detail/update cannot access account B problems as account A.
9. Update can change allowed metadata/status fields without changing account ownership.
10. Service never creates photo metadata or calls storage behavior in Phase 15.

---

# Acceptance Criteria

The task is complete when:

- [ ] ProblemsService owns place/target/account and linked activity validation.
- [ ] Problem and observation create/update workflows are metadata-only and account-scoped.
- [ ] Optional linked activity references are validated against account and place context.
- [ ] Service tests cover happy paths and major rejection paths.
- [ ] No storage, AI, frontend, activity side-effect, task, inventory, or schema scope slipped in.
