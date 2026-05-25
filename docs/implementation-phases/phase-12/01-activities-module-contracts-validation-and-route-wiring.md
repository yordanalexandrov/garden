# Implementation Task - Phase 12 Step 1: Activities Module Contracts, Validation, and Route Wiring

## Goal

Prepare the backend activities module contracts, validation schemas, DTO mapping, and route wiring for the Phase 12 activity transaction flow.

## Branch

Use branch:

```text
feature/backend-activity-transaction
```

## Scope

- [ ] Inspect existing backend module, route registration, auth actor, transaction, envelope, validation, target resolver, products/rules, inventory, and test helper patterns.
- [ ] Create `backend/src/modules/activities/` following local conventions.
- [ ] Define activity input/filter/read/side-effect DTO types for list, detail, create request, product usage rows, inventory effects, quarantine periods, suggested tasks, and warnings.
- [ ] Define validation schemas for activity params, list filters, create activity payload, target scope/selection, product usage rows, units, activity types, and `allowInventoryShortage`.
- [ ] Add DTO mappers that preserve canonical envelope field names and return side-effect arrays even when empty.
- [ ] Wire authenticated activity routes under `/api/v1/activities` without implementing business behavior beyond safe placeholders or service calls required by local style.
- [ ] Add focused validation/DTO/route-registration tests.

## Out of Scope

- [ ] Repository read queries beyond interfaces needed for later steps.
- [ ] Create activity transaction behavior.
- [ ] Inventory allocation, quarantine, suggested tasks, correction/audit, frontend UI, weather, AI, push, storage, deployment, or MCP tools.
- [ ] Schema changes.

## Required Documents

- [ ] `AGENTS.md`
- [ ] `docs/gardening-helper-domain-rules-and-invariants-v1.md`
- [ ] `docs/gardening-helper-canonical-api-contract-v1.md`
- [ ] `docs/gardening-helper-testing-and-acceptance-spec-v1.md`
- [ ] `docs/gardening-helper-backend-application-design-pack-v1.md`
- [ ] `docs/implementation-phases/phase-12-backend-activity-transaction-flow.md`
- [ ] Existing backend app, shared, targets, products, inventory, route, validation, and test helper files.

## Domain Rules

- Backend owns business logic.
- Controllers stay thin.
- Activity creation with product usage must be transactional.
- Frontend must not submit trusted `accountId`.
- API responses and errors must use the canonical envelope.

## Tests Required

- [ ] Invalid activity type, target scope mismatch, invalid unit, non-positive product quantity, and malformed UUID are rejected.
- [ ] Route registration keeps health unauthenticated and activity routes authenticated.
- [ ] DTO mapping returns canonical field names and empty side-effect arrays.

## Acceptance Criteria

- [ ] Activity module scaffolding matches existing backend conventions.
- [ ] Validation and DTO helpers are ready for later service/repository steps.
- [ ] No business side effects are implemented outside the service layer.
