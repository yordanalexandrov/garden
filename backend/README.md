# Gardening Helper Backend

Phase 2 backend foundation for the Gardening Helper Fastify API and PostgreSQL database layer.

## Commands

```bash
npm run typecheck
npm run lint
npm test
npm run test:db
npm run db:migrate
npm run db:reset:test
npm run build
```

The app exposes only unauthenticated `GET /api/v1/health`.
Auth, provider adapters, frontend work, domain repositories, and domain workflows are deferred to later phases.

Provider and database secrets are backend-only and must not be logged.

## Database

The backend uses Kysely with PostgreSQL for self-hosted Supabase Postgres. Connections are created explicitly through the database client factory; importing database modules does not open a connection.

`npm run db:migrate` applies the baseline SQL files from `../docs` in this order:

1. `001_initial_schema_gardening_helper.sql`
2. `002_views_gardening_helper.sql`
3. `003_seed_reference_data_gardening_helper.sql`
4. `004_guards_and_triggers_gardening_helper.sql`

The seed migration is local/dev/test convenience data only. It is not authorization truth and should not be used to infer account access.

Applied migrations are tracked in `gardening_helper_schema_migrations`, so `npm run db:migrate` can be rerun safely against the same local/private database.

Database commands use `DATABASE_URL` or `POSTGRES_HOST`, `POSTGRES_PORT`, `POSTGRES_DB`, `POSTGRES_USER`, and `POSTGRES_PASSWORD`. Migration commands refuse `NODE_ENV=production`, production-marked targets, and public database hosts.

`npm run db:reset:test` resets the `public` schema and reapplies the baseline migrations. It requires `TEST_DATABASE_URL` or `DATABASE_URL` pointing at a local/private test database. The reset command refuses to run unless the database name includes a test marker such as `test` or `ci`, or `ALLOW_TEST_DATABASE_RESET=true` is set.
