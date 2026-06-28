# Problem Assist — Follow-up Questions UI + Vision Photos Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add typed input fields for AI follow-up questions in Problem Assist, plus send problem photos to OpenAI as vision content.

**Architecture:** Backend AI types gain `FollowUpQuestion` (with `type: 'yes_no' | 'free_text'`) and `FollowUpAnswer`. The OpenAI adapter gets a new `callJsonWithImages()` for multimodal calls and an updated `assistProblem()` prompt. `AiService` receives `StoragePort` to fetch signed photo URLs. The frontend renders radio groups or textareas per question type, collects answers, and re-submits to the same `/ai/problem-assist` endpoint.

**Tech Stack:** TypeScript, Node.js/Fastify backend, Angular 19 frontend, OpenAI SDK (chat.completions for assistProblem), Vitest, Angular TestBed

## Global Constraints

- `callJson()` stays unchanged — only `assistProblem()` uses `callJsonWithImages()`
- `StoragePort` is optional in `AiService` — missing storage silently skips photo URLs (count-only fallback)
- Free-text answers left blank are excluded from `followUpAnswers` payload (filtered by length > 0)
- `"не знам"` answers for yes_no questions are included in re-submit payload
- Signed URLs use 300s TTL (consumed immediately by OpenAI)
- Follow-up answers are accepted in HTTP body as optional array — existing `refine()` validation (either problemId or text required) is preserved
- All free-text AI output (summary, followUpQuestions text) remains in Bulgarian per existing prompt requirement
- No changes to accept/reject flows — `problem_summary` suggestions stay guidance-only

---

## File Map

**Modified:**
- `backend/src/integrations/ai/ai.types.ts` — add `FollowUpQuestion`, `FollowUpAnswer`, update `NormalizedProblemSummaryPayload` and `AssistProblemInput`
- `backend/src/integrations/ai/openai-ai.adapter.ts` — add `callJsonWithImages()`, update `assistProblem()`
- `backend/src/integrations/ai/test-ai.adapter.ts` — update `DEFAULT_PROBLEM_SUGGESTIONS` to typed questions
- `backend/src/modules/ai/ai.service.ts` — add `StoragePort`, update `AssistProblemInput`, update `assistProblem()`
- `backend/src/modules/ai/ai.validation.ts` — add `followUpAnswers` to `problemAssistBodySchema`
- `backend/src/modules/ai/ai.routes.ts` — add `storage` to `AiRouteOptions`, wire into `createAiService()`
- `backend/test/ai/ai.validation-dto.test.ts` — new validation tests
- `backend/test/ai/openai-adapter.test.ts` — updated `assistProblem` tests
- `backend/test/ai/ai.routes.test.ts` — new integration test for `followUpAnswers`
- `frontend/src/app/features/ai/ai.models.ts` — add `FollowUpQuestion`, `FollowUpAnswer`, update payloads
- `frontend/src/app/features/ai/pages/problem-assist-page/problem-assist-page.ts` — add followup state and methods
- `frontend/src/app/features/ai/pages/problem-assist-page/problem-assist-page.html` — typed inputs + refine button
- `frontend/src/app/features/ai/pages/problem-assist-page/problem-assist-page.spec.ts` — updated + new tests

---

### Task 1: Backend AI integration types

**Files:**
- Modify: `backend/src/integrations/ai/ai.types.ts`

**Interfaces:**
- Produces: `FollowUpQuestion`, `FollowUpAnswer`, updated `NormalizedProblemSummaryPayload`, updated `AssistProblemInput` — used by Tasks 2, 3, 4, 5

- [ ] **Step 1: Update `ai.types.ts`**

Replace lines 41-51 and 104-112 (the `NormalizedProblemSummaryPayload` and `AssistProblemInput` types):

```typescript
// Add after line 40 (after NormalizedBedPlanPayload):
export type FollowUpQuestion = {
  text: string;
  type: "yes_no" | "free_text";
};

export type FollowUpAnswer = {
  question: string;
  answer: string;
};

export type NormalizedProblemSummaryPayload = {
  summary: string;
  possibleCategories: string[];
  followUpQuestions: FollowUpQuestion[];   // was: unknown[]
};
```

And update `AssistProblemInput` (currently at lines 104-108):
```typescript
export type AssistProblemInput = {
  problemId?: string;
  text?: string;
  problemContext?: ProblemContextInput;
  photoUrls?: string[];           // new
  followUpAnswers?: FollowUpAnswer[];  // new
};
```

- [ ] **Step 2: Run TypeScript check**

```bash
cd /home/yordan/dev/garden/backend && npm run typecheck 2>&1 | head -40
```

Expected: zero errors related to `ai.types.ts`. If there are errors from downstream consumers of the old `followUpQuestions: unknown[]`, they will be fixed in later tasks.

- [ ] **Step 3: Commit**

```bash
cd /home/yordan/dev/garden && git add backend/src/integrations/ai/ai.types.ts
git commit -m "feat(ai): add FollowUpQuestion/FollowUpAnswer types and update AssistProblemInput"
```

---

### Task 2: Backend validation — followUpAnswers in schema

**Files:**
- Modify: `backend/src/modules/ai/ai.validation.ts`
- Modify: `backend/test/ai/ai.validation-dto.test.ts`

**Interfaces:**
- Produces: `problemAssistBodySchema` that accepts optional `followUpAnswers`

- [ ] **Step 1: Write the failing tests**

Add to `backend/test/ai/ai.validation-dto.test.ts`, inside `describe("AI validation schemas", ...)`:

