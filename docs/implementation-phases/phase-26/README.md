# Phase 26 Task Set - Frontend Notifications and PWA Registration

These files convert `docs/implementation-phases/phase-26-frontend-notifications-and-pwa-registration.md` into executable Implementation Agent tasks.

Run the tasks in order on one branch:

```text
feature/frontend-notifications
```

## Task Order

1. `01-notifications-api-services-config-and-feature-scaffold.md`
2. `02-browser-service-worker-push-subscription-support.md`
3. `03-notification-settings-page-and-permission-states.md`
4. `04-subscription-register-deactivate-and-reregister-flow.md`
5. `05-app-shell-pwa-status-and-graceful-degradation.md`
6. `06-phase-26-frontend-regression-boundary-error-tests.md`
7. `07-phase-26-verification-and-pr-readiness.md`

## Phase Boundary

Implement only the frontend notification settings and PWA push registration experience:

- Typed frontend notification API service consuming Phase 25 push subscription endpoints through the existing `/api/v1` API client.
- Frontend-safe VAPID public key configuration or backend-provided public-key config if already available from Phase 25.
- Browser capability detection for Notification API, service worker support, Push API, and `PushManager`.
- Service worker push subscription creation using the public VAPID key only.
- `/settings/notifications` route/page for permission state, enable/register, deactivate, and re-register actions.
- Clear unsupported, denied, blocked, offline, API-error, and success states.
- App-shell/settings navigation entry points and non-blocking PWA status surfaces where they fit existing shell patterns.
- Frontend/component/API-service/static tests for permission states, subscription payloads, deactivation, API errors, offline/unsupported behavior, and frontend/backend boundary rules.

Do not implement:

- Backend push subscription APIs, `PushPort`, raw Web Push adapter, worker/scheduler behavior, reminder delivery, or migrations.
- Frontend reminder timers, notification delivery logic, task status changes from notifications, or frontend-created reminder business truth.
- VAPID private key exposure in frontend code, env files, build config, docs examples, logs, or tests.
- Direct access to `push_subscriptions` or any other application table.
- Direct Supabase application-table, PostgREST, Storage, or provider calls for business data.
- Blocking tasks/calendar/dashboard usage when notifications are unavailable, denied, or disabled.
- Phase 27 deployment hardening beyond documenting frontend-safe configuration expectations required by this phase.

## Common Required Documents

Every task in this folder requires the Implementation Agent to read:

- `AGENTS.md`
- `docs/gardening-helper-ai-implementation-handoff-readme-v1.md`
- `docs/gardening-helper-implementation-instructions-for-ai-v1.md`
- `docs/gardening-helper-domain-rules-and-invariants-v1.md`
- `docs/gardening-helper-canonical-api-contract-v1.md`
- `docs/gardening-helper-testing-and-acceptance-spec-v1.md`
- `docs/gardening-helper-implementation-agent-instructions.md`
- `docs/gardening-helper-frontend-technical-spec-v1.md`
- `docs/implementation-phases/phase-04-frontend-project-foundation.md`
- `docs/implementation-phases/phase-20-frontend-tasks-calendar-and-dashboard.md`
- `docs/implementation-phases/phase-25-backend-push-notifications-and-worker-scheduler.md`
- `docs/implementation-phases/phase-26-frontend-notifications-and-pwa-registration.md`
- `docs/TASK_TEMPLATE.md`
- Existing frontend app shell, settings route, PWA/service worker setup, typed API client, auth/session, API error mapper, shared UI controls, and test helper files touched by the task.

## Common Verification

At the end of the phase, from the frontend package root, run:

```bash
npm run typecheck
npm run lint
npm test
npm run build
npm run check:frontend-boundaries
```

The boundary check must verify at minimum:

- no direct Supabase application-table access in frontend code
- no direct Supabase Storage business calls in frontend code
- no backend-only secrets referenced in frontend code, environment files, build config, docs examples, or tests
- no VAPID private key or private-key variable name is present in frontend code/config/tests
- no feature component bypasses typed API services with raw `HttpClient`
- no Phase 26 UI sends trusted `accountId`
- no frontend reminder scheduler, reminder timer, reminder delivery worker, or direct reminder payload creation exists
- no frontend code changes task status from notification permission, subscription, or delivery state
- no direct `push_subscriptions` table access or Supabase/PostgREST push subscription calls exist
- tasks, calendar, and dashboard routes remain usable when notifications are unsupported, denied, offline, or disabled

If a command is unavailable or fails due to pre-existing setup, report the exact command, exit state, and reason. Never claim checks passed unless they were run.
