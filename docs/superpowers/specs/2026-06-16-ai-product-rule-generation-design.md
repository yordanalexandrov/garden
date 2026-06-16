# Design: AI-generated / refreshed product usage rules for existing products

Date: 2026-06-16
Status: Approved

## Problem

Two related gaps in the AI product flows:

1. **Accept gap (deferred earlier).** Accepting an AI `product_rule` suggestion
   requires `productId` + `plantId` UUIDs, but the AI suggestion only carries a
   free-text `plantName`. Today the only way to accept is to hand-edit the JSON.
2. **No way to use AI for existing products.** Users want to ask the AI to
   add/refresh usage rules for a product they already have, targeting the plants
   they already have — with enough context that no manual UUID entry is needed.

## Goals

- Let the user generate/refresh product usage rules with AI for an existing
  product, scoped to their own plants, from the product detail page.
- Pass real account context (product, its existing rules, the user's plants) to
  the model so suggestions resolve to concrete rows without manual JSON editing.
- Support both **create** (new rule for a plant) and **update / refresh**
  (re-derive values for an existing rule).
- Close the generic `product_rule` accept gap so the product-ingestion flow also
  accepts without hand-editing UUIDs.

## Non-goals

- Changing the `dose_unit` DB enum (`ml/l/g/kg`).
- Web search for this flow.
- Mixed cross-place targeting or all-plants rules.

## Key facts (verified)

- `ai_suggestions.suggestion_type` already allows `product_rule` — reused.
- `ai_sessions.kind` does **not** allow this mode → migration adds
  `product_rule_generation`. `ai_sessions.related_entity_type/id` link the
  session to the product.
- No unique `(product_id, plant_id)` constraint → refresh must target a specific
  `ruleId`, not the pair.
- `product_usage_rules.dose_unit` CHECK = `ml/l/g/kg` only → this flow constrains
  `doseUnit` to those four so accept never fails on unit.
- `ProductsService` already has `updateProductUsageRule` and rule listing.
- `acceptSuggestion` already runs in a transaction and writes an audit entry.

## Flow (new feature)

1. Product detail page → button "Генерирай rules с ИИ" → opens a modal dialog.
2. Dialog calls `POST /api/v1/ai/product-rule-generation` with `{ productId }`.
3. Backend loads context: product fields; existing non-archived rules for the
   product (id, plantId, plant name, dose fields); all non-archived account
   plants (id, commonName, variety, plantCategory).
4. `AiPort.generateProductRules(input)` → array of rule proposals. Each:
   `plantId` (from provided set), `operation` (`create`|`update`), `ruleId`
   (required when `update`, from provided rules), `doseValue`, `doseUnit`
   (`ml/l/g/kg`), `dilutionText?`, `applicationMethod?`,
   `reapplicationIntervalDays?`, `quarantinePeriodDays?`, `notes?` (Bulgarian).
   Plus top-level `warnings` and per-item rationale folded into warnings.
5. Backend validation + enrichment:
   - `plantId` must belong to the account, else drop the proposal + warning.
   - `operation==='update'`: `ruleId` must be a non-archived rule of this product
     whose `plant_id` matches `plantId`; otherwise downgrade to `create` with a
     warning (or drop if ambiguous).
   - Inject `productId`; also inject display-only `plantName` + `operation`.
   - Honesty: if `doseValue` is missing/non-positive, keep the suggestion for
     visibility but add a warning (accept will require an edit).
6. Persist session (`kind='product_rule_generation'`, `input_mode='name'`,
   `related_entity_type='product'`, `related_entity_id=productId`) and each
   proposal as a `product_rule` suggestion with the enriched payload.
7. Dialog renders the suggestions with the existing `AiSuggestionCard`
   (accept/reject reuse the existing endpoints).

## Accept changes (shared by both flows)

- `acceptedProductRulePayloadSchema` gains optional `ruleId: uuid`.
- In `createBusinessRecordsForSuggestion` `product_rule` branch:
  - `ruleId` present → `productsService.updateProductUsageRule(actor, ruleId, patch)`
    → `updatedEntities: [{ entityType: 'product_rule', entityId: ruleId }]`.
  - else → create as today → `createdEntities`.
- Account scoping/ownership enforced by the products service (rule must belong to
  the actor's account; plant likewise).

## Product-ingestion accept fix (the "previous thing")

Frontend-only resolution so the existing product-ingestion flow accepts without
hand-edited UUIDs:

- In `product-ingestion-page`, for a `product_rule` suggestion render two
  `mat-select`s:
  - **Product** — defaults to the product created/accepted earlier in the same
    session (from the accepted `product` suggestion's `createdEntities`);
    otherwise `ProductsApiService.list()`.
  - **Plant** — `PlantsApiService.list()`, pre-selected by best match against the
    AI's `plantName`.
- On accept, merge `{ productId, plantId }` into the payload before calling
  `acceptSuggestion`. The JSON modal stays as a manual fallback.

## Components

### Backend
- `docs/007_ai_product_rule_generation.sql` — extend `ai_sessions_kind_chk`.
- `integrations/ai/ai.types.ts` — `GenerateProductRulesInput`,
  `GenerateProductRulesResult`; extend `NormalizedProductRulePayload` with
  optional `plantId`, `ruleId`, `operation`.
- `integrations/ai/ai.port.ts` — `generateProductRules`.
- `integrations/ai/openai-ai.adapter.ts` — strict JSON schema (rules array),
  `doseUnit` restricted to `ml/l/g/kg`, honesty rules, Bulgarian free-text.
- `integrations/ai/test-ai.adapter.ts` — deterministic stub.
- `modules/ai/ai.service.ts` — `generateProductRules(actor, productId)`;
  extend accept schema + update branch.
- `modules/ai/ai.routes.ts`, `ai.validation.ts`, `ai.dto.ts` — new endpoint.

### Frontend
- `features/ai/data-access/ai-api.service.ts` — `productRuleGeneration(productId)`.
- `features/ai/components/ai-product-rules-dialog/` — modal: calls API, renders
  `AiSuggestionCard` list, wires accept/reject.
- `features/products/.../product-detail-page` — button opens the dialog.
- `features/ai/pages/product-ingestion-page` — product/plant selects + id merge
  on accept.
- `AiSuggestionCard` — show `plantName` + "Ново"/"Опресняване"; UUIDs stay in the
  JSON modal.

## Domain compliance

- AI output is not business truth until accepted; suggestions are stored and
  accept is transactional and audited.
- Account scoping: every AI-returned `plantId`/`ruleId` is validated against the
  account; services remain account-scoped.
- Targets resolve to concrete rows (`plantId` from account plants, `ruleId` from
  the product's rules).
- The model never supplies a trusted free id — only a choice from a closed,
  server-validated set.

## Error handling

- AI provider failure → `EXTERNAL_SERVICE_ERROR` (existing mapping).
- Product not found / not in account → `NOT_FOUND`.
- No plants in account → empty suggestions + a warning.

## Testing (per CLAUDE.md)

- Backend service: context loading; id validation (drops invalid
  `plantId`/`ruleId` with warnings); account scoping; persistence
  (`kind`, `related_entity`, suggestion payloads).
- Accept: update branch (`ruleId` → `updateProductUsageRule`, `updatedEntities`)
  and create branch; transactional behavior preserved.
- Validation: accepted schema accepts optional `ruleId`, rejects malformed.
- Test adapter deterministic output.
- Frontend: dialog opens/renders/wires accept-reject; product-ingestion select
  resolution injects ids on accept.
