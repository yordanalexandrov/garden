import { buildProblemPhotoStorageKey, assertSafeStorageKey } from "./storage-key.js";
import { StorageProviderError, type StoragePort } from "./storage.port.js";
import type { GetSignedUrlInput, ProblemPhotoUploadInput, UploadedProblemPhoto } from "./storage.types.js";

type StoredObject = UploadedProblemPhoto & { body: Buffer };

export type TestStorageAdapterOptions = {
  failUploads?: boolean;
  failDeletes?: boolean;
  failSignedUrls?: boolean;
};

export class TestStorageAdapter implements StoragePort {
  readonly objects = new Map<string, StoredObject>();
  readonly deletedKeys: string[] = [];

  constructor(private readonly options: TestStorageAdapterOptions = {}) {}

  async uploadProblemPhoto(input: ProblemPhotoUploadInput): Promise<UploadedProblemPhoto> {
    await Promise.resolve();
    if (this.options.failUploads === true) {
      throw new StorageProviderError("Test storage upload failed");
    }

    const storageKey = buildProblemPhotoStorageKey(input);
    const uploaded: StoredObject = {
      storageKey,
      originalFilename: input.originalFilename,
      mimeType: input.mimeType,
      fileSizeBytes: input.fileSizeBytes,
      widthPx: null,
      heightPx: null,
      body: Buffer.from(input.body)
    };

    this.objects.set(storageKey, uploaded);

    return withoutBody(uploaded);
  }

  async deleteObject(storageKey: string): Promise<void> {
    await Promise.resolve();
    assertSafeStorageKey(storageKey);

    if (this.options.failDeletes === true) {
      throw new StorageProviderError("Test storage delete failed");
    }

    this.deletedKeys.push(storageKey);
    this.objects.delete(storageKey);
  }

  async getSignedUrl(input: GetSignedUrlInput): Promise<string> {
    await Promise.resolve();
    assertSafeStorageKey(input.storageKey);

    if (this.options.failSignedUrls === true) {
      throw new StorageProviderError("Test storage signed URL failed");
    }

    return `https://storage.test/signed/${encodeURIComponent(input.storageKey)}?expiresIn=${input.expiresInSeconds ?? 3600}`;
  }
}

function withoutBody(object: StoredObject): UploadedProblemPhoto {
  return {
    storageKey: object.storageKey,
    originalFilename: object.originalFilename,
    mimeType: object.mimeType,
    fileSizeBytes: object.fileSizeBytes,
    widthPx: object.widthPx,
    heightPx: object.heightPx
  };
}