```typescript
it("validates problem assist with followUpAnswers", () => {
  expect(
    problemAssistBodySchema.safeParse({
      text: "Yellow spots on leaves",
      followUpAnswers: [{ question: "Are spots wet?", answer: "да" }],
    }).success,
  ).toBe(true);
});

it("accepts problem assist with empty followUpAnswers array", () => {
  expect(
    problemAssistBodySchema.safeParse({
      text: "Yellow spots",
      followUpAnswers: [],
    }).success,
  ).toBe(true);
});

it("rejects problem assist followUpAnswers with empty question string", () => {
  expect(
    problemAssistBodySchema.safeParse({
      text: "Yellow spots",
      followUpAnswers: [{ question: "", answer: "да" }],
    }).success,
  ).toBe(false);
});

it("rejects problem assist followUpAnswers with empty answer string", () => {
  expect(
    problemAssistBodySchema.safeParse({
      text: "Yellow spots",
      followUpAnswers: [{ question: "Are spots wet?", answer: "" }],
    }).success,
  ).toBe(false);
});
```

- [ ] **Step 2: Run tests to confirm failure**

```bash
cd /home/yordan/dev/garden/backend && npx vitest run test/ai/ai.validation-dto.test.ts 2>&1 | tail -20
```

Expected: 4 new tests FAIL ("followUpAnswers" not in schema yet).

- [ ] **Step 3: Update `problemAssistBodySchema` in `ai.validation.ts`**

Replace the existing `problemAssistBodySchema`:
```typescript
export const problemAssistBodySchema = z
  .object({
    problemId: uuidSchema.optional(),
    text: z.string().trim().min(1).optional(),
    followUpAnswers: z
      .array(
        z.object({
          question: z.string().trim().min(1),
          answer: z.string().trim().min(1),
        }),
      )
      .optional(),
  })
  .refine((value) => value.problemId !== undefined || value.text !== undefined, {
    message: "Either problemId or text is required",
  });
```

Also update the exported type at the bottom of the file:
```typescript
export type ProblemAssistBody = z.infer<typeof problemAssistBodySchema>;
```
(This line already exists — it will automatically pick up the new field.)

- [ ] **Step 4: Run tests to confirm pass**

```bash
cd /home/yordan/dev/garden/backend && npx vitest run test/ai/ai.validation-dto.test.ts 2>&1 | tail -20
```

Expected: ALL tests pass.

- [ ] **Step 5: Commit**

```bash
cd /home/yordan/dev/garden && git add backend/src/modules/ai/ai.validation.ts backend/test/ai/ai.validation-dto.test.ts
git commit -m "feat(ai): accept followUpAnswers in problemAssistBodySchema"
```

---

### Task 3: OpenAI adapter — vision support and typed questions

**Files:**
- Modify: `backend/src/integrations/ai/openai-ai.adapter.ts`
- Modify: `backend/test/ai/openai-adapter.test.ts`

**Interfaces:**
- Consumes: `FollowUpQuestion`, `FollowUpAnswer`, updated `AssistProblemInput` from Task 1
- Produces: `assistProblem()` that returns `FollowUpQuestion[]`, uses `callJsonWithImages()` when `photoUrls` present, appends answers to prompt

- [ ] **Step 1: Write failing tests for new behaviour**

Add to `backend/test/ai/openai-adapter.test.ts`, inside the existing `describe("assistProblem", ...)` block:

```typescript
it("returns typed followUpQuestions with yes_no and free_text", async () => {
  const payload = {
    summary: "Possible fungal infection.",
    possibleCategories: ["fungus"],
    followUpQuestions: [
      { text: "Влажни ли са петната?", type: "yes_no" },
      { text: "Кога за последен път полихте?", type: "free_text" },
    ],
  };
  mockCreate.mockResolvedValue(makeCompletionResponse(JSON.stringify(payload)));

  const result = await adapter.assistProblem({ text: "Yellow spots" });
  const p = result.suggestions[0]!.payload as Record<string, unknown>;
  const questions = p.followUpQuestions as Array<{ text: string; type: string }>;

  expect(questions).toHaveLength(2);
  expect(questions[0]!.type).toBe("yes_no");
  expect(questions[0]!.text).toBe("Влажни ли са петната?");
  expect(questions[1]!.type).toBe("free_text");
});

it("defaults unknown question type to free_text", async () => {
  const payload = {
    summary: "Possible infection.",
    possibleCategories: [],
    followUpQuestions: [{ text: "Кога забелязахте?", type: "unknown_type" }],
  };
  mockCreate.mockResolvedValue(makeCompletionResponse(JSON.stringify(payload)));

  const result = await adapter.assistProblem({ text: "Yellow spots" });
  const p = result.suggestions[0]!.payload as Record<string, unknown>;
  const questions = p.followUpQuestions as Array<{ text: string; type: string }>;

  expect(questions[0]!.type).toBe("free_text");
});

it("handles legacy string question format with free_text type", async () => {
  const payload = {
    summary: "Possible infection.",
    possibleCategories: [],
    followUpQuestions: ["Кога забелязахте?"],
  };
  mockCreate.mockResolvedValue(makeCompletionResponse(JSON.stringify(payload)));

  const result = await adapter.assistProblem({ text: "Yellow spots" });
  const p = result.suggestions[0]!.payload as Record<string, unknown>;
  const questions = p.followUpQuestions as Array<{ text: string; type: string }>;

  expect(questions[0]!.type).toBe("free_text");
  expect(questions[0]!.text).toBe("Кога забелязахте?");
});

it("sends image_url content blocks when photoUrls provided", async () => {
  const payload = {
    summary: "Possible infection.",
    possibleCategories: ["fungus"],
    followUpQuestions: [],
  };
  mockCreate.mockResolvedValue(makeCompletionResponse(JSON.stringify(payload)));

  await adapter.assistProblem({
    text: "Yellow spots",
    photoUrls: ["https://example.com/photo1.jpg", "https://example.com/photo2.jpg"],
  });

  expect(mockCreate).toHaveBeenCalledOnce();
  const call = mockCreate.mock.calls[0]![0] as {
    messages: Array<{ role: string; content: unknown }>;
  };
  const userMsg = call.messages[1]!;
  expect(Array.isArray(userMsg.content)).toBe(true);
  const parts = userMsg.content as Array<{ type: string; image_url?: { url: string } }>;
  const imageParts = parts.filter((c) => c.type === "image_url");
  expect(imageParts).toHaveLength(2);
  expect(imageParts[0]!.image_url!.url).toBe("https://example.com/photo1.jpg");
});

it("uses plain text message (not multimodal) when no photoUrls", async () => {
  const payload = {
    summary: "Possible infection.",
    possibleCategories: [],
    followUpQuestions: [],
  };
  mockCreate.mockResolvedValue(makeCompletionResponse(JSON.stringify(payload)));

  await adapter.assistProblem({ text: "Yellow spots" });

  const call = mockCreate.mock.calls[0]![0] as {
    messages: Array<{ role: string; content: unknown }>;
  };
  const userContent = call.messages[1]!.content;
  expect(typeof userContent).toBe("string");
});

it("appends followUpAnswers to user content when provided", async () => {
  const payload = {
    summary: "More specific advice.",
    possibleCategories: ["fungus"],
    followUpQuestions: [],
  };
  mockCreate.mockResolvedValue(makeCompletionResponse(JSON.stringify(payload)));

  await adapter.assistProblem({
    text: "Yellow spots",
    followUpAnswers: [
      { question: "Влажни ли са петната?", answer: "да" },
      { question: "Кога забелязахте?", answer: "Преди 3 дни" },
    ],
  });

  const call = mockCreate.mock.calls[0]![0] as {
    messages: Array<{ role: string; content: unknown }>;
  };
  const userContent = call.messages[1]!.content as string;
  expect(userContent).toContain("Влажни ли са петната?");
  expect(userContent).toContain("да");
  expect(userContent).toContain("Преди 3 дни");
});
```

