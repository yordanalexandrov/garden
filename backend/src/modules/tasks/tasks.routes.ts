import type { FastifyPluginCallback } from "fastify";

import type { DbClient } from "../../db/transaction.js";
import { successEnvelope } from "../../shared/api/envelope.js";
import { validateRequest } from "../../shared/validation/request-validation.js";
import { KyselyAuditLogsRepository } from "../audit/audit.repository.js";
import { AuditService } from "../audit/audit.service.js";
import { hasAuthDecorator, requireActor } from "../auth/request-actor.js";
import { KyselyTargetResolverRepository } from "../targets/target-resolver.repository.js";
import { BackendTargetResolver } from "../targets/target-resolver.service.js";
import { toConfirmTaskResultDto, toTaskDetailDto, toTaskListDto, toTaskMutationDto } from "./tasks.dto.js";
import { KyselyTasksRepository } from "./tasks.repository.js";
import { TasksService } from "./tasks.service.js";
import type { CreateManualTaskRequest, ListTasksFilters, PatchTaskRequest } from "./tasks.types.js";
import {
  createTaskBodySchema,
  patchTaskBodySchema,
  taskListQuerySchema,
  taskParamsSchema,
  type CreateTaskBody,
  type PatchTaskBody,
  type TaskListQuery
} from "./tasks.validation.js";

export type TasksRouteOptions = {
  db?: DbClient;
};

export const registerTasksRoutes: FastifyPluginCallback<TasksRouteOptions> = (app, options, done) => {
  const tasksService = createTasksService(options.db);
  const protectedRoute = hasAuthDecorator(app) ? { preHandler: app.authenticate } : {};

  app.get("/", protectedRoute, async (request) => {
    const actor = requireActor(request);
    const { query } = validateRequest(request, { query: taskListQuerySchema });
    const result = await requireTasksService(tasksService).listTasks(actor, toListTasksFilters(query));

    return successEnvelope(toTaskListDto(result));
  });

  app.post("/", protectedRoute, async (request) => {
    const actor = requireActor(request);
    const { body } = validateRequest(request, { body: createTaskBodySchema });
    const result = await requireTasksService(tasksService).createManualTask(actor, toCreateManualTaskRequest(body));

    return successEnvelope(toTaskMutationDto(result));
  });

  app.get("/:taskId", protectedRoute, async (request) => {
    const actor = requireActor(request);
    const { params } = validateRequest(request, { params: taskParamsSchema });
    const result = await requireTasksService(tasksService).getTask(actor, params.taskId);

    return successEnvelope(toTaskDetailDto(result));
  });

  app.patch("/:taskId", protectedRoute, async (request) => {
    const actor = requireActor(request);
    const { params, body } = validateRequest(request, { params: taskParamsSchema, body: patchTaskBodySchema });
    const result = await requireTasksService(tasksService).patchTask(actor, params.taskId, toPatchTaskRequest(body));

    return successEnvelope(toTaskMutationDto(result));
  });

  app.post("/:taskId/confirm", protectedRoute, async (request) => {
    const actor = requireActor(request);
    const { params } = validateRequest(request, { params: taskParamsSchema });
    const result = await requireTasksService(tasksService).confirmSuggestedTask(actor, params.taskId);

    return successEnvelope(toConfirmTaskResultDto(result));
  });

  app.post("/:taskId/dismiss", protectedRoute, async (request) => {
    const actor = requireActor(request);
    const { params } = validateRequest(request, { params: taskParamsSchema });
    const result = await requireTasksService(tasksService).dismissSuggestedTask(actor, params.taskId);

    return successEnvelope(toTaskMutationDto(result));
  });

  app.post("/:taskId/complete", protectedRoute, async (request) => {
    const actor = requireActor(request);
    const { params } = validateRequest(request, { params: taskParamsSchema });
    const result = await requireTasksService(tasksService).completeTask(actor, params.taskId);

    return successEnvelope(toTaskMutationDto(result));
  });

  app.post("/:taskId/skip", protectedRoute, async (request) => {
    const actor = requireActor(request);
    const { params } = validateRequest(request, { params: taskParamsSchema });
    const result = await requireTasksService(tasksService).skipTask(actor, params.taskId);

    return successEnvelope(toTaskMutationDto(result));
  });

  done();
};

function createTasksService(db: DbClient | undefined): TasksService | undefined {
  if (db === undefined) {
    return undefined;
  }

  return new TasksService(
    new KyselyTasksRepository(db),
    new BackendTargetResolver(new KyselyTargetResolverRepository(db)),
    db,
    new AuditService(new KyselyAuditLogsRepository(db))
  );
}

function requireTasksService(service: TasksService | undefined): TasksService {
  if (service === undefined) {
    throw new Error("Tasks routes require a database client");
  }

  return service;
}

function toListTasksFilters(query: TaskListQuery): ListTasksFilters {
  return {
    page: query.page,
    pageSize: query.pageSize,
    ...(query.placeId === undefined ? {} : { placeId: query.placeId }),
    ...(query.status === undefined ? {} : { status: query.status }),
    ...(query.type === undefined ? {} : { type: query.type }),
    ...(query.sourceType === undefined ? {} : { sourceType: query.sourceType }),
    ...(query.dueFrom === undefined ? {} : { dueFrom: query.dueFrom }),
    ...(query.dueTo === undefined ? {} : { dueTo: query.dueTo })
  };
}

function toCreateManualTaskRequest(body: CreateTaskBody): CreateManualTaskRequest {
  return {
    placeId: body.placeId,
    type: body.type,
    dueDate: body.dueDate,
    status: body.status,
    targetScopeType: body.targetScopeType,
    ...(body.notes === undefined ? {} : { notes: body.notes }),
    ...(body.targetSelection === undefined ? {} : { targetSelection: normalizeTargetSelection(body.targetSelection) })
  };
}

function toPatchTaskRequest(body: PatchTaskBody): PatchTaskRequest {
  return {
    ...(body.dueDate === undefined ? {} : { dueDate: body.dueDate }),
    ...(body.notes === undefined ? {} : { notes: body.notes }),
    ...(body.type === undefined ? {} : { type: body.type }),
    ...(body.targetScopeType === undefined ? {} : { targetScopeType: body.targetScopeType }),
    ...(body.targetSelection === undefined ? {} : { targetSelection: normalizeTargetSelection(body.targetSelection) })
  };
}

function normalizeTargetSelection(selection: NonNullable<CreateTaskBody["targetSelection"]>): NonNullable<CreateManualTaskRequest["targetSelection"]> {
  return {
    ...(selection.perennialIds === undefined ? {} : { perennialIds: selection.perennialIds }),
    ...(selection.bedIds === undefined ? {} : { bedIds: selection.bedIds }),
    ...(selection.yearlyPlantingIds === undefined ? {} : { yearlyPlantingIds: selection.yearlyPlantingIds }),
    ...(selection.persistentBedPlantIds === undefined ? {} : { persistentBedPlantIds: selection.persistentBedPlantIds })
  };
}
