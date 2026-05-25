# Phase 14 Task Set - Frontend Activities and Create Activity Flow

These files convert `docs/implementation-phases/phase-14-frontend-activities-and-create-activity-flow.md` into executable Implementation Agent tasks using `docs/TASK_TEMPLATE.md`.

Run the tasks in order on one branch:

```text
feature/frontend-create-activity
```

## Task Order

1. `01-activities-api-services-and-feature-scaffold.md`
2. `02-activities-list-and-detail-pages.md`
3. `03-bulk-target-selector.md`
4. `04-product-usage-form-array.md`
5. `05-create-activity-form-and-review-flow.md`
6. `06-create-activity-submit-errors-and-side-effect-summary.md`
7. `07-phase-14-frontend-regression-boundary-error-tests.md`
8. `08-phase-14-verification-and-pr-readiness.md`

## Phase Boundary

Implement only the frontend activities and create activity flow:

- Angular routes/pages for `/activities`, `/activities/new`, and `/activities/:activityId`.
- Typed frontend Activities API service that consumes Phase 12 canonical backend endpoints through the existing `/api/v1` API client.
- Activities list filters and activity detail display.
- Reusable `app-bulk-target-selector` that submits canonical user intent, not frontend-resolved business truth.
- Reusable `app-product-usage-form-array` for optional product usage rows.
- Create activity workflow with place, type, target scope, target selection, notes, optional product usage, review, submit, error display, and success side-effect display.
- Frontend/component/API-service/static tests for form behavior, selector behavior, canonical request shape, backend errors, warnings, side-effect summaries, mobile smoke where practical, and frontend/backend boundary rules.

Do not implement:

- Backend endpoints, schema changes, transaction logic, target resolver behavior, inventory allocation, quarantine generation, or suggested task generation, except tiny compatibility fixes in Phase 12 APIs once implemented, if a blocking mismatch is documented.
- Activity correction UI, weather rain prompts, task confirmation UI, AI suggestions, problems/photos, push, storage, provider, deployment, or MCP tools.
- Frontend-owned target resolution, inventory allocation, quarantine/task creation, or trusted business side-effect summaries.
- Direct Supabase application-table or storage access.
- Frontend-submitted trusted `accountId`.

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
- `docs/implementation-phases/phase-07-frontend-garden-structure-pages.md`
- `docs/implementation-phases/phase-10-frontend-products-and-inventory-pages.md`
- `docs/implementation-phases/phase-12-backend-activity-transaction-flow.md`
- `docs/implementation-phases/phase-14-frontend-activities-and-create-activity-flow.md`
- `docs/TASK_TEMPLATE.md`
- Existing frontend app shell, routing, API client, auth/session, API error mapper, shared UI/form controls, selector components, and test helper files touched by the task.

## Common Verification

At the end of the phase, from the frontend package root, run:

```bash
npm run typecheck
npm run lint
npm test
npm run build
npm run check:frontend-boundaries
```

The boundary check must verify at minimum:

- no direct Supabase application-table access in frontend code
- no direct Supabase Storage business calls in frontend code
- no backend-only secrets referenced in frontend code, environment files, build config, or tests
- no feature component bypasses typed API services with raw `HttpClient`
- no Phase 14 UI sends trusted `accountId`
- no frontend inventory allocation, FEFO allocation, target-resolution truth, quarantine generation, or suggested-task generation exists
- create activity UI displays backend-returned warnings and side-effect arrays instead of synthesizing business truth

If a command is unavailable or fails due to pre-existing setup, report the exact command, exit state, and reason. Never claim checks passed unless they were run.
