# Phase 17 Task Set - Frontend Problems and Photos Flow

These files convert `docs/implementation-phases/phase-17-frontend-problems-and-photos-flow.md` into executable Implementation Agent tasks using `docs/TASK_TEMPLATE.md`.

Run the tasks in order on one branch:

```text
feature/frontend-problems-photos
```

## Task Order

1. `01-problems-api-services-and-feature-scaffold.md`
2. `02-problems-list-and-detail-pages.md`
3. `03-create-problem-observation-form-and-target-selection.md`
4. `04-problem-photo-uploader.md`
5. `05-problem-submit-upload-errors-and-detail-photo-display.md`
6. `06-phase-17-frontend-regression-boundary-error-tests.md`
7. `07-phase-17-verification-and-pr-readiness.md`

## Phase Boundary

Implement only the frontend problems, observations, and problem-photo flow:

- Angular routes/pages for `/problems`, `/problems/new`, and `/problems/:problemId`.
- Typed frontend Problems API service consuming Phase 15 metadata endpoints and Phase 16 photo upload endpoint through the existing `/api/v1` API client.
- Problems list filters, problem/observation detail display, and backend-provided photo URL rendering.
- Reactive Forms create flow for problem and observation metadata.
- Target selection and visible target summary before save.
- `app-problem-photo-uploader` visible only for `type = problem`.
- Problem save without photo, optional upload after or during save according to backend-supported flow, upload progress/errors where available, and clear API error display.
- Frontend/component/API-service/static tests for problem vs observation behavior, photo boundary, request shape, error handling, and no direct storage access.

Do not implement:

- Backend problem/photo APIs.
- AI problem assist.
- Activity correction UI.
- Observation photos.
- Direct Supabase Storage access or constructed bucket URLs.
- Required photo-before-save behavior.
- Image resizing beyond preview/client validation unless explicitly assigned.
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
- `docs/implementation-phases/phase-15-backend-problems-and-observations-api.md`
- `docs/implementation-phases/phase-16-backend-problem-photo-storage.md`
- `docs/implementation-phases/phase-17-frontend-problems-and-photos-flow.md`
- `docs/TASK_TEMPLATE.md`
- Existing frontend app shell, routing, API client, auth/session, API error mapper, shared controls/selectors, file input helpers, and test helper files touched by the task.

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
- no Phase 17 UI sends trusted `accountId`
- no observation photo upload path exists
- photo display uses backend-provided URLs only

If a command is unavailable or fails due to pre-existing setup, report the exact command, exit state, and reason. Never claim checks passed unless they were run.
