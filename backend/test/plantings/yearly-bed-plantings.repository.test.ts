import type { Pool } from "pg";
import { afterEach, beforeEach, describe, expect, it } from "vitest";

import { loadConfig } from "../../src/config/config.js";
import { createDbClient } from "../../src/db/db.js";
import type { DbClient } from "../../src/db/transaction.js";
import { KyselyYearlyBedPlantingsRepository } from "../../src/modules/plantings/yearly-bed-plantings.repository.js";
import type { ListYearlyBedPlantingsFilters } from "../../src/modules/plantings/yearly-bed-plantings.types.js";
import { createTestPool, hasTestDatabase, resetAndApplyBaseline } from "../db/helpers/test-database.js";
import { AccountFixtureIds, insertAuthAccountFixtures } from "../helpers/accounts.js";

const describeDatabase = hasTestDatabase() ? describe : describe.skip;

const PlaceIds = {
  placeA: "11111111-1111-1111-1111-111111111111",
  otherPlaceA: "22222222-2222-2222-2222-222222222222",
  placeB: "33333333-3333-3333-3333-333333333333"
} as const;

const PlantIds = {
  tomatoA: "44444444-4444-4444-4444-444444444444",
  pepperA: "55555555-5555-5555-5555-555555555555",
  tomatoB: "66666666-6666-6666-6666-666666666666"
} as const;

const BedIds = {
  bedA: "77777777-7777-7777-7777-777777777777",
  bedOtherPlaceA: "88888888-8888-8888-8888-888888888888",
  bedB: "99999999-9999-9999-9999-999999999999"
} as const;

const YearlyPlantingIds = {
  tomato2026A: "10101010-1010-1010-1010-101010101010",
  pepper2026A: "12121212-1212-1212-1212-121212121212",
  removed2026A: "13131313-1313-1313-1313-131313131313",
  archived2026A: "14141414-1414-1414-1414-141414141414",
  tomato2025A: "15151515-1515-1515-1515-151515151515",
  otherBedA: "16161616-1616-1616-1616-161616161616",
  tomato2026B: "17171717-1717-1717-1717-171717171717",
  corruptedPlantA: "18181818-1818-1818-1818-181818181818"
} as const;

