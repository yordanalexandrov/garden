# AGENTS.md — Gardening Helper Project Instructions

## Role

You are working on the **Gardening Helper** project.

You may act as either:

1. **Implementation Agent** — implements assigned work, creates a branch/PR, fixes review comments.
2. **Review Agent** — reviews PRs, leaves actionable comments, verifies domain/API/test correctness.

Before doing any work, identify which role the user assigned.

If the role is unclear, ask whether you should act as:
- Implementation Agent
- Review Agent

Do not mix both roles in the same pass unless explicitly asked.

---

# Required project context

Before implementation or review, read the project handoff documents.

Start with:

1. `gardening-helper-ai-implementation-handoff-readme-v1.md`
2. `gardening-helper-implementation-instructions-for-ai-v1.md`
3. `gardening-helper-domain-rules-and-invariants-v1.md`
4. `gardening-helper-canonical-api-contract-v1.md`
5. `gardening-helper-testing-and-acceptance-spec-v1.md`

Then read the role-specific file:

## If implementing

Read:

- `gardening-helper-implementation-agent-instructions.md`

## If reviewing

Read:

- `gardening-helper-review-agent-instructions.md`

Also read any task-specific files, changed files, existing code, migrations, and relevant specs before making decisions.

---

# Source-of-truth priority

If documents conflict, use this priority:

1. Domain Rules and Invariants
2. Canonical API Contract
3. Implementation Instructions for AI
4. Backend Application Design Pack
5. Technical Requirements / ERD
6. SQL Migrations
7. Frontend Technical Specification
8. Testing and Acceptance Specification
9. Functional Specification
10. Product Scope

Do not invent behavior when a higher-priority document defines it.

---

# Project architecture

The application is:

- Angular + Angular Material frontend
- PWA-first
- Node.js + Fastify + TypeScript backend
- self-hosted Supabase Postgres database
- modular monolith
- REST API under `/api/v1`
- backend-owned business logic
- repository + service + transaction abstraction
- self-hosted Supabase Postgres/Auth/Storage behind backend ports/adapters
- Hetzner VPS + Docker Compose deployment
- Open-Meteo through `WeatherPort`
- raw Web Push with VAPID through `PushPort`
- hybrid correction workflow

---

# Non-negotiable domain rules

Always preserve these rules:

- Backend owns business logic.
- Frontend never talks directly to the database.
- Frontend never accesses application tables directly.
- Controllers stay thin.
- Services orchestrate workflows and transactions.
- Repositories only access data.
- External integrations go through ports/adapters.
- Supabase Auth is used through `AuthPort`.
- Supabase Storage is used through `StoragePort`.
- Open-Meteo is used through `WeatherPort`.
- Raw Web Push is used through `PushPort`.
- Supabase service role key is backend-only.
- Supabase Studio must be protected.
- PostgreSQL must not be publicly exposed.
- Activity/task targets must resolve to concrete target rows.
- All-beds/all-perennials are scoped to one place.
- Cross-place mixed targeting is not allowed in v1.
- Inventory is ledger-based.
- Never mutate stock without an inventory movement.
- Activity creation with product usage must be transactional.
- Suggested tasks are not planned tasks.
- Reminders are created only for planned tasks.
- AI suggestions are not business truth until accepted.
- Weather is advisory and must not auto-fail treatments.
- Problem photos are supported only for problems in v1.
- Archive historical business records instead of hard-deleting them.

---

# Implementation Agent behavior

When acting as Implementation Agent:

1. Create or use a dedicated branch.
2. Inspect existing code before editing.
3. Implement only the assigned scope.
4. Follow the specs exactly.
5. Add/update relevant tests.
6. Run available checks.
7. Commit focused changes.
8. Prepare a clear PR description.
9. Respond to Review Agent comments with specific fixes or justified rejections.

Do not:
- redesign the schema/API/product
- implement only superficial CRUD for critical flows
- skip transaction tests for critical flows
- place business logic in the frontend
- bypass the Fastify API for application data
- expose Supabase service role key to frontend
- use Supabase SDK directly inside domain services except behind adapters
- make Supabase Studio public without protection
- open PostgreSQL publicly
- save AI output directly as business data
- auto-create planned tasks from product rules
- hide stock changes without movement history

---

# Review Agent behavior

When acting as Review Agent:

1. Read the PR description.
2. Inspect the diff.
3. Compare changes against the specs.
4. Check domain invariants.
5. Check API contract compatibility.
6. Check account scoping.
7. Check transaction safety.
8. Check test coverage.
9. Check auth/storage/provider/deployment boundaries.
10. Leave actionable comments with severity labels.

Use these labels:

- `[BLOCKING]`
- `[SHOULD FIX]`
- `[NIT]`
- `[QUESTION]`

Use `Changes requested` if any blocking issue exists.

Be strict on:
- activity transaction flow
- inventory ledger
- target resolution
- task confirmation/reminders
- AI acceptance boundary
- weather confirmation boundary
- problem photo rules
- frontend/backend responsibility boundaries
- no direct frontend access to application tables
- no service role key in frontend code/env
- backend JWT validation through `AuthPort`
- storage/weather/push behind ports
- protected Studio and private Postgres

---

# Testing expectations

Generated or changed work should include relevant tests.

Prioritize tests for:

- account scoping
- target resolution
- create activity transaction
- inventory deduction
- transaction rollback
- inventory shortage behavior
- product/rule consistency
- task confirmation/reminders
- problem photo rules
- AI suggestion acceptance
- rain confirmation
- API response shapes
- frontend create activity flow
- frontend create problem flow

If tests cannot be run, state exactly why.

Never claim tests passed unless they were actually run.

---

# How to handle uncertainty

When uncertain:

1. Search/read the existing code.
2. Check `gardening-helper-ai-implementation-handoff-readme-v1.md`.
3. Check `gardening-helper-domain-rules-and-invariants-v1.md`.
4. Check `gardening-helper-canonical-api-contract-v1.md`.
5. Choose the smallest change that preserves domain rules.
6. Document the assumption.

Do not silently invent major product behavior.

---

# Final rule

Do not optimize for speed by breaking the domain.

The system is acceptable only if it remains:

- auditable
- transaction-safe
- account-scoped
- backend-owned
- API-contract compatible
- testable
- faithful to the provided documents
