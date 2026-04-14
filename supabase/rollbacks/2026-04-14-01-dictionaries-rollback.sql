-- Rollback for: 01_dictionaries
-- Date: 2026-04-14
-- Forward migration: 01_dictionaries
-- WARNING: Execute only if forward migration needs to be reversed.
-- Data impact: ALL dictionaries and dictionary_values will be permanently deleted.

DROP TRIGGER IF EXISTS dictionary_values_updated_at ON dictionary_values;
DROP TRIGGER IF EXISTS dictionaries_updated_at ON dictionaries;
DROP TABLE IF EXISTS dictionary_values CASCADE;
DROP TABLE IF EXISTS dictionaries CASCADE;
DROP FUNCTION IF EXISTS update_updated_at_column() CASCADE;
