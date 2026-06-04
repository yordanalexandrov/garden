import { POSTGRES_UUID_PATTERN } from "../../shared/validation/common-schemas.js";
import type { UUID } from "../auth/auth.types.js";

const MIME_EXTENSIONS: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
  "image/gif": "gif"
};

export type ProblemPhotoStorageKeyInput = {
  accountId: UUID;
  problemId: UUID;
  photoId: UUID;
  mimeType: string;
};

export function buildProblemPhotoStorageKey(input: ProblemPhotoStorageKeyInput): string {
  assertSafeUuid(input.accountId, "accountId");
  assertSafeUuid(input.problemId, "problemId");
  assertSafeUuid(input.photoId, "photoId");

  const extension = MIME_EXTENSIONS[input.mimeType.toLowerCase()];

  if (extension === undefined) {
    throw new Error("Unsupported problem photo MIME type for storage key");
  }

  return `problems/${input.accountId}/${input.problemId}/${input.photoId}.${extension}`;
}

export function assertSafeStorageKey(storageKey: string): void {
  if (storageKey.length === 0 || storageKey.startsWith("/") || storageKey.includes("..") || storageKey.includes("\\")) {
    throw new Error("Unsafe storage key");
  }
}

function assertSafeUuid(value: string, field: string): void {
  if (!POSTGRES_UUID_PATTERN.test(value) || value.includes("/") || value.includes("..")) {
    throw new Error(`Unsafe ${field} for storage key`);
  }
}
