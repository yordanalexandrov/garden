# Phase 8 — Backend Products and Usage Rules API

## 1. Purpose

This phase implements product catalog and plant-specific product usage rule APIs. Products and rules are required before inventory, activities with product usage, quarantine generation, and suggested follow-up task generation can be implemented safely.

## 2. Position in the sequence

Phase 5 must already provide account-scoped plants because usage rules reference plants. Phase 9 depends on products for inventory lots and movements. Phase 12 depends on products and rules for product-consuming activity side effects.

This phase must not be merged with Phase 9 because product/rule metadata and inventory ledger semantics should be reviewed separately. It must not be merged with activity work because activity transaction behavior depends on a stable product/rule API.

## 3. Source documents

- `docs/gardening-helper-canonical-api-contract-v1.md` - defines Products API section 14 and Product Usage Rules API section 15.
- `docs/gardening-helper-domain-rules-and-invariants-v1.md` - defines product ownership, allowed units/categories, one active product+plant rule, rule history, and archive rules.
- `docs/gardening-helper-backend-application-design-pack-v1.md` - defines `ProductsRepository` and service/controller responsibilities.
- `docs/gardening-helper-technical-requirements-and-erd.md` - defines `products` and `product_usage_rules` schema.
- `docs/001_initial_schema_gardening_helper.sql` - defines product/rule tables, enum checks, and unique active rule index.
- `docs/004_guards_and_triggers_gardening_helper.sql` - enforces product/rule/plant account consistency.
- `docs/gardening-helper-testing-and-acceptance-spec-v1.md` - defines product CRUD, duplicate rule, and account consistency tests.

## 4. Scope

### Backend scope

- Implement product repository methods.
- Implement product usage rule repository methods.
- Implement `ProductsService` or equivalent product/rules service.
- Implement controllers/routes for canonical product and rule endpoints.
- Enforce one active product+plant rule in v1.
- Enforce product/plant/account consistency.
- Archive products/rules instead of hard delete.
- Add product detail response with rules and inventory summary placeholder or zero/null summary if inventory is not yet implemented.
- Map duplicate active rule conflicts to `CONFLICT`.

### Testing scope

- Add route/service/repository tests for products and product usage rules.
- Add account A/account B and duplicate active rule tests.

## 5. Out of scope

- Inventory lots, movements, adjustments, allocation, or stock summaries beyond placeholder-compatible fields.
- Activity product usage.
- AI product ingestion.
- Frontend product pages.
- Product label/photo parsing.
- Schema redesign.

## 6. Dependencies and prerequisites

- Previous phases required: Phase 5, plus backend foundations from Phases 1-3.
- Existing modules expected: plants repository/service, account context, database transaction wrapper.
- Expected backend paths after implementation: `src/modules/products/` with repository, service, controller, validation, and types.
- Database requirements: `products`, `product_usage_rules`, `plants`, unique active product+plant index, and account consistency triggers migrated.
- Environment variables: standard backend database/auth config only.
- Test infrastructure requirements: product and plant fixtures for account A/account B.

## 7. Domain rules and invariants affected

- Products are user-owned definitions.
- Product default unit must be simple.
- Product category must be controlled.
- Products may exist without inventory.
- Archive over delete.
- Usage rules are plant-specific product instructions.
- One active product+plant rule in v1.
- Reapplication interval drives suggested tasks later.
- Quarantine period drives calendar restriction overlay later.
- Rule changes do not rewrite history.
- Account consistency is mandatory.

## 8. API contract impact

Endpoints involved:

- `GET /api/v1/products`
- `POST /api/v1/products`
- `GET /api/v1/products/:productId`
- `PATCH /api/v1/products/:productId`
- `POST /api/v1/products/:productId/archive`
- `GET /api/v1/products/:productId/rules`
- `POST /api/v1/products/:productId/rules`
- `GET /api/v1/product-rules/:ruleId`
- `PATCH /api/v1/product-rules/:ruleId`
- `POST /api/v1/product-rules/:ruleId/archive`

Request/response shapes to preserve:

- Products use `name`, `category`, `activeSubstance`, `manufacturer`, `formulation`, `defaultUnit`, and `notes`.
- Usage rules use `plantId`, `doseValue`, `doseUnit`, `dilutionText`, `applicationMethod`, `reapplicationIntervalDays`, `quarantinePeriodDays`, and `notes`.
- Product detail includes `usageRules`, `inventorySummary`, and `recentMovements` fields per contract, even if inventory data is empty before Phase 9.
- List endpoints use pagination envelope.
- Errors use canonical envelope.

Enums/status values that matter:

