-- Gardening Helper
-- Initial schema migration draft
-- Based on: technical requirements, DB schema and ERD
-- PostgreSQL schema for self-hosted Supabase Postgres; backend-owned business logic

BEGIN;

-- Extensions
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- ---------------------------------------------------------------------------
-- Utility functions
-- ---------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

-- ---------------------------------------------------------------------------
-- Foundation
-- ---------------------------------------------------------------------------

CREATE TABLE accounts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email text UNIQUE,
  display_name text,
  created_at timestamptz NOT NULL DEFAULT NOW(),
  updated_at timestamptz NOT NULL DEFAULT NOW(),
  archived_at timestamptz
);

CREATE TABLE places (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  account_id uuid NOT NULL REFERENCES accounts(id) ON DELETE RESTRICT,
  name text NOT NULL,
  description text,
  notes text,
  weather_enabled boolean NOT NULL DEFAULT false,
  weather_location_label text,
  latitude numeric,
  longitude numeric,
  timezone text,
  created_at timestamptz NOT NULL DEFAULT NOW(),
  updated_at timestamptz NOT NULL DEFAULT NOW(),
  archived_at timestamptz
);

CREATE INDEX idx_places_account_archived
  ON places(account_id, archived_at);

CREATE TABLE plants (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  account_id uuid NOT NULL REFERENCES accounts(id) ON DELETE RESTRICT,
  common_name text NOT NULL,
  variety text,
  plant_category text,
  lifecycle_type text NOT NULL,
  growing_style text NOT NULL,
  notes text,
  created_at timestamptz NOT NULL DEFAULT NOW(),
  updated_at timestamptz NOT NULL DEFAULT NOW(),
  archived_at timestamptz,
  CONSTRAINT plants_lifecycle_type_chk
    CHECK (lifecycle_type IN ('annual', 'biennial', 'perennial')),
  CONSTRAINT plants_growing_style_chk
    CHECK (growing_style IN ('tree', 'shrub', 'vine', 'herb', 'vegetable', 'berry', 'flower', 'other'))
);

CREATE INDEX idx_plants_account_common_name
  ON plants(account_id, common_name);

-- ---------------------------------------------------------------------------
-- Growing structure
-- ---------------------------------------------------------------------------

CREATE TABLE perennials (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  account_id uuid NOT NULL REFERENCES accounts(id) ON DELETE RESTRICT,
  place_id uuid NOT NULL REFERENCES places(id) ON DELETE RESTRICT,
  plant_id uuid NOT NULL REFERENCES plants(id) ON DELETE RESTRICT,
  label text,
  planted_year int,
  notes text,
  status text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT NOW(),
  updated_at timestamptz NOT NULL DEFAULT NOW(),
  archived_at timestamptz,
  CONSTRAINT perennials_status_chk
    CHECK (status IN ('active', 'removed', 'dead', 'archived')),
  CONSTRAINT perennials_planted_year_chk
    CHECK (planted_year IS NULL OR planted_year BETWEEN 1900 AND 3000)
);

CREATE INDEX idx_perennials_place_status
  ON perennials(place_id, status);

CREATE TABLE beds (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  account_id uuid NOT NULL REFERENCES accounts(id) ON DELETE RESTRICT,
  place_id uuid NOT NULL REFERENCES places(id) ON DELETE RESTRICT,
  name text NOT NULL,
  description text,
  notes text,
  width_m numeric,
  length_m numeric,
  area_m2 numeric,
  status text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT NOW(),
  updated_at timestamptz NOT NULL DEFAULT NOW(),
  archived_at timestamptz,
  CONSTRAINT beds_status_chk
    CHECK (status IN ('active', 'removed', 'archived')),
  CONSTRAINT beds_width_m_chk
    CHECK (width_m IS NULL OR width_m > 0),
  CONSTRAINT beds_length_m_chk
    CHECK (length_m IS NULL OR length_m > 0),
  CONSTRAINT beds_area_m2_chk
    CHECK (area_m2 IS NULL OR area_m2 > 0)
);

