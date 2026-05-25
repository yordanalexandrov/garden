# Implementation Task - Phase 14 Step 5: Create Activity Form and Review Flow

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
Build the /activities/new create activity page form and review state that collect canonical activity intent without submitting backend-owned business truth.
```

## Branch

Use branch:

```text
feature/frontend-create-activity
```

---

# Scope

Implement only:

- [ ] Inspect existing large Reactive Form page patterns, dirty-state protection, route guards if present, place selectors, shared controls, and mobile layouts.
- [ ] Implement `/activities/new` page with Reactive Forms.
- [ ] Collect `placeId`, `type`, `performedAt`, `targetScopeType`, `targetSelection`, `notes`, optional `productUsages`, and `allowInventoryShortage` only when explicitly presented by the request flow.
- [ ] Use `app-bulk-target-selector` for target intent.
- [ ] Use `app-product-usage-form-array` for optional product usage rows.
- [ ] Keep watering simple: date/time, targets, and optional notes; no water quantity/duration requirement.
- [ ] Use step-like sections or equivalent single-column mobile-friendly layout without hiding selected intent before submit.
- [ ] Add a review state that summarizes selected place, type, target intent, selected target count/labels, notes, and product usage intent.
- [ ] Make missing-rule state visible before submit.
- [ ] Validate required place, activity type, performed date/time, target scope, required target IDs for selected scopes, positive quantities, and canonical units.
- [ ] Do not clear user input when client validation fails.
- [ ] Add focused page/component tests for required fields, target selector integration, product usage integration, review summary, and mobile smoke where practical.

---

# Out of Scope

Do not implement:

- [ ] Submit API call and success side-effect summary; those are Step 6.
- [ ] Activity correction/edit UI.
- [ ] Backend validation, target resolution, inventory allocation, quarantine generation, or suggested task generation.
- [ ] Weather rain prompt, task confirmation, AI suggestions, problems/photos, or calendar/dashboard changes.
- [ ] Direct Supabase application-table or storage calls.

---

# Required Documents

Read before coding:

- [ ] `AGENTS.md`
- [ ] `docs/gardening-helper-implementation-agent-instructions.md`
- [ ] `docs/gardening-helper-ai-implementation-handoff-readme-v1.md`
- [ ] `docs/gardening-helper-implementation-instructions-for-ai-v1.md`
- [ ] `docs/gardening-helper-domain-rules-and-invariants-v1.md` activity, targeting, inventory, task, and frontend boundary sections
- [ ] `docs/gardening-helper-canonical-api-contract-v1.md` Activities API and shared enum/target sections
- [ ] `docs/gardening-helper-testing-and-acceptance-spec-v1.md`
- [ ] `docs/gardening-helper-frontend-technical-spec-v1.md` Create activity page, forms, state, mobile, and API boundary sections
- [ ] `docs/implementation-phases/phase-14/03-bulk-target-selector.md`
- [ ] `docs/implementation-phases/phase-14/04-product-usage-form-array.md`
- [ ] `docs/implementation-phases/phase-14-frontend-activities-and-create-activity-flow.md`
- [ ] Existing large form page, route guard, and shared validation patterns

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

Important rules to preserve:

```text
Frontend may display, preview, validate basic input, and submit user intent.
Frontend must not decide concrete resolved target rows as final truth.
Frontend must not allocate inventory across lots.
Frontend must not create quarantine periods or suggested tasks locally as truth.
Watering tracks happened, date/time, targets, and optional notes only in v1.
Missing product rule must be visible.
Backend validation is authoritative.
Frontend must not submit accountId for normal flows.
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

- [ ] frontend page/component
- [ ] frontend form validation
- [ ] reusable selector/form-array integration
- [ ] review summary
- [ ] dirty-state protection if established by the app
- [ ] tests

---

# Required Infrastructure/Security Boundaries

Preserve these rules:

- [ ] no direct frontend access to application tables
- [ ] no bypass of the Fastify API for application data
- [ ] no business logic in Angular components
- [ ] no Supabase service role key in frontend code/env/build output/logs
- [ ] no direct Supabase Storage business calls
- [ ] no trusted `accountId` in form values or request models
- [ ] no target resolution truth, FEFO allocation, stock mutation, quarantine generation, or suggested-task generation in frontend code

---

# API Contract

Endpoint prepared for:

```text
POST /api/v1/activities
```

Create request fields:

```text
placeId
type
performedAt
targetScopeType
targetSelection
notes
productUsages
allowInventoryShortage
```

Request/response must follow:

- `docs/gardening-helper-canonical-api-contract-v1.md`

---

# Tests Required

Add or update tests for:

- [ ] required place/type/target scope validation
- [ ] selected-scope target ID validation
- [ ] target selector integration
- [ ] product usage form-array integration
- [ ] missing-rule visibility in review
- [ ] review summary content
- [ ] no `accountId`
- [ ] no local side-effect generation
- [ ] mobile smoke where practical

Specific test cases:

1. Create activity page blocks review/submit when place, type, or target scope is missing.
2. Selected beds/perennials from `app-bulk-target-selector` appear in the review as user intent and selected count.
3. Product usage rows appear in the review with missing-rule state when applicable.
4. Form value prepared for submit contains canonical target and product usage fields and no resolved target rows or `accountId`.

---

# Acceptance Criteria

The task is complete when:

- [ ] `/activities/new` collects canonical activity intent through a Reactive Form.
- [ ] The review state clearly displays target and product usage intent before submit.
- [ ] The page remains mobile-usable and preserves input on validation errors.
- [ ] No frontend-owned business truth or side-effect generation is introduced.
- [ ] Focused page/component tests pass.
