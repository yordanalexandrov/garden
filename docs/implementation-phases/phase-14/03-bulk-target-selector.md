# Implementation Task - Phase 14 Step 3: Bulk Target Selector

## Role

You are the **Implementation Agent**.

Use:

- `AGENTS.md`
- `docs/gardening-helper-implementation-agent-instructions.md`
- `docs/gardening-helper-ai-implementation-handoff-readme-v1.md`
- all relevant specs for this task

The application data API remains the Fastify API under `/api/v1`.

---

# Task

## Goal

Implement:

```text
Create the reusable app-bulk-target-selector component for activity target intent selection using canonical target scope and targetSelection DTOs.
```

## Branch

Use branch:

```text
feature/frontend-create-activity
```

---

# Scope

Implement only:

- [ ] Inspect existing place, perennial, bed, yearly planting, persistent bed plant selector/list services and shared form component patterns.
- [ ] Create reusable `app-bulk-target-selector`.
- [ ] Support canonical target scopes:
  - `whole_place`
  - `all_perennials_in_place`
  - `selected_perennials`
  - `all_beds_in_place`
  - `selected_beds`
  - `single_bed`
  - `selected_yearly_plantings`
  - `selected_persistent_bed_plants`
- [ ] Disable or clearly block place-scoped target controls until a place is selected.
- [ ] Fetch selectable items through existing typed API services based on selected place and scope.
- [ ] Provide search/filterable selection UI where IDs must be selected.
- [ ] Show selection chips, selected count, target summary, loading states, and empty states.
- [ ] Emit only canonical `targetScopeType` and structured `targetSelection` user intent.
- [ ] Do not emit resolved target rows as final business truth.
- [ ] Keep the component usable in single-column mobile layouts.
- [ ] Add component tests for scope changes, selected item output, empty states, disabled states, and canonical emissions.

---

# Out of Scope

Do not implement:

- [ ] Create activity page submit behavior.
- [ ] Backend target resolver behavior.
- [ ] Frontend target resolution as business truth.
- [ ] Cross-place validation as final authority.
- [ ] Inventory, quarantine, suggested task, weather, AI, correction, or problem/photo flows.
- [ ] Direct Supabase application-table or storage calls.

---

# Required Documents

Read before coding:

- [ ] `AGENTS.md`
- [ ] `docs/gardening-helper-implementation-agent-instructions.md`
- [ ] `docs/gardening-helper-ai-implementation-handoff-readme-v1.md`
- [ ] `docs/gardening-helper-implementation-instructions-for-ai-v1.md`
- [ ] `docs/gardening-helper-domain-rules-and-invariants-v1.md` targeting and frontend boundary sections
- [ ] `docs/gardening-helper-canonical-api-contract-v1.md` shared target enum/DTO sections
- [ ] `docs/gardening-helper-testing-and-acceptance-spec-v1.md` target selector/frontend tests
- [ ] `docs/gardening-helper-frontend-technical-spec-v1.md` Create activity page and Bulk target selector sections
- [ ] `docs/implementation-phases/phase-07-frontend-garden-structure-pages.md`
- [ ] `docs/implementation-phases/phase-12-backend-activity-transaction-flow.md`
- [ ] `docs/implementation-phases/phase-14-frontend-activities-and-create-activity-flow.md`
- [ ] Existing selector/list API services and shared form-control patterns

---

# Domain Rules Affected

This task touches:

- [ ] account scoping
- [ ] target resolution
- [ ] activities
- [ ] frontend forms
- [ ] API contract

Important rules to preserve:

```text
Frontend selection is not trusted.
Backend must validate selected IDs, account ownership, place membership, and active status.
Activity/task targets must resolve to concrete target rows backend-side.
The activity header stores original target scope selected by the user.
The frontend may display, preview, validate basic input, and submit user intent.
Frontend must not decide concrete resolved target rows as final truth.
All-beds/all-perennials are scoped to one place.
Cross-place mixed targeting is not allowed in v1 and remains a backend-enforced invariant.
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

- [ ] frontend component
- [ ] frontend form validation
- [ ] typed selector API consumption
- [ ] mobile-friendly selection UI
- [ ] tests
- [ ] static/boundary check updates if relevant

---

# Required Infrastructure/Security Boundaries

Preserve these rules:

- [ ] no direct frontend access to application tables
- [ ] no bypass of the Fastify API for application data
- [ ] no business logic in Angular components
- [ ] no Supabase service role key in frontend code/env/build output/logs
- [ ] no direct Supabase Storage business calls
- [ ] no frontend final target resolution truth
- [ ] no frontend cross-account or cross-place trust

---

# API Contract

Endpoints involved:

```text
Supporting selector/list endpoints for places, beds, perennials, yearly plantings, and persistent bed plants
POST /api/v1/activities consumes the emitted targetScopeType and targetSelection in later steps
```

Request/response must follow:

- `docs/gardening-helper-canonical-api-contract-v1.md`

---

# Tests Required

Add or update tests for:

- [ ] scope selection behavior
- [ ] disabled place-dependent controls before place selection
- [ ] selected beds/perennials multi-select output
- [ ] single bed output
- [ ] yearly and persistent bed plant selection output
- [ ] all beds/all perennials count or empty state display
- [ ] canonical `targetScopeType` and `targetSelection` emissions
- [ ] no resolved target rows emitted as final truth

Specific test cases:

1. Changing scope from `selected_beds` to `all_beds_in_place` clears selected IDs and emits the canonical all-beds intent.
2. Selected perennial IDs emit under canonical `targetSelection`, not as `resolvedTargets`.
3. The component shows an empty state when a selected place has no eligible targets for the chosen scope.
4. The component disables target selection until `placeId` is available.

---

# Acceptance Criteria

The task is complete when:

- [ ] `app-bulk-target-selector` supports every canonical v1 activity target scope.
- [ ] It emits canonical target intent suitable for `POST /activities`.
- [ ] It does not calculate or emit resolved target rows as business truth.
- [ ] It is reusable by activity and future task forms.
- [ ] Focused component tests pass.
