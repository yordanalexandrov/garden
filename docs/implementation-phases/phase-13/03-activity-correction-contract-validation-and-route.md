# Implementation Task - Phase 13 Step 3: Activity Correction Contract, Validation, and Route

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
Define and wire the canonical activity correction endpoint with narrow documented v1 payloads and explicit validation for unsupported correction shapes.
```

## Branch

Use branch:

```text
feature/activity-correction-audit
```

---

# Scope

Implement only:

- [ ] Inspect Phase 12 activity route, validation, service, repository, DTO, and test patterns.
- [ ] Define supported v1 correction payload shape(s) for `POST /api/v1/activities/:activityId/correct`.
- [ ] Document unsupported correction shapes in backend implementation notes or inline task/PR notes.
- [ ] Add validation for `activityId`, correction reason/notes, and supported correction operation fields.
- [ ] Add route wiring for `POST /api/v1/activities/:activityId/correct` using existing authenticated route conventions.
- [ ] Keep controller thin: validate, derive actor context, call service, return canonical envelope.
- [ ] Add service method and repository interface stubs needed by the route, returning explicit not-implemented or unsupported errors only if the project uses staged wiring.
- [ ] Ensure unsupported correction shapes return `VALIDATION_ERROR` or `BUSINESS_RULE_VIOLATION` with canonical error envelope.
- [ ] Add focused validation and route-wiring tests.

Supported v1 payloads should be the smallest practical set that preserves the hybrid correction model. A safe default is:

```text
reason/notes plus explicit inventory usage correction entries for product-consuming activities, with any target/date/type rewrite for side-effecting activities rejected unless fully implemented in Step 4.
```

---

# Out of Scope

Do not implement:

- [ ] Correction transaction side effects; that belongs to Step 4.
- [ ] Full arbitrary rewrite of activity header, targets, product usages, quarantine periods, or suggested tasks.
- [ ] Hard deletion of original activity records or generated side effects.
- [ ] Frontend correction UI.
- [ ] AI, weather, push, storage, provider, deployment, or MCP behavior.
- [ ] Schema changes unless Step 3 discovers a documented blocker and the forward migration is deferred or explicitly scoped.

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
- [ ] `docs/004_guards_and_triggers_gardening_helper.sql`
- [ ] `docs/implementation-phases/phase-12-backend-activity-transaction-flow.md`
- [ ] `docs/implementation-phases/phase-13-backend-activity-correction-and-audit-trail.md`
- [ ] `docs/TASK_TEMPLATE.md`
- [ ] Existing backend activity, inventory, audit, validation, route, error, and test helper files touched by the task.

---

# Domain Rules Affected

This task touches:

- [ ] account scoping
- [ ] target resolution
- [ ] activities
- [ ] inventory
- [ ] quarantine
- [ ] tasks/reminders
- [ ] API contract
- [ ] database/migrations
- [ ] auth/session boundary
- [ ] MCP tools / agent interface

Important rules to preserve:

```text
Activity correction should be explicit.
Activities that created side effects must not be silently rewritten.
Corrections for side-effecting records must be auditable.
Unsupported correction cases must fail explicitly.
Original activity and generated side effects must remain readable.
Controllers stay thin.
Services own correction orchestration and transaction boundaries.
```

---

# MCP Impact

This task:

- [ ] changes backend behavior used by future MCP tools

MCP tools affected:

```text
None in Phase 13. Future activity correction MCP tools must call this backend endpoint or service and preserve confirmation/audit requirements.
```

Required MCP documentation updates:

```text
None.
```

---

# Required Implementation Details

Implement:

- [ ] backend controller/route
- [ ] backend validation schema
- [ ] backend service method
- [ ] repository interface methods as needed
- [ ] authenticated route wiring
- [ ] tests
- [ ] docs/update notes for supported and unsupported correction payloads

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

Request/response must follow:

```text
The canonical contract leaves correction details high-level.
The implementation must define and document supported v1 correction payloads without weakening the hybrid correction model.
Success uses { data: ... } and should summarize correction records/entities created.
Unsupported correction shape returns BUSINESS_RULE_VIOLATION or VALIDATION_ERROR.
Inaccessible activity returns NOT_FOUND or FORBIDDEN.
Errors use canonical envelope.
```

---

# Tests Required

Add or update tests for:

- [ ] validation errors
- [ ] account scoping
- [ ] API response shape
- [ ] edge cases

Specific test cases:

1. Route requires authentication.
2. Route rejects invalid `activityId`.
3. Validation accepts the documented supported correction payload shape.
4. Validation rejects ambiguous full activity rewrites for side-effecting corrections.
5. Unsupported correction shape returns canonical `VALIDATION_ERROR` or `BUSINESS_RULE_VIOLATION`.
6. Controller delegates to service with authenticated actor/account context.
7. Success response, if staged behavior is complete in this step, uses `{ data: ... }`.

---

# Acceptance Criteria

The task is complete when:

- [ ] `POST /api/v1/activities/:activityId/correct` is wired using authenticated backend route conventions.
- [ ] Supported v1 correction payloads are narrowly defined and documented.
- [ ] Unsupported correction shapes fail explicitly.
- [ ] Controller remains thin and service-owned orchestration is preserved.
- [ ] Validation/route tests are added.
- [ ] No side-effecting correction implementation, frontend, provider, deployment, or MCP behavior is included unless required by the existing route-wiring pattern.

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
