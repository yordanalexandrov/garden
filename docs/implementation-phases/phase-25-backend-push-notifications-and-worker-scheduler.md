# Phase 25 — Backend Push Notifications and Worker Scheduler

## 1. Purpose

This phase implements push subscription APIs, raw Web Push adapter, and backend-owned reminder delivery worker. Notifications are optional and driven by planned-task reminder rows.

## 2. Position in the sequence

Phase 18 must already create reminder rows for planned tasks. Frontend Phase 26 depends on backend push subscription APIs. Deployment Phase 27 depends on a documented API/worker process shape.

This phase must not be merged with Phase 18 because reminder creation and notification delivery are separate responsibilities. It must not be merged with frontend Phase 26 because browser subscription UX should consume stable backend APIs.

## 3. Source documents

- `docs/gardening-helper-domain-rules-and-invariants-v1.md` - defines notifications optional, push subscriptions account-scoped, reminder rows drive sending, planned-task-only notifications, and failure not breaking task state.
- `docs/gardening-helper-canonical-api-contract-v1.md` - defines Push Notifications API section 23.
- `docs/gardening-helper-backend-application-design-pack-v1.md` - defines `PushPort`, `PushSubscriptionsRepository`, and notification service flow.
- `docs/gardening-helper-production-checklist.md` - defines VAPID, worker, reminder job, and failure behavior checks.
- `docs/env.example` - defines `VAPID_PUBLIC_KEY`, `VAPID_PRIVATE_KEY`, `VAPID_SUBJECT`, and worker interval variables.
- `docs/gardening-helper-testing-and-acceptance-spec-v1.md` - defines push/reminder boundary tests.

## 4. Scope

### Backend scope

- Define/implement `PushPort`.
- Implement raw Web Push/VAPID adapter behind `PushPort`.
- Implement deterministic test push adapter.
- Implement endpoints:
  - `POST /push/subscriptions`
  - `GET /push/subscriptions`
  - `POST /push/subscriptions/:subscriptionId/deactivate`
- Implement worker/scheduler process or job module for due reminder delivery.
- Update reminder status to `sent` or `failed`; preserve `canceled` handling if applicable.
- Ensure notification failure does not change task status.
- Add worker ownership docs/scripts.

### Integration scope

- Raw Web Push with VAPID through `PushPort`.
- Test adapter behind same port.

### Testing scope

- Add subscription, worker/job, PushPort, reminder status, failure, and secret-boundary tests.

## 5. Out of scope

- Browser registration UI.
- Weather-check scheduler unless explicitly included.
- Creating reminders for suggested tasks.
- Frontend timers.
- Task status changes from notification delivery.

## 6. Dependencies and prerequisites

- Previous phases required: Phase 18.
- Existing modules expected: task reminders, task status model, auth/account context.
- Expected backend paths after implementation: `src/modules/notifications/`, `src/integrations/push/`, `src/worker/` or equivalent.
- Database requirements: `push_subscriptions`, `task_reminders`, `tasks`, and push/reminder constraints migrated.
- Environment variables: `VAPID_PUBLIC_KEY`, `VAPID_PRIVATE_KEY`, `VAPID_SUBJECT`, `WORKER_ENABLED`, `REMINDER_JOB_INTERVAL_SECONDS`.
- Test infrastructure requirements: deterministic push adapter and due reminder fixtures.

## 7. Domain rules and invariants affected

- Notifications are optional.
- Push subscription belongs to account.
- Reminder rows drive notification sending.
- Notifications only for planned tasks.
- Notification failure must not break task state.
- Raw Web Push is behind `PushPort`.
- Worker/scheduler ownership is explicit.
- Provider secrets remain backend-only.

## 8. API contract impact

Endpoints involved:

- `POST /api/v1/push/subscriptions`
- `GET /api/v1/push/subscriptions`
- `POST /api/v1/push/subscriptions/:subscriptionId/deactivate`

Request/response shapes to preserve:

- Register request uses `endpoint`, `keys.p256dh`, `keys.auth`, and optional `userAgent`.
- Register response returns `{ data: { registered: true } }`.
- List response returns active subscriptions.
- Deactivate response should use canonical success envelope.
- Errors use canonical envelope.

Status/enum values:

- Reminder status: `scheduled`, `sent`, `failed`, `canceled`.

## 9. Database impact

