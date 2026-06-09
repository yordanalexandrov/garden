# Implementation Task - Phase 25 Step 1: Notifications Module Contracts, Validation, and Route Wiring

## Role

You are the Implementation Agent for Gardening Helper.

Follow `AGENTS.md` and `docs/gardening-helper-implementation-agent-instructions.md`. Controllers stay thin; backend services own account scoping and notification workflow decisions.

---

# Task

## Goal

Implement the backend notifications module scaffold and canonical push subscription route contracts:

```text
Notifications module contracts, validation schemas, DTO mapping, and route registration for Phase 25 push subscription APIs.
```

## Branch

Use branch:

```text
feature/backend-push-worker
```

---

# Scope

Implement only:

- [ ] Inspect existing backend module, route registration, auth context, validation schema, canonical envelope, logger, error, and test helper patterns.
- [ ] Create the notifications module structure following existing backend conventions, unless the codebase already has an equivalent module location.
- [ ] Define typed push subscription request, persistence, service, and response DTO contracts.
- [ ] Add validation for `POST /api/v1/push/subscriptions`: `endpoint`, `keys.p256dh`, `keys.auth`, and optional `userAgent`.
- [ ] Add route wiring for:
  - `POST /api/v1/push/subscriptions`
  - `GET /api/v1/push/subscriptions`
  - `POST /api/v1/push/subscriptions/:subscriptionId/deactivate`
- [ ] Keep handlers thin: authenticate, validate, call service, return canonical envelopes.
- [ ] Ensure route code never accepts `accountId` from user input and always derives account context server-side.
- [ ] Add initial route/validation tests if local patterns support testing routes before repository/service completion; otherwise leave focused TODOs in step implementation notes and cover them in Step 5.

---

# Out of Scope

Do not implement:

- [ ] Push subscription repository persistence beyond interfaces/stubs needed for wiring.
- [ ] Raw Web Push/VAPID adapter or `PushPort`; that belongs to Step 3.
- [ ] Reminder delivery worker or scheduled scanning; that belongs to Step 4.
- [ ] Frontend PWA registration, service worker code, or browser subscription UI.
- [ ] Creating, confirming, or changing task reminders.
- [ ] Task status mutation from notification delivery.
- [ ] Schema changes or migrations unless a blocking mismatch is documented.

---

# Required Documents

Read before coding:

- [ ] `AGENTS.md`
- [ ] `docs/gardening-helper-implementation-agent-instructions.md`
- [ ] `docs/gardening-helper-ai-implementation-handoff-readme-v1.md`
- [ ] `docs/gardening-helper-implementation-instructions-for-ai-v1.md`
- [ ] `docs/gardening-helper-domain-rules-and-invariants-v1.md` section 19
- [ ] `docs/gardening-helper-canonical-api-contract-v1.md` section 23
- [ ] `docs/gardening-helper-testing-and-acceptance-spec-v1.md` push/reminder boundary requirements
- [ ] `docs/gardening-helper-backend-application-design-pack-v1.md` notifications and push sections
- [ ] `docs/implementation-phases/phase-25-backend-push-notifications-and-worker-scheduler.md`
- [ ] `docs/TASK_TEMPLATE.md`
- [ ] Existing backend route, validation, auth, envelope, error, and module registration files.

---

# Domain Rules Affected

This task touches:

- [ ] account scoping
- [ ] tasks/reminders
- [ ] API contract
- [ ] auth/session boundary
- [ ] provider adapter boundary
- [ ] worker/scheduler responsibility

Important rules to preserve:

```text
Backend owns business logic.
Frontend never accesses application tables directly.
Controllers stay thin.
Push subscription belongs to account.
Notifications are optional.
Reminder rows drive notification sending.
Notifications only for planned tasks.
Raw Web Push is behind PushPort.
Supabase service role key and VAPID private key are backend-only.
```

---

# MCP Impact

This task:

- [ ] changes backend behavior used by future MCP tools

MCP tools affected:

```text
Future MCP tools may read notification-related backend state only through backend services/API.
No MCP tool implementation is part of Phase 25.
```

Required MCP documentation updates:

```text
None unless canonical API behavior changes, which this task should avoid.
```

---

# Required Implementation Details

Implement:

- [ ] backend controller/route
- [ ] backend validation schema
- [ ] DTO/request/response contracts
- [ ] module registration
- [ ] auth/account context use
- [ ] tests where possible

---

# Required Infrastructure/Security Boundaries

Preserve these rules:

- [ ] no direct frontend access to application tables
- [ ] no bypass of the Fastify API for application data
- [ ] no business side-effect orchestration in database triggers
- [ ] no Supabase service role key in frontend code/env/build output/logs
- [ ] no direct Supabase SDK usage inside domain services except behind adapters
- [ ] backend validates JWTs and derives account context server-side
- [ ] account scoping enforced backend-side
- [ ] raw Web Push used through `PushPort`
- [ ] worker/scheduler ownership is explicit for reminder delivery

---

# API Contract

Endpoints involved:

```text
POST /api/v1/push/subscriptions
GET /api/v1/push/subscriptions
POST /api/v1/push/subscriptions/:subscriptionId/deactivate
```

Request/response must follow:

- `docs/gardening-helper-canonical-api-contract-v1.md` section 23
- Register response: `{ "data": { "registered": true } }`
- List response: `{ "data": { "items": [...] } }`
- Errors use canonical error envelopes.

---

# Tests Required

Add or update tests for:

- [ ] validation errors
- [ ] account scoping setup
- [ ] API response shape

Specific test cases:

1. Register validation rejects missing `endpoint`.
2. Register validation rejects missing `keys.p256dh`.
3. Register validation rejects missing `keys.auth`.
4. Routes derive account from auth context and do not accept user-provided `accountId`.
5. Route responses use canonical success and error envelopes.

---

# Acceptance Criteria

The task is complete when:

- [ ] Notifications module route wiring exists.
- [ ] Push subscription validation matches the canonical contract.
- [ ] Route handlers are thin and service-driven.
- [ ] Account context is derived from authenticated backend context.
- [ ] No provider adapter, worker, frontend, schema, task status, or reminder-creation scope slipped in.

---

# Commands to Run

From the backend package root, run relevant commands:

```bash
npm run typecheck
npm run lint
npm test
```

If any command does not exist or fails due to pre-existing setup, report it clearly.
