# Phase 24 — Frontend AI Assistant Pages

## 1. Purpose

This phase implements AI product ingestion, bed planning, and problem assist pages with suggestion review, edit, accept, and reject UX. It presents AI output as suggestions, not saved business truth.

## 2. Position in the sequence

Phase 4 must provide frontend foundation. Phase 23 must provide backend AI endpoints. Product, bed, and problem pages from earlier phases provide context and links for created records.

This phase must not be merged with Phase 23 because backend AI acceptance is the critical boundary. It must not include direct provider calls or autonomous record creation.

## 3. Source documents

- `docs/gardening-helper-frontend-technical-spec-v1.md` - defines AI Assistant pages, product ingestion, bed planning, problem assist, and AI suggestion card UX.
- `docs/gardening-helper-domain-rules-and-invariants-v1.md` - defines AI suggestions visibly as suggestions, explicit acceptance, uncertainty visibility, and no diagnosis.
- `docs/gardening-helper-canonical-api-contract-v1.md` - defines AI endpoints and accept/reject response shapes.
- `docs/gardening-helper-testing-and-acceptance-spec-v1.md` - defines AI product ingestion page, structured editable cards, accept/reject, and API error tests.

## 4. Scope

### Frontend scope

- Implement AI Assistant route shell.
- Implement product ingestion page.
- Implement bed planning page.
- Implement problem assist page.
- Implement `app-ai-suggestion-card`.
- Display structured suggestions with warnings/uncertainty.
- Allow editing suggestion payloads where backend accept endpoint supports `editedPayload`.
- Implement accept/reject actions.
- Link to created product/rule after acceptance.
- Display provider/API errors gracefully.

### Testing scope

- Add form/component/API service tests for AI workflows and suggestion cards.

## 5. Out of scope

- Direct frontend AI provider calls.
- Autonomous product/rule creation.
- Diagnosis wording.
- Advanced chat UI unless built on same suggestion boundary.
- AI-created tasks/inventory/plantings without explicit backend acceptance.

## 6. Dependencies and prerequisites

- Previous phases required: Phase 4, Phase 23.
- Existing frontend modules expected: product, bed, problem selectors/links, API client/error mapper.
- Expected frontend paths after implementation: `src/app/features/ai/` and shared `app-ai-suggestion-card`.
- Backend requirements: AI product ingestion, bed planning, problem assist, accept, and reject endpoints available.
- Environment variables: no AI provider keys in frontend; only API base and auth session config.
- Test infrastructure requirements: mocked AI API responses and suggestion payload fixtures.

## 7. Domain rules and invariants affected

- AI suggestions must be visibly suggestions.
- Accepted AI suggestions transition to real record links.
- Rejected suggestions create no business records.
- AI uncertainty/warnings are visible.
- AI output must be reviewable.
- AI acceptance is explicit.
- AI problem assistance is not diagnosis.
- Frontend must not calculate business truth.

## 8. API contract impact

This phase consumes, but does not introduce, API endpoints.

Endpoints consumed:

- `POST /api/v1/ai/product-ingestion`
- `POST /api/v1/ai/bed-planning`
- `POST /api/v1/ai/problem-assist`
- `POST /api/v1/ai/suggestions/:suggestionId/accept`
- `POST /api/v1/ai/suggestions/:suggestionId/reject`

Request/response expectations:

- Use canonical input DTOs for each AI workflow.
- Accept request may send `editedPayload`.
- Accept response includes `acceptedSuggestionId`, `createdEntities`, and `updatedEntities`.
- Reject response returns `rejected: true`.
- Errors use canonical envelope.

## 9. Database impact

No schema changes are expected in this phase.

Frontend must not access AI tables or provider APIs directly.

## 10. Backend design notes

No backend work is expected except bug fixes in already implemented APIs.

## 11. Frontend design notes

- AI output should be displayed as structured, editable suggestion cards/forms, not final saved records.
- Product suggestions and product rule suggestions should show fields clearly before accept.
- Bed planning output should be guidance only and not auto-apply plantings.
- Problem assist output should avoid diagnosis-as-fact wording.
- Accepted suggestions should visually transition to accepted state and show created entity links.
- Rejected suggestions should update UI without creating records.
- Warnings/uncertainty should be visible but compact.
- Forbidden shortcuts: direct model provider calls, showing AI output as already saved, hiding uncertainty, auto-creating products/rules without accept.

## 12. Integration design notes

No direct external integration work is expected in this phase.

Frontend integrates only with backend AI API and must not contain AI provider keys.

## 13. Testing requirements

### Unit/component tests

- AI product input form validates required fields.
- Suggestions render as editable cards.
- Warnings/uncertainty render visibly.
- Accept calls backend and displays created entity link.
- Reject updates UI and does not show created entity link.
- AI output is not displayed as saved before acceptance.
- Problem assist UI avoids diagnosis wording.
- Provider/API errors display.

### Frontend/API-service tests

- AI API service uses canonical endpoints.
- Accept sends `editedPayload` only when present.
- No service sends provider keys or calls provider URLs.

### Static/security checks

- No direct model provider calls from frontend.
- No `AI_API_KEY` or provider secret in frontend code/config.

## 14. Verification checklist

- [ ] AI Assistant route shell exists.
- [ ] Product ingestion page works.
- [ ] Bed planning page works.
- [ ] Problem assist page works.
- [ ] AI suggestion cards show structured editable suggestions.
- [ ] Accept/reject actions work.
- [ ] Accepted suggestions link to created entities.
- [ ] Warnings/uncertainty are visible.
- [ ] Frontend tests/typecheck/lint/build pass where configured.
- [ ] Static search confirms no direct AI provider calls or keys.

## 15. Review checklist

- [ ] Suggestions are visually distinct from saved records.
- [ ] Accept/reject flow uses backend endpoints.
- [ ] No autonomous product/rule/task creation in frontend.
- [ ] AI uncertainty/warnings are shown.
- [ ] Problem assist is not presented as diagnosis.
- [ ] API services are typed and centralized.
- [ ] Tests cover acceptance boundary and UI states.

## 16. Suggested branch name

```text
feature/frontend-ai-assistant
```

## 17. Expected PR summary

```md
## Summary
Implemented frontend AI Assistant pages.

## Scope
- Added AI route shell and product/bed/problem assistant pages.
- Added structured AI suggestion cards.
- Added accept/reject flows and created-entity links.

## Domain rules preserved
- AI output is visibly suggestion-only until accepted.
- Acceptance goes through backend.
- Problem assist is not presented as diagnosis.

## Tests
- <commands run and results>

## Deferred work
- Advanced chat UI and any unselected provider-specific frontend features remain deferred.

## Review focus
- Suggestion vs saved-truth distinction.
- Accept/reject UX.
- Provider boundary.
```

## 18. Risks and pitfalls

- Showing AI suggestions as saved products/rules before acceptance.
- Calling an AI provider directly from Angular.
- Hiding warnings or uncertainty.
- Accepting suggestions without allowing review/edit where supported.
- Using diagnosis wording for problem assist.
- Failing to link to created records after acceptance.

## 19. Exit criteria

- AI assistant pages work through backend APIs.
- Users can review, edit, accept, and reject suggestions.
- Frontend has no provider secrets or direct model calls.
- AI output remains clearly suggestion-only until accepted.
