import { beforeEach, describe, expect, it, vi } from "vitest";

import type { AiPort } from "../../src/integrations/ai/ai.port.js";
import type { StoragePort } from "../../src/modules/files/storage.port.js";
import { StorageProviderError } from "../../src/modules/files/storage.port.js";
import type { ProblemsRepository, ProblemDetailRecord } from "../../src/modules/problems/problems.types.js";
import type { AiRepository, AiSession, AiSuggestion } from "../../src/modules/ai/ai.types.js";
import { AiService } from "../../src/modules/ai/ai.service.js";
import { createAuthenticatedActor } from "../../src/modules/auth/auth.types.js";
import { AppError } from "../../src/shared/errors/app-error.js";

function makeProblemDetail(photoKeys: string[]): ProblemDetailRecord {
  return {
    id: "prob-0000-0000-0000-000000000001",
    type: "problem",
    placeId: "plce-0000-0000-0000-000000000001",
    targetType: "bed",
    targetId: "bed-00000-0000-0000-000000000001",
    title: "Yellow spots",
    description: "Leaves turning yellow",
    category: "fungus",
    severity: "medium",
    status: "open",
    observedAt: new Date("2026-06-01"),
    resolvedAt: null,
    linkedActivityId: null,
    targetLabel: "Bed A",
    photos: photoKeys.map((key, idx) => ({
      id: `photo-${idx}`,
      storageKey: key,
      originalFilename: `photo${idx}.jpg`,
      mimeType: "image/jpeg",
      fileSizeBytes: 12345,
      widthPx: null,
      heightPx: null,
      createdAt: new Date(),
    })),
    observations: [],
    linkedActivity: null,
  };
}

const ACTOR = createAuthenticatedActor({
  userId: "user-0000-0000-0000-000000000001",
  accountId: "acct-0000-0000-0000-000000000001",
  email: "test@example.test",
  provider: "test",
});

const PROBLEM_ID = "prob-0000-0000-0000-000000000001";

