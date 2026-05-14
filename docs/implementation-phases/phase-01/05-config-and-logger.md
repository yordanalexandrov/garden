# Implementation Task - Phase 1 Step 5: Config and Logger

## Role

You are the **Implementation Agent**.

Use:
- `AGENTS.md`
- `docs/gardening-helper-implementation-agent-instructions.md`
- `docs/gardening-helper-ai-implementation-handoff-readme-v1.md`
- all relevant specs for this task

Final infrastructure/provider decisions:
- Deployment: Hetzner VPS + Docker Compose
- Database: self-hosted Supabase Postgres
- Auth: self-hosted Supabase Auth through `AuthPort`
- Storage: self-hosted Supabase Storage through `StoragePort`
- Weather: Open-Meteo through `WeatherPort`
- Push: raw Web Push with VAPID through `PushPort`
- Correction workflow: hybrid correction model

The application data API remains the Fastify API under `/api/v1`.

---

# Task

## Goal

Implement:

```text
Add backend config loading, environment validation, and logger setup with explicit secret redaction.
```

## Branch

Use branch:

```text
feature/backend-foundation
```

---

# Scope

Implement only:

- [ ] Add backend config loader.
- [ ] Validate allowed Phase 1 environment variables without requiring provider/database secrets.
- [ ] Recognize future environment names from `docs/env.example` where useful, but keep optional for Phase 1 tests.
- [ ] Distinguish backend-only secrets from frontend-safe config in code and documentation.
- [ ] Add logger setup compatible with Fastify.
- [ ] Add secret redaction policy for logs.
- [ ] Add tests or static checks proving secret-like keys are redacted or not logged.
- [ ] Document backend local environment expectations if a backend README/package README is introduced.

Environment variables Phase 1 may recognize:

```text
NODE_ENV
PORT
APP_BASE_URL
API_BASE_URL
FRONTEND_URL
DATABASE_URL
POSTGRES_HOST
POSTGRES_PORT
POSTGRES_DB
POSTGRES_USER
POSTGRES_PASSWORD
SUPABASE_URL
SUPABASE_ANON_KEY
SUPABASE_SERVICE_ROLE_KEY
SUPABASE_JWT_SECRET
SUPABASE_AUTH_EXTERNAL_URL
SUPABASE_AUTH_SITE_URL
SUPABASE_STORAGE_URL
SUPABASE_STORAGE_BUCKET_PROBLEM_PHOTOS
WEATHER_PROVIDER
OPEN_METEO_BASE_URL
VAPID_PUBLIC_KEY
VAPID_PRIVATE_KEY
VAPID_SUBJECT
AI_PROVIDER
AI_API_KEY
AI_MODEL
WORKER_ENABLED
REMINDER_JOB_INTERVAL_SECONDS
WEATHER_JOB_INTERVAL_SECONDS
SUPABASE_STUDIO_USERNAME
SUPABASE_STUDIO_PASSWORD
```

Provider/database secrets must not be required by health tests in Phase 1.

---

# Out of Scope

Do not implement:

- [ ] Database connection.
- [ ] Auth adapter.
- [ ] Storage/weather/AI/push adapters.
- [ ] Worker/scheduler behavior.
- [ ] Deployment compose files.
- [ ] Frontend environment handling.
- [ ] Supabase Studio or PostgreSQL network configuration.

---

# Required Documents

Read before coding:

- [ ] `AGENTS.md`
- [ ] `docs/gardening-helper-implementation-agent-instructions.md`
- [ ] `docs/gardening-helper-ai-implementation-handoff-readme-v1.md`
- [ ] `docs/gardening-helper-implementation-instructions-for-ai-v1.md`
- [ ] `docs/gardening-helper-domain-rules-and-invariants-v1.md`
- [ ] `docs/gardening-helper-canonical-api-contract-v1.md`
- [ ] `docs/gardening-helper-testing-and-acceptance-spec-v1.md`
- [ ] `docs/gardening-helper-backend-application-design-pack-v1.md`
- [ ] `docs/env.example`
- [ ] `docs/implementation-phases/phase-01-backend-project-foundation.md`
- [ ] Existing backend config/logger/app files

---

# Domain Rules Affected

This task touches:

- [ ] deployment/security docs
- [ ] provider adapter boundary

Important rules to preserve:

```text
Supabase service role key is backend-only.
Provider secrets must not be logged.
External integrations go through ports/adapters.
PostgreSQL must not be publicly exposed if deployment/admin config is touched.
Supabase Studio must be protected if deployment/admin config is touched.
```

---

# Required Implementation Details

Implement:

- [ ] backend config loader
- [ ] environment validation
- [ ] logger setup
- [ ] secret redaction policy
- [ ] tests
- [ ] docs/update notes if needed

Remove or ignore template items that are not relevant.

---

# Required Infrastructure/Security Boundaries

Preserve these rules:

- [ ] no direct frontend access to application tables
- [ ] no bypass of the Fastify API for application data
- [ ] no Supabase service role key in frontend code/env/build output/logs
- [ ] no direct Supabase SDK usage inside domain services except behind adapters
- [ ] Supabase Studio protected if deployment/admin config is touched
- [ ] PostgreSQL not publicly exposed if deployment/admin config is touched
- [ ] Supabase Auth used only for auth/session flows
- [ ] Supabase Storage used through `StoragePort`
- [ ] Open-Meteo used through `WeatherPort`
- [ ] raw Web Push used through `PushPort`
- [ ] worker/scheduler ownership is explicit for reminders/weather checks

---

# API Contract

Endpoints involved:

```text
None directly in this step.
```

Request/response must follow:

- `docs/gardening-helper-canonical-api-contract-v1.md`

---

# Tests Required

Add or update tests for:

- [ ] edge cases

Specific test cases:

1. Config loader succeeds in test/development mode without provider/database secrets.
2. Invalid `NODE_ENV` or invalid numeric config returns a validation/config error.
3. Logger redacts secret-like keys such as `SUPABASE_SERVICE_ROLE_KEY`, `SUPABASE_JWT_SECRET`, `VAPID_PRIVATE_KEY`, `AI_API_KEY`, `DATABASE_URL`, and `POSTGRES_PASSWORD`.
4. Logger does not log full environment objects.

---

# Acceptance Criteria

The task is complete when:

- [ ] Config loading is centralized and typed.
- [ ] Phase 1 health tests do not require real provider/database secrets.
- [ ] Backend-only secret names are recognized and redacted.
- [ ] Logger setup is wired into Fastify or ready for the app factory.
- [ ] Tests/static checks cover secret redaction.
- [ ] No provider adapter or database connection is initialized.
- [ ] Relevant checks pass or unavailable commands are reported exactly.

---

# Commands to Run

Run from the backend package root:

```bash
npm run typecheck
npm run lint
npm test
npm run build
```

If any command does not exist or fails due to pre-existing setup, report it clearly.

---

# PR Requirements

PR description must include:

- Summary
- Scope
- Domain rules affected
- API changes
- Database changes
- Tests run
- Integration/provider status
- Review focus

---

# Notes for Implementation Agent

Do not log `process.env` wholesale.

Do not require `DATABASE_URL`, Supabase keys, VAPID keys, AI keys, or storage/weather provider settings for Phase 1 app creation or health tests.

Do not claim tests passed unless they were actually run.
