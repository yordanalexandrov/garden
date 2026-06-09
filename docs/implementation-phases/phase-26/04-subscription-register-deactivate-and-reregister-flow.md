# Implementation Task - Phase 26 Step 4: Subscription Register, Deactivate, and Re-register Flow

## Role

You are the **Implementation Agent**. Use `AGENTS.md`, `docs/gardening-helper-implementation-agent-instructions.md`, `docs/gardening-helper-ai-implementation-handoff-readme-v1.md`, and all relevant specs for this task. The application data API remains the Fastify API under `/api/v1`.

---

# Task

## Goal

Wire the notification settings page to create a browser push subscription, register it with the Fastify API, deactivate backend subscriptions, and re-register when needed.

## Branch

Use branch:

```text
feature/frontend-notifications
```

---

# Scope

Implement only:

- [ ] Inspect the Step 1 `NotificationsApiService`, Step 2 browser push helper, and Step 3 settings page state model before editing.
- [ ] Implement the enable/register action flow: request permission if needed, wait for service worker readiness, create or reuse browser subscription, map it to canonical backend payload, and call `POST /api/v1/push/subscriptions`.
- [ ] Include `endpoint`, `keys.p256dh`, `keys.auth`, and `userAgent` in the backend register payload.
- [ ] Do not send trusted `accountId`, task IDs, reminder IDs, or scheduling data with the subscription payload.
- [ ] Refresh active backend subscription status after successful registration.
- [ ] Implement deactivate action through `POST /api/v1/push/subscriptions/:subscriptionId/deactivate` and update UI state.
- [ ] Decide whether browser unsubscribe should run on deactivate based on existing UX/state patterns; if implemented, keep backend deactivation authoritative and handle browser unsubscribe failures gracefully.
- [ ] Implement re-register action for stale/missing browser subscription, changed permission state, or backend deactivated state.
- [ ] Display canonical API errors and browser subscription errors with retry paths.
- [ ] Add focused tests for successful register, denied/unsupported prevention, malformed browser subscription handling, deactivate, re-register, API failure, and no `accountId`.

---

# Out of Scope

Do not implement:

- [ ] Backend push subscription endpoints, worker/scheduler behavior, raw Web Push adapter, `PushPort`, migrations, or reminder delivery.
- [ ] Frontend notification delivery handling beyond browser subscription registration.
- [ ] Frontend reminder timers, due-task polling for notifications, direct reminder payload creation, or task status changes.
- [ ] Any task/calendar mutations caused by notification success/failure.
- [ ] VAPID private key config.

---

# Required Documents

Read before coding:

- [ ] `AGENTS.md`
- [ ] `docs/gardening-helper-implementation-agent-instructions.md`
- [ ] `docs/gardening-helper-ai-implementation-handoff-readme-v1.md`
- [ ] `docs/gardening-helper-implementation-instructions-for-ai-v1.md`
- [ ] `docs/gardening-helper-domain-rules-and-invariants-v1.md` notification, account scoping, frontend, and task/reminder invariants
- [ ] `docs/gardening-helper-canonical-api-contract-v1.md` Push Notifications API
- [ ] `docs/gardening-helper-testing-and-acceptance-spec-v1.md` notifications settings acceptance and push boundary checks
- [ ] `docs/gardening-helper-frontend-technical-spec-v1.md` notifications/PWA behavior
- [ ] `docs/implementation-phases/phase-25-backend-push-notifications-and-worker-scheduler.md`
- [ ] `docs/implementation-phases/phase-26-frontend-notifications-and-pwa-registration.md`
- [ ] Earlier Phase 26 step files
- [ ] Existing notifications feature files, API service tests, browser push helper tests, settings page tests, and error display helpers

---

# Domain Rules Affected

This task touches:

- [ ] account scoping
- [ ] tasks/reminders
- [ ] frontend forms
- [ ] API contract
- [ ] auth/session boundary
- [ ] provider adapter boundary

Important rules to preserve:

```text
Push subscriptions belong to the authenticated account server-side.
Frontend must not submit accountId for normal flows.
Reminder delivery is backend-owned.
Reminders are created only for planned tasks by backend workflows.
Notifications are optional.
Notification failure must not change task status.
Frontend does not implement scheduler or delivery business logic.
VAPID private key is backend-only.
```

---

# MCP Impact

This task has no MCP impact.

---

# Required Implementation Details

Implement:

- [ ] frontend page/component action wiring
- [ ] browser subscription to API payload mapping
- [ ] backend register call
- [ ] backend deactivate call
- [ ] re-register flow
- [ ] API/browser error rendering
- [ ] tests
- [ ] boundary check updates if configured

---

# Required Infrastructure/Security Boundaries

Preserve these rules:

- [ ] no direct frontend access to application tables
- [ ] no bypass of the Fastify API for application data
- [ ] no business logic in Angular components beyond UI orchestration
- [ ] no Supabase service role key in frontend code/env/build output/logs
- [ ] no VAPID private key in frontend code/env/build output/logs/tests/docs examples
- [ ] no direct `push_subscriptions` table access
- [ ] no frontend reminder scheduler/timer/delivery worker
- [ ] no task status changes from notification registration/deactivation/failure
- [ ] account scoping enforced backend-side

---

# API Contract

Endpoints involved:

```text
POST /api/v1/push/subscriptions
GET /api/v1/push/subscriptions
POST /api/v1/push/subscriptions/:subscriptionId/deactivate
```

Register request shape:

```json
{
  "endpoint": "https://push-service.example/...",
  "keys": {
    "p256dh": "...",
    "auth": "..."
  },
  "userAgent": "Mozilla/5.0..."
}
```

Register response:

```json
{
  "data": {
    "registered": true
  }
}
```

Request/response must follow `docs/gardening-helper-canonical-api-contract-v1.md`.

---

# Tests Required

Add or update tests for:

- [ ] happy path registration
- [ ] payload mapping from browser `PushSubscription.toJSON()`
- [ ] missing `p256dh` or `auth` key handling
- [ ] denied permission preventing registration
- [ ] unsupported browser preventing registration
- [ ] backend API registration error rendering
- [ ] deactivate action calls canonical endpoint
- [ ] deactivate API error rendering
- [ ] re-register action after deactivation or missing browser subscription
- [ ] no trusted `accountId`, task ID, reminder ID, or scheduling payload sent

Specific test cases:

1. Enable/register creates or reuses a browser subscription and sends only `endpoint`, `keys`, and `userAgent` to the backend.
2. Registration failure displays the canonical backend error and keeps retry available.
3. Deactivate calls `POST /api/v1/push/subscriptions/:subscriptionId/deactivate` and refreshes active subscription state.
4. Re-register works after a backend deactivation state.
5. Notification registration/deactivation does not call any task status endpoint.

---

# Acceptance Criteria

- [ ] User can register a browser push subscription when the browser supports it and permission is granted.
- [ ] User can deactivate and re-register through the backend API.
- [ ] API and browser errors are visible and retryable.
- [ ] Subscription payload matches the canonical contract and does not include account or scheduling data.
- [ ] No frontend reminder delivery or task mutation behavior is introduced.
