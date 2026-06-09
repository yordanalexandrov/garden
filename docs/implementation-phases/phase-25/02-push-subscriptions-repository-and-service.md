# Implementation Task - Phase 25 Step 2: Push Subscriptions Repository and Service

## Role

You are the Implementation Agent for Gardening Helper.

Follow `AGENTS.md` and `docs/gardening-helper-implementation-agent-instructions.md`. Services own subscription workflow decisions; repositories only access data.

---

# Task

## Goal

Implement account-scoped push subscription persistence and service workflows:

```text
Register/reactivate, list active, and deactivate push subscriptions for the current account.
```

## Branch

Use branch:

```text
feature/backend-push-worker
```

---

# Scope

Implement only:

- [ ] Inspect existing repository/service patterns, transaction runner usage, audit/logging style, Kysely types, route tests, and account-scope helpers.
- [ ] Implement `PushSubscriptionsRepository` or local equivalent for `push_subscriptions`.
- [ ] Implement create/reactivate behavior by endpoint using existing unique indexes: `uq_push_subscriptions_endpoint` and `ux_push_subscriptions_active_endpoint`.
- [ ] Ensure a subscription row is always associated with exactly one backend-derived `accountId`.
- [ ] Implement active-only list for the current account.
- [ ] Implement account-scoped deactivation by `subscriptionId`.
- [ ] Decide and document how endpoint reuse across accounts is handled based on existing DB uniqueness constraints; do not silently let one account operate another account's subscription.
- [ ] Map database conflicts or cross-account access to canonical application errors.
- [ ] Add focused repository/service tests for happy path, reactivation, listing, deactivation, and cross-account rejection.

---

# Out of Scope

Do not implement:

- [ ] Raw Web Push sending or `PushPort` adapter logic.
- [ ] Reminder delivery worker.
- [ ] Frontend subscription registration UI.
- [ ] Exposing VAPID private key or subscription secrets to frontend.
- [ ] Task or reminder status changes.
- [ ] Schema redesign or new migrations unless a blocking mismatch is documented.
- [ ] Direct Supabase SDK usage inside services or repositories.

---

# Required Documents

Read before coding:

- [ ] `AGENTS.md`
- [ ] `docs/gardening-helper-implementation-agent-instructions.md`
- [ ] `docs/gardening-helper-ai-implementation-handoff-readme-v1.md`
- [ ] `docs/gardening-helper-implementation-instructions-for-ai-v1.md`
- [ ] `docs/gardening-helper-domain-rules-and-invariants-v1.md` section 19
- [ ] `docs/gardening-helper-canonical-api-contract-v1.md` section 23
- [ ] `docs/gardening-helper-testing-and-acceptance-spec-v1.md`
- [ ] `docs/gardening-helper-backend-application-design-pack-v1.md` `PushSubscriptionsRepository` and notification service sections
- [ ] `docs/gardening-helper-technical-requirements-and-erd.md` `push_subscriptions`
- [ ] `docs/001_initial_schema_gardening_helper.sql`
- [ ] `docs/004_guards_and_triggers_gardening_helper.sql`
- [ ] `docs/implementation-phases/phase-25-backend-push-notifications-and-worker-scheduler.md`
- [ ] Existing backend repository, service, error, DB type, and test helper files.

---

# Domain Rules Affected

This task touches:

- [ ] account scoping
- [ ] API contract
- [ ] database/migrations
- [ ] auth/session boundary
- [ ] provider adapter boundary

Important rules to preserve:

```text
Backend owns business logic.
Services orchestrate workflows.
Repositories only access data.
Push subscription belongs to account.
Push subscriptions are revocable/deactivatable.
Notifications are optional.
Frontend never accesses application tables directly.
```

---

# MCP Impact

This task:

- [ ] changes backend behavior used by future MCP tools

MCP tools affected:

```text
Future tools must not bypass account-scoped backend subscription service/API.
No MCP tool implementation is part of Phase 25.
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
- [ ] account-scoped persistence
- [ ] canonical DTO mapping support
- [ ] conflict/cross-account error mapping
- [ ] tests

---

# Required Infrastructure/Security Boundaries

Preserve these rules:

- [ ] no direct frontend access to application tables
- [ ] no bypass of the Fastify API for application data
- [ ] no business side-effect orchestration in database triggers
- [ ] no Supabase service role key in frontend code/env/build output/logs
- [ ] no direct Supabase SDK usage inside domain services except behind adapters
- [ ] account scoping enforced backend-side
- [ ] raw Web Push used through `PushPort` only when sending is implemented later

---

# API Contract

Endpoints supported by this service:

```text
POST /api/v1/push/subscriptions
GET /api/v1/push/subscriptions
POST /api/v1/push/subscriptions/:subscriptionId/deactivate
```

Preserve:

```text
Register/reactivate returns registered: true.
List returns active subscriptions for current account only.
Deactivate uses canonical success envelope.
No trusted accountId accepted as user input.
```

---

# Tests Required

Add or update tests for:

- [ ] happy path
- [ ] validation errors
- [ ] account scoping
- [ ] API response shape support
- [ ] edge cases

Specific test cases:

1. Register creates an active subscription for the authenticated account.
2. Register reactivates or updates an existing inactive subscription according to documented behavior.
3. List returns active subscriptions for account A only.
4. List excludes inactive subscriptions.
5. Deactivate succeeds for the owning account.
6. Deactivate rejects or returns not found for a cross-account subscription.
7. Endpoint uniqueness conflicts do not allow account A to take over account B's subscription silently.

---

# Acceptance Criteria

The task is complete when:

- [ ] Push subscription persistence is account-scoped.
- [ ] Register/list/deactivate service behavior supports the canonical routes.
- [ ] Cross-account access is rejected or hidden consistently with existing API patterns.
- [ ] Repository code remains data-access-only.
- [ ] No worker, provider send, frontend, schema, task status, or reminder-creation scope slipped in.

---

# Commands to Run

From the backend package root, run relevant commands:

```bash
npm run typecheck
npm run lint
npm test
npm run test:db
```

If any command does not exist or fails due to pre-existing setup, report it clearly.
