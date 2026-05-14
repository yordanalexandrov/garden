# Phase 1 Task Set - Backend Project Foundation

These files convert `docs/implementation-phases/phase-01-backend-project-foundation.md` into executable Implementation Agent tasks using `docs/TASK_TEMPLATE.md`.

Run the tasks in order on one branch:

```text
feature/backend-foundation
```

## Task Order

1. `01-backend-package-and-tooling.md`
2. `02-fastify-app-bootstrap.md`
3. `03-api-envelopes-and-error-model.md`
4. `04-validation-foundation.md`
5. `05-config-and-logger.md`
6. `06-health-route.md`
7. `07-foundation-tests-and-pr-readiness.md`

## Phase Boundary

Implement only the backend foundation:

- Fastify + TypeScript backend skeleton.
- `/api/v1` route registration.
- Canonical success and error envelopes.
- Centralized error model and validation setup.
- Config and logger foundation.
- Unauthenticated `GET /api/v1/health`.
- Baseline backend tests and verification commands.

Do not implement:

- Domain CRUD.
- Database client, migrations, repositories, or transactions.
- Auth/JWT/account context.
- Frontend project setup.
- Supabase Storage, Open-Meteo, AI, Push, or provider adapters.
- Activity, inventory, task, target, problem, weather, AI, or push workflows.

## Common Required Documents

Every task in this folder requires the Implementation Agent to read:

- `AGENTS.md`
- `docs/gardening-helper-ai-implementation-handoff-readme-v1.md`
- `docs/gardening-helper-implementation-instructions-for-ai-v1.md`
- `docs/gardening-helper-domain-rules-and-invariants-v1.md`
- `docs/gardening-helper-canonical-api-contract-v1.md`
- `docs/gardening-helper-testing-and-acceptance-spec-v1.md`
- `docs/gardening-helper-implementation-agent-instructions.md`
- `docs/gardening-helper-backend-application-design-pack-v1.md`
- `docs/env.example`
- `docs/implementation-phases/phase-01-backend-project-foundation.md`
- `docs/TASK_TEMPLATE.md`

## Common Verification

At the end of the phase, from the backend package root, run:

```bash
npm run typecheck
npm run lint
npm test
npm run build
```

If a command is unavailable or fails due to pre-existing setup, report the exact command, exit state, and reason. Never claim checks passed unless they were run.
