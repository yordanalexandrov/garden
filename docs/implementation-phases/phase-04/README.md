# Phase 4 Task Set - Frontend Project Foundation

These files convert `docs/implementation-phases/phase-04-frontend-project-foundation.md` into executable Implementation Agent tasks using `docs/TASK_TEMPLATE.md`.

Run the tasks in order on one branch:

```text
feature/frontend-foundation
```

## Task Order

1. `01-frontend-workspace-and-tooling.md`
2. `02-angular-material-and-pwa-baseline.md`
3. `03-app-shell-layout-and-navigation.md`
4. `04-route-placeholders-and-initialization.md`
5. `05-supabase-auth-session-foundation.md`
6. `06-typed-api-client-interceptors-and-errors.md`
7. `07-phase-04-verification-and-pr-readiness.md`

## Phase Boundary

Implement only the frontend project foundation:

- Angular standalone frontend workspace/package.
- Angular Material baseline.
- PWA/service worker baseline without offline write sync.
- Responsive application shell with top app bar, desktop navigation, mobile navigation behavior, router outlet, and snackbar/error display support.
- Route structure with placeholder pages only.
- Supabase Auth session bootstrap for login/session token handling only.
- Typed API client foundation targeting `/api/v1`.
- Auth token interceptor for Fastify API calls.
- Canonical API error mapper and global error display.
- Frontend scripts for typecheck, lint, test, build, and static boundary checks where tooling exists.

Do not implement:

- domain feature pages beyond placeholders
- business forms or domain workflows
- backend endpoints except narrowly scoped CORS/dev compatibility if absolutely needed
- direct Supabase table access
- direct Supabase Storage access
- push notification registration
- AI, weather, product, inventory, activity, task, problem, photo, or calendar workflows
- frontend-owned business truth
- frontend exposure of backend-only secrets

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
- `docs/env.example`
- `docs/implementation-phases/phase-04-frontend-project-foundation.md`
- `docs/TASK_TEMPLATE.md`
- existing backend health/config files if a frontend smoke check or dev proxy touches the backend

## Common Verification

At the end of the phase, from the frontend package root, run:

```bash
npm run typecheck
npm run lint
npm test
npm run build
```

Also run the frontend boundary/static checks added during the phase. They must verify at minimum:

- no direct Supabase application-table calls in frontend code
- no direct Supabase Storage business calls in frontend code
- no backend-only secrets referenced in frontend code, environment files, build config, or tests
- raw `HttpClient` usage remains in core API/interceptor infrastructure, not feature placeholders or shell components

If a command is unavailable or fails due to pre-existing setup, report the exact command, exit state, and reason. Never claim checks passed unless they were run.
