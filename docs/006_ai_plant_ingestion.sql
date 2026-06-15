BEGIN;

-- Extend ai_sessions.kind CHECK constraint to include plant_ingestion
ALTER TABLE ai_sessions
  DROP CONSTRAINT ai_sessions_kind_chk;

ALTER TABLE ai_sessions
  ADD CONSTRAINT ai_sessions_kind_chk
    CHECK (kind IN ('product_ingestion', 'bed_planning', 'problem_assist', 'plant_ingestion'));

-- Extend ai_suggestions.suggestion_type CHECK constraint to include plant
ALTER TABLE ai_suggestions
  DROP CONSTRAINT ai_suggestions_suggestion_type_chk;

ALTER TABLE ai_suggestions
  ADD CONSTRAINT ai_suggestions_suggestion_type_chk
    CHECK (suggestion_type IN (
      'product',
      'product_rule',
      'bed_plan',
      'problem_summary',
      'followup_questions',
      'plant'
    ));

COMMIT;
