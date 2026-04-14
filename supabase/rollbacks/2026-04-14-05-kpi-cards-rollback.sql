-- Rollback for: 05_kpi_cards
-- Date: 2026-04-14
-- Forward migration: 05_kpi_cards
-- WARNING: Execute only if forward migration needs to be reversed.
-- Data impact: ALL KPI cards, lines (L1, L2), scale ranges, discrete points,
--              and user trigger goal data will be permanently deleted.

DROP TABLE IF EXISTS user_trigger_goal_data CASCADE;
DROP TABLE IF EXISTS card_line_discrete_points CASCADE;
DROP TABLE IF EXISTS card_line_l2_scale_ranges CASCADE;
DROP TABLE IF EXISTS card_line_scale_ranges CASCADE;
DROP TABLE IF EXISTS kpi_card_lines_l2 CASCADE;
DROP TABLE IF EXISTS kpi_card_lines CASCADE;
DROP TABLE IF EXISTS kpi_cards CASCADE;
DROP TYPE IF EXISTS composite_type_enum CASCADE;
DROP TYPE IF EXISTS kpi_card_status_enum CASCADE;
