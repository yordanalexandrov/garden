# Implementation Task - Phase 26 Step 1: Notifications API Services, Config, and Feature Scaffold

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

Implement the typed frontend notification API service, frontend-safe push configuration shape, route scaffold, and feature folder structure needed by Phase 26 notification settings and PWA registration UI.

## Branch

Use branch:

```text
feature/frontend-notifications
```

---

# Scope

Implement only:

- [ ] Inspect the existing Angular shell, settings routes/placeholders, PWA/service worker setup, typed API client, auth token interceptor, API error mapper, shared UI controls, and frontend test setup from earlier frontend phases.
- [ ] Create a notifications/settings feature structure using the existing frontend architecture.
- [ ] Define frontend DTO/request types for push subscription register, subscription list items, deactivate responses, browser permission state, and UI status models.
- [ ] Add typed `NotificationsApiService` methods for `POST /api/v1/push/subscriptions`, `GET /api/v1/push/subscriptions`, and `POST /api/v1/push/subscriptions/:subscriptionId/deactivate`.
- [ ] Use the existing API base client and canonical envelope unwrapping; do not call `HttpClient` directly from feature components.
- [ ] Add a frontend-safe VAPID public key configuration path, or consume an existing backend/config endpoint if Phase 25 added one and the codebase already exposes it through the API client.
- [ ] Ensure frontend config names and examples include only public push configuration; never include or reference a VAPID private key in frontend files.
- [ ] Add `/settings/notifications` route scaffolding, replacing only existing Phase 26 placeholders where present.
- [ ] Keep browser permission UI, actual PushManager subscription, deactivate actions, app-shell prompts, and offline handling for later Phase 26 steps.
- [ ] Add API service, config, and route tests for canonical paths, envelope mapping, register payload shape, deactivation path, public-key config, and no trusted `accountId`.

Expected paths, unless existing code clearly establishes a better equivalent:

```text
frontend/src/app/features/settings/notifications/
frontend/src/app/features/settings/notifications/data-access/
frontend/src/app/features/settings/notifications/pages/
frontend/src/app/features/settings/notifications/components/
frontend/src/app/core/api/
frontend/src/app/core/config/
frontend/src/app/app.routes.ts
frontend/src/app/features/**/*.spec.ts
```

---

# Out of Scope

Do not implement:

- [ ] Browser permission prompt UI or enable/deactivate interactions; those are later Phase 26 steps.
- [ ] Service worker `PushManager.subscribe` orchestration; that is Step 2.
- [ ] Backend endpoints, `PushPort`, raw Web Push adapter, worker/scheduler behavior, migrations, or reminder delivery.
- [ ] Frontend reminder timers, notification delivery logic, task status changes, or reminder payload creation.
- [ ] VAPID private key exposure in frontend config, docs examples, tests, or build output.
- [ ] Direct `push_subscriptions` table access or Supabase/PostgREST application data calls.

---

# Required Documents

Read before coding:

- [ ] `AGENTS.md`
- [ ] `docs/gardening-helper-implementation-agent-instructions.md`
- [ ] `docs/gardening-helper-ai-implementation-handoff-readme-v1.md`
- [ ] `docs/gardening-helper-implementation-instructions-for-ai-v1.md`
- [ ] `docs/gardening-helper-domain-rules-and-invariants-v1.md` notification, frontend boundary, provider, and secret invariants
- [ ] `docs/gardening-helper-canonical-api-contract-v1.md` Push Notifications API and shared envelope/error sections
- [ ] `docs/gardening-helper-testing-and-acceptance-spec-v1.md` notifications settings and frontend acceptance sections
- [ ] `docs/gardening-helper-frontend-technical-spec-v1.md` settings route, notifications/PWA behavior, API integration, and frontend boundaries
- [ ] `docs/implementation-phases/phase-04-frontend-project-foundation.md`
- [ ] `docs/implementation-phases/phase-25-backend-push-notifications-and-worker-scheduler.md`
- [ ] `docs/implementation-phases/phase-26-frontend-notifications-and-pwa-registration.md`
- [ ] `docs/TASK_TEMPLATE.md`
- [ ] Existing frontend API client, auth/session, config, routing, settings shell/placeholders, PWA config, and test helper files

---

# Domain Rules Affected

This task touches:

- [ ] tasks/reminders
- [ ] frontend forms
- [ ] API contract
- [ ] auth/session boundary
- [ ] provider adapter boundary

Important rules to preserve:

```text
Frontend is not business truth.
Frontend never talks directly to the database.
All application data access goes through the Fastify API under /api/v1.
Frontend must not submit accountId for normal flows.
Notifications are optional.
Reminder delivery is backend-owned.
Push subscriptions are account-scoped by the backend.
Raw Web Push is behind PushPort backend-side.
VAPID public key may be frontend-visible.
VAPID private key is backend-only.
```

---

# MCP Impact

This task:

- [ ] has no MCP impact

MCP tools affected:

```text
None.
```

Required MCP documentation updates:

```text
None.
```

---

# Required Implementation Details

Implement:

- [ ] frontend API service
- [ ] frontend DTO/request/filter types
- [ ] frontend-safe push public-key config
- [ ] feature route scaffolding
- [ ] feature folder structure
- [ ] tests
- [ ] static/boundary check updates if the existing project has a frontend boundary-check pattern

---

# Required Infrastructure/Security Boundaries

Preserve these rules:

- [ ] no direct frontend access to application tables
- [ ] no bypass of the Fastify API for application data
- [ ] no business logic in Angular components
- [ ] no Supabase service role key in frontend code/env/build output/logs
- [ ] no VAPID private key in frontend code/env/build output/logs/tests/docs examples
- [ ] no direct Supabase application-table, PostgREST, or Storage business calls
- [ ] no frontend reminder scheduler/timer/delivery worker
- [ ] backend validates JWTs and derives account context server-side
- [ ] account scoping enforced backend-side
- [ ] Supabase Auth used only for auth/session flows
- [ ] raw Web Push used through `PushPort` backend-side

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

Request/response must follow:

- `docs/gardening-helper-canonical-api-contract-v1.md`

---

# Tests Required

Add or update tests for:

- [ ] API response envelope mapping
- [ ] canonical endpoint paths
- [ ] register request body shape
- [ ] deactivate endpoint path
- [ ] frontend-safe public-key config
- [ ] no trusted `accountId`
- [ ] no VAPID private key references in frontend files touched by this task
- [ ] feature route registration
- [ ] boundary/static checks where configured

Specific test cases:

1. `NotificationsApiService` registers a subscription through `POST /api/v1/push/subscriptions`.
2. `NotificationsApiService` lists subscriptions through `GET /api/v1/push/subscriptions`.
3. `NotificationsApiService` deactivates a subscription through `POST /api/v1/push/subscriptions/:subscriptionId/deactivate`.
4. Register request fixtures include `endpoint`, `keys.p256dh`, `keys.auth`, and `userAgent`, and do not include `accountId`.
5. Notifications route scaffolding registers `/settings/notifications` through the existing routing pattern.

---

# Acceptance Criteria

The task is complete when:

- [ ] Notifications feature scaffolding and route shell exist.
- [ ] Typed `NotificationsApiService` consumes canonical endpoints through the existing API client.
- [ ] Notification DTO/request types match the canonical contract.
- [ ] Public push configuration is frontend-safe and no private key is referenced.
- [ ] No direct provider/table/storage access or raw component `HttpClient` usage is introduced.
- [ ] Focused API service/config/route tests pass.
