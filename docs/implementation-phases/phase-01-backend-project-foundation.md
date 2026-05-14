# Phase 1 — Backend Project Foundation

## 1. Purpose

This phase creates the backend application skeleton and shared API conventions without implementing domain workflows. It exists so every later backend phase has one Fastify bootstrap, one error model, one validation approach, one config loader, one logger policy, and one test harness.

## 2. Position in the sequence

Before this phase, only documentation and SQL migrations are expected to exist. Later backend phases depend on the route registration pattern, `/api/v1` base path, API envelope helpers, error mapping, validation setup, and test commands created here.

This phase must not be merged with Phase 2 because database connectivity and transaction behavior need separate review. It must not be merged with Phase 3 because auth/account scoping introduces security decisions that should be reviewed independently. It must not include domain CRUD because the foundation should prove framework behavior before business workflows are added.

## 3. Source documents

- `docs/gardening-helper-implementation-instructions-for-ai-v1.md` - defines the mandatory backend stack, layering, API base path, validation, error handling, and forbidden shortcuts.
- `docs/gardening-helper-backend-application-design-pack-v1.md` - defines the Fastify modular monolith shape, controller/service/repository boundaries, shared errors, and suggested `src/` structure.
- `docs/gardening-helper-canonical-api-contract-v1.md` - defines `/api/v1`, success/error envelopes, standard error codes, and `GET /health`.
- `docs/gardening-helper-domain-rules-and-invariants-v1.md` - defines backend-owned business logic, thin controllers, provider secret handling, and no hidden business behavior.
- `docs/gardening-helper-testing-and-acceptance-spec-v1.md` - defines test expectations for API envelopes, validation errors, and health route behavior.
- `docs/env.example` - lists backend-only and frontend-safe environment variables that config validation must respect later.

## 4. Scope

### Backend scope

- Create backend project/package structure using the documented modular monolith conventions.
- Add strict TypeScript configuration.
- Add Fastify app factory and server entrypoint.
- Add route registration under `/api/v1`.
- Add unauthenticated `GET /api/v1/health`.
- Add config loading and environment validation.
- Add centralized success and error envelope helpers.
- Add `AppError` or equivalent standard error class.
- Map validation, auth, domain, external provider, and internal errors to canonical error codes.
- Add schema validation setup, preferably Zod.
- Add logger setup with a documented secret redaction policy.
- Add baseline backend scripts for typecheck, lint, test, and build where tooling is present.

### Testing scope

- Add backend test framework setup.
- Add route tests for health, standard error envelopes, and validation error mapping.
- Add a smoke test that can instantiate the Fastify app without opening a network listener.

### Documentation scope

- Document backend commands and local environment expectations if a backend README or package README is introduced.

## 5. Out of scope

- Domain CRUD endpoints.
- Database client, migrations, repositories, or transactions.
- Auth/JWT validation and account context.
- Frontend project setup.
- Supabase Storage, Open-Meteo, AI, Push, or other provider adapters.
- Activity, inventory, task, target, problem, weather, AI, or push workflows.
- Schema changes.

## 6. Dependencies and prerequisites

- Previous phases required: none.
- Existing files expected: documentation under `docs/`, SQL migrations under `docs/`, and `IMPLEMENTATION_PHASES.md`.
- Existing source code expected: none in the current repository.
- Expected backend paths after implementation: `src/app/`, `src/config/`, `src/shared/api/`, `src/shared/errors/`, `src/shared/validation/`, and `src/modules/health/` or equivalent.
- Database requirements: none.
- Environment variables: config validation may recognize `NODE_ENV`, `APP_BASE_URL`, `API_BASE_URL`, `FRONTEND_URL`, and placeholders from `docs/env.example`, but must not require provider secrets for health tests.
- Test infrastructure requirements: Fastify route injection support and deterministic unit/API tests.

## 7. Domain rules and invariants affected

- Backend owns business logic.
- Controllers stay thin.
- Services orchestrate workflows and transactions.
- Repositories only access data.
- External integrations go through ports/adapters.
- Supabase service role key is backend-only.
- Provider secrets must not be logged.
- API uses standard response envelopes.
- No hidden business side effects are implemented in database triggers.

## 8. API contract impact

Endpoints involved:

- `GET /api/v1/health`

Request shape:

- No body.
- No authentication required.

Response envelope:

- Success must use `{ "data": { "status": "ok", "timestamp": "<ISO timestamp>" } }`.
- Errors must use `{ "error": { "code", "message", "details" } }`.

Error codes introduced at the foundation level should include:

