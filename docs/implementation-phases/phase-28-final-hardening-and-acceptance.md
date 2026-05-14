# Phase 28 — Final Hardening and Acceptance

## 1. Purpose

This phase closes v1 acceptance gaps, broadens tests, runs end-to-end flows, verifies security boundaries, and produces final implementation notes. It confirms the assembled system is auditable, transaction-safe, account-scoped, backend-owned, API-compatible, and usable.

## 2. Position in the sequence

All included v1 implementation phases must already be complete or intentionally deferred with clear notes. This is the final verification and hardening phase before v1 acceptance.

This phase must not be merged with feature phases because its purpose is to find integration gaps and regressions after features are assembled. It must not introduce new product features or redesigns.

## 3. Source documents

- `docs/gardening-helper-testing-and-acceptance-spec-v1.md` - primary source for P0/P1/P2 tests, E2E scenarios, rollback tests, non-functional criteria, and minimum v1 checklist.
- `docs/gardening-helper-ai-implementation-handoff-readme-v1.md` - defines final implementation report expectations and critical workflows.
- `docs/gardening-helper-production-checklist.md` - defines operational and deployment sign-off checks.
- `docs/gardening-helper-domain-rules-and-invariants-v1.md` - defines final domain-law acceptance boundaries.
- `docs/gardening-helper-canonical-api-contract-v1.md` - defines API contract compatibility.
- `docs/TASK_TEMPLATE.md` and `docs/REVIEW_TASK_TEMPLATE.md` - define how final follow-up tasks and reviews should be structured.

## 4. Scope

### Backend scope

- Fix acceptance gaps found in backend workflows.
- Add missing P0/P1 tests.
- Verify API contract consistency.
- Verify account scoping across major resources.
- Verify rollback behavior on critical transactions.
- Improve README/setup/test docs where needed.

### Frontend scope

- Fix acceptance gaps in critical UI flows.
- Verify mobile usability for create activity and create problem.
- Add missing frontend tests for key forms and boundaries.
- Verify API errors and backend side-effect displays.

### Database scope

- Only add documented forward migrations for confirmed gaps.
- Verify migration order and guard behavior.

### Integration scope

- Verify all configured adapters and mocks are behind ports.
- Verify provider status is documented honestly.
- Run deployment smoke tests where practical.

### Documentation scope

- Produce final implementation report:
  - completed modules/endpoints/pages/tests
  - provider adapter status
  - mocks used behind ports
  - not implemented/deferred items
  - known limitations
  - how to run migrations/app/tests.

## 5. Out of scope

- New product features.
- Schema redesign.
- Moving deferred AI/weather/push work earlier.
- Cosmetic-only rewrites unless needed for acceptance.
- Major architecture changes.
- Replacing backend-owned business logic with frontend or database shortcuts.

## 6. Dependencies and prerequisites

- Previous phases required: all implementation phases included in v1 scope.
- Existing modules expected: backend, frontend, database, integrations, worker, deployment docs as applicable.
- Database requirements: baseline and any forward migrations applied.
- Environment variables: complete local/test configuration and documented production configuration.
- Test infrastructure requirements: unit, integration, API, frontend, E2E, static/security, and deployment smoke test commands available.

## 7. Domain rules and invariants affected

- All critical domain invariants.
- Account scoping.
- Target resolution.
- Create activity transaction.
- Inventory ledger.
- Product/rule consistency.
- Quarantine generation.
- Task reminders.
- AI acceptance boundary.
- Weather confirmation boundary.
- Problem photo boundary.
- Frontend/backend responsibility boundary.
- Provider secret and adapter boundaries.
- Protected Studio and private Postgres.

## 8. API contract impact

This phase should not introduce new API endpoints.

It must verify:

- Every implemented endpoint path matches the canonical contract.
- Request shapes match the canonical contract.
- Response envelopes use `{ data: ... }`.
- Error envelopes use `{ error: { code, message, details } }`.
- List endpoints use `{ data: { items, page, pageSize, total } }`.
- Critical mutation responses include required side-effect summaries.
- Enum/status values match the canonical values.
- Auth requirements match the contract, with health unauthenticated and business endpoints protected.

## 9. Database impact

Schema changes are not expected unless a confirmed acceptance gap requires a forward migration.

Database verification must cover:

- baseline migration apply,
- updated_at triggers,
- account consistency guards,
- target uniqueness,
- reminder guards,
- problem-photo guard,
- inventory non-negative constraints,
- active product+plant rule uniqueness,
- no hidden business side-effect triggers.

## 10. Backend design notes

- Fixes should be targeted at acceptance gaps, not broad rewrites.
- Preserve controller/service/repository boundaries.
- Verify all multi-write critical flows use explicit transactions.
- Verify ports/adapters isolate auth, storage, weather, AI, and push.
- Verify account scoping is enforced in every repository/service path.
- Verify logs and errors do not leak secrets.
- Forbidden shortcuts: relaxing invariants to pass tests, skipping rollback tests, hiding provider/mock limitations.

