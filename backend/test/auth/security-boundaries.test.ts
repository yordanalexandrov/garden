import { readdirSync, readFileSync, statSync } from "node:fs";
import { join, relative } from "node:path";

import { afterEach, describe, expect, it } from "vitest";
import type { FastifyInstance } from "fastify";

import { createTestApp } from "../helpers/app.js";

const repoRoot = join(import.meta.dirname, "../../..");
const backendRoot = join(repoRoot, "backend");
const backendSrcRoot = join(backendRoot, "src");
const frontendCandidates = ["frontend", "web", "apps/web"].map((path) => join(repoRoot, path));

describe("Phase 3 auth/account security boundaries", () => {
  let app: FastifyInstance | undefined;

  afterEach(async () => {
    await app?.close();
    app = undefined;
  });

  it("does not expose SUPABASE_SERVICE_ROLE_KEY from frontend paths", () => {
    for (const file of existingFilesUnder(frontendCandidates)) {
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

  it("does not introduce public domain CRUD routes in Phase 3", async () => {
    app = await createTestApp({ enableTestRoutes: true });
    await app.ready();

    const routes = app.printRoutes();

    expect(routes).toContain("api/v1");
    expect(routes).toContain("health");
    expect(routes).toContain("__test");
    expect(routes).not.toContain("/api/v1/places");
    expect(routes).not.toContain("/api/v1/products");
    expect(routes).not.toContain("/api/v1/activities");
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

  return readdirSync(path).flatMap((entry) => collectFiles(join(path, entry)));
}
