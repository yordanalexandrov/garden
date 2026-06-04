import { describe, expect, it } from "vitest";

import { ConfigError, loadConfig } from "../../src/config/config.js";
import { buildProblemPhotoStorageKey } from "../../src/modules/files/storage-key.js";
import { TestStorageAdapter } from "../../src/modules/files/test-storage.adapter.js";

const accountId = "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa";
const problemId = "bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb";
const photoId = "cccccccc-cccc-4ccc-8ccc-cccccccccccc";

describe("problem photo storage boundary", () => {
  it("builds account/problem scoped keys without using original filenames", () => {
    expect(buildProblemPhotoStorageKey({ accountId, problemId, photoId, mimeType: "image/jpeg" })).toBe(
      `problems/${accountId}/${problemId}/${photoId}.jpg`
    );
    expect(() =>
      buildProblemPhotoStorageKey({ accountId: `../${accountId}`, problemId, photoId, mimeType: "image/jpeg" })
    ).toThrow(/Unsafe/);
    expect(() => buildProblemPhotoStorageKey({ accountId, problemId, photoId, mimeType: "text/plain" })).toThrow(/Unsupported/);
  });

  it("uses deterministic test storage upload, signed URL, and delete behavior", async () => {
    const storage = new TestStorageAdapter();
    const upload = await storage.uploadProblemPhoto({
      accountId,
      problemId,
      photoId,
      originalFilename: "../../secret.jpg",
      mimeType: "image/png",
      fileSizeBytes: 4,
      body: Buffer.from("test")
    });

    expect(upload).toMatchObject({
      storageKey: `problems/${accountId}/${problemId}/${photoId}.png`,
      originalFilename: "../../secret.jpg",
      mimeType: "image/png",
      fileSizeBytes: 4
    });
    expect(storage.objects.has(upload.storageKey)).toBe(true);
    await expect(storage.getSignedUrl({ storageKey: upload.storageKey, expiresInSeconds: 30 })).resolves.toContain(
      "https://storage.test/signed/"
    );
    await storage.deleteObject(upload.storageKey);
    expect(storage.objects.has(upload.storageKey)).toBe(false);
    expect(storage.deletedKeys).toEqual([upload.storageKey]);
  });

  it("fails fast when configured MIME types are unsupported by storage keys", () => {
    expect(() =>
      loadConfig({
        NODE_ENV: "test",
        PROBLEM_PHOTO_ALLOWED_MIME_TYPES: "image/jpeg,image/svg+xml"
      })
    ).toThrow(ConfigError);
  });

  it("keeps problem photo storage settings backend-only and secret-safe", () => {
    const config = loadConfig({
      NODE_ENV: "test",
      SUPABASE_SERVICE_ROLE_KEY: "service-role-secret",
      SUPABASE_STORAGE_URL: "https://storage.example.test",
      SUPABASE_STORAGE_BUCKET_PROBLEM_PHOTOS: "problem-photos",
      PROBLEM_PHOTO_MAX_BYTES: "1234",
      PROBLEM_PHOTO_ALLOWED_MIME_TYPES: "image/jpeg,image/png",
      PROBLEM_PHOTO_SIGNED_URL_TTL_SECONDS: "90"
    });

    expect(config.backendOnly.supabaseServiceRoleKey).toBe("service-role-secret");
    expect(config.frontendSafe).not.toHaveProperty("supabaseServiceRoleKey");
    expect(config.integrations).toMatchObject({
      supabaseStorageUrl: "https://storage.example.test",
      supabaseStorageBucketProblemPhotos: "problem-photos",
      problemPhotoMaxBytes: 1234,
      problemPhotoAllowedMimeTypes: ["image/jpeg", "image/png"],
      problemPhotoSignedUrlTtlSeconds: 90
    });
    expect(JSON.stringify(config.frontendSafe)).not.toContain("service-role-secret");
  });
});
