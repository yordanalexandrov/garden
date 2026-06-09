# Implementation Task - Phase 24 Step 3: Product Ingestion Page

## Role

You are the **Implementation Agent**.

Use `AGENTS.md`, `docs/gardening-helper-implementation-agent-instructions.md`, `docs/gardening-helper-ai-implementation-handoff-readme-v1.md`, and all relevant specs for this task. The application data API remains the Fastify API under `/api/v1`.

---

# Task

## Goal

Implement the `/ai/product-ingestion` page for creating AI product/rule suggestions, reviewing editable structured suggestions, and accepting or rejecting them through backend AI endpoints.

## Branch

Use branch:

```text
feature/frontend-ai-assistant
```

---

# Scope

Implement only:

- [ ] Inspect existing product/rule forms, product detail links, plant selector patterns, API error summaries, file-input patterns if present, and mobile form layouts.
- [ ] Build a Reactive Form for product ingestion input mode, product name, label text, and optional image upload only if the existing API client/backend supports multipart for Phase 23.
- [ ] Submit JSON product ingestion requests to `AiApiService.productIngestion` and display canonical backend warnings/errors.
- [ ] Render returned product and product rule suggestions using the shared AI suggestion card/review UI.
- [ ] Allow user edits to suggestion payload fields before acceptance where supported by the shared card and backend accept endpoint.
- [ ] Accept product and product rule suggestions through `POST /api/v1/ai/suggestions/:suggestionId/accept`, sending `editedPayload` only when present.
- [ ] Reject suggestions through `POST /api/v1/ai/suggestions/:suggestionId/reject`.
- [ ] Display accepted state and links to created product/rule records using backend `createdEntities`/`updatedEntities`.
- [ ] Preserve form input and suggestion review state on backend validation/provider errors.
- [ ] Add focused page tests for required input validation, submit/loading/error states, suggestion rendering, accept/reject actions, accepted links, and no saved-record presentation before accept.

---

# Out of Scope

Do not implement:

- [ ] Product/rule backend endpoints, AI backend workflows, provider adapters, or database writes.
- [ ] Product/rule creation directly from Angular outside the AI accept endpoint.
- [ ] Inventory lot creation, stock movement, product usage rule enforcement, quarantine, suggested tasks, or reminders.
- [ ] Direct AI provider calls, direct Supabase access, provider keys, or frontend-side provider configuration.
- [ ] Mandatory image upload if the backend Phase 23 implementation only supports text JSON.
- [ ] Bed planning or problem assist page behavior.

---

# Required Documents

Read before coding:

- [ ] `AGENTS.md`
- [ ] `docs/gardening-helper-implementation-agent-instructions.md`
- [ ] `docs/gardening-helper-ai-implementation-handoff-readme-v1.md`
- [ ] `docs/gardening-helper-implementation-instructions-for-ai-v1.md`
- [ ] `docs/gardening-helper-domain-rules-and-invariants-v1.md` AI, products, inventory, frontend boundary, and provider sections
- [ ] `docs/gardening-helper-canonical-api-contract-v1.md` AI product ingestion, product, product rule, shared envelope/error sections
- [ ] `docs/gardening-helper-testing-and-acceptance-spec-v1.md` AI product ingestion and acceptance tests
- [ ] `docs/gardening-helper-frontend-technical-spec-v1.md` AI product ingestion page, forms, and AI UX rules
- [ ] `docs/implementation-phases/phase-08-backend-products-and-usage-rules-api.md`
- [ ] `docs/implementation-phases/phase-10-frontend-products-and-inventory-pages.md`
- [ ] `docs/implementation-phases/phase-23-backend-ai-suggestion-workflows.md`
- [ ] `docs/implementation-phases/phase-24-frontend-ai-assistant-pages.md`
- [ ] `docs/implementation-phases/phase-24/01-ai-api-services-and-feature-scaffold.md`
- [ ] `docs/implementation-phases/phase-24/02-shared-ai-suggestion-card-and-review-state.md`
- [ ] Existing product/rule API services, forms, selectors, links, and tests

---

# Domain Rules Affected

This task touches:

- [ ] AI suggestions
- [ ] product usage rules
- [ ] inventory
- [ ] frontend forms
- [ ] API contract
- [ ] auth/session boundary
- [ ] provider adapter boundary

Important rules to preserve:

```text
AI output is not business truth until accepted.
Nothing is saved to products/product rules until suggestion is accepted.
Accepted AI payload must still pass backend validation.
Rejected suggestions create no business records.
Frontend must not calculate product/rule business truth as final.
Inventory is ledger-based and must not be changed by this page.
Frontend never accesses application tables directly.
AI provider keys are backend-only.
```

---

# MCP Impact

This task has no MCP impact.

---

# Required Implementation Details

Implement:

- [ ] frontend page/component
- [ ] frontend Reactive Form validation
- [ ] typed AI API service integration
- [ ] shared suggestion card integration
- [ ] created entity link mapping
- [ ] backend validation/provider error display
- [ ] tests

---

# Required Infrastructure/Security Boundaries

Preserve no direct frontend table access, no Fastify API bypass, no business logic in Angular components, no frontend service role key, no direct AI/model provider calls, no provider keys/config in frontend, no inventory mutation, and no trusted `accountId`.

---

# API Contract

Endpoints involved:

```text
POST /api/v1/ai/product-ingestion
POST /api/v1/ai/suggestions/:suggestionId/accept
POST /api/v1/ai/suggestions/:suggestionId/reject
```

Product ingestion JSON request may include:

```text
productName
labelText
```

Accept request may include:

```text
editedPayload
```

Request/response must follow `docs/gardening-helper-canonical-api-contract-v1.md`.

---

# Tests Required

Add or update tests for:

- [ ] product name/label text validation according to backend-supported input modes
- [ ] canonical product ingestion request
- [ ] provider/API error display without clearing form input
- [ ] product suggestion card rendering
- [ ] product rule suggestion card rendering
- [ ] accept with edited payload
- [ ] reject without business record link
- [ ] accepted state links to created product/rule
- [ ] no direct product/rule creation before accept
- [ ] no trusted `accountId`

Specific test cases:

1. Product ingestion form submits canonical JSON through `AiApiService` and renders returned suggestions as unaccepted suggestions.
2. Accepting a product suggestion sends `editedPayload` when the user changed fields and shows the backend-created product link.
3. Rejecting a product rule suggestion marks it rejected and does not show created entity links.
4. Backend validation/provider errors remain visible and do not clear input or suggestion edits.

---

# Acceptance Criteria

- [ ] `/ai/product-ingestion` works through backend AI endpoints only.
- [ ] Product and product rule suggestions are structured, editable, and visibly unaccepted until backend accept succeeds.
- [ ] Accepted suggestions link to backend-created entities.
- [ ] Rejected suggestions create no business-record UI.
- [ ] Focused page/API tests pass.
