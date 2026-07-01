import { randomUUID } from "node:crypto";

import type { DbClient, DbHandle } from "../../db/transaction.js";
import { AppError } from "../../shared/errors/app-error.js";
import type { StoragePort } from "../files/storage.port.js";
import { isStorageProviderError } from "../files/storage.port.js";
import type { AuthenticatedActor, UUID } from "../auth/auth.types.js";
import type {
  CreateProblemInput,
  CreateProblemRequest,
  ListProblemsFilters,
  PaginatedProblems,
  Problem,
  ProblemDetail,
  ProblemObservation,
  ProblemsRepository,
  UpdateProblemRequest,
  UploadProblemPhotoRequest,
  UploadProblemPhotoResult
} from "./problems.types.js";

export class ProblemsService {
  constructor(
    private readonly problemsRepository: ProblemsRepository,
    private readonly dbClient: DbClient,
    private readonly storagePort: StoragePort,
    private readonly signedUrlTtlSeconds: number
  ) {}

  async listProblems(actor: AuthenticatedActor, filters: ListProblemsFilters): Promise<PaginatedProblems> {
    return this.problemsRepository.list(actor.accountId, filters);
  }

  async getProblem(actor: AuthenticatedActor, problemId: UUID): Promise<ProblemDetail> {
    const problem = await this.problemsRepository.getDetail(actor.accountId, problemId);

    if (problem === null) {
      throw new AppError("NOT_FOUND", "Problem not found");
    }

    return {
      ...problem,
      photos: await Promise.all(
        problem.photos.map(async (photo) => ({
          id: photo.id,
          url: await this.getSignedPhotoUrl(photo.storageKey),
          mimeType: photo.mimeType,
          originalFilename: photo.originalFilename,
          fileSizeBytes: photo.fileSizeBytes
        }))
      )
    };
  }


  async uploadProblemPhoto(
    actor: AuthenticatedActor,
    problemId: UUID,
    file: UploadProblemPhotoRequest
  ): Promise<UploadProblemPhotoResult> {
    const problem = await this.problemsRepository.findProblemForPhotoUpload(actor.accountId, problemId);

    if (problem === null) {
      throw new AppError("NOT_FOUND", "Problem not found");
    }

    if (problem.type !== "problem") {
      throw new AppError("BUSINESS_RULE_VIOLATION", "Photos are supported only for problems in v1");
    }

    const photoId = randomUUID();
    let uploaded: Awaited<ReturnType<StoragePort["uploadProblemPhoto"]>>;

    try {
      uploaded = await this.storagePort.uploadProblemPhoto({
        accountId: actor.accountId,
        problemId,
        photoId,
        originalFilename: file.originalFilename,
        mimeType: file.mimeType,
        fileSizeBytes: file.fileSizeBytes,
        body: file.body
      });
    } catch (error) {
      if (isStorageProviderError(error)) {
        throw new AppError("EXTERNAL_SERVICE_ERROR", "Problem photo storage upload failed");
      }

      throw error;
    }

    try {
      const metadata = await this.dbClient.transaction((trx) =>
        this.problemsRepository.createPhotoMetadata(
          {
            id: photoId,
            problemId,
            storageKey: uploaded.storageKey,
            originalFilename: uploaded.originalFilename,
            mimeType: uploaded.mimeType,
            fileSizeBytes: uploaded.fileSizeBytes,
            widthPx: uploaded.widthPx,
            heightPx: uploaded.heightPx
          },
          trx
        )
      );

      return { id: metadata.id, storageKey: metadata.storageKey };
    } catch (error) {
      await this.cleanupUploadedPhoto(uploaded.storageKey);
      throw error;
    }
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

  async addObservation(
    actor: AuthenticatedActor,
    problemId: UUID,
    input: { summary: string; recommendation?: string | null }
  ): Promise<ProblemObservation> {
    const problem = await this.problemsRepository.getDetail(actor.accountId, problemId);
    if (problem === null) {
      throw new AppError("NOT_FOUND", "Problem not found");
    }

    return this.problemsRepository.createObservation({
      problemId,
      summary: input.summary,
      ...(input.recommendation !== undefined ? { recommendation: input.recommendation } : {}),
      source: "user"
    });
  }

  async editObservation(
    actor: AuthenticatedActor,
    problemId: UUID,
    obsId: UUID,
    patch: { summary?: string; recommendation?: string | null }
  ): Promise<ProblemObservation> {
    if (patch.summary === undefined && patch.recommendation === undefined) {
      throw new AppError("VALIDATION_ERROR", "At least one field must be provided");
    }

    const problem = await this.problemsRepository.getDetail(actor.accountId, problemId);
    if (problem === null) {
      throw new AppError("NOT_FOUND", "Problem not found");
    }

    const updated = await this.problemsRepository.updateObservation(problemId, obsId, patch);
    if (updated === null) {
      throw new AppError("NOT_FOUND", "Observation not found");
    }

    return updated;
  }

  async removeObservation(actor: AuthenticatedActor, problemId: UUID, obsId: UUID): Promise<void> {
    const problem = await this.problemsRepository.getDetail(actor.accountId, problemId);
    if (problem === null) {
      throw new AppError("NOT_FOUND", "Problem not found");
    }

    const deleted = await this.problemsRepository.deleteObservation(problemId, obsId);
    if (!deleted) {
      throw new AppError("NOT_FOUND", "Observation not found");
    }
  }

  async resolveProblem(actor: AuthenticatedActor, problemId: UUID): Promise<Problem> {
    return this.dbClient.transaction(async (trx) => {
      const existing = await this.problemsRepository.findStatus(actor.accountId, problemId, trx);
      if (existing === null) {
        throw new AppError("NOT_FOUND", "Problem not found");
      }
      if (existing.status === "resolved") {
        throw new AppError("CONFLICT", "Problem is already resolved");
      }

      const updated = await this.problemsRepository.update(
        actor.accountId,
        problemId,
        { status: "resolved", resolvedAt: new Date() },
        trx
      );
      if (updated === null) {
        throw new AppError("NOT_FOUND", "Problem not found");
      }
      return updated;
    });
  }

  async reopenProblem(actor: AuthenticatedActor, problemId: UUID): Promise<Problem> {
    return this.dbClient.transaction(async (trx) => {
      const existing = await this.problemsRepository.findStatus(actor.accountId, problemId, trx);
      if (existing === null) {
        throw new AppError("NOT_FOUND", "Problem not found");
      }
      if (existing.status !== "resolved") {
        throw new AppError("CONFLICT", "Problem is not resolved");
      }

      const updated = await this.problemsRepository.update(
        actor.accountId,
        problemId,
        { status: "open", resolvedAt: null },
        trx
      );
      if (updated === null) {
        throw new AppError("NOT_FOUND", "Problem not found");
      }
      return updated;
    });
  }

  private async getSignedPhotoUrl(storageKey: string): Promise<string> {
    try {
      return await this.storagePort.getSignedUrl({ storageKey, expiresInSeconds: this.signedUrlTtlSeconds });
    } catch (error) {
      if (isStorageProviderError(error)) {
        throw new AppError("EXTERNAL_SERVICE_ERROR", "Problem photo URL generation failed");
      }

      throw error;
    }
  }

  private async cleanupUploadedPhoto(storageKey: string): Promise<void> {
    try {
      await this.storagePort.deleteObject(storageKey);
    } catch {
      // Preserve the original metadata failure; orphan cleanup can be retried from storage logs/key.
    }
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
