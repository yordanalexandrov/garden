# Gardening Helper

Gardening Helper is a PWA-first garden management application with an Angular
frontend and a Fastify/TypeScript backend. Application data is stored in
self-hosted Supabase Postgres, but all business data access goes through the
backend REST API under `/api/v1`.

## Local Development

### Prerequisites

- Node.js 22 or newer.
- npm 10 or newer.
- A local or private self-hosted Supabase/Postgres database.
- Docker/Docker Compose if you are running the Supabase stack locally.

Install dependencies if they are not already present:

```bash
cd backend
npm install

cd ../frontend
npm install
```

### Backend

The backend currently requires database connection settings and a Supabase JWT
secret at runtime. It does not load `.env` files by itself, so export variables
in your shell or run commands through your preferred env loader.

Minimal local example:

```bash
cd backend

export NODE_ENV=development
export PORT=3000
export DATABASE_URL='postgres://garden_user:secret@localhost:5432/garden_dev'
export SUPABASE_JWT_SECRET='local-dev-jwt-secret'

npm run db:migrate
npm run dev
```

Health check:

```bash
curl http://localhost:3000/api/v1/health
```

Expected shape:

```json
{"data":{"status":"ok","timestamp":"2026-05-21T00:00:00.000Z"}}
```

Database commands use `DATABASE_URL` or the discrete `POSTGRES_HOST`,
`POSTGRES_PORT`, `POSTGRES_DB`, `POSTGRES_USER`, and `POSTGRES_PASSWORD`
variables. Migration commands intentionally reject production-marked targets and
public database hosts.

### Frontend

Start the Angular dev server:

```bash
cd frontend
npm start
```

Open `http://localhost:4200`.

The frontend defaults to `apiBaseUrl: '/api/v1'`. The repository does not
currently include an Angular dev proxy, so API calls from `localhost:4200` need
either a local proxy/reverse proxy to the backend on `localhost:3000`, or a
frontend-safe local environment value that points at the backend.

The current frontend environment files expose only frontend-safe values:

- `apiBaseUrl`
- `supabaseAuthUrl`
- `supabaseAnonKey`

Do not place database credentials, Supabase service role keys, JWT secrets, or
other backend-only secrets in frontend environment files.

## Self-Hosted Supabase Notes

The project expects self-hosted Supabase services as infrastructure, not as a
shortcut around the backend:

- Supabase Postgres is the persistence runtime.
- Supabase Auth is used through the backend `AuthPort`.
- Supabase Storage is used through the backend `StoragePort`.
- Angular may use Supabase Auth only for login/session handling and access-token
  reads.
- Angular must not call Supabase generated REST/table APIs for Gardening Helper
  application data.
- The Supabase service role key is backend-only.

This repository does not currently ship a local Supabase Docker Compose file. To
run locally, start a local/private self-hosted Supabase stack separately, then
point the app at it.

Minimum setup checklist:

1. Start local/private Supabase services with Postgres and Auth enabled. Storage
   is needed for later problem-photo flows.
2. Keep Postgres private to localhost or a private Docker network. Do not expose
   it publicly.
3. Record the Postgres connection details and set `DATABASE_URL`, or the
   discrete `POSTGRES_*` variables, for backend commands.
4. Configure Supabase Auth with a JWT secret and set the same value as
   `SUPABASE_JWT_SECRET` for the backend.
5. Configure the local Auth site URL for the Angular app, for example
   `http://localhost:4200`.
6. Use the Supabase anon key only where frontend-safe Auth session handling needs
   it.
7. Keep the service role key only in backend/server-side configuration.
8. Protect Supabase Studio if it is reachable outside localhost, using VPN,
   private network access, IP allowlist, or reverse proxy authentication.

Useful optional backend environment variables for a fuller local stack:

```bash
export SUPABASE_URL='http://localhost:54321'
export SUPABASE_ANON_KEY='<local-anon-key>'
export SUPABASE_SERVICE_ROLE_KEY='<backend-only-service-role-key>'

# Set only if you want backend issuer checks; it must match the JWT iss claim.
export SUPABASE_AUTH_EXTERNAL_URL='http://localhost:54321/auth/v1'

# Needed by future storage/problem-photo flows.
export SUPABASE_STORAGE_URL='http://localhost:54321/storage/v1'
export SUPABASE_STORAGE_BUCKET_PROBLEM_PHOTOS='problem-photos'
```

After Supabase/Postgres is running and backend env is set, apply the Gardening
Helper schema:

```bash
cd backend
npm run db:migrate
```

The migration runner applies the baseline SQL files from `docs/` and records
applied migrations in `gardening_helper_schema_migrations`, so it can be rerun
against the same local/private database.

### Local Docker Compose

This repository includes a local Supabase infrastructure Compose setup in
`infra/local`. It is for development only and starts:

- Supabase Postgres
- Supabase Auth
- PostgREST for Supabase internal/storage use
- Supabase Storage
- imgproxy
- postgres-meta
- a loopback-only local gateway on `http://localhost:8000`

Create local env values:

```bash
cd infra/local
cp .env.example .env
node scripts/generate-supabase-jwts.mjs 'replace-with-at-least-32-characters'
```

Copy the generated `SUPABASE_JWT_SECRET`, `SUPABASE_ANON_KEY`, and
`SUPABASE_SERVICE_ROLE_KEY` values into `infra/local/.env`, then start the
stack:

```bash
docker compose --env-file .env up -d
docker compose ps
curl http://localhost:8000/health
```

Apply the application schema from the backend package:

```bash
cd ../../backend

export NODE_ENV=development
export PORT=3000
export DATABASE_URL='postgres://postgres:replace-with-a-long-local-postgres-password@localhost:54322/postgres'
export SUPABASE_JWT_SECRET='replace-with-at-least-32-characters'
export SUPABASE_AUTH_EXTERNAL_URL='http://localhost:8000/auth/v1'

npm run db:migrate
npm run dev
```

For protected API smoke tests, the backend currently requires Supabase JWTs to
carry an application `account_id` claim. The seed migration creates demo account
`00000000-0000-0000-0000-000000000001`; you can mint a local token for it:

```bash
cd ../infra/local
SUPABASE_JWT_SECRET='replace-with-at-least-32-characters' \
  node scripts/mint-local-access-token.mjs
```

Use the printed token as `Authorization: Bearer <token>` when calling protected
backend endpoints.

Stop the local Supabase stack:

```bash
cd infra/local
docker compose down
```

Remove local database/storage volumes only when you intentionally want to delete
all local Supabase data:

```bash
docker compose down -v
```

## Verification Commands

Backend:

```bash
cd backend
npm run typecheck
npm run lint
npm test
npm run build
```

Frontend:

```bash
cd frontend
npm run typecheck
npm run lint
npm test
npm run build
npm run check:frontend-boundaries
npm run check:pwa-boundaries
```

Database integration tests need `TEST_DATABASE_URL` or `DATABASE_URL` pointing
at a local/private test database.
