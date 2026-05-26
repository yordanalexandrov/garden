import { sql, type Selectable } from "kysely";

import type { InventoryLotsTable, InventoryMovementsTable, InventoryProductBalancesView } from "../../db/database.types.js";
import type { DbHandle } from "../../db/transaction.js";
import type { UUID } from "../auth/auth.types.js";
import type {
  CreateInventoryLotInput,
  CreateInventoryMovementInput,
  InventoryLot,
  InventoryMovement,
  InventoryOverviewItem,
  InventoryRepository,
  ListInventoryFilters,
  ListInventoryLotsFilters,
  ListInventoryMovementsFilters,
  PaginatedResult,
  ProductCategory,
  SimpleUnit
} from "./inventory.types.js";

const INVENTORY_LOT_COLUMNS = [
  "id",
  "account_id",
  "product_id",
  "quantity_initial",
  "quantity_remaining",
  "unit",
  "purchase_date",
  "expiry_date",
  "batch_number",
  "notes",
  "created_at",
  "updated_at",
  "archived_at"
] as const;

const INVENTORY_MOVEMENT_COLUMNS = [
  "id",
  "account_id",
  "product_id",
  "inventory_lot_id",
  "movement_type",
  "quantity",
  "unit",
  "activity_id",
  "occurred_at",
  "notes",
  "created_at"
] as const;

type SelectedInventoryLot = Pick<Selectable<InventoryLotsTable>, (typeof INVENTORY_LOT_COLUMNS)[number]>;
type SelectedInventoryMovement = Pick<Selectable<InventoryMovementsTable>, (typeof INVENTORY_MOVEMENT_COLUMNS)[number]>;
type InventoryProductBalance = Selectable<InventoryProductBalancesView>;
type CountRow = { count: string | number | bigint };

export class KyselyInventoryRepository implements InventoryRepository {
  constructor(private readonly dbHandle: DbHandle) {}

  async listOverview(
    accountId: UUID,
    filters: ListInventoryFilters,
    db: DbHandle = this.dbHandle
  ): Promise<PaginatedResult<InventoryOverviewItem>> {
    let itemsQuery = db.db
      .selectFrom("inventory_product_balances")
      .selectAll()
      .where("account_id", "=", accountId)
      .orderBy("product_name", "asc")
      .limit(filters.pageSize)
      .offset((filters.page - 1) * filters.pageSize);

    let countQuery = db.db
      .selectFrom("inventory_product_balances")
      .select(sql<string>`count(*)`.as("count"))
      .where("account_id", "=", accountId);

    if (filters.q !== undefined) {
      const pattern = `%${filters.q}%`;
      itemsQuery = itemsQuery.where("product_name", "ilike", pattern);
      countQuery = countQuery.where("product_name", "ilike", pattern);
    }

    if (filters.category !== undefined) {
      itemsQuery = itemsQuery.where("category", "=", filters.category);
      countQuery = countQuery.where("category", "=", filters.category);
    }

    if (filters.lowStockOnly) {
      itemsQuery = itemsQuery.where("quantity_remaining", "<=", "0");
      countQuery = countQuery.where("quantity_remaining", "<=", "0");
    }

    if (filters.expiringBefore !== undefined) {
      itemsQuery = itemsQuery.where("next_expiry_date", "<=", filters.expiringBefore);
      countQuery = countQuery.where("next_expiry_date", "<=", filters.expiringBefore);
    }

    const rows = await itemsQuery.execute();
    const totalRow = await countQuery.executeTakeFirst();

    return {
      items: rows.map(toInventoryOverviewItem),
      page: filters.page,
      pageSize: filters.pageSize,
      total: toCount(totalRow)
    };
  }

