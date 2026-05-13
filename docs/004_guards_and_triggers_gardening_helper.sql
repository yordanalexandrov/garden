-- 004_guards_and_triggers.sql
-- Gardening Helper
-- Pragmatic database guards and triggers for v1.
-- These enforce account/place consistency and safe reminder generation boundaries
-- without turning the database into the whole application layer.

begin;

-- ---------------------------------------------------------------------------
-- helper functions
-- ---------------------------------------------------------------------------

create or replace function _gh_raise(message text)
returns void
language plpgsql
as $$
begin
    raise exception using message = message;
end;
$$;

create or replace function _gh_same_account_or_fail(
    expected_account_id uuid,
    actual_account_id uuid,
    context_message text
)
returns void
language plpgsql
as $$
begin
    if expected_account_id is distinct from actual_account_id then
        raise exception '%', context_message
            using errcode = '23514';
    end if;
end;
$$;

-- ---------------------------------------------------------------------------
-- product_usage_rules must match account of product and plant
-- ---------------------------------------------------------------------------
create or replace function trg_product_usage_rules_validate_accounts()
returns trigger
language plpgsql
as $$
declare
    v_product_account_id uuid;
    v_plant_account_id uuid;
begin
    select account_id into v_product_account_id
    from products
    where id = new.product_id;

    if v_product_account_id is null then
        raise exception 'product_usage_rules.product_id does not exist';
    end if;

    select account_id into v_plant_account_id
    from plants
    where id = new.plant_id;

    if v_plant_account_id is null then
        raise exception 'product_usage_rules.plant_id does not exist';
    end if;

    perform _gh_same_account_or_fail(new.account_id, v_product_account_id, 'product_usage_rule.account_id must match product.account_id');
    perform _gh_same_account_or_fail(new.account_id, v_plant_account_id, 'product_usage_rule.account_id must match plant.account_id');

    return new;
end;
$$;

drop trigger if exists trg_product_usage_rules_validate_accounts on product_usage_rules;
create trigger trg_product_usage_rules_validate_accounts
before insert or update on product_usage_rules
for each row
execute function trg_product_usage_rules_validate_accounts();

-- ---------------------------------------------------------------------------
-- perennials must belong to same account/place/plant
-- ---------------------------------------------------------------------------
create or replace function trg_perennials_validate_consistency()
returns trigger
language plpgsql
as $$
declare
    v_place_account_id uuid;
    v_plant_account_id uuid;
begin
    select account_id into v_place_account_id
    from places
    where id = new.place_id;

    if v_place_account_id is null then
        raise exception 'perennials.place_id does not exist';
    end if;

    select account_id into v_plant_account_id
    from plants
    where id = new.plant_id;

    if v_plant_account_id is null then
        raise exception 'perennials.plant_id does not exist';
    end if;

    perform _gh_same_account_or_fail(new.account_id, v_place_account_id, 'perennial.account_id must match place.account_id');
    perform _gh_same_account_or_fail(new.account_id, v_plant_account_id, 'perennial.account_id must match plant.account_id');

    return new;
end;
$$;

drop trigger if exists trg_perennials_validate_consistency on perennials;
create trigger trg_perennials_validate_consistency
before insert or update on perennials
for each row
execute function trg_perennials_validate_consistency();

-- ---------------------------------------------------------------------------
-- beds must belong to same account as place
-- ---------------------------------------------------------------------------
create or replace function trg_beds_validate_consistency()
returns trigger
language plpgsql
as $$
declare
    v_place_account_id uuid;
begin
    select account_id into v_place_account_id
    from places
    where id = new.place_id;

    if v_place_account_id is null then
        raise exception 'beds.place_id does not exist';
    end if;

    perform _gh_same_account_or_fail(new.account_id, v_place_account_id, 'bed.account_id must match place.account_id');

    return new;
end;
$$;

drop trigger if exists trg_beds_validate_consistency on beds;
create trigger trg_beds_validate_consistency
before insert or update on beds
for each row
execute function trg_beds_validate_consistency();

-- ---------------------------------------------------------------------------
-- persistent_bed_plants must match bed and plant account
-- ---------------------------------------------------------------------------
create or replace function trg_persistent_bed_plants_validate_consistency()
returns trigger
language plpgsql
as $$
declare
    v_bed_account_id uuid;
    v_plant_account_id uuid;