- `VALIDATION_ERROR`
- `UNAUTHORIZED`
- `FORBIDDEN`
- `NOT_FOUND`
- `CONFLICT`
- `BUSINESS_RULE_VIOLATION`
- `INVENTORY_SHORTAGE`
- `EXTERNAL_SERVICE_ERROR`
- `INTERNAL_ERROR`

## 9. Database impact

No schema changes are expected in this phase.

The backend foundation must not modify or execute the SQL migration pack yet.

## 10. Backend design notes

- Controllers should only parse, validate, call a service or handler, and return envelopes.
- Add shared DTO/envelope helpers before domain modules depend on them.
- Keep domain module directories empty or absent unless they are needed for route registration placeholders.
- Validation failures should return `VALIDATION_ERROR` with useful field details.
- Unexpected errors should be logged server-side and returned as `INTERNAL_ERROR` without leaking secrets.
- Config validation must distinguish backend-only secrets from frontend-safe config.
- The Fastify app factory should be testable through injection and should not bind to a port during tests.
- Forbidden shortcuts: raw unwrapped responses, hardcoded secrets, domain logic in health route, provider SDK initialization in foundation code.

## 11. Frontend design notes

No frontend work is expected in this phase.

## 12. Integration design notes

No external integration work is expected in this phase.

Placeholder folders for future ports are acceptable only if they do not initialize real providers or require real secrets.

## 13. Testing requirements

### Unit tests

- Envelope helper returns canonical success shape.
- Error mapper maps `AppError` codes to expected HTTP statuses.
- Validation error mapper returns `VALIDATION_ERROR` with details.

### API tests

- `GET /api/v1/health` returns 200 and `{ data: { status, timestamp } }`.
- Unknown route returns canonical error envelope.
- A test-only validation failure returns canonical error envelope.

### Static/security checks

- Config and logger tests or static checks prevent logging values named like service role keys, JWT secrets, VAPID private keys, AI keys, and database passwords.

## 14. Verification checklist

- [ ] Backend package/project structure exists.
- [ ] `GET /api/v1/health` returns `{ data: ... }`.
- [ ] Errors use `{ error: { code, message, details } }`.
- [ ] Standard error codes match the canonical API contract.
- [ ] Fastify app can be created in tests without opening a port.
- [ ] `npm run typecheck` passes for backend.
- [ ] `npm run lint` passes for backend if configured.
- [ ] `npm test` passes for backend.
- [ ] `npm run build` passes for backend.
- [ ] No domain CRUD or provider adapters were added.
- [ ] No secrets are hardcoded or logged.

## 15. Review checklist

- [ ] Backend structure matches the documented modular monolith conventions.
- [ ] Controllers/handlers are thin.
- [ ] API base path is `/api/v1`.
- [ ] Health endpoint is unauthenticated only because the contract allows it.
- [ ] Success and error envelopes match the canonical API contract.
- [ ] Validation is centralized and typed.
- [ ] Logger/config code does not expose backend-only secrets.
- [ ] No database, auth, domain CRUD, AI, weather, storage, or push behavior slipped into this phase.
- [ ] Tests cover health, error envelope, and validation mapping.

## 16. Suggested branch name

```text
feature/backend-foundation
```

## 17. Expected PR summary

```md
## Summary
Implemented backend project foundation for Gardening Helper.

## Scope
- Added Fastify/TypeScript backend skeleton.
- Added `/api/v1` route registration and health endpoint.
- Added shared API envelope, error, validation, config, logger, and test setup.

## Domain rules preserved
- Backend owns API behavior.
- Controllers remain thin.
- No domain workflows or provider integrations were introduced.

## Tests
- <commands run and results>

## Deferred work
- Database, auth/account scoping, domain APIs, frontend, and provider adapters remain deferred to later phases.

## Review focus
- API envelope correctness.
- Error mapping.
- Config/logger secret handling.
- Scope boundaries.
```

## 18. Risks and pitfalls

- Returning raw Fastify responses instead of canonical envelopes.
- Requiring real database/provider secrets before those phases exist.
- Hiding framework errors behind inconsistent response shapes.
- Initializing Supabase, weather, AI, storage, or push providers too early.
- Adding domain route placeholders that imply unsupported behavior.
- Logging environment variables wholesale.

## 19. Exit criteria

- Backend app foundation exists and is testable.
- Health endpoint works under `/api/v1`.
- Success/error envelope helpers are established.
- Validation and error mapping behavior is covered by tests.
- Backend scripts exist and pass or any unavailable commands are clearly documented.
- No domain, database, auth, frontend, or provider work has been implemented.
