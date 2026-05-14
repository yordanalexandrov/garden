# Phase 10 — Frontend Products and Inventory Pages

## 1. Purpose

This phase implements frontend product catalog, product detail, usage rules, inventory overview, lots, movements, and manual adjustment flows. It lets users prepare structured product and stock data before creating product-consuming activities.

## 2. Position in the sequence

Phase 4 must provide the Angular shell and API client. Phase 8 must provide product/rule APIs. Phase 9 must provide inventory APIs. Phase 14 later depends on these pages and selectors for create activity product usage.

This phase must not be merged with Phase 7 because product/rule/inventory UX has different domain risks. It must not be merged with Phase 14 because activity creation must display backend-generated side effects and should be reviewed separately.

## 3. Source documents

- `docs/gardening-helper-frontend-technical-spec-v1.md` - defines products list/detail, inventory page, selector components, forms, and API service rules.
- `docs/gardening-helper-canonical-api-contract-v1.md` - defines products, usage rules, and inventory endpoints consumed by this phase.
- `docs/gardening-helper-domain-rules-and-invariants-v1.md` - defines frontend not ledger truth, stock mutation through backend only, rule visibility, and product/rule constraints.
- `docs/gardening-helper-testing-and-acceptance-spec-v1.md` - defines product detail, inventory form, movement history, and API error acceptance tests.
- `docs/gardening-helper-implementation-instructions-for-ai-v1.md` - defines Reactive Forms, typed API services, and frontend forbidden shortcuts.

## 4. Scope

### Frontend scope

- Implement routes/pages for:
  - `/products`
  - `/products/new`
  - `/products/:productId`
  - `/products/:productId/edit`
  - `/products/:productId/rules/new`
  - `/product-rules/:ruleId/edit`
  - `/inventory`
  - `/inventory/products/:productId`
  - `/inventory/products/:productId/lots/new`
  - `/inventory/adjustments/new`
- Implement products list/search/filter/create/edit/archive.
- Implement product detail with metadata, usage rules, inventory summary, lots, and movement history.
- Implement usage rule create/edit/archive.
- Implement inventory overview page.
- Implement add inventory lot form.
- Implement manual adjustment form.
- Add product and plant selector components if not already present.
- Display duplicate rule, validation, and shortage/negative-stock errors from backend.

### Testing scope

- Add frontend form/component/API service tests for product, rule, lot, adjustment, and inventory views.

## 5. Out of scope

- Activity product usage UI.
- Inventory allocation in frontend.
- AI product ingestion.
- Push/weather integrations.
- Direct stock mutation outside backend APIs.
- Direct Supabase table access.

## 6. Dependencies and prerequisites

- Previous phases required: Phase 4, Phase 8, Phase 9.
- Existing frontend modules expected: shell, API client, error mapper, plant selector from Phase 7 if present.
- Expected frontend paths after implementation: `src/app/features/products/`, `src/app/features/inventory/`, shared product/plant selector components.
- Backend requirements: products, usage rules, inventory lots, movements, overview endpoints available.
- Environment variables: frontend API base and Supabase Auth session config only.
- Test infrastructure requirements: Angular component tests and API service mocks.

## 7. Domain rules and invariants affected

- Frontend must not mutate stock without backend API.
- Frontend must show products as structured data.
- Frontend must not calculate ledger truth.
- Missing/duplicate rule states must be visible.
- Inventory movement ledger is mandatory.
- One active product+plant rule in v1.
- Product default unit is limited.
- Product category is controlled.
- API responses must not leak inaccessible data.

## 8. API contract impact

This phase consumes, but does not introduce, API endpoints.

Endpoints consumed:

- Products and Product Usage Rules endpoints from Phase 8.
- Inventory endpoints from Phase 9.

Request/response expectations:

- Use canonical product, rule, lot, movement, overview, and adjustment DTOs.
- Do not send trusted `accountId`.
- List responses use pagination envelope.
- Errors use canonical envelope.
- Duplicate active rule conflicts should be displayed from `CONFLICT`.
- Negative/invalid stock operations should display backend errors.

## 9. Database impact

