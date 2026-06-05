import type { DbClient, DbHandle } from "../../db/transaction.js";
import { AppError } from "../../shared/errors/app-error.js";
import type { AuditService } from "../audit/audit.service.js";
import type { AuthenticatedActor, UUID } from "../auth/auth.types.js";
import type { ResolvedTarget, TargetResolver } from "../targets/target-resolver.types.js";
import { buildTaskReminders } from "./reminder-scheduler.js";
import type {
  ConfirmTaskResult,
  CreateManualTaskRequest,
  ListTasksFilters,
  PaginatedTasks,
  PatchTaskRequest,
  Task,
  TaskDetail,
  TasksRepository
} from "./tasks.types.js";

export class TasksService {
  constructor(
    private readonly tasksRepository: TasksRepository,
    private readonly targetResolver: TargetResolver,
    private readonly dbClient: DbClient,
    private readonly auditService?: AuditService
  ) {}

  async listTasks(actor: AuthenticatedActor, filters: ListTasksFilters): Promise<PaginatedTasks> {
    return this.tasksRepository.list(actor.accountId, filters);
  }

  async getTask(actor: AuthenticatedActor, taskId: UUID): Promise<TaskDetail> {
    const task = await this.tasksRepository.getDetail(actor.accountId, taskId);

    if (task === null) {
      throw new AppError("NOT_FOUND", "Task not found");
    }

    return task;
  }

  async createManualTask(actor: AuthenticatedActor, input: CreateManualTaskRequest): Promise<TaskDetail> {
    return this.dbClient.transaction(async (trx) => {
      const resolvedTargets = await this.resolveTargets(actor.accountId, input, trx);
      const now = new Date();
      const task = await this.tasksRepository.create(
        {
          accountId: actor.accountId,
          placeId: input.placeId,
          type: input.type,
          dueDate: input.dueDate,
          ...(input.notes === undefined ? {} : { notes: input.notes }),
          sourceType: "manual",
          sourceReferenceId: null,
          targetScopeType: input.targetScopeType,
          status: input.status,
          confirmedAt: input.status === "planned" ? now : null
        },
        trx
      );

      await this.tasksRepository.replaceTargets(task.id, resolvedTargets.map((target) => ({ taskId: task.id, ...target })), trx);

      if (task.status === "planned") {
        await this.recreateReminders(actor.accountId, task, trx);
      }

      return this.requireTaskDetail(actor.accountId, task.id, trx);
    });
  }

  async patchTask(actor: AuthenticatedActor, taskId: UUID, input: PatchTaskRequest): Promise<TaskDetail> {
    return this.dbClient.transaction(async (trx) => {
      const task = await this.requireTask(actor.accountId, taskId, trx);

      if (task.status === "done" || task.status === "canceled") {
        throw new AppError("BUSINESS_RULE_VIOLATION", "Done or canceled tasks cannot be edited");
      }

      const resolvedTargets =
        input.targetScopeType === undefined
          ? undefined
          : await this.targetResolver.resolveTaskTargets(
              actor.accountId,
              {
                placeId: task.placeId ?? inputPlaceRequired(task),
                targetScopeType: input.targetScopeType,
                ...(input.targetSelection === undefined ? {} : { targetSelection: input.targetSelection })
              },
              trx
            );
      const dueDateChanged = input.dueDate !== undefined && input.dueDate !== task.dueDate;
      const updated = await this.tasksRepository.update(
        actor.accountId,
        task.id,
        {
          ...(input.type === undefined ? {} : { type: input.type }),
          ...(input.dueDate === undefined ? {} : { dueDate: input.dueDate }),
          ...(input.notes === undefined ? {} : { notes: input.notes }),
          ...(input.targetScopeType === undefined ? {} : { targetScopeType: input.targetScopeType })
        },
        trx
      );

      if (updated === null) {
        throw new AppError("NOT_FOUND", "Task not found");
      }

      if (resolvedTargets !== undefined) {
        await this.tasksRepository.replaceTargets(
          updated.id,
          resolvedTargets.map((target) => ({ taskId: updated.id, ...target })),
          trx
        );
      }

      if (updated.status === "planned" && dueDateChanged) {
        await this.recreateReminders(actor.accountId, updated, trx);
      }

      return this.requireTaskDetail(actor.accountId, updated.id, trx);
    });
  }

  async confirmSuggestedTask(actor: AuthenticatedActor, taskId: UUID): Promise<ConfirmTaskResult> {
    return this.dbClient.transaction(async (trx) => {
      const task = await this.requireTask(actor.accountId, taskId, trx);

      if (task.status !== "suggested") {
        throw new AppError("BUSINESS_RULE_VIOLATION", "Only suggested tasks can be confirmed");
      }

      const confirmedAt = new Date();
      const updated = await this.tasksRepository.update(
        actor.accountId,
        task.id,
        {
          status: "planned",
          confirmedAt
        },
        trx
      );

      if (updated === null) {
        throw new AppError("NOT_FOUND", "Task not found");
      }

      const reminders = await this.recreateReminders(actor.accountId, updated, trx);

      await this.auditService?.logActorEvent(
        {
          actor,
          entityType: "task",
          entityId: task.id,
          action: "task.confirmed",
          beforeJson: { status: task.status },
          afterJson: { status: updated.status, reminderCount: reminders.length }
        },
        trx
      );

      return {
        id: updated.id,
        status: "planned",
        confirmedAt: updated.confirmedAt ?? confirmedAt,
        reminders
      };
    });
  }

