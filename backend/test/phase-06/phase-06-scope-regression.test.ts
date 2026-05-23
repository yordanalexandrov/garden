import { readdirSync, readFileSync, statSync } from "node:fs";
import { basename, extname, join, relative } from "node:path";

import { describe, expect, it } from "vitest";

const repoRoot = join(import.meta.dirname, "../../..");
const backendRoot = join(repoRoot, "backend");
const backendSrcRoot = join(backendRoot, "src");
const phaseSixRuntimeRoots = [
  join(backendSrcRoot, "modules/perennials"),
  join(backendSrcRoot, "modules/beds"),
  join(backendSrcRoot, "modules/plantings")
];
const ignoredScanDirectoryNames = new Set(["coverage", "dist", "node_modules"]);
const sourceExtensions = new Set([".ts", ".tsx", ".js", ".mjs", ".cjs"]);

const forbiddenReferences: readonly { value: string; reason: string }[] = [
  {
    value: "@angular/",
    reason: "Phase 6 is backend-only and must not import frontend framework code."
  },
  {
    value: "frontend/",
    reason: "Phase 6 runtime modules must not depend on frontend code."
  },
  {
    value: "WeatherPort",
    reason: "Weather integration belongs to the later weather phase."
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
    reason: "Storage integration belongs to problem photo phases."
  },
  {
    value: "PushPort",
    reason: "Push integration belongs to notification phases."
  },
  {
    value: "AiPort",
    reason: "AI integration belongs to AI suggestion phases."
  },
  {
    value: "TargetResolver",
    reason: "Target resolver belongs to Phase 11, after growing structure APIs are stable."
  },
  {
    value: "target-resolver",
    reason: "Target resolver belongs to Phase 11, after growing structure APIs are stable."
  },
  {
    value: "activities",
    reason: "Activity workflows are out of scope for Phase 6."
  },
  {
    value: "inventory",
    reason: "Inventory workflows are out of scope for Phase 6."
  },
  {
    value: "problems",
    reason: "Problem workflows are out of scope for Phase 6."
  },
  {
    value: "tasks",
    reason: "Task workflows are out of scope for Phase 6."
  },
  {
    value: "apps/mcp",
    reason: "MCP tools are out of scope for Phase 6."
  },
  {
    value: "@modelcontextprotocol",
    reason: "MCP tools are out of scope for Phase 6."
  },
  {
    value: "modelcontextprotocol",
    reason: "MCP tools are out of scope for Phase 6."
  },
  {
    value: "db/migrations",
    reason: "Phase 6 must not invoke schema migration behavior from growing structure modules."
  },
  {
    value: "run-migrations",
    reason: "Phase 6 must not invoke schema migration behavior from growing structure modules."
  }
];

describe("Phase 6 scope regression checks", () => {
  it("keeps growing structure runtime modules free of frontend, provider, MCP, target resolver, and schema redesign coupling", () => {
    for (const file of sourceFilesUnder(phaseSixRuntimeRoots)) {
      const rel = relative(backendRoot, file).replaceAll("\\", "/");
      const source = readFileSync(file, "utf8");

      for (const forbidden of forbiddenReferences) {
        expect(source, `${rel} must not reference ${forbidden.value}. ${forbidden.reason}`).not.toContain(
          forbidden.value
        );
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
