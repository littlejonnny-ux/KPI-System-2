-- Rollback for: 03_kpi_library
-- Date: 2026-04-14
-- Forward migration: 03_kpi_library
-- WARNING: Execute only if forward migration needs to be reversed.
-- Data impact: ALL KPI library entries, scale ranges, discrete points, and properties
--              will be permanently deleted.
-- NOTE: Run AFTER rolling back migrations 05 (kpi_cards) which reference kpi_library.

DROP TRIGGER IF EXISTS kpi_library_updated_at ON kpi_library;
DROP TABLE IF EXISTS kpi_library_properties CASCADE;
DROP TABLE IF EXISTS kpi_discrete_points CASCADE;
DROP TABLE IF EXISTS kpi_scale_ranges CASCADE;
DROP TABLE IF EXISTS kpi_library CASCADE;
DROP TYPE IF EXISTS scale_range_type_enum CASCADE;
DROP TYPE IF EXISTS period_preset_enum CASCADE;
DROP TYPE IF EXISTS period_nature_enum CASCADE;
DROP TYPE IF EXISTS evaluation_method_enum CASCADE;
