-- 003_seed_reference_data.sql
-- Gardening Helper
-- Minimal seed data for local/dev bootstrap and reference consistency.

begin;

-- ---------------------------------------------------------------------------
-- bootstrap account
-- v1 is single-user oriented; this seed is convenient for local/dev only.
-- ---------------------------------------------------------------------------
insert into accounts (id, email, display_name, created_at, updated_at)
values (
    '00000000-0000-0000-0000-000000000001',
    'demo@example.com',
    'Demo Gardener',
    now(),
    now()
)
on conflict (id) do nothing;

-- ---------------------------------------------------------------------------
-- reference plants
-- user-maintained in real use, but these seeds help local demos/tests
-- ---------------------------------------------------------------------------
insert into plants (
    id,
    account_id,
    common_name,
    variety,
    plant_category,
    lifecycle_type,
    growing_style,
    notes,
    created_at,
    updated_at
)
values
    ('10000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000001', 'Tomato', null, 'vegetable', 'annual', 'vegetable', null, now(), now()),
    ('10000000-0000-0000-0000-000000000002', '00000000-0000-0000-0000-000000000001', 'Pepper', null, 'vegetable', 'annual', 'vegetable', null, now(), now()),
    ('10000000-0000-0000-0000-000000000003', '00000000-0000-0000-0000-000000000001', 'Cucumber', null, 'vegetable', 'annual', 'vegetable', null, now(), now()),
    ('10000000-0000-0000-0000-000000000004', '00000000-0000-0000-0000-000000000001', 'Basil', null, 'herb', 'annual', 'herb', null, now(), now()),
    ('10000000-0000-0000-0000-000000000005', '00000000-0000-0000-0000-000000000001', 'Strawberry', null, 'berry', 'perennial', 'berry', null, now(), now()),
    ('10000000-0000-0000-0000-000000000006', '00000000-0000-0000-0000-000000000001', 'Apple', null, 'fruit_tree', 'perennial', 'tree', null, now(), now()),
    ('10000000-0000-0000-0000-000000000007', '00000000-0000-0000-0000-000000000001', 'Pear', null, 'fruit_tree', 'perennial', 'tree', null, now(), now()),
    ('10000000-0000-0000-0000-000000000008', '00000000-0000-0000-0000-000000000001', 'Grape Vine', null, 'vine', 'perennial', 'vine', null, now(), now())
on conflict (id) do nothing;

-- ---------------------------------------------------------------------------
-- demo place / beds / perennials
-- helpful for UI and migration smoke tests
-- ---------------------------------------------------------------------------
insert into places (
    id,
    account_id,
    name,
    description,
    weather_enabled,
    weather_location_label,
    timezone,
    created_at,
    updated_at
)
values
    (
        '20000000-0000-0000-0000-000000000001',
        '00000000-0000-0000-0000-000000000001',
        'Home Garden',
        'Seeded demo place',
        true,
        'Ruse, Bulgaria',
        'Europe/Sofia',
        now(),
        now()
    )
on conflict (id) do nothing;

insert into beds (
    id,
    account_id,
    place_id,
    name,
    description,
    width_m,
    length_m,
    area_m2,
    status,
    created_at,
    updated_at
)
values
    (
        '30000000-0000-0000-0000-000000000001',
        '00000000-0000-0000-0000-000000000001',
        '20000000-0000-0000-0000-000000000001',
        'Bed A',
        'Seeded demo bed',
        1.2,
        4.0,
        4.8,
        'active',
        now(),
        now()
    ),
    (
        '30000000-0000-0000-0000-000000000002',
        '00000000-0000-0000-0000-000000000001',
        '20000000-0000-0000-0000-000000000001',
        'Bed B',
        'Seeded demo bed',
        1.2,
        3.0,
        3.6,
        'active',
        now(),
        now()
    )
on conflict (id) do nothing;

