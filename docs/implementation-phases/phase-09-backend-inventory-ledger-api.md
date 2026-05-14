# Phase 9 — Backend Inventory Ledger API

## 1. Purpose

This phase implements inventory lots, movements, manual adjustments, inventory overview, and the FEFO allocation helper. It exists to establish auditable ledger behavior before activity creation can consume products.

## 2. Position in the sequence

Phase 8 must already provide account-scoped products. Phase 12 depends on this phase for inventory allocation and consumption movements. Frontend Phase 10 depends on this phase for product stock, lots, movement history, and adjustment flows.

This phase must not be merged with Phase 8 because metadata CRUD and stock ledger semantics need separate review. It must not be merged with Phase 12 because activity creation combines inventory with targets, quarantine, and tasks and requires a separate transaction review.

## 3. Source documents

- `docs/gardening-helper-domain-rules-and-invariants-v1.md` - defines ledger mandatory, no negative lots, purchase/adjustment/consumption movement rules, shortage policy, FEFO, and limited unit conversion.
- `docs/gardening-helper-canonical-api-contract-v1.md` - defines Inventory API section 16.
- `docs/gardening-helper-backend-application-design-pack-v1.md` - defines `InventoryRepository`, `InventoryService`, create lot flow, manual adjustment flow, and inventory allocator.
- `docs/gardening-helper-technical-requirements-and-erd.md` - defines `inventory_lots` and `inventory_movements`.
- `docs/001_initial_schema_gardening_helper.sql` - defines inventory tables, constraints, and indexes.
- `docs/002_views_gardening_helper.sql` - defines `inventory_product_balances`.
- `docs/004_guards_and_triggers_gardening_helper.sql` - validates inventory/product/lot/activity account consistency.
- `docs/gardening-helper-testing-and-acceptance-spec-v1.md` - defines inventory allocator, lot creation, adjustment, shortage, and rollback tests.

## 4. Scope

### Backend scope

- Implement `InventoryRepository`.
- Implement `InventoryService`.
- Implement inventory overview endpoint.
- Implement inventory lot creation with purchase movement in one transaction.
- Implement lot listing endpoint.
- Implement movement history endpoint.
- Implement manual adjustment endpoint with movement and lot update in one transaction.
- Implement FEFO allocation helper for later activity use.
- Enforce no negative lot quantity.
- Enforce allowed units and reject unsupported conversions.

### Testing scope

- Add unit tests for allocator.
- Add integration/API tests for lot creation, movement history, adjustments, account scoping, and rollback behavior.

## 5. Out of scope

- Activity product consumption.
- Frontend inventory pages.
- Push notifications.
- AI/weather/storage integrations.
- Complex unit conversions.
- Hidden stock mutation triggers.
- Reconciliation imports or barcode/catalog features.

## 6. Dependencies and prerequisites

- Previous phases required: Phase 8, plus backend foundations from Phases 1-3.
- Existing modules expected: products repository/service and account context.
- Expected backend paths after implementation: `src/modules/inventory/` with repository, service, controller, validation, allocator, and types.
- Database requirements: `products`, `inventory_lots`, `inventory_movements`, `inventory_product_balances`, and inventory guards migrated.
- Environment variables: standard backend database/auth config only.
- Test infrastructure requirements: product fixtures, lot fixtures, account A/account B fixtures, and transaction failure simulation.

## 7. Domain rules and invariants affected

- Inventory movement ledger is mandatory.
- Current lot quantity is derived/convenience state.
- Purchase lot creation creates purchase movement.
- Product usage creates consumption movement later.
- Manual changes create `manual_adjustment` or `correction` movements.
- No negative lot quantity in v1.
- Shortage policy must be explicit.
- FEFO allocation is default.
- Unit conversion is limited.
- Stock must never change silently.

## 8. API contract impact

Endpoints involved:

- `GET /api/v1/inventory`
- `GET /api/v1/products/:productId/inventory-lots`
- `POST /api/v1/products/:productId/inventory-lots`
- `GET /api/v1/products/:productId/inventory-movements`
- `POST /api/v1/inventory/adjustments`

Request/response shapes to preserve:

- Lot creation request uses `quantityInitial`, `unit`, `purchaseDate`, `expiryDate`, `batchNumber`, and `notes`.
- Lot creation response returns both `lot.id` and `movement.id`.
- Adjustment request uses `productId`, optional `inventoryLotId`, `quantity`, `unit`, `movementType`, `direction`, and `notes`.
- Inventory overview list returns `productId`, `productName`, `category`, `quantityRemaining`, `unit`, `lotsCount`, and `nearestExpiryDate`.
- List endpoints use pagination envelope.
- Errors use canonical envelope.

Status/enum values that matter:

