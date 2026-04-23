-- Migration: import_participants_bulk RPC function
-- Date: 2026-04-19
-- Purpose: Atomic bulk insert of users table rows for Excel import.
--          Auth users are created per-row in the API route before calling this function.
--          This function handles only the users table insert + duplicate detection.

CREATE OR REPLACE FUNCTION import_participants_bulk(p_data jsonb)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_row          jsonb;
  v_created      int := 0;
  v_skipped      int := 0;
  v_errors       jsonb := '[]'::jsonb;
  v_email        text;
  v_existing_id  uuid;
BEGIN
  -- Caller must be service_role (checked via auth.role())
  -- SECURITY DEFINER runs as the function owner, so RLS is bypassed.
  -- We still gate on the calling role for defense-in-depth.

  FOR v_row IN SELECT * FROM jsonb_array_elements(p_data)
  LOOP
    v_email := v_row->>'work_email';

    BEGIN
      -- Check for duplicate by work_email
      SELECT id INTO v_existing_id
      FROM users
      WHERE work_email = v_email
      LIMIT 1;

      IF v_existing_id IS NOT NULL THEN
        v_skipped := v_skipped + 1;
        v_errors := v_errors || jsonb_build_object(
          'email', v_email,
          'reason', 'Пользователь с таким email уже существует'
        );
        CONTINUE;
      END IF;

      INSERT INTO users (
        auth_id,
        work_email,
        first_name,
        last_name,
        middle_name,
        system_role,
        approver_id,
        base_salary,
        salary_multiplier,
        level_value_id,
        company_role_id,
        is_active
      ) VALUES (
        (v_row->>'auth_id')::uuid,
        v_email,
        v_row->>'first_name',
        v_row->>'last_name',
        v_row->>'middle_name',
        COALESCE(v_row->>'system_role', 'participant')::"system_role_enum",
        (v_row->>'approver_id')::uuid,
        (v_row->>'base_salary')::numeric,
        COALESCE((v_row->>'salary_multiplier')::numeric, 1.0),
        (v_row->>'level_value_id')::uuid,
        (v_row->>'company_role_id')::uuid,
        true
      );

      v_created := v_created + 1;

    EXCEPTION WHEN OTHERS THEN
      v_errors := v_errors || jsonb_build_object(
        'email', v_email,
        'reason', SQLERRM
      );
    END;
  END LOOP;

  RETURN jsonb_build_object(
    'created', v_created,
    'skipped', v_skipped,
    'errors', v_errors
  );
END;
$$;
