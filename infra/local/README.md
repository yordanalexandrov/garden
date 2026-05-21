# Local Supabase Infrastructure

This directory contains the local Docker Compose setup needed by Gardening
Helper during development. It is not a production Hetzner deployment file.

The stack starts Supabase Postgres, Supabase Auth, Supabase Storage, PostgREST
for storage/internal use, imgproxy, postgres-meta, and a loopback-only gateway
on `http://localhost:8000`.

## Start

```bash
cp .env.example .env
node scripts/generate-supabase-jwts.mjs 'replace-with-at-least-32-characters'
```

Copy the generated `SUPABASE_JWT_SECRET`, `SUPABASE_ANON_KEY`, and
`SUPABASE_SERVICE_ROLE_KEY` lines into `.env`, then run:

```bash
docker compose --env-file .env up -d
docker compose ps
curl http://localhost:8000/health
```

## Backend Env

From the repository root, start the backend against this stack with:

```bash
cd backend

export NODE_ENV=development
export PORT=3000
export DATABASE_URL='postgres://postgres:<POSTGRES_PASSWORD>@localhost:54322/postgres'
export SUPABASE_JWT_SECRET='<SUPABASE_JWT_SECRET>'
export SUPABASE_AUTH_EXTERNAL_URL='http://localhost:8000/auth/v1'

npm run db:migrate
npm run dev
```

## Local Access Token

After migrations, the seed data includes demo account
`00000000-0000-0000-0000-000000000001`. Mint a local JWT for protected backend
API calls:

```bash
SUPABASE_JWT_SECRET='<SUPABASE_JWT_SECRET>' \
  node scripts/mint-local-access-token.mjs
```

Use the output as:

```http
Authorization: Bearer <token>
```

## Stop

```bash
docker compose down
```

To remove local database and storage volumes:

```bash
docker compose down -v
```

## Boundary Notes

The gateway is bound to `127.0.0.1` only. Do not expose it directly on a public
interface. If this setup is adapted beyond local development, put it behind a
proper reverse proxy and protect admin surfaces.

PostgREST is present for Supabase infrastructure compatibility. Angular must not
use Supabase generated REST/table APIs for Gardening Helper application data.