- Unit: `ml`, `l`, `g`, `kg`.
- Movement type: `purchase`, `manual_adjustment`, `consumption`, `correction`.
- Adjustment direction: `increase`, `decrease`.
- `INVENTORY_SHORTAGE` is reserved for insufficient stock behavior when applicable.

## 9. Database impact

Tables involved:

- `inventory_lots`
- `inventory_movements`
- `products`

View involved:

- `inventory_product_balances`

Triggers/guards involved:

- `trg_inventory_lots_validate_consistency`
- `trg_inventory_movements_validate_consistency`

No schema changes are expected in this phase.

## 10. Backend design notes

- Creating a lot must insert `inventory_lots` and purchase `inventory_movements` in one transaction.
- Manual adjustments must insert a movement and update `quantity_remaining` in one transaction when lot-bound.
- Decrease adjustments must not make lot quantity negative.
- `InventoryRepository.updateLotRemainingQuantity` should be used only inside services that also create movements.
- Movement history is append-only for normal flows.
- FEFO allocator should order by earliest expiry date, then oldest purchase date, then oldest created_at.
- Unsupported unit conversion should fail rather than silently convert.
- Account consistency must be checked before lot/movement operations.
- Forbidden shortcuts: direct stock update without movement, using only mutable product balance, negative lots, allocation logic in controllers.

## 11. Frontend design notes

No frontend work is expected in this phase.

## 12. Integration design notes

No external integration work is expected in this phase.

## 13. Testing requirements

### Unit tests

- Allocator uses earliest expiry first.
- Allocator splits consumption across lots.
- Allocator reports uncovered quantity.
- Allocator rejects zero/negative requested quantity.
- Allocator rejects unsupported unit conversion.

### Integration/API tests

- `POST /products/:productId/inventory-lots` creates lot and purchase movement transactionally.
- Lot creation rollback leaves no lot if movement creation fails.
- `POST /inventory/adjustments` increase creates movement and updates lot.
- `POST /inventory/adjustments` decrease creates movement and updates lot.
- Decrease that would make lot negative is rejected and creates no movement.
- Movement history lists purchase and adjustment movements.
- Inventory overview uses lots/view and reflects changes.
- Product, lot, and movement access is account-scoped.
- API response envelopes match the contract.

### Database tests

- `quantity_remaining >= 0` constraint is enforced.
- Inventory movement product/lot/account guard rejects mismatches.

## 14. Verification checklist

- [ ] Inventory overview endpoint is implemented.
- [ ] Lot creation endpoint is implemented and transactional.
- [ ] Lot list endpoint is implemented.
- [ ] Movement history endpoint is implemented.
- [ ] Manual adjustment endpoint is implemented and transactional.
- [ ] FEFO allocator is implemented and unit tested.
- [ ] No lot can become negative.
- [ ] No service updates lot quantity without movement in same workflow.
- [ ] Account scoping is covered by tests.
- [ ] Backend tests/typecheck/lint/build pass where configured.

## 15. Review checklist

- [ ] Ledger movements exist for every stock mutation.
- [ ] `quantity_remaining` is treated as convenience state, not sole truth.
- [ ] Transactions wrap lot+movement and adjustment+movement updates.
- [ ] Shortage/negative-stock behavior is explicit.
- [ ] Unsupported unit conversions fail safely.
- [ ] Account scoping is enforced for product, lot, and movement access.
- [ ] No activity consumption, frontend UI, or provider work slipped in.
- [ ] Rollback tests inspect database state.

## 16. Suggested branch name

```text
feature/backend-inventory-ledger
```

## 17. Expected PR summary

```md
## Summary
Implemented backend Inventory Ledger API.

## Scope
- Added inventory lots, movements, overview, manual adjustments, and FEFO allocator.
- Added transaction and rollback tests for ledger writes.

## Domain rules preserved
- Stock never changes without an inventory movement.
- Lot quantity cannot become negative.
- Purchase and adjustment flows are transactional.

## Tests
- <commands run and results>

## Deferred work
- Activity consumption and frontend inventory pages remain deferred.

## Review focus
- Ledger correctness.
- Transaction safety.
- Account scoping.
- Unit/shortage behavior.
```

## 18. Risks and pitfalls

- Updating `inventory_lots.quantity_remaining` without inserting a movement.
- Treating `inventory_product_balances` as mutable truth.
- Allowing negative lots.
- Implementing silent g/ml or l/kg conversions.
- Forgetting rollback tests for failed movement or lot updates.
- Adding activity consumption before target/activity transaction exists.

## 19. Exit criteria

- Inventory ledger APIs are implemented and tested.
- FEFO allocation helper is ready for Phase 12.
- Lot creation and adjustments are transaction-safe.
- Movement history is visible and account-scoped.
- No product-consuming activity behavior has been implemented yet.
