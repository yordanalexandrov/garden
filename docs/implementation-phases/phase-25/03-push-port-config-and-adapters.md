# Implementation Task - Phase 25 Step 3: Push Port, Config, and Adapters

## Role

You are the Implementation Agent for Gardening Helper.

Follow `AGENTS.md` and `docs/gardening-helper-implementation-agent-instructions.md`. External integrations go through ports/adapters; domain services must not call provider SDKs directly.

---

# Task

## Goal

Implement the push integration boundary:

```text
Create PushPort, backend-only VAPID configuration, deterministic test/dev push adapter, and raw Web Push/VAPID adapter.
```

## Branch

Use branch:

```text
feature/backend-push-worker
```

---

# Scope

Implement only:

- [ ] Inspect existing integration port, config, dependency injection, logger, provider error, test adapter, and weather/storage adapter patterns.
- [ ] Define `PushPort` with `sendReminder(input: SendReminderInput): Promise<void>` or the closest compatible typed contract.
- [ ] Define typed inputs for reminder notification payloads, subscription endpoint/keys, metadata needed for logging, and provider failure classification.
- [ ] Add backend-only config parsing for `VAPID_PUBLIC_KEY`, `VAPID_PRIVATE_KEY`, and `VAPID_SUBJECT` using existing config conventions.
- [ ] Ensure `VAPID_PRIVATE_KEY` is never exposed to frontend config, public runtime config, client-visible errors, logs, or build output.
- [ ] Implement deterministic test/dev push adapter behind `PushPort` that records attempted sends and can simulate success, transient failure, permanent failure, and invalid subscription responses without network access.
- [ ] Implement raw Web Push/VAPID adapter behind `PushPort` if the existing dependency/config pattern supports it; otherwise document production adapter status and leave no provider calls outside the adapter.
- [ ] Normalize provider failures into internal typed errors that the worker can use for status updates and optional subscription deactivation decisions.
- [ ] Add focused unit/static tests for config parsing, adapter boundary, deterministic adapter behavior, provider failure mapping, and secret safety.

Expected paths, unless existing code clearly establishes a better equivalent:

```text
backend/src/integrations/push/push.port.ts
backend/src/integrations/push/push.types.ts
backend/src/integrations/push/test-push.adapter.ts
backend/src/integrations/push/web-push.adapter.ts
backend/src/config/
backend/test/push/
```

---

# Out of Scope

Do not implement:

- [ ] Reminder scanning or worker status transitions; that belongs to Step 4.
- [ ] Push subscription API persistence; that belongs to Step 2.
- [ ] Frontend browser Push API calls, service worker registration, or notification UI.
- [ ] Sending notifications from controllers or domain services without `PushPort`.
- [ ] Weather scheduling.
- [ ] Schema changes or migrations.

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
- [ ] `docs/gardening-helper-backend-application-design-pack-v1.md` section 7.4 and notifications sections
- [ ] `docs/gardening-helper-production-checklist.md`
- [ ] `docs/env.example`
- [ ] `docs/implementation-phases/phase-25-backend-push-notifications-and-worker-scheduler.md`
- [ ] Existing backend config, integration adapter, dependency injection, logger, error, and test helper files.

---

# Domain Rules Affected

This task touches:

- [ ] provider adapter boundary
- [ ] tasks/reminders
- [ ] deployment/security docs
- [ ] worker/scheduler responsibility

Important rules to preserve:

```text
External integrations go through ports/adapters.
Raw Web Push with VAPID is used through PushPort.
VAPID private key is backend-only.
Notifications are optional.
Notification failure must not break task state.
Provider failures must not leak secrets.
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

- [ ] provider adapter through port
- [ ] backend config validation
- [ ] deterministic test/dev adapter
- [ ] provider error mapping
- [ ] secret-safety checks
- [ ] tests
- [ ] docs/update notes only if production adapter status or config behavior differs from source docs

---

# Required Infrastructure/Security Boundaries

Preserve these rules:

- [ ] no direct frontend access to application tables
- [ ] no bypass of the Fastify API for application data
- [ ] no Supabase service role key in frontend code/env/build output/logs
- [ ] no direct provider calls inside domain services except through `PushPort`
- [ ] raw Web Push used through `PushPort`
- [ ] VAPID private key backend-only
- [ ] worker/scheduler ownership is explicit for reminder delivery

---

# API Contract

Endpoints involved:

```text
None directly in this step.
```

This step prepares the provider boundary used later by the backend worker and supports frontend Phase 26 through the backend subscription APIs. Do not add non-contract public endpoints for VAPID private key or provider internals.

---

# Tests Required

Add or update tests for:

- [ ] provider adapter boundary
- [ ] validation/config errors
- [ ] edge cases
- [ ] static/security checks

Specific test cases:

1. Push config accepts backend `VAPID_PUBLIC_KEY`, `VAPID_PRIVATE_KEY`, and `VAPID_SUBJECT` using existing config conventions.
2. Missing required production VAPID config fails safely when production push sending is enabled.
3. Deterministic test push adapter records sends without network access.
4. Deterministic test push adapter can simulate send success and failure.
5. Provider errors map to internal push errors without leaking keys.
6. Static or unit guard confirms raw Web Push provider calls are confined to the push adapter.
7. Static or unit guard confirms `VAPID_PRIVATE_KEY` is not referenced by frontend/public config paths.

---

# Acceptance Criteria

The task is complete when:

- [ ] `PushPort` and typed push inputs/results exist.
- [ ] A deterministic test/dev adapter exists and needs no real provider or network access.
- [ ] Raw Web Push/VAPID adapter exists or production adapter status is explicitly documented.
- [ ] VAPID config is backend-only and secret-safe.
- [ ] No route behavior, worker scanning, frontend, schema, task status, or reminder creation scope is included.

---

# Commands to Run

From the backend package root, run relevant commands:

```bash
npm run typecheck
npm run lint
npm test
```

If any command does not exist or fails due to pre-existing setup, report the exact command, exit state, and reason. Never claim checks passed unless they were run.
