# Implementation Task - Phase 12 Step 3: Create Activity Transaction Header, Targets, and Product Usages

## Goal

Implement the first transaction slice of `POST /activities`: activity header, resolved targets, and product usage rows.

## Branch

Use branch:

```text
feature/backend-activity-transaction
```

## Scope

- [ ] Implement `ActivitiesService.createActivity` transaction boundary.
- [ ] Validate requested place/account context and use Phase 11 `TargetResolver` for all canonical target scopes.
- [ ] Persist `activities` header with `place_id` when resolvable.
- [ ] Persist concrete `activity_targets` from resolver output.
- [ ] Validate products and optional `productUsageRuleId` belong to the actor account.
- [ ] Enforce supplied usage rule belongs to supplied product and compatible account.
- [ ] Persist `activity_product_usages`.
- [ ] Return missing-rule warning when product usage is otherwise valid and no usage rule is supplied.
- [ ] Add tests for header/target/product usage persistence and rollback before inventory work is added.

## Out of Scope

- [ ] Inventory deduction/movements and lot updates.
- [ ] Quarantine periods.
- [ ] Suggested tasks.
- [ ] Activity correction/audit expansion.
- [ ] Frontend create activity UI.

## Required Documents

- [ ] `docs/gardening-helper-domain-rules-and-invariants-v1.md`
- [ ] `docs/gardening-helper-canonical-api-contract-v1.md`
- [ ] `docs/implementation-phases/phase-11-backend-target-resolver.md`
- [ ] `docs/implementation-phases/phase-12-backend-activity-transaction-flow.md`
- [ ] Existing targets, products/rules, transaction, and test helper files.

## Domain Rules

- Target rows store resolved truth.
- Resolved targets must not be empty.
- Product usage rule is optional but must be consistent if provided.
- Any failure rolls back the whole create activity mutation.

## Tests Required

- [ ] Watering all beds creates activity and target rows only.
- [ ] Product rule for a different product is rejected with no activity/target/product usage rows.
- [ ] Cross-account/cross-place targets are rejected with no side effects.
- [ ] Missing usage rule succeeds with warning and no rule-derived side effects.

## Acceptance Criteria

- [ ] Activity header, targets, and product usage rows are transaction-safe and account-scoped.
