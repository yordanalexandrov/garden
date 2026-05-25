# Implementation Task - Phase 14 Step 6: Create Activity Submit, Errors, and Side-Effect Summary

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
Wire create activity submission to POST /activities, handle backend validation/business errors, and display backend-returned warnings and side-effect arrays after success.
```

## Branch

Use branch:

```text
feature/frontend-create-activity
```

---

# Scope

Implement only:

- [ ] Submit the canonical create activity request through `ActivitiesApiService`.
- [ ] Disable save while the request is in flight.
- [ ] Prevent duplicate submissions during in-flight state.
- [ ] Display canonical backend validation, business-rule, forbidden/not-found, and `INVENTORY_SHORTAGE` errors without clearing user input.
- [ ] Show explicit inventory shortage override UI only when the request flow requires/permits it; do not enable shortage by default.
- [ ] Display success summary after create.
- [ ] Display backend-returned `inventoryEffects`, `quarantinePeriods`, `suggestedTasks`, and `warnings`, including empty-array states where useful.
- [ ] Treat suggested tasks as suggestions, not planned work, in the result display.
- [ ] Link to the created activity detail when the backend returns the activity/id.
- [ ] Refresh or invalidate visible activity/inventory data only through existing API/service patterns; do not recalculate stock locally.
- [ ] Add tests for submit request shape, in-flight state, backend errors, shortage handling, success side-effect summary, warnings, and no input clearing.

---

# Out of Scope

Do not implement:

- [ ] Backend transaction or endpoint changes, except tiny compatibility fixes in already implemented Phase 12 APIs if a blocking mismatch is documented.
- [ ] Frontend inventory allocation, target resolution truth, quarantine generation, suggested task generation, or task reminder creation.
- [ ] Activity correction/edit UI.
- [ ] Task confirmation UI.
- [ ] Weather rain prompt, AI suggestions, problems/photos, calendar/dashboard changes, push, storage, provider, deployment, or MCP tools.
- [ ] Direct Supabase application-table or storage calls.

---

# Required Documents

Read before coding:

- [ ] `AGENTS.md`
- [ ] `docs/gardening-helper-implementation-agent-instructions.md`
- [ ] `docs/gardening-helper-ai-implementation-handoff-readme-v1.md`
- [ ] `docs/gardening-helper-implementation-instructions-for-ai-v1.md`
- [ ] `docs/gardening-helper-domain-rules-and-invariants-v1.md` activity transaction, targeting, inventory shortage, quarantine, suggested task, and frontend boundary sections
- [ ] `docs/gardening-helper-canonical-api-contract-v1.md` Activities API, standard envelopes, errors, target DTOs, and unit sections
- [ ] `docs/gardening-helper-testing-and-acceptance-spec-v1.md`
- [ ] `docs/gardening-helper-frontend-technical-spec-v1.md` Create activity page, error presentation, state, and API boundary sections
- [ ] `docs/implementation-phases/phase-12-backend-activity-transaction-flow.md`
- [ ] `docs/implementation-phases/phase-14/05-create-activity-form-and-review-flow.md`
- [ ] `docs/implementation-phases/phase-14-frontend-activities-and-create-activity-flow.md`
- [ ] Existing API error mapper, submit/in-flight patterns, and success summary patterns

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
Activity creation with product usage must be transactional backend-side.
Frontend submits user intent, not backend-owned business truth.
Frontend must not allocate inventory across lots.
Shortage override must be explicit and not defaulted on.
Warnings returned by backend must be shown.
Frontend must display backend-returned side-effect arrays instead of calculating them.
Suggested tasks are not planned tasks.
Reminders are created only for planned tasks; this UI must not create reminders.
Backend validation is authoritative.
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

- [ ] frontend submit behavior
- [ ] frontend API service integration
- [ ] frontend form/backend error mapping
- [ ] in-flight and duplicate-submit protection
- [ ] shortage override UI only when explicitly needed
- [ ] success side-effect summary
- [ ] tests
- [ ] static/boundary check updates if relevant

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

Endpoint involved:

```text
POST /api/v1/activities
```

Request fields:

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

Response fields to display:

```text
activity
inventoryEffects
quarantinePeriods
suggestedTasks
warnings
```

Errors to display through the canonical envelope:

```text
VALIDATION_ERROR
UNAUTHORIZED
FORBIDDEN
NOT_FOUND
BUSINESS_RULE_VIOLATION
INVENTORY_SHORTAGE
INTERNAL_ERROR
```

Request/response must follow:

- `docs/gardening-helper-canonical-api-contract-v1.md`

---

# Tests Required

Add or update tests for:

- [ ] canonical submit request shape
- [ ] no trusted `accountId`
- [ ] save disabled during submit
- [ ] duplicate-submit prevention
- [ ] backend validation error display
- [ ] business-rule error display
- [ ] `INVENTORY_SHORTAGE` error display and explicit override flow
- [ ] input preservation after failed submit
- [ ] success summary display for inventory, quarantine, suggested tasks, and warnings
- [ ] suggested tasks shown as suggested, not planned

Specific test cases:

1. Submit sends canonical request values and omits `accountId`, resolved target rows, and frontend-generated side effects.
2. Save is disabled while `ActivitiesApiService.createActivity` is pending.
3. `INVENTORY_SHORTAGE` displays a form-level error and does not clear place, target, notes, or product usage rows.
4. Successful create displays backend-returned inventory effects, quarantine periods, suggested tasks, and warnings.

---

# Acceptance Criteria

The task is complete when:

- [ ] Create activity submission works through `POST /api/v1/activities`.
- [ ] Backend errors and warnings are visible and do not destroy user input.
- [ ] Success display shows backend-returned side effects and treats suggested tasks correctly.
- [ ] No frontend-owned target, inventory, quarantine, task, or reminder truth is introduced.
- [ ] Focused submit/error/success tests pass.