- `ProductCategory`: `insecticide`, `fungicide`, `pesticide`, `fertilizer`, `foliar_fertilizer`, `biostimulant`, `soil_amendment`, `other_preparation`.
- `Unit`: `ml`, `l`, `g`, `kg`.

## 9. Database impact

Tables involved:

- `products`
- `product_usage_rules`
- `plants`

Relevant indexes/constraints/triggers:

- `products_category_chk`
- `products_default_unit_chk`
- `product_usage_rules_dose_value_chk`
- `product_usage_rules_dose_unit_chk`
- `product_usage_rules_reapplication_interval_days_chk`
- `product_usage_rules_quarantine_period_days_chk`
- `uq_products_account_name_active`
- `uq_product_usage_rules_product_plant_active`
- `trg_product_usage_rules_validate_accounts`

No schema changes are expected in this phase.

## 10. Backend design notes

- Product repositories must filter by account for list/detail/update/archive.
- Usage rule create/update must validate product and plant belong to the actor account.
- Duplicate active rule should be checked service-side where possible and mapped from DB conflict where needed.
- Archived rules do not count toward active product+plant uniqueness.
- Product detail before inventory phase must still be contract-compatible.
- Services own validation and conflict decisions; repositories should not orchestrate business workflow.
- Rule changes should update the rule record only and must not rewrite activities or generated history.
- Forbidden shortcuts: product rules as free text only, skipping plant account validation, hard deleting products/rules, exposing inventory mutations in this phase.

## 11. Frontend design notes

No frontend work is expected in this phase.

## 12. Integration design notes

No external integration work is expected in this phase.

AI product ingestion is explicitly deferred to Phase 23.

## 13. Testing requirements

### Unit tests

- Product validation rejects invalid category/unit.
- Rule validation rejects non-positive dose and negative interval/quarantine values.
- Duplicate active rule policy is enforced.

### Integration/API tests

- Product create/list/get/update/archive happy paths.
- Archived products excluded by default and included with `includeArchived`.
- Product active name conflict returns `CONFLICT` where applicable.
- Usage rule create/list/get/update/archive happy paths.
- Product from account B cannot be read/updated/archived by account A.
- Rule for plant from another account is rejected.
- Rule for product from another account is rejected.
- Duplicate active product+plant rule returns `CONFLICT`.
- Archived rule allows replacement active rule.
- API envelopes and pagination shapes match contract.

### Database tests

- Unique active product+plant rule index behaves as expected.
- Product/rule account consistency trigger rejects mismatched account references.

## 14. Verification checklist

- [ ] Products API endpoints are implemented.
- [ ] Product usage rules API endpoints are implemented.
- [ ] Product/rule queries are account-scoped.
- [ ] Product category and unit enums match canonical values.
- [ ] One active product+plant rule is enforced.
- [ ] Archived rules allow replacement.
- [ ] Product detail is contract-compatible before inventory phase.
- [ ] Products/rules archive instead of hard delete.
- [ ] Backend tests/typecheck/lint/build pass where configured.

## 15. Review checklist

- [ ] Endpoint paths and DTOs match canonical contract.
- [ ] Account scoping is enforced on products and rules.
- [ ] Product/plant account consistency is checked in service layer.
- [ ] Duplicate active rule conflict is handled clearly.
- [ ] Rule history is not rewritten.
- [ ] No inventory, activity, AI, or frontend work slipped in.
- [ ] Tests cover happy path, validation, conflict, archive, and account scoping.

## 16. Suggested branch name

```text
feature/backend-products-rules
```

## 17. Expected PR summary

```md
## Summary
Implemented backend Products and Product Usage Rules APIs.

## Scope
- Added product CRUD and archive endpoints.
- Added plant-specific usage rule CRUD and archive endpoints.
- Added duplicate active rule and account consistency tests.

## Domain rules preserved
- Products and rules are account-scoped.
- One active product+plant rule is enforced.
- Product/rule history is archived, not hard-deleted.

## Tests
- <commands run and results>

## Deferred work
- Inventory, product-consuming activities, AI ingestion, and frontend product pages remain deferred.

## Review focus
- Product/rule consistency.
- Duplicate active rule conflict behavior.
- API shape and account scoping.
```

## 18. Risks and pitfalls

- Treating product usage rules as unstructured notes only.
- Forgetting rule-to-plant account validation.
- Returning inventory fields inconsistently before inventory exists.
- Hard deleting products or rules with future history.
- Creating inventory lots or movements in this phase.
- Allowing multiple active product+plant rules.

## 19. Exit criteria

- Product and usage rule APIs are implemented and tested.
- Account consistency and duplicate active rule behavior are proven.
- Product details are contract-compatible.
- Inventory and activity phases can safely reference products and rules.
