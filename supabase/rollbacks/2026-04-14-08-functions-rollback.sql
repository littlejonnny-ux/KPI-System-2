-- Rollback for: 08_functions
-- Date: 2026-04-14
-- Forward migration: 08_functions
-- WARNING: Execute only if forward migration needs to be reversed.
-- Data impact: None (functions only). Removes PostgreSQL functions.

DROP FUNCTION IF EXISTS approve_card_line(uuid, uuid) CASCADE;
DROP FUNCTION IF EXISTS calculate_card_reward(uuid) CASCADE;
DROP FUNCTION IF EXISTS unapprove_card_line(uuid, uuid) CASCADE;