begin
    select account_id into v_bed_account_id
    from beds
    where id = new.bed_id;

    if v_bed_account_id is null then
        raise exception 'persistent_bed_plants.bed_id does not exist';
    end if;

    select account_id into v_plant_account_id
    from plants
    where id = new.plant_id;

    if v_plant_account_id is null then
        raise exception 'persistent_bed_plants.plant_id does not exist';
    end if;

    perform _gh_same_account_or_fail(new.account_id, v_bed_account_id, 'persistent_bed_plant.account_id must match bed.account_id');
    perform _gh_same_account_or_fail(new.account_id, v_plant_account_id, 'persistent_bed_plant.account_id must match plant.account_id');

    return new;
end;
$$;

drop trigger if exists trg_persistent_bed_plants_validate_consistency on persistent_bed_plants;
create trigger trg_persistent_bed_plants_validate_consistency
before insert or update on persistent_bed_plants
for each row
execute function trg_persistent_bed_plants_validate_consistency();

-- ---------------------------------------------------------------------------
-- yearly_bed_plantings must match bed and plant account
-- ---------------------------------------------------------------------------
create or replace function trg_yearly_bed_plantings_validate_consistency()
returns trigger
language plpgsql
as $$
declare
    v_bed_account_id uuid;
    v_plant_account_id uuid;
begin
    select account_id into v_bed_account_id
    from beds
    where id = new.bed_id;

    if v_bed_account_id is null then
        raise exception 'yearly_bed_plantings.bed_id does not exist';
    end if;

    select account_id into v_plant_account_id
    from plants
    where id = new.plant_id;

    if v_plant_account_id is null then
        raise exception 'yearly_bed_plantings.plant_id does not exist';
    end if;

    perform _gh_same_account_or_fail(new.account_id, v_bed_account_id, 'yearly_bed_planting.account_id must match bed.account_id');
    perform _gh_same_account_or_fail(new.account_id, v_plant_account_id, 'yearly_bed_planting.account_id must match plant.account_id');

    return new;
end;
$$;

drop trigger if exists trg_yearly_bed_plantings_validate_consistency on yearly_bed_plantings;
create trigger trg_yearly_bed_plantings_validate_consistency
before insert or update on yearly_bed_plantings
for each row
execute function trg_yearly_bed_plantings_validate_consistency();

-- ---------------------------------------------------------------------------
-- inventory_lots must match product account
-- ---------------------------------------------------------------------------
create or replace function trg_inventory_lots_validate_consistency()
returns trigger
language plpgsql
as $$
declare
    v_product_account_id uuid;
begin
    select account_id into v_product_account_id
    from products
    where id = new.product_id;

    if v_product_account_id is null then
        raise exception 'inventory_lots.product_id does not exist';
    end if;

    perform _gh_same_account_or_fail(new.account_id, v_product_account_id, 'inventory_lot.account_id must match product.account_id');

    return new;
end;
$$;

drop trigger if exists trg_inventory_lots_validate_consistency on inventory_lots;
create trigger trg_inventory_lots_validate_consistency
before insert or update on inventory_lots
for each row
execute function trg_inventory_lots_validate_consistency();

-- ---------------------------------------------------------------------------
-- inventory_movements must match product/lot/activity account where present
-- ---------------------------------------------------------------------------
create or replace function trg_inventory_movements_validate_consistency()
returns trigger
language plpgsql
as $$
declare
    v_product_account_id uuid;
    v_lot_account_id uuid;
    v_lot_product_id uuid;
    v_activity_account_id uuid;
begin
    select account_id into v_product_account_id
    from products
    where id = new.product_id;

    if v_product_account_id is null then
        raise exception 'inventory_movements.product_id does not exist';
    end if;

    perform _gh_same_account_or_fail(new.account_id, v_product_account_id, 'inventory_movement.account_id must match product.account_id');

    if new.inventory_lot_id is not null then
        select account_id, product_id into v_lot_account_id, v_lot_product_id
        from inventory_lots
        where id = new.inventory_lot_id;

        if v_lot_account_id is null then
            raise exception 'inventory_movements.inventory_lot_id does not exist';
        end if;

        perform _gh_same_account_or_fail(new.account_id, v_lot_account_id, 'inventory_movement.account_id must match inventory_lot.account_id');

        if v_lot_product_id <> new.product_id then
            raise exception 'inventory_movement.inventory_lot_id must belong to product_id'
                using errcode = '23514';
        end if;
    end if;

    if new.activity_id is not null then
        select account_id into v_activity_account_id
        from activities
        where id = new.activity_id;

        if v_activity_account_id is null then
            raise exception 'inventory_movements.activity_id does not exist';
        end if;

        perform _gh_same_account_or_fail(new.account_id, v_activity_account_id, 'inventory_movement.account_id must match activity.account_id');
    end if;

    return new;