  async dismissSuggestedTask(actor: AuthenticatedActor, taskId: UUID): Promise<TaskDetail> {
    return this.dbClient.transaction(async (trx) => {
      const task = await this.requireTask(actor.accountId, taskId, trx);

      if (task.status !== "suggested") {
        throw new AppError("BUSINESS_RULE_VIOLATION", "Only suggested tasks can be dismissed");
      }

      const updated = await this.tasksRepository.update(actor.accountId, task.id, { status: "canceled" }, trx);

      if (updated === null) {
        throw new AppError("NOT_FOUND", "Task not found");
      }

      await this.auditService?.logActorEvent(
        {
          actor,
          entityType: "task",
          entityId: task.id,
          action: "task.dismissed",
          beforeJson: { status: task.status },
          afterJson: { status: updated.status }
        },
        trx
      );

      return this.requireTaskDetail(actor.accountId, updated.id, trx);
    });
  }

  async completeTask(actor: AuthenticatedActor, taskId: UUID): Promise<TaskDetail> {
    return this.dbClient.transaction(async (trx) => {
      const task = await this.requireTask(actor.accountId, taskId, trx);

      if (task.status !== "planned") {
        throw new AppError("BUSINESS_RULE_VIOLATION", "Only planned tasks can be completed");
      }

      await this.tasksRepository.cancelScheduledReminders(task.id, trx);
      const updated = await this.tasksRepository.update(
        actor.accountId,
        task.id,
        {
          status: "done",
          completedAt: new Date()
        },
        trx
      );

      if (updated === null) {
        throw new AppError("NOT_FOUND", "Task not found");
      }

      return this.requireTaskDetail(actor.accountId, updated.id, trx);
    });
  }

  async skipTask(actor: AuthenticatedActor, taskId: UUID): Promise<TaskDetail> {
    return this.dbClient.transaction(async (trx) => {
      const task = await this.requireTask(actor.accountId, taskId, trx);

      if (task.status !== "planned") {
        throw new AppError("BUSINESS_RULE_VIOLATION", "Only planned tasks can be skipped");
      }

      await this.tasksRepository.cancelScheduledReminders(task.id, trx);
      const updated = await this.tasksRepository.update(actor.accountId, task.id, { status: "skipped" }, trx);

      if (updated === null) {
        throw new AppError("NOT_FOUND", "Task not found");
      }

      return this.requireTaskDetail(actor.accountId, updated.id, trx);
    });
  }

  private async resolveTargets(
    accountId: UUID,
    input: Pick<CreateManualTaskRequest, "placeId" | "targetScopeType" | "targetSelection">,
    db: DbHandle
  ): Promise<ResolvedTarget[]> {
    const resolvedTargets = await this.targetResolver.resolveTaskTargets(
      accountId,
      {
        placeId: input.placeId,
        targetScopeType: input.targetScopeType,
        ...(input.targetSelection === undefined ? {} : { targetSelection: input.targetSelection })
      },
      db
    );

    if (resolvedTargets.length === 0) {
      throw new AppError("BUSINESS_RULE_VIOLATION", "Task target scope resolved to no targets");
    }

    return resolvedTargets;
  }

  private async recreateReminders(accountId: UUID, task: Task, db: DbHandle) {
    await this.tasksRepository.deleteReminders(task.id, db);
    const timezone = await this.tasksRepository.getPlaceTimezone(accountId, task.placeId, db);
    return this.tasksRepository.createReminders(
      buildTaskReminders({
        taskId: task.id,
        dueDate: task.dueDate,
        status: task.status,
        timezone
      }),
      db
    );
  }

  private async requireTask(accountId: UUID, taskId: UUID, db: DbHandle): Promise<Task> {
    const task = await this.tasksRepository.findById(accountId, taskId, db);

    if (task === null) {
      throw new AppError("NOT_FOUND", "Task not found");
    }

    return task;
  }

  private async requireTaskDetail(accountId: UUID, taskId: UUID, db: DbHandle): Promise<TaskDetail> {
    const detail = await this.tasksRepository.getDetail(accountId, taskId, db);

    if (detail === null) {
      throw new AppError("NOT_FOUND", "Task not found");
    }

    return detail;
  }
}

function inputPlaceRequired(task: Task): UUID {
  if (task.placeId === null) {
    throw new AppError("BUSINESS_RULE_VIOLATION", "Task place is required for target resolution");
  }

  return task.placeId;
}
