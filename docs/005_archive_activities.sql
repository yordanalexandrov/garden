BEGIN;

ALTER TABLE activities ADD COLUMN is_archived BOOLEAN NOT NULL DEFAULT FALSE;

-- Recreate activity_detail_view to expose is_archived and exclude archived activities
CREATE OR REPLACE VIEW activity_detail_view AS
SELECT
    a.id,
    a.account_id,
    a.place_id,
    a.type,
    a.performed_at,
    a.target_scope_type,
    a.notes,
    a.created_at,
    a.updated_at,
    a.is_archived,
    count(DISTINCT at.id) AS target_count,
    count(DISTINCT apu.id) AS product_usage_count,
    count(DISTINCT im.id) AS inventory_movement_count,
    count(DISTINCT qp.id) AS quarantine_count,
    count(DISTINCT t.id) AS followup_task_count
FROM activities a
LEFT JOIN activity_targets at ON at.activity_id = a.id
LEFT JOIN activity_product_usages apu ON apu.activity_id = a.id
LEFT JOIN inventory_movements im ON im.activity_id = a.id
LEFT JOIN quarantine_periods qp ON qp.activity_id = a.id
LEFT JOIN tasks t ON t.source_type = 'activity' AND t.source_reference_id = a.id
WHERE a.is_archived = FALSE
GROUP BY
    a.id,
    a.account_id,
    a.place_id,
    a.type,
    a.performed_at,
    a.target_scope_type,
    a.notes,
    a.created_at,
    a.updated_at,
    a.is_archived;

-- Recreate calendar_items_view to exclude archived activities
CREATE OR REPLACE VIEW calendar_items_view AS
SELECT
    'activity'::text AS item_type,
    a.id AS item_id,
    a.account_id,
    a.place_id,
    a.type AS title,
    a.notes,
    a.performed_at::date AS starts_on,
    a.performed_at::date AS ends_on,
    a.performed_at AS starts_at,
    a.performed_at AS ends_at,
    null::text AS status
FROM activities a
WHERE a.is_archived = FALSE

UNION ALL

SELECT
    'task'::text AS item_type,
    t.id AS item_id,
    t.account_id,
    t.place_id,
    t.type AS title,
    t.notes,
    t.due_date AS starts_on,
    t.due_date AS ends_on,
    null::timestamptz AS starts_at,
    null::timestamptz AS ends_at,
    t.status
FROM tasks t

UNION ALL

SELECT
    'quarantine'::text AS item_type,
    qp.id AS item_id,
    qp.account_id,
    qp.place_id,
    'quarantine'::text AS title,
    qp.notes,
    qp.starts_on,
    qp.ends_on,
    null::timestamptz AS starts_at,
    null::timestamptz AS ends_at,
    null::text AS status
FROM quarantine_periods qp

UNION ALL

SELECT
    'weather'::text AS item_type,
    we.id AS item_id,
    we.account_id,
    we.place_id,
    we.event_type AS title,
    null::text AS notes,
    coalesce(t.due_date, a.performed_at::date, we.created_at::date) AS starts_on,
    coalesce(t.due_date, a.performed_at::date, we.created_at::date) AS ends_on,
    a.performed_at AS starts_at,
    a.performed_at AS ends_at,
    we.user_confirmation_status AS status
FROM weather_events we
LEFT JOIN tasks t ON we.related_entity_type = 'task' AND t.id = we.related_entity_id
LEFT JOIN activities a ON we.related_entity_type = 'activity' AND a.id = we.related_entity_id AND a.is_archived = FALSE;

COMMIT;
