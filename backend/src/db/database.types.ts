import type { ColumnType, Generated } from "kysely";

export type JsonValue = null | boolean | number | string | JsonValue[] | { [key: string]: JsonValue };

export type Timestamp = Date;
export type DateOnly = string;
export type Numeric = string;

type Uuid = string;
type GeneratedUuid = ColumnType<Uuid, Uuid | undefined, Uuid>;
type GeneratedTimestamp = ColumnType<Timestamp, Timestamp | string | undefined, Timestamp | string>;
type NullableTimestamp = ColumnType<Timestamp | null, Timestamp | string | null | undefined, Timestamp | string | null>;
type ReadonlyColumn<T> = ColumnType<T, never, never>;
type DateColumn = ColumnType<DateOnly, DateOnly | Date, DateOnly | Date>;
type NullableDateColumn = ColumnType<DateOnly | null, DateOnly | Date | null | undefined, DateOnly | Date | null>;
type NumericColumn = ColumnType<Numeric, Numeric | number, Numeric | number>;
type NullableNumericColumn = ColumnType<Numeric | null, Numeric | number | null | undefined, Numeric | number | null>;
type JsonColumn<T extends JsonValue = JsonValue> = ColumnType<T, T, T>;
type NullableJsonColumn<T extends JsonValue = JsonValue> = ColumnType<T | null, T | null | undefined, T | null>;

export interface AccountsTable {
  id: GeneratedUuid;
  email: string | null;
  display_name: string | null;
  created_at: GeneratedTimestamp;
  updated_at: GeneratedTimestamp;
  archived_at: NullableTimestamp;
}

export interface PlacesTable {
  id: GeneratedUuid;
  account_id: Uuid;
  name: string;
  description: string | null;
  notes: string | null;
  weather_enabled: Generated<boolean>;
  weather_location_label: string | null;
  latitude: NullableNumericColumn;
  longitude: NullableNumericColumn;
  timezone: string | null;
  created_at: GeneratedTimestamp;
  updated_at: GeneratedTimestamp;
  archived_at: NullableTimestamp;
}

export interface PlantsTable {
  id: GeneratedUuid;
  account_id: Uuid;
  common_name: string;
  variety: string | null;
  plant_category: string | null;
  lifecycle_type: string;
  growing_style: string;
  notes: string | null;
  created_at: GeneratedTimestamp;
  updated_at: GeneratedTimestamp;
  archived_at: NullableTimestamp;
}

export interface PerennialsTable {
  id: GeneratedUuid;
  account_id: Uuid;
  place_id: Uuid;
  plant_id: Uuid;
  label: string | null;
  planted_year: number | null;
  notes: string | null;
  status: string;
  created_at: GeneratedTimestamp;
  updated_at: GeneratedTimestamp;
  archived_at: NullableTimestamp;
}

export interface BedsTable {
  id: GeneratedUuid;
  account_id: Uuid;
  place_id: Uuid;
  name: string;
  description: string | null;
  notes: string | null;
  width_m: NullableNumericColumn;
  length_m: NullableNumericColumn;
  area_m2: NullableNumericColumn;
  status: string;
  created_at: GeneratedTimestamp;
  updated_at: GeneratedTimestamp;
  archived_at: NullableTimestamp;
}

export interface PersistentBedPlantsTable {
  id: GeneratedUuid;
  account_id: Uuid;
  bed_id: Uuid;
  plant_id: Uuid;
  planted_year: number | null;
  quantity: NullableNumericColumn;
  notes: string | null;
  status: string;
  created_at: GeneratedTimestamp;
  updated_at: GeneratedTimestamp;
  archived_at: NullableTimestamp;
}

export interface YearlyBedPlantingsTable {
  id: GeneratedUuid;
  account_id: Uuid;
  bed_id: Uuid;
  plant_id: Uuid;
  year: number;
  quantity: NullableNumericColumn;
  notes: string | null;
  status: string;
  created_at: GeneratedTimestamp;
  updated_at: GeneratedTimestamp;
  archived_at: NullableTimestamp;
}

