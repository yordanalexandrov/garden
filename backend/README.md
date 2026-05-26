# Gardening Helper Backend

Backend foundation for the Gardening Helper Fastify API, PostgreSQL database layer, and authenticated business route wiring.

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

The app exposes REST routes under `/api/v1` for the backend phases implemented so far, including places, plants, growing structure, products, inventory, activity creation, and Phase 13 activity correction.
Storage, weather, push, AI provider adapters, and frontend correction UI are deferred to later phases.

Provider and database secrets are backend-only and must not be logged.

## Activity Correction

`POST /api/v1/activities/:activityId/correct` supports the narrow v1 correction case for inventory usage corrections on product-consuming activities that did not generate quarantine periods or suggested tasks. The request supplies a reason and one or more lot-bound original consumption movement IDs with an explicit `increase_lot` or `decrease_lot` correction.

Supported corrections append `correction` inventory movements, update the affected lot quantities in the same transaction, and write an `activity.corrected` audit row. The correction movement notes start with `correction_direction=increase_lot;` or `correction_direction=decrease_lot;` so the persisted movement record carries the lot effect direction while preserving the existing positive-quantity ledger schema. Original activities, targets, product usages, consumption movements, quarantine rows, and suggested tasks remain readable.

Unsupported v1 cases fail explicitly with canonical errors instead of rewriting history: activity type/date/target rewrites, non-consumption movement corrections, non-lot-bound movement corrections, and activities whose generated quarantine/task side effects would need separate compensation.

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

Runtime startup wires the backend database client and Supabase JWT auth adapter for upcoming authenticated business routes. `npm run dev` / `npm start` require database connection settings plus `SUPABASE_JWT_SECRET`; tests can still create an app without those dependencies by omitting them from `createApp`.

`npm run db:reset:test` resets the `public` schema and reapplies the baseline migrations. It requires `TEST_DATABASE_URL` or `DATABASE_URL` pointing at a local/private test database. The reset command refuses to run unless the database name includes a test marker such as `test` or `ci`, or `ALLOW_TEST_DATABASE_RESET=true` is set.
