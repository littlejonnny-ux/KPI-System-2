-- Fixture: DELETE with WHERE — expect PASS
DELETE FROM sessions WHERE expires_at < NOW();