export interface ProductsTable {
  id: GeneratedUuid;
  account_id: Uuid;
  name: string;
  category: string;
  active_substance: string | null;
  manufacturer: string | null;
  formulation: string | null;
  default_unit: string;
  notes: string | null;
  created_at: GeneratedTimestamp;
  updated_at: GeneratedTimestamp;
  archived_at: NullableTimestamp;
}

export interface ProductUsageRulesTable {
  id: GeneratedUuid;
  account_id: Uuid;
  product_id: Uuid;
  plant_id: Uuid;
  dose_value: NumericColumn;
  dose_unit: string;
  dilution_text: string | null;
  application_method: string | null;
  reapplication_interval_days: number | null;
  quarantine_period_days: number | null;
  notes: string | null;
  created_at: GeneratedTimestamp;
  updated_at: GeneratedTimestamp;
  archived_at: NullableTimestamp;
}

export interface InventoryLotsTable {
  id: GeneratedUuid;
  account_id: Uuid;
  product_id: Uuid;
  quantity_initial: NumericColumn;
  quantity_remaining: NumericColumn;
  unit: string;
  purchase_date: NullableDateColumn;
  expiry_date: NullableDateColumn;
  batch_number: string | null;
  notes: string | null;
  created_at: GeneratedTimestamp;
  updated_at: GeneratedTimestamp;
  archived_at: NullableTimestamp;
}

export interface ActivitiesTable {
  id: GeneratedUuid;
  account_id: Uuid;
  place_id: Uuid | null;
  type: string;
  performed_at: ColumnType<Timestamp, Timestamp | string, Timestamp | string>;
  target_scope_type: string;
  notes: string | null;
  created_at: GeneratedTimestamp;
  updated_at: GeneratedTimestamp;
}

export interface TasksTable {
  id: GeneratedUuid;
  account_id: Uuid;
  place_id: Uuid | null;
  type: string;
  due_date: DateColumn;
  notes: string | null;
  source_type: string | null;
  source_reference_id: Uuid | null;
  target_scope_type: string;
  status: string;
  created_at: GeneratedTimestamp;
  updated_at: GeneratedTimestamp;
  confirmed_at: NullableTimestamp;
  completed_at: NullableTimestamp;
}

export interface ActivityTargetsTable {
  id: GeneratedUuid;
  activity_id: Uuid;
  target_type: string;
  target_id: Uuid;
  created_at: GeneratedTimestamp;
}

export interface ActivityProductUsagesTable {
  id: GeneratedUuid;
  activity_id: Uuid;
  product_id: Uuid;
  product_usage_rule_id: Uuid | null;
  quantity_used: NumericColumn;
  unit: string;
  created_stock_movement: Generated<boolean>;
  created_quarantine: Generated<boolean>;
  created_followup_suggestion: Generated<boolean>;
  notes: string | null;
  created_at: GeneratedTimestamp;
}

export interface InventoryMovementsTable {
  id: GeneratedUuid;
  account_id: Uuid;
  product_id: Uuid;
  inventory_lot_id: Uuid | null;
  movement_type: string;
  quantity: NumericColumn;
  unit: string;
  activity_id: Uuid | null;
  occurred_at: ColumnType<Timestamp, Timestamp | string, Timestamp | string>;
  notes: string | null;
  created_at: GeneratedTimestamp;
}

export interface ProblemsTable {
  id: GeneratedUuid;
  account_id: Uuid;
  type: string;
  place_id: Uuid;
  target_type: string;
  target_id: Uuid;
  title: string;
  description: string;
  category: string | null;
  severity: string | null;
  status: string;
  observed_at: ColumnType<Timestamp, Timestamp | string, Timestamp | string>;
  linked_activity_id: Uuid | null;
  created_at: GeneratedTimestamp;
  updated_at: GeneratedTimestamp;
}

export interface ProblemPhotosTable {
  id: GeneratedUuid;
  problem_id: Uuid;
  storage_key: string;
  original_filename: string | null;
  mime_type: string | null;
  file_size_bytes: ColumnType<string | null, string | number | null | undefined, string | number | null>;
  width_px: number | null;
  height_px: number | null;
  created_at: GeneratedTimestamp;
}

export interface TaskTargetsTable {
  id: GeneratedUuid;
  task_id: Uuid;
  target_type: string;
  target_id: Uuid;
  created_at: GeneratedTimestamp;
}

