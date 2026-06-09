# Implementation Task - Phase 23 Step 3: AI Session/Suggestion Repository and Persistence

## Role

You are the **Implementation Agent**.

Follow `AGENTS.md` and `docs/gardening-helper-implementation-agent-instructions.md`. Repositories access data only; services own business workflows and transactions.

---

# Task

## Goal

Implement:

```text
Create account-scoped AI session and suggestion repository methods and persistence mapping for existing ai_sessions and ai_suggestions tables.
```

## Branch

Use branch:

```text
feature/backend-ai-suggestions
```

---

# Scope

Implement only:

- [ ] Inspect existing repository, Kysely/database type, transaction, audit, DTO mapping, fixture, and reset helper patterns.
- [ ] Map existing `ai_sessions` and `ai_suggestions` tables into backend database types if not already present.
- [ ] Implement repository methods equivalent to the backend design pack:
  - [ ] create session for authenticated account
  - [ ] add suggestions for a session
  - [ ] find suggestion by id through account-owned session
  - [ ] mark suggestion accepted
  - [ ] mark suggestion rejected
  - [ ] optionally list session suggestions when needed by service tests
- [ ] Ensure repository methods accept an optional transaction handle using the existing transaction abstraction.
- [ ] Preserve raw provider payload only as audit/debug context if stored; business services must rely on normalized suggestion payload fields.
- [ ] Return repository models suitable for canonical DTO mapping.
- [ ] Add deterministic fixtures for account A/account B AI sessions and suggestions.
- [ ] Add repository tests for create/find/mark behavior, transaction participation, and account scoping.
- [ ] Document any blocking schema mismatch before adding a forward migration. Do not edit historical migrations.

Expected paths, unless existing code clearly establishes a better equivalent:

```text
backend/src/modules/ai/ai.repository.ts
backend/src/modules/ai/ai.types.ts
backend/test/ai/
backend/test/fixtures/
```

---

# Out of Scope

Do not implement:

- [ ] `AiPort` adapter internals beyond using types from Step 2.
- [ ] Product ingestion, bed planning, or problem assist service orchestration; that belongs to Step 4.
- [ ] Accept/reject business-record creation; that belongs to Step 5.
- [ ] Frontend AI pages.
- [ ] Push notifications.
- [ ] MCP tools.
- [ ] Direct provider calls.
- [ ] Direct product/rule/task/problem/inventory writes from repository methods.
- [ ] Schema redesign.

---

# Required Documents

Read before coding:

- [ ] `AGENTS.md`
- [ ] `docs/gardening-helper-implementation-agent-instructions.md`
- [ ] `docs/gardening-helper-ai-implementation-handoff-readme-v1.md`
- [ ] `docs/gardening-helper-implementation-instructions-for-ai-v1.md`
- [ ] `docs/gardening-helper-domain-rules-and-invariants-v1.md` account and AI invariants
- [ ] `docs/gardening-helper-canonical-api-contract-v1.md` section 22
- [ ] `docs/gardening-helper-testing-and-acceptance-spec-v1.md` AI account-scope sections
- [ ] `docs/gardening-helper-backend-application-design-pack-v1.md` `AiRepository`
- [ ] `docs/gardening-helper-technical-requirements-and-erd.md` AI schema sections
- [ ] `docs/001_initial_schema_gardening_helper.sql` `ai_sessions` and `ai_suggestions`
- [ ] `docs/004_guards_and_triggers_gardening_helper.sql`
- [ ] `docs/implementation-phases/phase-23-backend-ai-suggestion-workflows.md`
- [ ] Existing backend database, repository, transaction, fixture, and test helper files.

---

# Domain Rules Affected

This task touches:

- [ ] account scoping
- [ ] AI suggestions
- [ ] API contract
- [ ] database/migrations
- [ ] auth/session boundary

Important rules to preserve:

```text
Every business record is account-scoped directly or through its parent entity.
AI suggestion belongs to session/account.
Cross-account access is forbidden.
Repositories only access data and do not orchestrate business workflows.
AI suggestions remain auditable with accepted/rejected state.
Archive/history rules apply; do not hard-delete suggestion history.
```

---

# MCP Impact

This task:

- [ ] changes backend behavior used by future MCP tools

MCP tools affected:

```text
Future MCP AI tools may rely on account-scoped suggestion reads through backend services/API.
No MCP tool implementation is part of Phase 23.
```

Required MCP documentation updates:

```text
None.
```

---

# Required Implementation Details

Implement:

- [ ] repository methods
- [ ] transaction compatibility
- [ ] account-scoped lookup helpers
- [ ] database type mapping
- [ ] tests

---

# Required Infrastructure/Security Boundaries

Preserve these rules:

- [ ] no direct frontend access to application tables
- [ ] no bypass of the Fastify API for application data
- [ ] no business logic in repositories
- [ ] no business side-effect orchestration in database triggers
- [ ] no Supabase service role key in frontend code/env/build output/logs
- [ ] account scoping enforced backend-side

---

# API Contract

Endpoints supported by this persistence layer:

```text
POST /api/v1/ai/product-ingestion
POST /api/v1/ai/bed-planning
POST /api/v1/ai/problem-assist
POST /api/v1/ai/suggestions/:suggestionId/accept
POST /api/v1/ai/suggestions/:suggestionId/reject
```

No API behavior is implemented directly in this step. Repository output must support canonical DTO mapping from section 22.

---

# Tests Required

Add or update tests for:

- [ ] happy path
- [ ] account scoping
- [ ] transaction participation
- [ ] edge cases

Specific test cases:

1. Create AI session stores authenticated account id, kind, input mode, status, input payload, and provider metadata according to local schema/types.
2. Add suggestions stores normalized suggestion payloads under the created session.
3. Find suggestion by id succeeds only through an account-owned session.
4. Account A cannot find or mark account B suggestion.
5. Mark accepted updates accepted state without creating business records.
6. Mark rejected updates rejected state without creating business records.
7. Repository methods participate in an existing transaction and roll back with it.

---

# Acceptance Criteria

The task is complete when:

- [ ] AI repository methods exist and are account-scoped.
- [ ] Session/suggestion persistence uses existing schema without redesign.
- [ ] Repository methods are transaction-compatible.
- [ ] Tests cover account scoping and transaction participation.
- [ ] No provider workflow, business acceptance, frontend, push, MCP, or unrelated schema scope is included.

---

# Commands to Run

Run relevant backend commands:

```bash
npm run typecheck
npm run lint
npm test
npm run test:db
```

If any command does not exist or fails due to pre-existing setup, report it clearly.
