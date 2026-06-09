# Implementation Task - Phase 24 Step 2: Shared AI Suggestion Card and Review State

## Role

You are the **Implementation Agent**.

Use `AGENTS.md`, `docs/gardening-helper-implementation-agent-instructions.md`, `docs/gardening-helper-ai-implementation-handoff-readme-v1.md`, and all relevant specs for this task. The application data API remains the Fastify API under `/api/v1`.

---

# Task

## Goal

Implement reusable AI suggestion review UI that presents AI output as editable, explicitly unaccepted suggestions until backend accept/reject actions complete.

## Branch

Use branch:

```text
feature/frontend-ai-assistant
```

---

# Scope

Implement only:

- [ ] Inspect existing shared card/status-chip/error-summary/form-field patterns and page action button conventions.
- [ ] Implement `app-ai-suggestion-card` or an equivalent shared component following existing frontend naming/location patterns.
- [ ] Support suggestion statuses needed by the UI: unaccepted/review, accepting, accepted, rejecting, rejected, and error.
- [ ] Render `suggestionType`, structured payload fields, warnings/uncertainty, backend validation errors, and optional created/updated entity links.
- [ ] Provide Reactive Form-backed editable payload sections for suggestion types where the accept endpoint supports `editedPayload`.
- [ ] Emit accept and reject events with the suggestion id and optional edited payload; keep the backend API call in page/container code or a thin facade, following existing architecture.
- [ ] Disable duplicate accept/reject clicks while a request is in flight.
- [ ] Preserve edited values and visible backend validation errors after failed accept.
- [ ] Clearly distinguish suggestions from saved records through label/status/icon/color semantics already used by the app.
- [ ] Add focused component tests for rendering, edit preservation, warning visibility, accept/reject events, accepted links, rejected state, and backend error display.

Expected paths, unless existing code clearly establishes a better equivalent:

```text
frontend/src/app/features/ai/components/
frontend/src/app/features/ai/models/
frontend/src/app/shared/
frontend/src/app/features/ai/**/*.spec.ts
```

---

# Out of Scope

Do not implement:

- [ ] Page-specific product ingestion, bed planning, or problem assist submission workflows.
- [ ] Backend accept/reject logic, transactions, repositories, providers, or audit logging.
- [ ] Frontend-created business records or local persistence that treats suggestions as saved truth.
- [ ] Bed planting/task/problem/product mutations outside backend AI accept endpoints.
- [ ] Direct provider calls, provider SDK imports, provider keys, Supabase table/storage access, or raw feature-component `HttpClient`.

---

# Required Documents

Read before coding:

- [ ] `AGENTS.md`
- [ ] `docs/gardening-helper-implementation-agent-instructions.md`
- [ ] `docs/gardening-helper-ai-implementation-handoff-readme-v1.md`
- [ ] `docs/gardening-helper-implementation-instructions-for-ai-v1.md`
- [ ] `docs/gardening-helper-domain-rules-and-invariants-v1.md` AI and frontend responsibility sections
- [ ] `docs/gardening-helper-canonical-api-contract-v1.md` AI suggestion payload and accept/reject sections
- [ ] `docs/gardening-helper-testing-and-acceptance-spec-v1.md` AI suggestion acceptance and UI boundary sections
- [ ] `docs/gardening-helper-frontend-technical-spec-v1.md` `app-ai-suggestion-card`, AI output presentation, acceptance, rejection, and uncertainty rules
- [ ] `docs/implementation-phases/phase-24-frontend-ai-assistant-pages.md`
- [ ] `docs/implementation-phases/phase-24/01-ai-api-services-and-feature-scaffold.md`
- [ ] Existing shared cards, chips, buttons, forms, error summaries, and test helpers

---

# Domain Rules Affected

This task touches:

- [ ] AI suggestions
- [ ] frontend forms
- [ ] API contract
- [ ] auth/session boundary
- [ ] provider adapter boundary

Important rules to preserve:

```text
AI output is a suggestion.
AI output must be reviewable.
AI output becomes business data only after explicit user acceptance through the backend.
Rejected suggestions create no business records.
AI uncertainty/warnings must be visible.
AI does not replace backend validation.
Frontend is not business truth.
```

---

# MCP Impact

This task has no MCP impact.

---

# Required Implementation Details

Implement:

- [ ] frontend shared component
- [ ] frontend form validation
- [ ] suggestion status model
- [ ] created/updated entity link model
- [ ] backend error display model
- [ ] tests

---

# Required Infrastructure/Security Boundaries

Preserve no direct frontend table access, no Fastify API bypass, no business truth in Angular components, no frontend service role key, no direct AI/model provider calls, no provider keys/config in frontend, and no trusted `accountId`.

---

# API Contract

The component prepares UI data for:

```text
POST /api/v1/ai/suggestions/:suggestionId/accept
POST /api/v1/ai/suggestions/:suggestionId/reject
```

Accept request may include:

```text
editedPayload
```

The component must not call these endpoints directly unless the existing frontend pattern puts API calls in smart components. Request/response shapes must follow `docs/gardening-helper-canonical-api-contract-v1.md`.

---

# Tests Required

Add or update tests for:

- [ ] suggestion-only rendering before accept
- [ ] structured payload field rendering
- [ ] editable payload change emission
- [ ] warning/uncertainty rendering
- [ ] accept event includes optional edited payload
- [ ] reject event includes only suggestion id
- [ ] accepted state shows created/updated entity links
- [ ] rejected state does not show created entity links
- [ ] backend validation errors remain visible and do not clear edited input

Specific test cases:

1. Unaccepted suggestions render with explicit suggestion status and no saved-record link.
2. Editing a product payload emits `editedPayload` only on accept.
3. Backend validation errors after failed accept remain visible without resetting user edits.
4. Accepted suggestions show backend-created entity links from `createdEntities`/`updatedEntities`.

---

# Acceptance Criteria

- [ ] Reusable suggestion card/review UI exists and is covered by focused tests.
- [ ] Suggestions remain visually distinct from saved records until backend acceptance succeeds.
- [ ] Warnings and backend validation errors are visible.
- [ ] Accept/reject state transitions are deterministic and do not create frontend-owned business truth.
