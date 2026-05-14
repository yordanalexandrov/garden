# Phase 12 — Backend Activity Transaction Flow

## 1. Purpose

This phase implements the critical `POST /activities` workflow with target persistence, product usage, inventory deduction, quarantine generation, and suggested task generation. It also adds activity list/detail reads. This is the central transactional workflow of v1.

## 2. Position in the sequence

Phase 8 must provide products/rules. Phase 9 must provide inventory ledger and allocator. Phase 11 must provide target resolution. Later phases depend on activity records and side effects for correction/audit, frontend create activity, problems, tasks, calendar, weather, dashboard, and acceptance hardening.

This phase must not be merged with Phase 11 because target resolution should be independently verified first. It must not be merged with Phase 13 because correction/audit behavior is semantically separate from initial creation. It must not be merged with frontend Phase 14 because backend transaction behavior must be stable before UI work.

## 3. Source documents

- `docs/gardening-helper-domain-rules-and-invariants-v1.md` - defines activity transaction, target truth, product/rule consistency, inventory, quarantine, suggested task, shortage, and frontend side-effect visibility rules.
- `docs/gardening-helper-canonical-api-contract-v1.md` - defines Activities API section 17 and side-effect response arrays.
- `docs/gardening-helper-backend-application-design-pack-v1.md` - defines `ActivitiesRepository`, `ActivitiesService.createActivity`, target resolver use, inventory allocation, quarantine, and task suggestion flow.
- `docs/gardening-helper-testing-and-acceptance-spec-v1.md` - defines critical create activity happy path, failure path, shortage, and rollback tests.
- `docs/001_initial_schema_gardening_helper.sql` - defines activities, targets, product usages, inventory movements, quarantine periods, and tasks.
- `docs/004_guards_and_triggers_gardening_helper.sql` - defines account/target/product/quarantine consistency guards.

## 4. Scope

### Backend scope

- Implement `ActivitiesRepository`.
- Implement `ActivitiesService.createActivity`.
- Implement `GET /activities`.
- Implement `GET /activities/:activityId`.
- Implement `POST /activities`.
- Persist activity header and resolved `activity_targets`.
- Persist `activity_product_usages`.
- Deduct inventory using FEFO allocation.
- Create `inventory_movements`.
- Update `inventory_lots.quantity_remaining`.
- Generate `quarantine_periods` when rule has quarantine days.
- Generate suggested `tasks` and matching `task_targets` when rule has reapplication interval.
- Return canonical side-effect arrays and warnings.
- Implement explicit shortage policy:
  - reject by default when `allowInventoryShortage = false`;
  - allow only with explicit override;
  - create movements only for covered stock;
  - never create negative lots or fake stock.

### Testing scope

- Add service integration and API tests with database state assertions.
- Add rollback tests for every critical partial-failure point.

## 5. Out of scope

- Manual task APIs and task confirmation/reminders.
- Calendar feed.
- Frontend create activity page.
- Activity correction endpoint.
- Weather rain checks.
- Audit expansion beyond optional existing audit insertion if available.

## 6. Dependencies and prerequisites

- Previous phases required: Phase 8, Phase 9, Phase 11.
- Existing modules expected: products/rules, inventory ledger/allocator, target resolver, task repository helpers if suggested task creation is implemented internally.
- Expected backend paths after implementation: `src/modules/activities/`, plus reuse of `src/modules/inventory/`, `src/modules/products/`, `src/modules/targets/`, `src/modules/tasks/`, and `src/modules/quarantine/` helpers as needed.
- Database requirements: activity, inventory, quarantine, and task tables/guards migrated.
- Environment variables: standard backend database/auth config only.
- Test infrastructure requirements: target fixtures, product/rule fixtures, stock lot fixtures, transaction failure injection.

## 7. Domain rules and invariants affected

- Activities are historical records.
- Activity creation is transactional.
- Target rows store resolved truth.
- Resolved targets must not be empty.
- Product usage rule is optional but must be consistent if provided.
- Missing product rule must be visible.
- Activity place_id should be filled when resolvable.
- Product use creates consumption movements.
- No lot goes negative.
- Shortage policy must be explicit.
- Quarantine is generated from product usage context.
- Suggested tasks are not planned.
- Suggested tasks must not have reminders.
- Critical mutation endpoints should be transaction-safe.

## 8. API contract impact

Endpoints involved:

- `GET /api/v1/activities`
- `POST /api/v1/activities`
- `GET /api/v1/activities/:activityId`

Request/response shapes to preserve:

- Create request uses `placeId`, `type`, `performedAt`, `targetScopeType`, `targetSelection`, `notes`, `productUsages`, and `allowInventoryShortage`.
- Product usage rows use `productId`, optional `productUsageRuleId`, `quantityUsed`, `unit`, and `notes`.
- Create response returns:
  - `activity`
  - `inventoryEffects`
  - `quarantinePeriods`
  - `suggestedTasks`
  - `warnings`
- Arrays must be present even when empty.
- List response uses pagination envelope.
- Errors use canonical envelope.

Enums/status values that matter:

- `ActivityType` canonical values.
- `TargetScopeType` canonical values.
- `Unit`: `ml`, `l`, `g`, `kg`.
- Generated task status must be `suggested`.
- `INVENTORY_SHORTAGE` for blocked shortage.

