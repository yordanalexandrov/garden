# Phase 3 — Auth and Account Boundary

## 1. Purpose

This phase implements backend authentication context and account scoping foundation through `AuthPort`. It exists so every later business endpoint derives the authenticated account server-side and never trusts frontend-provided account IDs.

## 2. Position in the sequence

Phase 1 must provide the Fastify app, validation, errors, and route infrastructure. Phase 2 must provide the database and transaction foundation. Later domain API phases depend on this phase for authenticated actor context, account lookup, route test helpers, and account A/account B fixture patterns.

This phase must not be merged with Phase 2 because auth boundaries are security-sensitive and should be reviewed separately from database mechanics. It must not be merged with domain CRUD phases because account scoping must be established before any business data endpoint exists.

## 3. Source documents

- `docs/gardening-helper-domain-rules-and-invariants-v1.md` - defines all business records as account-scoped, JWT validation through `AuthPort`, and service-role key restrictions.
- `docs/gardening-helper-canonical-api-contract-v1.md` - defines `Authorization: Bearer <access_token>`, auth-required endpoints, `UNAUTHORIZED`, `FORBIDDEN`, and account scoping rules.
- `docs/gardening-helper-backend-application-design-pack-v1.md` - defines `AuthPort`, `AccountsRepository`, and authenticated actor context.
- `docs/gardening-helper-implementation-instructions-for-ai-v1.md` - fixes self-hosted Supabase Auth behind `AuthPort` and forbids bypassing the Fastify API.
- `docs/gardening-helper-testing-and-acceptance-spec-v1.md` - requires cross-account fixtures and auth/account scoping tests.
- `docs/env.example` - defines `SUPABASE_URL`, `SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`, and `SUPABASE_JWT_SECRET`.

## 4. Scope

### Backend scope

- Define `AuthPort`.
- Implement Supabase Auth JWT validation adapter or a production-shaped adapter boundary.
- Implement deterministic dev/test auth adapter behind the same port.
- Add Fastify auth hook/plugin for protected business routes.
- Add `AuthenticatedActor` type containing authenticated user/account context.
- Add account lookup/creation policy needed by the auth flow using the existing `accounts` table.
- Add `AccountsRepository`.
- Add route test helpers for authenticated, unauthenticated, invalid-token, account A, and account B requests.

### Database scope

- Use the existing `accounts` table.
- Add no schema changes unless a documented auth mapping gap blocks implementation.

### Testing scope

- Add auth hook and account fixture tests.
- Add static/security checks for frontend/backend secret boundaries where possible.

## 5. Out of scope

- Frontend login UI.
- Direct frontend access to application tables.
- Domain CRUD endpoints.
- Role/permission system beyond v1 account scoping.
- Supabase Storage, Open-Meteo, AI, or Push adapters.
- Admin/user management features.

## 6. Dependencies and prerequisites

- Previous phases required: Phase 1 and Phase 2.
- Existing files/modules expected: backend app/config/error/test setup, DB client, transaction wrapper, baseline `accounts` table.
- Expected backend paths after implementation: `src/modules/auth/`, `src/integrations/auth/`, `src/modules/accounts/`, `src/shared/plugins/auth.ts`, or equivalent.
- Database requirements: `accounts` table migrated.
- Environment variables: `SUPABASE_URL`, `SUPABASE_JWT_SECRET`, optionally `SUPABASE_SERVICE_ROLE_KEY` for backend-only adapter work; `SUPABASE_ANON_KEY` is frontend-safe only for auth/session handling later.
- Test infrastructure requirements: deterministic auth tokens or injected test auth adapter.

## 7. Domain rules and invariants affected

- All business records belong to an account.
- Cross-account access is forbidden.
- Account consistency is mandatory.
- Frontend must not submit accountId for normal flows.
- Backend auth boundary: the Fastify backend validates Supabase Auth JWTs through `AuthPort`.
- Backend must derive authenticated user/account context server-side.
- Supabase service role key is backend-only.
- Supabase Auth is used through `AuthPort`.

## 8. API contract impact

No new business endpoints are introduced by this phase.

Authentication behavior affects all future business endpoints:

- All endpoints except health/auth bootstrap endpoints require `Authorization: Bearer <access_token>`.
- Missing/invalid token must return `UNAUTHORIZED` with canonical error envelope.
- Valid token must derive account context server-side.
- Cross-account access in future endpoints should return `NOT_FOUND` or `FORBIDDEN` consistently according to service policy.

If a temporary protected test route is added for testing the auth hook, it must not become part of the public canonical API.

## 9. Database impact

Tables involved:

- `accounts`

Schema changes are not expected in this phase.

New migrations are allowed only if the implementation discovers a blocking, documented mismatch between Supabase Auth identities and the existing account model. Prefer using the existing `accounts` table without redesign.