end;
$$;

drop trigger if exists trg_inventory_movements_validate_consistency on inventory_movements;
create trigger trg_inventory_movements_validate_consistency
before insert or update on inventory_movements
for each row
execute function trg_inventory_movements_validate_consistency();

-- ---------------------------------------------------------------------------
-- activities place/account consistency
-- ---------------------------------------------------------------------------
create or replace function trg_activities_validate_consistency()
returns trigger
language plpgsql
as $$
declare
    v_place_account_id uuid;
begin
    if new.place_id is not null then
        select account_id into v_place_account_id
        from places
        where id = new.place_id;

        if v_place_account_id is null then
            raise exception 'activities.place_id does not exist';
        end if;

        perform _gh_same_account_or_fail(new.account_id, v_place_account_id, 'activity.account_id must match place.account_id');
    end if;

    return new;
end;
$$;

drop trigger if exists trg_activities_validate_consistency on activities;
create trigger trg_activities_validate_consistency
before insert or update on activities
for each row
execute function trg_activities_validate_consistency();

-- ---------------------------------------------------------------------------
-- activity_targets target consistency
-- ---------------------------------------------------------------------------
create or replace function trg_activity_targets_validate_consistency()
returns trigger
language plpgsql
as $$
declare
    v_activity_account_id uuid;
    v_activity_place_id uuid;
    v_target_account_id uuid;
    v_target_place_id uuid;
begin
    select account_id, place_id
      into v_activity_account_id, v_activity_place_id
    from activities
    where id = new.activity_id;

    if v_activity_account_id is null then
        raise exception 'activity_targets.activity_id does not exist';
    end if;

    if new.target_type = 'place' then
        select account_id, id into v_target_account_id, v_target_place_id
        from places where id = new.target_id;
    elseif new.target_type = 'perennial' then
        select account_id, place_id into v_target_account_id, v_target_place_id
        from perennials where id = new.target_id;
    elseif new.target_type = 'bed' then
        select account_id, place_id into v_target_account_id, v_target_place_id
        from beds where id = new.target_id;
    elseif new.target_type = 'yearly_bed_planting' then
        select y.account_id, b.place_id into v_target_account_id, v_target_place_id
        from yearly_bed_plantings y
        join beds b on b.id = y.bed_id
        where y.id = new.target_id;
    elseif new.target_type = 'persistent_bed_plant' then
        select p.account_id, b.place_id into v_target_account_id, v_target_place_id
        from persistent_bed_plants p
        join beds b on b.id = p.bed_id
        where p.id = new.target_id;
    else
        raise exception 'Unsupported activity target_type: %', new.target_type;
    end if;

    if v_target_account_id is null then
        raise exception 'activity_targets.target_id does not exist for target_type %', new.target_type;
    end if;

    perform _gh_same_account_or_fail(v_activity_account_id, v_target_account_id, 'activity target must belong to same account as activity');

    if v_activity_place_id is not null and v_target_place_id is distinct from v_activity_place_id then
        raise exception 'activity target must belong to same place as activity.place_id'
            using errcode = '23514';
    end if;

    return new;
end;
$$;

drop trigger if exists trg_activity_targets_validate_consistency on activity_targets;
create trigger trg_activity_targets_validate_consistency
before insert or update on activity_targets
for each row
execute function trg_activity_targets_validate_consistency();

create unique index if not exists ux_activity_targets_unique
    on activity_targets (activity_id, target_type, target_id);

-- ---------------------------------------------------------------------------
-- activity_product_usages consistency
-- ---------------------------------------------------------------------------
create or replace function trg_activity_product_usages_validate_consistency()
returns trigger
language plpgsql
as $$
declare
    v_activity_account_id uuid;
    v_product_account_id uuid;
    v_rule_product_id uuid;
