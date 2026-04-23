-- Fixture: EXECUTE with dynamic SQL + [execute-reviewed] marker in commit — expect WARN (not BLOCK)
-- The marker [execute-reviewed: reviewed by DBA, uses quote_ident] is in commit message.
CREATE OR REPLACE FUNCTION safe_dynamic_query(schema_name text, tbl text)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  -- Uses quote_ident to prevent injection
  EXECUTE format('SELECT 1 FROM %I.%I LIMIT 1', schema_name, tbl);
END;
$$;
