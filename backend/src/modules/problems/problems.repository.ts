import { sql, type Selectable, type Updateable } from "kysely";

import type { ProblemObservationsTable, ProblemPhotosTable, ProblemsTable } from "../../db/database.types.js";
import type { DbHandle } from "../../db/transaction.js";
import type { UUID } from "../auth/auth.types.js";
import type { TargetType } from "../targets/target-resolver.types.js";
import type {
  CreateObservationInput,
  CreateProblemInput,
  CreateProblemPhotoMetadataInput,
  LinkedActivityLookup,
  ListProblemsFilters,
  PaginatedProblems,
  Problem,
  ProblemDetailRecord,
  ProblemForPhotoUpload,
  ProblemObservation,
  ProblemPhotoMetadata,
  ProblemsRepository,
  ProblemTargetLookup,
  UpdateObservationInput,
  UpdateProblemInput
} from "./problems.types.js";
import type { ProblemCategory, ProblemStatus, ProblemType } from "./problems.types.js";

const PROBLEM_COLUMNS = [
  "id",
  "account_id",
  "type",
  "place_id",
  "target_type",
  "target_id",
  "title",
  "description",
  "category",
  "severity",
  "status",
  "observed_at",
  "resolved_at",
  "archived_at",
  "linked_activity_id",
  "created_at",
  "updated_at"
] as const;

type SelectedProblem = Pick<Selectable<ProblemsTable>, (typeof PROBLEM_COLUMNS)[number]>;
type SelectedProblemPhoto = Selectable<ProblemPhotosTable>;
type CountRow = { count: string | number | bigint };

export class KyselyProblemsRepository implements ProblemsRepository {
  constructor(private readonly dbHandle: DbHandle) {}

  async create(input: CreateProblemInput, db: DbHandle = this.dbHandle): Promise<Problem> {
    const row = await db.db
      .insertInto("problems")
      .values({
        account_id: input.accountId,
        type: input.type,
        place_id: input.placeId,
        target_type: input.targetType,
        target_id: input.targetId,
        title: input.title,
        description: input.description,
        category: input.category ?? null,
        severity: input.severity ?? null,
        status: input.status,
        observed_at: input.observedAt,
        linked_activity_id: input.linkedActivityId ?? null
      })
      .returning(PROBLEM_COLUMNS)
      .executeTakeFirstOrThrow();

    return toProblem(row);
  }