- [ ] **Step 2: Run tests to confirm failure**

```bash
cd /home/yordan/dev/garden/backend && npx vitest run test/ai/openai-adapter.test.ts 2>&1 | tail -30
```

Expected: 6 new tests FAIL, existing `assistProblem` test may fail too (old string[] return format).

- [ ] **Step 3: Add `callJsonWithImages()` method to `OpenAiAdapter`**

Add before the existing `private async callJson(...)` method (around line 593):

```typescript
private async callJsonWithImages(
  systemPrompt: string,
  userContent: string,
  imageUrls: string[],
): Promise<Record<string, unknown>> {
  try {
    const response = await this.client.chat.completions.create({
      model: this.model,
      temperature: EXTRACTION_TEMPERATURE,
      response_format: { type: "json_object" },
      messages: [
        { role: "system", content: systemPrompt },
        {
          role: "user",
          content: [
            { type: "text", text: userContent },
            ...imageUrls.map((url) => ({
              type: "image_url" as const,
              image_url: { url },
            })),
          ],
        },
      ],
    });

    const content = response.choices[0]?.message?.content ?? "{}";
    return JSON.parse(content) as Record<string, unknown>;
  } catch (error) {
    throw this.mapError(error);
  }
}
```

- [ ] **Step 4: Replace the `assistProblem()` method**

Replace the existing `async assistProblem(...)` method (lines ~384–432):

```typescript
async assistProblem(input: AssistProblemInput): Promise<AssistProblemResult> {
  const parts: string[] = [];

  if (input.problemContext !== undefined) {
    const ctx = input.problemContext;
    parts.push(`Title: ${ctx.title}`);
    parts.push(`Description: ${ctx.description}`);
    if (ctx.targetLabel !== null) parts.push(`Affected plant/target: ${ctx.targetLabel}`);
    if (ctx.category !== null) parts.push(`Category: ${ctx.category}`);
    if (ctx.severity !== null) parts.push(`Severity: ${ctx.severity}`);
    parts.push(`Observed at: ${ctx.observedAt}`);
    if (ctx.photosCount > 0) parts.push(`Photos attached: ${ctx.photosCount}`);
  } else if (input.problemId !== undefined) {
    parts.push(`Problem ID: ${input.problemId}`);
  }

  if (input.text !== undefined) parts.push(`Additional description: ${input.text}`);

  if (input.followUpAnswers !== undefined && input.followUpAnswers.length > 0) {
    parts.push("\nПотребителят отговори на уточняващите въпроси:");
    for (const a of input.followUpAnswers) {
      parts.push(`- ${a.question} → ${a.answer}`);
    }
  }

  const userContent = parts.join("\n");

  const systemPrompt = `You are a gardening problem diagnostic assistant.
Analyze the described plant problem and provide advisory information only.
You must NOT make definitive diagnoses — present possibilities, not conclusions.
Base your analysis on the problem title, description, affected plant/target, severity, and any other context provided.
Always write all free-text output (summary, followUpQuestions text) in Bulgarian.
Return a JSON object with these fields:
- summary: string — a brief, cautious advisory summary based on the specific problem described (in Bulgarian)
- possibleCategories: string[] — possible problem categories (e.g. fungus, pest, nutrient_deficiency, environmental)
- followUpQuestions: Array of { "text": string, "type": "yes_no" | "free_text" } — clarifying questions to narrow down the problem (text in Bulgarian). Use "yes_no" for questions answerable with yes/no, "free_text" for open questions.

Return only valid JSON. Do not include markdown fences.`;

  const photoUrls = input.photoUrls ?? [];
  const raw =
    photoUrls.length > 0
      ? await this.callJsonWithImages(systemPrompt, userContent, photoUrls)
      : await this.callJson(systemPrompt, userContent);

  const suggestions: NormalizedSuggestion[] = [
    {
      type: "problem_summary",
      payload: {
        summary: typeof raw.summary === "string" ? raw.summary : "",
        possibleCategories: Array.isArray(raw.possibleCategories)
          ? (raw.possibleCategories as string[])
          : [],
        followUpQuestions: Array.isArray(raw.followUpQuestions)
          ? raw.followUpQuestions.map((q) => ({
              text:
                typeof (q as Record<string, unknown>)?.text === "string"
                  ? ((q as Record<string, unknown>).text as string)
                  : String(q),
              type:
                (q as Record<string, unknown>)?.type === "yes_no"
                  ? ("yes_no" as const)
                  : ("free_text" as const),
            }))
          : [],
      },
    },
  ];

  return { suggestions };
}
```