CREATE INDEX idx_beds_place_status
  ON beds(place_id, status);

CREATE TABLE persistent_bed_plants (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  account_id uuid NOT NULL REFERENCES accounts(id) ON DELETE RESTRICT,
  bed_id uuid NOT NULL REFERENCES beds(id) ON DELETE RESTRICT,
  plant_id uuid NOT NULL REFERENCES plants(id) ON DELETE RESTRICT,
  planted_year int,
  quantity numeric,
  notes text,
  status text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT NOW(),
  updated_at timestamptz NOT NULL DEFAULT NOW(),
  archived_at timestamptz,
  CONSTRAINT persistent_bed_plants_status_chk
    CHECK (status IN ('active', 'removed', 'archived')),
  CONSTRAINT persistent_bed_plants_planted_year_chk
    CHECK (planted_year IS NULL OR planted_year BETWEEN 1900 AND 3000),
  CONSTRAINT persistent_bed_plants_quantity_chk
    CHECK (quantity IS NULL OR quantity >= 0)
);

CREATE INDEX idx_persistent_bed_plants_bed_status
  ON persistent_bed_plants(bed_id, status);

CREATE TABLE yearly_bed_plantings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  account_id uuid NOT NULL REFERENCES accounts(id) ON DELETE RESTRICT,
  bed_id uuid NOT NULL REFERENCES beds(id) ON DELETE RESTRICT,
  plant_id uuid NOT NULL REFERENCES plants(id) ON DELETE RESTRICT,
  year int NOT NULL,
  quantity numeric,
  notes text,
  status text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT NOW(),
  updated_at timestamptz NOT NULL DEFAULT NOW(),
  archived_at timestamptz,
  CONSTRAINT yearly_bed_plantings_status_chk
    CHECK (status IN ('planned', 'planted', 'removed', 'harvested', 'archived')),
  CONSTRAINT yearly_bed_plantings_year_chk
    CHECK (year BETWEEN 1900 AND 3000),
  CONSTRAINT yearly_bed_plantings_quantity_chk
    CHECK (quantity IS NULL OR quantity >= 0)
);

CREATE INDEX idx_yearly_bed_plantings_bed_year
  ON yearly_bed_plantings(bed_id, year);

CREATE INDEX idx_yearly_bed_plantings_account_year
  ON yearly_bed_plantings(account_id, year);

-- ---------------------------------------------------------------------------
-- Products and inventory
-- ---------------------------------------------------------------------------

CREATE TABLE products (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  account_id uuid NOT NULL REFERENCES accounts(id) ON DELETE RESTRICT,
  name text NOT NULL,
  category text NOT NULL,
  active_substance text,
  manufacturer text,
  formulation text,
  default_unit text NOT NULL,
  notes text,
  created_at timestamptz NOT NULL DEFAULT NOW(),
  updated_at timestamptz NOT NULL DEFAULT NOW(),
  archived_at timestamptz,
  CONSTRAINT products_category_chk
    CHECK (category IN (
      'insecticide',
      'fungicide',
      'pesticide',
      'fertilizer',
      'foliar_fertilizer',
      'biostimulant',
      'soil_amendment',
      'other_preparation'
    )),
  CONSTRAINT products_default_unit_chk
    CHECK (default_unit IN ('ml', 'l', 'g', 'kg'))
);

CREATE INDEX idx_products_account_name
  ON products(account_id, name);