  async list(accountId: UUID, filters: ListProblemsFilters, db: DbHandle = this.dbHandle): Promise<PaginatedProblems> {
    let itemsQuery = db.db
      .selectFrom("problems as pr")
      .select([
        "pr.id",
        "pr.account_id",
        "pr.type",
        "pr.place_id",
        "pr.target_type",
        "pr.target_id",
        "pr.title",
        "pr.category",
        "pr.severity",
        "pr.status",
        "pr.observed_at",
        "pr.resolved_at",
        "pr.archived_at"
      ])
      .select((eb) => [
        targetLabelExpression().as("target_label"),
        eb
          .selectFrom("problem_photos as pp")
          .select(sql<string>`count(*)`.as("count"))
          .whereRef("pp.problem_id", "=", "pr.id")
          .as("photos_count")
      ])
      .where("pr.account_id", "=", accountId)
      .orderBy("pr.observed_at", "desc")
      .orderBy("pr.id", "desc")
      .limit(filters.pageSize)
      .offset((filters.page - 1) * filters.pageSize);

    let countQuery = db.db
      .selectFrom("problems as pr")
      .select(sql<string>`count(*)`.as("count"))
      .where("pr.account_id", "=", accountId);

    if (filters.placeId !== undefined) {
      itemsQuery = itemsQuery.where("pr.place_id", "=", filters.placeId);
      countQuery = countQuery.where("pr.place_id", "=", filters.placeId);
    }

    if (!filters.includeArchived) {
      itemsQuery = itemsQuery.where("pr.archived_at", "is", null);
      countQuery = countQuery.where("pr.archived_at", "is", null);
    }

    if (filters.type !== undefined) {
      itemsQuery = itemsQuery.where("pr.type", "=", filters.type);
      countQuery = countQuery.where("pr.type", "=", filters.type);
    }

    if (filters.status !== undefined) {
      itemsQuery = itemsQuery.where("pr.status", "=", filters.status);
      countQuery = countQuery.where("pr.status", "=", filters.status);
    }

    if (filters.category !== undefined) {
      itemsQuery = itemsQuery.where("pr.category", "=", filters.category);
      countQuery = countQuery.where("pr.category", "=", filters.category);
    }

    if (filters.from !== undefined) {
      itemsQuery = itemsQuery.where("pr.observed_at", ">=", filters.from);
      countQuery = countQuery.where("pr.observed_at", ">=", filters.from);
    }

    if (filters.to !== undefined) {
      itemsQuery = itemsQuery.where("pr.observed_at", "<=", filters.to);
      countQuery = countQuery.where("pr.observed_at", "<=", filters.to);
    }

    const rows = await itemsQuery.execute();
    const totalRow = await countQuery.executeTakeFirst();

    return {
      items: rows.map((row) => ({
        id: row.id,
        type: row.type as ProblemType,
        placeId: row.place_id,
        targetType: row.target_type as TargetType,
        targetId: row.target_id,
        targetLabel: row.target_label,
        title: row.title,
        category: row.category as ProblemCategory | null,
        severity: row.severity,
        status: row.status as ProblemStatus,
        observedAt: row.observed_at,
        resolvedAt: row.resolved_at,
        archivedAt: row.archived_at,
        photosCount: toCount({ count: row.photos_count ?? 0 })
      })),
      page: filters.page,
      pageSize: filters.pageSize,
      total: toCount(totalRow)
    };
  }

  async getDetail(accountId: UUID, problemId: UUID, db: DbHandle = this.dbHandle): Promise<ProblemDetailRecord | null> {
    const row = await db.db
      .selectFrom("problems as pr")
      .select([
        "pr.id",
        "pr.account_id",
        "pr.type",
        "pr.place_id",
        "pr.target_type",
        "pr.target_id",
        "pr.title",
        "pr.description",
        "pr.category",
        "pr.severity",
        "pr.status",
        "pr.observed_at",
        "pr.resolved_at",
        "pr.archived_at",
        "pr.linked_activity_id",
        "pr.created_at",
        "pr.updated_at"
      ])
      .select(() => [targetLabelExpression().as("target_label")])
      .where("pr.account_id", "=", accountId)
      .where("pr.id", "=", problemId)
      .executeTakeFirst();

    if (row === undefined) {
      return null;
    }

    const linkedActivity =
      row.linked_activity_id === null ? null : await this.findLinkedActivity(accountId, row.linked_activity_id, db);
    const photos = await this.listPhotoMetadata(row.id, db);
    const observations = await this.listObservations(row.id, db);

    return {
      ...toProblem(row),
      targetLabel: row.target_label,
      photos,
      observations,
      linkedActivity:
        linkedActivity === null
          ? null
          : {
              id: linkedActivity.id,
              type: linkedActivity.type,
              performedAt: linkedActivity.performedAt
            }
    };
  }

  async findStatus(accountId: UUID, problemId: UUID, db: DbHandle = this.dbHandle): Promise<{ status: ProblemStatus } | null> {
    const row = await db.db
      .selectFrom("problems")
      .select("status")
      .where("account_id", "=", accountId)
      .where("id", "=", problemId)
      .executeTakeFirst();

    return row === undefined ? null : { status: row.status as ProblemStatus };
  }

