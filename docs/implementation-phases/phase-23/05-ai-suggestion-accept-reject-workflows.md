# Implementation Task - Phase 23 Step 5: AI Suggestion Accept/Reject Workflows

## Role

You are the **Implementation Agent**.

Follow `AGENTS.md` and `docs/gardening-helper-implementation-agent-instructions.md`. Services own AI acceptance, validation, audit, and transactions.

---

# Task

## Goal

Implement:

```text
Implement explicit account-scoped AI suggestion accept/reject workflows that validate accepted payloads through normal backend rules and keep rejection side-effect free.
```

## Branch

Use branch:

```text
feature/backend-ai-suggestions
```

---

# Scope

Implement only:

- [ ] Inspect existing product service, product usage rule service, plant lookup, transaction runner, audit helper, route error, and tests.
- [ ] Implement `AiService.acceptSuggestion(actor, suggestionId, editedPayload?)`.
- [ ] Fetch suggestion by id through the authenticated account-owned AI session.
- [ ] Reject cross-account, missing, already accepted, already rejected, unsupported, or invalid-state suggestions with canonical errors.
- [ ] Merge optional `editedPayload` according to the chosen local policy and validate the final accepted payload.
- [ ] For `suggestionType = product`:
  - [ ] validate final payload with the same backend validation/business rules as manual product creation
  - [ ] create the real product through the existing product service/repository pattern
  - [ ] return created entity metadata
- [ ] For `suggestionType = product_rule`:
  - [ ] validate product/plant/account references or name-resolution policy according to existing product/rule APIs
  - [ ] validate final payload with the same backend validation/business rules as manual rule creation
  - [ ] create the real product usage rule through the existing service/repository pattern
  - [ ] return created entity metadata
- [ ] For `bed_plan`, `problem_summary`, and `followup_questions`, either reject acceptance as guidance-only or implement only a source-of-truth-defined no-business-record acceptance marker. Do not create plantings, problem diagnosis, tasks, reminders, inventory changes, or activities unless a higher-priority source explicitly defines that behavior.
- [ ] Wrap accepted state update and business record creation in one service-owned transaction.
- [ ] Add audit logging for accepted suggestions if the audit module exists and local pattern supports representative critical-operation audit integration.
- [ ] Implement `AiService.rejectSuggestion(actor, suggestionId)` to mark rejected state, optionally audit, and create no business records.
- [ ] Wire accept/reject routes to the service and return canonical responses.
- [ ] Add focused service/API tests for valid accept, edited payload validation, rejection, idempotency/state errors, account scoping, audit where available, and side-effect boundaries.

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

- [ ] Frontend AI review/accept pages.
- [ ] Push notifications.
- [ ] MCP mutation tools.
- [ ] Planned task creation or reminders from AI.
- [ ] Inventory movements or lot updates from AI.
- [ ] Bed plantings from bed-plan guidance.
- [ ] Problem diagnosis as business truth.
- [ ] Direct product/rule writes from `AiPort` adapters.
- [ ] Direct repository/table access from a future MCP server.
- [ ] Schema redesign or migrations unless a blocking mismatch is documented.

---

# Required Documents

Read before coding:

- [ ] `AGENTS.md`
- [ ] `docs/gardening-helper-implementation-agent-instructions.md`
- [ ] `docs/gardening-helper-ai-implementation-handoff-readme-v1.md`
- [ ] `docs/gardening-helper-implementation-instructions-for-ai-v1.md`
- [ ] `docs/gardening-helper-domain-rules-and-invariants-v1.md` AI, audit, account, product/rule, task/reminder, and MCP invariants
- [ ] `docs/gardening-helper-canonical-api-contract-v1.md` sections 22.4, 22.5, 25, 26, and 28
- [ ] `docs/gardening-helper-testing-and-acceptance-spec-v1.md` AI acceptance, invalid payload, cross-account, and rollback sections
- [ ] `docs/gardening-helper-backend-application-design-pack-v1.md` accept AI suggestion flow
- [ ] `docs/implementation-phases/phase-08-backend-products-and-usage-rules-api.md`
- [ ] `docs/implementation-phases/phase-13-backend-activity-correction-and-audit-trail.md`
- [ ] `docs/implementation-phases/phase-23-backend-ai-suggestion-workflows.md`
- [ ] Existing backend products/rules, plants, audit, transaction, route, validation, error, repository, and test helper files.

