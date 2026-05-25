import type { FastifyInstance } from "fastify";
import type { Pool } from "pg";
import { afterEach, beforeEach, describe, expect, it } from "vitest";

import { loadConfig } from "../../src/config/config.js";
import { createDbClient } from "../../src/db/db.js";
import type { DbClient } from "../../src/db/transaction.js";
import { KyselyAccountsRepository } from "../../src/modules/accounts/accounts.repository.js";
import { TestAuthAdapter } from "../../src/modules/auth/test-auth.adapter.js";
import { createTestPool, hasTestDatabase, resetAndApplyBaseline } from "../db/helpers/test-database.js";
import { AccountFixtureIds, insertAuthAccountFixtures } from "../helpers/accounts.js";
import { createTestApp } from "../helpers/app.js";
import { accountAAuthHeaders, accountBAuthHeaders } from "../helpers/auth.js";
import type { AccountsRepository } from "../../src/modules/accounts/accounts.repository.js";
import type { Account } from "../../src/modules/accounts/accounts.types.js";

const describeDatabase = hasTestDatabase() ? describe : describe.skip;
const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

const ProductIds = {
  copperA: "11111111-1111-4111-8111-111111111111",
  sulfurA: "22222222-2222-4222-8222-222222222222",
  copperB: "33333333-3333-4333-8333-333333333333"
} as const;

const LotIds = {
  copperA1: "44444444-4444-4444-8444-444444444444",
  copperA2: "55555555-5555-4555-8555-555555555555",
  copperB1: "66666666-6666-4666-8666-666666666666"
} as const;

const MovementIds = {
  purchaseA: "77777777-7777-4777-8777-777777777777",
  purchaseB: "88888888-8888-4888-8888-888888888888"
} as const;

type ListResponse<T> = {
  data: {
    items: T[];
    page: number;
    pageSize: number;
    total: number;
  };
};

type LotItemResponse = { id: string; productId: string };
type MovementItemResponse = { id: string; movementType: string };
type CreateLotResponse = { data: { lot: { id: string }; movement: { id: string } } };
type AdjustmentResponse = { data: { lot: { quantityRemaining: number } } };

describe("Inventory routes", () => {
  let app: FastifyInstance | undefined;

  afterEach(async () => {
    await app?.close();
    app = undefined;
  });

  it("keeps health unauthenticated and protects inventory routes", async () => {
    app = await createTestApp();

    const health = await app.inject({ method: "GET", url: "/api/v1/health" });
    const inventory = await app.inject({ method: "GET", url: "/api/v1/inventory" });

    expect(health.statusCode).toBe(200);
    expect(inventory.statusCode).toBe(401);
  });

  it("validates inventory payloads before service dispatch", async () => {
    app = await createTestApp({
      auth: {
        authPort: new TestAuthAdapter(),
        accountsRepository: new StaticAccountsRepository()
      }
    });

    const lotResponse = await app.inject({
      method: "POST",
      url: `/api/v1/products/${ProductIds.copperA}/inventory-lots`,
      headers: accountAAuthHeaders(),
      payload: { quantityInitial: 0, unit: "g" }
    });
    const adjustmentResponse = await app.inject({
      method: "POST",
      url: "/api/v1/inventory/adjustments",
      headers: accountAAuthHeaders(),
      payload: {
        productId: ProductIds.copperA,
        inventoryLotId: LotIds.copperA1,
        quantity: 1,
        unit: "g",
        movementType: "consumption",
        direction: "decrease"
      }
    });

    expect(lotResponse.statusCode).toBe(400);
    expect(adjustmentResponse.statusCode).toBe(400);
  });
});