describeDatabase("KyselyYearlyBedPlantingsRepository", () => {
  let pool: Pool;
  let dbClient: DbClient;
  let repository: KyselyYearlyBedPlantingsRepository;

  beforeEach(async () => {
    pool = createTestPool();
    await resetAndApplyBaseline(pool);
    await insertAuthAccountFixtures(pool);
    await insertBasePlacesPlantsAndBeds(pool);
    dbClient = createDbClient(
      loadConfig({
        NODE_ENV: "test",
        DATABASE_URL: process.env.TEST_DATABASE_URL ?? process.env.DATABASE_URL
      })
    );
    repository = new KyselyYearlyBedPlantingsRepository(dbClient);
  });

  afterEach(async () => {
    await dbClient.destroy();
    await pool.end();
  });

  it("lists only unarchived account-owned yearly plantings for the requested bed and year by default", async () => {
    await insertYearlyBedPlanting(pool, {
      id: YearlyPlantingIds.tomato2026A,
      accountId: AccountFixtureIds.accountA,
      bedId: BedIds.bedA,
      plantId: PlantIds.tomatoA,
      year: 2026,
      quantity: 12
    });
    await insertYearlyBedPlanting(pool, {
      id: YearlyPlantingIds.removed2026A,
      accountId: AccountFixtureIds.accountA,
      bedId: BedIds.bedA,
      plantId: PlantIds.pepperA,
      year: 2026,
      status: "removed"
    });
    await insertYearlyBedPlanting(pool, {
      id: YearlyPlantingIds.archived2026A,
      accountId: AccountFixtureIds.accountA,
      bedId: BedIds.bedA,
      plantId: PlantIds.pepperA,
      year: 2026,
      status: "archived",
      archivedAt: new Date("2026-05-18T00:00:00.000Z")
    });
    await insertYearlyBedPlanting(pool, {
      id: YearlyPlantingIds.tomato2025A,
      accountId: AccountFixtureIds.accountA,
      bedId: BedIds.bedA,
      plantId: PlantIds.tomatoA,
      year: 2025
    });
    await insertYearlyBedPlanting(pool, {
      id: YearlyPlantingIds.otherBedA,
      accountId: AccountFixtureIds.accountA,
      bedId: BedIds.bedOtherPlaceA,
      plantId: PlantIds.pepperA,
      year: 2026
    });
    await insertYearlyBedPlanting(pool, {
      id: YearlyPlantingIds.tomato2026B,
      accountId: AccountFixtureIds.accountB,
      bedId: BedIds.bedB,
      plantId: PlantIds.tomatoB,
      year: 2026
    });

    const result = await repository.listByBed(AccountFixtureIds.accountA, BedIds.bedA, defaultFilters());

    expect(result).toMatchObject({
      page: 1,
      pageSize: 20,
      total: 2
    });
    expect(result.items.map((planting) => planting.id).sort()).toEqual(
      [YearlyPlantingIds.tomato2026A, YearlyPlantingIds.removed2026A].sort()
    );
    expect(result.items).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          id: YearlyPlantingIds.tomato2026A,
          accountId: AccountFixtureIds.accountA,
          bedId: BedIds.bedA,
          plantId: PlantIds.tomatoA,
          plantName: "Tomato (Roma)",
          year: 2026,
          quantity: 12,
          archivedAt: null
        })
      ])
    );
  });

  it("supports status filters, pagination, and archived status listing inside the account scope", async () => {
    await insertYearlyBedPlanting(pool, {
      id: YearlyPlantingIds.tomato2026A,
      accountId: AccountFixtureIds.accountA,
      bedId: BedIds.bedA,
      plantId: PlantIds.tomatoA,
      year: 2026,
      status: "planned"
    });
    await insertYearlyBedPlanting(pool, {
      id: YearlyPlantingIds.pepper2026A,
      accountId: AccountFixtureIds.accountA,
      bedId: BedIds.bedA,
      plantId: PlantIds.pepperA,
      year: 2026,
      status: "harvested"
    });
    await insertYearlyBedPlanting(pool, {
      id: YearlyPlantingIds.archived2026A,
      accountId: AccountFixtureIds.accountA,
      bedId: BedIds.bedA,
      plantId: PlantIds.pepperA,
      year: 2026,
      status: "archived",
      archivedAt: new Date("2026-05-18T00:00:00.000Z")
    });

    const harvested = await repository.listByBed(AccountFixtureIds.accountA, BedIds.bedA, {
      ...defaultFilters(),
      status: "harvested",
      pageSize: 1
    });
    const archived = await repository.listByBed(AccountFixtureIds.accountA, BedIds.bedA, {
      ...defaultFilters(),
      status: "archived"
    });

    expect(harvested).toMatchObject({
      total: 1,
      pageSize: 1
    });
    expect(harvested.items).toEqual([expect.objectContaining({ id: YearlyPlantingIds.pepper2026A, status: "harvested" })]);
    expect(archived.items).toEqual([expect.objectContaining({ id: YearlyPlantingIds.archived2026A, status: "archived" })]);
  });

  it("creates duplicate bed plant year rows and updates and archives without hard deleting them", async () => {
    const first = await repository.create({
      accountId: AccountFixtureIds.accountA,
      bedId: BedIds.bedA,
      plantId: PlantIds.tomatoA,
      year: 2026,
      quantity: 12,
      notes: "North row",
      status: "planned"
    });
    const duplicate = await repository.create({
      accountId: AccountFixtureIds.accountA,
      bedId: BedIds.bedA,
      plantId: PlantIds.tomatoA,
      year: 2026,
      quantity: 8,
      notes: "South row",
      status: "planted"
    });

    const byYear = await repository.listByBedAndYear(AccountFixtureIds.accountA, BedIds.bedA, 2026);
    const updated = await repository.update(AccountFixtureIds.accountA, first.id, {
      plantId: PlantIds.pepperA,
      year: 2027,
      quantity: null,
      notes: null,
      status: "harvested"
    });

    expect(byYear.map((planting) => planting.id).sort()).toEqual([first.id, duplicate.id].sort());
    expect(updated).toMatchObject({
      id: first.id,
      plantId: PlantIds.pepperA,
      year: 2027,
      quantity: null,
      notes: null,
      status: "harvested"
    });

    await expect(repository.archive(AccountFixtureIds.accountA, duplicate.id)).resolves.toBe(true);
    await expect(repository.findById(AccountFixtureIds.accountA, duplicate.id)).resolves.toBeNull();

    const archivedRow = await pool.query<{ status: string; archived_at: Date | null }>(
      "select status, archived_at from yearly_bed_plantings where id = $1",
      [duplicate.id]
    );
    expect(archivedRow.rowCount).toBe(1);
    expect(archivedRow.rows[0]).toMatchObject({ status: "archived" });
    expect(archivedRow.rows[0]?.archived_at).toBeInstanceOf(Date);
  });

  it("findManyByIds, listByBedAndYear, and listCurrentByBedAndYear preserve account and active-current boundaries", async () => {
    await insertYearlyBedPlanting(pool, {
      id: YearlyPlantingIds.tomato2026A,
      accountId: AccountFixtureIds.accountA,
      bedId: BedIds.bedA,
      plantId: PlantIds.tomatoA,
      year: 2026,
      status: "planned"
    });
    await insertYearlyBedPlanting(pool, {
      id: YearlyPlantingIds.pepper2026A,
      accountId: AccountFixtureIds.accountA,
      bedId: BedIds.bedA,
      plantId: PlantIds.pepperA,
      year: 2026,
      status: "harvested"
    });
    await insertYearlyBedPlanting(pool, {
      id: YearlyPlantingIds.removed2026A,
      accountId: AccountFixtureIds.accountA,
      bedId: BedIds.bedA,
      plantId: PlantIds.pepperA,
      year: 2026,
      status: "removed"
    });
    await insertYearlyBedPlanting(pool, {
      id: YearlyPlantingIds.archived2026A,
      accountId: AccountFixtureIds.accountA,
      bedId: BedIds.bedA,
      plantId: PlantIds.pepperA,
      year: 2026,
      status: "archived",
      archivedAt: new Date("2026-05-18T00:00:00.000Z")
    });
    await insertYearlyBedPlanting(pool, {
      id: YearlyPlantingIds.tomato2026B,
      accountId: AccountFixtureIds.accountB,
      bedId: BedIds.bedB,
      plantId: PlantIds.tomatoB,
      year: 2026
    });

    const byIds = await repository.findManyByIds(AccountFixtureIds.accountA, [
      YearlyPlantingIds.tomato2026A,
      YearlyPlantingIds.pepper2026A,
      YearlyPlantingIds.removed2026A,
      YearlyPlantingIds.archived2026A,
      YearlyPlantingIds.tomato2026B
    ]);
    const byYear = await repository.listByBedAndYear(AccountFixtureIds.accountA, BedIds.bedA, 2026);
    const current = await repository.listCurrentByBedAndYear(AccountFixtureIds.accountA, BedIds.bedA, 2026);

    expect(byIds.map((planting) => planting.id).sort()).toEqual(
      [YearlyPlantingIds.tomato2026A, YearlyPlantingIds.pepper2026A, YearlyPlantingIds.removed2026A].sort()
    );
    expect(byYear.map((planting) => planting.id).sort()).toEqual(
      [YearlyPlantingIds.tomato2026A, YearlyPlantingIds.pepper2026A, YearlyPlantingIds.removed2026A].sort()
    );
    expect(current.map((planting) => planting.id).sort()).toEqual(
      [YearlyPlantingIds.tomato2026A, YearlyPlantingIds.pepper2026A].sort()
    );
  });

  it("does not update or archive cross-account yearly bed plantings", async () => {
    await insertYearlyBedPlanting(pool, {
      id: YearlyPlantingIds.tomato2026B,
      accountId: AccountFixtureIds.accountB,
      bedId: BedIds.bedB,
      plantId: PlantIds.tomatoB,
      year: 2026
    });

    await expect(repository.findById(AccountFixtureIds.accountA, YearlyPlantingIds.tomato2026B)).resolves.toBeNull();
    await expect(
      repository.update(AccountFixtureIds.accountA, YearlyPlantingIds.tomato2026B, { notes: "Nope" })
    ).resolves.toBeNull();
    await expect(repository.archive(AccountFixtureIds.accountA, YearlyPlantingIds.tomato2026B)).resolves.toBe(false);
  });

  it("does not join plant details across accounts when stored references are inconsistent", async () => {
    await pool.query("alter table yearly_bed_plantings disable trigger trg_yearly_bed_plantings_validate_consistency");
    try {
      await insertYearlyBedPlanting(pool, {
        id: YearlyPlantingIds.corruptedPlantA,
        accountId: AccountFixtureIds.accountA,
        bedId: BedIds.bedA,
        plantId: PlantIds.tomatoB,
        year: 2026
      });
    } finally {
      await pool.query("alter table yearly_bed_plantings enable trigger trg_yearly_bed_plantings_validate_consistency");
    }

    const listed = await repository.listByBed(AccountFixtureIds.accountA, BedIds.bedA, defaultFilters());

    expect(listed).toMatchObject({
      items: [],
      total: 0
    });
    await expect(repository.findById(AccountFixtureIds.accountA, YearlyPlantingIds.corruptedPlantA)).resolves.toBeNull();
  });

  it("can operate on an explicit transaction handle", async () => {
    const created = await dbClient.transaction(async (trx) =>
      repository.create(
        {
          accountId: AccountFixtureIds.accountA,
          bedId: BedIds.bedA,
          plantId: PlantIds.tomatoA,
          year: 2026,
          notes: "Transaction yearly planting",
          status: "planted"
        },
        trx
      )
    );

    await expect(repository.findById(AccountFixtureIds.accountA, created.id)).resolves.toMatchObject({
      id: created.id,
      notes: "Transaction yearly planting"
    });
  });
});

