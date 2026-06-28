import { beforeEach, describe, expect, it, vi } from "vitest";

import type { AiPort } from "../../src/integrations/ai/ai.port.js";
import type { StoragePort } from "../../src/modules/files/storage.port.js";
import { StorageProviderError } from "../../src/modules/files/storage.port.js";
import type { ProblemsRepository, ProblemDetailRecord } from "../../src/modules/problems/problems.types.js";
import type { AiRepository, AiSession, AiSuggestion } from "../../src/modules/ai/ai.types.js";
import { AiService } from "../../src/modules/ai/ai.service.js";
import type { AuthenticatedActor } from "../../src/modules/auth/auth.types.js";

// Minimal stubs — only the methods exercised by assistProblem
function makeAiRepository(): AiRepository {
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
  return {
    createSession: vi.fn().mockResolvedValue(session),
    addSuggestions: vi.fn().mockResolvedValue([suggestion]),
    updateSessionStatus: vi.fn(),
    findSuggestionById: vi.fn(),
    listSessionSuggestions: vi.fn(),
    markAccepted: vi.fn(),
    markRejected: vi.fn(),
  } as unknown as AiRepository;
}

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
  let aiRepository: AiRepository;
  let aiPort: AiPort;
  let problemsRepository: ProblemsRepository;
  let storagePort: StoragePort;

  // Minimal no-op stubs for unused constructor args
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const noop: any = {};

  beforeEach(() => {
    aiRepository = makeAiRepository();
    aiPort = { assistProblem: vi.fn().mockResolvedValue({ suggestions: [] }) } as unknown as AiPort;
    problemsRepository = { getDetail: vi.fn() } as unknown as ProblemsRepository;
    storagePort = { getSignedUrl: vi.fn() } as unknown as StoragePort;
  });

  function makeService(storage?: StoragePort): AiService {
    return new AiService(
      aiRepository,
      aiPort,
      noop, // productsService
      noop, // bedsRepository
      noop, // plantsRepository
      noop, // dbClient
      undefined, // auditService
      problemsRepository,
      storage,
    );
  }

  it("calls getSignedUrl for each photo and passes URLs to aiPort.assistProblem", async () => {
    const keys = ["problems/acct/prob/photo0.jpg", "problems/acct/prob/photo1.jpg"];
    vi.mocked(problemsRepository.getDetail).mockResolvedValue(makeProblemDetail(keys));
    vi.mocked(storagePort.getSignedUrl)
      .mockResolvedValueOnce("https://storage.test/signed/photo0")
      .mockResolvedValueOnce("https://storage.test/signed/photo1");

    const service = makeService(storagePort);
    await service.assistProblem(ACTOR, { problemId: PROBLEM_ID });

    expect(storagePort.getSignedUrl).toHaveBeenCalledTimes(2);
    expect(storagePort.getSignedUrl).toHaveBeenCalledWith({ storageKey: keys[0], expiresInSeconds: 300 });
    expect(storagePort.getSignedUrl).toHaveBeenCalledWith({ storageKey: keys[1], expiresInSeconds: 300 });

    expect(aiPort.assistProblem).toHaveBeenCalledWith(
      expect.objectContaining({
        photoUrls: ["https://storage.test/signed/photo0", "https://storage.test/signed/photo1"],
      }),
    );
  });

  it("skips failed signed URL and passes only successful ones (Promise.allSettled)", async () => {
    const keys = ["problems/acct/prob/ok.jpg", "problems/acct/prob/fail.jpg", "problems/acct/prob/ok2.jpg"];
    vi.mocked(problemsRepository.getDetail).mockResolvedValue(makeProblemDetail(keys));
    vi.mocked(storagePort.getSignedUrl)
      .mockResolvedValueOnce("https://storage.test/signed/ok")
      .mockRejectedValueOnce(new StorageProviderError("signed URL failed"))
      .mockResolvedValueOnce("https://storage.test/signed/ok2");

    const service = makeService(storagePort);
    await service.assistProblem(ACTOR, { problemId: PROBLEM_ID });

    expect(storagePort.getSignedUrl).toHaveBeenCalledTimes(3);
    expect(aiPort.assistProblem).toHaveBeenCalledWith(
      expect.objectContaining({
        photoUrls: ["https://storage.test/signed/ok", "https://storage.test/signed/ok2"],
      }),
    );
  });

  it("omits photoUrls from aiPort call when storagePort is undefined", async () => {
    const keys = ["problems/acct/prob/photo0.jpg"];
    vi.mocked(problemsRepository.getDetail).mockResolvedValue(makeProblemDetail(keys));

    const service = makeService(undefined);
    await service.assistProblem(ACTOR, { problemId: PROBLEM_ID });

    expect(aiPort.assistProblem).toHaveBeenCalledWith(
      expect.not.objectContaining({ photoUrls: expect.anything() }),
    );
  });

  it("omits photoUrls from aiPort call when problem has no photos", async () => {
    vi.mocked(problemsRepository.getDetail).mockResolvedValue(makeProblemDetail([]));

    const service = makeService(storagePort);
    await service.assistProblem(ACTOR, { problemId: PROBLEM_ID });

    expect(storagePort.getSignedUrl).not.toHaveBeenCalled();
    expect(aiPort.assistProblem).toHaveBeenCalledWith(
      expect.not.objectContaining({ photoUrls: expect.anything() }),
    );
  });
});
