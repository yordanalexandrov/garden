import type { DbClient, DbHandle } from "../../db/transaction.js";
import { AppError } from "../../shared/errors/app-error.js";
import type { AuditService } from "../audit/audit.service.js";
import type { AuthenticatedActor, UUID } from "../auth/auth.types.js";
import type { ProductsRepository } from "../products/products.types.js";
import { assertSameInventoryUnit } from "./inventory-policy.js";
import type {
  CreateInventoryLotInput,
  CreateInventoryLotResult,
  InventoryRepository,
  ListInventoryFilters,
  ListInventoryLotsFilters,
  ListInventoryMovementsFilters,
  ManualInventoryAdjustmentInput,
  ManualInventoryAdjustmentResult,
  PaginatedResult,
  InventoryOverviewItem,
  InventoryLot,
  InventoryMovement
} from "./inventory.types.js";

export type CreateInventoryLotServiceInput = Omit<CreateInventoryLotInput, "accountId" | "productId">;

export class InventoryService {
  constructor(
    private readonly inventoryRepository: InventoryRepository,
    private readonly productsRepository: ProductsRepository,
    private readonly dbClient: DbClient,
    private readonly auditService?: AuditService
  ) {}

  async listInventory(
    actor: AuthenticatedActor,
    filters: ListInventoryFilters,
    db?: DbHandle
  ): Promise<PaginatedResult<InventoryOverviewItem>> {
    return this.inventoryRepository.listOverview(actor.accountId, filters, db);
  }

  async listLotsByProduct(
    actor: AuthenticatedActor,
    productId: UUID,
    filters: ListInventoryLotsFilters,
    db?: DbHandle
  ): Promise<PaginatedResult<InventoryLot>> {
    await this.assertProductInActorAccount(actor, productId, db);

    return this.inventoryRepository.listLotsByProduct(actor.accountId, productId, filters, db);
  }

  async listMovementsByProduct(
    actor: AuthenticatedActor,
    productId: UUID,
    filters: ListInventoryMovementsFilters,
    db?: DbHandle
  ): Promise<PaginatedResult<InventoryMovement>> {
    await this.assertProductInActorAccount(actor, productId, db);

    return this.inventoryRepository.listMovementsByProduct(actor.accountId, productId, filters, db);
  }

  async createLot(
    actor: AuthenticatedActor,
    productId: UUID,
    input: CreateInventoryLotServiceInput
  ): Promise<CreateInventoryLotResult> {
    this.assertPositiveQuantity(input.quantityInitial, "quantityInitial");

    return this.dbClient.transaction(async (trx) => {
      await this.assertProductInActorAccount(actor, productId, trx);
      const lot = await this.inventoryRepository.createLot(
        {
          ...input,
          accountId: actor.accountId,
          productId
        },
        trx
      );
      const movementInput = {
        accountId: actor.accountId,
        productId,
        inventoryLotId: lot.id,
        movementType: "purchase" as const,
        quantity: input.quantityInitial,
        unit: input.unit,
        occurredAt: input.purchaseDate === undefined || input.purchaseDate === null ? new Date() : dateOnlyToUtcDate(input.purchaseDate),
        ...(input.notes === undefined ? {} : { notes: input.notes })
      };
      const movement = await this.inventoryRepository.createMovement(movementInput, trx);

      await this.auditService?.logActorEvent(
        {
          actor,
          entityType: "inventory_lot",
          entityId: lot.id,
          action: "inventory_lot.created",
          afterJson: {
            lotId: lot.id,
            productId,
            movementId: movement.id,
            quantityInitial: input.quantityInitial,
            unit: input.unit
          }
        },
        trx
      );

      return { lot, movement };
    });
  }

  async adjustStock(
    actor: AuthenticatedActor,
    input: ManualInventoryAdjustmentInput
  ): Promise<ManualInventoryAdjustmentResult> {
    this.assertPositiveQuantity(input.quantity, "quantity");

    return this.dbClient.transaction(async (trx) => {
      await this.assertProductInActorAccount(actor, input.productId, trx);
      const lot = await this.inventoryRepository.findLotById(actor.accountId, input.inventoryLotId, trx);

      if (lot === null) {
        throw new AppError("NOT_FOUND", "Inventory lot not found");
      }

      if (lot.productId !== input.productId) {
        throw new AppError("BUSINESS_RULE_VIOLATION", "Inventory lot must belong to product", {
          inventoryLotId: ["Lot does not belong to productId"]
        });
      }

      assertSameInventoryUnit(input.unit, lot.unit);

      const nextQuantity =
        input.direction === "increase" ? lot.quantityRemaining + input.quantity : lot.quantityRemaining - input.quantity;

      if (nextQuantity < 0) {
        throw new AppError("INVENTORY_SHORTAGE", "Inventory lot cannot become negative", {
          quantity: ["Decrease would make lot quantity negative"]
        });
      }

      const movementInput = {
        accountId: actor.accountId,
        productId: input.productId,
        inventoryLotId: lot.id,
        movementType: input.movementType,
        quantity: input.quantity,
        unit: input.unit,
        occurredAt: new Date(),
        ...(input.notes === undefined ? {} : { notes: input.notes })
      };
      const movement = await this.inventoryRepository.createMovement(movementInput, trx);
      const updatedLot = await this.inventoryRepository.updateLotRemainingQuantity(
        actor.accountId,
        lot.id,
        nextQuantity,
        trx
      );

      if (updatedLot === null) {
        throw new AppError("NOT_FOUND", "Inventory lot not found");
      }

      await this.auditService?.logActorEvent(
        {
          actor,
          entityType: "inventory_lot",
          entityId: lot.id,
          action: `inventory_lot.${input.movementType}`,
          beforeJson: {
            quantityRemaining: lot.quantityRemaining
          },
          afterJson: {
            movementId: movement.id,
            quantityRemaining: updatedLot.quantityRemaining,
            direction: input.direction,
            quantity: input.quantity,
            unit: input.unit
          }
        },
        trx
      );

      return { movement, lot: updatedLot };
    });
  }

  private async assertProductInActorAccount(actor: AuthenticatedActor, productId: UUID, db?: DbHandle): Promise<void> {
    const product = await this.productsRepository.findById(actor.accountId, productId, db);

    if (product === null) {
      throw new AppError("NOT_FOUND", "Product not found");
    }
  }

  private assertPositiveQuantity(value: number, field: string): void {
    if (typeof value !== "number" || value <= 0) {
      throw new AppError("VALIDATION_ERROR", "Inventory quantity must be greater than 0", {
        [field]: ["Must be greater than 0"]
      });
    }
  }
}

function dateOnlyToUtcDate(value: string): Date {
  return new Date(`${value}T00:00:00.000Z`);
}
