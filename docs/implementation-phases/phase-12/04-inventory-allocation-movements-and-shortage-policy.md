# Implementation Task - Phase 12 Step 4: Inventory Allocation, Movements, and Shortage Policy

## Goal

Add product inventory consumption to activity creation using the Phase 9 allocator and ledger rules.

## Branch

Use branch:

```text
feature/backend-activity-transaction
```

## Scope

- [ ] Reuse Phase 9 FEFO allocation and shortage/unit policy helpers.
- [ ] For each product usage, allocate only account-scoped available lots for that product and unit.
- [ ] Persist `inventory_movements` with movement type `consumption` for covered stock.
- [ ] Update `inventory_lots.quantity_remaining` in the same transaction.
- [ ] Reject shortage by default when `allowInventoryShortage` is false.
- [ ] When shortage override is explicit, consume covered stock only, never create negative lots, and return uncovered quantity warning.
- [ ] Return canonical `inventoryEffects` from backend data, not calculated by frontend.
- [ ] Add rollback tests around movement creation and lot updates.

## Out of Scope

- [ ] Quarantine and suggested task side effects.
- [ ] Manual adjustments or lot purchase APIs.
- [ ] Activity correction/correction movements.
- [ ] Frontend inventory allocation.

## Required Documents

- [ ] `docs/gardening-helper-domain-rules-and-invariants-v1.md`
- [ ] `docs/gardening-helper-canonical-api-contract-v1.md`
- [ ] `docs/implementation-phases/phase-09-backend-inventory-ledger-api.md`
- [ ] `docs/implementation-phases/phase-12-backend-activity-transaction-flow.md`
- [ ] Existing inventory allocator, repository, and movement tests.

## Domain Rules

- Inventory is ledger-based.
- Never mutate stock without an inventory movement.
- No lot goes negative.
- Shortage policy must be explicit.
- Activity creation with product usage must be transactional.

## Tests Required

- [ ] Treatment with product consumes FEFO lots and creates movement rows.
- [ ] Shortage blocked returns `INVENTORY_SHORTAGE` and rolls back all writes.
- [ ] Shortage allowed creates covered movements only and warning for uncovered quantity.
- [ ] Failure during movement or lot update rolls back activity, targets, product usages, movements, and lot updates.

## Acceptance Criteria

- [ ] Product usage consumes inventory through ledger movements only.
- [ ] Shortage behavior is explicit, tested, and canonical.
