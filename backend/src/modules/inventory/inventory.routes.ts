import type { FastifyPluginCallback } from "fastify";

import type { DbClient } from "../../db/transaction.js";
import { successEnvelope } from "../../shared/api/envelope.js";
import { validateRequest } from "../../shared/validation/request-validation.js";
import { KyselyAuditLogsRepository } from "../audit/audit.repository.js";
import { AuditService } from "../audit/audit.service.js";
import { hasAuthDecorator, requireActor } from "../auth/request-actor.js";
import { KyselyProductsRepository } from "../products/products.repository.js";
import {
  toCreateInventoryLotDto,
  toInventoryLotDto,
  toInventoryMovementDto,
  toInventoryOverviewItemDto,
  toManualInventoryAdjustmentDto
} from "./inventory.dto.js";
import { KyselyInventoryRepository } from "./inventory.repository.js";
import { InventoryService, type CreateInventoryLotServiceInput } from "./inventory.service.js";
import type {
  ListInventoryFilters,
  ListInventoryLotsFilters,
  ListInventoryMovementsFilters,
  ManualInventoryAdjustmentInput
} from "./inventory.types.js";
import {
  createInventoryLotBodySchema,
  type CreateInventoryLotBody,
  inventoryLotsQuerySchema,
  type InventoryLotsQuery,
  inventoryMovementsQuerySchema,
  type InventoryMovementsQuery,
  inventoryOverviewQuerySchema,
  type InventoryOverviewQuery,
  inventoryProductParamsSchema,
  manualInventoryAdjustmentBodySchema,
  type ManualInventoryAdjustmentBody
} from "./inventory.validation.js";

export type InventoryRouteOptions = {
  db?: DbClient;
};

export const registerInventoryRoutes: FastifyPluginCallback<InventoryRouteOptions> = (app, options, done) => {
  const inventoryService = createInventoryService(options.db);
  const protectedRoute = hasAuthDecorator(app) ? { preHandler: app.authenticate } : {};

  app.get("/", protectedRoute, async (request) => {
    const actor = requireActor(request);
    const { query } = validateRequest(request, { query: inventoryOverviewQuerySchema });
    const result = await requireInventoryService(inventoryService).listInventory(actor, toListInventoryFilters(query));

    return successEnvelope({
      items: result.items.map(toInventoryOverviewItemDto),
      page: result.page,
      pageSize: result.pageSize,
      total: result.total
    });
  });

  app.post("/adjustments", protectedRoute, async (request) => {
    const actor = requireActor(request);
    const { body } = validateRequest(request, { body: manualInventoryAdjustmentBodySchema });
    const result = await requireInventoryService(inventoryService).adjustStock(actor, toManualInventoryAdjustmentInput(body));

    return successEnvelope(toManualInventoryAdjustmentDto(result));
  });

  done();
};

export const registerProductInventoryRoutes: FastifyPluginCallback<InventoryRouteOptions> = (app, options, done) => {
  const inventoryService = createInventoryService(options.db);
  const protectedRoute = hasAuthDecorator(app) ? { preHandler: app.authenticate } : {};

  app.get("/:productId/inventory-lots", protectedRoute, async (request) => {
    const actor = requireActor(request);
    const { params, query } = validateRequest(request, {
      params: inventoryProductParamsSchema,
      query: inventoryLotsQuerySchema
    });
    const result = await requireInventoryService(inventoryService).listLotsByProduct(
      actor,
      params.productId,
      toListInventoryLotsFilters(query)
    );

    return successEnvelope({
      items: result.items.map(toInventoryLotDto),
      page: result.page,
      pageSize: result.pageSize,
      total: result.total
    });
  });

  app.post("/:productId/inventory-lots", protectedRoute, async (request) => {
    const actor = requireActor(request);
    const { params, body } = validateRequest(request, {
      params: inventoryProductParamsSchema,
      body: createInventoryLotBodySchema
    });
    const result = await requireInventoryService(inventoryService).createLot(
      actor,
      params.productId,
      toCreateInventoryLotInput(body)
    );

    return successEnvelope(toCreateInventoryLotDto(result));
  });

  app.get("/:productId/inventory-movements", protectedRoute, async (request) => {
    const actor = requireActor(request);
    const { params, query } = validateRequest(request, {
      params: inventoryProductParamsSchema,
      query: inventoryMovementsQuerySchema
    });
    const result = await requireInventoryService(inventoryService).listMovementsByProduct(
      actor,
      params.productId,
      toListInventoryMovementsFilters(query)
    );

    return successEnvelope({
      items: result.items.map(toInventoryMovementDto),
      page: result.page,
      pageSize: result.pageSize,
      total: result.total
    });
  });

  done();
};

function createInventoryService(db: DbClient | undefined): InventoryService | undefined {
  if (db === undefined) {
    return undefined;
  }

  return new InventoryService(
    new KyselyInventoryRepository(db),
    new KyselyProductsRepository(db),
    db,
    new AuditService(new KyselyAuditLogsRepository(db))
  );
}

function requireInventoryService(service: InventoryService | undefined): InventoryService {
  if (service === undefined) {
    throw new Error("Inventory routes require a database client");
  }

  return service;
}

function toListInventoryFilters(query: InventoryOverviewQuery): ListInventoryFilters {
  const filters: ListInventoryFilters = {
    lowStockOnly: query.lowStockOnly,
    page: query.page,
    pageSize: query.pageSize
  };

  if (query.q !== undefined) {
    filters.q = query.q;
  }

  if (query.category !== undefined) {
    filters.category = query.category;
  }

  if (query.expiringBefore !== undefined) {
    filters.expiringBefore = query.expiringBefore;
  }

  return filters;
}

function toListInventoryLotsFilters(query: InventoryLotsQuery): ListInventoryLotsFilters {
  return {
    page: query.page,
    pageSize: query.pageSize
  };
}

function toListInventoryMovementsFilters(query: InventoryMovementsQuery): ListInventoryMovementsFilters {
  const filters: ListInventoryMovementsFilters = {
    page: query.page,
    pageSize: query.pageSize
  };

  if (query.from !== undefined) {
    filters.from = new Date(query.from);
  }

  if (query.to !== undefined) {
    filters.to = new Date(query.to);
  }

  if (query.movementType !== undefined) {
    filters.movementType = query.movementType;
  }

  return filters;
}

function toCreateInventoryLotInput(body: CreateInventoryLotBody): CreateInventoryLotServiceInput {
  const input: CreateInventoryLotServiceInput = {
    quantityInitial: body.quantityInitial,
    unit: body.unit
  };

  if (body.purchaseDate !== undefined) {
    input.purchaseDate = body.purchaseDate;
  }

  if (body.expiryDate !== undefined) {
    input.expiryDate = body.expiryDate;
  }

  if (body.batchNumber !== undefined) {
    input.batchNumber = body.batchNumber;
  }

  if (body.notes !== undefined) {
    input.notes = body.notes;
  }

  return input;
}

function toManualInventoryAdjustmentInput(body: ManualInventoryAdjustmentBody): ManualInventoryAdjustmentInput {
  const input: ManualInventoryAdjustmentInput = {
    productId: body.productId,
    inventoryLotId: body.inventoryLotId,
    quantity: body.quantity,
    unit: body.unit,
    movementType: body.movementType,
    direction: body.direction
  };

  if (body.notes !== undefined) {
    input.notes = body.notes;
  }

  return input;
}