export interface TaskRemindersTable {
  id: GeneratedUuid;
  task_id: Uuid;
  reminder_type: string;
  scheduled_for: ColumnType<Timestamp, Timestamp | string, Timestamp | string>;
  sent_at: NullableTimestamp;
  status: string;
  created_at: GeneratedTimestamp;
}

export interface QuarantinePeriodsTable {
  id: GeneratedUuid;
  account_id: Uuid;
  place_id: Uuid | null;
  activity_id: Uuid;
  activity_product_usage_id: Uuid;
  product_id: Uuid;
  starts_on: DateColumn;
  ends_on: DateColumn;
  notes: string | null;
  created_at: GeneratedTimestamp;
}

export interface WeatherEventsTable {
  id: GeneratedUuid;
  account_id: Uuid;
  place_id: Uuid;
  related_entity_type: string;
  related_entity_id: Uuid;
  event_type: string;
  forecasted_rain: boolean | null;
  observed_rain: boolean | null;
  user_confirmation_status: string | null;
  provider_payload: NullableJsonColumn;
  created_at: GeneratedTimestamp;
  updated_at: GeneratedTimestamp;
}

export interface AiSessionsTable {
  id: GeneratedUuid;
  account_id: Uuid;
  kind: string;
  input_mode: string;
  status: string;
  raw_input_text: string | null;
  related_entity_type: string | null;
  related_entity_id: Uuid | null;
  created_at: GeneratedTimestamp;
  updated_at: GeneratedTimestamp;
}

export interface AiSuggestionsTable {
  id: GeneratedUuid;
  ai_session_id: Uuid;
  suggestion_type: string;
  payload: JsonColumn;
  accepted: boolean | null;
  accepted_at: NullableTimestamp;
  created_at: GeneratedTimestamp;
}

export interface PushSubscriptionsTable {
  id: GeneratedUuid;
  account_id: Uuid;
  endpoint: string;
  p256dh: string;
  auth: string;
  user_agent: string | null;
  is_active: Generated<boolean>;
  created_at: GeneratedTimestamp;
  updated_at: GeneratedTimestamp;
}

export interface AuditLogsTable {
  id: GeneratedUuid;
  account_id: Uuid;
  actor_type: string;
  actor_id: Uuid | null;
  entity_type: string;
  entity_id: Uuid;
  action: string;
  before_json: NullableJsonColumn;
  after_json: NullableJsonColumn;
  created_at: GeneratedTimestamp;
}

export interface InventoryProductBalancesView {
  product_id: ReadonlyColumn<Uuid>;
  account_id: ReadonlyColumn<Uuid>;
  product_name: ReadonlyColumn<string>;
  category: ReadonlyColumn<string>;
  default_unit: ReadonlyColumn<string>;
  quantity_remaining: ReadonlyColumn<Numeric>;
  active_lot_count: ReadonlyColumn<string>;
  next_expiry_date: ReadonlyColumn<DateOnly | null>;
}

export interface BedCurrentContentsView {
  bed_id: ReadonlyColumn<Uuid>;
  account_id: ReadonlyColumn<Uuid>;
  place_id: ReadonlyColumn<Uuid>;
  source_type: ReadonlyColumn<string>;
  source_id: ReadonlyColumn<Uuid>;
  plant_id: ReadonlyColumn<Uuid>;
  common_name: ReadonlyColumn<string>;
  variety: ReadonlyColumn<string | null>;
  quantity: ReadonlyColumn<Numeric | null>;
  notes: ReadonlyColumn<string | null>;
  status: ReadonlyColumn<string>;
  year: ReadonlyColumn<number | null>;
}

export interface ActiveQuarantinePeriodsView extends ReadonlyQuarantinePeriodColumns {
  is_active_today: ReadonlyColumn<boolean>;
}

interface ReadonlyQuarantinePeriodColumns {
  id: ReadonlyColumn<Uuid>;
  account_id: ReadonlyColumn<Uuid>;
  place_id: ReadonlyColumn<Uuid | null>;
  activity_id: ReadonlyColumn<Uuid>;
  activity_product_usage_id: ReadonlyColumn<Uuid>;
  product_id: ReadonlyColumn<Uuid>;
  starts_on: ReadonlyColumn<DateOnly>;
  ends_on: ReadonlyColumn<DateOnly>;
  notes: ReadonlyColumn<string | null>;
  created_at: ReadonlyColumn<Timestamp>;
}

