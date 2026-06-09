import type { AppConfig } from "../../config/config.js";
import { AppError } from "../../shared/errors/app-error.js";
import type { AiPort } from "./ai.port.js";
import { TestAiAdapter } from "./test-ai.adapter.js";

export function createAiAdapter(config: AppConfig): AiPort {
  if (config.nodeEnv === "test" || config.integrations.aiProvider === undefined) {
    return new TestAiAdapter();
  }

  // No production AI provider is implemented in this phase.
  // When a concrete provider (e.g. "anthropic") is selected, add its adapter here.
  // Until then, fail closed to prevent silent misconfigurations.
  throw new AppError(
    "INTERNAL_ERROR",
    `AI provider "${config.integrations.aiProvider}" is not configured. No production adapter is available in this phase.`
  );
}
