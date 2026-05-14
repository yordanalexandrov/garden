# Gardening Helper — Production Deployment Checklist

This checklist covers the v1 production deployment target:

- Hetzner VPS + Docker Compose
- Angular PWA frontend
- Fastify API under `/api/v1`
- backend worker/scheduler
- self-hosted Supabase Postgres, Auth, Storage, REST/Meta/Studio as needed
- Open-Meteo through `WeatherPort`
- raw Web Push with VAPID through `PushPort`
- AI provider behind `AiPort`

Application data must continue to flow through the Fastify API. Do not replace the application API with direct frontend access to Supabase application tables.

---

# VPS / OS

- [ ] Firewall configured.
- [ ] Only ports `80` and `443` are public.
- [ ] SSH restricted if possible, for example VPN/Tailscale, IP allowlist, key-only auth, or non-public access.
- [ ] Automatic security updates considered and documented.
- [ ] Disk usage monitoring configured.
- [ ] Docker logging limits configured for all containers.
- [ ] Host timezone and time sync configured.
- [ ] Docker daemon restart policy reviewed.

---

# Reverse proxy

- [ ] TLS enabled.
- [ ] Frontend route configured.
- [ ] `/api` routed to the Fastify API service.
- [ ] Supabase gateway routed only if needed.
- [ ] Supabase Studio route protected.
- [ ] HTTP to HTTPS redirect configured.
- [ ] Request/body limits reviewed for photo uploads.
- [ ] Proxy forwards required auth and client headers safely.

---

# Supabase stack

- [ ] Strong Postgres password configured.
- [ ] JWT secret configured.
- [ ] anon and service-role keys generated.
- [ ] Service role key is backend-only.
- [ ] Frontend receives only anon/public values needed for Supabase Auth login/session handling.
- [ ] Supabase Studio protected.
- [ ] Postgres port is not public.
- [ ] Storage bucket for problem photos created.
- [ ] Storage bucket policy does not allow public listing.
- [ ] Supabase Auth external/site URLs configured.
- [ ] Supabase services restart cleanly under Docker Compose.

---

# App services

- [ ] Angular frontend deployed.
- [ ] Fastify API running.
- [ ] Worker/scheduler running.
- [ ] Reminder job enabled.
- [ ] Weather-check job enabled if scheduled weather checks are in scope.
- [ ] Health endpoints available.
- [ ] Logs available for frontend, API, worker and Supabase services.
- [ ] API can reach Supabase Postgres over the private Docker/network path.
- [ ] API can validate Supabase Auth JWTs through `AuthPort`.

---

# Backups

- [ ] Daily PostgreSQL backup configured.
- [ ] Supabase Storage/problem-photo backup configured.
- [ ] Backup retention configured.
- [ ] Restore test procedure documented.
- [ ] Restore test executed at least once before relying on production.
- [ ] Hetzner snapshot or volume backup configured.
- [ ] Backups stored outside the single app container filesystem.
- [ ] Backup failure notification or review process defined.

---

# Security

- [ ] JWT validation active.
- [ ] Account scoping enforced backend-side.
- [ ] Service role key not exposed to frontend.
- [ ] CORS restricted to the production frontend origin.
- [ ] Rate limiting considered for auth, API mutations and uploads.
- [ ] Secrets not committed.
- [ ] `.env` files excluded from git.
- [ ] API error responses do not leak secrets.
- [ ] Supabase Studio protected by VPN/Tailscale, IP allowlist, reverse proxy basic auth, or private network access.
- [ ] PostgreSQL is private to Docker/private network.
- [ ] Supabase SDK usage is isolated behind adapters where used by backend code.

---

# Notifications

- [ ] VAPID public/private keys configured.
- [ ] VAPID private key is backend-only.
- [ ] Push subscription endpoint tested.
- [ ] Browser permission flow tested.
- [ ] Reminder job tested.
- [ ] Failed push sends are recorded without marking tasks failed.
- [ ] Push subscriptions are account-scoped.

---

# Weather

- [ ] Open-Meteo adapter configured.
- [ ] Weather requests go through `WeatherPort`.
- [ ] Weather-disabled places do not generate weather prompts.
- [ ] Rain confirmation flow tested.
- [ ] Forecasted rain is not treated as observed rain.
- [ ] Confirmed rain does not auto-fail treatment.
- [ ] Weather provider failure handled gracefully.

---

# AI

- [ ] AI provider selected and configured behind `AiPort`.
- [ ] AI provider key configured server-side only.
- [ ] AI suggestions do not save business records without user acceptance.
- [ ] AI suggestion accept/reject flow tested.
- [ ] Provider failures handled gracefully.
- [ ] AI output uncertainty/warnings are preserved for frontend display where applicable.

---

# Smoke tests

- [ ] Login works.
- [ ] Create place.
- [ ] Create plant.
- [ ] Create bed.
- [ ] Create product.
- [ ] Create inventory lot.
- [ ] Log activity with product.
- [ ] Stock movement created.
- [ ] Quarantine created when rule has quarantine days.
- [ ] Suggested task created when rule has reapplication interval.
- [ ] Confirm task creates reminders.
- [ ] Upload problem photo.
- [ ] Problem photo loads through signed URL or protected backend endpoint.
- [ ] Calendar loads.
- [ ] Dashboard loads.
- [ ] Account A cannot access Account B data, if multi-account test fixtures exist.

---

# Sign-off

- [ ] Production environment variables reviewed against `env.example`.
- [ ] Deployment/security assumptions reviewed against the source-of-truth docs.
- [ ] Backup and restore process accepted.
- [ ] Smoke tests completed after deployment.
- [ ] Rollback plan documented.
