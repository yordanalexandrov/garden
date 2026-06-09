# Phase 23 Task Set - Backend AI Suggestion Workflows

These files convert `docs/implementation-phases/phase-23-backend-ai-suggestion-workflows.md` into executable Implementation Agent tasks using `docs/TASK_TEMPLATE.md`.

Run the tasks in order on one branch:

```text
feature/backend-ai-suggestions
```

## Task Order

1. `01-ai-module-contracts-validation-and-route-wiring.md`
2. `02-ai-port-config-and-deterministic-adapter.md`
3. `03-ai-session-suggestion-repository-and-persistence.md`
4. `04-ai-suggestion-generation-services-and-routes.md`
5. `05-ai-suggestion-accept-reject-workflows.md`
6. `06-ai-account-audit-rollback-and-contract-tests.md`
7. `07-phase-23-verification-and-pr-readiness.md`

## Phase Boundary

Implement only the backend AI suggestion workflow:

- `AiPort` and provider adapter boundary.
- Deterministic test/dev AI adapter behind the same port.
- Backend-only AI provider configuration for `AI_PROVIDER`, `AI_API_KEY`, and `AI_MODEL`.
- Account-scoped AI session and suggestion persistence.
- Canonical AI endpoints:
  - `POST /api/v1/ai/product-ingestion`
  - `POST /api/v1/ai/bed-planning`
  - `POST /api/v1/ai/problem-assist`
  - `POST /api/v1/ai/suggestions/:suggestionId/accept`
  - `POST /api/v1/ai/suggestions/:suggestionId/reject`
- Explicit suggestion acceptance that validates the accepted payload through normal backend rules before creating business records.
- Transactional accept workflow that marks the suggestion and creates/updates business records together.
- Rejection workflow that records rejected state and creates no business records.
- Tests for provider boundary, session/suggestion persistence, API response shapes, cross-account rejection, invalid payload rejection, rollback, and no direct business writes before acceptance.

Do not implement:

- Frontend AI pages.
- Push notifications.
- MCP tools or privileged MCP bypasses.
- Direct AI-to-database mutation from adapters.
- Direct frontend calls to an AI provider or application tables.
- Auto-saving AI output as products, rules, tasks, inventory changes, problem diagnosis, or plantings.
- AI-created planned tasks or reminders.
- Provider-specific production adapter beyond the assigned/configured boundary; document status honestly if no production provider is selected.
- Schema redesign or new migrations unless a blocking mismatch is documented and a forward migration is the smallest safe fix.

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
- `docs/gardening-helper-mcp-server-design-v1.md`
- `docs/001_initial_schema_gardening_helper.sql`
- `docs/004_guards_and_triggers_gardening_helper.sql`
- `docs/env.example`
- `docs/implementation-phases/phase-08-backend-products-and-usage-rules-api.md`
- `docs/implementation-phases/phase-15-backend-problems-and-observations-api.md`
- `docs/implementation-phases/phase-18-backend-task-lifecycle-and-reminders.md`
- `docs/implementation-phases/phase-23-backend-ai-suggestion-workflows.md`
- `docs/TASK_TEMPLATE.md`
- Existing backend app, auth, config, db, transaction, validation, error, products/rules, plants, beds, problems, tasks, audit, route, repository, integration adapter, and test helper files touched by the task.

## Common Verification

At the end of the phase, from the backend package root, run:

```bash
npm run typecheck
npm run lint
npm test
npm run test:db
npm run build
```

Also run any backend boundary/static checks configured by the project. They must verify at minimum:

- AI provider calls are confined to adapters behind `AiPort`.
- AI output creates only sessions/suggestions until explicit backend acceptance.
- Accepted payloads pass normal backend validation and account scoping.
- Accept workflow is transaction-wrapped and rolls back suggestion state on business-record failure.
- Rejected suggestions create no business records.
- Problem assist is not represented as diagnosis/business truth.
- No frontend AI provider calls, direct table access, service role key exposure, or MCP bypass were added.

If route or repository tests require a database, run them against a dedicated local/private PostgreSQL-compatible test database using `TEST_DATABASE_URL` or the existing safe test database configuration. Automated tests must use deterministic local/test AI adapters and must not require real AI provider credentials or network access. If a command is unavailable or fails due to pre-existing setup, report the exact command, exit state, and reason. Never claim checks passed unless they were run.
