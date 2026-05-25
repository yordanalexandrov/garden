import { sql, type Selectable, type Updateable } from "kysely";

import type { ProductUsageRulesTable, ProductsTable } from "../../db/database.types.js";
import type { DbHandle } from "../../db/transaction.js";
import type { UUID } from "../auth/auth.types.js";
import type {
  CreateProductInput,
  CreateProductUsageRuleInput,
  ListProductsFilters,
  PaginatedProducts,
  Product,
  ProductsRepository,
  ProductUsageRule,
  UpdateProductInput,
  UpdateProductUsageRuleInput
} from "./products.types.js";

const PRODUCT_COLUMNS = [
  "id",
  "account_id",
  "name",
  "category",
  "active_substance",
  "manufacturer",
  "formulation",
  "default_unit",
  "notes",
  "created_at",
  "updated_at",
  "archived_at"
] as const;

const PRODUCT_USAGE_RULE_COLUMNS = [
  "id",
  "account_id",
  "product_id",
  "plant_id",
  "dose_value",
  "dose_unit",
  "dilution_text",
  "application_method",
  "reapplication_interval_days",
  "quarantine_period_days",
  "notes",
  "created_at",
  "updated_at",
  "archived_at"
] as const;

type SelectedProduct = Pick<Selectable<ProductsTable>, (typeof PRODUCT_COLUMNS)[number]>;
type SelectedProductUsageRule = Pick<Selectable<ProductUsageRulesTable>, (typeof PRODUCT_USAGE_RULE_COLUMNS)[number]>;
type CountRow = { count: string | number | bigint };
type RuleCountRow = { product_id: UUID; count: string | number | bigint };

export class KyselyProductsRepository implements ProductsRepository {
  constructor(private readonly dbHandle: DbHandle) {}

  async list(accountId: UUID, filters: ListProductsFilters, db: DbHandle = this.dbHandle): Promise<PaginatedProducts> {
    let itemsQuery = db.db
      .selectFrom("products")
      .select(PRODUCT_COLUMNS)
      .where("account_id", "=", accountId)
      .orderBy("name", "asc")
      .limit(filters.pageSize)
      .offset((filters.page - 1) * filters.pageSize);

    let countQuery = db.db.selectFrom("products").select(sql<string>`count(*)`.as("count")).where("account_id", "=", accountId);

    if (!filters.includeArchived) {
      itemsQuery = itemsQuery.where("archived_at", "is", null);
      countQuery = countQuery.where("archived_at", "is", null);
    }

    if (filters.q !== undefined) {
      const pattern = `%${filters.q}%`;
      itemsQuery = itemsQuery.where((eb) =>
        eb.or([
          eb("name", "ilike", pattern),
          eb("active_substance", "ilike", pattern),
          eb("manufacturer", "ilike", pattern),
          eb("formulation", "ilike", pattern),
          eb("notes", "ilike", pattern)
        ])
      );
      countQuery = countQuery.where((eb) =>
        eb.or([
          eb("name", "ilike", pattern),
          eb("active_substance", "ilike", pattern),
          eb("manufacturer", "ilike", pattern),
          eb("formulation", "ilike", pattern),
          eb("notes", "ilike", pattern)
        ])
      );
    }

    if (filters.category !== undefined) {
      itemsQuery = itemsQuery.where("category", "=", filters.category);
      countQuery = countQuery.where("category", "=", filters.category);
    }

    const rows = await itemsQuery.execute();
    const totalRow = await countQuery.executeTakeFirst();
    const ruleCounts = await this.loadActiveRuleCounts(
      accountId,
      rows.map((row) => row.id),
      db
    );

    return {
      items: rows.map((row) => ({
        ...toProduct(row),
        rulesCount: ruleCounts.get(row.id) ?? 0
      })),
      page: filters.page,
      pageSize: filters.pageSize,
      total: toCount(totalRow)
    };
  }

  async findById(accountId: UUID, productId: UUID, db: DbHandle = this.dbHandle): Promise<Product | null> {
    const row = await db.db
      .selectFrom("products")
      .select(PRODUCT_COLUMNS)
      .where("account_id", "=", accountId)
      .where("id", "=", productId)
      .where("archived_at", "is", null)
      .executeTakeFirst();

    return row === undefined ? null : toProduct(row);
  }

