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
  ruleA: "13131313-1313-1313-1313-131313131313",
  perennialA: "14141414-1414-4141-8141-141414141414",
  perennialB: "15151515-1515-4151-8151-151515151515",
  bedA: "16161616-1616-4161-8161-161616161616",
  bedB: "17171717-1717-4171-8171-171717171717",
  persistentBedPlantA: "18181818-1818-4181-8181-181818181818",
  persistentBedPlantB: "19191919-1919-4191-8191-191919191919",
  yearlyBedPlantingA2026: "20202020-2020-4202-8202-202020202020",
  yearlyBedPlantingA2027: "21212121-2121-4212-8212-212121212121",
  yearlyBedPlantingB2026: "23232323-2323-4232-8232-232323232323"
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

export async function insertPerennial(
  pool: pg.Pool,
  input: {
    id: string;
    accountId: string;
    placeId: string;
    plantId: string;
    label?: string | null;
    plantedYear?: number | null;
    notes?: string | null;
    status?: "active" | "removed" | "dead" | "archived";
    archivedAt?: Date | null;
  }
): Promise<void> {
  await pool.query(
    `insert into perennials (
       id, account_id, place_id, plant_id, label, planted_year, notes, status, archived_at
     )
     values ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
    [
      input.id,
      input.accountId,
      input.placeId,
      input.plantId,
      input.label ?? null,
      input.plantedYear ?? null,
      input.notes ?? null,
      input.status ?? "active",
      input.archivedAt ?? null
    ]
  );
}

export async function insertBed(
  pool: pg.Pool,
  input: {
    id: string;
    accountId: string;
    placeId: string;
    name?: string;
    description?: string | null;
    notes?: string | null;
    widthM?: number | null;
    lengthM?: number | null;
    areaM2?: number | null;
    status?: "active" | "removed" | "archived";
    archivedAt?: Date | null;
  }
): Promise<void> {
  await pool.query(
    `insert into beds (
       id, account_id, place_id, name, description, notes, width_m, length_m, area_m2, status, archived_at
     )
     values ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)`,
    [
      input.id,
      input.accountId,
      input.placeId,
      input.name ?? "Fixture Bed",
      input.description ?? null,
      input.notes ?? null,
      input.widthM ?? null,
      input.lengthM ?? null,
      input.areaM2 ?? null,
      input.status ?? "active",
      input.archivedAt ?? null
    ]
  );
}

export async function insertPersistentBedPlant(
  pool: pg.Pool,
  input: {
    id: string;
    accountId: string;
    bedId: string;
    plantId: string;
    plantedYear?: number | null;
    quantity?: number | null;
    notes?: string | null;
    status?: "active" | "removed" | "archived";
    archivedAt?: Date | null;
  }
): Promise<void> {
  await pool.query(
    `insert into persistent_bed_plants (
       id, account_id, bed_id, plant_id, planted_year, quantity, notes, status, archived_at
     )
     values ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
    [
      input.id,
      input.accountId,
      input.bedId,
      input.plantId,
      input.plantedYear ?? null,
      input.quantity ?? null,
      input.notes ?? null,
      input.status ?? "active",
      input.archivedAt ?? null
    ]
  );
}

export async function insertYearlyBedPlanting(
  pool: pg.Pool,
  input: {
    id: string;
    accountId: string;
    bedId: string;
    plantId: string;
    year: number;
    quantity?: number | null;
    notes?: string | null;
    status?: "planned" | "planted" | "removed" | "harvested" | "archived";
    archivedAt?: Date | null;
  }
): Promise<void> {
  await pool.query(
    `insert into yearly_bed_plantings (
       id, account_id, bed_id, plant_id, year, quantity, notes, status, archived_at
     )
     values ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
    [
      input.id,
      input.accountId,
      input.bedId,
      input.plantId,
      input.year,
      input.quantity ?? null,
      input.notes ?? null,
      input.status ?? "planted",
      input.archivedAt ?? null
    ]
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

export async function insertGrowingStructureFixture(pool: pg.Pool): Promise<void> {
  await insertCoreFixture(pool);
  await insertPerennial(pool, {
    id: FixtureIds.perennialA,
    accountId: FixtureIds.accountA,
    placeId: FixtureIds.placeA,
    plantId: FixtureIds.plantA,
    label: "Fixture Perennial A",
    plantedYear: 2022
  });
  await insertPerennial(pool, {
    id: FixtureIds.perennialB,
    accountId: FixtureIds.accountB,
    placeId: FixtureIds.placeB,
    plantId: FixtureIds.plantB,
    label: "Fixture Perennial B",
    plantedYear: 2023
  });
  await insertBed(pool, {
    id: FixtureIds.bedA,
    accountId: FixtureIds.accountA,
    placeId: FixtureIds.placeA,
    name: "Fixture Bed A",
    widthM: 1,
    lengthM: 4,
    areaM2: 4
  });
  await insertBed(pool, {
    id: FixtureIds.bedB,
    accountId: FixtureIds.accountB,
    placeId: FixtureIds.placeB,
    name: "Fixture Bed B"
  });
  await insertPersistentBedPlant(pool, {
    id: FixtureIds.persistentBedPlantA,
    accountId: FixtureIds.accountA,
    bedId: FixtureIds.bedA,
    plantId: FixtureIds.plantA,
    plantedYear: 2021,
    quantity: 10
  });
  await insertPersistentBedPlant(pool, {
    id: FixtureIds.persistentBedPlantB,
    accountId: FixtureIds.accountB,
    bedId: FixtureIds.bedB,
    plantId: FixtureIds.plantB,
    plantedYear: 2021,
    quantity: 20
  });
  await insertYearlyBedPlanting(pool, {
    id: FixtureIds.yearlyBedPlantingA2026,
    accountId: FixtureIds.accountA,
    bedId: FixtureIds.bedA,
    plantId: FixtureIds.plantA,
    year: 2026,
    quantity: 12,
    status: "planted"
  });
  await insertYearlyBedPlanting(pool, {
    id: FixtureIds.yearlyBedPlantingA2027,
    accountId: FixtureIds.accountA,
    bedId: FixtureIds.bedA,
    plantId: FixtureIds.plantA,
    year: 2027,
    quantity: 14,
    status: "planted"
  });
  await insertYearlyBedPlanting(pool, {
    id: FixtureIds.yearlyBedPlantingB2026,
    accountId: FixtureIds.accountB,
    bedId: FixtureIds.bedB,
    plantId: FixtureIds.plantB,
    year: 2026,
    quantity: 8,
    status: "planted"
  });
}
