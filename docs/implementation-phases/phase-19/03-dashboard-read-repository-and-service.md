# Implementation Task - Phase 19 Step 3: Dashboard Read Repository and Service

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
Build the account-scoped dashboard read repository and service that returns Phase 19 summary buckets without frontend data stitching.
```

## Branch

Use branch:

```text
feature/backend-calendar-dashboard
```

---

# Scope

Implement only:

- [ ] Inspect existing task, quarantine, activity, problem, inventory, product, and place repository read patterns.
- [ ] Implement dashboard repository reads for upcoming planned tasks.
- [ ] Implement dashboard repository reads for suggested tasks separately from planned tasks.
- [ ] Implement dashboard repository reads for active quarantine periods.
- [ ] Implement dashboard repository reads for recent activities.
- [ ] Implement dashboard repository reads for open problems.
- [ ] Implement dashboard repository reads for low-stock products using existing product/inventory balances or existing inventory read helpers.
- [ ] Implement dashboard repository reads for places.
- [ ] Apply authenticated `accountId` scope to every query.
- [ ] Apply optional `placeId` filter where the bucket has place scope, after confirming the place belongs to the actor account.
- [ ] Keep low-stock behavior faithful to existing inventory/product fields; document any threshold assumption if no canonical threshold exists in higher-priority docs.
- [ ] Implement a dashboard service that orchestrates read-only bucket queries and maps them to canonical camelCase DTOs.
- [ ] Add focused tests for dashboard bucket shape, filtering, account scoping, and read-only behavior.

Expected paths, unless existing code clearly establishes a better equivalent:

```text
backend/src/modules/dashboard/dashboard.repository.ts
backend/src/modules/dashboard/dashboard.service.ts
backend/src/modules/dashboard/dashboard.dto.ts
backend/test/dashboard/
```

---

# Out of Scope

Do not implement:

- [ ] `GET /api/v1/calendar`.
- [ ] Task creation, confirmation, dismissal, completion, reminder generation, or notification behavior.
- [ ] Activity/problem/inventory mutations.
- [ ] Product usage rule evaluation or inventory deduction.
- [ ] Weather generation, rain confirmation, or provider calls.
- [ ] Frontend dashboard UI.
- [ ] Push, worker/scheduler, AI, storage, deployment, or MCP behavior.
- [ ] Schema changes or migrations.
- [ ] Frontend-side dashboard aggregation as the primary behavior.

---

# Required Documents

Read before coding:

- [ ] `AGENTS.md`
- [ ] `docs/gardening-helper-implementation-agent-instructions.md`
- [ ] `docs/gardening-helper-ai-implementation-handoff-readme-v1.md`
- [ ] `docs/gardening-helper-implementation-instructions-for-ai-v1.md`
- [ ] `docs/gardening-helper-domain-rules-and-invariants-v1.md` sections 14, 15, and inventory/problem invariants
- [ ] `docs/gardening-helper-canonical-api-contract-v1.md` section 24.1
- [ ] `docs/gardening-helper-testing-and-acceptance-spec-v1.md` dashboard aggregation, account-scope, and performance sections
- [ ] `docs/gardening-helper-backend-application-design-pack-v1.md` API response conventions and calendar/dashboard read model sections
- [ ] `docs/001_initial_schema_gardening_helper.sql`
- [ ] `docs/002_views_gardening_helper.sql`
- [ ] `docs/004_guards_and_triggers_gardening_helper.sql`
- [ ] `docs/implementation-phases/phase-09-backend-inventory-ledger-api.md`
- [ ] `docs/implementation-phases/phase-12-backend-activity-transaction-flow.md`
- [ ] `docs/implementation-phases/phase-15-backend-problems-and-observations-api.md`
- [ ] `docs/implementation-phases/phase-18-backend-task-lifecycle-and-reminders.md`
- [ ] `docs/implementation-phases/phase-19-backend-calendar-and-dashboard-read-apis.md`
- [ ] `docs/TASK_TEMPLATE.md`
- [ ] Existing task, quarantine, activity, problem, inventory, product, place, db, repository, and backend test helper files touched by the task.

---

# Domain Rules Affected

This task touches:

- [ ] account scoping
- [ ] activities
- [ ] inventory
- [ ] quarantine
- [ ] tasks/reminders
- [ ] problems/photos
- [ ] API contract
- [ ] database/migrations

Important rules to preserve:

```text
Dashboard is a read model over existing business data.
Backend owns business logic and read aggregation.
Suggested tasks are not planned tasks.
Reminders are created only for planned tasks.
Inventory is ledger-based; dashboard reads must not mutate stock.
Never mutate stock without an inventory movement.
Problems and observations remain historical records.
API responses must not leak inaccessible data.
```

---

# MCP Impact

This task:

- [ ] changes backend behavior used by future MCP tools

MCP tools affected:

```text
None in Phase 19.
```

Required MCP documentation updates:

```text
None.
```

---

# Required Implementation Details

Implement:

- [ ] backend service method
- [ ] repository methods
- [ ] DTO mapping helpers
- [ ] account/place filtering
- [ ] tests

Remove or ignore template items that are not relevant.

---

# Required Infrastructure/Security Boundaries

Preserve these rules:

- [ ] no direct frontend access to application tables
- [ ] no bypass of the Fastify API for application data
- [ ] no business side-effect orchestration in database triggers
- [ ] backend validates JWTs and derives account context server-side
- [ ] account scoping enforced backend-side on every query
- [ ] no provider calls from dashboard reads

---

# API Contract

Endpoint involved:

```text
GET /api/v1/dashboard
```

Response buckets:

```text
upcomingTasks
suggestedTasks
activeQuarantinePeriods
recentActivities
openProblems
lowStockProducts
places
```

Request/response must follow:

- `docs/gardening-helper-canonical-api-contract-v1.md`
- Canonical success and error envelopes

---

# Tests Required

Add or update tests for:

- [ ] happy path
- [ ] account scoping
- [ ] API response shape
- [ ] edge cases

Specific test cases:

1. Dashboard returns every canonical bucket, even when a bucket is empty.
2. Upcoming planned tasks and suggested tasks are separate.
3. Active quarantine periods only include active/current windows.
4. Recent activities and open problems are account-scoped and place-filtered when requested.
5. Low-stock products are read from existing inventory/product data without inventory mutations.
6. Account A cannot see Account B dashboard data.
7. Dashboard read does not mutate task, inventory, problem, activity, quarantine, or place rows.

---

# Acceptance Criteria

The task is complete when:

- [ ] Dashboard service returns every canonical bucket.
- [ ] Optional place filtering is account-scoped.
- [ ] Suggested and planned task buckets remain distinct.
- [ ] Inventory dashboard reads do not mutate ledger or lots.
- [ ] Tests cover dashboard shape, filters, account scoping, and read-only behavior.
- [ ] No unrelated changes are included.

---

# Commands to Run

Run relevant commands from the backend package root:

```bash
npm run typecheck
npm run lint
npm test
npm run test:db
```

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
