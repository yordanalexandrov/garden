# Implementation Task - Phase 23 Step 4: AI Suggestion Generation Services and Routes

## Role

You are the **Implementation Agent**.

Follow `AGENTS.md` and `docs/gardening-helper-implementation-agent-instructions.md`. Services own workflows; AI provider access goes through `AiPort`.

---

# Task

## Goal

Implement:

```text
Implement backend-owned product ingestion, bed planning, and problem assist workflows that call AiPort and persist reviewable sessions/suggestions only.
```

## Branch

Use branch:

```text
feature/backend-ai-suggestions
```

---

# Scope

Implement only:

- [ ] Inspect existing service, route, repository, transaction, error, product/rule, beds, problems, and test patterns.
- [ ] Implement `AiService.ingestProduct(actor, input)`:
  - [ ] call `AiPort.ingestProduct`
  - [ ] create an `ai_sessions` row
  - [ ] persist returned `product` and `product_rule` suggestions
  - [ ] return canonical `aiSession`, `suggestions`, and optional warnings
  - [ ] create no products or product rules
- [ ] Implement `AiService.suggestBedPlan(actor, input)`:
  - [ ] validate bed belongs to actor account
  - [ ] validate candidate plants belong to actor account
  - [ ] reject cross-account or invalid references
  - [ ] call `AiPort.suggestBedPlan`
  - [ ] persist `bed_plan` guidance suggestions only
  - [ ] create no plantings or tasks
- [ ] Implement `AiService.assistProblem(actor, input)`:
  - [ ] if `problemId` is provided, validate problem belongs to actor account
  - [ ] support ad hoc text input if canonical validation allows it
  - [ ] call `AiPort.assistProblem`
  - [ ] persist `problem_summary` and/or `followup_questions` suggestions only
  - [ ] create no diagnosis, problem update, activity, task, or inventory change
- [ ] Wire Step 1 routes to these service methods.
- [ ] Map provider failures to canonical `EXTERNAL_SERVICE_ERROR`.
- [ ] Keep warnings/uncertainty visible in response payloads where available.
- [ ] Add focused API/service tests for session creation, suggestion-only persistence, provider failure, and account-scoped reference validation.

Expected paths, unless existing code clearly establishes a better equivalent:

```text
backend/src/modules/ai/ai.service.ts
backend/src/modules/ai/ai.routes.ts
backend/src/modules/ai/ai.repository.ts
backend/test/ai/
```

---

# Out of Scope

Do not implement:

- [ ] Accept/reject business-record creation; that belongs to Step 5.
- [ ] Frontend AI pages.
- [ ] Push notifications.
- [ ] MCP tools.
- [ ] Product/rule creation from generated suggestions.
- [ ] Bed planting creation, target mutation, task creation, reminders, or inventory mutation from AI output.
- [ ] Problem diagnosis as fact or autonomous problem updates.
- [ ] Direct provider calls from routes/repositories.
- [ ] Schema changes or migrations unless a blocking mismatch is documented.

---

# Required Documents

Read before coding:

- [ ] `AGENTS.md`
- [ ] `docs/gardening-helper-implementation-agent-instructions.md`
- [ ] `docs/gardening-helper-ai-implementation-handoff-readme-v1.md`
- [ ] `docs/gardening-helper-implementation-instructions-for-ai-v1.md`
- [ ] `docs/gardening-helper-domain-rules-and-invariants-v1.md` AI, account, bed, problem, task, inventory, and API invariants
- [ ] `docs/gardening-helper-canonical-api-contract-v1.md` sections 22.1, 22.2, and 22.3
- [ ] `docs/gardening-helper-testing-and-acceptance-spec-v1.md` AI product ingestion, problem assist, and provider failure sections
- [ ] `docs/gardening-helper-backend-application-design-pack-v1.md` AI service/API sections
- [ ] `docs/implementation-phases/phase-08-backend-products-and-usage-rules-api.md`
- [ ] `docs/implementation-phases/phase-15-backend-problems-and-observations-api.md`
- [ ] `docs/implementation-phases/phase-18-backend-task-lifecycle-and-reminders.md`
- [ ] `docs/implementation-phases/phase-23-backend-ai-suggestion-workflows.md`
- [ ] Existing backend products, plants, beds, problems, tasks, route, service, repository, error, and test helper files.

---

# Domain Rules Affected

This task touches:

- [ ] account scoping
- [ ] target resolution
- [ ] product usage rules
- [ ] tasks/reminders
- [ ] problems/photos
- [ ] AI suggestions
- [ ] API contract
- [ ] auth/session boundary
- [ ] provider adapter boundary
- [ ] MCP tools / agent interface

Important rules to preserve:

```text
AI output must be reviewable.
AI output is not business truth until explicit acceptance.
AI cannot silently create products, rules, tasks, inventory changes, problem diagnoses, or plantings.
Accepted AI payloads still need normal backend validation later.
Problem assistance is not diagnosis.
All referenced records must belong to the authenticated account.
Provider calls go through AiPort.
MCP tools must not bypass backend services/API.
```

---

# MCP Impact

This task:

- [ ] changes backend behavior used by future MCP tools

MCP tools affected:

```text
Future MCP draft/suggestion tools may call backend AI workflows.
No MCP tool implementation is part of Phase 23.
```

Required MCP documentation updates:

```text
None unless backend behavior deviates from existing MCP design. Do not introduce such a deviation without documenting the source-of-truth reason.
```

---

# Required Implementation Details

Implement:

- [ ] backend service methods
- [ ] provider adapter through port
- [ ] repository methods
- [ ] transaction handling if local persistence pattern requires it
- [ ] route wiring
- [ ] API DTO mapping
- [ ] tests

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

---

# API Contract

Endpoints involved:

```text
POST /api/v1/ai/product-ingestion
POST /api/v1/ai/bed-planning
POST /api/v1/ai/problem-assist
```

Preserve:

```text
Responses return data.aiSession and data.suggestions.
Product ingestion may return data.warnings.
No products, product rules, plantings, tasks, reminders, problems, activities, or inventory changes are created by these endpoints.
Errors use canonical envelope.
Provider failure maps to EXTERNAL_SERVICE_ERROR.
```

---

# Tests Required

Add or update tests for:

- [ ] happy path
- [ ] validation errors
- [ ] account scoping
- [ ] API response shape
- [ ] provider failure
- [ ] side-effect boundaries

Specific test cases:

1. Product ingestion creates AI session and suggestions only.
2. Product ingestion does not create product or product usage rule records before acceptance.
3. Product ingestion returns warnings from the adapter when present.
4. Bed planning validates bed/account and candidate plant/account ownership.
5. Bed planning persists guidance suggestion only and creates no planting/task/reminder records.
6. Problem assist validates problem/account ownership when `problemId` is provided.
7. Problem assist with ad hoc text creates suggestions only and no problem/activity/task records.
8. Problem assist payload avoids diagnosis-as-fact fields/wording where encoded.
9. Provider failure returns canonical `EXTERNAL_SERVICE_ERROR`.
10. Account A cannot generate suggestions using account B bed, plant, or problem ids.

---

# Acceptance Criteria

The task is complete when:

- [ ] Product ingestion, bed planning, and problem assist endpoints persist reviewable sessions/suggestions.
- [ ] AI generation endpoints create no business truth records.
- [ ] All referenced records are account-scoped.
- [ ] Provider failures and response shapes follow the canonical API contract.
- [ ] No accept/reject, frontend, push, MCP, direct provider, direct DB mutation, or schema scope slipped in.

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
