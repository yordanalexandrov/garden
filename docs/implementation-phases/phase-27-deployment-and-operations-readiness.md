# Phase 27 — Deployment and Operations Readiness

## 1. Purpose

This phase prepares the production deployment shape for Hetzner VPS + Docker Compose with protected Supabase services. It documents and wires operational concerns without changing domain behavior.

## 2. Position in the sequence

Application phases should be complete or available enough to package API, frontend, worker, database, auth, storage, weather, AI, and push configuration. Final hardening Phase 28 depends on deployment smoke checks and production-readiness documentation.

This phase must not be merged with feature phases because operational security and deployment wiring are cross-cutting and should be reviewed separately. It must not redesign the app to fit deployment.

## 3. Source documents

- `docs/gardening-helper-production-checklist.md` - defines VPS, reverse proxy, Supabase, app services, backups, security, notifications, weather, AI, smoke tests, and sign-off checks.
- `docs/gardening-helper-implementation-instructions-for-ai-v1.md` - defines fixed providers, Docker Compose deployment, and no direct Supabase application-table access.
- `docs/gardening-helper-domain-rules-and-invariants-v1.md` - defines protected Studio, private Postgres, backend-only service role, ports/adapters, and worker ownership.
- `docs/gardening-helper-backend-application-design-pack-v1.md` - defines Hetzner/Supabase deployment topology.
- `docs/env.example` - defines environment variables and secret boundaries.
- SQL migration files - define migration/seed baseline that deployment docs must run.

## 4. Scope

### Backend scope

- Add production runtime config validation if missing.
- Add API healthcheck configuration if needed.
- Add worker entrypoint for reminder/weather jobs where implemented.
- Add Dockerfile for API/worker if code exists.

### Frontend scope

- Add production build config if missing.
- Add Dockerfile/static hosting config for Angular build if code exists.
- Ensure public runtime config includes only API base and Supabase Auth anon/session values.

### Database scope

- Document migration and seed execution instructions.
- Document backup and restore procedure.
- Ensure PostgreSQL is private to Docker/private network in compose examples.

### Integration scope

- Docker Compose for app services and self-hosted Supabase stack.
- Reverse proxy configuration example.
- Supabase Studio protection documentation/config.
- CORS and upload size limits.
- Environment variable documentation aligned with `docs/env.example`.

### Documentation scope

- Update production checklist or deployment README if needed.

## 5. Out of scope

- Changing domain behavior.
- Opening PostgreSQL publicly.
- Public unprotected Supabase Studio.
- Direct frontend application-table access through Supabase.
- New product features.
- Replacing Fastify API with Supabase REST/table access.

## 6. Dependencies and prerequisites

- Previous phases required: Phase 1 through Phase 26 as applicable.
- Existing files/modules expected: backend app, frontend app, worker, migrations, provider adapters implemented or documented honestly.
- Expected paths after implementation: Dockerfiles, compose files, reverse proxy config examples, deployment README/docs, production config files as appropriate.
- Database requirements: migrations executable; backup/restore commands documented.
- Environment variables: all variables in `docs/env.example` reviewed for production.
- Test infrastructure requirements: compose config validation and deployment smoke script/commands where practical.

## 7. Domain rules and invariants affected

- Supabase Studio must be protected.
- PostgreSQL must not be publicly exposed.
- Service role key is backend-only.
- Application data API remains Fastify.
- Worker/scheduler ownership is explicit.
- Integrations remain behind ports/adapters.
- Frontend never accesses application tables directly.
- Provider secrets must not reach frontend code/build/logs.

## 8. API contract impact

This phase does not introduce or change API endpoints.

Deployment routing must preserve:

- Frontend served at production origin.
- Fastify API routed under `/api/v1`.
- Health endpoints/checks available as already implemented.
- CORS restricted to the intended frontend origin.

## 9. Database impact

Schema changes are not expected in this phase.

Database work is operational:

- migration command and order,
- optional seed command for non-production/dev only,
- backup command,
- restore test documentation,
- private Docker/network access,
- no public PostgreSQL port.

New migrations are not expected unless final packaging reveals a real confirmed schema gap; such changes should be deferred to Phase 28 or documented separately.

## 10. Backend design notes

