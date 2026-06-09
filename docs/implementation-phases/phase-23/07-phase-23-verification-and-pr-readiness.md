# Implementation Task - Phase 23 Step 7: Phase 23 Verification and PR Readiness

## Role

You are the **Implementation Agent**.

Use `AGENTS.md`, `docs/gardening-helper-implementation-agent-instructions.md`, and every Phase 23 task file before finalizing the implementation PR.

---

# Task

## Goal

Implement:

```text
Verify Phase 23 end to end, update implementation status, and prepare a focused PR for backend AI suggestion workflows.
```

## Branch

Use branch:

```text
feature/backend-ai-suggestions
```

---

# Scope

Implement only:

- [ ] Review the full Phase 23 diff for accidental frontend, push, MCP, schema, provider-network, direct database, or unrelated changes.
- [ ] Verify all Phase 23 endpoints match the canonical API contract.
- [ ] Verify AI output is persisted only as reviewable sessions/suggestions before acceptance.
- [ ] Verify accept workflow is explicit, account-scoped, validated, audited where available, and transaction-wrapped.
- [ ] Verify reject workflow is explicit, account-scoped, and side-effect free.
- [ ] Verify deterministic adapter is used for tests and real provider credentials/network access are not required.
- [ ] Verify provider configuration is backend-only and secrets are not exposed to frontend/public config/logs/build output.
- [ ] Verify problem assist wording/payload does not present diagnosis as fact.
- [ ] Verify no planned tasks, reminders, inventory movements, activities, plantings, or problem diagnosis records are created by AI unless explicitly accepted through a source-of-truth-defined backend workflow.
- [ ] Run required checks and record exact commands/results.
- [ ] Update `docs/gardening-helper-implementation-status-handoff.md` to mark Phase 23 implemented only after code and checks are complete.
- [ ] Commit focused changes and open a PR.

---

# Out of Scope

Do not implement:

- [ ] New Phase 24 frontend AI pages.
- [ ] Push notifications or workers.
- [ ] MCP tools.
- [ ] New feature scope beyond completing/fixing Phase 23.
- [ ] Real provider rollout if no production provider was selected.
- [ ] Schema redesign.

---

# Required Documents

Read before coding:

- [ ] `AGENTS.md`
- [ ] `docs/gardening-helper-implementation-agent-instructions.md`
- [ ] `docs/gardening-helper-ai-implementation-handoff-readme-v1.md`
- [ ] `docs/gardening-helper-implementation-instructions-for-ai-v1.md`
- [ ] `docs/gardening-helper-domain-rules-and-invariants-v1.md`
- [ ] `docs/gardening-helper-canonical-api-contract-v1.md`
- [ ] `docs/gardening-helper-testing-and-acceptance-spec-v1.md`
- [ ] `docs/gardening-helper-backend-application-design-pack-v1.md`
- [ ] `docs/gardening-helper-mcp-server-design-v1.md`
- [ ] `docs/implementation-phases/phase-23-backend-ai-suggestion-workflows.md`
- [ ] every file in `docs/implementation-phases/phase-23/`
- [ ] `docs/gardening-helper-implementation-status-handoff.md`
- [ ] Existing backend app, AI, products/rules, problems, tasks, inventory, audit, config, route, integration, and test files changed in this phase.

---

# Domain Rules Affected

This task touches:

- [ ] account scoping
- [ ] product usage rules
- [ ] tasks/reminders
- [ ] problems/photos
- [ ] AI suggestions
- [ ] API contract
- [ ] auth/session boundary
- [ ] provider adapter boundary
- [ ] deployment/security docs
- [ ] MCP tools / agent interface

Important rules to preserve:

```text
AI is assistive only.
AI output is reviewable and not business truth until accepted.
AI acceptance is explicit, account-scoped, validated, auditable where available, and transaction-safe.
AI uncertainty/warnings remain visible where provided.
Problem assistance is not diagnosis.
MCP tools are not a privileged bypass channel.
No provider keys in frontend/public config/logs/build output.
```

