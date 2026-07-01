BEGIN;

ALTER TABLE problems
  ADD COLUMN IF NOT EXISTS archived_at timestamptz;

COMMIT;
