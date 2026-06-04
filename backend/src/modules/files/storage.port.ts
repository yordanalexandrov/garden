import type { GetSignedUrlInput, ProblemPhotoUploadInput, UploadedProblemPhoto } from "./storage.types.js";

export interface StoragePort {
  uploadProblemPhoto(input: ProblemPhotoUploadInput): Promise<UploadedProblemPhoto>;
  deleteObject(storageKey: string): Promise<void>;
  getSignedUrl(input: GetSignedUrlInput): Promise<string>;
}

export class StorageProviderError extends Error {
  constructor(message = "Storage provider failed") {
    super(message);
    this.name = "StorageProviderError";
  }
}

export function isStorageProviderError(error: unknown): error is StorageProviderError {
  return error instanceof StorageProviderError;
}