export interface ActivityDetailView {
  id: ReadonlyColumn<Uuid>;
  account_id: ReadonlyColumn<Uuid>;
  place_id: ReadonlyColumn<Uuid | null>;
  type: ReadonlyColumn<string>;
  performed_at: ReadonlyColumn<Timestamp>;
  target_scope_type: ReadonlyColumn<string>;
  notes: ReadonlyColumn<string | null>;
  created_at: ReadonlyColumn<Timestamp>;
  updated_at: ReadonlyColumn<Timestamp>;
  target_count: ReadonlyColumn<string>;
  product_usage_count: ReadonlyColumn<string>;
  inventory_movement_count: ReadonlyColumn<string>;
  quarantine_count: ReadonlyColumn<string>;
  followup_task_count: ReadonlyColumn<string>;
}

export interface TaskDetailView {
  id: ReadonlyColumn<Uuid>;
  account_id: ReadonlyColumn<Uuid>;
  place_id: ReadonlyColumn<Uuid | null>;
  type: ReadonlyColumn<string>;
  due_date: ReadonlyColumn<DateOnly>;
  notes: ReadonlyColumn<string | null>;
  source_type: ReadonlyColumn<string | null>;
  source_reference_id: ReadonlyColumn<Uuid | null>;
  target_scope_type: ReadonlyColumn<string>;
  status: ReadonlyColumn<string>;
  created_at: ReadonlyColumn<Timestamp>;
  updated_at: ReadonlyColumn<Timestamp>;
  confirmed_at: ReadonlyColumn<Timestamp | null>;
  completed_at: ReadonlyColumn<Timestamp | null>;
  target_count: ReadonlyColumn<string>;
  reminder_count: ReadonlyColumn<string>;
  next_reminder_at: ReadonlyColumn<Timestamp | null>;
}

export interface CalendarItemsView {
  item_type: ReadonlyColumn<string>;
  item_id: ReadonlyColumn<Uuid>;
  account_id: ReadonlyColumn<Uuid>;
  place_id: ReadonlyColumn<Uuid | null>;
  title: ReadonlyColumn<string>;
  notes: ReadonlyColumn<string | null>;
  starts_on: ReadonlyColumn<DateOnly>;
  ends_on: ReadonlyColumn<DateOnly>;
  starts_at: ReadonlyColumn<Timestamp | null>;
  ends_at: ReadonlyColumn<Timestamp | null>;
  status: ReadonlyColumn<string | null>;
}

export interface Database {
  accounts: AccountsTable;
  places: PlacesTable;
  plants: PlantsTable;
  perennials: PerennialsTable;
  beds: BedsTable;
  persistent_bed_plants: PersistentBedPlantsTable;
  yearly_bed_plantings: YearlyBedPlantingsTable;
  products: ProductsTable;
  product_usage_rules: ProductUsageRulesTable;
  inventory_lots: InventoryLotsTable;
  activities: ActivitiesTable;
  tasks: TasksTable;
  activity_targets: ActivityTargetsTable;
  activity_product_usages: ActivityProductUsagesTable;
  inventory_movements: InventoryMovementsTable;
  problems: ProblemsTable;
  problem_photos: ProblemPhotosTable;
  task_targets: TaskTargetsTable;
  task_reminders: TaskRemindersTable;
  quarantine_periods: QuarantinePeriodsTable;
  weather_events: WeatherEventsTable;
  ai_sessions: AiSessionsTable;
  ai_suggestions: AiSuggestionsTable;
  push_subscriptions: PushSubscriptionsTable;
  audit_logs: AuditLogsTable;
  inventory_product_balances: InventoryProductBalancesView;
  bed_current_contents: BedCurrentContentsView;
  active_quarantine_periods: ActiveQuarantinePeriodsView;
  activity_detail_view: ActivityDetailView;
  task_detail_view: TaskDetailView;
  calendar_items_view: CalendarItemsView;
}
