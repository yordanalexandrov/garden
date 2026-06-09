import type { Selectable } from "kysely";

import type { AiSessionsTable, AiSuggestionsTable, JsonValue } from "../../db/database.types.js";
import type { DbHandle } from "../../db/transaction.js";
import type { UUID } from "../auth/auth.types.js";
import type {
  AddAiSuggestionInput,
  AiRepository,
  AiSession,
  AiSessionStatus,
  AiSuggestion,
  AiSuggestionType,
  CreateAiSessionInput
} from "./ai.types.js";

const AI_SESSION_COLUMNS = [
  "id",
  "account_id",
  "kind",
  "input_mode",
  "status",
  "raw_input_text",
  "related_entity_type",
  "related_entity_id",
  "created_at",
  "updated_at"
] as const;

const AI_SUGGESTION_COLUMNS = [
  "id",
  "ai_session_id",
  "suggestion_type",
  "payload",
  "accepted",
  "accepted_at",
  "created_at"
] as const;

type SelectedAiSession = Pick<Selectable<AiSessionsTable>, (typeof AI_SESSION_COLUMNS)[number]>;
type SelectedAiSuggestion = Pick<Selectable<AiSuggestionsTable>, (typeof AI_SUGGESTION_COLUMNS)[number]>;

export class KyselyAiRepository implements AiRepository {
  constructor(private readonly dbHandle: DbHandle) {}

  async createSession(input: CreateAiSessionInput, db: DbHandle = this.dbHandle): Promise<AiSession> {
    const row = await db.db
      .insertInto("ai_sessions")
      .values({
        account_id: input.accountId,
        kind: input.kind,
        input_mode: input.inputMode,
        status: input.status,
        raw_input_text: input.rawInputText ?? null,
        related_entity_type: input.relatedEntityType ?? null,
        related_entity_id: input.relatedEntityId ?? null
      })
      .returning(AI_SESSION_COLUMNS)
      .executeTakeFirstOrThrow();

    return toAiSession(row);
  }

  async updateSessionStatus(sessionId: UUID, status: AiSessionStatus, db: DbHandle = this.dbHandle): Promise<AiSession | null> {
    const row = await db.db
      .updateTable("ai_sessions")
      .set({ status })
      .where("id", "=", sessionId)
      .returning(AI_SESSION_COLUMNS)
      .executeTakeFirst();

    return row === undefined ? null : toAiSession(row);
  }

  async addSuggestions(sessionId: UUID, suggestions: AddAiSuggestionInput[], db: DbHandle = this.dbHandle): Promise<AiSuggestion[]> {
    if (suggestions.length === 0) {
      return [];
    }

    const rows = await db.db
      .insertInto("ai_suggestions")
      .values(
        suggestions.map((s) => ({
          ai_session_id: sessionId,
          suggestion_type: s.suggestionType,
          payload: s.payload as JsonValue
        }))
      )
      .returning(AI_SUGGESTION_COLUMNS)
      .execute();

    return rows.map(toAiSuggestion);
  }

  async findSuggestionById(accountId: UUID, suggestionId: UUID, db: DbHandle = this.dbHandle): Promise<AiSuggestion | null> {
    const row = await db.db
      .selectFrom("ai_suggestions")
      .select(AI_SUGGESTION_COLUMNS)
      .where("id", "=", suggestionId)
      .where(
        "ai_session_id",
        "in",
        db.db.selectFrom("ai_sessions").select("id").where("account_id", "=", accountId)
      )
      .executeTakeFirst();

    return row === undefined ? null : toAiSuggestion(row);
  }

  async listSessionSuggestions(accountId: UUID, sessionId: UUID, db: DbHandle = this.dbHandle): Promise<AiSuggestion[]> {
    const rows = await db.db
      .selectFrom("ai_suggestions")
      .select(AI_SUGGESTION_COLUMNS)
      .where("ai_session_id", "=", sessionId)
      .where(
        "ai_session_id",
        "in",
        db.db.selectFrom("ai_sessions").select("id").where("account_id", "=", accountId)
      )
      .orderBy("created_at", "asc")
      .execute();

    return rows.map(toAiSuggestion);
  }

  async markAccepted(suggestionId: UUID, db: DbHandle = this.dbHandle): Promise<AiSuggestion | null> {
    const row = await db.db
      .updateTable("ai_suggestions")
      .set({ accepted: true, accepted_at: new Date() })
      .where("id", "=", suggestionId)
      .where("accepted", "is", null)
      .returning(AI_SUGGESTION_COLUMNS)
      .executeTakeFirst();

    return row === undefined ? null : toAiSuggestion(row);
  }

  async markRejected(suggestionId: UUID, db: DbHandle = this.dbHandle): Promise<AiSuggestion | null> {
    const row = await db.db
      .updateTable("ai_suggestions")
      .set({ accepted: false })
      .where("id", "=", suggestionId)
      .returning(AI_SUGGESTION_COLUMNS)
      .executeTakeFirst();

    return row === undefined ? null : toAiSuggestion(row);
  }
}

function toAiSession(row: SelectedAiSession): AiSession {
  return {
    id: row.id,
    accountId: row.account_id,
    kind: row.kind as AiSession["kind"],
    inputMode: row.input_mode as AiSession["inputMode"],
    status: row.status as AiSession["status"],
    rawInputText: row.raw_input_text,
    relatedEntityType: row.related_entity_type,
    relatedEntityId: row.related_entity_id,
    createdAt: row.created_at,
    updatedAt: row.updated_at
  };
}

function toAiSuggestion(row: SelectedAiSuggestion): AiSuggestion {
  return {
    id: row.id,
    aiSessionId: row.ai_session_id,
    suggestionType: row.suggestion_type as AiSuggestionType,
    payload: row.payload,
    accepted: row.accepted,
    acceptedAt: row.accepted_at,
    createdAt: row.created_at
  };
}
