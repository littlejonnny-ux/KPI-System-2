-- Rollback for: 04_trigger_goals
-- Date: 2026-04-14
-- Forward migration: 04_trigger_goals
-- WARNING: Execute only if forward migration needs to be reversed.
-- Data impact: ALL trigger goals and their lines will be permanently deleted.
-- NOTE: Run AFTER rolling back migration 05 (kpi_cards) which references trigger_goals.

DROP TRIGGER IF EXISTS trigger_goal_lines_updated_at ON trigger_goal_lines;
DROP TRIGGER IF EXISTS trigger_goals_updated_at ON trigger_goals;
DROP TABLE IF EXISTS trigger_goal_lines CASCADE;
DROP TABLE IF EXISTS trigger_goals CASCADE;
DROP TYPE IF EXISTS card_period_type_enum CASCADE;
