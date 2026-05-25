# Phase 10 Task Set - Frontend Products and Inventory Pages

These files convert `docs/implementation-phases/phase-10-frontend-products-and-inventory-pages.md` into executable Implementation Agent tasks using `docs/TASK_TEMPLATE.md`.

Run the tasks in order on one branch:

```text
feature/frontend-products-inventory
```

## Task Order

1. `01-product-inventory-api-services-and-feature-scaffold.md`
2. `02-product-list-filters-create-edit-archive-forms.md`
3. `03-product-detail-shell-rules-inventory-lots-movements.md`
4. `04-usage-rule-create-edit-archive-flows.md`
5. `05-inventory-overview-and-product-inventory-detail-pages.md`
6. `06-add-lot-and-manual-adjustment-forms.md`
7. `07-phase-10-frontend-regression-boundary-error-tests.md`
8. `08-phase-10-verification-and-pr-readiness.md`

## Phase Boundary

Implement only the frontend products and inventory pages:

- Angular routes/pages for products, product rules, inventory overview, product inventory detail, inventory lot creation, and manual adjustment.
- Typed frontend API services that consume Phase 8 and Phase 9 canonical backend endpoints through the existing `/api/v1` API client.
- Reactive Forms for product, usage rule, inventory lot, and manual adjustment create/edit flows.
- API error display for backend validation, duplicate active product+plant rule conflicts, and negative-stock or shortage errors.
- Product detail views with metadata, usage rules, inventory summary, lots, and movement history.
- Inventory overview and product inventory detail views that display backend-returned balances and movement history.
- Frontend/component/API-service/static tests for key forms, API paths, boundary rules, error display, and movement-history refresh behavior.

Do not implement:

- Backend endpoints, schema changes, or inventory ledger behavior, except tiny compatibility fixes in already implemented Phase 8/9 APIs if a blocking mismatch is documented.
- Activity product usage UI, activity creation, target resolution, FEFO allocation in frontend, AI product ingestion, weather, push, storage, provider, deployment, or MCP tools.
- Frontend-owned business truth.
- Direct Supabase application-table or storage access.
- Frontend-submitted trusted `accountId`.
- Direct stock mutation or local stock recalculation outside backend API responses.

## Common Required Documents

Every task in this folder requires the Implementation Agent to read:

- `AGENTS.md`
- `docs/gardening-helper-ai-implementation-handoff-readme-v1.md`
- `docs/gardening-helper-implementation-instructions-for-ai-v1.md`
- `docs/gardening-helper-domain-rules-and-invariants-v1.md`
- `docs/gardening-helper-canonical-api-contract-v1.md`
- `docs/gardening-helper-testing-and-acceptance-spec-v1.md`
- `docs/gardening-helper-implementation-agent-instructions.md`
- `docs/gardening-helper-frontend-technical-spec-v1.md`
- `docs/implementation-phases/phase-04-frontend-project-foundation.md`
- `docs/implementation-phases/phase-08-backend-products-and-usage-rules-api.md`
- `docs/implementation-phases/phase-09-backend-inventory-ledger-api.md`
- `docs/implementation-phases/phase-10-frontend-products-and-inventory-pages.md`
- `docs/TASK_TEMPLATE.md`
- Existing frontend app shell, routing, API client, auth/session, API error mapper, shared form controls, selector components, and test helper files touched by the task.

## Common Verification

At the end of the phase, from the frontend package root, run:

```bash
npm run typecheck
npm run lint
npm test
npm run build
```

Also run any frontend boundary/static checks configured by the project. They must verify at minimum:

- no direct Supabase application-table access in frontend code
- no direct Supabase Storage business calls in frontend code
- no backend-only secrets referenced in frontend code, environment files, build config, or tests
- no feature component bypasses typed API services with raw `HttpClient`
- no Phase 10 UI sends trusted `accountId`
- no frontend FEFO allocation, inventory consumption allocation, or direct stock mutation logic exists

If a command is unavailable or fails due to pre-existing setup, report the exact command, exit state, and reason. Never claim checks passed unless they were run.
