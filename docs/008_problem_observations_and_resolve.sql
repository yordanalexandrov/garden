BEGIN;

ALTER TABLE problems
  ADD COLUMN IF NOT EXISTS resolved_at timestamptz;

CREATE TABLE IF NOT EXISTS problem_observations (
  id             uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  problem_id     uuid NOT NULL REFERENCES problems(id) ON DELETE CASCADE,
  summary        text NOT NULL CHECK (char_length(summary) >= 1),
  recommendation text,
  source         text NOT NULL CHECK (source IN ('user', 'ai')),
  created_at     timestamptz NOT NULL DEFAULT now(),
  updated_at     timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS problem_observations_problem_id_idx
  ON problem_observations (problem_id);

COMMIT;
