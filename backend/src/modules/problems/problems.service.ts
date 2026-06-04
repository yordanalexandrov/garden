import type { DbClient, DbHandle } from "../../db/transaction.js";
import { AppError } from "../../shared/errors/app-error.js";
import type { AuthenticatedActor, UUID } from "../auth/auth.types.js";
import type {
  CreateProblemInput,
  CreateProblemRequest,
  ListProblemsFilters,
  PaginatedProblems,
  Problem,
  ProblemDetail,
  ProblemsRepository,
  UpdateProblemRequest
} from "./problems.types.js";

export class ProblemsService {
  constructor(
    private readonly problemsRepository: ProblemsRepository,
    private readonly dbClient: DbClient
  ) {}

  async listProblems(actor: AuthenticatedActor, filters: ListProblemsFilters): Promise<PaginatedProblems> {
    return this.problemsRepository.list(actor.accountId, filters);
  }

  async getProblem(actor: AuthenticatedActor, problemId: UUID): Promise<ProblemDetail> {
    const problem = await this.problemsRepository.getDetail(actor.accountId, problemId);

    if (problem === null) {
      throw new AppError("NOT_FOUND", "Problem not found");
    }

    return problem;
  }

  async createProblem(actor: AuthenticatedActor, input: CreateProblemRequest): Promise<Problem> {
    return this.dbClient.transaction(async (trx) => {
      await this.validateProblemContext(actor.accountId, input, trx);

      const createInput: CreateProblemInput = {
        accountId: actor.accountId,
        ...input
      };

      return this.problemsRepository.create(createInput, trx);
    });
  }

  async updateProblem(actor: AuthenticatedActor, problemId: UUID, patch: UpdateProblemRequest): Promise<Problem> {
    return this.dbClient.transaction(async (trx) => {
      const existing = await this.problemsRepository.getDetail(actor.accountId, problemId, trx);

      if (existing === null) {
        throw new AppError("NOT_FOUND", "Problem not found");
      }

      if (patch.linkedActivityId !== undefined && patch.linkedActivityId !== null) {
        await this.validateLinkedActivity(actor.accountId, existing.placeId, patch.linkedActivityId, trx);
      }

      const updated = await this.problemsRepository.update(actor.accountId, problemId, patch, trx);

      if (updated === null) {
        throw new AppError("NOT_FOUND", "Problem not found");
      }

      return updated;
    });
  }

  private async validateProblemContext(
    accountId: UUID,
    input: Pick<CreateProblemRequest, "placeId" | "targetType" | "targetId" | "linkedActivityId">,
    db: DbHandle
  ): Promise<void> {
    const place = await this.problemsRepository.findPlace(accountId, input.placeId, db);

    if (place === null) {
      throw new AppError("NOT_FOUND", "Place not found");
    }

    const target = await this.problemsRepository.findTarget(accountId, input.targetType, input.targetId, db);

    if (target === null) {
      throw new AppError("NOT_FOUND", "Problem target not found");
    }

    if (target.placeId !== input.placeId) {
      throw new AppError("BUSINESS_RULE_VIOLATION", "Problem target must belong to the selected place");
    }

    if (input.linkedActivityId !== undefined && input.linkedActivityId !== null) {
      await this.validateLinkedActivity(accountId, input.placeId, input.linkedActivityId, db);
    }
  }

  private async validateLinkedActivity(accountId: UUID, placeId: UUID, activityId: UUID, db: DbHandle): Promise<void> {
    const activity = await this.problemsRepository.findLinkedActivity(accountId, activityId, db);

    if (activity === null) {
      throw new AppError("NOT_FOUND", "Linked activity not found");
    }

    if (activity.placeId !== null && activity.placeId !== placeId) {
      throw new AppError("BUSINESS_RULE_VIOLATION", "Linked activity must belong to the same place as problem");
    }
  }
}