describeDatabase("Inventory routes with database", () => {
  let pool: Pool;
  let dbClient: DbClient;
  let app: FastifyInstance | undefined;

  beforeEach(async () => {
    pool = createTestPool();
    await resetAndApplyBaseline(pool);
    await insertAuthAccountFixtures(pool);
    dbClient = createDbClient(
      loadConfig({
        NODE_ENV: "test",
        DATABASE_URL: process.env.TEST_DATABASE_URL ?? process.env.DATABASE_URL
      })
    );
    app = await createTestApp({
      db: dbClient,
      auth: {
        authPort: new TestAuthAdapter(),
        accountsRepository: new KyselyAccountsRepository(dbClient)
      }
    });
  });

  afterEach(async () => {
    await app?.close();
    app = undefined;
    await pool.end();
  });

  it("returns account-scoped inventory overview with filters and zero-stock products", async () => {
    await insertProduct(pool, ProductIds.copperA, AccountFixtureIds.accountA, "Copper Fungicide", "fungicide");
    await insertProduct(pool, ProductIds.sulfurA, AccountFixtureIds.accountA, "Sulfur Fungicide", "fungicide");
    await insertProduct(pool, ProductIds.copperB, AccountFixtureIds.accountB, "Other Copper", "fungicide");
    await insertLot(pool, LotIds.copperA1, AccountFixtureIds.accountA, ProductIds.copperA, 30, "2027-01-01");
    await insertLot(pool, LotIds.copperB1, AccountFixtureIds.accountB, ProductIds.copperB, 90, "2027-01-01");

    const response = await app!.inject({
      method: "GET",
      url: "/api/v1/inventory?q=fungicide&category=fungicide&pageSize=10",
      headers: accountAAuthHeaders()
    });

    expect(response.statusCode).toBe(200);
    expect(response.json()).toEqual({
      data: {
        items: [
          {
            productId: ProductIds.copperA,
            productName: "Copper Fungicide",
            category: "fungicide",
            quantityRemaining: 30,
            unit: "g",
            lotsCount: 1,
            nearestExpiryDate: "2027-01-01"
          },
          {
            productId: ProductIds.sulfurA,
            productName: "Sulfur Fungicide",
            category: "fungicide",
            quantityRemaining: 0,
            unit: "g",
            lotsCount: 0,
            nearestExpiryDate: null
          }
        ],
        page: 1,
        pageSize: 10,
        total: 2
      }
    });
  });

  it("lists lots and movements only for actor-account products", async () => {
    await insertProduct(pool, ProductIds.copperA, AccountFixtureIds.accountA, "Copper Fungicide", "fungicide");
    await insertProduct(pool, ProductIds.copperB, AccountFixtureIds.accountB, "Other Copper", "fungicide");
    await insertLot(pool, LotIds.copperA1, AccountFixtureIds.accountA, ProductIds.copperA, 30, "2027-01-01");
    await insertLot(pool, LotIds.copperB1, AccountFixtureIds.accountB, ProductIds.copperB, 90, "2027-01-01");
    await insertMovement(pool, MovementIds.purchaseA, AccountFixtureIds.accountA, ProductIds.copperA, LotIds.copperA1, "purchase");
    await insertMovement(pool, MovementIds.purchaseB, AccountFixtureIds.accountB, ProductIds.copperB, LotIds.copperB1, "purchase");

    const lots = await app!.inject({
      method: "GET",
      url: `/api/v1/products/${ProductIds.copperA}/inventory-lots`,
      headers: accountAAuthHeaders()
    });
    const movements = await app!.inject({
      method: "GET",
      url: `/api/v1/products/${ProductIds.copperA}/inventory-movements?movementType=purchase`,
      headers: accountAAuthHeaders()
    });
    const crossAccount = await app!.inject({
      method: "GET",
      url: `/api/v1/products/${ProductIds.copperB}/inventory-lots`,
      headers: accountAAuthHeaders()
    });

    expect(lots.statusCode).toBe(200);
    const lotsBody = parseJsonResponse<ListResponse<LotItemResponse>>(lots);
    const movementsBody = parseJsonResponse<ListResponse<MovementItemResponse>>(movements);

    expect(lotsBody.data.items).toHaveLength(1);
    expect(lotsBody.data.items[0]).toMatchObject({ id: LotIds.copperA1, productId: ProductIds.copperA });
    expect(movements.statusCode).toBe(200);
    expect(movementsBody.data.items).toHaveLength(1);
    expect(movementsBody.data.items[0]).toMatchObject({ id: MovementIds.purchaseA, movementType: "purchase" });
    expect(crossAccount.statusCode).toBe(404);
  });

  it("creates an inventory lot with purchase movement and audit log in one transaction", async () => {
    await insertProduct(pool, ProductIds.copperA, AccountFixtureIds.accountA, "Copper Fungicide", "fungicide");

    const response = await app!.inject({
      method: "POST",
      url: `/api/v1/products/${ProductIds.copperA}/inventory-lots`,
      headers: accountAAuthHeaders(),
      payload: {
        quantityInitial: 250,
        unit: "g",
        purchaseDate: "2026-05-13",
        expiryDate: "2027-05-13",
        batchNumber: "B-123",
        notes: "Initial stock"
      }
    });

    expect(response.statusCode).toBe(200);
    const body = parseJsonResponse<CreateLotResponse>(response);
    expect(body.data.lot.id).toMatch(uuidPattern);
    expect(body.data.movement.id).toMatch(uuidPattern);

    const stored = await pool.query<{
      quantity_initial: string;
      quantity_remaining: string;
      movement_type: string;
      quantity: string;
      unit: string;
      action: string;
    }>(
      `select il.quantity_initial, il.quantity_remaining, im.movement_type, im.quantity, im.unit, al.action
       from inventory_lots il
       join inventory_movements im on im.inventory_lot_id = il.id
       join audit_logs al on al.entity_id = il.id
       where il.id = $1`,
      [body.data.lot.id]
    );
    expect(stored.rows[0]).toMatchObject({
      quantity_initial: "250",
      quantity_remaining: "250",
      movement_type: "purchase",
      quantity: "250",
      unit: "g",
      action: "inventory_lot.created"
    });
  });

  it("rejects cross-account lot creation and manual adjustment that would make stock negative", async () => {
    await insertProduct(pool, ProductIds.copperA, AccountFixtureIds.accountA, "Copper Fungicide", "fungicide");
    await insertProduct(pool, ProductIds.copperB, AccountFixtureIds.accountB, "Other Copper", "fungicide");
    await insertLot(pool, LotIds.copperA1, AccountFixtureIds.accountA, ProductIds.copperA, 10, "2027-01-01");

    const crossAccountCreate = await app!.inject({
      method: "POST",
      url: `/api/v1/products/${ProductIds.copperB}/inventory-lots`,
      headers: accountAAuthHeaders(),
      payload: { quantityInitial: 1, unit: "g" }
    });
    const negativeAdjustment = await app!.inject({
      method: "POST",
      url: "/api/v1/inventory/adjustments",
      headers: accountAAuthHeaders(),
      payload: {
        productId: ProductIds.copperA,
        inventoryLotId: LotIds.copperA1,
        quantity: 11,
        unit: "g",
        movementType: "manual_adjustment",
        direction: "decrease"
      }
    });

    expect(crossAccountCreate.statusCode).toBe(404);
    expect(negativeAdjustment.statusCode).toBe(422);
    expect(negativeAdjustment.json()).toMatchObject({ error: { code: "INVENTORY_SHORTAGE" } });

    const rows = await pool.query<{ quantity_remaining: string }>("select quantity_remaining from inventory_lots where id = $1", [LotIds.copperA1]);
    const movementRows = await pool.query("select id from inventory_movements where inventory_lot_id = $1", [LotIds.copperA1]);
    expect(rows.rows[0]?.quantity_remaining).toBe("10");
    expect(movementRows.rowCount).toBe(0);
  });

  it("applies increase and decrease adjustments transactionally with movement and audit rows", async () => {
    await insertProduct(pool, ProductIds.copperA, AccountFixtureIds.accountA, "Copper Fungicide", "fungicide");
    await insertLot(pool, LotIds.copperA1, AccountFixtureIds.accountA, ProductIds.copperA, 10, "2027-01-01");

    const increase = await app!.inject({
      method: "POST",
      url: "/api/v1/inventory/adjustments",
      headers: accountAAuthHeaders(),
      payload: {
        productId: ProductIds.copperA,
        inventoryLotId: LotIds.copperA1,
        quantity: 5,
        unit: "g",
        movementType: "manual_adjustment",
        direction: "increase"
      }
    });
    const decrease = await app!.inject({
      method: "POST",
      url: "/api/v1/inventory/adjustments",
      headers: accountAAuthHeaders(),
      payload: {
        productId: ProductIds.copperA,
        inventoryLotId: LotIds.copperA1,
        quantity: 3,
        unit: "g",
        movementType: "correction",
        direction: "decrease",
        notes: "Measured stock"
      }
    });

    expect(increase.statusCode).toBe(200);
    expect(parseJsonResponse<AdjustmentResponse>(increase).data.lot.quantityRemaining).toBe(15);
    expect(decrease.statusCode).toBe(200);
    expect(parseJsonResponse<AdjustmentResponse>(decrease).data.lot.quantityRemaining).toBe(12);

    const state = await pool.query(
      `select
         (select quantity_remaining from inventory_lots where id = $1) as remaining,
         (select count(*) from inventory_movements where inventory_lot_id = $1) as movements,
         (select count(*) from audit_logs where entity_id = $1) as audits`,
      [LotIds.copperA1]
    );
    expect(state.rows[0]).toMatchObject({ remaining: "12", movements: "2", audits: "2" });
  });

  it("rejects account B lot for account A adjustment", async () => {
    await insertProduct(pool, ProductIds.copperA, AccountFixtureIds.accountA, "Copper Fungicide", "fungicide");
    await insertProduct(pool, ProductIds.copperB, AccountFixtureIds.accountB, "Other Copper", "fungicide");
    await insertLot(pool, LotIds.copperB1, AccountFixtureIds.accountB, ProductIds.copperB, 90, "2027-01-01");

    const response = await app!.inject({
      method: "POST",
      url: "/api/v1/inventory/adjustments",
      headers: accountAAuthHeaders(),
      payload: {
        productId: ProductIds.copperA,
        inventoryLotId: LotIds.copperB1,
        quantity: 1,
        unit: "g",
        movementType: "manual_adjustment",
        direction: "increase"
      }
    });

    expect(response.statusCode).toBe(404);
  });

  it("lets account B see only account B inventory", async () => {
    await insertProduct(pool, ProductIds.copperA, AccountFixtureIds.accountA, "Copper Fungicide", "fungicide");
    await insertProduct(pool, ProductIds.copperB, AccountFixtureIds.accountB, "Other Copper", "fungicide");

    const response = await app!.inject({
      method: "GET",
      url: "/api/v1/inventory",
      headers: accountBAuthHeaders()
    });

    expect(response.statusCode).toBe(200);
    expect(parseJsonResponse<ListResponse<{ productId: string; productName: string }>>(response).data.items).toEqual([
      expect.objectContaining({
        productId: ProductIds.copperB,
        productName: "Other Copper"
      })
    ]);
  });
});