  async create(input: CreateProductInput, db: DbHandle = this.dbHandle): Promise<Product> {
    const row = await db.db
      .insertInto("products")
      .values({
        account_id: input.accountId,
        name: input.name,
        category: input.category,
        active_substance: input.activeSubstance ?? null,
        manufacturer: input.manufacturer ?? null,
        formulation: input.formulation ?? null,
        default_unit: input.defaultUnit,
        notes: input.notes ?? null
      })
      .returning(PRODUCT_COLUMNS)
      .executeTakeFirstOrThrow();

    return toProduct(row);
  }

  async update(
    accountId: UUID,
    productId: UUID,
    patch: UpdateProductInput,
    db: DbHandle = this.dbHandle
  ): Promise<Product | null> {
    const row = await db.db
      .updateTable("products")
      .set(toProductUpdate(patch))
      .where("account_id", "=", accountId)
      .where("id", "=", productId)
      .where("archived_at", "is", null)
      .returning(PRODUCT_COLUMNS)
      .executeTakeFirst();

    return row === undefined ? null : toProduct(row);
  }

  async archive(accountId: UUID, productId: UUID, db: DbHandle = this.dbHandle): Promise<boolean> {
    const row = await db.db
      .updateTable("products")
      .set({ archived_at: new Date() })
      .where("account_id", "=", accountId)
      .where("id", "=", productId)
      .where("archived_at", "is", null)
      .returning("id")
      .executeTakeFirst();

    return row !== undefined;
  }

  async listUsageRules(
    accountId: UUID,
    productId: UUID,
    db: DbHandle = this.dbHandle
  ): Promise<ProductUsageRule[]> {
    const rows = await db.db
      .selectFrom("product_usage_rules")
      .select(PRODUCT_USAGE_RULE_COLUMNS)
      .where("account_id", "=", accountId)
      .where("product_id", "=", productId)
      .where("archived_at", "is", null)
      .orderBy("created_at", "asc")
      .execute();

    return rows.map(toProductUsageRule);
  }

  async findUsageRuleById(
    accountId: UUID,
    ruleId: UUID,
    db: DbHandle = this.dbHandle
  ): Promise<ProductUsageRule | null> {
    const row = await db.db
      .selectFrom("product_usage_rules")
      .select(PRODUCT_USAGE_RULE_COLUMNS)
      .where("account_id", "=", accountId)
      .where("id", "=", ruleId)
      .where("archived_at", "is", null)
      .executeTakeFirst();

    return row === undefined ? null : toProductUsageRule(row);
  }

  async findActiveUsageRuleForProductPlant(
    accountId: UUID,
    productId: UUID,
    plantId: UUID,
    excludeRuleId?: UUID,
    db: DbHandle = this.dbHandle
  ): Promise<ProductUsageRule | null> {
    let query = db.db
      .selectFrom("product_usage_rules")
      .select(PRODUCT_USAGE_RULE_COLUMNS)
      .where("account_id", "=", accountId)
      .where("product_id", "=", productId)
      .where("plant_id", "=", plantId)
      .where("archived_at", "is", null);

    if (excludeRuleId !== undefined) {
      query = query.where("id", "!=", excludeRuleId);
    }

    const row = await query.executeTakeFirst();

    return row === undefined ? null : toProductUsageRule(row);
  }

  async createUsageRule(
    input: CreateProductUsageRuleInput,
    db: DbHandle = this.dbHandle
  ): Promise<ProductUsageRule> {
    const row = await db.db
      .insertInto("product_usage_rules")
      .values({
        account_id: input.accountId,
        product_id: input.productId,
        plant_id: input.plantId,
        dose_value: input.doseValue,
        dose_unit: input.doseUnit,
        dilution_text: input.dilutionText ?? null,
        application_method: input.applicationMethod ?? null,
        reapplication_interval_days: input.reapplicationIntervalDays ?? null,
        quarantine_period_days: input.quarantinePeriodDays ?? null,
        notes: input.notes ?? null
      })
      .returning(PRODUCT_USAGE_RULE_COLUMNS)
      .executeTakeFirstOrThrow();

    return toProductUsageRule(row);
  }