begin
    select account_id into v_activity_account_id
    from activities
    where id = new.activity_id;

    if v_activity_account_id is null then
        raise exception 'activity_product_usages.activity_id does not exist';
    end if;

    select account_id into v_product_account_id
    from products
    where id = new.product_id;

    if v_product_account_id is null then
        raise exception 'activity_product_usages.product_id does not exist';
    end if;

    perform _gh_same_account_or_fail(v_activity_account_id, v_product_account_id, 'activity product usage must belong to same account as activity');

    if new.product_usage_rule_id is not null then
        select product_id into v_rule_product_id
        from product_usage_rules
        where id = new.product_usage_rule_id;

        if v_rule_product_id is null then
            raise exception 'activity_product_usages.product_usage_rule_id does not exist';
        end if;

        if v_rule_product_id <> new.product_id then
            raise exception 'activity_product_usages.product_usage_rule_id must belong to same product'
                using errcode = '23514';
        end if;
    end if;

    return new;
end;
$$;

drop trigger if exists trg_activity_product_usages_validate_consistency on activity_product_usages;
create trigger trg_activity_product_usages_validate_consistency
before insert or update on activity_product_usages
for each row
execute function trg_activity_product_usages_validate_consistency();

-- ---------------------------------------------------------------------------
-- problems consistency
-- ---------------------------------------------------------------------------
create or replace function trg_problems_validate_consistency()
returns trigger
language plpgsql
as $$
declare
    v_place_account_id uuid;
    v_target_account_id uuid;
    v_target_place_id uuid;
    v_linked_activity_account_id uuid;
    v_linked_activity_place_id uuid;
begin
    select account_id into v_place_account_id
    from places
    where id = new.place_id;

    if v_place_account_id is null then
        raise exception 'problems.place_id does not exist';
    end if;

    perform _gh_same_account_or_fail(new.account_id, v_place_account_id, 'problem.account_id must match place.account_id');

    if new.target_type = 'place' then
        select account_id, id into v_target_account_id, v_target_place_id
        from places where id = new.target_id;
    elseif new.target_type = 'perennial' then
        select account_id, place_id into v_target_account_id, v_target_place_id
        from perennials where id = new.target_id;
    elseif new.target_type = 'bed' then
        select account_id, place_id into v_target_account_id, v_target_place_id
        from beds where id = new.target_id;
    elseif new.target_type = 'yearly_bed_planting' then
        select y.account_id, b.place_id into v_target_account_id, v_target_place_id
        from yearly_bed_plantings y
        join beds b on b.id = y.bed_id
        where y.id = new.target_id;
    elseif new.target_type = 'persistent_bed_plant' then
        select p.account_id, b.place_id into v_target_account_id, v_target_place_id
        from persistent_bed_plants p
        join beds b on b.id = p.bed_id
        where p.id = new.target_id;
    else
        raise exception 'Unsupported problems target_type: %', new.target_type;
    end if;

    if v_target_account_id is null then
        raise exception 'problems.target_id does not exist for target_type %', new.target_type;
    end if;

    perform _gh_same_account_or_fail(new.account_id, v_target_account_id, 'problem target must belong to same account as problem');

    if v_target_place_id is distinct from new.place_id then
        raise exception 'problem target must belong to same place as problems.place_id'
            using errcode = '23514';
    end if;

    if new.linked_activity_id is not null then
        select account_id, place_id into v_linked_activity_account_id, v_linked_activity_place_id
        from activities
        where id = new.linked_activity_id;

        if v_linked_activity_account_id is null then
            raise exception 'problems.linked_activity_id does not exist';
        end if;

        perform _gh_same_account_or_fail(new.account_id, v_linked_activity_account_id, 'problem.account_id must match linked activity account_id');

        if v_linked_activity_place_id is not null and v_linked_activity_place_id is distinct from new.place_id then
            raise exception 'problem linked activity must belong to same place as problem'
                using errcode = '23514';
        end if;
    end if;

    return new;
end;
$$;

drop trigger if exists trg_problems_validate_consistency on problems;
create trigger trg_problems_validate_consistency
before insert or update on problems
for each row
execute function trg_problems_validate_consistency();

-- ---------------------------------------------------------------------------
-- problem_photos are allowed only for problem records, not observations
-- ---------------------------------------------------------------------------
create or replace function trg_problem_photos_validate_consistency()
returns trigger
language plpgsql
as $$
declare
    v_problem_type text;
begin
    select type into v_problem_type
    from problems
    where id = new.problem_id;

    if v_problem_type is null then
        raise exception 'problem_photos.problem_id does not exist';
    end if;

    if v_problem_type <> 'problem' then
        raise exception 'problem photos may only be attached to problems'
            using errcode = '23514';
    end if;

    return new;
end;
$$;