---

# MCP Impact

This task:

- [ ] changes backend behavior used by future MCP tools

MCP tools affected:

```text
Future AI MCP tools only. No MCP tool implementation is part of Phase 23.
```

Required MCP documentation updates:

```text
None unless the final backend behavior diverges from `docs/gardening-helper-mcp-server-design-v1.md`; avoid divergence unless a higher-priority source requires it.
```

---

# Required Implementation Details

Implement:

- [ ] verification
- [ ] docs/update notes
- [ ] focused fixes only if verification finds Phase 23 defects
- [ ] PR preparation

---

# Required Infrastructure/Security Boundaries

Preserve these rules:

- [ ] no direct frontend access to application tables
- [ ] no bypass of the Fastify API for application data
- [ ] no business logic in Angular components
- [ ] no business side-effect orchestration in database triggers
- [ ] no Supabase service role key in frontend code/env/build output/logs
- [ ] no direct Supabase SDK usage inside domain services except behind adapters
- [ ] backend validates JWTs and derives account context server-side
- [ ] account scoping enforced backend-side
- [ ] no direct AI provider calls outside `AiPort`
- [ ] no MCP direct business mutation bypass

---

# API Contract

Endpoints verified:

```text
POST /api/v1/ai/product-ingestion
POST /api/v1/ai/bed-planning
POST /api/v1/ai/problem-assist
POST /api/v1/ai/suggestions/:suggestionId/accept
POST /api/v1/ai/suggestions/:suggestionId/reject
```

Request/response must follow:

- `docs/gardening-helper-canonical-api-contract-v1.md` section 22

---

# Tests Required

Confirm coverage exists for:

- [ ] happy path
- [ ] validation errors
- [ ] account scoping
- [ ] transaction rollback
- [ ] API response shape
- [ ] provider failure
- [ ] side-effect boundaries
- [ ] edge cases

Minimum specific coverage:

1. Product ingestion suggestion can be created.
2. AI suggestion is not saved as business data automatically.
3. Accepting suggestion creates business record.
4. Rejected suggestion does not create business record.
5. Bed planning suggestion is guidance only.
6. Cross-account suggestion accept/reject is blocked.
7. Invalid AI payload is rejected.
8. AI acceptance rollback leaves no accepted state or business record.

---

# Acceptance Criteria

The task is complete when:

- [ ] All Phase 23 task acceptance criteria are satisfied.
- [ ] Required checks have been run and reported.
- [ ] `docs/gardening-helper-implementation-status-handoff.md` is updated accurately.
- [ ] The PR description includes summary, scope, domain rules affected, API/DB changes, tests/checks run, integration/provider status, deferred work, and review focus.
- [ ] No unrelated changes are included.

---

# Commands to Run

Run from the backend package root:

```bash
npm run typecheck
npm run lint
npm test
npm run test:db
npm run build
```

Also run any configured backend boundary/static checks.

If any command does not exist or fails due to pre-existing setup, report the exact command, exit state, and reason. Never claim checks passed unless they were run.

---

# Expected PR Summary

```md
## Summary
Implemented backend AI suggestion workflows.

## Scope
- Added AiPort and deterministic adapter.
- Added AI session/suggestion endpoints.
- Added explicit accept/reject flow for suggestions.

## Domain rules affected
- AI suggestions are not business truth until accepted.
- Accepted payloads pass backend validation.
- Rejected suggestions create no business records.

## API changes
- Added Phase 23 `/api/v1/ai/*` endpoints.

## Database changes
- Used existing `ai_sessions` and `ai_suggestions` tables.

## Tests/checks run
- <commands and results>

## Integration/provider status
- <deterministic adapter and production provider status>

## Deferred work
- Frontend AI pages, push notifications, and MCP tools remain deferred.

## Review focus
- AI acceptance boundary.
- Transaction safety.
- Payload validation.
- Account scoping.
- Provider isolation.
```