  async update(
    accountId: UUID,
    problemId: UUID,
    patch: UpdateProblemInput,
    db: DbHandle = this.dbHandle
  ): Promise<Problem | null> {
    const row = await db.db
      .updateTable("problems")
      .set(toProblemUpdate(patch))
      .where("account_id", "=", accountId)
      .where("id", "=", problemId)
      .returning(PROBLEM_COLUMNS)
      .executeTakeFirst();

    return row === undefined ? null : toProblem(row);
  }

  async createObservation(input: CreateObservationInput, db: DbHandle = this.dbHandle): Promise<ProblemObservation> {
    const row = await db.db
      .insertInto("problem_observations")
      .values({
        problem_id: input.problemId,
        summary: input.summary,
        recommendation: input.recommendation ?? null,
        source: input.source
      })
      .returning(["id", "problem_id", "summary", "recommendation", "source", "created_at", "updated_at"])
      .executeTakeFirstOrThrow();

    return toProblemObservation(row);
  }

  async listObservations(problemId: UUID, db: DbHandle = this.dbHandle): Promise<ProblemObservation[]> {
    const rows = await db.db
      .selectFrom("problem_observations")
      .select(["id", "problem_id", "summary", "recommendation", "source", "created_at", "updated_at"])
      .where("problem_id", "=", problemId)
      .where("archived_at", "is", null)
      .orderBy("created_at", "asc")
      .orderBy("id", "asc")
      .execute();

    return rows.map(toProblemObservation);
  }

  async updateObservation(
    problemId: UUID,
    obsId: UUID,
    patch: UpdateObservationInput,
    db: DbHandle = this.dbHandle
  ): Promise<ProblemObservation | null> {
    const update: Updateable<ProblemObservationsTable> = { updated_at: new Date() };

    if (patch.summary !== undefined) update.summary = patch.summary;
    if (patch.recommendation !== undefined) update.recommendation = patch.recommendation;

    const row = await db.db
      .updateTable("problem_observations")
      .set(update)
      .where("id", "=", obsId)
      .where("problem_id", "=", problemId)
      .where("archived_at", "is", null)
      .returning(["id", "problem_id", "summary", "recommendation", "source", "created_at", "updated_at"])
      .executeTakeFirst();

    return row === undefined ? null : toProblemObservation(row);
  }

  async archiveObservation(problemId: UUID, obsId: UUID, db: DbHandle = this.dbHandle): Promise<boolean> {
    const result = await db.db
      .updateTable("problem_observations")
      .set({ archived_at: new Date() })
      .where("id", "=", obsId)
      .where("problem_id", "=", problemId)
      .where("archived_at", "is", null)
      .executeTakeFirst();

    return (result.numUpdatedRows ?? 0n) > 0n;
  }

  async archive(accountId: UUID, problemId: UUID, db: DbHandle = this.dbHandle): Promise<boolean> {
    const result = await db.db
      .updateTable("problems")
      .set({ archived_at: new Date() })
      .where("account_id", "=", accountId)
      .where("id", "=", problemId)
      .where("archived_at", "is", null)
      .executeTakeFirst();

    return (result.numUpdatedRows ?? 0n) > 0n;
  }

  async findPlace(accountId: UUID, placeId: UUID, db: DbHandle = this.dbHandle): Promise<{ id: UUID } | null> {
    const row = await db.db
      .selectFrom("places")
      .select("id")
      .where("account_id", "=", accountId)
      .where("id", "=", placeId)
      .where("archived_at", "is", null)
      .executeTakeFirst();

    return row ?? null;
  }

  async findTarget(
    accountId: UUID,
    targetType: TargetType,
    targetId: UUID,
    db: DbHandle = this.dbHandle
  ): Promise<ProblemTargetLookup | null> {
    switch (targetType) {
      case "place":
        return this.findPlaceTarget(accountId, targetId, db);
      case "perennial":
        return this.findPerennialTarget(accountId, targetId, db);
      case "bed":
        return this.findBedTarget(accountId, targetId, db);
      case "yearly_bed_planting":
        return this.findYearlyPlantingTarget(accountId, targetId, db);
      case "persistent_bed_plant":
        return this.findPersistentBedPlantTarget(accountId, targetId, db);
    }
  }