---

# Domain Rules Affected

This task touches:

- [ ] account scoping
- [ ] product usage rules
- [ ] tasks/reminders
- [ ] AI suggestions
- [ ] API contract
- [ ] database/migrations
- [ ] auth/session boundary
- [ ] provider adapter boundary
- [ ] MCP tools / agent interface

Important rules to preserve:

```text
AI output becomes business data only after explicit backend acceptance.
AI suggestions are not business truth until accepted.
Accepted AI payload must still pass normal backend validation.
AI suggestion acceptance must operate only inside the owning account.
Accept AI suggestion is transaction-safe.
Rejected suggestions create no business records.
Suggested tasks are not planned tasks; AI must not auto-create planned tasks or reminders.
Inventory is ledger-based; AI must not mutate stock.
MCP mutation tools must call backend services/API and must not bypass AI acceptance rules.
```

---

# MCP Impact

This task:

- [ ] changes backend behavior used by future MCP tools

MCP tools affected:

```text
Future `ai_suggestions.accept` MCP tools must call this backend workflow/API and preserve account scoping, confirmation rules, auditability, and domain invariants.
No MCP tool implementation is part of Phase 23.
```

Required MCP documentation updates:

```text
None unless backend endpoint behavior differs from `docs/gardening-helper-mcp-server-design-v1.md`. Do not introduce such a difference without documenting the source-of-truth reason.
```

---

# Required Implementation Details

Implement:

- [ ] backend controller/route
- [ ] backend validation schema
- [ ] backend service methods
- [ ] repository methods
- [ ] transaction handling
- [ ] product/product-rule service integration
- [ ] audit integration if available
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
- [ ] no direct provider calls during accept/reject unless a source-of-truth document explicitly requires a validation provider call

---

# API Contract

Endpoints involved:

```text
POST /api/v1/ai/suggestions/:suggestionId/accept
POST /api/v1/ai/suggestions/:suggestionId/reject
```

Accept request:

```json
{
  "editedPayload": {}
}
```

Accept response:

```json
{
  "data": {
    "acceptedSuggestionId": "uuid",
    "createdEntities": [
      {
        "entityType": "product",
        "entityId": "uuid"
      }
    ],
    "updatedEntities": []
  }
}
```

Reject response:

```json
{
  "data": {
    "rejected": true
  }
}
```

Errors must use the canonical error envelope.

---

# Tests Required

Add or update tests for:

- [ ] happy path
- [ ] validation errors
- [ ] account scoping
- [ ] transaction rollback
- [ ] API response shape
- [ ] edge cases

Specific test cases:

1. Accept valid product suggestion marks suggestion accepted and creates product.
2. Accept valid product rule suggestion marks suggestion accepted and creates product usage rule.
3. Accept response returns `acceptedSuggestionId`, `createdEntities`, and `updatedEntities`.
4. Accept edited payload uses edited values and passes normal backend validation.
5. Invalid edited payload is rejected and suggestion remains unaccepted.
6. Account A cannot accept account B suggestion.
7. Reject suggestion marks rejected and creates no business records.
8. Rejected suggestion cannot later be accepted unless the source-of-truth explicitly allows re-opening.
9. Already accepted suggestion cannot be accepted twice or create duplicate records.
10. Guidance-only suggestions do not create plantings, problem diagnosis, tasks, reminders, inventory movements, or activities.
11. Acceptance creates audit log if audit integration is available.

---

# Acceptance Criteria

The task is complete when:

- [ ] Accept/reject endpoints are explicit, account-scoped, and canonical.
- [ ] Product and product-rule acceptance validates through normal backend rules.
- [ ] Accept workflow is transaction-wrapped.
- [ ] Reject workflow creates no business records.
- [ ] Guidance suggestions remain guidance unless a higher-priority source defines business-record acceptance.
- [ ] No frontend, push, MCP, provider bypass, inventory, planned task, reminder, or schema scope slipped in.

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
