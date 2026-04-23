-- Fixture: Safe migration — expect PASS
ALTER TABLE users ADD COLUMN display_name text;
CREATE INDEX idx_users_email ON users (email);