drop trigger if exists trg_problem_photos_validate_consistency on problem_photos;
create trigger trg_problem_photos_validate_consistency
before insert or update on problem_photos
for each row
execute function trg_problem_photos_validate_consistency();

-- ---------------------------------------------------------------------------
-- tasks consistency
-- ---------------------------------------------------------------------------
create or replace function trg_tasks_validate_consistency()
returns trigger
language plpgsql
as $$
declare
    v_place_account_id uuid;
begin
    if new.place_id is not null then
        select account_id into v_place_account_id
        from places
        where id = new.place_id;

        if v_place_account_id is null then
            raise exception 'tasks.place_id does not exist';
        end if;

        perform _gh_same_account_or_fail(new.account_id, v_place_account_id, 'task.account_id must match place.account_id');
    end if;

    if new.status = 'planned' and new.confirmed_at is null then
        raise exception 'planned tasks must have confirmed_at'
            using errcode = '23514';
    end if;

    if new.status = 'done' and new.completed_at is null then
        raise exception 'done tasks must have completed_at'
            using errcode = '23514';
    end if;

    return new;
end;
$$;

drop trigger if exists trg_tasks_validate_consistency on tasks;
create trigger trg_tasks_validate_consistency
before insert or update on tasks
for each row
execute function trg_tasks_validate_consistency();

-- ---------------------------------------------------------------------------
-- task_targets target consistency
-- ---------------------------------------------------------------------------
create or replace function trg_task_targets_validate_consistency()
returns trigger
language plpgsql
as $$
declare
    v_task_account_id uuid;
    v_task_place_id uuid;
    v_target_account_id uuid;
    v_target_place_id uuid;
begin
    select account_id, place_id
      into v_task_account_id, v_task_place_id
    from tasks
    where id = new.task_id;

    if v_task_account_id is null then
        raise exception 'task_targets.task_id does not exist';
    end if;

    if new.target_type = 'place' then
        select account_id, id into v_target_account_id, v_target_place_id
        from places where id = new.target_id;
    elseif new.target_type = 'perennial' then
        select account_id, place_id into v_target_account_id, v_target_place_id
        from perennials where id = new.target_id;
    elseif new.target_type = 'bed' then
        select account_id, place_id into v_target_account_id, v_target_place_id
        from beds where id = new.target_id;
    elseif new.target_type = 'yearly_bed_planting' then
        select y.account_id, b.place_id into v_target_account_id, v_target_place_id
        from yearly_bed_plantings y
        join beds b on b.id = y.bed_id
        where y.id = new.target_id;
    elseif new.target_type = 'persistent_bed_plant' then
        select p.account_id, b.place_id into v_target_account_id, v_target_place_id
        from persistent_bed_plants p
        join beds b on b.id = p.bed_id
        where p.id = new.target_id;
    else
        raise exception 'Unsupported task target_type: %', new.target_type;
    end if;

    if v_target_account_id is null then
        raise exception 'task_targets.target_id does not exist for target_type %', new.target_type;
    end if;

    perform _gh_same_account_or_fail(v_task_account_id, v_target_account_id, 'task target must belong to same account as task');

    if v_task_place_id is not null and v_target_place_id is distinct from v_task_place_id then
        raise exception 'task target must belong to same place as task.place_id'
            using errcode = '23514';
    end if;

    return new;
end;
$$;

drop trigger if exists trg_task_targets_validate_consistency on task_targets;
create trigger trg_task_targets_validate_consistency
before insert or update on task_targets
for each row
execute function trg_task_targets_validate_consistency();

create unique index if not exists ux_task_targets_unique
    on task_targets (task_id, target_type, target_id);

-- ---------------------------------------------------------------------------
-- task_reminders validation
-- planned tasks only
-- ---------------------------------------------------------------------------
create or replace function trg_task_reminders_validate_consistency()
returns trigger
language plpgsql
as $$
declare
    v_task_status text;
begin
    select status into v_task_status
    from tasks
    where id = new.task_id;

    if v_task_status is null then
        raise exception 'task_reminders.task_id does not exist';
    end if;

    if v_task_status <> 'planned' then
        raise exception 'task reminders may only be attached to planned tasks'
            using errcode = '23514';
    end if;

    return new;
end;
$$;

drop trigger if exists trg_task_reminders_validate_consistency on task_reminders;
create trigger trg_task_reminders_validate_consistency
before insert or update on task_reminders
for each row
execute function trg_task_reminders_validate_consistency();

