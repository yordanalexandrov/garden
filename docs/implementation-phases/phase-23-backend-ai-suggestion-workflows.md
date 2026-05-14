# Phase 23 — Backend AI Suggestion Workflows

## 1. Purpose

This phase implements AI session/suggestion workflows and explicit acceptance/rejection boundary through `AiPort`. AI output remains suggestion-only until accepted and validated by the backend.

## 2. Position in the sequence

Phase 8 must provide products/rules. Phase 15 must provide problems. Phase 18 must provide tasks. Frontend Phase 24 depends on backend AI session/suggestion APIs.

This phase must not start before core product, problem, task, and activity foundations because AI acceptance creates or references real domain records. It must not be merged with frontend AI pages because backend suggestion persistence and acceptance transactions are the critical boundary.

## 3. Source documents

- `docs/gardening-helper-domain-rules-and-invariants-v1.md` - defines AI assistive-only behavior, reviewability, explicit acceptance, auditability, uncertainty visibility, validation, and no diagnosis.
- `docs/gardening-helper-canonical-api-contract-v1.md` - defines AI API section 22.
- `docs/gardening-helper-backend-application-design-pack-v1.md` - defines `AiPort`, `AiRepository`, and accept suggestion flow.
- `docs/gardening-helper-testing-and-acceptance-spec-v1.md` - defines product ingestion, accept/reject, invalid payload, cross-account, provider failure, and no diagnosis tests.
- `docs/001_initial_schema_gardening_helper.sql` - defines `ai_sessions` and `ai_suggestions`.
- `docs/env.example` - defines `AI_PROVIDER`, `AI_API_KEY`, and `AI_MODEL`.

## 4. Scope

### Backend scope

- Define/implement `AiPort`.
- Implement deterministic dev/test AI adapter.
- Implement provider registry/config shape without exposing provider keys.
- Implement:
  - `POST /ai/product-ingestion`
  - `POST /ai/bed-planning`
  - `POST /ai/problem-assist`
  - `POST /ai/suggestions/:suggestionId/accept`
  - `POST /ai/suggestions/:suggestionId/reject`
- Persist `ai_sessions` and `ai_suggestions`.
- Accept product suggestions into real products.
- Accept product rule suggestions into real rules after validation.
- Reject suggestions without creating business records.
- Validate edited payloads before acceptance.
- Add audit logging for acceptance where audit exists.
- Document production AI adapter status if no concrete provider is assigned.

### Integration scope

- `AiPort` with deterministic adapter.
- Optional production provider adapter only when explicitly selected/configured.

### Testing scope

- Add API/service tests for session creation, suggestion accept/reject, validation, provider failure, cross-account behavior, and no direct business writes.

## 5. Out of scope

- Frontend AI pages.
- Direct AI-to-database writes.
- Autonomous diagnosis.
- Provider-specific production adapter unless explicitly selected by task.
- AI-created planned tasks.
- AI inventory changes.

## 6. Dependencies and prerequisites

- Previous phases required: Phase 8, Phase 15, Phase 18.
- Existing modules expected: products/rules services, problems service, tasks service or references, audit service if available.
- Expected backend paths after implementation: `src/modules/ai/`, `src/integrations/ai/`.
- Database requirements: `ai_sessions`, `ai_suggestions`, products/rules/problem/task tables migrated.
- Environment variables: `AI_PROVIDER`, `AI_API_KEY`, `AI_MODEL` backend-only; deterministic test adapter must not require real keys.
- Test infrastructure requirements: deterministic AI adapter fixtures and account A/account B AI sessions.

## 7. Domain rules and invariants affected

- AI is assistive only.
- AI output must be reviewable.
- AI acceptance is explicit.
- AI suggestions remain auditable.
- AI uncertainty must be visible.
- AI does not replace validation.
- AI problem assistance is not diagnosis.
- AI suggestions are not business truth.
- Accepted AI payload must still pass normal backend validation.

## 8. API contract impact

Endpoints involved:

- `POST /api/v1/ai/product-ingestion`
- `POST /api/v1/ai/bed-planning`
- `POST /api/v1/ai/problem-assist`
- `POST /api/v1/ai/suggestions/:suggestionId/accept`
- `POST /api/v1/ai/suggestions/:suggestionId/reject`

Request/response shapes to preserve:

- Product ingestion accepts JSON with `productName`/`labelText` or multipart/image where implemented.
- Bed planning accepts `bedId`, `year`, `candidatePlantIds`, and `notes`.
- Problem assist accepts `problemId` or ad hoc `text`.
- AI workflow responses return `aiSession`, `suggestions`, and optional `warnings`.
- Accept request may include `editedPayload`.
- Accept response returns `acceptedSuggestionId`, `createdEntities`, and `updatedEntities`.
- Reject response returns `{ rejected: true }`.
- Errors use canonical envelope.

Status/enum values:

- AI session kind: `product_ingestion`, `bed_planning`, `problem_assist`.
- AI suggestion type: `product`, `product_rule`, `bed_plan`, `problem_summary`, `followup_questions`.
- Provider failure maps to `EXTERNAL_SERVICE_ERROR`.

## 9. Database impact

Tables involved:

- `ai_sessions`
- `ai_suggestions`
- `products`
- `product_usage_rules`
- `plants`
- `problems`
- optionally `audit_logs`

Schema changes are not expected unless a documented account-consistency guard is added in a new forward migration.

## 10. Backend design notes

- AI provider calls create AI sessions and suggestions only; they do not create business records.
- Suggestions should store payload and acceptance/rejection state.
- Accept endpoint must fetch suggestion through account-owned session.
- Accept endpoint must validate edited payload using the same backend validation as manual product/rule creation.
- Acceptance must be transactional: mark suggestion accepted and create/update records together.
- Reject endpoint should mark suggestion rejected and create no business records.
- Problem assist must avoid diagnosis-as-fact wording in payloads/response where possible.
- Provider keys are backend-only and must not appear in logs or frontend config.
- Forbidden shortcuts: direct product/rule writes from AI adapter, accepting invalid payloads, cross-account suggestion accept, frontend AI provider calls.

## 11. Frontend design notes

No frontend work is expected in this phase.

## 12. Integration design notes

Port/interface:

- `AiPort.ingestProduct`
- `AiPort.suggestBedPlan`
- `AiPort.assistProblem`

Adapter expectations:

- Deterministic adapter returns stable suggestions for tests.
- Production provider adapter status must be honest if not implemented.

Secret handling:

- `AI_API_KEY` is backend-only.
- Do not log prompts/results containing secrets or credentials.

Failure handling:

- Provider failures map to `EXTERNAL_SERVICE_ERROR`.
- Failed AI sessions can be persisted as failed if implementation chooses and documents it.

## 13. Testing requirements

### Unit tests

- AI suggestion payload validators for product and product rule.
- Acceptance mapper validates edited payloads.
- Problem assist payload avoids diagnosis-as-fact fields/wording where encoded.

### Integration/API tests

- Product ingestion creates session/suggestions only.
- No product/rule exists before acceptance.
- Accept product suggestion creates product transactionally.
- Accept product rule suggestion validates product/plant/account references.
- Reject suggestion creates no business record.
- Cross-account suggestion accept rejected.
- Invalid edited payload rejected and suggestion remains unaccepted.
- Provider failure maps to `EXTERNAL_SERVICE_ERROR`.
- Problem assist creates suggestions only and no diagnosis/business truth.
- Accept failure rolls back suggestion accepted state and business record creation.

## 14. Verification checklist

- [ ] `AiPort` exists.
- [ ] Deterministic AI adapter exists.
- [ ] Provider config/registry exists without exposing keys.
- [ ] Product ingestion endpoint persists sessions/suggestions only.
- [ ] Bed planning endpoint persists guidance suggestions only.
- [ ] Problem assist endpoint persists assist suggestions only.
- [ ] Accept endpoint validates and transactionally creates business records.
- [ ] Reject endpoint creates no business records.
- [ ] No AI provider keys in frontend.
- [ ] Backend tests/typecheck/lint/build pass where configured.

## 15. Review checklist

- [ ] AI output is not business truth before acceptance.
- [ ] Acceptance is explicit and transactional.
- [ ] Edited payloads pass normal backend validation.
- [ ] Cross-account suggestion access is blocked.
- [ ] Provider access is behind `AiPort`.
- [ ] Problem assist avoids diagnosis-as-fact behavior.
- [ ] Production adapter status is documented honestly.
- [ ] Tests cover accept/reject/failure/account boundaries.

## 16. Suggested branch name

```text
feature/backend-ai-suggestions
```

## 17. Expected PR summary

```md
## Summary
Implemented backend AI suggestion workflows.

## Scope
- Added AiPort and deterministic adapter.
- Added AI session/suggestion endpoints.
- Added explicit accept/reject flow for suggestions.

## Domain rules preserved
- AI suggestions are not business truth until accepted.
- Accepted payloads pass backend validation.
- Rejected suggestions create no business records.

## Tests
- <commands run and results>

## Deferred work
- Frontend AI pages and any unselected production AI provider adapter remain deferred.

## Review focus
- AI acceptance boundary.
- Transaction safety.
- Payload validation.
- Provider isolation.
```

## 18. Risks and pitfalls

- Letting AI adapter write products/rules directly.
- Marking suggestion accepted before business record creation and not rolling back.
- Accepting invalid edited payloads.
- Exposing AI keys to frontend.
- Presenting problem assist as diagnosis.
- Creating tasks or inventory changes from AI without explicit acceptance.

## 19. Exit criteria

- AI sessions/suggestions are persisted.
- Accept/reject behavior is explicit, transactional, and tested.
- AI output remains suggestion-only until backend acceptance.
- Frontend Phase 24 can build review/accept UI safely.
