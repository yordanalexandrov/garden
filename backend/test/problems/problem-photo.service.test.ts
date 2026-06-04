import { describe, expect, it } from "vitest";

import type { DbClient, DbTransaction } from "../../src/db/transaction.js";
import { createAuthenticatedActor } from "../../src/modules/auth/auth.types.js";
import { TestStorageAdapter } from "../../src/modules/files/test-storage.adapter.js";
import { ProblemsService } from "../../src/modules/problems/problems.service.js";
import type { ProblemsRepository } from "../../src/modules/problems/problems.types.js";

const actor = createAuthenticatedActor({
  userId: "user-a",
  accountId: "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa",
  email: "a@example.test",
  provider: "test"
});
const problemId = "bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb";

describe("ProblemsService problem photo workflow", () => {
  it("cleans up an uploaded object when metadata persistence fails", async () => {
    const storage = new TestStorageAdapter();
    const repository = new FakeProblemsRepository({ createPhotoMetadataFails: true });
    const service = new ProblemsService(repository, new FakeDbClient(), storage, 3600);

    await expect(
      service.uploadProblemPhoto(actor, problemId, {
        originalFilename: "leaf.jpg",
        mimeType: "image/jpeg",
        fileSizeBytes: 4,
        body: Buffer.from("test")
      })
    ).rejects.toThrow("metadata failed");

    expect(storage.deletedKeys).toHaveLength(1);
    expect(storage.objects.size).toBe(0);
  });

  it("maps signed URL provider failures to EXTERNAL_SERVICE_ERROR", async () => {
    const storage = new TestStorageAdapter({ failSignedUrls: true });
    const repository = new FakeProblemsRepository({ detailHasPhoto: true });
    const service = new ProblemsService(repository, new FakeDbClient(), storage, 3600);

    await expect(service.getProblem(actor, problemId)).rejects.toMatchObject({ code: "EXTERNAL_SERVICE_ERROR" });
  });

  it("does not mask generic upload errors as provider failures", async () => {
    const service = new ProblemsService(new FakeProblemsRepository(), new FakeDbClient(), new BuggyUploadStorageAdapter(), 3600);

    await expect(
      service.uploadProblemPhoto(actor, problemId, {
        originalFilename: "leaf.jpg",
        mimeType: "image/jpeg",
        fileSizeBytes: 4,
        body: Buffer.from("test")
      })
    ).rejects.toThrow("internal upload bug");
  });

  it("does not mask generic signed URL errors as provider failures", async () => {
    const service = new ProblemsService(
      new FakeProblemsRepository({ detailHasPhoto: true }),
      new FakeDbClient(),
      new BuggySignedUrlStorageAdapter(),
      3600
    );

    await expect(service.getProblem(actor, problemId)).rejects.toThrow("internal signed URL bug");
  });
});

class FakeDbClient implements DbClient {
  readonly db = undefined as never;
  readonly trx: DbTransaction = { db: undefined as never, isTransaction: true };

  async transaction<T>(callback: (trx: DbTransaction) => Promise<T>): Promise<T> {
    return callback(this.trx);
  }

  async healthCheck(): Promise<boolean> {
    await Promise.resolve();
    return true;
  }

  async destroy(): Promise<void> {}
}

class FakeProblemsRepository implements ProblemsRepository {
  constructor(private readonly options: { createPhotoMetadataFails?: boolean; detailHasPhoto?: boolean } = {}) {}

  async findProblemForPhotoUpload() {
    await Promise.resolve();
    return { id: problemId, accountId: actor.accountId, type: "problem" as const, placeId: "11111111-1111-4111-8111-111111111111" };
  }

  async createPhotoMetadata() {
    await Promise.resolve();
    if (this.options.createPhotoMetadataFails === true) {
      throw new Error("metadata failed");
    }

    return {
      id: "cccccccc-cccc-4ccc-8ccc-cccccccccccc",
      storageKey: "problems/key.jpg",
      originalFilename: "leaf.jpg",
      mimeType: "image/jpeg",
      fileSizeBytes: 4,
      widthPx: null,
      heightPx: null,
      createdAt: new Date()
    };
  }

  async getDetail() {
    await Promise.resolve();
    return {
      id: problemId,
      type: "problem" as const,
      placeId: "11111111-1111-4111-8111-111111111111",
      targetType: "place" as const,
      targetId: "11111111-1111-4111-8111-111111111111",
      title: "Problem",
      description: "Description",
      category: null,
      severity: null,
      status: "open" as const,
      observedAt: new Date(),
      linkedActivityId: null,
      targetLabel: "Place",
      photos:
        this.options.detailHasPhoto === true
          ? [
              {
                id: "cccccccc-cccc-4ccc-8ccc-cccccccccccc",
                storageKey: "problems/key.jpg",
                originalFilename: "leaf.jpg",
                mimeType: "image/jpeg",
                fileSizeBytes: 4,
                widthPx: null,
                heightPx: null,
                createdAt: new Date()
              }
            ]
          : [],
      linkedActivity: null
    };
  }

  create(): never {
    throw new Error("not implemented");
  }

  list(): never {
    throw new Error("not implemented");
  }

  update(): never {
    throw new Error("not implemented");
  }

  findPlace(): never {
    throw new Error("not implemented");
  }

  findTarget(): never {
    throw new Error("not implemented");
  }

  findLinkedActivity(): never {
    throw new Error("not implemented");
  }
}

class BuggyUploadStorageAdapter extends TestStorageAdapter {
  override async uploadProblemPhoto(): ReturnType<TestStorageAdapter["uploadProblemPhoto"]> {
    await Promise.resolve();
    throw new Error("internal upload bug");
  }
}

class BuggySignedUrlStorageAdapter extends TestStorageAdapter {
  override async getSignedUrl(): ReturnType<TestStorageAdapter["getSignedUrl"]> {
    await Promise.resolve();
    throw new Error("internal signed URL bug");
  }
}
