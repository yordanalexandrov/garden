# Implementation Task - Phase 25 Step 5: Push Worker Regression, Security, and Boundary Tests

## Role

You are the Implementation Agent for Gardening Helper.

Follow `AGENTS.md` and `docs/gardening-helper-implementation-agent-instructions.md`. This step hardens Phase 25 with focused regression, account-scope, provider-boundary, and security tests.

---

# Task

## Goal

Add complete Phase 25 regression coverage:

```text
Push subscription APIs, PushPort adapter boundary, reminder worker success/failure paths, account scoping, and secret-safety checks.
```

## Branch

Use branch:

```text
feature/backend-push-worker
```

---

# Scope

Implement only:

- [ ] Review tests added in Steps 1-4 and identify missing Phase 25 acceptance coverage.
- [ ] Add API tests for push subscription register/list/deactivate canonical response shapes and validation errors.
- [ ] Add account-scope tests for subscription listing/deactivation and worker subscription selection.
- [ ] Add worker tests for due reminder selection, planned-only sending, success, failure, idempotency, and no task status mutation.
- [ ] Add deterministic `PushPort` tests that do not require real network or real VAPID credentials.
- [ ] Add static/security tests or focused checks that provider code is isolated behind `PushPort`.
- [ ] Add static/security tests or focused checks that `VAPID_PRIVATE_KEY` is not referenced in frontend/public config paths.
- [ ] Add regression coverage that suggested tasks do not receive reminders and cannot be sent by worker even if bad data exists or fixtures attempt it.
- [ ] Add tests for invalid/permanent subscription failure behavior if Step 4 deactivates subscriptions.
- [ ] Ensure tests use dedicated test database/config patterns and do not require public PostgreSQL, Supabase Studio, browser Push APIs, or external Web Push providers.

---

# Out of Scope

Do not implement:

- [ ] New feature behavior beyond fixing gaps revealed by Phase 25 tests.
- [ ] Frontend notification UI or PWA registration tests.
- [ ] Weather scheduler tests except static confirmation that Phase 25 did not add it.
- [ ] AI suggestion or MCP tool tests.
- [ ] Schema redesign or migrations unless a blocking mismatch is documented.

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
- [ ] `docs/gardening-helper-production-checklist.md`
- [ ] `docs/env.example`
- [ ] `docs/implementation-phases/phase-18-backend-task-lifecycle-and-reminders.md`
- [ ] `docs/implementation-phases/phase-25-backend-push-notifications-and-worker-scheduler.md`
- [ ] All Phase 25 step docs in `docs/implementation-phases/phase-25/`
- [ ] Existing backend API, repository, worker, integration, fixture, and static boundary tests.

---

# Domain Rules Affected

This task touches:

- [ ] account scoping
- [ ] tasks/reminders
- [ ] API contract
- [ ] database/migrations
- [ ] auth/session boundary
- [ ] provider adapter boundary
- [ ] worker/scheduler responsibility
- [ ] deployment/security docs

Important rules to preserve:

```text
Push subscription belongs to account.
Reminder rows drive notification sending.
Notifications only for planned tasks.
Suggested tasks are not planned tasks.
Notification failure must not break task state.
Raw Web Push is behind PushPort.
VAPID private key is backend-only.
PostgreSQL must not be publicly exposed.
Supabase Studio must be protected.
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

- [ ] tests
- [ ] static/security boundary checks
- [ ] focused fixes for test failures within Phase 25 scope

---

# Required Infrastructure/Security Boundaries

Preserve these rules:

- [ ] no direct frontend access to application tables
- [ ] no bypass of the Fastify API for application data
- [ ] no Supabase service role key in frontend code/env/build output/logs
- [ ] no direct provider calls inside domain services except through `PushPort`
- [ ] Supabase Studio protected if deployment/admin config is touched
- [ ] PostgreSQL not publicly exposed if deployment/admin config is touched
- [ ] account scoping enforced backend-side
- [ ] raw Web Push used through `PushPort`
- [ ] VAPID private key backend-only

---

# API Contract

Endpoints tested:

```text
POST /api/v1/push/subscriptions
GET /api/v1/push/subscriptions
POST /api/v1/push/subscriptions/:subscriptionId/deactivate
```

Verify:

```text
Canonical success and error envelopes.
Register response returns registered: true.
List response returns data.items with id, endpoint, isActive, createdAt.
Deactivate response uses canonical success envelope.
No trusted accountId accepted as user input.
No non-contract endpoints added.
```

---

# Tests Required

Add or update tests for:

- [ ] happy path
- [ ] validation errors
- [ ] account scoping
- [ ] transaction/status safety
- [ ] API response shape
- [ ] provider adapter boundary
- [ ] security/static checks
- [ ] edge cases

Specific test cases:

1. Register/reactivate subscription returns canonical response.
2. Register validation rejects missing endpoint, p256dh, and auth.
3. List returns active subscriptions for current account only.
4. Deactivate is account-scoped.
5. Cross-account subscription operations are rejected or hidden by not-found response.
6. Worker sends due planned reminders through deterministic `PushPort`.
7. Send success marks reminder sent and sets sent timestamp.
8. Send failure marks reminder failed and leaves task untouched.
9. Worker ignores future, sent, failed, and canceled reminders.
10. Worker skips non-planned/suggested task data.
11. Repeated worker execution does not resend terminal reminders.
12. VAPID private key is not exposed to frontend/public config paths.
13. Provider-specific Web Push code is isolated behind the push adapter.
14. No public PostgreSQL or unprotected Supabase Studio config changes are introduced if deployment config is touched.

---

# Acceptance Criteria

The task is complete when:

- [ ] Phase 25 success, failure, idempotency, and account-boundary tests exist.
- [ ] Deterministic push tests require no external provider.
- [ ] Security/static tests cover VAPID private key and provider boundary.
- [ ] Suggested/planned notification boundaries are tested.
- [ ] No frontend, weather, AI, MCP, deployment exposure, or unrelated scope slipped in.

---

# Commands to Run

From the backend package root, run relevant commands:

```bash
npm run typecheck
npm run lint
npm test
npm run test:db
```

If any command does not exist or fails due to pre-existing setup, report it clearly.