No schema changes are expected in this phase.

Frontend must not access the database or application tables directly.

## 10. Backend design notes

No backend work is expected except bug fixes in already implemented APIs. Frontend must not compensate for missing backend ledger behavior by calculating or mutating stock locally.

## 11. Frontend design notes

- Product list should support search/filter by category.
- Product detail should show product metadata, usage rules, inventory summary, lots, and movement history.
- Inventory overview should display current stock per product from backend responses.
- Add-lot form should submit `quantityInitial`, `unit`, purchase/expiry dates, batch number, and notes.
- Manual adjustment form should submit backend-required direction and quantity, and show the movement result/history after success.
- Movement history should be visible and refreshed after lot/adjustment mutations.
- Product usage rules should use plant selectors and canonical unit/category options.
- Frontend can validate required fields and positive numbers, but backend remains authoritative.
- Forbidden shortcuts: calculating FEFO allocation in components, directly editing stock quantities in UI state, hiding movement history, using raw untyped HTTP in components.

## 12. Integration design notes

No external integration work is expected in this phase.

## 13. Testing requirements

### Unit/component tests

- Product form validates name, category, and default unit.
- Usage rule form validates plant, dose, unit, and interval values.
- Duplicate rule conflict displays clearly.
- Add lot form validates positive quantity and allowed unit.
- Manual adjustment form validates direction and positive quantity.
- Inventory pages refetch or update displayed data after successful mutations.
- Movement history renders after lot creation and adjustment.

### Frontend/API-service tests

- Product API service uses canonical endpoints.
- Inventory API service uses canonical endpoints.
- Components do not send `accountId`.

### Static/security checks

- No FEFO/inventory allocation implementation in components.
- No direct Supabase table/storage calls.
- No backend-only secrets in frontend code.

## 14. Verification checklist

- [ ] Products list/search/filter/create/edit/archive works.
- [ ] Product detail displays metadata, rules, inventory summary, lots, and movements.
- [ ] Usage rule create/edit/archive works.
- [ ] Inventory overview works.
- [ ] Add lot form works and movement history refreshes.
- [ ] Manual adjustment form works and movement history refreshes.
- [ ] API errors display clearly.
- [ ] Frontend tests/typecheck/lint/build pass where configured.
- [ ] Manual smoke covers product, rule, lot, adjustment, movement history.
- [ ] Static search confirms no inventory allocation logic in components.

## 15. Review checklist

- [ ] Frontend delegates product/rule/inventory truth to backend APIs.
- [ ] API services are typed and centralized.
- [ ] Movement history is visible.
- [ ] Forms use Reactive Forms.
- [ ] Duplicate rule and stock errors are displayed.
- [ ] No direct stock mutation or FEFO allocation exists in frontend.
- [ ] No activity product usage UI slipped in.
- [ ] Mobile layouts are usable.

## 16. Suggested branch name

```text
feature/frontend-products-inventory
```

## 17. Expected PR summary

```md
## Summary
Implemented frontend Products and Inventory pages.

## Scope
- Added product, rule, inventory overview, lot, movement, and adjustment UI.
- Added typed API services and form validation.
- Added movement-history refresh after stock mutations.

## Domain rules preserved
- Frontend uses backend inventory APIs for all stock changes.
- Movement history remains visible.
- Product usage rules remain structured and plant-specific.

## Tests
- <commands run and results>

## Deferred work
- Create activity product usage, AI ingestion, weather, and push remain deferred.

## Review focus
- Ledger boundary.
- API service typing.
- Reactive Forms.
- Error visibility.
```

## 18. Risks and pitfalls

- Letting components adjust stock locally without backend movement.
- Hiding movement history behind only a current balance.
- Reimplementing FEFO allocation in frontend.
- Hardcoding enum values that do not match the API contract.
- Adding AI ingestion entry flow before backend AI exists.
- Sending `accountId` from product/inventory forms.

## 19. Exit criteria

- Product and inventory UI works against backend APIs.
- Users can create product/rule/lot/adjustment and see movement history.
- Frontend boundary checks pass.
- Later create activity UI can reuse product selectors and display product/rule state.