CREATE TABLE product_usage_rules (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  account_id uuid NOT NULL REFERENCES accounts(id) ON DELETE RESTRICT,
  product_id uuid NOT NULL REFERENCES products(id) ON DELETE RESTRICT,
  plant_id uuid NOT NULL REFERENCES plants(id) ON DELETE RESTRICT,
  dose_value numeric NOT NULL,
  dose_unit text NOT NULL,
  dilution_text text,
  application_method text,
  reapplication_interval_days int,
  quarantine_period_days int,
  notes text,
  created_at timestamptz NOT NULL DEFAULT NOW(),
  updated_at timestamptz NOT NULL DEFAULT NOW(),
  archived_at timestamptz,
  CONSTRAINT product_usage_rules_dose_value_chk
    CHECK (dose_value > 0),
  CONSTRAINT product_usage_rules_dose_unit_chk
    CHECK (dose_unit IN ('ml', 'l', 'g', 'kg')),
  CONSTRAINT product_usage_rules_reapplication_interval_days_chk
    CHECK (reapplication_interval_days IS NULL OR reapplication_interval_days >= 0),
  CONSTRAINT product_usage_rules_quarantine_period_days_chk
    CHECK (quarantine_period_days IS NULL OR quarantine_period_days >= 0)
);

CREATE INDEX idx_product_usage_rules_product_plant
  ON product_usage_rules(product_id, plant_id);

CREATE TABLE inventory_lots (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  account_id uuid NOT NULL REFERENCES accounts(id) ON DELETE RESTRICT,
  product_id uuid NOT NULL REFERENCES products(id) ON DELETE RESTRICT,
  quantity_initial numeric NOT NULL,
  quantity_remaining numeric NOT NULL,
  unit text NOT NULL,
  purchase_date date,
  expiry_date date,
  batch_number text,
  notes text,
  created_at timestamptz NOT NULL DEFAULT NOW(),
  updated_at timestamptz NOT NULL DEFAULT NOW(),
  archived_at timestamptz,
  CONSTRAINT inventory_lots_quantity_initial_chk
    CHECK (quantity_initial > 0),
  CONSTRAINT inventory_lots_quantity_remaining_chk
    CHECK (quantity_remaining >= 0),
  CONSTRAINT inventory_lots_unit_chk
    CHECK (unit IN ('ml', 'l', 'g', 'kg'))
);

CREATE INDEX idx_inventory_lots_product_archived
  ON inventory_lots(product_id, archived_at);

CREATE INDEX idx_inventory_lots_expiry_date
  ON inventory_lots(expiry_date);

-- ---------------------------------------------------------------------------
-- Activities and tasks (headers first, cyclic refs later)
-- ---------------------------------------------------------------------------

CREATE TABLE activities (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  account_id uuid NOT NULL REFERENCES accounts(id) ON DELETE RESTRICT,
  place_id uuid REFERENCES places(id) ON DELETE RESTRICT,
  type text NOT NULL,
  performed_at timestamptz NOT NULL,
  target_scope_type text NOT NULL,
  notes text,
  created_at timestamptz NOT NULL DEFAULT NOW(),
  updated_at timestamptz NOT NULL DEFAULT NOW(),
  CONSTRAINT activities_type_chk
    CHECK (type IN (
      'watering',
      'treatment',
      'fertilizing',
      'pruning',
      'planting',
      'transplanting',
      'harvesting',
      'observation',
      'maintenance',
      'soil_work',
      'custom'
    )),
  CONSTRAINT activities_target_scope_type_chk
    CHECK (target_scope_type IN (
      'whole_place',
      'all_perennials_in_place',
      'selected_perennials',
      'all_beds_in_place',
      'selected_beds',
      'single_bed',
      'selected_yearly_plantings',
      'selected_persistent_bed_plants'
    ))
);

CREATE INDEX idx_activities_account_performed_at_desc
  ON activities(account_id, performed_at DESC);

CREATE INDEX idx_activities_place_performed_at_desc
  ON activities(place_id, performed_at DESC);

