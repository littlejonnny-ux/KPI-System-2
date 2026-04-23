-- Fixture: EXECUTE with string concatenation — expect BLOCK
CREATE OR REPLACE FUNCTION truncate_table(tbl text)
RETURNS void LANGUAGE plpgsql AS $$
BEGIN
  EXECUTE 'TRUNCATE TABLE ' || tbl;
END;
$$;