## 11. Frontend design notes

- Verify critical flows on mobile and desktop.
- Ensure create activity shows intent and backend side effects.
- Ensure create problem supports problem photos and observation no-photo behavior.
- Ensure suggested/planned task visual distinction.
- Ensure AI suggestions are visibly suggestions.
- Ensure rain prompt wording remains advisory.
- Verify frontend does not access DB, app tables, storage buckets, or providers directly.

## 12. Integration design notes

- Auth must be through `AuthPort`.
- Storage must be through `StoragePort`.
- Weather must be through `WeatherPort`.
- AI must be through `AiPort`.
- Push must be through `PushPort`.
- Worker/scheduler ownership must be explicit.
- Test/dev mocks must sit behind the same ports and be documented as mocks.
- Production provider status must not be overstated.

## 13. Testing requirements

### Unit tests

- Target resolver, inventory allocator, reminder scheduler, quarantine calculation, validators, DTO mapping, and frontend form validators.

### Integration tests

- Account scoping, repository behavior, database guards, transaction rollback, inventory ledger, activity creation, task confirmation, AI acceptance, weather confirmation, problem photos.

### API tests

- Success/error envelopes, pagination, auth required, filters, response shapes, critical mutation side-effect arrays.

### Frontend tests

- App shell, create activity, bulk target selector, product usage warnings, create problem/photo behavior, task confirm UI, AI suggestion display, weather prompt wording, notification settings if included.

### E2E tests

- Full garden setup.
- Treatment with full side effects.
- Confirm suggested task.
- Inventory shortage blocked/allowed.
- Problem with photo.
- Observation without photo rejection/no uploader.
- AI suggestion accept/reject mock flow.
- Weather rain confirmation mock/adapter flow.
- Cross-account safety.
- Deployment smoke tests where practical.

### Static/security checks

- No frontend direct DB/table/storage/provider access.
- No provider secrets in frontend build.
- Supabase Studio protected.
- PostgreSQL private.
- No service role key in frontend/logs/docs.

## 14. Verification checklist

- [ ] `npm run typecheck` passes for applicable packages.
- [ ] `npm run lint` passes for applicable packages.
- [ ] `npm test` passes for applicable packages.
- [ ] `npm run build` passes for applicable packages.
- [ ] E2E suite passes or unavailable tests are clearly documented.
- [ ] API contract checks pass.
- [ ] Account scoping checks pass.
- [ ] Transaction rollback checks pass.
- [ ] Static secret/boundary checks pass.
- [ ] Production checklist reviewed.
- [ ] Final implementation report is written.
- [ ] Deferred work and provider/mock status are documented honestly.

## 15. Review checklist

- [ ] No remaining P0 acceptance gaps.
- [ ] Critical workflows are transaction-safe.
- [ ] Inventory ledger is preserved.
- [ ] Target resolution is correct.
- [ ] Task reminder boundaries are correct.
- [ ] AI/weather boundaries are preserved.
- [ ] Problem photo rules are preserved.
- [ ] Frontend/backend responsibility boundaries are clean.
- [ ] Deployment/security boundaries are documented and checked.
- [ ] Tests are meaningful and actually run.
- [ ] Known limitations are honest.

## 16. Suggested branch name

```text
feature/final-hardening
```

## 17. Expected PR summary

```md
## Summary
Completed final hardening and acceptance pass for Gardening Helper v1.

## Scope
- Closed acceptance gaps.
- Added/updated P0/P1 tests.
- Ran contract, E2E, static/security, and deployment smoke checks.
- Added final implementation report.

## Domain rules preserved
- Account scoping, target resolution, activity transaction, inventory ledger, task reminders, AI/weather boundaries, and problem photo rules verified.

## Tests
- <commands run and results>

## Deferred work
- <honest list of deferred or not-in-scope items>

## Review focus
- Remaining P0/P1 gaps.
- Regression risks across integrated workflows.
- Test/provider status honesty.
- Production readiness.
```

## 18. Risks and pitfalls

- Adding new features instead of closing acceptance gaps.
- Weakening invariants to make tests pass.
- Claiming tests passed without running them.
- Hiding mock provider status.
- Skipping cross-account or rollback tests.
- Treating deployment docs as production-safe without Studio/Postgres protection.
- Making broad cosmetic rewrites late in the project.

## 19. Exit criteria

- Required checks pass or failures are clearly documented with reason.
- P0 acceptance tests are covered.
- Critical E2E flows pass where practical.
- Security/static boundary checks pass.
- Production checklist is reviewed.
- Final implementation report documents completed work, provider/mocks status, deferred work, run instructions, and known limitations.
- The project is ready for v1 review or release decision.