CREATE TABLE tasks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  account_id uuid NOT NULL REFERENCES accounts(id) ON DELETE RESTRICT,
  place_id uuid REFERENCES places(id) ON DELETE RESTRICT,
  type text NOT NULL,
  due_date date NOT NULL,
  notes text,
  source_type text,
  source_reference_id uuid,
  target_scope_type text NOT NULL,
  status text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT NOW(),
  updated_at timestamptz NOT NULL DEFAULT NOW(),
  confirmed_at timestamptz,
  completed_at timestamptz,
  CONSTRAINT tasks_type_chk
    CHECK (type IN ('spraying', 'fertilizing', 'pruning', 'planting', 'harvest_reminder', 'custom')),
  CONSTRAINT tasks_status_chk
    CHECK (status IN ('suggested', 'planned', 'done', 'skipped', 'canceled')),
  CONSTRAINT tasks_source_type_chk
    CHECK (source_type IS NULL OR source_type IN ('activity', 'manual', 'weather', 'ai')),
  CONSTRAINT tasks_target_scope_type_chk
    CHECK (target_scope_type IN (
      'whole_place',
      'all_perennials_in_place',
      'selected_perennials',
      'all_beds_in_place',
      'selected_beds',
      'single_bed',
      'selected_yearly_plantings',
      'selected_persistent_bed_plants'
    ))
);

CREATE INDEX idx_tasks_account_due_date
  ON tasks(account_id, due_date);

CREATE INDEX idx_tasks_status_due_date
  ON tasks(status, due_date);

CREATE INDEX idx_tasks_place_due_date
  ON tasks(place_id, due_date);

-- ---------------------------------------------------------------------------
-- Operations and problem detail tables
-- ---------------------------------------------------------------------------

CREATE TABLE activity_targets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  activity_id uuid NOT NULL REFERENCES activities(id) ON DELETE CASCADE,
  target_type text NOT NULL,
  target_id uuid NOT NULL,
  created_at timestamptz NOT NULL DEFAULT NOW(),
  CONSTRAINT activity_targets_target_type_chk
    CHECK (target_type IN ('place', 'perennial', 'bed', 'yearly_bed_planting', 'persistent_bed_plant'))
);

CREATE INDEX idx_activity_targets_activity
  ON activity_targets(activity_id);

CREATE INDEX idx_activity_targets_target_type_target_id
  ON activity_targets(target_type, target_id);

CREATE TABLE activity_product_usages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  activity_id uuid NOT NULL REFERENCES activities(id) ON DELETE CASCADE,
  product_id uuid NOT NULL REFERENCES products(id) ON DELETE RESTRICT,
  product_usage_rule_id uuid REFERENCES product_usage_rules(id) ON DELETE RESTRICT,
  quantity_used numeric NOT NULL,
  unit text NOT NULL,
  created_stock_movement boolean NOT NULL DEFAULT false,
  created_quarantine boolean NOT NULL DEFAULT false,
  created_followup_suggestion boolean NOT NULL DEFAULT false,
  notes text,
  created_at timestamptz NOT NULL DEFAULT NOW(),
  CONSTRAINT activity_product_usages_quantity_used_chk
    CHECK (quantity_used > 0),
  CONSTRAINT activity_product_usages_unit_chk
    CHECK (unit IN ('ml', 'l', 'g', 'kg'))
);

CREATE INDEX idx_activity_product_usages_activity
  ON activity_product_usages(activity_id);

CREATE INDEX idx_activity_product_usages_product
  ON activity_product_usages(product_id);

CREATE TABLE inventory_movements (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  account_id uuid NOT NULL REFERENCES accounts(id) ON DELETE RESTRICT,
  product_id uuid NOT NULL REFERENCES products(id) ON DELETE RESTRICT,
  inventory_lot_id uuid REFERENCES inventory_lots(id) ON DELETE RESTRICT,
  movement_type text NOT NULL,
  quantity numeric NOT NULL,
  unit text NOT NULL,
  activity_id uuid REFERENCES activities(id) ON DELETE RESTRICT,
  occurred_at timestamptz NOT NULL,
  notes text,
  created_at timestamptz NOT NULL DEFAULT NOW(),
  CONSTRAINT inventory_movements_movement_type_chk
    CHECK (movement_type IN ('purchase', 'manual_adjustment', 'consumption', 'correction')),
  CONSTRAINT inventory_movements_quantity_chk
    CHECK (quantity > 0),
  CONSTRAINT inventory_movements_unit_chk
    CHECK (unit IN ('ml', 'l', 'g', 'kg'))
);

