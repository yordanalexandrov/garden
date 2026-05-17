# Phase 7 Task Set - Frontend Garden Structure Pages

These files convert `docs/implementation-phases/phase-07-frontend-garden-structure-pages.md` into executable Implementation Agent tasks using `docs/TASK_TEMPLATE.md`.

Run the tasks in order on one branch:

```text
feature/frontend-garden-structure
```

## Task Order

1. `01-garden-structure-api-services-and-feature-scaffold.md`
2. `02-shared-garden-ui-components-and-form-patterns.md`
3. `03-places-list-create-edit-archive-pages.md`
4. `04-place-detail-shell-and-overview.md`
5. `05-plants-list-create-edit-archive-pages.md`
6. `06-perennials-place-pages.md`
7. `07-beds-list-detail-and-year-selector.md`
8. `08-persistent-and-yearly-bed-planting-flows.md`
9. `09-phase-07-frontend-regression-and-boundary-tests.md`
10. `10-phase-07-verification-and-pr-readiness.md`

## Phase Boundary

Implement only the frontend garden structure pages:

- Angular routes/pages for places, place detail, plants, perennials, beds, persistent bed plants, and yearly bed plantings.
- Typed frontend API services that consume Phase 5 and Phase 6 canonical backend endpoints through the existing `/api/v1` API client.
- Reactive Forms for create/edit flows.
- API error display for backend validation and business-rule errors.
- Archive confirmation dialogs; no hard delete UI.
- Year selector for bed yearly plantings.
- Shared garden selectors/components that are needed by this phase and useful for later phases.
- Component/API-service/static tests for key forms, API paths, boundary rules, and mobile layout smoke where practical.

Do not implement:

- Backend endpoints or schema changes, except tiny bug fixes in already implemented Phase 5/6 APIs if a blocking mismatch is documented.
- Create activity flow, products, inventory, problems/photos, tasks/calendar/dashboard behavior, weather forecast, AI, push, storage, or MCP tools.
- Frontend-owned business truth.
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
- `docs/implementation-phases/phase-05-backend-places-and-plants-api.md`
- `docs/implementation-phases/phase-06-backend-growing-structure-api.md`
- `docs/implementation-phases/phase-07-frontend-garden-structure-pages.md`
- `docs/TASK_TEMPLATE.md`
- Existing frontend app shell, routing, API client, auth/session, API error mapper, shared UI, and test helper files touched by the task.

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
- no Phase 7 UI sends trusted `accountId`

If a command is unavailable or fails due to pre-existing setup, report the exact command, exit state, and reason. Never claim checks passed unless they were run.

