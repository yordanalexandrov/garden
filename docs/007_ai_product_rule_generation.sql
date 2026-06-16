BEGIN;

-- Extend ai_sessions.kind CHECK constraint to include product_rule_generation
-- (AI-assisted generation/refresh of product usage rules for an existing product).
ALTER TABLE ai_sessions
  DROP CONSTRAINT ai_sessions_kind_chk;

ALTER TABLE ai_sessions
  ADD CONSTRAINT ai_sessions_kind_chk
    CHECK (kind IN (
      'product_ingestion',
      'bed_planning',
      'problem_assist',
      'plant_ingestion',
      'product_rule_generation'
    ));

COMMIT;
