# Phase 4 — Frontend Project Foundation

## 1. Purpose

This phase creates the Angular PWA shell and typed API client foundation without domain feature pages. It exists so later frontend phases share routing, layout, auth-session handling, HTTP interceptors, API error mapping, Material setup, PWA setup, and test/build commands.

## 2. Position in the sequence

Phase 1 must already define backend API conventions and envelopes. Phase 3 may exist for backend auth behavior, but this phase can establish frontend session-token plumbing without building login UX beyond foundation needs. Later frontend phases depend on the app shell, typed API client, route layout, auth token interceptor, and global error handling.

This phase must not be merged with Phase 7 because garden structure pages should be reviewed after the shell and API boundary are stable. It must not be merged with backend phases because frontend architecture and responsibility boundaries need independent review.

## 3. Source documents

- `docs/gardening-helper-frontend-technical-spec-v1.md` - defines Angular, Angular Material, PWA, route map, shell, API services, auth boundary, state, forms, and mobile/desktop behavior.
- `docs/gardening-helper-canonical-api-contract-v1.md` - defines `/api/v1`, response envelopes, error envelopes, and auth header expectations.
- `docs/gardening-helper-domain-rules-and-invariants-v1.md` - defines frontend as not business truth and forbids direct application table/storage access.
- `docs/gardening-helper-implementation-instructions-for-ai-v1.md` - defines frontend folder conventions, Reactive Forms, typed API services, and forbidden shortcuts.
- `docs/gardening-helper-testing-and-acceptance-spec-v1.md` - defines app shell, route, API error, and frontend boundary acceptance tests.
- `docs/env.example` - distinguishes frontend-safe Supabase Auth anon config from backend-only secrets.

## 4. Scope

### Frontend scope

- Scaffold Angular app using standalone components.
- Configure Angular Material.
- Configure PWA/service worker baseline.
- Add responsive shell with top app bar, desktop navigation, mobile navigation behavior, router outlet, and global snackbar/error layer.
- Add initial route structure with placeholder pages only.
- Add Supabase Auth session bootstrap for login/session token handling only.
- Add typed API base client targeting `/api/v1`.
- Add auth token interceptor for Fastify API calls.
- Add API error interceptor/mapper for canonical `{ error: ... }` envelopes.
- Add basic app initialization/loading states.
- Add frontend scripts for typecheck, lint, test, and build where tooling exists.

### Backend scope

- None, except minor CORS/config compatibility if the frontend foundation cannot call the API in dev.

### Testing scope

- Add app shell render tests.
- Add route placeholder tests.
- Add API interceptor/error mapper tests.
- Add static checks preventing direct Supabase table/storage usage.

## 5. Out of scope

- Domain feature pages beyond placeholders.
- Business forms.
- Direct database or Supabase table access.
- Direct Supabase Storage access for problem photos.
- Push notification registration flow.
- AI, weather, product, inventory, activity, task, and problem workflows.
- Frontend-owned business logic.

## 6. Dependencies and prerequisites

- Previous phases required: Phase 1 for API conventions.
- Related phase expected: Phase 3 for backend auth behavior, though frontend can scaffold token forwarding before full login UI.
- Existing source code expected: none in the current repository.
- Expected frontend paths after implementation: `src/app/core/`, `src/app/shared/`, `src/app/features/`, `src/app/core/api/`, `src/app/core/auth/`, `src/app/core/interceptors/`, `src/app/core/layout/`.
- Environment variables: frontend may use API base URL and Supabase anon/Auth URL values only. It must not include `SUPABASE_SERVICE_ROLE_KEY`, database credentials, VAPID private key, AI keys, or other backend-only secrets.
- Test infrastructure requirements: Angular component/unit tests and static search/check capability.

## 7. Domain rules and invariants affected

- Frontend is not business truth.
- Frontend never talks directly to the database.
- Frontend never accesses application tables directly.
- Frontend may use Supabase Auth only for login/session handling.
- All application data access goes through the Fastify API.
- Frontend uses typed API services.
- API errors must be displayed.
- Supabase service role key is backend-only.

## 8. API contract impact

This phase does not introduce backend API endpoints.

Frontend API client must preserve:

- Base path `/api/v1`.
- `Authorization: Bearer <access_token>` for authenticated API calls when a token is present.
- Success envelope `{ data: ... }`.
- Error envelope `{ error: { code, message, details } }`.
- List envelope `{ data: { items, page, pageSize, total } }`.

The only endpoint likely consumed for smoke testing is:

- `GET /api/v1/health`

## 9. Database impact

