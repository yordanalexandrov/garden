import { readFileSync } from "node:fs";
import { relative } from "node:path";
import { describe, expect, it } from "vitest";

import { execFileSync } from "node:child_process";

const repoRoot = new URL("../../../", import.meta.url);

describe("problem photo storage security boundaries", () => {
  it("confines storage provider details to backend adapter files", () => {
    const files = trackedFiles(["backend/src", "backend/test", "frontend/src"]);

    for (const file of files) {
      const rel = relative(repoRoot.pathname, file);
      const source = readFileSync(file, "utf8");

      if (rel.endsWith("backend/src/modules/files/supabase-storage.adapter.ts")) {
        continue;
      }

      expect(source, rel).not.toMatch(/storage\.from\s*\(/i);
      expect(source, rel).not.toMatch(/storage\/v1\/object/i);
    }
  });

  it("does not place service-role secrets in frontend source", () => {
    const frontendFiles = trackedFiles(["frontend/src"]);

    for (const file of frontendFiles) {
      const source = readFileSync(file, "utf8");
      expect(source, relative(repoRoot.pathname, file)).not.toContain("SUPABASE_SERVICE_ROLE_KEY");
    }
  });
});

function trackedFiles(paths: string[]): string[] {
  return execFileSync("git", ["ls-files", ...paths], { cwd: repoRoot, encoding: "utf8" })
    .split("\n")
    .filter((file) => file.endsWith(".ts") || file.endsWith(".mjs"))
    .map((file) => new URL(file, repoRoot).pathname);
}
