-- Rollback for: 09_seed_data
-- Date: 2026-04-14
-- Forward migration: 09_seed_data
-- WARNING: Execute only if forward migration needs to be reversed.
-- Data impact: Removes system dictionaries, their values, and the admin profile.
--              Do NOT run this if real data has been added after seeding.

-- Remove admin user profile
DELETE FROM users WHERE id = '00000000-0000-0000-0000-000000000001';

-- Remove system dictionary values (cascade via FK, but explicit for clarity)
DELETE FROM dictionary_values
WHERE dictionary_id IN (
  '00000000-0000-0000-0001-000000000001',
  '00000000-0000-0000-0002-000000000002'
);

-- Remove system dictionaries
DELETE FROM dictionaries
WHERE id IN (
  '00000000-0000-0000-0001-000000000001',
  '00000000-0000-0000-0002-000000000002'
);