async function insertProduct(
  pool: Pool,
  id: string,
  accountId: string,
  name: string,
  category: string,
  defaultUnit = "g"
): Promise<void> {
  await pool.query(
    `insert into products (id, account_id, name, category, default_unit)
     values ($1, $2, $3, $4, $5)`,
    [id, accountId, name, category, defaultUnit]
  );
}

function parseJsonResponse<T>(response: { json(): unknown }): T {
  return response.json() as T;
}

class StaticAccountsRepository implements AccountsRepository {
  findById(accountId: string): Promise<Account | null> {
    return Promise.resolve({
      id: accountId,
      email: "account@example.com",
      displayName: "Account",
      createdAt: new Date("2026-05-18T00:00:00.000Z"),
      updatedAt: new Date("2026-05-18T00:00:00.000Z"),
      archivedAt: null
    });
  }
}

async function insertLot(
  pool: Pool,
  id: string,
  accountId: string,
  productId: string,
  quantityRemaining: number,
  expiryDate: string
): Promise<void> {
  await pool.query(
    `insert into inventory_lots (
       id, account_id, product_id, quantity_initial, quantity_remaining, unit, purchase_date, expiry_date
     )
     values ($1, $2, $3, 100, $4, 'g', '2026-01-01', $5)`,
    [id, accountId, productId, quantityRemaining, expiryDate]
  );
}

async function insertMovement(
  pool: Pool,
  id: string,
  accountId: string,
  productId: string,
  lotId: string,
  movementType: string
): Promise<void> {
  await pool.query(
    `insert into inventory_movements (
       id, account_id, product_id, inventory_lot_id, movement_type, quantity, unit, occurred_at
     )
     values ($1, $2, $3, $4, $5, 10, 'g', '2026-05-13T00:00:00.000Z')`,
    [id, accountId, productId, lotId, movementType]
  );
}
