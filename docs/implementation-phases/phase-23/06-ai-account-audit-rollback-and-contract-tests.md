# Implementation Task - Phase 23 Step 6: AI Account, Audit, Rollback, and Contract Tests

## Role

You are the **Implementation Agent**.

Use `AGENTS.md`, `docs/gardening-helper-implementation-agent-instructions.md`, and the Phase 23 source documents. Be strict on AI acceptance boundary, account scoping, and transaction rollback.

---

# Task

## Goal

Implement:

```text
Add comprehensive regression coverage for the full Phase 23 AI suggestion workflow.
```

## Branch

Use branch:

```text
feature/backend-ai-suggestions
```

---

# Scope

Implement only:

- [ ] Expand deterministic fixtures for account A/B AI sessions, suggestions, products, plants, product rules, beds, and problems.
- [ ] Add API/service tests for product ingestion, bed planning, problem assist, accept, reject, provider failure, and canonical response shapes.
- [ ] Add account-scope tests proving account A cannot use account B suggestion, session, product, plant, bed, or problem references.
- [ ] Add no-business-write-before-acceptance assertions for products, product rules, tasks, reminders, inventory movements, activities, problem updates, and plantings where tables exist.
- [ ] Add rollback tests that simulate failure after suggestion accepted state would be written but before/while product or rule creation fails.
- [ ] Verify suggestion remains unaccepted/unmodified and no business record exists after acceptance rollback.
- [ ] Verify reject flow is side-effect free.
- [ ] Verify provider failures map to canonical `EXTERNAL_SERVICE_ERROR`.
- [ ] Verify problem assist remains suggestion-only and avoids diagnosis-as-fact response fields/wording where encoded.
- [ ] Add static/boundary tests if the project has existing checks for:
  - [ ] provider calls confined to `AiPort` adapters
  - [ ] no frontend AI provider calls
  - [ ] no service role key exposure
  - [ ] no MCP direct repository/database business mutation
  - [ ] no adapter-level product/rule writes
- [ ] Ensure tests use deterministic AI adapters and never require real AI provider credentials or network access.

---

# Out of Scope

Do not implement:

- [ ] New feature behavior beyond fixing issues discovered by tests.
- [ ] Frontend E2E tests.
- [ ] Push notification tests.
- [ ] MCP tool tests unless a future task explicitly adds MCP tools.
- [ ] Real AI provider network tests.
- [ ] Schema redesign.

---

# Required Documents

Read before coding:

- [ ] `AGENTS.md`
- [ ] `docs/gardening-helper-implementation-agent-instructions.md`
- [ ] `docs/gardening-helper-ai-implementation-handoff-readme-v1.md`
- [ ] `docs/gardening-helper-implementation-instructions-for-ai-v1.md`
- [ ] `docs/gardening-helper-domain-rules-and-invariants-v1.md` AI, account, audit, transaction, MCP, task/reminder, inventory, and problem invariants
- [ ] `docs/gardening-helper-canonical-api-contract-v1.md` sections 22, 25, 26, 27, and 28
- [ ] `docs/gardening-helper-testing-and-acceptance-spec-v1.md` sections 6.19-6.21, 8.9, 10.7, 11.5, and AI checklist
- [ ] `docs/gardening-helper-backend-application-design-pack-v1.md` AI repository/service/API sections
- [ ] `docs/gardening-helper-mcp-server-design-v1.md` MCP AI acceptance boundary sections
- [ ] `docs/implementation-phases/phase-23-backend-ai-suggestion-workflows.md`
- [ ] Existing backend AI, products/rules, problems, tasks, inventory, audit, route, transaction, boundary/static, fixture, and reset helper files.

---

# Domain Rules Affected

This task touches:

- [ ] account scoping
- [ ] activities
- [ ] inventory
- [ ] product usage rules
- [ ] tasks/reminders
- [ ] problems/photos
- [ ] AI suggestions
- [ ] API contract
- [ ] database/migrations
- [ ] auth/session boundary
- [ ] provider adapter boundary
- [ ] MCP tools / agent interface

Important rules to preserve:

```text
AI suggestion acceptance must operate only inside the owning account.
AI output is not business truth until accepted.
Accepted AI payload must still pass normal backend validation.
Accept AI suggestion is transaction-safe.
Rejected suggestions create no business records.
AI cannot silently create tasks, reminders, inventory changes, activities, plantings, or diagnosis-as-fact.
MCP tools are not a privileged bypass channel.
Provider calls go through AiPort and test runs use deterministic adapters.
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
None unless boundary tests identify a mismatch in existing MCP design docs.
```

---

# Required Implementation Details

Implement:

- [ ] tests
- [ ] fixtures
- [ ] deterministic failure hooks/test doubles
- [ ] boundary/static checks if local patterns exist
- [ ] minimal implementation fixes only if needed for tests to pass within Phase 23 scope

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
- [ ] no real provider credentials or network access in automated tests

---

# API Contract

Endpoints covered:

```text
POST /api/v1/ai/product-ingestion
POST /api/v1/ai/bed-planning
POST /api/v1/ai/problem-assist
POST /api/v1/ai/suggestions/:suggestionId/accept
POST /api/v1/ai/suggestions/:suggestionId/reject
```

Verify:

```text
Responses use canonical success envelopes.
Errors use canonical error envelopes.
Accept returns acceptedSuggestionId, createdEntities, and updatedEntities.
Reject returns { rejected: true }.
Provider failure maps to EXTERNAL_SERVICE_ERROR.
```

---

# Tests Required

Add or update tests for:

- [ ] happy path
- [ ] validation errors
- [ ] account scoping
- [ ] transaction rollback
- [ ] API response shape
- [ ] provider failure
- [ ] side-effect boundaries
- [ ] edge cases

Specific test cases:

1. Product ingestion creates session/suggestions only and returns canonical response.
2. Bed planning creates guidance suggestion only and returns canonical response.
3. Problem assist creates suggestion only and avoids diagnosis-as-fact response.
4. Accept valid product suggestion creates product only after acceptance.
5. Accept valid product rule suggestion creates rule only after acceptance.
6. Reject suggestion creates no business records.
7. Account A cannot accept/reject account B suggestion.
8. Account A cannot generate suggestions from account B bed/plant/problem references.
9. Invalid accepted/edited payload is rejected, suggestion remains unaccepted, and no business record is created.
10. Simulated failure during accepted product creation rolls back suggestion accepted state.
11. Simulated failure during accepted product-rule creation rolls back suggestion accepted state.
12. Provider failure returns canonical `EXTERNAL_SERVICE_ERROR`.
13. AI workflows do not create planned tasks, reminders, inventory movements, activities, plantings, or problem diagnosis/update records.
14. Boundary/static check confirms provider calls are confined to `AiPort` adapters.

---

# Acceptance Criteria

The task is complete when:

- [ ] Phase 23 has automated coverage for AI generation, acceptance, rejection, account boundaries, rollback, and response shapes.
- [ ] Tests prove AI output is suggestion-only before acceptance.
- [ ] Tests prove accept is transactional.
- [ ] Tests prove reject is side-effect free.
- [ ] Tests prove provider boundary and no-bypass rules where local static checks exist.
- [ ] No frontend, push, MCP tool, real provider network, or unrelated schema scope slipped in.

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

If any command does not exist or fails due to pre-existing setup, report it clearly.

---

# PR Requirements

PR description must include:

- Summary
- Scope
- Domain rules affected
- API changes
- Database changes
- Tests run
- Integration/provider status
- Review focus
