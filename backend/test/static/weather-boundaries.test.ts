import { readFile } from "node:fs/promises";
import { join, relative } from "node:path";

import { describe, expect, it } from "vitest";

const repoRoot = new URL("../../..", import.meta.url);

describe("weather provider boundaries", () => {
  it("confines Open-Meteo/provider fetch usage to backend weather adapters", async () => {
    const files = [
      "backend/src/integrations/weather/open-meteo.adapter.ts",
      "backend/src/integrations/weather/weather-adapter.factory.ts",
      "backend/src/modules/weather/weather.service.ts",
      "backend/src/modules/weather/weather.routes.ts",
      "frontend/src/app/app.routes.ts"
    ];
    const offenders: string[] = [];

    for (const file of files) {
      const absolute = join(repoRoot.pathname, file);
      const source = await readFile(absolute, "utf8").catch(() => "");
      const mentionsProvider = /open-meteo|OpenMeteo|api\.open-meteo\.com|fetch\(/.test(source);
      const allowed = file === "backend/src/integrations/weather/open-meteo.adapter.ts" || file === "backend/src/integrations/weather/weather-adapter.factory.ts";

      if (mentionsProvider && !allowed) {
        offenders.push(relative(repoRoot.pathname, absolute));
      }
    }

    expect(offenders).toEqual([]);
  });
});
