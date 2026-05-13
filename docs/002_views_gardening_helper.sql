-- 002_views.sql
-- Gardening Helper
-- Read-oriented views only. No hidden truth mutation.

begin;

-- ---------------------------------------------------------------------------
-- inventory_product_balances
-- Current stock summary per product based on lots.
-- This is a convenience read model, not the ledger truth.
-- ---------------------------------------------------------------------------
create or replace view inventory_product_balances as
select
    p.id as product_id,
    p.account_id,
    p.name as product_name,
    p.category,
    p.default_unit,
    coalesce(sum(il.quantity_remaining), 0)::numeric as quantity_remaining,
    count(il.id) filter (where il.archived_at is null) as active_lot_count,
    min(il.expiry_date) filter (
        where il.archived_at is null
          and il.quantity_remaining > 0
          and il.expiry_date is not null
    ) as next_expiry_date
from products p
left join inventory_lots il
    on il.product_id = p.id
   and il.archived_at is null
where p.archived_at is null
group by
    p.id,
    p.account_id,
    p.name,
    p.category,
    p.default_unit;

-- ---------------------------------------------------------------------------
-- bed_current_contents
-- Unified current contents of beds from persistent plants and yearly plantings.
-- Uses current calendar year for yearly rows.
-- ---------------------------------------------------------------------------
create or replace view bed_current_contents as
select
    b.id as bed_id,
    b.account_id,
    b.place_id,
    'persistent_bed_plant'::text as source_type,
    pbp.id as source_id,
    pbp.plant_id,
    pl.common_name,
    pl.variety,
    pbp.quantity,
    pbp.notes,
    pbp.status,
    null::int as year
from beds b
join persistent_bed_plants pbp
    on pbp.bed_id = b.id
   and pbp.archived_at is null
join plants pl
    on pl.id = pbp.plant_id
   and pl.archived_at is null
where b.archived_at is null
  and pbp.status = 'active'

union all

select
    b.id as bed_id,
    b.account_id,
    b.place_id,
    'yearly_bed_planting'::text as source_type,
    ybp.id as source_id,
    ybp.plant_id,
    pl.common_name,
    pl.variety,
    ybp.quantity,
    ybp.notes,
    ybp.status,
    ybp.year
from beds b
join yearly_bed_plantings ybp
    on ybp.bed_id = b.id
   and ybp.archived_at is null
join plants pl
    on pl.id = ybp.plant_id
   and pl.archived_at is null
where b.archived_at is null
  and ybp.year = extract(year from current_date)::int
  and ybp.status in ('planned', 'planted', 'harvested');

-- ---------------------------------------------------------------------------
-- active_quarantine_periods
-- Convenience view for quarantine windows that overlap today.
-- ---------------------------------------------------------------------------
create or replace view active_quarantine_periods as
select
    qp.*,
    (current_date between qp.starts_on and qp.ends_on) as is_active_today
from quarantine_periods qp
where current_date <= qp.ends_on;

-- ---------------------------------------------------------------------------
-- activity_detail_view
-- Flattened activity header with counts and generated side-effect counts.
-- ---------------------------------------------------------------------------
create or replace view activity_detail_view as
select
    a.id,
    a.account_id,
    a.place_id,
    a.type,
    a.performed_at,
    a.target_scope_type,
    a.notes,
    a.created_at,
    a.updated_at,
    count(distinct at.id) as target_count,
    count(distinct apu.id) as product_usage_count,
    count(distinct im.id) as inventory_movement_count,
    count(distinct qp.id) as quarantine_count,
    count(distinct t.id) as followup_task_count
from activities a
left join activity_targets at
    on at.activity_id = a.id
left join activity_product_usages apu
    on apu.activity_id = a.id
left join inventory_movements im
    on im.activity_id = a.id
left join quarantine_periods qp
    on qp.activity_id = a.id
left join tasks t
    on t.source_type = 'activity'
   and t.source_reference_id = a.id
group by
    a.id,
    a.account_id,
    a.place_id,
    a.type,
    a.performed_at,
    a.target_scope_type,
    a.notes,
    a.created_at,
    a.updated_at;

-- ---------------------------------------------------------------------------
-- task_detail_view
-- Flattened task view with target/reminder counts.
-- ---------------------------------------------------------------------------
create or replace view task_detail_view as
select
    t.id,
    t.account_id,
    t.place_id,
    t.type,
    t.due_date,
    t.notes,
    t.source_type,
    t.source_reference_id,
    t.status,
    t.created_at,
    t.updated_at,
    t.confirmed_at,
    t.completed_at,
    count(distinct tt.id) as target_count,
    count(distinct tr.id) as reminder_count,
    min(tr.scheduled_for) filter (where tr.status = 'scheduled') as next_reminder_at
from tasks t
left join task_targets tt
    on tt.task_id = t.id
left join task_reminders tr
    on tr.task_id = t.id
group by
    t.id,
    t.account_id,
    t.place_id,
    t.type,
    t.due_date,
    t.notes,
    t.source_type,
    t.source_reference_id,
    t.status,
    t.created_at,
    t.updated_at,
    t.confirmed_at,
    t.completed_at;

-- ---------------------------------------------------------------------------
-- calendar_items_view
-- Unified read model for calendar aggregation.
-- item_type: activity | task | quarantine
-- ---------------------------------------------------------------------------
create or replace view calendar_items_view as
select
    'activity'::text as item_type,
    a.id as item_id,
    a.account_id,
    a.place_id,
    a.type as title,
    a.notes,
    a.performed_at::date as starts_on,
    a.performed_at::date as ends_on,
    a.performed_at as starts_at,
    a.performed_at as ends_at,
    null::text as status
from activities a

union all

select
    'task'::text as item_type,
    t.id as item_id,
    t.account_id,
    t.place_id,
    t.type as title,
    t.notes,
    t.due_date as starts_on,
    t.due_date as ends_on,
    null::timestamptz as starts_at,
    null::timestamptz as ends_at,
    t.status
from tasks t

union all

select
    'quarantine'::text as item_type,
    qp.id as item_id,
    qp.account_id,
    qp.place_id,
    'quarantine'::text as title,
    qp.notes,
    qp.starts_on,
    qp.ends_on,
    null::timestamptz as starts_at,
    null::timestamptz as ends_at,
    null::text as status
from quarantine_periods qp;

commit;
