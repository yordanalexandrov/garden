# Implementation Task - Phase 14 Step 4: Product Usage Form Array

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
Create the reusable app-product-usage-form-array component for optional activity product usage rows using canonical product usage request fields.
```

## Branch

Use branch:

```text
feature/frontend-create-activity
```

---

# Scope

Implement only:

- [ ] Inspect existing product selector, product usage rule APIs, product/rule detail patterns, quantity/unit controls, and form-array conventions from Phase 10.
- [ ] Create reusable `app-product-usage-form-array`.
- [ ] Support adding, editing, and removing one or more product usage rows.
- [ ] Each row must collect `productId`, optional `productUsageRuleId`, `quantityUsed`, `unit`, and `notes`.
- [ ] Load product options through typed product API services.
- [ ] Load product usage rule options scoped to the selected product.
- [ ] Show product rule visibility and explicit missing-rule state when no structured rule is selected.
- [ ] Show inconsistent rule state if loaded rule data does not match the selected product.
- [ ] Validate required product, positive quantity, and canonical unit client-side.
- [ ] Preserve input on validation and backend errors.
- [ ] Emit canonical product usage request rows for the parent create activity form.
- [ ] Add component tests for add/remove, validation, missing-rule visibility, inconsistent-rule display, and emitted request shape.

---

# Out of Scope

Do not implement:

- [ ] Backend product/rule validation.
- [ ] Inventory allocation or shortage calculation.
- [ ] Quarantine or suggested task preview as business truth.
- [ ] Product/rule create/edit/archive flows.
- [ ] Activity submit behavior.
- [ ] Direct Supabase application-table or storage calls.

---

# Required Documents

Read before coding:

- [ ] `AGENTS.md`
- [ ] `docs/gardening-helper-implementation-agent-instructions.md`
- [ ] `docs/gardening-helper-ai-implementation-handoff-readme-v1.md`
- [ ] `docs/gardening-helper-implementation-instructions-for-ai-v1.md`
- [ ] `docs/gardening-helper-domain-rules-and-invariants-v1.md` product usage, inventory, activity, and frontend boundary sections
- [ ] `docs/gardening-helper-canonical-api-contract-v1.md` product, product rule, unit, and activity product usage sections
- [ ] `docs/gardening-helper-testing-and-acceptance-spec-v1.md`
- [ ] `docs/gardening-helper-frontend-technical-spec-v1.md` Product usage form component and Create activity page sections
- [ ] `docs/implementation-phases/phase-10-frontend-products-and-inventory-pages.md`
- [ ] `docs/implementation-phases/phase-12-backend-activity-transaction-flow.md`
- [ ] `docs/implementation-phases/phase-14-frontend-activities-and-create-activity-flow.md`
- [ ] Existing product/rule API services, selectors, form controls, and tests

---

# Domain Rules Affected

This task touches:

- [ ] activities
- [ ] inventory
- [ ] product usage rules
- [ ] quarantine
- [ ] tasks/reminders
- [ ] frontend forms
- [ ] API contract

Important rules to preserve:

```text
Product usage is optional only where domain allows it.
Product usage rule is optional but must be consistent if provided.
Missing product rule must be visible.
Frontend must not allocate inventory across lots.
Frontend must not create quarantine periods or suggested tasks locally as truth.
Backend validation is authoritative.
All application data access goes through the Fastify API under /api/v1.
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

- [ ] frontend component
- [ ] frontend form validation
- [ ] typed product/rule API consumption
- [ ] reusable form-array output
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
- [ ] no inventory allocation or stock mutation in frontend code
- [ ] no local quarantine or suggested-task generation as business truth

---

# API Contract

Endpoints involved:

```text
Supporting selector/list endpoints for products and product usage rules
POST /api/v1/activities consumes emitted productUsages in later steps
```

Product usage request fields:

```text
productId
productUsageRuleId
quantityUsed
unit
notes
```

Request/response must follow:

- `docs/gardening-helper-canonical-api-contract-v1.md`

---

# Tests Required

Add or update tests for:

- [ ] product usage row add/remove
- [ ] product and quantity validation
- [ ] canonical unit handling
- [ ] missing-rule warning visibility
- [ ] inconsistent rule state visibility
- [ ] emitted product usage request shape
- [ ] no `accountId`

Specific test cases:

1. Adding two product usage rows emits two canonical rows with product, optional rule, quantity, unit, and notes.
2. Removing a row updates the emitted array without mutating other rows.
3. A product row without `productUsageRuleId` shows an explicit missing-rule warning.
4. The component does not calculate inventory consumption allocation or quarantine/task outputs.

---

# Acceptance Criteria

The task is complete when:

- [ ] `app-product-usage-form-array` supports canonical activity product usage rows.
- [ ] Missing and inconsistent product rule states are visible.
- [ ] The component does not own inventory, quarantine, or task side-effect logic.
- [ ] Focused component tests pass.
