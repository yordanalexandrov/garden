# Implementation Task - Phase 26 Step 3: Notification Settings Page and Permission States

## Role

You are the **Implementation Agent**. Use `AGENTS.md`, `docs/gardening-helper-implementation-agent-instructions.md`, `docs/gardening-helper-ai-implementation-handoff-readme-v1.md`, and all relevant specs for this task. The application data API remains the Fastify API under `/api/v1`.

---

# Task

## Goal

Implement the `/settings/notifications` page UI for current browser permission, support status, explicit permission request, and user-facing disabled/blocked/offline states.

## Branch

Use branch:

```text
feature/frontend-notifications
```

---

# Scope

Implement only:

- [ ] Inspect existing settings/app-shell navigation patterns, shared page header, empty/error/loading state components, snackbar/error display, and Material form/action patterns.
- [ ] Replace the notifications placeholder with a route-level settings page using the existing feature/page architecture.
- [ ] Render current permission state: default/not requested, granted, denied, unsupported, blocked/unavailable, missing service worker, missing public key, and offline where the app can detect it.
- [ ] Add an explicit user-initiated "enable notifications" action that calls `Notification.requestPermission` only in response to user interaction.
- [ ] Refresh browser support/permission/subscription state after permission request resolves.
- [ ] Show clear explanatory copy for denied/blocked/unsupported states without blocking task, calendar, dashboard, or other app routes.
- [ ] Show backend subscription list status from `NotificationsApiService` only as read-only status; registration/deactivation actions are completed in Step 4.
- [ ] Display canonical API load errors from `GET /api/v1/push/subscriptions` using the existing error mapper.
- [ ] Add page/component tests for state rendering, explicit permission request, denied outcome, unsupported state, offline state if existing app has offline detection, and API error rendering.

---

# Out of Scope

Do not implement:

- [ ] Registering browser subscriptions with the backend; that is Step 4.
- [ ] Deactivate/re-register actions; those are Step 4.
- [ ] Backend endpoints, `PushPort`, worker/scheduler behavior, or migrations.
- [ ] Frontend reminder timers, task status changes, or notification delivery logic.
- [ ] Blocking tasks/calendar/dashboard when notifications are unavailable.

---

# Required Documents

Read before coding:

- [ ] `AGENTS.md`
- [ ] `docs/gardening-helper-implementation-agent-instructions.md`
- [ ] `docs/gardening-helper-ai-implementation-handoff-readme-v1.md`
- [ ] `docs/gardening-helper-implementation-instructions-for-ai-v1.md`
- [ ] `docs/gardening-helper-domain-rules-and-invariants-v1.md` frontend, notifications, and task/reminder invariants
- [ ] `docs/gardening-helper-canonical-api-contract-v1.md` Push Notifications API and canonical error envelope
- [ ] `docs/gardening-helper-testing-and-acceptance-spec-v1.md` notifications settings acceptance
- [ ] `docs/gardening-helper-frontend-technical-spec-v1.md` settings page and notifications/PWA behavior
- [ ] `docs/implementation-phases/phase-20-frontend-tasks-calendar-and-dashboard.md`
- [ ] `docs/implementation-phases/phase-26-frontend-notifications-and-pwa-registration.md`
- [ ] Earlier Phase 26 step files
- [ ] Existing settings route/page files, app shell navigation, shared UI components, API error display helpers, and test helpers

---

# Domain Rules Affected

This task touches:

- [ ] tasks/reminders
- [ ] frontend forms
- [ ] API contract
- [ ] auth/session boundary

Important rules to preserve:

```text
Notifications are optional.
Frontend is not business truth.
Reminder delivery is backend-owned.
Tasks and calendar still work without notifications.
Backend validation/errors are authoritative and must be displayed.
The frontend must not update task state from notification permission state.
```

---

# MCP Impact

This task has no MCP impact.

---

# Required Implementation Details

Implement:

- [ ] frontend page/component
- [ ] permission request UI action
- [ ] permission/support state rendering
- [ ] API error rendering for subscription status load
- [ ] tests

---

# Required Infrastructure/Security Boundaries

Preserve these rules:

- [ ] no direct frontend access to application tables
- [ ] no bypass of the Fastify API for application data
- [ ] no business logic in Angular components
- [ ] no VAPID private key in frontend code/env/build output/logs/tests/docs examples
- [ ] no frontend reminder scheduler/timer
- [ ] no task status changes from notification permission/subscription state
- [ ] no trusted `accountId` in requests

---

# API Contract

Endpoints involved:

```text
GET /api/v1/push/subscriptions
```

Request/response must follow `docs/gardening-helper-canonical-api-contract-v1.md`.

---

# Tests Required

Add or update tests for:

- [ ] default permission state rendering
- [ ] granted permission state rendering
- [ ] denied/blocked state rendering
- [ ] unsupported browser state rendering
- [ ] explicit user action calls `Notification.requestPermission`
- [ ] accepted and denied permission outcomes
- [ ] API subscription list load success
- [ ] canonical API error display
- [ ] tasks/calendar route availability is not gated by notification permission

Specific test cases:

1. Page shows current permission status before any user action.
2. Clicking enable requests permission and refreshes state.
3. Denied permission shows an explanatory disabled state and no hard app failure.
4. Unsupported browser state does not render enable/register controls that cannot work.
5. Subscription list load failure displays the backend error envelope through existing UI patterns.

---

# Acceptance Criteria

- [ ] `/settings/notifications` page renders through the app router.
- [ ] Permission/support/offline states are clear and graceful.
- [ ] Permission is requested only from an explicit user action.
- [ ] Canonical API errors are visible.
- [ ] Notifications remain optional and do not gate task/calendar/dashboard use.
