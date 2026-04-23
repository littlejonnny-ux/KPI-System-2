-- Fixture: EXECUTE with dangerous DROP inside plpgsql — expect BLOCK
CREATE OR REPLACE FUNCTION cleanup_table(tbl text)
RETURNS void LANGUAGE plpgsql AS $$
BEGIN
  EXECUTE 'DROP TABLE ' || tbl;
END;
$$;