- [ ] **Step 5: Run tests to confirm all pass**

```bash
cd /home/yordan/dev/garden/backend && npx vitest run test/ai/openai-adapter.test.ts 2>&1 | tail -30
```

Expected: ALL tests pass (including the original `assistProblem` test — update the existing test's assertion for `followUpQuestions` if it checks the raw string format):

The existing test checks:
```typescript
expect(p.possibleCategories).toEqual(["fungus", "nutrient_deficiency"]);
```
This still passes. But the payload fixture uses `followUpQuestions: ["When did you first notice this?"]` (a string). After the new parser, this will be converted to `{ text: "When did you first notice this?", type: "free_text" }`. The existing test does not assert on `followUpQuestions`, so it still passes unchanged.

- [ ] **Step 6: Commit**

```bash
cd /home/yordan/dev/garden && git add backend/src/integrations/ai/openai-ai.adapter.ts backend/test/ai/openai-adapter.test.ts
git commit -m "feat(ai): add callJsonWithImages and typed followUpQuestions in assistProblem"
```

---

### Task 4: TestAiAdapter — typed follow-up questions

**Files:**
- Modify: `backend/src/integrations/ai/test-ai.adapter.ts`

**Interfaces:**
- Consumes: `FollowUpQuestion` from Task 1
- Produces: `DEFAULT_PROBLEM_SUGGESTIONS` returns typed `FollowUpQuestion[]` — needed for integration tests in Task 6

- [ ] **Step 1: Update `DEFAULT_PROBLEM_SUGGESTIONS`**

Replace the `DEFAULT_PROBLEM_SUGGESTIONS` constant (lines 58–67):

```typescript
const DEFAULT_PROBLEM_SUGGESTIONS: NormalizedSuggestion[] = [
  {
    type: "problem_summary",
    payload: {
      summary: "Possible fungal infection based on the described symptoms.",
      possibleCategories: ["fungus", "nutrient_deficiency"],
      followUpQuestions: [
        { text: "Кога за първи път забелязахте симптомите?", type: "free_text" },
        { text: "Влажни ли са петната при допир?", type: "yes_no" },
      ],
    },
  },
];
```

- [ ] **Step 2: Run typecheck**

```bash
cd /home/yordan/dev/garden/backend && npm run typecheck 2>&1 | grep -E "error|warning" | head -20
```

Expected: No errors.

- [ ] **Step 3: Commit**

```bash
cd /home/yordan/dev/garden && git add backend/src/integrations/ai/test-ai.adapter.ts
git commit -m "feat(ai): update TestAiAdapter to return typed FollowUpQuestion objects"
```

---

### Task 5: AiService — StoragePort injection and photo URL fetching

**Files:**
- Modify: `backend/src/modules/ai/ai.service.ts`

**Interfaces:**
- Consumes: `StoragePort` from `backend/src/modules/files/storage.port.ts`, `FollowUpAnswer` from Task 1
- Produces: `assistProblem()` that fetches signed URLs and forwards `followUpAnswers` to the AI port

- [ ] **Step 1: Add StoragePort import and update service type**

At the top of `ai.service.ts`, add this import after the existing imports:

```typescript
import type { StoragePort } from "../files/storage.port.js";
```

Also add `FollowUpAnswer` to the existing integration import. Change:
```typescript
import type {
  GenerateProductRulesExistingRule,
  GenerateProductRulesPlant
} from "../../integrations/ai/ai.types.js";
```
to:
```typescript
import type {
  FollowUpAnswer,
  GenerateProductRulesExistingRule,
  GenerateProductRulesPlant
} from "../../integrations/ai/ai.types.js";
```

Update `AssistProblemInput` type (line 77–80):

```typescript
export type AssistProblemInput = {
  problemId?: UUID;
  text?: string;
  followUpAnswers?: FollowUpAnswer[];
};
```

- [ ] **Step 2: Add `storagePort` to the constructor**

Change the constructor signature (lines 88–98) to add `storagePort?` as the 9th parameter:

```typescript
constructor(
  private readonly aiRepository: AiRepository,
  private readonly aiPort: AiPort,
  private readonly productsService: ProductsService,
  private readonly bedsRepository: BedsRepository,
  private readonly plantsRepository: PlantsRepository,
  private readonly dbClient: DbClient,
  private readonly auditService?: AuditService,
  private readonly problemsRepository?: ProblemsRepository,
  private readonly storagePort?: StoragePort
) {}
```

- [ ] **Step 3: Update `assistProblem()` to fetch photos and forward answers**

Replace the `async assistProblem(...)` method (lines 230–294) with:

```typescript
async assistProblem(actor: AuthenticatedActor, input: AssistProblemInput): Promise<GenerationResult> {
  let problemContext: Parameters<AiPort["assistProblem"]>[0]["problemContext"];
  let photoUrls: string[] = [];

  if (input.problemId !== undefined) {
    if (this.problemsRepository !== undefined) {
      const detail = await this.problemsRepository.getDetail(actor.accountId, input.problemId);

      if (detail === null) {
        throw new AppError("NOT_FOUND", "Problem not found");
      }

      problemContext = {
        title: detail.title,
        description: detail.description,
        targetLabel: detail.targetLabel,
        category: detail.category,
        severity: detail.severity,
        observedAt: detail.observedAt.toISOString().slice(0, 10),
        photosCount: detail.photos.length
      };

      if (this.storagePort !== undefined && detail.photos.length > 0) {
        const results = await Promise.allSettled(
          detail.photos.map((photo) =>
            this.storagePort!.getSignedUrl({ storageKey: photo.storageKey, expiresInSeconds: 300 })
          )
        );
        photoUrls = results
          .filter((r): r is PromiseFulfilledResult<string> => r.status === "fulfilled")
          .map((r) => r.value);
      }
    } else {
      const exists = await this.findProblemForAccount(actor.accountId, input.problemId);

      if (!exists) {
        throw new AppError("NOT_FOUND", "Problem not found");
      }
    }
  }

  let portResult;

  try {
    portResult = await this.aiPort.assistProblem({
      ...(input.problemId !== undefined ? { problemId: input.problemId } : {}),
      ...(input.text !== undefined ? { text: input.text } : {}),
      ...(problemContext !== undefined ? { problemContext } : {}),
      ...(photoUrls.length > 0 ? { photoUrls } : {}),
      ...(input.followUpAnswers !== undefined ? { followUpAnswers: input.followUpAnswers } : {}),
    });
  } catch (error) {
    if (isAiProviderError(error)) {
      throw new AppError("EXTERNAL_SERVICE_ERROR", "AI provider failed");
    }

    throw error;
  }

  const session = await this.aiRepository.createSession({
    accountId: actor.accountId,
    kind: "problem_assist",
    inputMode: "text",
    status: "completed",
    rawInputText: input.text ?? null,
    relatedEntityType: input.problemId !== undefined ? "problem" : null,
    relatedEntityId: input.problemId ?? null
  });

  const suggestions = await this.aiRepository.addSuggestions(
    session.id,
    portResult.suggestions.map((s) => ({
      suggestionType: s.type,
      payload: s.payload
    }))
  );

  return { session, suggestions };
}
```

- [ ] **Step 4: Run typecheck**

```bash
cd /home/yordan/dev/garden/backend && npm run typecheck 2>&1 | grep -E "error" | head -20
```

Expected: No errors.

- [ ] **Step 5: Commit**

```bash
cd /home/yordan/dev/garden && git add backend/src/modules/ai/ai.service.ts
git commit -m "feat(ai): inject StoragePort into AiService; fetch photo signed URLs for assistProblem"
```

---

### Task 6: AI routes — wire StoragePort and followUpAnswers

**Files:**
- Modify: `backend/src/modules/ai/ai.routes.ts`
- Modify: `backend/test/ai/ai.routes.test.ts`

**Interfaces:**
- Consumes: `StoragePort`, updated `AiService.assistProblem()` from Task 5, `ProblemAssistBody` from Task 2
- Produces: `/ai/problem-assist` route accepts and forwards `followUpAnswers`

- [ ] **Step 1: Write the failing integration test**

Find the `describe("problem assist", ...)` block in `backend/test/ai/ai.routes.test.ts` (around line 250) and add:

```typescript
it("forwards followUpAnswers to the AI port", async () => {
  const response = await app!.inject({
    method: "POST",
    url: "/api/v1/ai/problem-assist",
    headers: accountAAuthHeaders(),
    payload: {
      text: "Yellow spots on leaves",
      followUpAnswers: [
        { question: "Влажни ли са петната?", answer: "да" },
        { question: "Кога забелязахте?", answer: "Преди 3 дни" },
      ],
    },
  });

  expect(response.statusCode).toBe(200);
  expect(ai.assistProblemCalls).toHaveLength(1);
  expect(ai.assistProblemCalls[0]!.followUpAnswers).toEqual([
    { question: "Влажни ли са петната?", answer: "да" },
    { question: "Кога забелязахте?", answer: "Преди 3 дни" },
  ]);
});
```

- [ ] **Step 2: Run test to confirm failure**

```bash
cd /home/yordan/dev/garden/backend && npx vitest run test/ai/ai.routes.test.ts --no-file-parallelism 2>&1 | grep -E "FAIL|followUpAnswers|PASS" | head -20
```

Expected: new test FAILS (`followUpAnswers` is `undefined` on the port call).

- [ ] **Step 3: Update `ai.routes.ts`**

Add `StoragePort` import at top of `ai.routes.ts` (after existing imports):

```typescript
import type { StoragePort } from "../files/storage.port.js";
```

Update `AiRouteOptions` type:

```typescript
export type AiRouteOptions = {
  db?: DbClient;
  config?: AppConfig;
  ai?: AiPort;
  storage?: StoragePort;
};
```

Update the `/problem-assist` handler to pass `followUpAnswers`:

```typescript
app.post("/problem-assist", protectedRoute, async (request) => {
  const actor = requireActor(request);
  const { body } = validateRequest(request, { body: problemAssistBodySchema });
  const result = await requireAiService(aiService).assistProblem(actor, {
    ...(body.problemId !== undefined ? { problemId: body.problemId } : {}),
    ...(body.text !== undefined ? { text: body.text } : {}),
    ...(body.followUpAnswers !== undefined ? { followUpAnswers: body.followUpAnswers } : {}),
  });

  return successEnvelope(toGenerationResponseDto(result.session, result.suggestions));
});
```

Update `createAiService()` to accept and pass `storage`:

```typescript
function createAiService(options: AiRouteOptions): AiService | undefined {
  if (options.db === undefined) {
    return undefined;
  }

  const db = options.db;
  const aiPort = options.ai ?? (options.config !== undefined ? createAiAdapter(options.config) : undefined);

  if (aiPort === undefined) {
    return undefined;
  }

  const auditService = new AuditService(new KyselyAuditLogsRepository(db));
  const productsService = new ProductsService(
    new KyselyProductsRepository(db),
    new KyselyPlantsRepository(db),
    auditService
  );

  return new AiService(
    new KyselyAiRepository(db),
    aiPort,
    productsService,
    new KyselyBedsRepository(db),
    new KyselyPlantsRepository(db),
    db,
    auditService,
    new KyselyProblemsRepository(db),
    options.storage,          // new: optional StoragePort
  );
}
```

- [ ] **Step 4: Run integration tests**

```bash
cd /home/yordan/dev/garden/backend && npx vitest run test/ai/ai.routes.test.ts --no-file-parallelism 2>&1 | tail -20
```

Expected: ALL tests pass including the new one.

- [ ] **Step 5: Run full backend test suite**

```bash
cd /home/yordan/dev/garden/backend && npm test -- --no-file-parallelism 2>&1 | tail -30
```

Expected: All tests pass.

- [ ] **Step 6: Commit**

```bash
cd /home/yordan/dev/garden && git add backend/src/modules/ai/ai.routes.ts backend/test/ai/ai.routes.test.ts
git commit -m "feat(ai): wire StoragePort and followUpAnswers through AI routes"
```

---

### Task 7: Frontend models

**Files:**
- Modify: `frontend/src/app/features/ai/ai.models.ts`

**Interfaces:**
- Produces: `FollowUpQuestion`, `FollowUpAnswer` interfaces; updated `ProblemSummarySuggestionPayload`; updated `ProblemAssistRequest` — consumed by Task 8

- [ ] **Step 1: Update `ai.models.ts`**

Add two new interfaces after the existing `ProblemAssistRequest` interface (line 61):

```typescript
export interface FollowUpQuestion {
  readonly text: string;
  readonly type: 'yes_no' | 'free_text';
}

export interface FollowUpAnswer {
  readonly question: string;
  readonly answer: string;
}
```

Update `ProblemSummarySuggestionPayload` (currently around line 134–138):

```typescript
export interface ProblemSummarySuggestionPayload {
  readonly summary?: string;
  readonly possibleCategories?: readonly string[];
  readonly followUpQuestions?: readonly FollowUpQuestion[];
}
```

Update `ProblemAssistRequest` (lines 58–61):

```typescript
export interface ProblemAssistRequest {
  readonly problemId?: string;
  readonly text?: string;
  readonly followUpAnswers?: readonly FollowUpAnswer[];
}
```

- [ ] **Step 2: Run typecheck**

```bash
cd /home/yordan/dev/garden/frontend && npm run typecheck 2>&1 | head -30
```

Expected: No errors (or only errors about `followUpQuestions` still used as `string` in the HTML — those are fixed in Task 8).

- [ ] **Step 3: Commit**

```bash
cd /home/yordan/dev/garden && git add frontend/src/app/features/ai/ai.models.ts
git commit -m "feat(ai): add FollowUpQuestion/FollowUpAnswer frontend models"
```

---

### Task 8: Frontend page — typed inputs and refine button

**Files:**
- Modify: `frontend/src/app/features/ai/pages/problem-assist-page/problem-assist-page.ts`
- Modify: `frontend/src/app/features/ai/pages/problem-assist-page/problem-assist-page.html`
- Modify: `frontend/src/app/features/ai/pages/problem-assist-page/problem-assist-page.spec.ts`

**Interfaces:**
- Consumes: `FollowUpQuestion`, `FollowUpAnswer`, `ProblemAssistRequest` from Task 7; `AiApiService.problemAssist()` (unchanged signature)

- [ ] **Step 1: Write failing tests**

In `problem-assist-page.spec.ts`:

1. Update the `problemSummarySuggestion` fixture (line 11) to use typed questions:

```typescript
const problemSummarySuggestion = {
  id: 'suggestion-1',
  suggestionType: 'problem_summary',
  payload: {
    summary: 'Possible fungal infection on lower leaves.',
    possibleCategories: ['fungus', 'nutrient_deficiency'],
    followUpQuestions: [
      { text: 'Are the spots dry or wet?', type: 'yes_no' },
      { text: 'When did you first notice it?', type: 'free_text' },
    ],
  },
};
```

2. Add new tests at the end of the `describe` block:

```typescript
it('renders yes_no question with Да / Не / Не знам radio buttons', () => {
  const fixture = TestBed.createComponent(ProblemAssistPage);
  const component = fixture.componentInstance;
  fixture.detectChanges();

  component.form.patchValue({ text: 'Yellow leaves' });
  component.submit();
  fixture.detectChanges();

  const compiled = fixture.nativeElement as HTMLElement;
  expect(compiled.textContent).toContain('Да');
  expect(compiled.textContent).toContain('Не');
  expect(compiled.textContent).toContain('Не знам');
});

it('renders free_text question with a textarea', () => {
  const fixture = TestBed.createComponent(ProblemAssistPage);
  const component = fixture.componentInstance;
  fixture.detectChanges();

  component.form.patchValue({ text: 'Yellow leaves' });
  component.submit();
  fixture.detectChanges();

  const compiled = fixture.nativeElement as HTMLElement;
  // Should have at least one textarea for the free_text follow-up question
  expect(compiled.querySelectorAll('textarea').length).toBeGreaterThan(0);
});

it('shows Прецизирай анализа button after AI response is received', () => {
  const fixture = TestBed.createComponent(ProblemAssistPage);
  const component = fixture.componentInstance;
  fixture.detectChanges();

  const compiledBefore = fixture.nativeElement as HTMLElement;
  expect(compiledBefore.textContent).not.toContain('Прецизирай анализа');

  component.form.patchValue({ text: 'Yellow leaves' });
  component.submit();
  fixture.detectChanges();

  const compiled = fixture.nativeElement as HTMLElement;
  expect(compiled.textContent).toContain('Прецизирай анализа');
});

it('submitFollowUp sends non-empty answers alongside original params', () => {
  const fixture = TestBed.createComponent(ProblemAssistPage);
  const component = fixture.componentInstance;
  fixture.detectChanges();

  component.form.patchValue({ text: 'Yellow leaves' });
  component.submit();
  fixture.detectChanges();

  component.setAnswer(0, 'да');
  component.submitFollowUp();

  expect(aiApi.problemAssist).toHaveBeenCalledTimes(2);
  const secondCall = aiApi.problemAssist.mock.calls[1]![0] as Record<string, unknown>;
  expect(secondCall['text']).toBe('Yellow leaves');
  expect(secondCall['followUpAnswers']).toEqual([
    { question: 'Are the spots dry or wet?', answer: 'да' },
  ]);
});

it('submitFollowUp excludes blank free_text answers', () => {
  const fixture = TestBed.createComponent(ProblemAssistPage);
  const component = fixture.componentInstance;
  fixture.detectChanges();

  component.form.patchValue({ text: 'Yellow leaves' });
  component.submit();
  fixture.detectChanges();

  // Don't call setAnswer — all answers are blank
  component.submitFollowUp();

  expect(aiApi.problemAssist).toHaveBeenCalledTimes(2);
  const secondCall = aiApi.problemAssist.mock.calls[1]![0] as Record<string, unknown>;
  expect(secondCall['followUpAnswers']).toEqual([]);
});

it('setAnswer stores answer at the given index', () => {
  const fixture = TestBed.createComponent(ProblemAssistPage);
  const component = fixture.componentInstance;
  fixture.detectChanges();

  component.setAnswer(2, 'не знам');
  expect(component.followUpAnswers()[2]).toBe('не знам');
});

it('followUpAnswers signal is reset on new initial submit', () => {
  const fixture = TestBed.createComponent(ProblemAssistPage);
  const component = fixture.componentInstance;
  fixture.detectChanges();

  component.form.patchValue({ text: 'Yellow leaves' });
  component.setAnswer(0, 'да');
  component.submit();
  fixture.detectChanges();

  expect(component.followUpAnswers()).toEqual({});
});
```

- [ ] **Step 2: Run tests to confirm failure**

```bash
cd /home/yordan/dev/garden/frontend && npm test -- --run 2>&1 | grep -E "problem-assist|FAIL|PASS" | tail -20
```

Expected: New tests FAIL (`setAnswer`, `submitFollowUp`, `followUpAnswers` don't exist yet). Existing tests may fail too if the `string[]` follow-up rendering breaks.

- [ ] **Step 3: Update `problem-assist-page.ts`**

Replace the entire file content with:

```typescript
import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  inject,
  signal,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { EMPTY, catchError } from 'rxjs';
import { AbstractControl, FormBuilder, ReactiveFormsModule, ValidationErrors, ValidatorFn } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatRadioModule } from '@angular/material/radio';
import { MatSelectModule } from '@angular/material/select';
import { ActivatedRoute } from '@angular/router';

import { mapApiError } from '../../../../core/errors/api-error.mapper';
import { ApiErrorSummary } from '../../../../shared/forms/api-error-summary/api-error-summary';
import { PageHeader } from '../../../../shared/components/page-header/page-header';
import {
  AcceptSuggestionResult,
  AiGenerationResult,
  AiSuggestionStatus,
  AiSuggestionUiState,
  ProblemAssistRequest,
  ProblemSummarySuggestionPayload,
} from '../../ai.models';
import { AiApiService } from '../../data-access/ai-api.service';
import { AiSuggestionCard, AiSuggestionAcceptEvent, AiSuggestionRejectEvent } from '../../components/ai-suggestion-card/ai-suggestion-card';
import { ProblemsApiService } from '../../../problems/problems-api.service';
import { ProblemListItem } from '../../../problems/problems.models';

const requireProblemIdOrText: ValidatorFn = (control: AbstractControl): ValidationErrors | null => {
  const problemId = control.get('problemId')?.value?.trim();
  const text = control.get('text')?.value?.trim();
  if (!problemId && !text) {
    return { requireProblemIdOrText: true };
  }
  return null;
};

@Component({
  selector: 'app-problem-assist-page',
  imports: [
    ApiErrorSummary,
    AiSuggestionCard,
    MatButtonModule,
    MatFormFieldModule,
    MatIconModule,
    MatInputModule,
    MatProgressSpinnerModule,
    MatRadioModule,
    MatSelectModule,
    PageHeader,
    ReactiveFormsModule,
  ],
  templateUrl: './problem-assist-page.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ProblemAssistPage {
  private readonly aiApi = inject(AiApiService);
  private readonly fb = inject(FormBuilder);
  private readonly destroyRef = inject(DestroyRef);
  private readonly problemsApi = inject(ProblemsApiService);
  private readonly route = inject(ActivatedRoute);

  readonly problems = signal<readonly ProblemListItem[]>([]);
  readonly submitting = signal(false);
  readonly sessionError = signal<ReturnType<typeof mapApiError> | null>(null);
  readonly result = signal<AiGenerationResult | null>(null);
  readonly suggestionStates = signal<AiSuggestionUiState[]>([]);
  readonly followUpAnswers = signal<Record<number, string>>({});

  readonly form = this.fb.group(
    {
      inputMode: ['text'],
      problemId: [''],
      text: [''],
    },
    { validators: requireProblemIdOrText },
  );

  constructor() {
    this.problemsApi
      .list({ pageSize: 100 })
      .pipe(
        takeUntilDestroyed(this.destroyRef),
        catchError(() => EMPTY),
      )
      .subscribe((page) => this.problems.set(page.items));

    const problemId = this.route.snapshot.queryParamMap.get('problemId');
    if (problemId) {
      this.form.patchValue({ inputMode: 'problem', problemId });
    }
  }

  get warnings(): readonly string[] {
    return this.result()?.warnings ?? [];
  }

  problemSummaryPayload(state: AiSuggestionUiState): ProblemSummarySuggestionPayload | null {
    if (state.suggestion.suggestionType !== 'problem_summary') return null;
    const p = state.suggestion.payload;
    if (p && typeof p === 'object' && !Array.isArray(p)) {
      return p as ProblemSummarySuggestionPayload;
    }
    return null;
  }

  currentSummaryPayload(): ProblemSummarySuggestionPayload | null {
    const state = this.suggestionStates().find(
      (s) => s.suggestion.suggestionType === 'problem_summary',
    );
    return state ? this.problemSummaryPayload(state) : null;
  }

  setAnswer(index: number, value: string): void {
    this.followUpAnswers.update((a) => ({ ...a, [index]: value }));
  }

  submit(): void {
    if (this.form.invalid || this.submitting()) return;

    const { inputMode, problemId, text } = this.form.getRawValue();
    const request: ProblemAssistRequest =
      inputMode === 'problem'
        ? { problemId: problemId?.trim() || undefined }
        : { text: text?.trim() || undefined };

    this.followUpAnswers.set({});
    this.callProblemAssist(request);
  }

  submitFollowUp(): void {
    if (this.submitting()) return;

    const summary = this.currentSummaryPayload();
    const questions = summary?.followUpQuestions ?? [];
    const answers = this.followUpAnswers();

    const followUpAnswers = questions
      .map((q, i) => ({ question: q.text, answer: answers[i] ?? '' }))
      .filter((a) => a.answer.length > 0);

    const { inputMode, problemId, text } = this.form.getRawValue();
    const base: ProblemAssistRequest =
      inputMode === 'problem'
        ? { problemId: problemId?.trim() || undefined }
        : { text: text?.trim() || undefined };

    this.followUpAnswers.set({});
    this.callProblemAssist({ ...base, followUpAnswers });
  }

  onAccept(event: AiSuggestionAcceptEvent): void {
    this.updateState(event.suggestionId, { status: 'accepting', error: null });

    const request = event.editedPayload !== undefined ? { editedPayload: event.editedPayload } : {};

    this.aiApi
      .acceptSuggestion(event.suggestionId, request)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (res: AcceptSuggestionResult) => {
          this.updateState(event.suggestionId, { status: 'accepted', acceptResult: res, error: null });
        },
        error: (err: unknown) => {
          this.updateState(event.suggestionId, { status: 'error', error: err });
        },
      });
  }

  onReject(event: AiSuggestionRejectEvent): void {
    this.updateState(event.suggestionId, { status: 'rejecting', error: null });

    this.aiApi
      .rejectSuggestion(event.suggestionId)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => {
          this.updateState(event.suggestionId, { status: 'rejected', error: null });
        },
        error: (err: unknown) => {
          this.updateState(event.suggestionId, { status: 'error', error: err });
        },
      });
  }

  private callProblemAssist(request: ProblemAssistRequest): void {
    this.submitting.set(true);
    this.sessionError.set(null);
    this.result.set(null);
    this.suggestionStates.set([]);

    this.aiApi
      .problemAssist(request)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (res) => {
          this.result.set(res);
          this.suggestionStates.set(
            res.suggestions.map((s) => ({
              suggestion: s,
              status: 'unaccepted' as AiSuggestionStatus,
              error: null,
              acceptResult: null,
              editedPayload: null,
            })),
          );
          this.submitting.set(false);
        },
        error: (err: unknown) => {
          this.sessionError.set(mapApiError(err));
          this.submitting.set(false);
        },
      });
  }

  private updateState(
    suggestionId: string,
    patch: Partial<Omit<AiSuggestionUiState, 'suggestion' | 'editedPayload'>>,
  ): void {
    this.suggestionStates.update((states) =>
      states.map((s) => (s.suggestion.id === suggestionId ? { ...s, ...patch } : s)),
    );
  }
}
```

- [ ] **Step 4: Update `problem-assist-page.html`**

Replace the `@if (summary.followUpQuestions && ...)` section (lines 96–105) with:

```html
      @if (summary.followUpQuestions && summary.followUpQuestions.length > 0) {
        <div class="ai-problem-summary__section">
          <h3>Уточняващи въпроси</h3>
          <p class="ai-problem-summary__followup-hint">
            Отговорете на въпросите и натиснете „Прецизирай анализа" за по-конкретен резултат.
          </p>

          @for (q of summary.followUpQuestions; track q.text; let i = $index) {
            <div class="ai-problem-summary__followup-item">
              <p class="ai-problem-summary__followup-question">{{ q.text }}</p>

              @if (q.type === 'yes_no') {
                <mat-radio-group
                  [value]="followUpAnswers()[i] ?? null"
                  (change)="setAnswer(i, $event.value)"
                  [attr.aria-label]="q.text"
                >
                  <mat-radio-button value="да">Да</mat-radio-button>
                  <mat-radio-button value="не">Не</mat-radio-button>
                  <mat-radio-button value="не знам">Не знам</mat-radio-button>
                </mat-radio-group>
              } @else {
                <mat-form-field appearance="outline" class="ai-page__field">
                  <textarea
                    matInput
                    rows="2"
                    [value]="followUpAnswers()[i] ?? ''"
                    (input)="setAnswer(i, $event.target.value)"
                    [attr.aria-label]="q.text"
                    placeholder="Отговор (незадължително)"
                  ></textarea>
                </mat-form-field>
              }
            </div>
          }

          <div class="ai-page__actions">
            <button mat-flat-button color="primary" (click)="submitFollowUp()" [disabled]="submitting()">
              @if (submitting()) {
                <mat-spinner diameter="18" />
                Анализирам…
              } @else {
                Прецизирай анализа
              }
            </button>
          </div>
        </div>
      }
```

The full section to replace starts at the old `@if (summary.followUpQuestions...` and ends at the closing `}` of that block. The `@if (summary)` outer block and the `app-ai-suggestion-card` fallback below it remain unchanged.

- [ ] **Step 5: Run tests**

```bash
cd /home/yordan/dev/garden/frontend && npm test -- --run 2>&1 | grep -E "FAIL|PASS|problem-assist" | tail -30
```

Expected: ALL tests pass, including the 7 new ones.

- [ ] **Step 6: Run typecheck**

```bash
cd /home/yordan/dev/garden/frontend && npm run typecheck 2>&1 | head -20
```

Expected: No errors.

- [ ] **Step 7: Commit**

```bash
cd /home/yordan/dev/garden && git add \
  frontend/src/app/features/ai/pages/problem-assist-page/problem-assist-page.ts \
  frontend/src/app/features/ai/pages/problem-assist-page/problem-assist-page.html \
  frontend/src/app/features/ai/pages/problem-assist-page/problem-assist-page.spec.ts
git commit -m "feat(ai): typed follow-up question inputs and Прецизирай анализа button in ProblemAssistPage"
```

---

## Final verification

- [ ] Run full backend suite:
  ```bash
  cd /home/yordan/dev/garden/backend && npm test -- --no-file-parallelism 2>&1 | tail -10
  ```

- [ ] Run full frontend suite:
  ```bash
  cd /home/yordan/dev/garden/frontend && npm test -- --run 2>&1 | tail -10
  ```

- [ ] Run both typechecks:
  ```bash
  cd /home/yordan/dev/garden/backend && npm run typecheck && cd ../frontend && npm run typecheck
  ```

Expected: All green.