Tables involved:

- `push_subscriptions`
- `task_reminders`
- `tasks`

Indexes/guards involved:

- `idx_push_subscriptions_account_is_active`
- `uq_push_subscriptions_endpoint`
- `ux_push_subscriptions_active_endpoint`
- `idx_task_reminders_scheduled_for_status`

No schema changes are expected in this phase.

## 10. Backend design notes

- Subscription registration should upsert/reactivate by endpoint where appropriate.
- Subscription list must be account-scoped and active-only unless otherwise documented.
- Deactivation must be account-scoped.
- Worker should scan due scheduled reminders and send through `PushPort`.
- Send success marks reminder `sent` with `sent_at`.
- Send failure marks reminder `failed` and logs provider failure, but leaves task state unchanged.
- Worker can run separately from API or as explicit job module, but ownership must be clear.
- Suggested tasks should never have reminders; worker should not send for them even if bad data exists.
- Forbidden shortcuts: frontend reminder scheduler, direct web-push calls in services without port, exposing VAPID private key, changing task status on send failure.

## 11. Frontend design notes

No frontend work is expected in this phase.

## 12. Integration design notes

Port/interface:

- `PushPort.sendReminder`

Adapter expectations:

- Raw Web Push/VAPID adapter sends notifications.
- Test adapter records attempted sends deterministically.

Secret handling:

- VAPID private key is backend-only.
- VAPID public key may be exposed later to frontend for browser subscription.

Failure handling:

- Provider/send failures update reminder to failed and leave task untouched.
- Invalid subscriptions may be deactivated if documented and tested.

## 13. Testing requirements

### Unit tests

- Subscription validation requires endpoint, p256dh, and auth.
- Worker selects due scheduled reminders only.
- Worker skips reminders for non-planned task data if encountered.

### Integration/API tests

- Register/reactivate subscription.
- Account-scoped subscription listing.
- Deactivate subscription.
- Due reminder sends through `PushPort`.
- Send success marks reminder sent.
- Send failure marks reminder failed and leaves task unchanged.
- Suggested task reminders cannot exist or send.
- Cross-account subscription operations rejected.

### Static/security checks

- VAPID private key not exposed to frontend config.
- Push provider code isolated behind `PushPort`.

## 14. Verification checklist

- [ ] `PushPort` exists.
- [ ] Raw Web Push/VAPID adapter exists or production status is documented.
- [ ] Deterministic test push adapter exists.
- [ ] Push subscription register/list/deactivate endpoints are implemented.
- [ ] Worker/scheduler job sends due reminders.
- [ ] Send success/failure updates reminder status only.
- [ ] Notification failure does not change task status.
- [ ] Worker ownership and commands are documented.
- [ ] Backend tests/typecheck/lint/build pass where configured.

## 15. Review checklist

- [ ] Push subscriptions are account-scoped.
- [ ] Reminder rows drive sends.
- [ ] Notifications are only for planned tasks.
- [ ] `PushPort` isolates provider code.
- [ ] VAPID private key is backend-only.
- [ ] Worker does not run as frontend timer.
- [ ] Send failures do not change task status.
- [ ] Tests cover success, failure, and account boundaries.

## 16. Suggested branch name

```text
feature/backend-push-worker
```

## 17. Expected PR summary

```md
## Summary
Implemented backend Push Notifications and Worker Scheduler.

## Scope
- Added PushPort and Web Push adapter boundary.
- Added push subscription APIs.
- Added due reminder delivery worker/job.

## Domain rules preserved
- Notifications are optional.
- Reminder rows drive notification delivery.
- Notification failure does not change task state.

## Tests
- <commands run and results>

## Deferred work
- Browser subscription UI and deployment wiring remain deferred.

## Review focus
- Worker ownership.
- PushPort boundary.
- Secret handling.
- Reminder/task status boundaries.
```

## 18. Risks and pitfalls

- Exposing VAPID private key to frontend.
- Sending notifications for suggested tasks.
- Changing task status when push fails.
- Implementing reminder scheduler in Angular.
- Bypassing `PushPort`.
- Scanning reminders without account/task safety checks.

## 19. Exit criteria

- Push subscription APIs and backend worker exist.
- Due reminder delivery is backend-owned and tested.
- VAPID/private secret boundaries are preserved.
- Frontend Phase 26 can register browser subscriptions safely.
