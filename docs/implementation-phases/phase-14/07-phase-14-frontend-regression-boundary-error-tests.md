# Implementation Task - Phase 14 Step 7: Frontend Regression, Boundary, and Error Tests

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
Harden Phase 14 with focused frontend regression, error-display, API-contract, mobile smoke, and static boundary tests.
```

## Branch

Use branch:

```text
feature/frontend-create-activity
```

---

# Scope

Implement only:

- [ ] Review all Phase 14 code for coverage gaps against the top-level Phase 14 spec and frontend technical spec.
- [ ] Add or complete unit/component tests for activities API service, list page, detail page, bulk target selector, product usage form array, create form, submit behavior, errors, and success summary.
- [ ] Add API-contract tests that verify canonical request/response fields and no trusted `accountId`.
- [ ] Add backend error-display tests for validation, business-rule, forbidden/not-found where practical, and `INVENTORY_SHORTAGE`.
- [ ] Add tests that failed submit preserves user input.
- [ ] Add tests that backend warnings and side-effect arrays are displayed.
- [ ] Add mobile smoke tests where practical for list/detail/create/selector layouts.
- [ ] Add or update static/boundary tests to detect:
  - direct Supabase application-table access
  - direct Supabase Storage business calls
  - backend-only secrets in frontend code/env/build config/tests
  - raw component `HttpClient` calls that bypass typed API services
  - frontend-submitted trusted `accountId`
  - frontend FEFO/inventory allocation, stock mutation, target-resolution truth, quarantine generation, suggested-task generation, or reminder creation
- [ ] Keep tests deterministic with mocked API services and fixture DTOs.

---

# Out of Scope

Do not implement:

- [ ] New user-facing functionality beyond testability/accessibility fixes required by Phase 14.
- [ ] Backend test changes unless a tiny compatibility fix is documented.
- [ ] E2E flows that require unavailable backend phases or external services.
- [ ] Activity correction, weather, task confirmation, AI, problems/photos, push, storage, provider, deployment, or MCP behavior.

---

# Required Documents

Read before coding:

- [ ] `AGENTS.md`
- [ ] `docs/gardening-helper-implementation-agent-instructions.md`
- [ ] `docs/gardening-helper-ai-implementation-handoff-readme-v1.md`
- [ ] `docs/gardening-helper-implementation-instructions-for-ai-v1.md`
- [ ] `docs/gardening-helper-domain-rules-and-invariants-v1.md`
- [ ] `docs/gardening-helper-canonical-api-contract-v1.md`
- [ ] `docs/gardening-helper-testing-and-acceptance-spec-v1.md` frontend, create activity, target selector, error, and acceptance sections
- [ ] `docs/gardening-helper-frontend-technical-spec-v1.md`
- [ ] `docs/implementation-phases/phase-14-frontend-activities-and-create-activity-flow.md`
- [ ] `docs/implementation-phases/phase-14/README.md`
- [ ] Existing frontend test helpers, static boundary checks, and CI scripts

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
- [ ] frontend forms
- [ ] API contract
- [ ] auth/session boundary

Important rules to preserve:

```text
Frontend is not business truth.
Frontend never accesses application tables directly.
Frontend must not submit accountId for normal flows.
Frontend must not calculate resolved target rows as final truth.
Frontend must not allocate inventory or mutate stock locally.
Frontend must not generate quarantine periods, suggested tasks, or reminders as business truth.
Warnings returned by backend must be shown.
Suggested tasks are not planned tasks.
```

---

# MCP Impact

This task:

- [ ] has no MCP impact

MCP tools affected:

```text
None.
```

Required MCP documentation updates:

```text
None.
```

---

# Required Implementation Details

Implement:

- [ ] frontend API service tests
- [ ] frontend page/component tests
- [ ] frontend form validation tests
- [ ] error display tests
- [ ] mobile smoke tests where practical
- [ ] static/boundary tests

---

# Required Infrastructure/Security Boundaries

Preserve these rules:

- [ ] no direct frontend access to application tables
- [ ] no bypass of the Fastify API for application data
- [ ] no business logic in Angular components
- [ ] no Supabase service role key in frontend code/env/build output/logs
- [ ] no direct Supabase Storage business calls
- [ ] no trusted `accountId` in request body
- [ ] no target resolution truth, FEFO allocation, stock mutation, quarantine generation, suggested-task generation, or reminder creation in frontend code

---

# API Contract

Endpoints covered by tests:

```text
GET /api/v1/activities
POST /api/v1/activities
GET /api/v1/activities/:activityId
Supporting selector/list endpoints consumed by Phase 14 components
```

Request/response must follow:

- `docs/gardening-helper-canonical-api-contract-v1.md`

---

# Tests Required

Add or update tests for:

- [ ] happy paths
- [ ] validation errors
- [ ] API response shape
- [ ] frontend form behavior
- [ ] edge cases
- [ ] boundary/static rules

Specific test cases:

1. Static checks fail if Phase 14 frontend code references Supabase application-table APIs or backend-only secrets.
2. Static checks fail if create activity code sends `accountId`, `resolvedTargets`, frontend inventory allocations, quarantine periods, suggested tasks, or reminders in the create request.
3. Component tests cover create activity required fields, target selection, product usage rows, backend errors, shortage errors, warnings, and success side effects.
4. List/detail tests cover filters, loading, empty, error, and side-effect rendering states.

---

# Acceptance Criteria

The task is complete when:

- [ ] Phase 14 has focused tests for the critical create activity flow and reusable components.
- [ ] Static/boundary checks cover frontend/backend ownership rules.
- [ ] Error and failed-submit behavior is tested.
- [ ] Tests remain deterministic and use mocked APIs where appropriate.