describe("AiService.assistProblem – photo signed URL fetching", () => {
  // Capture mock functions as plain variables to avoid unbound-method lint errors.
  let createSessionMock: ReturnType<typeof vi.fn>;
  let addSuggestionsMock: ReturnType<typeof vi.fn>;
  let getDetailMock: ReturnType<typeof vi.fn>;
  let assistProblemMock: ReturnType<typeof vi.fn>;
  let getSignedUrlMock: ReturnType<typeof vi.fn>;

  let aiRepository: AiRepository;
  let aiPort: AiPort;
  let problemsRepository: ProblemsRepository;
  let storagePort: StoragePort;

  beforeEach(() => {
    const session: AiSession = {
      id: "sess-0000-0000-0000-000000000001",
      accountId: "acct-0000-0000-0000-000000000001",
      kind: "problem_assist",
      inputMode: "text",
      status: "completed",
      rawInputText: null,
      relatedEntityType: null,
      relatedEntityId: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    const suggestion: AiSuggestion = {
      id: "sugg-0000-0000-0000-000000000001",
      aiSessionId: session.id,
      suggestionType: "problem_summary",
      payload: { summary: "test" },
      accepted: null,
      acceptedAt: null,
      createdAt: new Date(),
    };

    createSessionMock = vi.fn().mockResolvedValue(session);
    addSuggestionsMock = vi.fn().mockResolvedValue([suggestion]);
    getDetailMock = vi.fn();
    assistProblemMock = vi.fn().mockResolvedValue({ suggestions: [] });
    getSignedUrlMock = vi.fn();

    aiRepository = {
      createSession: createSessionMock,
      addSuggestions: addSuggestionsMock,
      updateSessionStatus: vi.fn(),
      findSuggestionById: vi.fn(),
      listSessionSuggestions: vi.fn(),
      markAccepted: vi.fn(),
      markRejected: vi.fn(),
    } as unknown as AiRepository;

    aiPort = { assistProblem: assistProblemMock } as unknown as AiPort;
    problemsRepository = { getDetail: getDetailMock } as unknown as ProblemsRepository;
    storagePort = { getSignedUrl: getSignedUrlMock } as unknown as StoragePort;
  });

  function makeService(storage?: StoragePort): AiService {
    // productsService, bedsRepository, plantsRepository, dbClient are not exercised by assistProblem.
    // eslint-disable-next-line @typescript-eslint/no-explicit-any, @typescript-eslint/no-unsafe-argument, @typescript-eslint/no-unsafe-assignment
    const unused = {} as any;
    return new AiService(
      aiRepository,
      aiPort,
      // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
      unused, // productsService
      // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
      unused, // bedsRepository
      // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
      unused, // plantsRepository
      // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
      unused, // dbClient
      undefined, // auditService
      problemsRepository,
      storage,
    );
  }

  it("calls getSignedUrl for each photo and passes URLs to aiPort.assistProblem", async () => {
    const keys = ["problems/acct/prob/photo0.jpg", "problems/acct/prob/photo1.jpg"];
    getDetailMock.mockResolvedValue(makeProblemDetail(keys));
    getSignedUrlMock
      .mockResolvedValueOnce("https://storage.test/signed/photo0")
      .mockResolvedValueOnce("https://storage.test/signed/photo1");

    const service = makeService(storagePort);
    await service.assistProblem(ACTOR, { problemId: PROBLEM_ID });

    expect(getSignedUrlMock).toHaveBeenCalledTimes(2);
    expect(getSignedUrlMock).toHaveBeenCalledWith({ storageKey: keys[0], expiresInSeconds: 300 });
    expect(getSignedUrlMock).toHaveBeenCalledWith({ storageKey: keys[1], expiresInSeconds: 300 });
    expect(assistProblemMock).toHaveBeenCalledWith(
      expect.objectContaining({
        photoUrls: ["https://storage.test/signed/photo0", "https://storage.test/signed/photo1"],
      }),
    );
  });

  it("skips failed signed URL and passes only successful ones (Promise.allSettled)", async () => {
    const keys = ["problems/acct/prob/ok.jpg", "problems/acct/prob/fail.jpg", "problems/acct/prob/ok2.jpg"];
    getDetailMock.mockResolvedValue(makeProblemDetail(keys));
    getSignedUrlMock
      .mockResolvedValueOnce("https://storage.test/signed/ok")
      .mockRejectedValueOnce(new StorageProviderError("signed URL failed"))
      .mockResolvedValueOnce("https://storage.test/signed/ok2");

    const service = makeService(storagePort);
    await service.assistProblem(ACTOR, { problemId: PROBLEM_ID });

    expect(getSignedUrlMock).toHaveBeenCalledTimes(3);
    expect(assistProblemMock).toHaveBeenCalledWith(
      expect.objectContaining({
        photoUrls: ["https://storage.test/signed/ok", "https://storage.test/signed/ok2"],
      }),
    );
  });

  it("omits photoUrls from aiPort call when storagePort is undefined", async () => {
    getDetailMock.mockResolvedValue(makeProblemDetail(["problems/acct/prob/photo0.jpg"]));

    const service = makeService(undefined);
    await service.assistProblem(ACTOR, { problemId: PROBLEM_ID });

    // photoUrls should not be present in the call args at all
    const callArg = assistProblemMock.mock.calls[0]?.[0] as Record<string, unknown>;
    expect(callArg).not.toHaveProperty("photoUrls");
  });

  it("omits photoUrls from aiPort call when problem has no photos", async () => {
    getDetailMock.mockResolvedValue(makeProblemDetail([]));

    const service = makeService(storagePort);
    await service.assistProblem(ACTOR, { problemId: PROBLEM_ID });

    expect(getSignedUrlMock).not.toHaveBeenCalled();
    const callArg = assistProblemMock.mock.calls[0]?.[0] as Record<string, unknown>;
    expect(callArg).not.toHaveProperty("photoUrls");
  });
});

// ---------------------------------------------------------------------------
// AiService.acceptSuggestion – problem_summary
// ---------------------------------------------------------------------------

const ACCEPT_ACTOR = createAuthenticatedActor({
  userId: "user-0000-0000-0000-000000000001",
  accountId: "acct-0000-0000-0000-000000000001",
  email: "test@example.test",
  provider: "test",
});

/** Builds a minimal Kysely-style selectFrom chain whose executeTakeFirst resolves to `result`. */
function makeSelectChain(result: { id: string } | undefined) {
  const chain: Record<string, unknown> = {
    select: () => chain,
    where: () => chain,
    executeTakeFirst: vi.fn().mockResolvedValue(result),
  };
  return chain;
}

describe("AiService.acceptSuggestion – problem_summary", () => {
  let createObservationMock: ReturnType<typeof vi.fn>;
  let updateMock: ReturnType<typeof vi.fn>;
  let findSuggestionMock: ReturnType<typeof vi.fn>;
  let markAcceptedMock: ReturnType<typeof vi.fn>;
  let findSessionMock: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    createObservationMock = vi.fn().mockResolvedValue({
      id: "obs-001",
      problemId: "prob-001",
      summary: "Yellow spots",
      recommendation: "Use copper",
      source: "ai",
      createdAt: new Date(),
      updatedAt: new Date(),
    });
    updateMock = vi.fn().mockResolvedValue({ id: "prob-001", status: "open", resolvedAt: null });
    findSuggestionMock = vi.fn().mockResolvedValue({
      id: "sugg-001",
      aiSessionId: "sess-001",
      suggestionType: "problem_summary",
      payload: { summary: "Yellow spots", recommendation: "Use copper" },
      accepted: null,
      acceptedAt: null,
      createdAt: new Date(),
    } satisfies AiSuggestion);
    markAcceptedMock = vi.fn().mockResolvedValue({
      id: "sugg-001",
      aiSessionId: "sess-001",
      suggestionType: "problem_summary",
      payload: {},
      accepted: true,
      acceptedAt: new Date(),
      createdAt: new Date(),
    } satisfies AiSuggestion);
    findSessionMock = vi.fn().mockResolvedValue({
      id: "sess-001",
      accountId: "acct-0000-0000-0000-000000000001",
      kind: "problem_assist",
      inputMode: "text",
      status: "completed",
      rawInputText: null,
      relatedEntityType: "problem",
      relatedEntityId: "prob-001",
      createdAt: new Date(),
      updatedAt: new Date(),
    } satisfies AiSession);
  });

  /**
   * Build a service instance.
   * `problemExistsForAccount` controls whether the db mock reports the problem as
   * belonging to the actor's account (default: true).
   */
  function makeService(problemExistsForAccount = true): AiService {
    const chain = makeSelectChain(problemExistsForAccount ? { id: "prob-001" } : undefined);
    const mockDb = { selectFrom: () => chain };

    const aiRepository: AiRepository = {
      createSession: vi.fn(),
      updateSessionStatus: vi.fn(),
      addSuggestions: vi.fn(),
      findSuggestionById: findSuggestionMock,
      findSessionById: findSessionMock,
      listSessionSuggestions: vi.fn(),
      markAccepted: markAcceptedMock,
      markRejected: vi.fn(),
    };

    const problemsRepository: ProblemsRepository = {
      create: vi.fn(),
      list: vi.fn(),
      getDetail: vi.fn(),
      update: updateMock,
      findPlace: vi.fn(),
      findTarget: vi.fn(),
      findLinkedActivity: vi.fn(),
      findProblemForPhotoUpload: vi.fn(),
      createPhotoMetadata: vi.fn(),
      createObservation: createObservationMock,
      listObservations: vi.fn(),
      updateObservation: vi.fn(),
      deleteObservation: vi.fn(),
    };

    const dbClient = {
      db: mockDb as unknown as never,
      transaction: vi.fn().mockImplementation(async (fn: (t: unknown) => Promise<unknown>) => fn({})),
    };

    // eslint-disable-next-line @typescript-eslint/no-explicit-any, @typescript-eslint/no-unsafe-argument
    const unused = {} as any;
    return new AiService(
      aiRepository,
      unused as AiPort,
      unused, // productsService
      unused, // bedsRepository
      unused, // plantsRepository
      dbClient as never,
      undefined, // auditService
      problemsRepository,
    );
  }

  it("creates observation using problemId resolved from session relatedEntityId", async () => {
    const service = makeService();
    const result = await service.acceptSuggestion(ACCEPT_ACTOR, "sugg-001", undefined, {});

    expect(findSessionMock).toHaveBeenCalledWith("sess-001");
    expect(createObservationMock).toHaveBeenCalledWith(
      expect.objectContaining({ problemId: "prob-001", summary: "Yellow spots", source: "ai" }),
      expect.anything(),
    );
    expect(result.createdEntities).toEqual([{ entityType: "problem_observation", entityId: "obs-001" }]);
    expect(result.updatedEntities).toEqual([]);
  });

  it("updates category when acceptedCategory is given", async () => {
    const service = makeService();
    const result = await service.acceptSuggestion(ACCEPT_ACTOR, "sugg-001", undefined, { acceptedCategory: "fungus" });

    expect(updateMock).toHaveBeenCalledWith(
      ACCEPT_ACTOR.accountId,
      "prob-001",
      expect.objectContaining({ category: "fungus" }),
      expect.anything(),
    );
    expect(result.updatedEntities).toEqual([{ entityType: "problem", entityId: "prob-001" }]);
  });

  it("does NOT create observation and does NOT throw when no problemId is available", async () => {
    findSessionMock.mockResolvedValue({
      id: "sess-001",
      accountId: "acct-0000-0000-0000-000000000001",
      kind: "problem_assist",
      inputMode: "text",
      status: "completed",
      rawInputText: null,
      relatedEntityType: null,
      relatedEntityId: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    } satisfies AiSession);

    const service = makeService();
    const result = await service.acceptSuggestion(ACCEPT_ACTOR, "sugg-001", undefined, {});

    expect(createObservationMock).not.toHaveBeenCalled();
    expect(result.createdEntities).toEqual([]);
    expect(result.updatedEntities).toEqual([]);
  });

  it("uses context.problemId directly and skips session lookup", async () => {
    const service = makeService();
    // Provide problemId explicitly in context — findSessionById should NOT be called
    await service.acceptSuggestion(ACCEPT_ACTOR, "sugg-001", undefined, { problemId: "prob-001" });

    expect(findSessionMock).not.toHaveBeenCalled();
    expect(createObservationMock).toHaveBeenCalledWith(
      expect.objectContaining({ problemId: "prob-001" }),
      expect.anything(),
    );
  });

  it("throws NOT_FOUND when problem belongs to a foreign account", async () => {
    const service = makeService(false); // db returns undefined → problem not found for this account

    await expect(
      service.acceptSuggestion(ACCEPT_ACTOR, "sugg-001", undefined, {}),
    ).rejects.toThrow(AppError);

    await expect(
      service.acceptSuggestion(ACCEPT_ACTOR, "sugg-001", undefined, {}),
    ).rejects.toMatchObject({ code: "NOT_FOUND" });

    expect(createObservationMock).not.toHaveBeenCalled();
  });
});