- API and worker should have explicit entrypoints.
- Worker responsibilities should be documented: reminder delivery and weather checks where in scope.
- Config validation should fail fast for missing production-required secrets.
- Logs should avoid secrets.
- Healthchecks should not reveal sensitive config.
- API must validate JWTs through `AuthPort` in production.
- Forbidden shortcuts: running worker logic as frontend timers, exposing provider secrets, bypassing Fastify API.

## 11. Frontend design notes

- Frontend production config may include API base URL and Supabase Auth anon/session values only.
- Frontend build artifacts must not contain backend-only secrets.
- Frontend route fallback should support SPA routing.
- Upload limits and service worker scope should be compatible with the reverse proxy.
- Forbidden shortcuts: direct Supabase table/storage access, service role key in build config, hardcoded production secrets.

## 12. Integration design notes

Integrations touched:

- Self-hosted Supabase Postgres/Auth/Storage.
- Reverse proxy/TLS.
- Worker/scheduler.
- Open-Meteo config if implemented.
- AI provider config if implemented.
- Raw Web Push/VAPID config if implemented.

Secret-handling rules:

- Database password, Supabase service role key, JWT secret, storage credentials, AI key, VAPID private key are backend/server-only.
- Supabase Studio must be protected by VPN/Tailscale, IP allowlist, basic auth, or private network.

Failure handling:

- Health checks should make service failures visible.
- Backup failure review/alerting should be documented.

## 13. Testing requirements

### Static/security checks

- Compose/reverse proxy config does not expose PostgreSQL publicly.
- Studio route is protected or documented as private.
- Frontend build artifacts do not contain service role key, database URL, AI key, VAPID private key, or JWT secret.
- CORS is restricted in production config.

### Integration/smoke tests

- Compose config validates.
- API can reach Postgres over private network.
- Frontend reaches API through `/api/v1`.
- Health checks pass.
- Migration command is documented and smoke-tested where practical.
- Worker can start and find configured jobs where implemented.
- Problem photo upload size/proxy limits are consistent.

## 14. Verification checklist

- [ ] Dockerfiles exist for frontend, API, and worker where applicable.
- [ ] Docker Compose defines app services and self-hosted Supabase stack.
- [ ] Reverse proxy example routes `/api/v1` to Fastify API.
- [ ] Only ports 80/443 are public in documented setup.
- [ ] PostgreSQL is private.
- [ ] Supabase Studio is protected.
- [ ] Environment docs align with `docs/env.example`.
- [ ] Migration/seed instructions are documented.
- [ ] Backup/restore process is documented.
- [ ] Health checks are configured.
- [ ] Service role key is absent from frontend build/config.
- [ ] Production checklist is reviewed/updated.

## 15. Review checklist

- [ ] Operational security matches production checklist.
- [ ] Fastify remains the application data API.
- [ ] Frontend does not gain direct application-table access.
- [ ] PostgreSQL is not exposed publicly.
- [ ] Studio protection is real or clearly required before production.
- [ ] Worker ownership is explicit.
- [ ] Migration/backups/restore path is clear.
- [ ] Secrets are not committed or leaked.
- [ ] No domain behavior changes are bundled.

## 16. Suggested branch name

```text
feature/deployment-readiness
```

## 17. Expected PR summary

```md
## Summary
Prepared deployment and operations readiness.

## Scope
- Added Docker/Compose/reverse proxy deployment shape.
- Documented env, migrations, backups, health checks, and Studio/Postgres protections.
- Added worker runtime wiring where applicable.

## Domain rules preserved
- Application data still goes through Fastify API.
- PostgreSQL is private.
- Supabase Studio is protected.
- Backend-only secrets remain server-side.

## Tests
- <commands/checks run and results>

## Deferred work
- Final end-to-end hardening and acceptance checks remain in Phase 28.

## Review focus
- Operational security.
- Secret boundaries.
- API routing.
- Backup/restore path.
```

## 18. Risks and pitfalls

- Publishing PostgreSQL port.
- Leaving Supabase Studio public.
- Putting service role key into frontend build.
- Routing frontend directly to Supabase application tables.
- Omitting worker entrypoint or ownership.
- Documenting backups without restore procedure.
- Mixing product behavior changes into deployment PR.

## 19. Exit criteria

- Deployment shape is documented and/or implemented.
- Security boundaries are preserved.
- Migration, backup, restore, and healthcheck paths are clear.
- Final hardening can run full acceptance against a production-shaped setup.
