-- Fixture: L2 ADD UNIQUE — expect BLOCK (no marker)
ALTER TABLE users ADD CONSTRAINT users_email_unique UNIQUE (email);
