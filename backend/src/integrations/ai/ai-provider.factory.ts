import type { AppConfig } from "../../config/config.js";
import { AppError } from "../../shared/errors/app-error.js";
import type { AiPort } from "./ai.port.js";
import { OpenAiAdapter } from "./openai-ai.adapter.js";
import { TestAiAdapter } from "./test-ai.adapter.js";

export function createAiAdapter(config: AppConfig): AiPort {
  if (config.nodeEnv === "test" || config.integrations.aiProvider === undefined) {
    return new TestAiAdapter();
  }

  if (config.integrations.aiProvider === "openai") {
    if (!config.backendOnly.aiApiKey) {
      throw new AppError("INTERNAL_ERROR", "AI_API_KEY is required when AI_PROVIDER=openai");
    }
    return new OpenAiAdapter(config.backendOnly.aiApiKey, config.integrations.aiModel);
  }

  throw new AppError(
    "INTERNAL_ERROR",
    `AI provider "${config.integrations.aiProvider}" is not supported. Supported providers: openai.`
  );
}