No schema changes are expected in this phase.

Frontend must not access the database or application tables directly.

## 10. Backend design notes

No backend work is expected beyond optional CORS/dev compatibility. If CORS is touched, it must remain restricted and not expose backend-only secrets.

## 11. Frontend design notes

- Use standalone Angular components.
- Use Angular Material as the base UI system.
- Use route-level feature pages and keep placeholders thin.
- Use Reactive Forms as the default for future business forms, even if this phase only creates foundations.
- Use Signals for local UI state and RxJS for async/API flows.
- Keep raw `HttpClient` calls inside API/core services, not components.
- Global error handling should render backend validation and business errors clearly.
- Desktop shell should support persistent nav; mobile shell should remain single-column and not depend on hover.
- PWA setup must not imply offline write sync.
- Forbidden shortcuts: direct Supabase app-table calls, direct storage bucket calls, service role key in frontend config, untyped raw API handling in components, giant shell component absorbing feature logic.

## 12. Integration design notes

Supabase Auth session handling is allowed in frontend only for:

- sign in/sign out scaffolding if needed,
- session refresh,
- reading current access token for Fastify API calls.

No external business integration work is expected in this phase.

Secret-handling rules:

- Frontend may receive `SUPABASE_ANON_KEY` only for Auth session handling.
- Frontend must never receive `SUPABASE_SERVICE_ROLE_KEY`, `SUPABASE_JWT_SECRET`, database credentials, VAPID private key, AI key, or storage service credentials.

## 13. Testing requirements

### Unit/component tests

- App shell renders primary navigation and router outlet.
- Placeholder routes render without crashing.
- API error mapper handles canonical error envelopes.
- Auth interceptor attaches bearer token when session token exists.
- Auth interceptor omits auth header when no token exists.

### Frontend tests

- Mobile navigation state can open/close.
- Global error display shows backend `message` and validation details where available.

### Static/security checks

- No direct Supabase table query calls exist in app code.
- No direct Supabase Storage business calls exist.
- No backend-only environment variables are referenced in frontend code.

## 14. Verification checklist

- [ ] Angular app shell exists.
- [ ] Angular Material configured.
- [ ] PWA/service worker baseline configured.
- [ ] Route placeholders exist for documented route map where practical.
- [ ] Typed API base client targets `/api/v1`.
- [ ] Auth token interceptor sends bearer token to Fastify API.
- [ ] API error mapper supports canonical error envelope.
- [ ] `npm run typecheck` passes for frontend.
- [ ] `npm run lint` passes for frontend if configured.
- [ ] `npm test` passes for frontend.
- [ ] `npm run build` passes for frontend.
- [ ] Static search confirms no direct application-table or storage access.
- [ ] Static search confirms no service role key or backend-only secret in frontend.

## 15. Review checklist

- [ ] Frontend architecture matches feature-based Angular conventions.
- [ ] Shell is responsive and not a giant feature component.
- [ ] API services are typed and centralized.
- [ ] Frontend handles `{ data: ... }` and `{ error: ... }` envelopes.
- [ ] Supabase frontend usage is limited to Auth/session handling.
- [ ] No application table or storage bucket access from Angular.
- [ ] No business feature pages slipped into foundation scope.
- [ ] Tests cover shell, route, interceptor, and error behavior.

## 16. Suggested branch name

```text
feature/frontend-foundation
```

## 17. Expected PR summary

```md
## Summary
Implemented frontend project foundation.

## Scope
- Added Angular Material PWA shell.
- Added route placeholders and typed API client foundation.
- Added auth token and API error interceptors.

## Domain rules preserved
- Frontend uses Fastify API for application data.
- Supabase usage is limited to auth/session handling.
- No frontend business truth was introduced.

## Tests
- <commands run and results>

## Deferred work
- Domain pages, forms, notifications, AI, weather, and storage flows remain deferred.

## Review focus
- Frontend/backend boundary.
- API envelope handling.
- Secret handling.
- Shell responsiveness.
```

## 18. Risks and pitfalls

- Using Supabase generated REST/table APIs for application data.
- Placing backend-only secrets in frontend environment files.
- Scattering raw `HttpClient` calls across components.
- Building a large shell component that later becomes hard to maintain.
- Treating PWA setup as offline write sync.
- Duplicating backend validation/business rules in frontend foundation code.

## 19. Exit criteria

- Angular PWA foundation exists and builds.
- Shell, routing, API client, auth token forwarding, and error handling are in place.
- Static checks show no direct application table/storage access and no backend-only secrets.
- No domain pages or business workflows have been implemented.
