import { readdirSync, readFileSync, statSync } from "node:fs";
import { basename, join, relative } from "node:path";

import { afterEach, describe, expect, it } from "vitest";
import type { FastifyInstance } from "fastify";

import { createTestApp } from "../helpers/app.js";

const repoRoot = join(import.meta.dirname, "../../..");
const backendRoot = join(repoRoot, "backend");
const backendSrcRoot = join(backendRoot, "src");
const frontendCandidates = ["frontend", "web", "apps/web"].map((path) => join(repoRoot, path));
const ignoredScanDirectoryNames = new Set([".angular", "coverage", "dist", "node_modules"]);
const frontendRuntimeFiles = (): string[] =>
  existingFilesUnder(frontendCandidates).filter((file) => !relative(repoRoot, file).replaceAll("\\", "/").startsWith("frontend/scripts/"));

describe("Phase 3 auth/account security boundaries", () => {
  let app: FastifyInstance | undefined;

  afterEach(async () => {
    await app?.close();
    app = undefined;
  });

  it("does not expose SUPABASE_SERVICE_ROLE_KEY from frontend paths", () => {
    for (const file of frontendRuntimeFiles()) {
      expect(readFileSync(file, "utf8")).not.toContain("SUPABASE_SERVICE_ROLE_KEY");
    }
  });

  it("keeps backend-only auth secrets out of frontend-safe config", () => {
    const configSource = readFileSync(join(backendSrcRoot, "config/config.ts"), "utf8");
    const frontendSafeBlock = configSource.slice(configSource.indexOf("frontendSafe:"), configSource.indexOf("integrations:"));

    expect(frontendSafeBlock).not.toContain("SUPABASE_SERVICE_ROLE_KEY");
    expect(frontendSafeBlock).not.toContain("SUPABASE_JWT_SECRET");
  });

  it("keeps Supabase JWT verification behind config or auth integration paths", () => {
    const allowed = new Set([
      "src/config/config.ts",
      "src/config/logger.ts",
      "src/integrations/auth/auth-adapter.factory.ts",
      "src/integrations/auth/supabase-auth.adapter.ts"
    ]);

    for (const file of existingFilesUnder([backendSrcRoot])) {
      const rel = relative(backendRoot, file);
      const source = readFileSync(file, "utf8");

      if (source.includes("SUPABASE_JWT_SECRET") || source.includes("supabaseJwtSecret")) {
        expect(allowed.has(rel)).toBe(true);
      }
    }
  });

  it("keeps service-facing auth contracts provider-neutral", () => {
    for (const file of existingFilesUnder([join(backendSrcRoot, "modules/auth")])) {
      const rel = relative(backendRoot, file);
      const source = readFileSync(file, "utf8");

      expect(source, rel).not.toContain("@supabase");
      expect(source, rel).not.toContain("SupabaseClient");
      expect(source, rel).not.toContain("SUPABASE_SERVICE_ROLE_KEY");
    }
  });

  it("keeps implemented domain routes protected", async () => {
    app = await createTestApp({ enableTestRoutes: true });
    await app.ready();

    const routes = app.printRoutes();
    const placesResponse = await app.inject({ method: "GET", url: "/api/v1/places" });
    const productsResponse = await app.inject({ method: "GET", url: "/api/v1/products" });
    const activitiesResponse = await app.inject({ method: "GET", url: "/api/v1/activities" });

    expect(routes).toContain("api/v1");
    expect(routes).toContain("health");
    expect(routes).toContain("__test");
    expect(placesResponse.statusCode).toBe(401);
    expect(productsResponse.statusCode).toBe(401);
    expect(activitiesResponse.statusCode).toBe(401);
  });
});

function existingFilesUnder(paths: readonly string[]): string[] {
  return paths.flatMap((path) => (existsDirectory(path) ? collectFiles(path) : []));
}

function existsDirectory(path: string): boolean {
  try {
    return statSync(path).isDirectory();
  } catch {
    return false;
  }
}

function collectFiles(path: string): string[] {
  const stat = statSync(path);

  if (stat.isFile()) {
    return [path];
  }

  if (ignoredScanDirectoryNames.has(basename(path))) {
    return [];
  }

  return readdirSync(path).flatMap((entry) => collectFiles(join(path, entry)));
}
