# Problem Assist — Follow-up Questions UI + Vision Photos

**Date:** 2026-06-28  
**Status:** Approved

## Summary

Two improvements to the Problem Assist feature:
1. Follow-up questions returned by AI gain typed input fields (yes/no or free text) so users can answer them, with a "Refine analysis" button that re-submits to the AI.
2. Problem photos are sent as image content to OpenAI (vision), not just a count.

## Scope

- Backend: `ai.types.ts`, `openai-ai.adapter.ts`, `ai.service.ts`, `ai.routes.ts`, `ai.validation.ts`
- Frontend: `ai.models.ts`, `problem-assist-page.ts`, `problem-assist-page.html`
- New dependency: `StoragePort` injected into `AiService`

---

## 1. Data Types

### Backend (`ai.types.ts`)

```typescript
// New
export type FollowUpQuestion = {
  text: string;
  type: 'yes_no' | 'free_text';
};

export type FollowUpAnswer = {
  question: string;
  answer: string;
};

// Updated
export type NormalizedProblemSummaryPayload = {
  summary: string;
  possibleCategories: string[];
  followUpQuestions: FollowUpQuestion[];   // was: unknown[]
};

// Updated
export type AssistProblemInput = {
  problemId?: string;
  text?: string;
  problemContext?: ProblemContextInput;
  photoUrls?: string[];          // new — signed URLs for AI vision
  followUpAnswers?: FollowUpAnswer[];  // new — user answers on re-submit
};
```

### Frontend (`ai.models.ts`)

```typescript
export interface FollowUpQuestion {
  readonly text: string;
  readonly type: 'yes_no' | 'free_text';
}

export interface FollowUpAnswer {
  readonly question: string;
  readonly answer: string;
}

// Updated
export interface ProblemSummarySuggestionPayload {
  readonly summary?: string;
  readonly possibleCategories?: readonly string[];
  readonly followUpQuestions?: readonly FollowUpQuestion[];  // was string[]
}

// Updated
export interface ProblemAssistRequest {
  readonly problemId?: string;
  readonly text?: string;
  readonly followUpAnswers?: readonly FollowUpAnswer[];  // new
}
```

---

## 2. OpenAI Adapter (`openai-ai.adapter.ts`)

### Vision support

New private method `callJsonWithImages(systemPrompt, textContent, imageUrls)`:
```typescript
private async callJsonWithImages(
  systemPrompt: string,
  userContent: string,
  imageUrls: string[]
): Promise<Record<string, unknown>> {
  const content: OpenAI.Chat.ChatCompletionContentPart[] = [
    { type: 'text', text: userContent },
    ...imageUrls.map(url => ({
      type: 'image_url' as const,
      image_url: { url }
    }))
  ];
  // Same completion call as callJson but with multimodal content
}
```

`assistProblem()` calls `callJsonWithImages` when `input.photoUrls` is non-empty, otherwise falls back to `callJson`.

### Updated AI prompt for `assistProblem`

Follow-up questions section changes from:
```
- followUpQuestions: string[]
```
to:
```
- followUpQuestions: Array of { "text": string, "type": "yes_no" | "free_text" }
  Use "yes_no" for questions answerable with yes/no. Use "free_text" for open questions.
```

Parser updated:
```typescript
followUpQuestions: Array.isArray(raw.followUpQuestions)
  ? raw.followUpQuestions.map(q => ({
      text: typeof q?.text === 'string' ? q.text : String(q),
      type: q?.type === 'yes_no' ? 'yes_no' : 'free_text'
    }))
  : []
```

### Follow-up answers in prompt

When `input.followUpAnswers` is present and non-empty, append to `userContent`:
```
\n\nПотребителят отговори на уточняващите въпроси:
- [въпрос] → [отговор]
```

---

## 3. `AiService`

`StoragePort` added as a new optional constructor parameter (after `problemsRepository`).

In `assistProblem()`, after loading `problemContext`:
- If `problemId` is set and photos exist, get signed URLs (TTL 300s) for each photo via `storagePort.getSignedUrl()`.
- Pass `photoUrls` to `aiPort.assistProblem()`.
- Pass `followUpAnswers` from `input` to `aiPort.assistProblem()`.

Error handling: if a signed URL fetch fails, skip that photo (don't fail the whole request).

---

## 4. Backend Validation & Routes

### `ai.validation.ts`

`problemAssistBodySchema` adds:
```typescript
followUpAnswers: z.array(z.object({
  question: z.string().trim().min(1),
  answer: z.string().trim().min(1)
})).optional()
```

### `ai.routes.ts`

`/problem-assist` handler passes `followUpAnswers` from validated body to `aiService.assistProblem()`.

`createAiService()` receives `StoragePort` from route options and passes it to `AiService`.

`AiRouteOptions` adds `storage?: StoragePort`.

---

## 5. Frontend — `problem-assist-page.ts`

New state:
```typescript
readonly followUpAnswers = signal<Record<number, string>>({});

setAnswer(index: number, value: string): void {
  this.followUpAnswers.update(a => ({ ...a, [index]: value }));
}

submitFollowUp(): void {
  const summary = this.currentSummaryPayload();
  const questions = summary?.followUpQuestions ?? [];
  const answers = this.followUpAnswers();

  const followUpAnswers = questions
    .map((q, i) => ({ question: q.text, answer: answers[i] ?? '' }))
    .filter(a => a.answer.length > 0);

  const { inputMode, problemId, text } = this.form.getRawValue();
  const base = inputMode === 'problem'
    ? { problemId: problemId?.trim() || undefined }
    : { text: text?.trim() || undefined };

  // Resets states, calls problemAssist with base + followUpAnswers
  this.callProblemAssist({ ...base, followUpAnswers });
}
```

`submit()` and `submitFollowUp()` both call a shared `callProblemAssist(request)` private method to avoid duplication. `followUpAnswers` signal is reset to `{}` on each new initial submit.

Helper:
```typescript
currentSummaryPayload(): ProblemSummarySuggestionPayload | null {
  const state = this.suggestionStates().find(
    s => s.suggestion.suggestionType === 'problem_summary'
  );
  return state ? this.problemSummaryPayload(state) : null;
}
```

---

## 6. Frontend — `problem-assist-page.html`

Inside the `@if (summary)` block, replace the current follow-up `<ul>` with:

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
            aria-label="{{ q.text }}"
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

---

## 7. Testing

- Unit: `openai-ai.adapter` — typed question parsing, `callJsonWithImages` called when photoUrls provided
- Unit: `ai.service` — signed URLs fetched when problem has photos, passed to port
- Unit: `ai.service` — `followUpAnswers` forwarded to port
- Integration: `/ai/problem-assist` with `followUpAnswers` in body — valid schema accepted
- Frontend spec: follow-up section hidden when no questions; yes/no renders radio, free_text renders textarea; "Прецизирай анализа" calls `problemAssist` with followUpAnswers

---

## Constraints

- If `StoragePort` is not available in `AiService`, photos are silently skipped (count-only fallback, current behavior).
- "Не знам" answers for yes/no are included in the re-submit payload so AI knows the user is uncertain.
- Free-text answers left blank are excluded from `followUpAnswers` (filtered out).
- Signed URLs use a 300-second TTL since they are passed directly to OpenAI and consumed immediately.
- `callJson` is kept unchanged for all other AI flows; only `assistProblem` uses `callJsonWithImages`.