  async listLotsByProduct(
    accountId: UUID,
    productId: UUID,
    filters: ListInventoryLotsFilters,
    db: DbHandle = this.dbHandle
  ): Promise<PaginatedResult<InventoryLot>> {
    const rows = await db.db
      .selectFrom("inventory_lots")
      .select(INVENTORY_LOT_COLUMNS)
      .where("account_id", "=", accountId)
      .where("product_id", "=", productId)
      .where("archived_at", "is", null)
      .orderBy("expiry_date", "asc")
      .orderBy("purchase_date", "asc")
      .orderBy("created_at", "asc")
      .limit(filters.pageSize)
      .offset((filters.page - 1) * filters.pageSize)
      .execute();

    const totalRow = await db.db
      .selectFrom("inventory_lots")
      .select(sql<string>`count(*)`.as("count"))
      .where("account_id", "=", accountId)
      .where("product_id", "=", productId)
      .where("archived_at", "is", null)
      .executeTakeFirst();

    return {
      items: rows.map(toInventoryLot),
      page: filters.page,
      pageSize: filters.pageSize,
      total: toCount(totalRow)
    };
  }

  async findLotById(accountId: UUID, lotId: UUID, db: DbHandle = this.dbHandle): Promise<InventoryLot | null> {
    const row = await db.db
      .selectFrom("inventory_lots")
      .select(INVENTORY_LOT_COLUMNS)
      .where("account_id", "=", accountId)
      .where("id", "=", lotId)
      .where("archived_at", "is", null)
      .executeTakeFirst();

    return row === undefined ? null : toInventoryLot(row);
  }

  async listMovementsByProduct(
    accountId: UUID,
    productId: UUID,
    filters: ListInventoryMovementsFilters,
    db: DbHandle = this.dbHandle
  ): Promise<PaginatedResult<InventoryMovement>> {
    let itemsQuery = db.db
      .selectFrom("inventory_movements")
      .select(INVENTORY_MOVEMENT_COLUMNS)
      .where("account_id", "=", accountId)
      .where("product_id", "=", productId)
      .orderBy("occurred_at", "desc")
      .orderBy("created_at", "desc")
      .limit(filters.pageSize)
      .offset((filters.page - 1) * filters.pageSize);

    let countQuery = db.db
      .selectFrom("inventory_movements")
      .select(sql<string>`count(*)`.as("count"))
      .where("account_id", "=", accountId)
      .where("product_id", "=", productId);

    if (filters.from !== undefined) {
      itemsQuery = itemsQuery.where("occurred_at", ">=", filters.from);
      countQuery = countQuery.where("occurred_at", ">=", filters.from);
    }

    if (filters.to !== undefined) {
      itemsQuery = itemsQuery.where("occurred_at", "<=", filters.to);
      countQuery = countQuery.where("occurred_at", "<=", filters.to);
    }

    if (filters.movementType !== undefined) {
      itemsQuery = itemsQuery.where("movement_type", "=", filters.movementType);
      countQuery = countQuery.where("movement_type", "=", filters.movementType);
    }

    const rows = await itemsQuery.execute();
    const totalRow = await countQuery.executeTakeFirst();

    return {
      items: rows.map(toInventoryMovement),
      page: filters.page,
      pageSize: filters.pageSize,
      total: toCount(totalRow)
    };
  }

  async listConsumableLotsForProduct(
    accountId: UUID,
    productId: UUID,
    db: DbHandle = this.dbHandle
  ): Promise<InventoryLot[]> {
    const rows = await db.db
      .selectFrom("inventory_lots")
      .select(INVENTORY_LOT_COLUMNS)
      .where("account_id", "=", accountId)
      .where("product_id", "=", productId)
      .where("archived_at", "is", null)
      .where("quantity_remaining", ">", "0")
      .orderBy("expiry_date", "asc")
      .orderBy("purchase_date", "asc")
      .orderBy("created_at", "asc")
      .execute();

    return rows.map(toInventoryLot);
  }

  async findMovementById(accountId: UUID, movementId: UUID, db: DbHandle = this.dbHandle): Promise<InventoryMovement | null> {
    const row = await db.db
      .selectFrom("inventory_movements")
      .select(INVENTORY_MOVEMENT_COLUMNS)
      .where("account_id", "=", accountId)
      .where("id", "=", movementId)
      .executeTakeFirst();

    return row === undefined ? null : toInventoryMovement(row);
  }