insert into perennials (
    id,
    account_id,
    place_id,
    plant_id,
    label,
    planted_year,
    notes,
    status,
    created_at,
    updated_at
)
values
    (
        '40000000-0000-0000-0000-000000000001',
        '00000000-0000-0000-0000-000000000001',
        '20000000-0000-0000-0000-000000000001',
        '10000000-0000-0000-0000-000000000006',
        'Apple Tree 1',
        2022,
        null,
        'active',
        now(),
        now()
    ),
    (
        '40000000-0000-0000-0000-000000000002',
        '00000000-0000-0000-0000-000000000001',
        '20000000-0000-0000-0000-000000000001',
        '10000000-0000-0000-0000-000000000007',
        'Pear Tree 1',
        2021,
        null,
        'active',
        now(),
        now()
    )
on conflict (id) do nothing;

insert into persistent_bed_plants (
    id,
    account_id,
    bed_id,
    plant_id,
    planted_year,
    quantity,
    notes,
    status,
    created_at,
    updated_at
)
values
    (
        '50000000-0000-0000-0000-000000000001',
        '00000000-0000-0000-0000-000000000001',
        '30000000-0000-0000-0000-000000000002',
        '10000000-0000-0000-0000-000000000005',
        2025,
        12,
        'Seeded strawberries',
        'active',
        now(),
        now()
    )
on conflict (id) do nothing;

insert into yearly_bed_plantings (
    id,
    account_id,
    bed_id,
    plant_id,
    year,
    quantity,
    notes,
    status,
    created_at,
    updated_at
)
values
    (
        '60000000-0000-0000-0000-000000000001',
        '00000000-0000-0000-0000-000000000001',
        '30000000-0000-0000-0000-000000000001',
        '10000000-0000-0000-0000-000000000001',
        extract(year from current_date)::int,
        10,
        'Seeded demo tomatoes',
        'planted',
        now(),
        now()
    ),
    (
        '60000000-0000-0000-0000-000000000002',
        '00000000-0000-0000-0000-000000000001',
        '30000000-0000-0000-0000-000000000001',
        '10000000-0000-0000-0000-000000000004',
        extract(year from current_date)::int,
        8,
        'Seeded demo basil',
        'planted',
        now(),
        now()
    )
on conflict (id) do nothing;

-- ---------------------------------------------------------------------------
-- sample product + rule + inventory lot
-- ---------------------------------------------------------------------------
insert into products (
    id,
    account_id,
    name,
    category,
    active_substance,
    manufacturer,
    formulation,
    default_unit,
    notes,
    created_at,
    updated_at
)
values
    (
        '70000000-0000-0000-0000-000000000001',
        '00000000-0000-0000-0000-000000000001',
        'Demo Copper Product',
        'fungicide',
        'Copper hydroxide',
        'Demo Manufacturer',
        'WP',
        'g',
        'Seeded example product',
        now(),
        now()
    )
on conflict (id) do nothing;

insert into product_usage_rules (
    id,
    account_id,
    product_id,
    plant_id,
    dose_value,
    dose_unit,
    dilution_text,
    application_method,
    reapplication_interval_days,
    quarantine_period_days,
    notes,
    created_at,
    updated_at
)
values
    (
        '80000000-0000-0000-0000-000000000001',
        '00000000-0000-0000-0000-000000000001',
        '70000000-0000-0000-0000-000000000001',
        '10000000-0000-0000-0000-000000000006',
        20,
        'g',
        '20 g / 10 l water',
        'spray',
        10,
        14,
        'Seeded example rule for apple',
        now(),
        now()
    )
on conflict (id) do nothing;

insert into inventory_lots (
    id,
    account_id,
    product_id,
    quantity_initial,
    quantity_remaining,
    unit,
    purchase_date,
    expiry_date,
    batch_number,
    notes,
    created_at,
    updated_at
)
values
    (
        '90000000-0000-0000-0000-000000000001',
        '00000000-0000-0000-0000-000000000001',
        '70000000-0000-0000-0000-000000000001',
        500,
        500,
        'g',
        current_date,
        current_date + interval '365 days',
        'DEMO-LOT-001',
        'Seeded example inventory lot',
        now(),
        now()
    )
on conflict (id) do nothing;

commit;