  async findLinkedActivity(
    accountId: UUID,
    activityId: UUID,
    db: DbHandle = this.dbHandle
  ): Promise<LinkedActivityLookup | null> {
    const row = await db.db
      .selectFrom("activities")
      .select(["id", "account_id", "place_id", "type", "performed_at"])
      .where("account_id", "=", accountId)
      .where("id", "=", activityId)
      .executeTakeFirst();

    return row === undefined
      ? null
      : {
          id: row.id,
          accountId: row.account_id,
          placeId: row.place_id,
          type: row.type,
          performedAt: row.performed_at
        };
  }

  async findProblemForPhotoUpload(
    accountId: UUID,
    problemId: UUID,
    db: DbHandle = this.dbHandle
  ): Promise<ProblemForPhotoUpload | null> {
    const row = await db.db
      .selectFrom("problems")
      .select(["id", "account_id", "type", "place_id"])
      .where("account_id", "=", accountId)
      .where("id", "=", problemId)
      .executeTakeFirst();

    return row === undefined
      ? null
      : {
          id: row.id,
          accountId: row.account_id,
          type: row.type as ProblemType,
          placeId: row.place_id
        };
  }

  async createPhotoMetadata(
    input: CreateProblemPhotoMetadataInput,
    db: DbHandle = this.dbHandle
  ): Promise<ProblemPhotoMetadata> {
    const row = await db.db
      .insertInto("problem_photos")
      .values({
        id: input.id,
        problem_id: input.problemId,
        storage_key: input.storageKey,
        original_filename: input.originalFilename,
        mime_type: input.mimeType,
        file_size_bytes: input.fileSizeBytes,
        width_px: input.widthPx,
        height_px: input.heightPx
      })
      .returning(["id", "problem_id", "storage_key", "original_filename", "mime_type", "file_size_bytes", "width_px", "height_px", "created_at"])
      .executeTakeFirstOrThrow();

    return toProblemPhotoMetadata(row);
  }

  private async listPhotoMetadata(problemId: UUID, db: DbHandle): Promise<ProblemPhotoMetadata[]> {
    const rows = await db.db
      .selectFrom("problem_photos")
      .select(["id", "problem_id", "storage_key", "original_filename", "mime_type", "file_size_bytes", "width_px", "height_px", "created_at"])
      .where("problem_id", "=", problemId)
      .orderBy("created_at", "asc")
      .orderBy("id", "asc")
      .execute();

    return rows.map(toProblemPhotoMetadata);
  }

  private async findPlaceTarget(accountId: UUID, targetId: UUID, db: DbHandle): Promise<ProblemTargetLookup | null> {
    const row = await db.db
      .selectFrom("places")
      .select(["id", "name"])
      .where("account_id", "=", accountId)
      .where("id", "=", targetId)
      .where("archived_at", "is", null)
      .executeTakeFirst();

    return row === undefined ? null : { targetType: "place", targetId: row.id, label: row.name, placeId: row.id };
  }

  private async findPerennialTarget(accountId: UUID, targetId: UUID, db: DbHandle): Promise<ProblemTargetLookup | null> {
    const row = await db.db
      .selectFrom("perennials")
      .leftJoin("plants", (join) =>
        join.onRef("plants.id", "=", "perennials.plant_id").onRef("plants.account_id", "=", "perennials.account_id")
      )
      .select(["perennials.id", "perennials.place_id", "perennials.label", "plants.common_name", "plants.variety"])
      .where("perennials.account_id", "=", accountId)
      .where("perennials.id", "=", targetId)
      .where("perennials.archived_at", "is", null)
      .where("perennials.status", "=", "active")
      .executeTakeFirst();

    return row === undefined
      ? null
      : {
          targetType: "perennial",
          targetId: row.id,
          label: row.label ?? formatPlantName(row.common_name, row.variety),
          placeId: row.place_id
        };
  }

