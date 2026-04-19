-- Rollback for: import_participants_bulk RPC function
-- Date: 2026-04-19
-- Forward migration: 2026-04-19-01-participants-bulk-import.sql
-- WARNING: Execute only if forward migration needs to be reversed.
-- Data impact: None — only drops the function definition.

DROP FUNCTION IF EXISTS import_participants_bulk(jsonb);