create unique index if not exists ux_task_reminders_unique
    on task_reminders (task_id, reminder_type);

-- ---------------------------------------------------------------------------
-- quarantine consistency
-- ---------------------------------------------------------------------------
create or replace function trg_quarantine_periods_validate_consistency()
returns trigger
language plpgsql
as $$
declare
    v_activity_account_id uuid;
    v_activity_place_id uuid;
    v_usage_activity_id uuid;
    v_usage_product_id uuid;
    v_product_account_id uuid;
begin
    if new.ends_on < new.starts_on then
        raise exception 'quarantine_periods.ends_on must be >= starts_on'
            using errcode = '23514';
    end if;

    select account_id, place_id into v_activity_account_id, v_activity_place_id
    from activities
    where id = new.activity_id;

    if v_activity_account_id is null then
        raise exception 'quarantine_periods.activity_id does not exist';
    end if;

    perform _gh_same_account_or_fail(new.account_id, v_activity_account_id, 'quarantine_period.account_id must match activity.account_id');

    if new.place_id is not null and new.place_id is distinct from v_activity_place_id then
        raise exception 'quarantine_period.place_id must match activity.place_id'
            using errcode = '23514';
    end if;

    select activity_id, product_id into v_usage_activity_id, v_usage_product_id
    from activity_product_usages
    where id = new.activity_product_usage_id;

    if v_usage_activity_id is null then
        raise exception 'quarantine_periods.activity_product_usage_id does not exist';
    end if;

    if v_usage_activity_id <> new.activity_id then
        raise exception 'quarantine_period.activity_product_usage_id must belong to same activity'
            using errcode = '23514';
    end if;

    if v_usage_product_id <> new.product_id then
        raise exception 'quarantine_period.product_id must match activity product usage product_id'
            using errcode = '23514';
    end if;

    select account_id into v_product_account_id
    from products
    where id = new.product_id;

    if v_product_account_id is null then
        raise exception 'quarantine_periods.product_id does not exist';
    end if;

    perform _gh_same_account_or_fail(new.account_id, v_product_account_id, 'quarantine_period.account_id must match product.account_id');

    return new;
end;
$$;

drop trigger if exists trg_quarantine_periods_validate_consistency on quarantine_periods;
create trigger trg_quarantine_periods_validate_consistency
before insert or update on quarantine_periods
for each row
execute function trg_quarantine_periods_validate_consistency();

-- ---------------------------------------------------------------------------
-- weather_events consistency
-- ---------------------------------------------------------------------------
create or replace function trg_weather_events_validate_consistency()
returns trigger
language plpgsql
as $$
declare
    v_place_account_id uuid;
    v_entity_account_id uuid;
    v_entity_place_id uuid;
begin
    select account_id into v_place_account_id
    from places
    where id = new.place_id;

    if v_place_account_id is null then
        raise exception 'weather_events.place_id does not exist';
    end if;

    perform _gh_same_account_or_fail(new.account_id, v_place_account_id, 'weather_event.account_id must match place.account_id');

    if new.related_entity_type = 'task' then
        select account_id, place_id into v_entity_account_id, v_entity_place_id
        from tasks
        where id = new.related_entity_id;
    elseif new.related_entity_type = 'activity' then
        select account_id, place_id into v_entity_account_id, v_entity_place_id
        from activities
        where id = new.related_entity_id;
    else
        raise exception 'Unsupported weather related_entity_type: %', new.related_entity_type;
    end if;

    if v_entity_account_id is null then
        raise exception 'weather_events.related_entity_id does not exist';
    end if;

    perform _gh_same_account_or_fail(new.account_id, v_entity_account_id, 'weather_event related entity must belong to same account');

    if v_entity_place_id is not null and v_entity_place_id is distinct from new.place_id then
        raise exception 'weather_event.place_id must match related entity place_id'
            using errcode = '23514';
    end if;

    return new;
end;
$$;

drop trigger if exists trg_weather_events_validate_consistency on weather_events;
create trigger trg_weather_events_validate_consistency
before insert or update on weather_events
for each row
execute function trg_weather_events_validate_consistency();

-- ---------------------------------------------------------------------------
-- push_subscriptions avoid duplicate active endpoint rows per account
-- ---------------------------------------------------------------------------
create unique index if not exists ux_push_subscriptions_active_endpoint
    on push_subscriptions (account_id, endpoint)
    where is_active = true;

commit;
