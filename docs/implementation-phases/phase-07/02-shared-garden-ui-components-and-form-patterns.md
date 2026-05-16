# Implementation Task - Phase 7 Step 2: Shared Garden UI Components and Form Patterns

## Role

You are the **Implementation Agent**.

Use:
- `AGENTS.md`
- `docs/gardening-helper-implementation-agent-instructions.md`
- `docs/gardening-helper-ai-implementation-handoff-readme-v1.md`
- all relevant specs for this task

Final infrastructure/provider decisions:
- Deployment: Hetzner VPS + Docker Compose
- Database: self-hosted Supabase Postgres
- Auth: self-hosted Supabase Auth through `AuthPort`
- Storage: self-hosted Supabase Storage through `StoragePort`
- Weather: Open-Meteo through `WeatherPort`
- Push: raw Web Push with VAPID through `PushPort`
- Correction workflow: hybrid correction model

The application data API remains the Fastify API under `/api/v1`.

---

# Task

## Goal

Implement:

```text
Create reusable Phase 7 UI components and form helpers for garden pages, including page headers, empty states, archive confirmations, plant selection, year selection, status controls, and API error rendering.
```

## Branch

Use branch:

```text
feature/frontend-garden-structure
```

---

# Scope

Implement only:

- [ ] Inspect existing shared component, Angular Material, form, notification, and API error patterns.
- [ ] Add or reuse a page header/action layout component for feature pages.
- [ ] Add or reuse empty-state and loading/error-state components for list pages.
- [ ] Add or reuse a confirmation dialog for archive actions.
- [ ] Add plant selector/search component or form control helper backed by the typed Plants API service.
- [ ] Add year selector component/control for bed yearly planting views.
- [ ] Add status display/control helpers for perennials, beds, persistent bed plants, and yearly plantings.
- [ ] Add reusable API validation error rendering for field-level and form-level messages.
- [ ] Use Angular Material controls and Reactive Forms patterns.
- [ ] Keep components presentation-focused and typed.
- [ ] Add focused component tests.

Expected paths, unless existing code clearly establishes a better equivalent:

```text
frontend/src/app/shared/components/page-header/
frontend/src/app/shared/components/empty-state/
frontend/src/app/shared/components/confirm-dialog/
frontend/src/app/shared/components/year-selector/
frontend/src/app/shared/components/status-chip/
frontend/src/app/shared/forms/api-error-summary/
frontend/src/app/features/plants/components/plant-selector/
frontend/src/app/shared/**/*.spec.ts
```

---

# Out of Scope

Do not implement:

- [ ] Full places, plants, perennials, beds, or planting pages.
- [ ] Backend behavior.
- [ ] Business-rule decisions owned by backend services.
- [ ] Product selection, target selection for activities, photo upload, weather, AI, push, storage, inventory, task, problem, calendar, or MCP behavior.
- [ ] Direct Supabase application-table or storage calls.

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
- [ ] `docs/gardening-helper-frontend-technical-spec-v1.md`
- [ ] `docs/implementation-phases/phase-07-frontend-garden-structure-pages.md`
- [ ] `docs/implementation-phases/phase-07/01-garden-structure-api-services-and-feature-scaffold.md`
- [ ] `docs/TASK_TEMPLATE.md`
- [ ] Existing frontend shared components, form utilities, Angular Material setup, API error mapper, and tests

---

# Domain Rules Affected

This task touches:

- [ ] frontend forms
- [ ] API contract

Important rules to preserve:

```text
Frontend is not business truth.
Frontend may validate basic input for UX, but backend validation remains authoritative.
Archive historical business records instead of hard-deleting them.
Plant records should be selected/reused before creating unnecessary duplicates.
Yearly bed plantings are calendar-year based.
Persistent bed plants stay until explicitly removed or archived.
API errors must be visible to the user.
```

---

# MCP Impact

This task:

- [ ] has no MCP impact

MCP tools affected:

```text
None.
```

Required MCP documentation updates:

```text
None.
```

---

# Required Implementation Details

Implement:

- [ ] frontend shared components
- [ ] frontend form validation helpers
- [ ] frontend API error rendering
- [ ] archive confirmation dialog
- [ ] plant selector
- [ ] year selector
- [ ] status display/control helpers
- [ ] tests

Remove or ignore template items that are not relevant.

---

# Required Infrastructure/Security Boundaries

Preserve these rules:

- [ ] no direct frontend access to application tables
- [ ] no bypass of the Fastify API for application data
- [ ] no business logic in Angular components
- [ ] no Supabase service role key in frontend code/env/build output/logs
- [ ] no direct Supabase Storage business calls
- [ ] account scoping enforced backend-side
- [ ] Supabase Auth used only for auth/session flows

---

# API Contract

Endpoints involved:

```text
GET /api/v1/plants
```

The plant selector must consume the typed Plants API service and must not directly call `HttpClient` or Supabase table APIs.

---

# Tests Required

Add or update tests for:

- [ ] frontend form behavior
- [ ] API response/error rendering
- [ ] archive confirmation behavior
- [ ] edge cases

Specific test cases:

1. Confirm dialog requires explicit user confirmation before an archive callback runs.
2. API error summary renders form-level backend messages.
3. API error helper maps backend field details to matching form controls where practical.
4. Plant selector calls the Plants API service with search text and displays returned plants.
5. Plant selector does not emit raw untyped API rows.
6. Year selector emits a calendar year and does not mutate planting data by itself.
7. Status helpers expose only allowed status values for each entity type.
8. Shared components remain keyboard reachable and have accessible labels for critical actions.

---

# Acceptance Criteria

The task is complete when:

- [ ] Reusable Phase 7 UI/form components exist or existing components are extended consistently.
- [ ] Archive actions can be wired through a confirmation dialog.
- [ ] Plant selector, year selector, status helpers, and API error rendering are available to later Phase 7 pages.
- [ ] Components use Angular Material and Reactive Forms where forms are involved.
- [ ] Components do not implement backend-owned business decisions.
- [ ] Tests cover confirmation, selectors, error rendering, and status option behavior.
- [ ] No backend, schema, provider, MCP, or unrelated frontend workflow changes are introduced.
- [ ] Relevant checks pass or unavailable commands are reported exactly.

---

# Commands to Run

From the frontend package root, run relevant commands:

```bash
npm run typecheck
npm run lint
npm test
npm run build
```

Run frontend boundary/static checks if configured.

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

---

# Notes for Implementation Agent

Do not redesign the product.

