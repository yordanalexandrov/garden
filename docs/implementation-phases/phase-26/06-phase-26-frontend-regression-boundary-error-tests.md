# Implementation Task - Phase 26 Step 6: Frontend Regression, Boundary, and Error Tests

## Role

You are the **Implementation Agent**. Use `AGENTS.md`, `docs/gardening-helper-implementation-agent-instructions.md`, `docs/gardening-helper-ai-implementation-handoff-readme-v1.md`, and all relevant specs for this task. The application data API remains the Fastify API under `/api/v1`.

---

# Task

## Goal

Add focused Phase 26 frontend regression, API-contract, permission-state, error-display, PWA, and static boundary tests.

## Branch

Use branch:

```text
feature/frontend-notifications
```

---

# Scope

Implement only:

- [ ] Review tests added in Phase 26 Steps 1-5 and fill coverage gaps.
- [ ] Add or update API service tests for notification subscription canonical endpoint usage and response envelope mapping.
- [ ] Add page/component tests for permission states, unsupported browser states, missing public key, offline state where supported, API errors, loading states, register/deactivate/re-register actions, and no hard app failure.
- [ ] Add browser-helper tests for service worker readiness, `PushManager.subscribe`, existing subscription reuse, unsubscribe behavior, and VAPID public key conversion.
- [ ] Add tests proving tasks, calendar, and dashboard are not gated by notification permission, subscription state, or registration errors.
- [ ] Add static/boundary checks or extend existing frontend boundary checks to guard against direct Supabase application-table access, direct Supabase Storage business calls, backend-only secrets in frontend files, VAPID private key references, raw component `HttpClient` calls bypassing typed API services, trusted `accountId` in Phase 26 request models, direct `push_subscriptions` table access, frontend reminder scheduler/timer/delivery code, direct reminder payload creation, and task status changes from notification state.
- [ ] Keep tests deterministic with mocked browser APIs, mocked API responses, and explicit online/offline fixtures where applicable.

---

# Out of Scope

Do not implement new product behavior beyond tests and small testability fixes, backend endpoint changes except documented tiny compatibility fixes if a blocking mismatch exists, end-to-end browser automation unless obvious lightweight E2E infrastructure already exists, backend push worker tests, deployment tests, weather tests, or AI page tests.

---

# Required Documents

Read before coding:

- [ ] `AGENTS.md`
- [ ] `docs/gardening-helper-implementation-agent-instructions.md`
- [ ] `docs/gardening-helper-ai-implementation-handoff-readme-v1.md`
- [ ] `docs/gardening-helper-implementation-instructions-for-ai-v1.md`
- [ ] `docs/gardening-helper-domain-rules-and-invariants-v1.md`
- [ ] `docs/gardening-helper-canonical-api-contract-v1.md` Push Notifications API and shared envelope/error sections
- [ ] `docs/gardening-helper-testing-and-acceptance-spec-v1.md` notifications settings page and frontend acceptance checklist
- [ ] `docs/gardening-helper-frontend-technical-spec-v1.md` settings, notifications/PWA, API, state, and boundary sections
- [ ] `docs/implementation-phases/phase-25-backend-push-notifications-and-worker-scheduler.md`
- [ ] `docs/implementation-phases/phase-26-frontend-notifications-and-pwa-registration.md`
- [ ] All earlier Phase 26 step files
- [ ] Existing frontend test helpers, boundary-check scripts, package scripts, and affected feature specs

---

# Domain Rules Affected

This task touches tasks/reminders, frontend forms, API contract, auth/session boundary, provider adapter boundary, and deployment/security docs.

Important rules to preserve:

```text
Frontend is not business truth.
Frontend never accesses application tables directly.
Notifications are optional.
Push subscription registration goes through the backend API.
Reminder delivery remains backend-owned.
No frontend reminder timers, schedulers, or delivery workers exist.
Notification failure does not change task status.
Tasks/calendar/dashboard remain usable without notifications.
VAPID private key is backend-only.
```

---

# MCP Impact

This task has no MCP impact.

---

# Required Implementation Details

Implement tests, static/boundary check updates if configured, and docs/update notes only if needed to explain test commands or frontend-safe public-key config.

---

# Required Infrastructure/Security Boundaries

Preserve no direct frontend table access, no Fastify API bypass, no business logic in Angular components, no frontend service role key, no direct Storage business calls, no VAPID private key references, no direct push subscription table access, no frontend reminder scheduler/timer/delivery worker, no frontend-created reminder payloads, no task status mutations from notification state, and no trusted `accountId`.

---

# API Contract

Endpoints involved:

```text
POST /api/v1/push/subscriptions
GET /api/v1/push/subscriptions
POST /api/v1/push/subscriptions/:subscriptionId/deactivate
```

Request/response must follow `docs/gardening-helper-canonical-api-contract-v1.md`.

---

# Tests Required

Add or update tests for happy path rendering, validation/business/API error display, API response shape, frontend permission behavior, browser capability edge cases, subscription lifecycle behavior, PWA no-offline-write behavior, and frontend/backend boundary rules.

Specific test cases:

1. Notification API service tests prove canonical endpoint paths and payload shapes, including no `accountId`.
2. Permission tests cover default, granted, denied, unsupported, blocked/unavailable, and missing public-key states where mockable.
3. Register/deactivate/re-register tests prove backend API calls are made correctly and errors remain retryable.
4. Graceful degradation tests prove dashboard, tasks, and calendar still render when notification permission is denied or unsupported.
5. Static checks fail if Phase 26 code adds VAPID private key references, direct `push_subscriptions` table access, frontend reminder scheduler/timer/delivery code, direct reminder payload creation, task status mutation from notification state, direct Supabase table/storage access, or trusted `accountId`.

---

# Acceptance Criteria

- [ ] Phase 26 has focused regression and API-service tests for notification settings and subscription lifecycle.
- [ ] Browser API mocks cover permission, service worker, Push API, and subscription edge cases deterministically.
- [ ] Boundary checks cover frontend/backend responsibility rules specific to Phase 26.
- [ ] Error-display tests cover browser and canonical backend failures without losing current UI state.
- [ ] Tests are deterministic and do not depend on real backend/network/browser permission prompts.
- [ ] Relevant frontend test/check commands pass or failures are documented exactly.
