import type { FastifyPluginCallback } from "fastify";

import type { DbClient } from "../../db/transaction.js";
import { successEnvelope } from "../../shared/api/envelope.js";
import { validateRequest } from "../../shared/validation/request-validation.js";
import { KyselyAuditLogsRepository } from "../audit/audit.repository.js";
import { AuditService } from "../audit/audit.service.js";
import { hasAuthDecorator, requireActor } from "../auth/request-actor.js";
import { KyselyPlantsRepository } from "../plants/plants.repository.js";
import {
  toProductDetailDto,
  toProductListItemDto,
  toProductMutationDto,
  toProductUsageRuleDetailDto,
  toProductUsageRuleDto,
  toProductUsageRuleMutationDto
} from "./products.dto.js";
import { KyselyProductsRepository } from "./products.repository.js";
import {
  ProductsService,
  type CreateProductServiceInput,
  type CreateProductUsageRuleServiceInput
} from "./products.service.js";
import type { ListProductsFilters, UpdateProductInput, UpdateProductUsageRuleInput } from "./products.types.js";
import {
  createProductBodySchema,
  type CreateProductBody,
  createProductUsageRuleBodySchema,
  type CreateProductUsageRuleBody,
  listProductsQuerySchema,
  type ListProductsQuery,
  productParamsSchema,
  productUsageRuleParamsSchema,
  updateProductBodySchema,
  type UpdateProductBody,
  updateProductUsageRuleBodySchema,
  type UpdateProductUsageRuleBody
} from "./products.validation.js";

export type ProductsRouteOptions = {
  db?: DbClient;
};

export const registerProductsRoutes: FastifyPluginCallback<ProductsRouteOptions> = (app, options, done) => {
  const productsService = createProductsService(options.db);
  const protectedRoute = hasAuthDecorator(app) ? { preHandler: app.authenticate } : {};

  app.get("/", protectedRoute, async (request) => {
    const actor = requireActor(request);
    const { query } = validateRequest(request, { query: listProductsQuerySchema });
    const result = await requireProductsService(productsService).listProducts(actor, toListProductsFilters(query));

    return successEnvelope({
      items: result.items.map(toProductListItemDto),
      page: result.page,
      pageSize: result.pageSize,
      total: result.total
    });
  });

  app.post("/", protectedRoute, async (request) => {
    const actor = requireActor(request);
    const { body } = validateRequest(request, { body: createProductBodySchema });
    const product = await requireProductsService(productsService).createProduct(actor, toCreateProductInput(body));

    return successEnvelope(toProductMutationDto(product));
  });

  app.get("/:productId/rules", protectedRoute, async (request) => {
    const actor = requireActor(request);
    const { params } = validateRequest(request, { params: productParamsSchema });
    const rules = await requireProductsService(productsService).listProductUsageRules(actor, params.productId);

    return successEnvelope({
      items: rules.map(toProductUsageRuleDto)
    });
  });

  app.post("/:productId/rules", protectedRoute, async (request) => {
    const actor = requireActor(request);
    const { params, body } = validateRequest(request, {
      params: productParamsSchema,
      body: createProductUsageRuleBodySchema
    });
    const rule = await requireProductsService(productsService).createProductUsageRule(
      actor,
      params.productId,
      toCreateProductUsageRuleInput(body)
    );

    return successEnvelope(toProductUsageRuleMutationDto(rule));
  });

  app.get("/:productId", protectedRoute, async (request) => {
    const actor = requireActor(request);
    const { params } = validateRequest(request, { params: productParamsSchema });
    const product = await requireProductsService(productsService).getProduct(actor, params.productId);

    return successEnvelope(toProductDetailDto(product));
  });

  app.patch("/:productId", protectedRoute, async (request) => {
    const actor = requireActor(request);
    const { params, body } = validateRequest(request, {
      params: productParamsSchema,
      body: updateProductBodySchema
    });
    const product = await requireProductsService(productsService).updateProduct(
      actor,
      params.productId,
      toUpdateProductInput(body)
    );

    return successEnvelope(toProductMutationDto(product));
  });

  app.post("/:productId/archive", protectedRoute, async (request) => {
    const actor = requireActor(request);
    const { params } = validateRequest(request, { params: productParamsSchema });
    await requireProductsService(productsService).archiveProduct(actor, params.productId);

    return successEnvelope({ archived: true });
  });

  done();
};