  private async findBedTarget(accountId: UUID, targetId: UUID, db: DbHandle): Promise<ProblemTargetLookup | null> {
    const row = await db.db
      .selectFrom("beds")
      .select(["id", "place_id", "name"])
      .where("account_id", "=", accountId)
      .where("id", "=", targetId)
      .where("archived_at", "is", null)
      .where("status", "=", "active")
      .executeTakeFirst();

    return row === undefined ? null : { targetType: "bed", targetId: row.id, label: row.name, placeId: row.place_id };
  }

  private async findYearlyPlantingTarget(accountId: UUID, targetId: UUID, db: DbHandle): Promise<ProblemTargetLookup | null> {
    const row = await db.db
      .selectFrom("yearly_bed_plantings")
      .innerJoin("beds", (join) =>
        join.onRef("beds.id", "=", "yearly_bed_plantings.bed_id").onRef("beds.account_id", "=", "yearly_bed_plantings.account_id")
      )
      .leftJoin("plants", (join) =>
        join
          .onRef("plants.id", "=", "yearly_bed_plantings.plant_id")
          .onRef("plants.account_id", "=", "yearly_bed_plantings.account_id")
      )
      .select(["yearly_bed_plantings.id", "yearly_bed_plantings.year", "beds.place_id", "plants.common_name", "plants.variety"])
      .where("yearly_bed_plantings.account_id", "=", accountId)
      .where("yearly_bed_plantings.id", "=", targetId)
      .where("yearly_bed_plantings.archived_at", "is", null)
      .where("yearly_bed_plantings.status", "!=", "archived")
      .where("beds.archived_at", "is", null)
      .where("beds.status", "=", "active")
      .executeTakeFirst();

    return row === undefined
      ? null
      : {
          targetType: "yearly_bed_planting",
          targetId: row.id,
          label: `${formatPlantName(row.common_name, row.variety) ?? "Yearly planting"} ${row.year}`,
          placeId: row.place_id
        };
  }

  private async findPersistentBedPlantTarget(accountId: UUID, targetId: UUID, db: DbHandle): Promise<ProblemTargetLookup | null> {
    const row = await db.db
      .selectFrom("persistent_bed_plants")
      .innerJoin("beds", (join) =>
        join.onRef("beds.id", "=", "persistent_bed_plants.bed_id").onRef("beds.account_id", "=", "persistent_bed_plants.account_id")
      )
      .leftJoin("plants", (join) =>
        join
          .onRef("plants.id", "=", "persistent_bed_plants.plant_id")
          .onRef("plants.account_id", "=", "persistent_bed_plants.account_id")
      )
      .select(["persistent_bed_plants.id", "beds.place_id", "plants.common_name", "plants.variety"])
      .where("persistent_bed_plants.account_id", "=", accountId)
      .where("persistent_bed_plants.id", "=", targetId)
      .where("persistent_bed_plants.status", "=", "active")
      .where("persistent_bed_plants.archived_at", "is", null)
      .where("beds.archived_at", "is", null)
      .where("beds.status", "=", "active")
      .executeTakeFirst();

    return row === undefined
      ? null
      : {
          targetType: "persistent_bed_plant",
          targetId: row.id,
          label: formatPlantName(row.common_name, row.variety),
          placeId: row.place_id
        };
  }
}

function toProblem(row: SelectedProblem): Problem {
  return {
    id: row.id,
    accountId: row.account_id,
    type: row.type as ProblemType,
    placeId: row.place_id,
    targetType: row.target_type as TargetType,
    targetId: row.target_id,
    title: row.title,
    description: row.description,
    category: row.category as ProblemCategory | null,
    severity: row.severity,
    status: row.status as ProblemStatus,
    observedAt: row.observed_at,
    resolvedAt: row.resolved_at,
    archivedAt: row.archived_at,
    linkedActivityId: row.linked_activity_id,
    createdAt: row.created_at,
    updatedAt: row.updated_at
  };
}

