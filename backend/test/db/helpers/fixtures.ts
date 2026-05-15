import type pg from "pg";

export const FixtureIds = {
  accountA: "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa",
  accountB: "bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb",
  placeA: "11111111-1111-1111-1111-111111111111",
  placeB: "22222222-2222-2222-2222-222222222222",
  plantA: "33333333-3333-3333-3333-333333333333",
  plantB: "44444444-4444-4444-4444-444444444444",
  productA: "55555555-5555-5555-5555-555555555555",
  productB: "66666666-6666-6666-6666-666666666666",
  activityA: "77777777-7777-7777-7777-777777777777",
  taskA: "88888888-8888-8888-8888-888888888888",
  problemA: "99999999-9999-9999-9999-999999999999",
  lotA: "12121212-1212-1212-1212-121212121212",
  ruleA: "13131313-1313-1313-1313-131313131313"
} as const;

export async function insertAccount(pool: pg.Pool, id: string, email: string): Promise<void> {
  await pool.query("insert into accounts (id, email, display_name) values ($1, $2, $3)", [id, email, email]);
}

export async function insertPlace(pool: pg.Pool, id: string, accountId: string, name: string): Promise<void> {
  await pool.query("insert into places (id, account_id, name) values ($1, $2, $3)", [id, accountId, name]);
}

export async function insertPlant(pool: pg.Pool, id: string, accountId: string, name: string): Promise<void> {
  await pool.query(
    "insert into plants (id, account_id, common_name, lifecycle_type, growing_style) values ($1, $2, $3, 'annual', 'vegetable')",
    [id, accountId, name]
  );
}

export async function insertProduct(pool: pg.Pool, id: string, accountId: string, name: string): Promise<void> {
  await pool.query(
    "insert into products (id, account_id, name, category, default_unit) values ($1, $2, $3, 'fungicide', 'g')",
    [id, accountId, name]
  );
}

export async function insertProductUsageRule(
  pool: pg.Pool,
  id: string,
  accountId: string,
  productId: string,
  plantId: string
): Promise<void> {
  await pool.query(
    `insert into product_usage_rules (id, account_id, product_id, plant_id, dose_value, dose_unit)
     values ($1, $2, $3, $4, 10, 'g')`,
    [id, accountId, productId, plantId]
  );
}

export async function insertInventoryLot(
  pool: pg.Pool,
  id: string,
  accountId: string,
  productId: string,
  quantityRemaining = 100
): Promise<void> {
  await pool.query(
    `insert into inventory_lots (id, account_id, product_id, quantity_initial, quantity_remaining, unit)
     values ($1, $2, $3, 100, $4, 'g')`,
    [id, accountId, productId, quantityRemaining]
  );
}

export async function insertActivity(pool: pg.Pool, id: string, accountId: string, placeId: string): Promise<void> {
  await pool.query(
    `insert into activities (id, account_id, place_id, type, performed_at, target_scope_type)
     values ($1, $2, $3, 'treatment', now(), 'whole_place')`,
    [id, accountId, placeId]
  );
}

export async function insertTask(
  pool: pg.Pool,
  id: string,
  accountId: string,
  placeId: string,
  status = "suggested"
): Promise<void> {
  const confirmedAt = status === "planned" ? "now()" : "null";

  await pool.query(
    `insert into tasks (id, account_id, place_id, type, due_date, target_scope_type, status, confirmed_at)
     values ($1, $2, $3, 'spraying', current_date, 'whole_place', $4, ${confirmedAt})`,
    [id, accountId, placeId, status]
  );
}

export async function insertProblem(
  pool: pg.Pool,
  id: string,
  accountId: string,
  placeId: string,
  type: "problem" | "observation"
): Promise<void> {
  await pool.query(
    `insert into problems (
       id, account_id, type, place_id, target_type, target_id, title, description, status, observed_at
     )
     values ($1, $2, $3, $4, 'place', $4, 'Fixture problem', 'Fixture description', 'open', now())`,
    [id, accountId, type, placeId]
  );
}

export async function insertCoreFixture(pool: pg.Pool): Promise<void> {
  await insertAccount(pool, FixtureIds.accountA, "account-a@example.com");
  await insertAccount(pool, FixtureIds.accountB, "account-b@example.com");
  await insertPlace(pool, FixtureIds.placeA, FixtureIds.accountA, "Fixture Place A");
  await insertPlace(pool, FixtureIds.placeB, FixtureIds.accountB, "Fixture Place B");
  await insertPlant(pool, FixtureIds.plantA, FixtureIds.accountA, "Fixture Plant A");
  await insertPlant(pool, FixtureIds.plantB, FixtureIds.accountB, "Fixture Plant B");
  await insertProduct(pool, FixtureIds.productA, FixtureIds.accountA, "Fixture Product A");
  await insertProduct(pool, FixtureIds.productB, FixtureIds.accountB, "Fixture Product B");
}