  async updateUsageRule(
    accountId: UUID,
    ruleId: UUID,
    patch: UpdateProductUsageRuleInput,
    db: DbHandle = this.dbHandle
  ): Promise<ProductUsageRule | null> {
    const row = await db.db
      .updateTable("product_usage_rules")
      .set(toProductUsageRuleUpdate(patch))
      .where("account_id", "=", accountId)
      .where("id", "=", ruleId)
      .where("archived_at", "is", null)
      .returning(PRODUCT_USAGE_RULE_COLUMNS)
      .executeTakeFirst();

    return row === undefined ? null : toProductUsageRule(row);
  }

  async archiveUsageRule(accountId: UUID, ruleId: UUID, db: DbHandle = this.dbHandle): Promise<boolean> {
    const row = await db.db
      .updateTable("product_usage_rules")
      .set({ archived_at: new Date() })
      .where("account_id", "=", accountId)
      .where("id", "=", ruleId)
      .where("archived_at", "is", null)
      .returning("id")
      .executeTakeFirst();

    return row !== undefined;
  }

  private async loadActiveRuleCounts(
    accountId: UUID,
    productIds: UUID[],
    db: DbHandle
  ): Promise<Map<UUID, number>> {
    if (productIds.length === 0) {
      return new Map();
    }

    const rows = await db.db
      .selectFrom("product_usage_rules")
      .select(["product_id", sql<string>`count(*)`.as("count")])
      .where("account_id", "=", accountId)
      .where("product_id", "in", productIds)
      .where("archived_at", "is", null)
      .groupBy("product_id")
      .execute();

    return new Map(rows.map((row: RuleCountRow) => [row.product_id, toCount(row)]));
  }
}

function toProduct(row: SelectedProduct): Product {
  return {
    id: row.id,
    accountId: row.account_id,
    name: row.name,
    category: row.category as Product["category"],
    activeSubstance: row.active_substance,
    manufacturer: row.manufacturer,
    formulation: row.formulation,
    defaultUnit: row.default_unit as Product["defaultUnit"],
    notes: row.notes,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    archivedAt: row.archived_at
  };
}

function toProductUsageRule(row: SelectedProductUsageRule): ProductUsageRule {
  return {
    id: row.id,
    accountId: row.account_id,
    productId: row.product_id,
    plantId: row.plant_id,
    doseValue: Number(row.dose_value),
    doseUnit: row.dose_unit as ProductUsageRule["doseUnit"],
    dilutionText: row.dilution_text,
    applicationMethod: row.application_method,
    reapplicationIntervalDays: row.reapplication_interval_days,
    quarantinePeriodDays: row.quarantine_period_days,
    notes: row.notes,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    archivedAt: row.archived_at
  };
}

function toProductUpdate(patch: UpdateProductInput): Updateable<ProductsTable> {
  const update: Updateable<ProductsTable> = {};

  if (patch.name !== undefined) {
    update.name = patch.name;
  }

  if (patch.category !== undefined) {
    update.category = patch.category;
  }

  if (patch.activeSubstance !== undefined) {
    update.active_substance = patch.activeSubstance;
  }

  if (patch.manufacturer !== undefined) {
    update.manufacturer = patch.manufacturer;
  }

  if (patch.formulation !== undefined) {
    update.formulation = patch.formulation;
  }

  if (patch.defaultUnit !== undefined) {
    update.default_unit = patch.defaultUnit;
  }

  if (patch.notes !== undefined) {
    update.notes = patch.notes;
  }

  return update;
}

function toProductUsageRuleUpdate(patch: UpdateProductUsageRuleInput): Updateable<ProductUsageRulesTable> {
  const update: Updateable<ProductUsageRulesTable> = {};

  if (patch.plantId !== undefined) {
    update.plant_id = patch.plantId;
  }

  if (patch.doseValue !== undefined) {
    update.dose_value = patch.doseValue;
  }

  if (patch.doseUnit !== undefined) {
    update.dose_unit = patch.doseUnit;
  }

  if (patch.dilutionText !== undefined) {
    update.dilution_text = patch.dilutionText;
  }

  if (patch.applicationMethod !== undefined) {
    update.application_method = patch.applicationMethod;
  }

  if (patch.reapplicationIntervalDays !== undefined) {
    update.reapplication_interval_days = patch.reapplicationIntervalDays;
  }

  if (patch.quarantinePeriodDays !== undefined) {
    update.quarantine_period_days = patch.quarantinePeriodDays;
  }

  if (patch.notes !== undefined) {
    update.notes = patch.notes;
  }

  return update;
}

function toCount(row: CountRow | undefined): number {
  return Number(row?.count ?? 0);
}
