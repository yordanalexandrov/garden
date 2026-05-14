# Phase 26 — Frontend Notifications and PWA Registration

## 1. Purpose

This phase implements notification settings and browser push subscription registration UI. Notifications remain optional and graceful; reminder delivery remains backend-owned.

## 2. Position in the sequence

Phase 4 must provide PWA foundation. Phase 25 must provide backend push subscription APIs and worker. Deployment Phase 27 depends on PWA/notification config being documented.

This phase must not be merged with Phase 25 because frontend browser permission flow should consume stable backend APIs. It must not implement reminder delivery logic.

## 3. Source documents

- `docs/gardening-helper-frontend-technical-spec-v1.md` - defines settings/notifications page, browser permission UX, subscription flow, and graceful degradation.
- `docs/gardening-helper-domain-rules-and-invariants-v1.md` - defines notifications optional and frontend not owning reminder business logic.
- `docs/gardening-helper-canonical-api-contract-v1.md` - defines push subscription endpoints consumed by this phase.
- `docs/gardening-helper-production-checklist.md` - defines VAPID public/private key handling and browser permission tests.
- `docs/gardening-helper-testing-and-acceptance-spec-v1.md` - defines notifications settings acceptance tests.

## 4. Scope

### Frontend scope

- Implement notification settings route/page.
- Display browser permission state.
- Add explicit request permission action.
- Implement service worker push subscription flow.
- Register subscription through Fastify API.
- Support deactivate/re-register actions.
- Display disabled, unsupported, denied, and blocked states.
- Ensure tasks/calendar remain usable without notifications.

### Testing scope

- Add component/API tests for permission states, subscription payload, deactivate, and graceful no-notification states.

## 5. Out of scope

- Reminder delivery logic.
- Frontend timers for reminders.
- VAPID private key exposure.
- Direct task state changes from notification failure.
- Backend push worker changes except bug fixes.

## 6. Dependencies and prerequisites

- Previous phases required: Phase 4, Phase 25.
- Existing frontend modules expected: PWA/service worker setup, settings route, API client, error mapper.
- Expected frontend paths after implementation: `src/app/features/settings/notifications/` or equivalent, plus notification API service.
- Backend requirements: push subscription register/list/deactivate endpoints available.
- Environment variables: VAPID public key may be frontend-safe; VAPID private key must never be included.
- Test infrastructure requirements: browser Push API mocks and permission state mocks.

## 7. Domain rules and invariants affected

- Notifications are optional.
- App works when notifications are disabled.
- Push subscription registration is frontend-collected but backend-owned.
- Reminder delivery is not frontend business logic.
- Push subscriptions belong to account.
- Provider secrets remain backend-only.

## 8. API contract impact

This phase consumes, but does not introduce, API endpoints.

Endpoints consumed:

- `POST /api/v1/push/subscriptions`
- `GET /api/v1/push/subscriptions`
- `POST /api/v1/push/subscriptions/:subscriptionId/deactivate`

Request/response expectations:

- Register payload uses `endpoint`, `keys.p256dh`, `keys.auth`, and `userAgent`.
- Do not send trusted `accountId`.
- Errors use canonical envelope.

## 9. Database impact

No schema changes are expected in this phase.

Frontend must not access `push_subscriptions` directly.

## 10. Backend design notes

No backend work is expected except bug fixes in already implemented push APIs.

## 11. Frontend design notes

- Notification enablement must be explicit and user-initiated.
- UI should handle unsupported browsers, denied permission, blocked permission, and successful subscription.
- Register browser subscription through backend API only.
- Deactivate action should call backend and update UI.
- Tasks/calendar should remain fully usable when notifications are off.
- VAPID public key can be used for subscription; private key must not be present.
- Forbidden shortcuts: frontend reminder timers, direct task status updates from notification events, private key in frontend config.

## 12. Integration design notes

Frontend integration:

- Browser Push API and service worker subscription.
- Backend push subscription API.

Secret handling:

- VAPID public key may be frontend-visible.
- VAPID private key is backend-only.

Failure handling:

- Permission denied/blocked should show disabled state, not break app workflows.
- API registration failure should display error and allow retry.

## 13. Testing requirements

### Unit/component tests

- Permission state renders for default, granted, denied, unsupported, and blocked states where mockable.
- Request permission action handles accepted/denied outcomes.
- Subscription payload is sent to backend.
- Deactivate action calls backend.
- API errors display.
- Tasks/calendar remain visible when notifications disabled.

### Static/security checks

- VAPID private key is not in frontend config.
- No frontend reminder scheduler/timer exists.
- No direct push subscription table access.

## 14. Verification checklist

- [ ] Notifications settings page exists.
- [ ] Permission state display works.
- [ ] Request permission action works where browser supports it.
- [ ] Service worker subscription flow works.
- [ ] Subscription registers through backend API.
- [ ] Deactivate/re-register actions work.
- [ ] Disabled/blocked/unsupported states are graceful.
- [ ] Frontend tests/typecheck/lint/build pass where configured.
- [ ] Manual smoke in supported browser completed where practical.
- [ ] Static search confirms no VAPID private key or frontend reminder scheduler.

## 15. Review checklist

- [ ] Notifications are optional and graceful.
- [ ] Registration goes through backend API.
- [ ] Frontend does not implement delivery logic.
- [ ] VAPID private key is absent from frontend.
- [ ] Browser state handling is clear.
- [ ] No task state changes happen from notification failure.
- [ ] Tests cover permission and API states.

## 16. Suggested branch name

```text
feature/frontend-notifications
```

## 17. Expected PR summary

```md
## Summary
Implemented frontend Notifications and PWA registration.

## Scope
- Added notification settings page.
- Added browser permission and subscription flow.
- Added backend subscription registration/deactivation calls.

## Domain rules preserved
- Notifications remain optional.
- Reminder delivery remains backend-owned.
- VAPID private key is not exposed.

## Tests
- <commands run and results>

## Deferred work
- Production deployment wiring remains in the deployment readiness phase.

## Review focus
- Secret boundary.
- Optional notification UX.
- No frontend reminder delivery logic.
```

## 18. Risks and pitfalls

- Including VAPID private key in frontend config.
- Implementing reminder delivery timers in Angular.
- Blocking task/calendar use when notifications are denied.
- Failing to handle unsupported browsers.
- Sending malformed subscription payloads.
- Updating task state from notification events.

## 19. Exit criteria

- Users can enable/deactivate notifications through settings where browser supports it.
- The app behaves normally when notifications are unavailable.
- Frontend secret and reminder ownership boundaries are preserved.