function defaultFilters(): ListYearlyBedPlantingsFilters {
  return {
    year: 2026,
    page: 1,
    pageSize: 20
  };
}

async function insertBasePlacesPlantsAndBeds(pool: Pool): Promise<void> {
  await insertPlace(pool, {
    id: PlaceIds.placeA,
    accountId: AccountFixtureIds.accountA,
    name: "Home Garden"
  });
  await insertPlace(pool, {
    id: PlaceIds.otherPlaceA,
    accountId: AccountFixtureIds.accountA,
    name: "Allotment"
  });
  await insertPlace(pool, {
    id: PlaceIds.placeB,
    accountId: AccountFixtureIds.accountB,
    name: "Other Account Garden"
  });
  await insertPlant(pool, {
    id: PlantIds.tomatoA,
    accountId: AccountFixtureIds.accountA,
    commonName: "Tomato",
    variety: "Roma"
  });
  await insertPlant(pool, {
    id: PlantIds.pepperA,
    accountId: AccountFixtureIds.accountA,
    commonName: "Pepper"
  });
  await insertPlant(pool, {
    id: PlantIds.tomatoB,
    accountId: AccountFixtureIds.accountB,
    commonName: "Tomato"
  });
  await insertBed(pool, {
    id: BedIds.bedA,
    accountId: AccountFixtureIds.accountA,
    placeId: PlaceIds.placeA,
    name: "Bed A"
  });
  await insertBed(pool, {
    id: BedIds.bedOtherPlaceA,
    accountId: AccountFixtureIds.accountA,
    placeId: PlaceIds.otherPlaceA,
    name: "Other place bed"
  });
  await insertBed(pool, {
    id: BedIds.bedB,
    accountId: AccountFixtureIds.accountB,
    placeId: PlaceIds.placeB,
    name: "Other account bed"
  });
}

async function insertPlace(pool: Pool, input: { id: string; accountId: string; name: string }): Promise<void> {
  await pool.query("insert into places (id, account_id, name) values ($1, $2, $3)", [
    input.id,
    input.accountId,
    input.name
  ]);
}

async function insertPlant(
  pool: Pool,
  input: {
    id: string;
    accountId: string;
    commonName: string;
    variety?: string | null;
  }
): Promise<void> {
  await pool.query(
    `insert into plants (id, account_id, common_name, variety, lifecycle_type, growing_style)
     values ($1, $2, $3, $4, 'annual', 'vegetable')`,
    [input.id, input.accountId, input.commonName, input.variety ?? null]
  );
}

async function insertBed(
  pool: Pool,
  input: {
    id: string;
    accountId: string;
    placeId: string;
    name: string;
  }
): Promise<void> {
  await pool.query("insert into beds (id, account_id, place_id, name, status) values ($1, $2, $3, $4, 'active')", [
    input.id,
    input.accountId,
    input.placeId,
    input.name
  ]);
}

async function insertYearlyBedPlanting(
  pool: Pool,
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
