# Phase 3 Task Set - Auth and Account Boundary

These files convert `docs/implementation-phases/phase-03-auth-and-account-boundary.md` into executable Implementation Agent tasks using `docs/TASK_TEMPLATE.md`.

Run the tasks in order on one branch:

```text
feature/auth-account-boundary
```

## Task Order

1. `01-auth-types-and-port-contract.md`
2. `02-supabase-auth-adapter-boundary.md`
3. `03-accounts-repository-and-account-lookup.md`
4. `04-fastify-auth-plugin-and-protected-route-context.md`
5. `05-authenticated-route-test-helpers-and-fixtures.md`
6. `06-auth-account-boundary-tests-and-static-checks.md`
7. `07-phase-03-verification-and-pr-readiness.md`

## Phase Boundary

Implement only the backend authentication and account boundary foundation:

- backend `AuthPort` contract and authenticated actor/account context types
- Supabase Auth JWT adapter boundary behind `AuthPort`
- deterministic test/dev auth adapter behind the same port
- `AccountsRepository` using the existing `accounts` table
- documented account lookup/creation policy needed by auth
- Fastify auth plugin/hook for protected business routes
- route/test helpers for unauthenticated, invalid-token, account A, and account B requests
- auth/account boundary tests and static secret-boundary checks

Do not implement:

- frontend login UI
- frontend direct access to application tables
- domain CRUD endpoints
- role/permission system beyond v1 account scoping
- Supabase Storage, Open-Meteo, AI, Push, or MCP tools
- admin/user-management features
- schema changes unless a blocking auth mapping mismatch is documented and fixed with a new forward migration

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
- `docs/gardening-helper-technical-requirements-and-erd.md`
- `docs/env.example`
- `docs/001_initial_schema_gardening_helper.sql`
- `docs/implementation-phases/phase-03-auth-and-account-boundary.md`
- `docs/TASK_TEMPLATE.md`

## Common Verification

At the end of the phase, from the backend package root, run:

```bash
npm run typecheck
npm run lint
npm test
npm run build
```

Run any database-backed auth/account tests against a dedicated local/test PostgreSQL-compatible database. Never run auth/account tests that mutate accounts against production or shared developer databases.

If a command is unavailable or fails due to pre-existing setup, report the exact command, exit state, and reason. Never claim checks passed unless they were run.