  async createLot(input: CreateInventoryLotInput, db: DbHandle = this.dbHandle): Promise<InventoryLot> {
    const row = await db.db
      .insertInto("inventory_lots")
      .values({
        account_id: input.accountId,
        product_id: input.productId,
        quantity_initial: input.quantityInitial,
        quantity_remaining: input.quantityInitial,
        unit: input.unit,
        purchase_date: input.purchaseDate ?? null,
        expiry_date: input.expiryDate ?? null,
        batch_number: input.batchNumber ?? null,
        notes: input.notes ?? null
      })
      .returning(INVENTORY_LOT_COLUMNS)
      .executeTakeFirstOrThrow();

    return toInventoryLot(row);
  }

  async createMovement(input: CreateInventoryMovementInput, db: DbHandle = this.dbHandle): Promise<InventoryMovement> {
    const row = await db.db
      .insertInto("inventory_movements")
      .values({
        account_id: input.accountId,
        product_id: input.productId,
        inventory_lot_id: input.inventoryLotId ?? null,
        movement_type: input.movementType,
        quantity: input.quantity,
        unit: input.unit,
        activity_id: input.activityId ?? null,
        occurred_at: input.occurredAt,
        notes: input.notes ?? null
      })
      .returning(INVENTORY_MOVEMENT_COLUMNS)
      .executeTakeFirstOrThrow();

    return toInventoryMovement(row);
  }

  async updateLotRemainingQuantity(
    accountId: UUID,
    lotId: UUID,
    quantityRemaining: number,
    db: DbHandle = this.dbHandle
  ): Promise<InventoryLot | null> {
    const row = await db.db
      .updateTable("inventory_lots")
      .set({ quantity_remaining: quantityRemaining })
      .where("account_id", "=", accountId)
      .where("id", "=", lotId)
      .where("archived_at", "is", null)
      .returning(INVENTORY_LOT_COLUMNS)
      .executeTakeFirst();

    return row === undefined ? null : toInventoryLot(row);
  }

  async decrementLotRemainingQuantity(
    accountId: UUID,
    lotId: UUID,
    quantity: number,
    db: DbHandle = this.dbHandle
  ): Promise<InventoryLot | null> {
    if (quantity <= 0) {
      return null;
    }

    const row = await db.db
      .updateTable("inventory_lots")
      .set({ quantity_remaining: sql`quantity_remaining - ${quantity}` })
      .where("account_id", "=", accountId)
      .where("id", "=", lotId)
      .where("archived_at", "is", null)
      .where(sql<boolean>`quantity_remaining >= ${quantity}`)
      .returning(INVENTORY_LOT_COLUMNS)
      .executeTakeFirst();

    return row === undefined ? null : toInventoryLot(row);
  }

}

function toInventoryOverviewItem(row: InventoryProductBalance): InventoryOverviewItem {
  return {
    productId: row.product_id,
    productName: row.product_name,
    category: row.category as ProductCategory,
    quantityRemaining: Number(row.quantity_remaining),
    unit: row.default_unit as SimpleUnit,
    lotsCount: Number(row.active_lot_count),
    nearestExpiryDate: row.next_expiry_date
  };
}

function toInventoryLot(row: SelectedInventoryLot): InventoryLot {
  return {
    id: row.id,
    accountId: row.account_id,
    productId: row.product_id,
    quantityInitial: Number(row.quantity_initial),
    quantityRemaining: Number(row.quantity_remaining),
    unit: row.unit as SimpleUnit,
    purchaseDate: row.purchase_date,
    expiryDate: row.expiry_date,
    batchNumber: row.batch_number,
    notes: row.notes,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    archivedAt: row.archived_at
  };
}

function toInventoryMovement(row: SelectedInventoryMovement): InventoryMovement {
  return {
    id: row.id,
    accountId: row.account_id,
    productId: row.product_id,
    inventoryLotId: row.inventory_lot_id,
    movementType: row.movement_type as InventoryMovement["movementType"],
    quantity: Number(row.quantity),
    unit: row.unit as SimpleUnit,
    activityId: row.activity_id,
    occurredAt: row.occurred_at,
    notes: row.notes,
    createdAt: row.created_at
  };
}

function toCount(row: CountRow | undefined): number {
  if (row === undefined) {
    return 0;
  }

  return Number(row.count);
}