CREATE INDEX idx_inventory_movements_product_occurred_at
  ON inventory_movements(product_id, occurred_at);

CREATE INDEX idx_inventory_movements_activity
  ON inventory_movements(activity_id);

CREATE TABLE problems (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  account_id uuid NOT NULL REFERENCES accounts(id) ON DELETE RESTRICT,
  type text NOT NULL,
  place_id uuid NOT NULL REFERENCES places(id) ON DELETE RESTRICT,
  target_type text NOT NULL,
  target_id uuid NOT NULL,
  title text NOT NULL,
  description text NOT NULL,
  category text,
  severity text,
  status text NOT NULL,
  observed_at timestamptz NOT NULL,
  linked_activity_id uuid REFERENCES activities(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT NOW(),
  updated_at timestamptz NOT NULL DEFAULT NOW(),
  CONSTRAINT problems_type_chk
    CHECK (type IN ('problem', 'observation')),
  CONSTRAINT problems_target_type_chk
    CHECK (target_type IN ('place', 'perennial', 'bed', 'yearly_bed_planting', 'persistent_bed_plant')),
  CONSTRAINT problems_status_chk
    CHECK (status IN ('open', 'monitoring', 'resolved')),
  CONSTRAINT problems_category_chk
    CHECK (
      category IS NULL OR category IN (
        'insect',
        'fungus',
        'bacteria',
        'nutrient_deficiency',
        'watering_issue',
        'weather_damage',
        'growth_issue',
        'unknown',
        'other'
      )
    )
);

CREATE INDEX idx_problems_place_observed_at_desc
  ON problems(place_id, observed_at DESC);

CREATE INDEX idx_problems_target_type_target_id
  ON problems(target_type, target_id);

CREATE INDEX idx_problems_status_observed_at_desc
  ON problems(status, observed_at DESC);

CREATE TABLE problem_photos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  problem_id uuid NOT NULL REFERENCES problems(id) ON DELETE CASCADE,
  storage_key text NOT NULL,
  original_filename text,
  mime_type text,
  file_size_bytes bigint,
  width_px int,
  height_px int,
  created_at timestamptz NOT NULL DEFAULT NOW(),
  CONSTRAINT problem_photos_file_size_bytes_chk
    CHECK (file_size_bytes IS NULL OR file_size_bytes >= 0),
  CONSTRAINT problem_photos_width_px_chk
    CHECK (width_px IS NULL OR width_px >= 0),
  CONSTRAINT problem_photos_height_px_chk
    CHECK (height_px IS NULL OR height_px >= 0)
);

CREATE INDEX idx_problem_photos_problem
  ON problem_photos(problem_id);

CREATE TABLE task_targets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  task_id uuid NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
  target_type text NOT NULL,
  target_id uuid NOT NULL,
  created_at timestamptz NOT NULL DEFAULT NOW(),
  CONSTRAINT task_targets_target_type_chk
    CHECK (target_type IN ('place', 'perennial', 'bed', 'yearly_bed_planting', 'persistent_bed_plant'))
);

CREATE INDEX idx_task_targets_task
  ON task_targets(task_id);

CREATE INDEX idx_task_targets_target_type_target_id
  ON task_targets(target_type, target_id);

