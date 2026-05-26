import { readFileSync, readdirSync, statSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const repoRoot = new URL("../../../", import.meta.url).pathname;

describe("Phase 9 scope regression", () => {
  it("does not add MCP/provider behavior", () => {
    expect(listFiles("backend/src").filter((path) => path.includes("mcp"))).toEqual([]);

    const backendSource = listFiles("backend/src")
      .filter((path) => path.endsWith(".ts"))
      .map((path) => readFileSync(join(repoRoot, path), "utf8"))
      .join("\n");

    expect(backendSource).not.toContain("StoragePort");
    expect(backendSource).not.toContain("WeatherPort");
    expect(backendSource).not.toContain("PushPort");
  });

  it("does not implement activity consumption movements in Phase 9", () => {
    const inventorySource = listFiles("backend/src/modules/inventory")
      .filter((path) => path.endsWith(".ts"))
      .map((path) => readFileSync(join(repoRoot, path), "utf8"))
      .join("\n");

    expect(inventorySource).not.toContain('movementType: "consumption"');
    expect(inventorySource).not.toContain("activity_product_usages");
  });
});

function listFiles(relativeDir: string): string[] {
  const absoluteDir = join(repoRoot, relativeDir);

  return readdirSync(absoluteDir).flatMap((entry) => {
    const absolutePath = join(absoluteDir, entry);
    const relativePath = join(relativeDir, entry);

    if (statSync(absolutePath).isDirectory()) {
      return listFiles(relativePath);
    }

    return [relativePath];
  });
}
