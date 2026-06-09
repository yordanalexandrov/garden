# Implementation Task - Phase 24 Step 7: Phase 24 Verification and PR Readiness

## Role

You are the **Implementation Agent**. Use `AGENTS.md`, `docs/gardening-helper-implementation-agent-instructions.md`, `docs/gardening-helper-ai-implementation-handoff-readme-v1.md`, and all relevant specs for this task. The application data API remains the Fastify API under `/api/v1`.

---

# Task

## Goal

Implement:

```text
Verify Phase 24 end to end, update implementation status, and prepare a focused PR.
```

## Branch

Use branch:

```text
feature/frontend-ai-assistant
```

---

# Scope

Implement only:

- [ ] Review all Phase 24 changes against the top-level Phase 24 spec and source-of-truth documents.
- [ ] Confirm no backend AI workflows, provider adapters, database migrations, infrastructure, push notification registration, weather behavior, worker/scheduler behavior, or MCP behavior slipped into Phase 24.
- [ ] Confirm AI Assistant routes, typed API services, product ingestion page, bed planning page, problem assist page, shared suggestion card, accept/reject flows, backend error display, and created-entity links satisfy the phase acceptance criteria.
- [ ] Confirm AI suggestions remain visually distinct from saved records before backend acceptance.
- [ ] Confirm accepted suggestions transition only from backend accept responses and rejected suggestions create no business-record UI.
- [ ] Confirm bed planning remains guidance only and does not mutate plantings, tasks, activities, or inventory.
- [ ] Confirm problem assist avoids diagnosis-as-fact wording and does not mutate problem/task/activity/photo/product/inventory data.
- [ ] Run required frontend verification commands from the frontend package root.
- [ ] Run any configured frontend boundary/static checks.
- [ ] Run `git diff --check` and review the final diff.
- [ ] Update `docs/gardening-helper-implementation-status-handoff.md` to mark Phase 24 implemented only when implementation is genuinely complete.
- [ ] Commit focused Phase 24 changes.
- [ ] Open a PR with a clear description, tests run, domain rules preserved, deferred work, and review focus.

---

# Out of Scope

Do not implement new feature behavior beyond small fixes needed to satisfy Phase 24 acceptance criteria, backend AI workflows, AI provider adapters, schema changes, push notifications, weather behavior, worker/scheduler behavior, MCP tools, deployment work, or direct provider/Supabase access.

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
- [ ] `docs/implementation-phases/phase-23-backend-ai-suggestion-workflows.md`
- [ ] `docs/implementation-phases/phase-24-frontend-ai-assistant-pages.md`
- [ ] All Phase 24 step files
- [ ] `docs/gardening-helper-implementation-status-handoff.md`
- [ ] Existing package scripts, boundary-check scripts, and final diff

---

# Domain Rules Affected

This task touches AI suggestions, product usage rules, target resolution, tasks/reminders, problems/photos, frontend forms, API contract, auth/session boundary, storage/file access boundary, and provider adapter boundary.

Important rules to preserve:

```text
Backend owns business logic.
Frontend submits user intent and displays backend results/errors.
AI output is not business truth until accepted.
AI acceptance is explicit and backend-owned.
Rejected suggestions create no business records.
Bed planning is guidance only.
AI problem assistance is not diagnosis.
Frontend never accesses application tables directly.
Frontend must not expose backend-only secrets or submit trusted accountId.
```

---

# MCP Impact

This task has no MCP impact.

---

# Required Implementation Details

Implement tests, docs/update notes, final verification, and PR preparation.

---

# Required Infrastructure/Security Boundaries

Preserve no direct frontend table access, no Fastify API bypass, no business logic in Angular components, no frontend service role key, no direct Storage business calls, no direct AI/model provider calls, no AI provider keys/SDKs/URLs in frontend code/config/tests, no frontend-owned business-record creation, no diagnosis-as-fact wording, and no trusted `accountId`.

---

# API Contract

Endpoints involved:

```text
POST /api/v1/ai/product-ingestion
POST /api/v1/ai/bed-planning
POST /api/v1/ai/problem-assist
POST /api/v1/ai/suggestions/:suggestionId/accept
POST /api/v1/ai/suggestions/:suggestionId/reject
```

Request/response must follow `docs/gardening-helper-canonical-api-contract-v1.md`.

---

# Tests Required

Run relevant commands:

```bash
cd frontend
npm run typecheck
npm run lint
npm test
npm run build
npm run check:frontend-boundaries
cd ..
git diff --check
```

If any command does not exist or fails due to pre-existing setup, report the exact command, exit state, and reason. Never claim checks passed unless they were run.

---

# Acceptance Criteria

- [ ] AI Assistant route shell works.
- [ ] Product ingestion page works through backend AI endpoints.
- [ ] Bed planning page works through backend AI endpoints and remains guidance-only.
- [ ] Problem assist page works through backend AI endpoints and avoids diagnosis wording.
- [ ] AI suggestion cards show structured editable suggestions.
- [ ] Accept/reject actions work through backend endpoints.
- [ ] Accepted suggestions link to created/updated entities returned by the backend.
- [ ] Rejected suggestions create no business-record UI.
- [ ] Warnings/uncertainty are visible.
- [ ] Backend validation/provider errors display without losing user input.
- [ ] Frontend tests/typecheck/lint/build and boundary checks pass where configured, or failures are documented exactly.
- [ ] `docs/gardening-helper-implementation-status-handoff.md` accurately reflects Phase 24 implementation progress.
- [ ] Final diff contains no unrelated changes.
- [ ] PR description is complete.

---

# PR Requirements

PR description must include Summary, Scope, Domain rules preserved, API changes, Database changes, Tests run, Deferred work, and Review focus.

Suggested PR summary:

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
- Bed planning remains guidance only.
- Problem assist is not presented as diagnosis.

## Tests
- <commands run and results>

## Deferred work
- Backend AI workflows, provider adapters, push notifications, and advanced chat UI remain deferred.

## Review focus
- Suggestion vs saved-truth distinction.
- Accept/reject UX and backend validation errors.
- Provider/database boundary.
- Mobile usability.
```
