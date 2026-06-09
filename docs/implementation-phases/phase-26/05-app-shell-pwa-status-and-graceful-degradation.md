# Implementation Task - Phase 26 Step 5: App Shell PWA Status and Graceful Degradation

## Role

You are the **Implementation Agent**. Use `AGENTS.md`, `docs/gardening-helper-implementation-agent-instructions.md`, `docs/gardening-helper-ai-implementation-handoff-readme-v1.md`, and all relevant specs for this task. The application data API remains the Fastify API under `/api/v1`.

---

# Task

## Goal

Integrate notification settings into the app shell/settings navigation and verify the PWA notification status degrades gracefully without blocking core task, calendar, or dashboard workflows.

## Branch

Use branch:

```text
feature/frontend-notifications
```

---

# Scope

Implement only:

- [ ] Inspect existing app shell, settings navigation, dashboard/task/calendar routes, offline indicators, snackbars, and PWA install/status patterns.
- [ ] Add or refine navigation entry points to `/settings/notifications` using existing settings/app-shell conventions.
- [ ] Add a non-intrusive notification status or call-to-action entry point only where it fits existing shell patterns; keep it dismissible or avoid persistent prompts if the app has no prompt pattern.
- [ ] Ensure denied, unsupported, missing service worker, missing public key, offline, and backend API failure states do not prevent dashboard, task, or calendar pages from loading or working.
- [ ] Ensure app startup does not request notification permission automatically.
- [ ] Ensure app startup does not auto-register a push subscription without explicit user action.
- [ ] Confirm PWA static asset caching remains static-only and does not introduce offline business write sync or cached mutation queues.
- [ ] Update minimal frontend setup notes only if the codebase has existing frontend env/config docs for public VAPID key handling.
- [ ] Add tests for navigation, non-blocking startup behavior, no automatic permission request, no automatic backend registration, and route usability when notifications are disabled/unsupported.

---

# Out of Scope

Do not implement:

- [ ] Backend worker/deployment process docs beyond frontend-safe config notes.
- [ ] Offline write sync, task reminder queues, background sync, or cached mutation replay.
- [ ] Push notification payload handling that mutates tasks or reminders.
- [ ] Any change to task/calendar backend APIs.
- [ ] Phase 27 deployment hardening.

---

# Required Documents

Read before coding:

- [ ] `AGENTS.md`
- [ ] `docs/gardening-helper-implementation-agent-instructions.md`
- [ ] `docs/gardening-helper-ai-implementation-handoff-readme-v1.md`
- [ ] `docs/gardening-helper-implementation-instructions-for-ai-v1.md`
- [ ] `docs/gardening-helper-domain-rules-and-invariants-v1.md` frontend, notification, and task/reminder invariants
- [ ] `docs/gardening-helper-canonical-api-contract-v1.md` Push Notifications API and shared error envelope
- [ ] `docs/gardening-helper-testing-and-acceptance-spec-v1.md` notifications and frontend acceptance checklist
- [ ] `docs/gardening-helper-frontend-technical-spec-v1.md` app shell, settings, API, and notifications/PWA behavior
- [ ] `docs/implementation-phases/phase-04-frontend-project-foundation.md`
- [ ] `docs/implementation-phases/phase-20-frontend-tasks-calendar-and-dashboard.md`
- [ ] `docs/implementation-phases/phase-26-frontend-notifications-and-pwa-registration.md`
- [ ] Earlier Phase 26 step files
- [ ] Existing app shell, navigation, settings, dashboard, task, calendar, service worker config, env/config docs, and tests

---

# Domain Rules Affected

This task touches:

- [ ] tasks/reminders
- [ ] frontend forms
- [ ] API contract
- [ ] auth/session boundary
- [ ] deployment/security docs

Important rules to preserve:

```text
Notifications are optional.
Tasks and calendar must work without notifications.
Frontend must not request permission or register subscriptions automatically.
Frontend must not implement reminder delivery, timers, or business scheduling truth.
PWA setup must not imply offline business writes.
VAPID private key is backend-only.
```

---

# MCP Impact

This task has no MCP impact.

---

# Required Implementation Details

Implement:

- [ ] route/navigation integration
- [ ] non-blocking notification status entry point if compatible with existing shell patterns
- [ ] PWA/offline graceful degradation checks
- [ ] minimal frontend config docs/update notes if existing docs require it
- [ ] tests

---

# Required Infrastructure/Security Boundaries

Preserve these rules:

- [ ] no direct frontend access to application tables
- [ ] no bypass of the Fastify API for application data
- [ ] no business logic in Angular components
- [ ] no Supabase service role key in frontend code/env/build output/logs
- [ ] no VAPID private key in frontend code/env/build output/logs/tests/docs examples
- [ ] no offline business write queue or mutation replay
- [ ] no frontend reminder scheduler/timer/delivery worker
- [ ] no task/calendar route gating based on notification state

---

# API Contract

Endpoints involved:

```text
GET /api/v1/push/subscriptions
POST /api/v1/push/subscriptions
POST /api/v1/push/subscriptions/:subscriptionId/deactivate
```

No new endpoints are introduced. Request/response must follow `docs/gardening-helper-canonical-api-contract-v1.md`.

---

# Tests Required

Add or update tests for:

- [ ] settings/app-shell navigation includes notifications page
- [ ] app startup does not call `Notification.requestPermission`
- [ ] app startup does not call push subscription register endpoint
- [ ] denied/unsupported notifications do not block dashboard route rendering
- [ ] denied/unsupported notifications do not block task/calendar route rendering
- [ ] PWA config does not cache mutation endpoints or define offline write sync
- [ ] frontend-safe config notes do not include private VAPID key names

Specific test cases:

1. Settings navigation links to `/settings/notifications`.
2. Bootstrapping the app shell with default permission does not request permission or register a subscription.
3. Notification unsupported state does not prevent dashboard/calendar/task components from rendering with mocked API data.
4. Service worker/PWA config remains static-asset oriented and does not define mutation queues.

---

# Acceptance Criteria

- [ ] Notification settings are discoverable through the app shell/settings navigation.
- [ ] Notification prompts and registration remain explicit user actions.
- [ ] Tasks, calendar, and dashboard are usable when notifications are off, denied, unsupported, offline, or in API error state.
- [ ] PWA behavior does not introduce offline business writes or reminder delivery logic.
- [ ] Frontend-safe VAPID public key handling is documented where existing frontend setup docs expect env/config notes.
