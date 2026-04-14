-- Rollback for: 02_users
-- Date: 2026-04-14
-- Forward migration: 02_users
-- WARNING: Execute only if forward migration needs to be reversed.
-- Data impact: ALL user profiles will be permanently deleted.
-- NOTE: Run AFTER rolling back all migrations that depend on users (05, 04, 03).

DROP TRIGGER IF EXISTS users_updated_at ON users;
DROP TABLE IF EXISTS users CASCADE;
DROP TYPE IF EXISTS system_role_enum CASCADE;