CREATE TABLE task_reminders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  task_id uuid NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
  reminder_type text NOT NULL,
  scheduled_for timestamptz NOT NULL,
  sent_at timestamptz,
  status text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT NOW(),
  CONSTRAINT task_reminders_reminder_type_chk
    CHECK (reminder_type IN ('day_before', 'same_day')),
  CONSTRAINT task_reminders_status_chk
    CHECK (status IN ('scheduled', 'sent', 'failed', 'canceled'))
);

CREATE INDEX idx_task_reminders_scheduled_for_status
  ON task_reminders(scheduled_for, status);

CREATE TABLE quarantine_periods (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  account_id uuid NOT NULL REFERENCES accounts(id) ON DELETE RESTRICT,
  place_id uuid REFERENCES places(id) ON DELETE RESTRICT,
  activity_id uuid NOT NULL REFERENCES activities(id) ON DELETE RESTRICT,
  activity_product_usage_id uuid NOT NULL REFERENCES activity_product_usages(id) ON DELETE RESTRICT,
  product_id uuid NOT NULL REFERENCES products(id) ON DELETE RESTRICT,
  starts_on date NOT NULL,
  ends_on date NOT NULL,
  notes text,
  created_at timestamptz NOT NULL DEFAULT NOW(),
  CONSTRAINT quarantine_periods_date_range_chk
    CHECK (ends_on >= starts_on)
);

CREATE INDEX idx_quarantine_periods_place_date_range
  ON quarantine_periods(place_id, starts_on, ends_on);

CREATE INDEX idx_quarantine_periods_activity
  ON quarantine_periods(activity_id);

-- ---------------------------------------------------------------------------
-- Integrations / support
-- ---------------------------------------------------------------------------

CREATE TABLE weather_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  account_id uuid NOT NULL REFERENCES accounts(id) ON DELETE RESTRICT,
  place_id uuid NOT NULL REFERENCES places(id) ON DELETE RESTRICT,
  related_entity_type text NOT NULL,
  related_entity_id uuid NOT NULL,
  event_type text NOT NULL,
  forecasted_rain boolean,
  observed_rain boolean,
  user_confirmation_status text,
  provider_payload jsonb,
  created_at timestamptz NOT NULL DEFAULT NOW(),
  updated_at timestamptz NOT NULL DEFAULT NOW(),
  CONSTRAINT weather_events_related_entity_type_chk
    CHECK (related_entity_type IN ('task', 'activity')),
  CONSTRAINT weather_events_event_type_chk
    CHECK (event_type IN ('rain_check', 'forecast_snapshot')),
  CONSTRAINT weather_events_user_confirmation_status_chk
    CHECK (
      user_confirmation_status IS NULL OR
      user_confirmation_status IN ('pending', 'confirmed_yes', 'confirmed_no', 'ignored')
    )
);

CREATE INDEX idx_weather_events_place_related_entity
  ON weather_events(place_id, related_entity_type, related_entity_id);

CREATE TABLE ai_sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  account_id uuid NOT NULL REFERENCES accounts(id) ON DELETE RESTRICT,
  kind text NOT NULL,
  input_mode text NOT NULL,
  status text NOT NULL,
  raw_input_text text,
  related_entity_type text,
  related_entity_id uuid,
  created_at timestamptz NOT NULL DEFAULT NOW(),
  updated_at timestamptz NOT NULL DEFAULT NOW(),
  CONSTRAINT ai_sessions_kind_chk
    CHECK (kind IN ('product_ingestion', 'bed_planning', 'problem_assist')),
  CONSTRAINT ai_sessions_input_mode_chk
    CHECK (input_mode IN ('name', 'text', 'image', 'mixed')),
  CONSTRAINT ai_sessions_status_chk
    CHECK (status IN ('pending', 'completed', 'failed', 'dismissed', 'accepted'))
);

CREATE INDEX idx_ai_sessions_account_created_at_desc
  ON ai_sessions(account_id, created_at DESC);