## 10. Backend design notes

- `AuthPort.verifyAccessToken(token)` should return an `AuthenticatedActor`.
- Supabase-specific JWT validation must stay in the auth adapter, not in domain services.
- The Fastify auth plugin should decorate or attach actor context for protected routes.
- Business services in later phases must receive actor/account context from the backend, not from request bodies.
- `AccountsRepository` should verify account existence and support any documented lookup/creation policy.
- Test auth adapter should produce deterministic account A/account B actors.
- Missing token, malformed token, expired token, and account lookup failure must map to canonical errors.
- Forbidden shortcuts: trusting request body `accountId`, using Supabase generated table APIs for application data, exposing service role key to frontend, hardcoding demo account as production truth.

## 11. Frontend design notes

No frontend UI work is expected in this phase.

Future frontend auth may use Supabase Auth only for login/session handling and access-token retrieval. It must not access application tables directly.

## 12. Integration design notes

Auth integration is required:

- Port/interface: `AuthPort`.
- Real provider behavior: validate self-hosted Supabase Auth JWTs and return authenticated actor/account context.
- Mock/dev behavior: deterministic test adapter behind `AuthPort`.
- Secret handling: `SUPABASE_SERVICE_ROLE_KEY` and `SUPABASE_JWT_SECRET` are backend-only; never log them or expose them to frontend config.
- Failure handling: invalid, expired, missing, or unverifiable tokens return `UNAUTHORIZED`.

## 13. Testing requirements

### Unit tests

- Auth header parser accepts `Bearer <token>`.
- Auth header parser rejects missing or malformed headers.
- Auth adapter maps provider/JWT failures to `UNAUTHORIZED`.

### Integration/API tests

- Protected route without token returns 401 and canonical error envelope.
- Protected route with invalid token returns 401 and canonical error envelope.
- Protected route with valid account A token receives account A actor context.
- Protected route with valid account B token receives account B actor context.
- Account lookup failure returns `UNAUTHORIZED` or `FORBIDDEN` according to documented policy.

### Static/security checks

- `SUPABASE_SERVICE_ROLE_KEY` is not referenced in frontend paths.
- Auth provider code is isolated under auth adapter/module paths.
- No business route accepts trusted `accountId` from request body.

## 14. Verification checklist

- [ ] `AuthPort` is defined.
- [ ] Supabase Auth adapter or production-shaped boundary exists.
- [ ] Deterministic test auth adapter exists.
- [ ] Fastify auth hook protects business route groups.
- [ ] Actor/account context is available to future controllers/services.
- [ ] `AccountsRepository` exists.
- [ ] Missing token returns `UNAUTHORIZED`.
- [ ] Invalid token returns `UNAUTHORIZED`.
- [ ] Valid token resolves actor/account context.
- [ ] Account A/account B test helper pattern exists.
- [ ] No service role key is exposed to frontend code/config/logs.
- [ ] Backend tests/typecheck/lint/build pass where configured.

## 15. Review checklist

- [ ] Backend derives account context server-side.
- [ ] Frontend-provided `accountId` is not trusted.
- [ ] Supabase Auth usage is confined to `AuthPort` adapter boundary.
- [ ] Protected-route behavior uses canonical error envelopes.
- [ ] Account fixture strategy supports cross-account tests for later phases.
- [ ] No domain CRUD was introduced.
- [ ] No frontend direct table access or service role key exposure exists.
- [ ] Auth errors do not leak secrets or token internals.

## 16. Suggested branch name

```text
feature/auth-account-boundary
```

## 17. Expected PR summary

```md
## Summary
Implemented backend auth and account boundary foundation.

## Scope
- Added AuthPort and auth adapter boundary.
- Added Fastify auth hook and authenticated actor context.
- Added AccountsRepository and account-scoped test helpers.

## Domain rules preserved
- Backend validates JWTs through AuthPort.
- Backend derives account context server-side.
- Supabase service role key remains backend-only.

## Tests
- <commands run and results>

## Deferred work
- Frontend login UI and all domain APIs remain deferred.

## Review focus
- Account context derivation.
- AuthPort isolation.
- Secret handling.
- Cross-account test fixture readiness.
```

## 18. Risks and pitfalls

- Trusting `accountId` from request bodies.
- Treating seeded demo account as production identity.
- Letting Supabase-specific code leak into domain services.
- Exposing service role key in frontend environment or logs.
- Protecting only some future business routes by accident.
- Returning non-canonical auth errors.

## 19. Exit criteria

- Protected route infrastructure exists.
- Authenticated actor/account context is derived server-side.
- Account repository and account fixtures are ready for later endpoints.
- Auth failures return canonical envelopes.
- Cross-account test pattern is established.
- No domain API or frontend auth UI has been implemented.
