-- Rollback for: 06_audit_log_events
-- Date: 2026-04-14
-- Forward migration: 06_audit_log_events
-- WARNING: Execute only if forward migration needs to be reversed.
-- Data impact: ALL audit log entries and events will be permanently deleted.

DROP TABLE IF EXISTS events CASCADE;
DROP TABLE IF EXISTS audit_log CASCADE;
DROP TYPE IF EXISTS event_type_enum CASCADE;
DROP TYPE IF EXISTS audit_action_enum CASCADE;
