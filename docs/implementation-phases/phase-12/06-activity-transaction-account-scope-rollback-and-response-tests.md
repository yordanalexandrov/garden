# Implementation Task - Phase 12 Step 6: Activity Transaction Account Scope, Rollback, and Response Tests

## Goal

Add comprehensive regression coverage for the full Phase 12 activity transaction workflow.

## Branch

Use branch:

```text
feature/backend-activity-transaction
```

## Scope

- [ ] Expand deterministic fixtures for account A/B places, beds, perennials, products, rules, inventory lots, and activities.
- [ ] Add API/service integration tests for watering, treatment with rule, treatment without rule, shortage blocked, shortage allowed, product/rule mismatch, cross-account/cross-place target rejection, and read scoping.
- [ ] Add rollback tests that inspect database state after failures in target persistence, product usage persistence, movement creation, lot update, quarantine creation, and suggested task creation.
- [ ] Verify API response arrays are present even when empty.
- [ ] Verify canonical error envelopes for validation, business-rule, not-found, and inventory-shortage cases.
- [ ] Add static/boundary tests if project has existing checks for controller/service/repository layering.

## Out of Scope

- [ ] Frontend E2E tests.
- [ ] Activity correction tests from Phase 13.
- [ ] Manual task lifecycle/reminder tests from Phase 18.

## Required Documents

- [ ] `docs/gardening-helper-testing-and-acceptance-spec-v1.md`
- [ ] `docs/gardening-helper-domain-rules-and-invariants-v1.md`
- [ ] `docs/gardening-helper-canonical-api-contract-v1.md`
- [ ] `docs/implementation-phases/phase-12-backend-activity-transaction-flow.md`
- [ ] Existing backend test fixtures and reset helpers.

## Domain Rules

- Critical mutation endpoints must be transaction-safe.
- Account scoping is mandatory.
- No stock update occurs without movement history.
- Suggested tasks have no reminders.

## Tests Required

- [ ] Happy path watering and treatment flows.
- [ ] Shortage blocked and allowed behavior.
- [ ] Cross-account/cross-place/product-rule rejection.
- [ ] Rollback database state assertions for every critical partial-failure point.
- [ ] Response shape arrays and canonical error envelopes.

## Acceptance Criteria

- [ ] The Phase 12 workflow has enough automated coverage to review transaction safety and domain invariants.