## 9. Database impact

Tables involved:

- `activities`
- `activity_targets`
- `activity_product_usages`
- `inventory_lots`
- `inventory_movements`
- `quarantine_periods`
- `tasks`
- `task_targets`
- `products`
- `product_usage_rules`

Views optionally involved:

- `activity_detail_view`

Schema changes are not expected in this phase.

## 10. Backend design notes

- `ActivitiesService.createActivity` must open one transaction covering all writes.
- Target resolution can happen before or inside the transaction, but persisted target set must reflect validated concrete rows.
- Product and rule validation must happen backend-side and within actor account scope.
- If `productUsageRuleId` is supplied, it must belong to the selected product.
- Missing rule can be a warning, not a hard blocker, when product usage is otherwise valid.
- Inventory allocation must reuse Phase 9 helper and create movements only for covered stock.
- Lot updates and movements must be in the same transaction.
- Quarantine dates default to activity performed date through performed date + quarantine days; zero-day policy should be documented.
- Suggested tasks should copy target rows from the activity and remain `suggested` with no reminders.
- `activities.place_id` should be set when place is provided/resolvable.
- Any failure in movement, lot update, quarantine, or suggested task creation must roll back the full transaction.
- Forbidden shortcuts: partial commits, stock mutation without movement, creating planned tasks/reminders, accepting cross-place targets, doing allocation in controller.

## 11. Frontend design notes

No frontend work is expected in this phase.

The future frontend must display returned warnings and side-effect arrays instead of calculating them.

## 12. Integration design notes

No external integration work is expected in this phase.

## 13. Testing requirements

### Unit tests

- Activity request validation rejects invalid type, target scope mismatch, invalid unit, and non-positive quantities.
- Quarantine date helper calculates expected start/end dates.
- Suggested task builder creates `suggested` tasks and no reminders.

### Integration/API tests

- Watering all beds creates activity and targets only.
- Treatment with product rule creates activity, targets, product usage, movement(s), lot updates, quarantine, suggested task, and task targets.
- Treatment without product rule succeeds with warning and no rule-derived quarantine/task.
- Shortage blocked returns `INVENTORY_SHORTAGE` and rolls back all writes.
- Shortage allowed creates covered movements only, sets lots to zero as applicable, and returns warning with uncovered quantity.
- Product rule for a different product is rejected with no side effects.
- Cross-account/cross-place targets are rejected with no side effects.
- Failure during movement creation rolls back all writes.
- Failure during quarantine creation rolls back stock/movement/activity writes.
- Failure during suggested task creation rolls back all writes.
- API response includes required arrays even when empty.
- Account A cannot read account B activities.

## 14. Verification checklist

- [ ] Activity list endpoint is implemented.
- [ ] Activity detail endpoint is implemented.
- [ ] Create activity endpoint is implemented.
- [ ] Create activity transaction covers activity, targets, product usages, movements, lot updates, quarantine, suggested tasks, and task targets.
- [ ] Shortage blocked and allowed behavior is tested.
- [ ] Suggested tasks are `suggested` and have no reminders.
- [ ] No stock updates occur without movements.
- [ ] `activities.place_id` is populated when resolvable.
- [ ] Rollback tests inspect database state.
- [ ] Backend tests/typecheck/lint/build pass where configured.

## 15. Review checklist

- [ ] Full transaction boundary is explicit.
- [ ] Target resolver is reused.
- [ ] Inventory ledger behavior is correct.
- [ ] Product rule/product/account consistency is enforced.
- [ ] Quarantine generation uses rule context.
- [ ] Suggested task generation does not create planned tasks or reminders.
- [ ] Warnings are returned for missing rule/allowed shortage.
- [ ] Response shape matches canonical contract exactly.
- [ ] Tests cover happy paths, failures, account scoping, and rollback.

## 16. Suggested branch name

```text
feature/backend-activity-transaction
```

## 17. Expected PR summary

```md
## Summary
Implemented backend Activity transaction flow.

## Scope
- Added activity list/detail/create APIs.
- Added transactional target, product usage, inventory, quarantine, and suggested task side effects.
- Added shortage policy and rollback tests.

## Domain rules preserved
- Activities persist resolved targets.
- Stock changes create inventory movements.
- Suggested follow-up tasks are not planned and have no reminders.
- Full side-effect flow is transactional.

## Tests
- <commands run and results>

## Deferred work
- Activity correction/audit expansion, frontend create activity, task confirmation, calendar, and weather remain deferred.

## Review focus
- Transaction safety.
- Inventory ledger correctness.
- Target persistence.
- Side-effect response shape.
```

## 18. Risks and pitfalls

- Committing activity before all side effects succeed.
- Updating lots without movement rows.
- Creating suggested tasks as planned tasks.
- Creating reminders for suggested tasks.
- Dropping warnings from response.
- Allowing cross-place mixed targets.
- Using product rules that do not belong to the product.
- Failing to test rollback after partial writes.

## 19. Exit criteria

- Activity create/list/detail APIs are implemented and tested.
- Product-consuming activity flow is fully transactional.
- Inventory, quarantine, and suggested task side effects are correct and auditable.
- Shortage policy is explicit and tested.
- Frontend create activity phase can rely on stable backend behavior.