CREATE TABLE ai_suggestions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  ai_session_id uuid NOT NULL REFERENCES ai_sessions(id) ON DELETE CASCADE,
  suggestion_type text NOT NULL,
  payload jsonb NOT NULL,
  accepted boolean,
  accepted_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT NOW(),
  CONSTRAINT ai_suggestions_suggestion_type_chk
    CHECK (suggestion_type IN ('product', 'product_rule', 'bed_plan', 'problem_summary', 'followup_questions'))
);

CREATE TABLE push_subscriptions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  account_id uuid NOT NULL REFERENCES accounts(id) ON DELETE RESTRICT,
  endpoint text NOT NULL,
  p256dh text NOT NULL,
  auth text NOT NULL,
  user_agent text,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT NOW(),
  updated_at timestamptz NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_push_subscriptions_account_is_active
  ON push_subscriptions(account_id, is_active);

CREATE TABLE audit_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  account_id uuid NOT NULL REFERENCES accounts(id) ON DELETE RESTRICT,
  actor_type text NOT NULL,
  actor_id uuid,
  entity_type text NOT NULL,
  entity_id uuid NOT NULL,
  action text NOT NULL,
  before_json jsonb,
  after_json jsonb,
  created_at timestamptz NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_audit_logs_entity_type_entity_id
  ON audit_logs(entity_type, entity_id);

CREATE INDEX idx_audit_logs_created_at_desc
  ON audit_logs(created_at DESC);

-- ---------------------------------------------------------------------------
-- Helpful uniqueness guards
-- ---------------------------------------------------------------------------

CREATE UNIQUE INDEX uq_push_subscriptions_endpoint
  ON push_subscriptions(endpoint);

CREATE UNIQUE INDEX uq_products_account_name_active
  ON products(account_id, lower(name))
  WHERE archived_at IS NULL;

CREATE UNIQUE INDEX uq_places_account_name_active
  ON places(account_id, lower(name))
  WHERE archived_at IS NULL;

-- Optional but useful:
-- one active rule per product + plant in v1
CREATE UNIQUE INDEX uq_product_usage_rules_product_plant_active
  ON product_usage_rules(product_id, plant_id)
  WHERE archived_at IS NULL;

-- ---------------------------------------------------------------------------
-- Updated-at triggers
-- ---------------------------------------------------------------------------

CREATE TRIGGER trg_accounts_set_updated_at
BEFORE UPDATE ON accounts
FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TRIGGER trg_places_set_updated_at
BEFORE UPDATE ON places
FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TRIGGER trg_plants_set_updated_at
BEFORE UPDATE ON plants
FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TRIGGER trg_perennials_set_updated_at
BEFORE UPDATE ON perennials
FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TRIGGER trg_beds_set_updated_at
BEFORE UPDATE ON beds
FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TRIGGER trg_persistent_bed_plants_set_updated_at
BEFORE UPDATE ON persistent_bed_plants
FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TRIGGER trg_yearly_bed_plantings_set_updated_at
BEFORE UPDATE ON yearly_bed_plantings
FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TRIGGER trg_products_set_updated_at
BEFORE UPDATE ON products
FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TRIGGER trg_product_usage_rules_set_updated_at
BEFORE UPDATE ON product_usage_rules
FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TRIGGER trg_inventory_lots_set_updated_at
BEFORE UPDATE ON inventory_lots
FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TRIGGER trg_activities_set_updated_at
BEFORE UPDATE ON activities
FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TRIGGER trg_problems_set_updated_at
BEFORE UPDATE ON problems
FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TRIGGER trg_tasks_set_updated_at
BEFORE UPDATE ON tasks
FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TRIGGER trg_weather_events_set_updated_at
BEFORE UPDATE ON weather_events
FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TRIGGER trg_ai_sessions_set_updated_at
BEFORE UPDATE ON ai_sessions
FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TRIGGER trg_push_subscriptions_set_updated_at
BEFORE UPDATE ON push_subscriptions
FOR EACH ROW EXECUTE FUNCTION set_updated_at();

COMMIT;
