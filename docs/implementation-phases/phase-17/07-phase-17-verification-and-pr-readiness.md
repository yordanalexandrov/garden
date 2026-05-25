# Implementation Task - Phase 17 Step 7: Phase 17 Verification and PR Readiness

## Goal

Verify Phase 17 frontend work, update implementation status, commit focused changes, and open the implementation PR.

## Branch

Use branch:

```text
feature/frontend-problems-photos
```

## Scope

- [ ] Review final diff for accidental backend, AI, correction, observation-photo, direct storage, or service-role scope creep.
- [ ] Verify Reactive Forms, typed API services, backend error display, target summary, problem-only uploader, and detail photo rendering.
- [ ] Run frontend checks.
- [ ] Update `docs/gardening-helper-implementation-status-handoff.md` to mark Phase 17 implemented only if implementation and checks are complete.
- [ ] Commit focused changes and open a PR with the expected Phase 17 summary from the top-level phase spec.

## Required Verification Commands

From the frontend package root, run where configured:

```bash
npm run typecheck
npm run lint
npm test
npm run build
```

Also run configured frontend boundary/static checks for direct Supabase table/storage access, service-role exposure, raw `HttpClient` bypasses, trusted `accountId`, and storage URL construction.

## Acceptance Criteria

- [ ] Problems and observations can be created through UI.
- [ ] Problem photos upload through backend API only.
- [ ] Observation photo behavior is blocked/hidden.
- [ ] Problem detail displays controlled photo URLs.
- [ ] PR is open and ready for Review Agent review.
