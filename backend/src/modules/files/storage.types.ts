import type { UUID } from "../auth/auth.types.js";

export type ProblemPhotoUploadInput = {
  accountId: UUID;
  problemId: UUID;
  photoId: UUID;
  originalFilename: string | null;
  mimeType: string;
  fileSizeBytes: number;
  body: Buffer;
};

export type UploadedProblemPhoto = {
  storageKey: string;
  originalFilename: string | null;
  mimeType: string;
  fileSizeBytes: number;
  widthPx: number | null;
  heightPx: number | null;
};

export type GetSignedUrlInput = {
  storageKey: string;
  expiresInSeconds?: number;
};
