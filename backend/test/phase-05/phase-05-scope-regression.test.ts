import { readdirSync, readFileSync, statSync } from "node:fs";
import { basename, extname, join, relative } from "node:path";

import { describe, expect, it } from "vitest";

const repoRoot = join(import.meta.dirname, "../../..");
const backendRoot = join(repoRoot, "backend");
const backendSrcRoot = join(backendRoot, "src");
const phaseFiveRuntimeRoots = [join(backendSrcRoot, "modules/places"), join(backendSrcRoot, "modules/plants")];
const ignoredScanDirectoryNames = new Set(["coverage", "dist", "node_modules"]);
const sourceExtensions = new Set([".ts", ".tsx", ".js", ".mjs", ".cjs"]);

const forbiddenReferences: readonly { value: string; reason: string }[] = [
  {
    value: "WeatherPort",
    reason: "Phase 5 stores place weather metadata only; weather provider calls are out of scope."
  },
  {
    value: "OpenMeteo",
    reason: "Open-Meteo integration belongs to the later weather phase."
  },
  {
    value: "open-meteo",
    reason: "Open-Meteo integration belongs to the later weather phase."
  },
  {
    value: "StoragePort",
    reason: "Storage integration belongs to problem photo phases, not places/plants."
  },
  {
    value: "PushPort",
    reason: "Push integration belongs to notification phases, not places/plants."
  },
  {
    value: "AiPort",
    reason: "AI integration belongs to AI suggestion phases, not places/plants."
  },
  {
    value: "@angular/",
    reason: "Phase 5 is backend-only and must not import frontend framework code."
  },
  {
    value: "frontend/",
    reason: "Phase 5 is backend-only and must not depend on frontend modules."
  },
  {
    value: "apps/mcp",
    reason: "MCP tools are out of scope for Phase 5."
  },
  {
    value: "@modelcontextprotocol",
    reason: "MCP tools are out of scope for Phase 5."
  },
  {
    value: "modelcontextprotocol",
    reason: "MCP tools are out of scope for Phase 5."
  },
  {
    value: "db/migrations",
    reason: "Phase 5 must not add or invoke schema migration behavior from places/plants modules."
  },
  {
    value: "run-migrations",
    reason: "Phase 5 must not add or invoke schema migration behavior from places/plants modules."
  }
];

describe("Phase 5 scope regression checks", () => {
  it("keeps places and plants runtime modules free of provider, frontend, MCP, and migration coupling", () => {
    for (const file of sourceFilesUnder(phaseFiveRuntimeRoots)) {
      const rel = relative(backendRoot, file).replaceAll("\\", "/");
      const source = readFileSync(file, "utf8");

      for (const forbidden of forbiddenReferences) {
        expect(source, `${rel} must not reference ${forbidden.value}. ${forbidden.reason}`).not.toContain(forbidden.value);
      }
    }
  });
});

function sourceFilesUnder(paths: readonly string[]): string[] {
  return paths.flatMap((path) => (existsDirectory(path) ? collectSourceFiles(path) : []));
}

function existsDirectory(path: string): boolean {
  try {
    return statSync(path).isDirectory();
  } catch {
    return false;
  }
}

function collectSourceFiles(path: string): string[] {
  const stat = statSync(path);

  if (stat.isFile()) {
    return sourceExtensions.has(extname(path)) ? [path] : [];
  }

  if (ignoredScanDirectoryNames.has(basename(path))) {
    return [];
  }

  return readdirSync(path).flatMap((entry) => collectSourceFiles(join(path, entry)));
}