function toProblemUpdate(patch: UpdateProblemInput): Updateable<ProblemsTable> {
  const update: Updateable<ProblemsTable> = {};

  if (patch.title !== undefined) {
    update.title = patch.title;
  }

  if (patch.description !== undefined) {
    update.description = patch.description;
  }

  if (patch.category !== undefined) {
    update.category = patch.category;
  }

  if (patch.severity !== undefined) {
    update.severity = patch.severity;
  }

  if (patch.status !== undefined) {
    update.status = patch.status;
  }

  if (patch.observedAt !== undefined) {
    update.observed_at = patch.observedAt;
  }

  if (patch.resolvedAt !== undefined) {
    update.resolved_at = patch.resolvedAt;
  }

  if (patch.linkedActivityId !== undefined) {
    update.linked_activity_id = patch.linkedActivityId;
  }

  return update;
}

function targetLabelExpression() {
  return sql<string | null>`case
    when pr.target_type = 'place' then (
      select p.name from places p where p.id = pr.target_id and p.account_id = pr.account_id
    )
    when pr.target_type = 'perennial' then (
      select coalesce(pe.label, case when pl.common_name is null then null when pl.variety is null then pl.common_name else pl.common_name || ' - ' || pl.variety end)
      from perennials pe
      left join plants pl on pl.id = pe.plant_id and pl.account_id = pe.account_id
      where pe.id = pr.target_id and pe.account_id = pr.account_id
    )
    when pr.target_type = 'bed' then (
      select b.name from beds b where b.id = pr.target_id and b.account_id = pr.account_id
    )
    when pr.target_type = 'yearly_bed_planting' then (
      select coalesce(case when pl.common_name is null then null when pl.variety is null then pl.common_name else pl.common_name || ' - ' || pl.variety end, 'Yearly planting') || ' ' || y.year::text
      from yearly_bed_plantings y
      left join plants pl on pl.id = y.plant_id and pl.account_id = y.account_id
      where y.id = pr.target_id and y.account_id = pr.account_id
    )
    when pr.target_type = 'persistent_bed_plant' then (
      select case when pl.common_name is null then null when pl.variety is null then pl.common_name else pl.common_name || ' - ' || pl.variety end
      from persistent_bed_plants pbp
      left join plants pl on pl.id = pbp.plant_id and pl.account_id = pbp.account_id
      where pbp.id = pr.target_id and pbp.account_id = pr.account_id
    )
    else null
  end`;
}

function formatPlantName(commonName: string | null, variety: string | null): string | null {
  if (commonName === null) {
    return null;
  }

  return variety === null ? commonName : `${commonName} - ${variety}`;
}

function toCount(row: CountRow | undefined): number {
  if (row === undefined) {
    return 0;
  }

  return Number(row.count);
}

function toProblemPhotoMetadata(row: SelectedProblemPhoto): ProblemPhotoMetadata {
  return {
    id: row.id,
    storageKey: row.storage_key,
    originalFilename: row.original_filename,
    mimeType: row.mime_type,
    fileSizeBytes: row.file_size_bytes === null ? null : Number(row.file_size_bytes),
    widthPx: row.width_px,
    heightPx: row.height_px,
    createdAt: row.created_at
  };
}

function toProblemObservation(row: {
  id: string;
  problem_id: string;
  summary: string;
  recommendation: string | null;
  source: string;
  created_at: Date;
  updated_at: Date;
}): ProblemObservation {
  return {
    id: row.id,
    problemId: row.problem_id,
    summary: row.summary,
    recommendation: row.recommendation,
    source: row.source as 'user' | 'ai',
    createdAt: row.created_at,
    updatedAt: row.updated_at
  };
}