export const registerProductUsageRuleRoutes: FastifyPluginCallback<ProductsRouteOptions> = (app, options, done) => {
  const productsService = createProductsService(options.db);
  const protectedRoute = hasAuthDecorator(app) ? { preHandler: app.authenticate } : {};

  app.get("/:ruleId", protectedRoute, async (request) => {
    const actor = requireActor(request);
    const { params } = validateRequest(request, { params: productUsageRuleParamsSchema });
    const rule = await requireProductsService(productsService).getProductUsageRule(actor, params.ruleId);

    return successEnvelope(toProductUsageRuleDetailDto(rule));
  });

  app.patch("/:ruleId", protectedRoute, async (request) => {
    const actor = requireActor(request);
    const { params, body } = validateRequest(request, {
      params: productUsageRuleParamsSchema,
      body: updateProductUsageRuleBodySchema
    });
    const rule = await requireProductsService(productsService).updateProductUsageRule(
      actor,
      params.ruleId,
      toUpdateProductUsageRuleInput(body)
    );

    return successEnvelope(toProductUsageRuleMutationDto(rule));
  });

  app.post("/:ruleId/archive", protectedRoute, async (request) => {
    const actor = requireActor(request);
    const { params } = validateRequest(request, { params: productUsageRuleParamsSchema });
    await requireProductsService(productsService).archiveProductUsageRule(actor, params.ruleId);

    return successEnvelope({ archived: true });
  });

  done();
};

function createProductsService(db: DbClient | undefined): ProductsService | undefined {
  if (db === undefined) {
    return undefined;
  }

  return new ProductsService(
    new KyselyProductsRepository(db),
    new KyselyPlantsRepository(db),
    new AuditService(new KyselyAuditLogsRepository(db))
  );
}

function requireProductsService(service: ProductsService | undefined): ProductsService {
  if (service === undefined) {
    throw new Error("Products routes require a database client");
  }

  return service;
}

function toListProductsFilters(query: ListProductsQuery): ListProductsFilters {
  const filters: ListProductsFilters = {
    includeArchived: query.includeArchived,
    page: query.page,
    pageSize: query.pageSize
  };

  if (query.q !== undefined) {
    filters.q = query.q;
  }

  if (query.category !== undefined) {
    filters.category = query.category;
  }

  return filters;
}

function toCreateProductInput(body: CreateProductBody): CreateProductServiceInput {
  const input: CreateProductServiceInput = {
    name: body.name,
    category: body.category,
    defaultUnit: body.defaultUnit
  };

  if (body.activeSubstance !== undefined) {
    input.activeSubstance = body.activeSubstance;
  }

  if (body.manufacturer !== undefined) {
    input.manufacturer = body.manufacturer;
  }

  if (body.formulation !== undefined) {
    input.formulation = body.formulation;
  }

  if (body.notes !== undefined) {
    input.notes = body.notes;
  }

  return input;
}

function toUpdateProductInput(body: UpdateProductBody): UpdateProductInput {
  const patch: UpdateProductInput = {};

  if (body.name !== undefined) {
    patch.name = body.name;
  }

  if (body.category !== undefined) {
    patch.category = body.category;
  }

  if (body.activeSubstance !== undefined) {
    patch.activeSubstance = body.activeSubstance;
  }

  if (body.manufacturer !== undefined) {
    patch.manufacturer = body.manufacturer;
  }

  if (body.formulation !== undefined) {
    patch.formulation = body.formulation;
  }

  if (body.defaultUnit !== undefined) {
    patch.defaultUnit = body.defaultUnit;
  }

  if (body.notes !== undefined) {
    patch.notes = body.notes;
  }

  return patch;
}

function toCreateProductUsageRuleInput(body: CreateProductUsageRuleBody): CreateProductUsageRuleServiceInput {
  const input: CreateProductUsageRuleServiceInput = {
    plantId: body.plantId,
    doseValue: body.doseValue,
    doseUnit: body.doseUnit
  };

  if (body.dilutionText !== undefined) {
    input.dilutionText = body.dilutionText;
  }

  if (body.applicationMethod !== undefined) {
    input.applicationMethod = body.applicationMethod;
  }

  if (body.reapplicationIntervalDays !== undefined) {
    input.reapplicationIntervalDays = body.reapplicationIntervalDays;
  }

  if (body.quarantinePeriodDays !== undefined) {
    input.quarantinePeriodDays = body.quarantinePeriodDays;
  }

  if (body.notes !== undefined) {
    input.notes = body.notes;
  }

  return input;
}

function toUpdateProductUsageRuleInput(body: UpdateProductUsageRuleBody): UpdateProductUsageRuleInput {
  const patch: UpdateProductUsageRuleInput = {};

  if (body.plantId !== undefined) {
    patch.plantId = body.plantId;
  }

  if (body.doseValue !== undefined) {
    patch.doseValue = body.doseValue;
  }

  if (body.doseUnit !== undefined) {
    patch.doseUnit = body.doseUnit;
  }

  if (body.dilutionText !== undefined) {
    patch.dilutionText = body.dilutionText;
  }

  if (body.applicationMethod !== undefined) {
    patch.applicationMethod = body.applicationMethod;
  }

  if (body.reapplicationIntervalDays !== undefined) {
    patch.reapplicationIntervalDays = body.reapplicationIntervalDays;
  }

  if (body.quarantinePeriodDays !== undefined) {
    patch.quarantinePeriodDays = body.quarantinePeriodDays;
  }

  if (body.notes !== undefined) {
    patch.notes = body.notes;
  }

  return patch;
}
