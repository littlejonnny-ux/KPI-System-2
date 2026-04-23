-- Fixture: EXECUTE with safe static SELECT — expect PASS
CREATE OR REPLACE FUNCTION get_count()
RETURNS bigint LANGUAGE plpgsql AS $$
DECLARE
  cnt bigint;
BEGIN
  EXECUTE 'SELECT COUNT(*) FROM users' INTO cnt;
  RETURN cnt;
END;
$$;
