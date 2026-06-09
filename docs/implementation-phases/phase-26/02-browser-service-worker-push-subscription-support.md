# Implementation Task - Phase 26 Step 2: Browser Service Worker Push Subscription Support

## Role

You are the **Implementation Agent**. Use `AGENTS.md`, `docs/gardening-helper-implementation-agent-instructions.md`, `docs/gardening-helper-ai-implementation-handoff-readme-v1.md`, and all relevant specs for this task. The application data API remains the Fastify API under `/api/v1`.

---

# Task

## Goal

Implement a frontend browser push registration helper that detects notification/PWA support, requests no permission by itself, and creates a browser `PushSubscription` only when called from an explicit user action in later steps.

## Branch

Use branch:

```text
feature/frontend-notifications
```

---

# Scope

Implement only:

- [ ] Inspect existing Angular PWA/service worker registration and environment/config patterns from Phase 4.
- [ ] Add a `BrowserPushSubscriptionService` or equivalent abstraction for browser APIs so page components remain thin and testable.
- [ ] Detect support for `Notification`, service workers, `PushManager`, `ServiceWorkerRegistration.pushManager`, and secure-context requirements where practical.
- [ ] Read the frontend-safe VAPID public key from the approved config path and convert it to the `Uint8Array` format expected by `PushManager.subscribe`.
- [ ] Provide methods to read current browser permission state, wait for service worker readiness, read an existing browser subscription, create a new browser subscription, and unsubscribe the browser subscription when requested.
- [ ] Map unsupported, unavailable service worker, missing public key, denied permission, and subscription failures to typed UI-safe results.
- [ ] Do not call the backend API from this browser helper; backend registration remains in Step 4 through `NotificationsApiService`.
- [ ] Add focused unit tests with mocked `Notification`, `navigator.serviceWorker`, `PushManager`, and `PushSubscription`.

---

# Out of Scope

Do not implement:

- [ ] Notification settings page UI.
- [ ] Calling `Notification.requestPermission`; that must happen from the explicit UI action in Step 3.
- [ ] Backend subscription register/deactivate orchestration; that is Step 4.
- [ ] Service worker notification-display handlers unless an existing Angular PWA config already requires a tiny compatibility change.
- [ ] Backend push worker, raw Web Push adapter, reminder delivery, scheduler behavior, or migrations.
- [ ] Frontend reminder timers, task status changes, or business scheduling logic.

---

# Required Documents

Read before coding:

- [ ] `AGENTS.md`
- [ ] `docs/gardening-helper-implementation-agent-instructions.md`
- [ ] `docs/gardening-helper-ai-implementation-handoff-readme-v1.md`
- [ ] `docs/gardening-helper-implementation-instructions-for-ai-v1.md`
- [ ] `docs/gardening-helper-domain-rules-and-invariants-v1.md` notification and frontend boundary sections
- [ ] `docs/gardening-helper-canonical-api-contract-v1.md` Push Notifications API section
- [ ] `docs/gardening-helper-testing-and-acceptance-spec-v1.md` notifications settings page acceptance
- [ ] `docs/gardening-helper-frontend-technical-spec-v1.md` notifications/PWA behavior and graceful degradation sections
- [ ] `docs/implementation-phases/phase-04-frontend-project-foundation.md`
- [ ] `docs/implementation-phases/phase-26-frontend-notifications-and-pwa-registration.md`
- [ ] `docs/TASK_TEMPLATE.md`
- [ ] Existing frontend PWA/service worker config, app config, environment/config files, and unit test helper patterns

---

# Domain Rules Affected

This task touches:

- [ ] tasks/reminders
- [ ] frontend forms
- [ ] provider adapter boundary
- [ ] deployment/security docs

Important rules to preserve:

```text
Notifications are optional.
Frontend registration is only browser subscription collection.
Reminder delivery is backend-owned.
Frontend must not create reminder timers or scheduling truth.
VAPID public key may be frontend-visible.
VAPID private key is backend-only.
Tasks and calendar must work when notifications are unsupported or disabled.
```

---

# MCP Impact

This task has no MCP impact.

---

# Required Implementation Details

Implement:

- [ ] browser push subscription service/helper
- [ ] VAPID public key conversion helper
- [ ] typed support/permission/subscription result models
- [ ] tests with deterministic browser API mocks
- [ ] static/boundary check updates if existing checks need to recognize the new helper

---

# Required Infrastructure/Security Boundaries

Preserve these rules:

- [ ] no direct frontend access to application tables
- [ ] no bypass of the Fastify API for application data
- [ ] no business logic in Angular components
- [ ] no VAPID private key in frontend code/env/build output/logs/tests/docs examples
- [ ] no direct Web Push provider calls from frontend beyond standard browser `PushManager`
- [ ] no frontend reminder scheduler/timer/delivery worker
- [ ] no task status changes based on notification subscription state

---

# API Contract

Endpoints involved:

```text
None in this step.
```

This step prepares the browser `PushSubscription` object that Step 4 will map into the canonical register request:

```text
endpoint
keys.p256dh
keys.auth
userAgent
```

---

# Tests Required

Add or update tests for:

- [ ] supported browser capability detection
- [ ] unsupported browser state when `Notification`, service worker, or `PushManager` is absent
- [ ] permission state reads for `default`, `granted`, and `denied`
- [ ] existing subscription read
- [ ] new subscription creation with `userVisibleOnly: true`
- [ ] VAPID public key conversion
- [ ] missing public key error state
- [ ] browser unsubscribe call where supported

Specific test cases:

1. Support detection returns unsupported when service workers or `PushManager` are unavailable.
2. Existing browser subscription is returned without creating a duplicate subscription.
3. New browser subscription uses the configured public VAPID key and `userVisibleOnly: true`.
4. Denied permission prevents subscription creation and returns a typed denied state.
5. No backend API call is made by the browser subscription helper.

---

# Acceptance Criteria

- [ ] Browser push helper is isolated from page components and backend API services.
- [ ] Permission/capability/subscription states are typed and testable.
- [ ] Subscription creation uses only the VAPID public key.
- [ ] Unsupported, denied, missing-key, and service-worker-unavailable states are graceful.
- [ ] No frontend reminder delivery or task mutation behavior is introduced.
