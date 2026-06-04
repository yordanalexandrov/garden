import { assertSafeStorageKey, buildProblemPhotoStorageKey } from "./storage-key.js";
import { StorageProviderError, type StoragePort } from "./storage.port.js";
import type { GetSignedUrlInput, ProblemPhotoUploadInput, UploadedProblemPhoto } from "./storage.types.js";

export type SupabaseStorageAdapterOptions = {
  storageUrl: string;
  bucket: string;
  serviceRoleKey: string;
};

export class SupabaseStorageAdapter implements StoragePort {
  private readonly baseUrl: string;

  constructor(private readonly options: SupabaseStorageAdapterOptions) {
    this.baseUrl = options.storageUrl.replace(/\/+$/, "");
  }

  async uploadProblemPhoto(input: ProblemPhotoUploadInput): Promise<UploadedProblemPhoto> {
    const storageKey = buildProblemPhotoStorageKey(input);
    const response = await fetch(`${this.baseUrl}/storage/v1/object/${encodePath(this.options.bucket)}/${encodeStoragePath(storageKey)}`, {
      method: "POST",
      headers: {
        authorization: `Bearer ${this.options.serviceRoleKey}`,
        apikey: this.options.serviceRoleKey,
        "content-type": input.mimeType,
        "x-upsert": "false"
      },
      body: input.body
    });

    if (!response.ok) {
      throw new StorageProviderError("Supabase Storage upload failed");
    }

    return {
      storageKey,
      originalFilename: input.originalFilename,
      mimeType: input.mimeType,
      fileSizeBytes: input.fileSizeBytes,
      widthPx: null,
      heightPx: null
    };
  }

  async deleteObject(storageKey: string): Promise<void> {
    assertSafeStorageKey(storageKey);
    const response = await fetch(`${this.baseUrl}/storage/v1/object/${encodePath(this.options.bucket)}`, {
      method: "DELETE",
      headers: this.jsonHeaders(),
      body: JSON.stringify({ prefixes: [storageKey] })
    });

    if (!response.ok) {
      throw new StorageProviderError("Supabase Storage delete failed");
    }
  }

  async getSignedUrl(input: GetSignedUrlInput): Promise<string> {
    assertSafeStorageKey(input.storageKey);
    const response = await fetch(
      `${this.baseUrl}/storage/v1/object/sign/${encodePath(this.options.bucket)}/${encodeStoragePath(input.storageKey)}`,
      {
        method: "POST",
        headers: this.jsonHeaders(),
        body: JSON.stringify({ expiresIn: input.expiresInSeconds ?? 3600 })
      }
    );

    if (!response.ok) {
      throw new StorageProviderError("Supabase Storage signed URL failed");
    }

    const payload = (await response.json()) as { signedURL?: string; signedUrl?: string };
    const signedPath = payload.signedURL ?? payload.signedUrl;

    if (signedPath === undefined) {
      throw new StorageProviderError("Supabase Storage signed URL response was invalid");
    }

    return signedPath.startsWith("http") ? signedPath : `${this.baseUrl}${signedPath}`;
  }

  private jsonHeaders(): Record<string, string> {
    return {
      authorization: `Bearer ${this.options.serviceRoleKey}`,
      apikey: this.options.serviceRoleKey,
      "content-type": "application/json"
    };
  }
}

function encodePath(value: string): string {
  return encodeURIComponent(value);
}

function encodeStoragePath(storageKey: string): string {
  return storageKey.split("/").map(encodeURIComponent).join("/");
}
