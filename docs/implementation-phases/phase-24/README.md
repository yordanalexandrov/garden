# Phase 24 Task Set - Frontend AI Assistant Pages

These files convert `docs/implementation-phases/phase-24-frontend-ai-assistant-pages.md` into executable Implementation Agent tasks.

Run the tasks in order on one branch:

```text
feature/frontend-ai-assistant
```

## Task Order

1. `01-ai-api-services-and-feature-scaffold.md`
2. `02-shared-ai-suggestion-card-and-review-state.md`
3. `03-product-ingestion-page.md`
4. `04-bed-planning-page.md`
5. `05-problem-assist-page.md`
6. `06-phase-24-frontend-regression-boundary-error-tests.md`
7. `07-phase-24-verification-and-pr-readiness.md`

## Phase Boundary

Implement only the frontend AI Assistant experience:

- AI Assistant route shell and navigation entry points for `/ai`, `/ai/product-ingestion`, `/ai/bed-planning`, and `/ai/problem-assist`.
- Typed frontend API services for the Phase 23 backend AI endpoints through the existing `/api/v1` API client.
- Reactive Forms for product ingestion, bed planning, problem assist, editable suggestion payloads, and optional accept `editedPayload`.
- Angular Material pages/components that present AI output as reviewable suggestions, not saved records.
- Reusable `app-ai-suggestion-card` UI for explicit suggestion status, warnings/uncertainty, editable structured payloads, accept/reject actions, and created/updated entity links after backend acceptance.
- Product ingestion, bed planning, and problem assist pages that display backend validation/provider errors without losing user input or suggestion review state.
- Frontend route/page/component/API-service/static tests for canonical endpoint usage, suggestion-only state, accept/reject behavior, backend error display, and provider/database/security boundaries.

Do not implement:

- Backend AI workflows, `AiPort`, provider adapters, deterministic AI adapters, database migrations, repositories, services, or transaction logic.
- Push notifications, worker/scheduler behavior, reminder generation, weather logic, MCP tools, deployment changes, or provider configuration.
- Direct AI/model provider calls from Angular.
- Direct Supabase application-table, PostgREST, Storage, or SQL access from Angular.
- Frontend-created products, product rules, tasks, inventory movements, plantings, problem records, diagnoses, or other business truth.
- AI-created planned tasks, inventory changes, bed planting mutations, or problem-category updates without explicit backend acceptance.
- Frontend-submitted trusted `accountId` or frontend-side account authorization decisions.

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
- `docs/implementation-phases/phase-10-frontend-products-and-inventory-pages.md`
- `docs/implementation-phases/phase-15-backend-problems-and-observations-api.md`
- `docs/implementation-phases/phase-17-frontend-problems-and-photos-flow.md`
- `docs/implementation-phases/phase-23-backend-ai-suggestion-workflows.md`
- `docs/implementation-phases/phase-24-frontend-ai-assistant-pages.md`
- `docs/TASK_TEMPLATE.md`
- Existing frontend app shell, routing, typed API client, auth/session, API error mapper, shared form controls, product/bed/problem selectors and links, status chips, and test helper files touched by the task.

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

- no direct AI/model provider calls in frontend code
- no provider URLs or AI provider SDK imports in frontend code
- no `AI_API_KEY`, `AI_MODEL`, service role key, or backend-only provider secret in frontend code, environment files, build config, or tests
- no direct Supabase application-table, PostgREST, SQL, or Storage business access from frontend code
- no feature component bypasses typed API services with raw `HttpClient`
- no Phase 24 UI sends trusted `accountId`
- AI suggestions are visually and behaviorally distinct from accepted business records
- accept/reject actions call backend AI endpoints only
- problem assist UI does not present autonomous diagnosis wording
- bed planning UI does not mutate plantings or tasks

If a command is unavailable or fails due to pre-existing setup, report the exact command, exit state, and reason. Never claim checks passed unless they were run.
