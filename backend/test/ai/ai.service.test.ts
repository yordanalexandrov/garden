import { beforeEach, describe, expect, it, vi } from "vitest";

import type { AiPort } from "../../src/integrations/ai/ai.port.js";
import type { StoragePort } from "../../src/modules/files/storage.port.js";
import { StorageProviderError } from "../../src/modules/files/storage.port.js";
import type { ProblemsRepository, ProblemDetailRecord } from "../../src/modules/problems/problems.types.js";
import type { AiRepository, AiSession, AiSuggestion } from "../../src/modules/ai/ai.types.js";
import { AiService } from "../../src/modules/ai/ai.service.js";
import type { AuthenticatedActor } from "../../src/modules/auth/auth.types.js";

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
    linkedActivity: null,
  };
}

const ACTOR: AuthenticatedActor = {
  userId: "user-0000-0000-0000-000000000001",
  accountId: "acct-0000-0000-0000-000000000001",
};

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
