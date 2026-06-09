# Implementation Task - Phase 25 Step 6: Worker Ownership Docs and Operational Hooks

## Role

You are the Implementation Agent for Gardening Helper.

Follow `AGENTS.md` and `docs/gardening-helper-implementation-agent-instructions.md`. This step makes the backend worker process shape explicit without implementing frontend or deployment-phase work.

---

# Task

## Goal

Document and wire the operational shape for Phase 25:

```text
Worker entrypoint or job command, scheduler configuration, logging, and handoff notes for reminder delivery.
```

## Branch

Use branch:

```text
feature/backend-push-worker
```

---

# Scope

Implement only:

- [ ] Inspect existing package scripts, backend entrypoints, worker/scheduler conventions, config loading, logger, Docker/deployment placeholders, README/setup docs, and production checklist.
- [ ] Add or update backend worker/job command wiring for reminder delivery if the codebase has an established worker entrypoint pattern.
- [ ] If no worker entrypoint pattern exists, add a minimal explicit backend job module/command consistent with local architecture and document what Deployment Phase 27 must wire.
- [ ] Configure worker enable/interval behavior using existing config conventions and documented variables such as `WORKER_ENABLED` and `REMINDER_JOB_INTERVAL_SECONDS`.
- [ ] Ensure the API process and worker process ownership are clear: API handles subscription endpoints; worker/job sends due reminder notifications.
- [ ] Ensure logs include enough non-secret context for attempted send, success, failure, skipped non-planned reminders, and invalid subscription handling.
- [ ] Update backend docs or implementation notes only where needed to explain how to run the worker locally and in tests.
- [ ] Update `docs/gardening-helper-production-checklist.md` only if Phase 25 implementation changes the checklist wording; otherwise leave deployment checklist changes to Phase 27.
- [ ] Do not expose PostgreSQL publicly, weaken Supabase Studio protection, or add deployment secrets to frontend config.

---

# Out of Scope

Do not implement:

- [ ] Full production Docker Compose deployment wiring; that belongs to Phase 27 unless an existing local script requires a small command hook.
- [ ] Browser service worker registration or frontend notification settings.
- [ ] Weather-check scheduler behavior.
- [ ] AI suggestion worker behavior.
- [ ] MCP tool scheduling.
- [ ] New infrastructure beyond what the backend worker needs to be runnable/testable.
- [ ] Public PostgreSQL or public Supabase Studio changes.

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
- [ ] `docs/gardening-helper-backend-application-design-pack-v1.md`
- [ ] `docs/gardening-helper-technical-requirements-and-erd.md` worker and deployment sections
- [ ] `docs/gardening-helper-production-checklist.md`
- [ ] `docs/env.example`
- [ ] `docs/implementation-phases/phase-25-backend-push-notifications-and-worker-scheduler.md`
- [ ] Existing backend package scripts, config, logger, worker/job, Docker/deployment, README, and operations docs touched by the task.

---

# Domain Rules Affected

This task touches:

- [ ] tasks/reminders
- [ ] provider adapter boundary
- [ ] worker/scheduler responsibility
- [ ] deployment/security docs

Important rules to preserve:

```text
Worker/scheduler ownership is explicit.
Reminder rows drive notification sending.
Notifications only for planned tasks.
Notification failure must not break task state.
Raw Web Push is behind PushPort.
VAPID private key is backend-only.
Supabase Studio must be protected.
PostgreSQL must not be publicly exposed.
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

- [ ] worker/scheduler behavior wiring
- [ ] backend config validation/update
- [ ] deployment/security docs or operational notes where needed
- [ ] tests or static checks for command/config behavior where local patterns support them

---

# Required Infrastructure/Security Boundaries

Preserve these rules:

- [ ] no direct frontend access to application tables
- [ ] no bypass of the Fastify API for application data
- [ ] no Supabase service role key in frontend code/env/build output/logs
- [ ] no direct provider calls inside domain services except through `PushPort`
- [ ] Supabase Studio protected if deployment/admin config is touched
- [ ] PostgreSQL not publicly exposed if deployment/admin config is touched
- [ ] raw Web Push used through `PushPort`
- [ ] worker/scheduler ownership is explicit for reminders

---

# API Contract

Endpoints involved:

```text
None directly in this step.
```

Operational behavior must support Phase 25 APIs and worker semantics without changing public API contract shapes.

---

# Tests Required

Add or update tests/checks for:

- [ ] worker/scheduler behavior
- [ ] config validation
- [ ] security/static checks
- [ ] edge cases

Specific test cases:

1. Worker/job command can instantiate with deterministic push adapter and test config.
2. `WORKER_ENABLED=false` or equivalent config prevents scheduled loop startup where applicable.
3. Reminder job interval config is parsed safely and rejects invalid values if config validation exists.
4. Logs/error paths do not include VAPID private key, p256dh, or auth secret values.
5. Deployment/admin config is not changed to expose PostgreSQL or unprotected Supabase Studio.

---

# Acceptance Criteria

The task is complete when:

- [ ] Worker ownership is clear in code and docs.
- [ ] Reminder delivery can be run by a backend worker/job command or documented equivalent.
- [ ] Scheduler interval/enabled config follows existing backend config conventions.
- [ ] Operational notes preserve secret and deployment boundaries.
- [ ] No frontend, full deployment, weather, AI, MCP, public database, or Studio exposure scope slipped in.

---

# Commands to Run

From the backend package root, run relevant commands:

```bash
npm run typecheck
npm run lint
npm test
npm run build
```

If any command does not exist or fails due to pre-existing setup, report it clearly.
