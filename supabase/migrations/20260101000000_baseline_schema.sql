--
-- PostgreSQL database dump
--

-- Dumped from database version 17.6
-- Dumped by pg_dump version 18.3

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET transaction_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

--
-- Name: public; Type: SCHEMA; Schema: -; Owner: -
--

CREATE SCHEMA public;


--
-- Name: SCHEMA public; Type: COMMENT; Schema: -; Owner: -
--

COMMENT ON SCHEMA public IS 'standard public schema';


--
-- Name: audit_action_enum; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.audit_action_enum AS ENUM (
    'fact_entered',
    'submitted',
    'line_approved',
    'line_unapproved',
    'card_approved',
    'card_unapproved',
    'returned',
    'line_added',
    'line_deleted',
    'card_created',
    'card_status_changed'
);


--
-- Name: card_period_type_enum; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.card_period_type_enum AS ENUM (
    'Q1',
    'Q2',
    'Q3',
    'Q4',
    'H1',
    'H2',
    'year',
    'custom'
);


--
-- Name: composite_type_enum; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.composite_type_enum AS ENUM (
    'weighted',
    'additive'
);


--
-- Name: evaluation_method_enum; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.evaluation_method_enum AS ENUM (
    'scale',
    'binary',
    'discrete',
    'manual'
);


--
-- Name: event_type_enum; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.event_type_enum AS ENUM (
    'card_submitted',
    'card_approved',
    'card_returned',
    'fact_entered',
    'line_approved',
    'line_returned'
);


--
-- Name: kpi_card_status_enum; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.kpi_card_status_enum AS ENUM (
    'draft',
    'active',
    'pending_approval',
    'approved',
    'returned'
);


--
-- Name: period_nature_enum; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.period_nature_enum AS ENUM (
    'for_period',
    'on_date'
);


--
-- Name: period_preset_enum; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.period_preset_enum AS ENUM (
    'Q1',
    'Q2',
    'Q3',
    'Q4',
    'H1',
    'H2',
    'year',
    'custom'
);


--
-- Name: scale_range_type_enum; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.scale_range_type_enum AS ENUM (
    'fixed',
    'proportional'
);


--
-- Name: system_role_enum; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.system_role_enum AS ENUM (
    'admin',
    'approver',
    'participant'
);


--
-- Name: approve_card_line(uuid, uuid); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.approve_card_line(p_line_id uuid, p_user_id uuid) RETURNS public.kpi_card_status_enum
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
DECLARE
  v_card_id         uuid;
  v_card_status     kpi_card_status_enum;
  v_all_approved    boolean;
  v_new_card_status kpi_card_status_enum;
BEGIN
  -- 1. Получить card_id и текущий статус карты
  SELECT l.card_id, kc.status
  INTO v_card_id, v_card_status
  FROM kpi_card_lines l
  JOIN kpi_cards kc ON kc.id = l.card_id
  WHERE l.id = p_line_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Line not found: %', p_line_id;
  END IF;

  IF v_card_status <> 'pending_approval' THEN
    RAISE EXCEPTION 'Card is not in pending_approval status. Current status: %', v_card_status;
  END IF;

  -- 2. Согласовать строку
  UPDATE kpi_card_lines
  SET
    is_approved   = true,
    approved_at   = now(),
    approved_by   = p_user_id,
    approver_comment = NULL,
    updated_at    = now()
  WHERE id = p_line_id;

  -- 3. Проверить, все ли строки L1 согласованы
  SELECT NOT EXISTS (
    SELECT 1 FROM kpi_card_lines
    WHERE card_id = v_card_id AND is_approved = false
  ) INTO v_all_approved;

  -- 4. Если все согласованы — перевести карту в 'approved'
  IF v_all_approved THEN
    v_new_card_status := 'approved';
    UPDATE kpi_cards
    SET
      status      = 'approved',
      approved_at = now(),
      approved_by = p_user_id,
      updated_at  = now()
    WHERE id = v_card_id;

    -- 5. Записать в audit_log
    INSERT INTO audit_log (entity_type, entity_id, action, performed_by)
    VALUES ('kpi_card', v_card_id, 'card_approved', p_user_id);

    -- 6. Создать событие в ленте
    INSERT INTO events (event_type, title, related_card_id, created_by)
    VALUES (
      'card_approved',
      'Карта утверждена',
      v_card_id,
      p_user_id
    );
  ELSE
    v_new_card_status := v_card_status;
  END IF;

  -- 7. Записать в audit_log (approve строки)
  INSERT INTO audit_log (entity_type, entity_id, action, new_value, performed_by)
  VALUES (
    'kpi_card_line',
    p_line_id,
    'line_approved',
    jsonb_build_object('approved_by', p_user_id, 'approved_at', now()),
    p_user_id
  );

  RETURN v_new_card_status;
END;
$$;


--
-- Name: FUNCTION approve_card_line(p_line_id uuid, p_user_id uuid); Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON FUNCTION public.approve_card_line(p_line_id uuid, p_user_id uuid) IS 'Атомарно согласует строку L1 карты KPI. При согласовании всех строк автоматически переводит карту в approved. Создаёт записи в audit_log и events. Вызывается из API route /api/cards/approve-line.';


--
-- Name: auth_user_id(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.auth_user_id() RETURNS uuid
    LANGUAGE sql STABLE SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
  SELECT id FROM public.users WHERE auth_id = auth.uid() LIMIT 1;
$$;


SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: users; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.users (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    auth_id uuid,
    last_name text NOT NULL,
    first_name text NOT NULL,
    middle_name text,
    full_name text GENERATED ALWAYS AS (TRIM(BOTH FROM (((last_name || ' '::text) || first_name) || COALESCE((' '::text || middle_name), ''::text)))) STORED,
    work_email text NOT NULL,
    system_role public.system_role_enum DEFAULT 'participant'::public.system_role_enum NOT NULL,
    level_value_id uuid,
    company_role_id uuid,
    approver_id uuid,
    base_salary numeric(15,2),
    salary_multiplier numeric(5,2),
    is_active boolean DEFAULT true NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: TABLE users; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON TABLE public.users IS 'Профили пользователей системы. auth_id → Supabase Auth. full_name — вычисляемое поле.';


--
-- Name: COLUMN users.auth_id; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.users.auth_id IS 'UUID из auth.users. NULL если пользователь ещё не активирован.';


--
-- Name: COLUMN users.approver_id; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.users.approver_id IS 'Назначенный согласующий. NULL для admin.';


--
-- Name: auth_user_profile(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.auth_user_profile() RETURNS public.users
    LANGUAGE sql STABLE SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
  SELECT * FROM public.users WHERE auth_id = auth.uid() LIMIT 1;
$$;


--
-- Name: auth_user_role(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.auth_user_role() RETURNS public.system_role_enum
    LANGUAGE sql STABLE SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
  SELECT system_role FROM public.users WHERE auth_id = auth.uid() LIMIT 1;
$$;


--
-- Name: calculate_card_reward(uuid); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.calculate_card_reward(p_card_id uuid) RETURNS numeric
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
DECLARE
  v_base_salary       numeric(15,2);
  v_salary_multiplier numeric(5,2);
  v_trigger_goal_pct  numeric(10,4);
  v_individual_pct    numeric(10,4);
  v_reward            numeric(15,2);
  v_trigger_goal_id   uuid;
BEGIN
  -- 1. Получить данные карты и участника
  SELECT
    u.base_salary,
    u.salary_multiplier,
    kc.total_execution_pct,
    kc.trigger_goal_id
  INTO
    v_base_salary,
    v_salary_multiplier,
    v_individual_pct,
    v_trigger_goal_id
  FROM kpi_cards kc
  JOIN users u ON u.id = kc.user_id
  WHERE kc.id = p_card_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Card not found: %', p_card_id;
  END IF;

  -- 2. Если нет оклада или множителя — вернуть 0
  IF v_base_salary IS NULL OR v_salary_multiplier IS NULL THEN
    UPDATE kpi_cards SET total_reward = 0, updated_at = now() WHERE id = p_card_id;
    RETURN 0;
  END IF;

  -- 3. Получить % запускающей цели (официальный)
  IF v_trigger_goal_id IS NOT NULL THEN
    SELECT official_execution_pct
    INTO v_trigger_goal_pct
    FROM trigger_goals
    WHERE id = v_trigger_goal_id;
  END IF;

  -- Если нет привязанной цели или % не установлен — используем 100%
  IF v_trigger_goal_pct IS NULL THEN
    v_trigger_goal_pct := 100;
  END IF;

  -- 4. Если нет % исполнения KPI — используем 0
  IF v_individual_pct IS NULL THEN
    v_individual_pct := 0;
  END IF;

  -- 5. Расчёт: оклад × кол-во окладов × % цели / 100 × % KPI / 100
  v_reward := v_base_salary
            * v_salary_multiplier
            * (v_trigger_goal_pct / 100.0)
            * (v_individual_pct / 100.0);

  -- 6. Обновить карту
  UPDATE kpi_cards
  SET total_reward = v_reward, updated_at = now()
  WHERE id = p_card_id;

  RETURN v_reward;
END;
$$;


--
-- Name: FUNCTION calculate_card_reward(p_card_id uuid); Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON FUNCTION public.calculate_card_reward(p_card_id uuid) IS 'Рассчитывает итоговое вознаграждение по карте KPI. Формула: base_salary × salary_multiplier × (trigger_goal_pct/100) × (individual_kpi_pct/100). Обновляет kpi_cards.total_reward. Вызывается из API route /api/reward/calculate и при auto-approve.';


--
-- Name: import_participants_bulk(jsonb); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.import_participants_bulk(p_data jsonb) RETURNS jsonb
    LANGUAGE plpgsql SECURITY DEFINER
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


--
-- Name: rls_auto_enable(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.rls_auto_enable() RETURNS event_trigger
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'pg_catalog'
    AS $$
DECLARE
  cmd record;
BEGIN
  FOR cmd IN
    SELECT *
    FROM pg_event_trigger_ddl_commands()
    WHERE command_tag IN ('CREATE TABLE', 'CREATE TABLE AS', 'SELECT INTO')
      AND object_type IN ('table','partitioned table')
  LOOP
     IF cmd.schema_name IS NOT NULL AND cmd.schema_name IN ('public') AND cmd.schema_name NOT IN ('pg_catalog','information_schema') AND cmd.schema_name NOT LIKE 'pg_toast%' AND cmd.schema_name NOT LIKE 'pg_temp%' THEN
      BEGIN
        EXECUTE format('alter table if exists %s enable row level security', cmd.object_identity);
        RAISE LOG 'rls_auto_enable: enabled RLS on %', cmd.object_identity;
      EXCEPTION
        WHEN OTHERS THEN
          RAISE LOG 'rls_auto_enable: failed to enable RLS on %', cmd.object_identity;
      END;
     ELSE
        RAISE LOG 'rls_auto_enable: skip % (either system schema or not in enforced list: %.)', cmd.object_identity, cmd.schema_name;
     END IF;
  END LOOP;
END;
$$;


--
-- Name: unapprove_card_line(uuid, uuid); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.unapprove_card_line(p_line_id uuid, p_user_id uuid) RETURNS public.kpi_card_status_enum
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
DECLARE
  v_card_id         uuid;
  v_card_status     kpi_card_status_enum;
  v_new_card_status kpi_card_status_enum;
BEGIN
  SELECT l.card_id, kc.status
  INTO v_card_id, v_card_status
  FROM kpi_card_lines l
  JOIN kpi_cards kc ON kc.id = l.card_id
  WHERE l.id = p_line_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Line not found: %', p_line_id;
  END IF;

  -- Снять согласование со строки
  UPDATE kpi_card_lines
  SET
    is_approved      = false,
    approved_at      = NULL,
    approved_by      = NULL,
    approver_comment = NULL,
    updated_at       = now()
  WHERE id = p_line_id;

  -- Если карта была approved — вернуть в pending_approval
  IF v_card_status = 'approved' THEN
    v_new_card_status := 'pending_approval';
    UPDATE kpi_cards
    SET
      status      = 'pending_approval',
      approved_at = NULL,
      approved_by = NULL,
      updated_at  = now()
    WHERE id = v_card_id;

    INSERT INTO audit_log (entity_type, entity_id, action, performed_by)
    VALUES ('kpi_card', v_card_id, 'card_unapproved', p_user_id);
  ELSE
    v_new_card_status := v_card_status;
  END IF;

  INSERT INTO audit_log (entity_type, entity_id, action, performed_by)
  VALUES ('kpi_card_line', p_line_id, 'line_unapproved', p_user_id);

  RETURN v_new_card_status;
END;
$$;


--
-- Name: FUNCTION unapprove_card_line(p_line_id uuid, p_user_id uuid); Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON FUNCTION public.unapprove_card_line(p_line_id uuid, p_user_id uuid) IS 'Отменяет согласование строки L1. Если карта была approved — возвращает её в pending_approval.';


--
-- Name: update_updated_at_column(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.update_updated_at_column() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;


--
-- Name: audit_log; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.audit_log (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    entity_type text NOT NULL,
    entity_id uuid NOT NULL,
    action public.audit_action_enum NOT NULL,
    new_value jsonb,
    comment text,
    performed_by uuid,
    performed_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: TABLE audit_log; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON TABLE public.audit_log IS 'Иммутабельный журнал изменений карт. Не редактируется, не удаляется.';


--
-- Name: COLUMN audit_log.entity_type; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.audit_log.entity_type IS 'kpi_card | kpi_card_line | kpi_card_line_l2';


--
-- Name: COLUMN audit_log.new_value; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.audit_log.new_value IS 'Произвольный JSON-снимок изменения (новое значение).';


--
-- Name: card_line_discrete_points; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.card_line_discrete_points (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    card_line_id uuid NOT NULL,
    fact_value integer NOT NULL,
    execution_pct numeric(10,4) NOT NULL,
    sort_order integer DEFAULT 0 NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: card_line_l2_scale_ranges; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.card_line_l2_scale_ranges (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    card_line_l2_id uuid NOT NULL,
    range_from numeric(10,4) NOT NULL,
    range_to numeric(10,4),
    range_type public.scale_range_type_enum DEFAULT 'fixed'::public.scale_range_type_enum NOT NULL,
    fixed_pct numeric(10,4),
    sort_order integer DEFAULT 0 NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: card_line_scale_ranges; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.card_line_scale_ranges (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    card_line_id uuid NOT NULL,
    range_from numeric(10,4) NOT NULL,
    range_to numeric(10,4),
    range_type public.scale_range_type_enum DEFAULT 'fixed'::public.scale_range_type_enum NOT NULL,
    fixed_pct numeric(10,4),
    sort_order integer DEFAULT 0 NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: dictionaries; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.dictionaries (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    name text NOT NULL,
    is_system boolean DEFAULT false NOT NULL,
    show_in_filters boolean DEFAULT false NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: TABLE dictionaries; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON TABLE public.dictionaries IS 'Справочники системы. is_system=true — нельзя удалить/переключить show_in_filters.';


--
-- Name: dictionary_values; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.dictionary_values (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    dictionary_id uuid NOT NULL,
    value text NOT NULL,
    sort_order integer DEFAULT 0 NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: TABLE dictionary_values; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON TABLE public.dictionary_values IS 'Значения справочников. Мягкое удаление — нет (значения удаляются физически).';


--
-- Name: events; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.events (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    event_type public.event_type_enum NOT NULL,
    title text NOT NULL,
    description text,
    related_card_id uuid,
    created_by uuid,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: TABLE events; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON TABLE public.events IS 'Лента событий (последние 100). Не редактируется. Создаётся при submit/approve/return.';


--
-- Name: kpi_card_lines; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.kpi_card_lines (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    card_id uuid NOT NULL,
    kpi_id uuid,
    name text NOT NULL,
    weight numeric(5,2) DEFAULT 0 NOT NULL,
    evaluation_method public.evaluation_method_enum NOT NULL,
    unit text DEFAULT ''::text NOT NULL,
    target_value numeric(15,4),
    fact_value numeric(15,4),
    execution_pct numeric(10,4),
    is_approved boolean DEFAULT false NOT NULL,
    is_composite boolean DEFAULT false NOT NULL,
    composite_type public.composite_type_enum,
    participant_comment text,
    approver_comment text,
    approved_at timestamp with time zone,
    approved_by uuid,
    sort_order integer DEFAULT 0 NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: TABLE kpi_card_lines; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON TABLE public.kpi_card_lines IS 'Строки KPI-карты L1. is_composite=true — составной KPI с дочерними L2.';


--
-- Name: kpi_card_lines_l2; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.kpi_card_lines_l2 (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    parent_line_id uuid NOT NULL,
    kpi_id uuid,
    name text NOT NULL,
    weight numeric(5,2) DEFAULT 0 NOT NULL,
    evaluation_method public.evaluation_method_enum NOT NULL,
    unit text DEFAULT ''::text NOT NULL,
    target_value numeric(15,4),
    fact_value numeric(15,4),
    execution_pct numeric(10,4),
    is_approved boolean DEFAULT false NOT NULL,
    participant_comment text,
    sort_order integer DEFAULT 0 NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: TABLE kpi_card_lines_l2; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON TABLE public.kpi_card_lines_l2 IS 'Дочерние строки L2 для составных KPI.';


--
-- Name: kpi_cards; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.kpi_cards (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    period_type public.card_period_type_enum NOT NULL,
    period_year integer NOT NULL,
    period_sub text,
    status public.kpi_card_status_enum DEFAULT 'draft'::public.kpi_card_status_enum NOT NULL,
    trigger_goal_id uuid,
    total_execution_pct numeric(10,4),
    total_reward numeric(15,2),
    is_complete boolean DEFAULT false NOT NULL,
    approved_at timestamp with time zone,
    approved_by uuid,
    approver_comment text,
    created_by uuid,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: TABLE kpi_cards; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON TABLE public.kpi_cards IS 'KPI-карты участников. Один участник — один документ за период.';


--
-- Name: COLUMN kpi_cards.is_complete; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.kpi_cards.is_complete IS 'true когда все строки L1 имеют факт (нет незаполненных).';


--
-- Name: kpi_discrete_points; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.kpi_discrete_points (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    kpi_id uuid NOT NULL,
    fact_value integer NOT NULL,
    execution_pct numeric(10,4) NOT NULL,
    sort_order integer DEFAULT 0 NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: TABLE kpi_discrete_points; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON TABLE public.kpi_discrete_points IS 'Дискретные точки для KPI. fact_value (целое) → execution_pct.';


--
-- Name: kpi_library; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.kpi_library (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    name text NOT NULL,
    description text,
    evaluation_method public.evaluation_method_enum NOT NULL,
    unit text DEFAULT ''::text NOT NULL,
    target_value numeric(15,4),
    period_nature public.period_nature_enum DEFAULT 'for_period'::public.period_nature_enum NOT NULL,
    period_year integer NOT NULL,
    period_preset public.period_preset_enum,
    period_date_from date,
    period_date_to date,
    period_single_date date,
    is_active boolean DEFAULT true NOT NULL,
    created_by uuid,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: TABLE kpi_library; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON TABLE public.kpi_library IS 'Библиотека KPI-шаблонов. Используется при создании карт.';


--
-- Name: COLUMN kpi_library.period_preset; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.kpi_library.period_preset IS 'NULL при period_nature=on_date или custom.';


--
-- Name: COLUMN kpi_library.period_single_date; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.kpi_library.period_single_date IS 'Только для period_nature=on_date.';


--
-- Name: kpi_library_properties; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.kpi_library_properties (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    kpi_id uuid NOT NULL,
    dictionary_id uuid NOT NULL,
    value_id uuid NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: TABLE kpi_library_properties; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON TABLE public.kpi_library_properties IS 'Свойства KPI (динамические пары справочник:значение).';


--
-- Name: kpi_scale_ranges; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.kpi_scale_ranges (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    kpi_id uuid NOT NULL,
    range_from numeric(10,4) NOT NULL,
    range_to numeric(10,4),
    range_type public.scale_range_type_enum DEFAULT 'fixed'::public.scale_range_type_enum NOT NULL,
    fixed_pct numeric(10,4),
    sort_order integer DEFAULT 0 NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: TABLE kpi_scale_ranges; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON TABLE public.kpi_scale_ranges IS 'Диапазоны шкалы для KPI в библиотеке. range_to NULL = бесконечность.';


--
-- Name: trigger_goal_lines; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.trigger_goal_lines (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    trigger_goal_id uuid NOT NULL,
    kpi_id uuid,
    weight numeric(5,2) DEFAULT 0 NOT NULL,
    target_value numeric(15,4),
    official_fact_value numeric(15,4),
    official_execution_pct numeric(10,4),
    sort_order integer DEFAULT 0 NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: TABLE trigger_goal_lines; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON TABLE public.trigger_goal_lines IS 'KPI-строки запускающей цели. official_fact_value вводит Admin.';


--
-- Name: trigger_goals; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.trigger_goals (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    name text NOT NULL,
    description text,
    applicable_levels text[],
    period_type public.card_period_type_enum NOT NULL,
    period_year integer NOT NULL,
    period_sub text,
    official_execution_pct numeric(10,4),
    is_active boolean DEFAULT true NOT NULL,
    created_by uuid,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: TABLE trigger_goals; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON TABLE public.trigger_goals IS 'Мастер-карты запускающих целей. applicable_levels — массив UUID значений справочника Уровень участника.';


--
-- Name: COLUMN trigger_goals.official_execution_pct; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.trigger_goals.official_execution_pct IS 'Итоговый официальный % исполнения (автопересчёт при изменении строк).';


--
-- Name: user_trigger_goal_data; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.user_trigger_goal_data (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    card_id uuid NOT NULL,
    trigger_goal_line_id uuid NOT NULL,
    user_fact_value numeric(15,4),
    use_official boolean DEFAULT true NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: TABLE user_trigger_goal_data; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON TABLE public.user_trigger_goal_data IS 'Данные моделирования запускающей цели участником. use_official=true → отображается официальный %.';


--
-- Name: audit_log audit_log_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.audit_log
    ADD CONSTRAINT audit_log_pkey PRIMARY KEY (id);


--
-- Name: card_line_discrete_points card_line_discrete_points_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.card_line_discrete_points
    ADD CONSTRAINT card_line_discrete_points_pkey PRIMARY KEY (id);


--
-- Name: card_line_l2_scale_ranges card_line_l2_scale_ranges_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.card_line_l2_scale_ranges
    ADD CONSTRAINT card_line_l2_scale_ranges_pkey PRIMARY KEY (id);


--
-- Name: card_line_scale_ranges card_line_scale_ranges_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.card_line_scale_ranges
    ADD CONSTRAINT card_line_scale_ranges_pkey PRIMARY KEY (id);


--
-- Name: dictionaries dictionaries_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.dictionaries
    ADD CONSTRAINT dictionaries_pkey PRIMARY KEY (id);


--
-- Name: dictionary_values dictionary_values_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.dictionary_values
    ADD CONSTRAINT dictionary_values_pkey PRIMARY KEY (id);


--
-- Name: events events_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.events
    ADD CONSTRAINT events_pkey PRIMARY KEY (id);


--
-- Name: kpi_card_lines_l2 kpi_card_lines_l2_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.kpi_card_lines_l2
    ADD CONSTRAINT kpi_card_lines_l2_pkey PRIMARY KEY (id);


--
-- Name: kpi_card_lines kpi_card_lines_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.kpi_card_lines
    ADD CONSTRAINT kpi_card_lines_pkey PRIMARY KEY (id);


--
-- Name: kpi_cards kpi_cards_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.kpi_cards
    ADD CONSTRAINT kpi_cards_pkey PRIMARY KEY (id);


--
-- Name: kpi_discrete_points kpi_discrete_points_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.kpi_discrete_points
    ADD CONSTRAINT kpi_discrete_points_pkey PRIMARY KEY (id);


--
-- Name: kpi_library kpi_library_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.kpi_library
    ADD CONSTRAINT kpi_library_pkey PRIMARY KEY (id);


--
-- Name: kpi_library_properties kpi_library_properties_kpi_id_dictionary_id_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.kpi_library_properties
    ADD CONSTRAINT kpi_library_properties_kpi_id_dictionary_id_key UNIQUE (kpi_id, dictionary_id);


--
-- Name: kpi_library_properties kpi_library_properties_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.kpi_library_properties
    ADD CONSTRAINT kpi_library_properties_pkey PRIMARY KEY (id);


--
-- Name: kpi_scale_ranges kpi_scale_ranges_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.kpi_scale_ranges
    ADD CONSTRAINT kpi_scale_ranges_pkey PRIMARY KEY (id);


--
-- Name: trigger_goal_lines trigger_goal_lines_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.trigger_goal_lines
    ADD CONSTRAINT trigger_goal_lines_pkey PRIMARY KEY (id);


--
-- Name: trigger_goals trigger_goals_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.trigger_goals
    ADD CONSTRAINT trigger_goals_pkey PRIMARY KEY (id);


--
-- Name: user_trigger_goal_data user_trigger_goal_data_card_id_trigger_goal_line_id_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_trigger_goal_data
    ADD CONSTRAINT user_trigger_goal_data_card_id_trigger_goal_line_id_key UNIQUE (card_id, trigger_goal_line_id);


--
-- Name: user_trigger_goal_data user_trigger_goal_data_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_trigger_goal_data
    ADD CONSTRAINT user_trigger_goal_data_pkey PRIMARY KEY (id);


--
-- Name: users users_auth_id_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_auth_id_key UNIQUE (auth_id);


--
-- Name: users users_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_pkey PRIMARY KEY (id);


--
-- Name: users users_work_email_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_work_email_key UNIQUE (work_email);


--
-- Name: idx_audit_log_at; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_audit_log_at ON public.audit_log USING btree (performed_at DESC);


--
-- Name: idx_audit_log_card; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_audit_log_card ON public.audit_log USING btree (entity_id) WHERE (entity_type = 'kpi_card'::text);


--
-- Name: idx_audit_log_entity; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_audit_log_entity ON public.audit_log USING btree (entity_type, entity_id);


--
-- Name: idx_card_line_discrete_points_line; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_card_line_discrete_points_line ON public.card_line_discrete_points USING btree (card_line_id, sort_order);


--
-- Name: idx_card_line_l2_scale_ranges_line; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_card_line_l2_scale_ranges_line ON public.card_line_l2_scale_ranges USING btree (card_line_l2_id, sort_order);


--
-- Name: idx_card_line_scale_ranges_line; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_card_line_scale_ranges_line ON public.card_line_scale_ranges USING btree (card_line_id, sort_order);


--
-- Name: idx_dictionary_values_dict_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_dictionary_values_dict_id ON public.dictionary_values USING btree (dictionary_id);


--
-- Name: idx_dictionary_values_sort; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_dictionary_values_sort ON public.dictionary_values USING btree (dictionary_id, sort_order);


--
-- Name: idx_events_at; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_events_at ON public.events USING btree (created_at DESC);


--
-- Name: idx_events_card; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_events_card ON public.events USING btree (related_card_id);


--
-- Name: idx_events_type; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_events_type ON public.events USING btree (event_type);


--
-- Name: idx_kpi_card_lines_approved; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_kpi_card_lines_approved ON public.kpi_card_lines USING btree (card_id, is_approved);


--
-- Name: idx_kpi_card_lines_card; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_kpi_card_lines_card ON public.kpi_card_lines USING btree (card_id, sort_order);


--
-- Name: idx_kpi_card_lines_l2_parent; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_kpi_card_lines_l2_parent ON public.kpi_card_lines_l2 USING btree (parent_line_id, sort_order);


--
-- Name: idx_kpi_cards_status; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_kpi_cards_status ON public.kpi_cards USING btree (status);


--
-- Name: idx_kpi_cards_trigger; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_kpi_cards_trigger ON public.kpi_cards USING btree (trigger_goal_id);


--
-- Name: idx_kpi_cards_user; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_kpi_cards_user ON public.kpi_cards USING btree (user_id);


--
-- Name: idx_kpi_cards_year; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_kpi_cards_year ON public.kpi_cards USING btree (period_year);


--
-- Name: idx_kpi_discrete_points_kpi; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_kpi_discrete_points_kpi ON public.kpi_discrete_points USING btree (kpi_id, sort_order);


--
-- Name: idx_kpi_library_active; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_kpi_library_active ON public.kpi_library USING btree (is_active);


--
-- Name: idx_kpi_library_method; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_kpi_library_method ON public.kpi_library USING btree (evaluation_method);


--
-- Name: idx_kpi_library_props_kpi; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_kpi_library_props_kpi ON public.kpi_library_properties USING btree (kpi_id);


--
-- Name: idx_kpi_library_year; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_kpi_library_year ON public.kpi_library USING btree (period_year);


--
-- Name: idx_kpi_scale_ranges_kpi; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_kpi_scale_ranges_kpi ON public.kpi_scale_ranges USING btree (kpi_id, sort_order);


--
-- Name: idx_trigger_goal_lines_goal; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_trigger_goal_lines_goal ON public.trigger_goal_lines USING btree (trigger_goal_id, sort_order);


--
-- Name: idx_trigger_goals_active; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_trigger_goals_active ON public.trigger_goals USING btree (is_active);


--
-- Name: idx_trigger_goals_year; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_trigger_goals_year ON public.trigger_goals USING btree (period_year);


--
-- Name: idx_user_tgd_card; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_user_tgd_card ON public.user_trigger_goal_data USING btree (card_id);


--
-- Name: idx_users_approver; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_users_approver ON public.users USING btree (approver_id);


--
-- Name: idx_users_auth_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_users_auth_id ON public.users USING btree (auth_id);


--
-- Name: idx_users_role; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_users_role ON public.users USING btree (system_role);


--
-- Name: idx_users_work_email; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_users_work_email ON public.users USING btree (work_email);


--
-- Name: dictionaries dictionaries_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER dictionaries_updated_at BEFORE UPDATE ON public.dictionaries FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: dictionary_values dictionary_values_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER dictionary_values_updated_at BEFORE UPDATE ON public.dictionary_values FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: kpi_card_lines_l2 kpi_card_lines_l2_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER kpi_card_lines_l2_updated_at BEFORE UPDATE ON public.kpi_card_lines_l2 FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: kpi_card_lines kpi_card_lines_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER kpi_card_lines_updated_at BEFORE UPDATE ON public.kpi_card_lines FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: kpi_cards kpi_cards_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER kpi_cards_updated_at BEFORE UPDATE ON public.kpi_cards FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: kpi_library kpi_library_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER kpi_library_updated_at BEFORE UPDATE ON public.kpi_library FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: trigger_goal_lines trigger_goal_lines_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER trigger_goal_lines_updated_at BEFORE UPDATE ON public.trigger_goal_lines FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: trigger_goals trigger_goals_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER trigger_goals_updated_at BEFORE UPDATE ON public.trigger_goals FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: users users_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER users_updated_at BEFORE UPDATE ON public.users FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: audit_log audit_log_performed_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.audit_log
    ADD CONSTRAINT audit_log_performed_by_fkey FOREIGN KEY (performed_by) REFERENCES public.users(id) ON DELETE SET NULL;


--
-- Name: card_line_discrete_points card_line_discrete_points_card_line_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.card_line_discrete_points
    ADD CONSTRAINT card_line_discrete_points_card_line_id_fkey FOREIGN KEY (card_line_id) REFERENCES public.kpi_card_lines(id) ON DELETE CASCADE;


--
-- Name: card_line_l2_scale_ranges card_line_l2_scale_ranges_card_line_l2_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.card_line_l2_scale_ranges
    ADD CONSTRAINT card_line_l2_scale_ranges_card_line_l2_id_fkey FOREIGN KEY (card_line_l2_id) REFERENCES public.kpi_card_lines_l2(id) ON DELETE CASCADE;


--
-- Name: card_line_scale_ranges card_line_scale_ranges_card_line_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.card_line_scale_ranges
    ADD CONSTRAINT card_line_scale_ranges_card_line_id_fkey FOREIGN KEY (card_line_id) REFERENCES public.kpi_card_lines(id) ON DELETE CASCADE;


--
-- Name: dictionary_values dictionary_values_dictionary_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.dictionary_values
    ADD CONSTRAINT dictionary_values_dictionary_id_fkey FOREIGN KEY (dictionary_id) REFERENCES public.dictionaries(id) ON DELETE CASCADE;


--
-- Name: events events_created_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.events
    ADD CONSTRAINT events_created_by_fkey FOREIGN KEY (created_by) REFERENCES public.users(id) ON DELETE SET NULL;


--
-- Name: events events_related_card_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.events
    ADD CONSTRAINT events_related_card_id_fkey FOREIGN KEY (related_card_id) REFERENCES public.kpi_cards(id) ON DELETE SET NULL;


--
-- Name: kpi_card_lines kpi_card_lines_approved_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.kpi_card_lines
    ADD CONSTRAINT kpi_card_lines_approved_by_fkey FOREIGN KEY (approved_by) REFERENCES public.users(id) ON DELETE SET NULL;


--
-- Name: kpi_card_lines kpi_card_lines_card_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.kpi_card_lines
    ADD CONSTRAINT kpi_card_lines_card_id_fkey FOREIGN KEY (card_id) REFERENCES public.kpi_cards(id) ON DELETE CASCADE;


--
-- Name: kpi_card_lines kpi_card_lines_kpi_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.kpi_card_lines
    ADD CONSTRAINT kpi_card_lines_kpi_id_fkey FOREIGN KEY (kpi_id) REFERENCES public.kpi_library(id) ON DELETE SET NULL;


--
-- Name: kpi_card_lines_l2 kpi_card_lines_l2_kpi_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.kpi_card_lines_l2
    ADD CONSTRAINT kpi_card_lines_l2_kpi_id_fkey FOREIGN KEY (kpi_id) REFERENCES public.kpi_library(id) ON DELETE SET NULL;


--
-- Name: kpi_card_lines_l2 kpi_card_lines_l2_parent_line_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.kpi_card_lines_l2
    ADD CONSTRAINT kpi_card_lines_l2_parent_line_id_fkey FOREIGN KEY (parent_line_id) REFERENCES public.kpi_card_lines(id) ON DELETE CASCADE;


--
-- Name: kpi_cards kpi_cards_approved_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.kpi_cards
    ADD CONSTRAINT kpi_cards_approved_by_fkey FOREIGN KEY (approved_by) REFERENCES public.users(id) ON DELETE SET NULL;


--
-- Name: kpi_cards kpi_cards_created_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.kpi_cards
    ADD CONSTRAINT kpi_cards_created_by_fkey FOREIGN KEY (created_by) REFERENCES public.users(id) ON DELETE SET NULL;


--
-- Name: kpi_cards kpi_cards_trigger_goal_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.kpi_cards
    ADD CONSTRAINT kpi_cards_trigger_goal_id_fkey FOREIGN KEY (trigger_goal_id) REFERENCES public.trigger_goals(id) ON DELETE SET NULL;


--
-- Name: kpi_cards kpi_cards_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.kpi_cards
    ADD CONSTRAINT kpi_cards_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: kpi_discrete_points kpi_discrete_points_kpi_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.kpi_discrete_points
    ADD CONSTRAINT kpi_discrete_points_kpi_id_fkey FOREIGN KEY (kpi_id) REFERENCES public.kpi_library(id) ON DELETE CASCADE;


--
-- Name: kpi_library kpi_library_created_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.kpi_library
    ADD CONSTRAINT kpi_library_created_by_fkey FOREIGN KEY (created_by) REFERENCES public.users(id) ON DELETE SET NULL;


--
-- Name: kpi_library_properties kpi_library_properties_dictionary_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.kpi_library_properties
    ADD CONSTRAINT kpi_library_properties_dictionary_id_fkey FOREIGN KEY (dictionary_id) REFERENCES public.dictionaries(id) ON DELETE CASCADE;


--
-- Name: kpi_library_properties kpi_library_properties_kpi_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.kpi_library_properties
    ADD CONSTRAINT kpi_library_properties_kpi_id_fkey FOREIGN KEY (kpi_id) REFERENCES public.kpi_library(id) ON DELETE CASCADE;


--
-- Name: kpi_library_properties kpi_library_properties_value_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.kpi_library_properties
    ADD CONSTRAINT kpi_library_properties_value_id_fkey FOREIGN KEY (value_id) REFERENCES public.dictionary_values(id) ON DELETE CASCADE;


--
-- Name: kpi_scale_ranges kpi_scale_ranges_kpi_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.kpi_scale_ranges
    ADD CONSTRAINT kpi_scale_ranges_kpi_id_fkey FOREIGN KEY (kpi_id) REFERENCES public.kpi_library(id) ON DELETE CASCADE;


--
-- Name: trigger_goal_lines trigger_goal_lines_kpi_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.trigger_goal_lines
    ADD CONSTRAINT trigger_goal_lines_kpi_id_fkey FOREIGN KEY (kpi_id) REFERENCES public.kpi_library(id) ON DELETE SET NULL;


--
-- Name: trigger_goal_lines trigger_goal_lines_trigger_goal_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.trigger_goal_lines
    ADD CONSTRAINT trigger_goal_lines_trigger_goal_id_fkey FOREIGN KEY (trigger_goal_id) REFERENCES public.trigger_goals(id) ON DELETE CASCADE;


--
-- Name: trigger_goals trigger_goals_created_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.trigger_goals
    ADD CONSTRAINT trigger_goals_created_by_fkey FOREIGN KEY (created_by) REFERENCES public.users(id) ON DELETE SET NULL;


--
-- Name: user_trigger_goal_data user_trigger_goal_data_card_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_trigger_goal_data
    ADD CONSTRAINT user_trigger_goal_data_card_id_fkey FOREIGN KEY (card_id) REFERENCES public.kpi_cards(id) ON DELETE CASCADE;


--
-- Name: user_trigger_goal_data user_trigger_goal_data_trigger_goal_line_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_trigger_goal_data
    ADD CONSTRAINT user_trigger_goal_data_trigger_goal_line_id_fkey FOREIGN KEY (trigger_goal_line_id) REFERENCES public.trigger_goal_lines(id) ON DELETE CASCADE;


--
-- Name: users users_approver_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_approver_id_fkey FOREIGN KEY (approver_id) REFERENCES public.users(id) ON DELETE SET NULL;


--
-- Name: users users_auth_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_auth_id_fkey FOREIGN KEY (auth_id) REFERENCES auth.users(id) ON DELETE SET NULL;


--
-- Name: users users_company_role_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_company_role_id_fkey FOREIGN KEY (company_role_id) REFERENCES public.dictionary_values(id) ON DELETE SET NULL;


--
-- Name: users users_level_value_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_level_value_id_fkey FOREIGN KEY (level_value_id) REFERENCES public.dictionary_values(id) ON DELETE SET NULL;


--
-- Name: audit_log; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.audit_log ENABLE ROW LEVEL SECURITY;

--
-- Name: audit_log audit_log_insert_authenticated; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY audit_log_insert_authenticated ON public.audit_log FOR INSERT TO authenticated WITH CHECK (true);


--
-- Name: audit_log audit_log_select_admin; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY audit_log_select_admin ON public.audit_log FOR SELECT TO authenticated USING ((public.auth_user_role() = 'admin'::public.system_role_enum));


--
-- Name: audit_log audit_log_select_card_access; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY audit_log_select_card_access ON public.audit_log FOR SELECT TO authenticated USING (((entity_type = 'kpi_card'::text) AND (EXISTS ( SELECT 1
   FROM (public.kpi_cards kc
     JOIN public.users u ON ((u.id = kc.user_id)))
  WHERE ((kc.id = audit_log.entity_id) AND ((kc.user_id = public.auth_user_id()) OR (u.approver_id = public.auth_user_id())))))));


--
-- Name: card_line_discrete_points; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.card_line_discrete_points ENABLE ROW LEVEL SECURITY;

--
-- Name: card_line_discrete_points card_line_discrete_points_select_admin; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY card_line_discrete_points_select_admin ON public.card_line_discrete_points FOR SELECT TO authenticated USING ((public.auth_user_role() = 'admin'::public.system_role_enum));


--
-- Name: card_line_discrete_points card_line_discrete_points_select_other; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY card_line_discrete_points_select_other ON public.card_line_discrete_points FOR SELECT TO authenticated USING ((EXISTS ( SELECT 1
   FROM ((public.kpi_card_lines l
     JOIN public.kpi_cards kc ON ((kc.id = l.card_id)))
     JOIN public.users u ON ((u.id = kc.user_id)))
  WHERE ((l.id = card_line_discrete_points.card_line_id) AND ((kc.user_id = public.auth_user_id()) OR (u.approver_id = public.auth_user_id()))))));


--
-- Name: card_line_discrete_points card_line_discrete_points_write_admin; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY card_line_discrete_points_write_admin ON public.card_line_discrete_points TO authenticated USING ((public.auth_user_role() = 'admin'::public.system_role_enum)) WITH CHECK ((public.auth_user_role() = 'admin'::public.system_role_enum));


--
-- Name: card_line_l2_scale_ranges; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.card_line_l2_scale_ranges ENABLE ROW LEVEL SECURITY;

--
-- Name: card_line_l2_scale_ranges card_line_l2_scale_ranges_select_admin; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY card_line_l2_scale_ranges_select_admin ON public.card_line_l2_scale_ranges FOR SELECT TO authenticated USING ((public.auth_user_role() = 'admin'::public.system_role_enum));


--
-- Name: card_line_l2_scale_ranges card_line_l2_scale_ranges_select_other; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY card_line_l2_scale_ranges_select_other ON public.card_line_l2_scale_ranges FOR SELECT TO authenticated USING ((EXISTS ( SELECT 1
   FROM (((public.kpi_card_lines_l2 l2
     JOIN public.kpi_card_lines l ON ((l.id = l2.parent_line_id)))
     JOIN public.kpi_cards kc ON ((kc.id = l.card_id)))
     JOIN public.users u ON ((u.id = kc.user_id)))
  WHERE ((l2.id = card_line_l2_scale_ranges.card_line_l2_id) AND ((kc.user_id = public.auth_user_id()) OR (u.approver_id = public.auth_user_id()))))));


--
-- Name: card_line_l2_scale_ranges card_line_l2_scale_ranges_write_admin; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY card_line_l2_scale_ranges_write_admin ON public.card_line_l2_scale_ranges TO authenticated USING ((public.auth_user_role() = 'admin'::public.system_role_enum)) WITH CHECK ((public.auth_user_role() = 'admin'::public.system_role_enum));


--
-- Name: card_line_scale_ranges; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.card_line_scale_ranges ENABLE ROW LEVEL SECURITY;

--
-- Name: card_line_scale_ranges card_line_scale_ranges_select_admin; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY card_line_scale_ranges_select_admin ON public.card_line_scale_ranges FOR SELECT TO authenticated USING ((public.auth_user_role() = 'admin'::public.system_role_enum));


--
-- Name: card_line_scale_ranges card_line_scale_ranges_select_other; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY card_line_scale_ranges_select_other ON public.card_line_scale_ranges FOR SELECT TO authenticated USING ((EXISTS ( SELECT 1
   FROM ((public.kpi_card_lines l
     JOIN public.kpi_cards kc ON ((kc.id = l.card_id)))
     JOIN public.users u ON ((u.id = kc.user_id)))
  WHERE ((l.id = card_line_scale_ranges.card_line_id) AND ((kc.user_id = public.auth_user_id()) OR (u.approver_id = public.auth_user_id()))))));


--
-- Name: card_line_scale_ranges card_line_scale_ranges_write_admin; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY card_line_scale_ranges_write_admin ON public.card_line_scale_ranges TO authenticated USING ((public.auth_user_role() = 'admin'::public.system_role_enum)) WITH CHECK ((public.auth_user_role() = 'admin'::public.system_role_enum));


--
-- Name: dictionary_values dict_values_delete_admin; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY dict_values_delete_admin ON public.dictionary_values FOR DELETE TO authenticated USING ((public.auth_user_role() = 'admin'::public.system_role_enum));


--
-- Name: dictionary_values dict_values_insert_admin; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY dict_values_insert_admin ON public.dictionary_values FOR INSERT TO authenticated WITH CHECK ((public.auth_user_role() = 'admin'::public.system_role_enum));


--
-- Name: dictionary_values dict_values_select_authenticated; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY dict_values_select_authenticated ON public.dictionary_values FOR SELECT TO authenticated USING (true);


--
-- Name: dictionary_values dict_values_update_admin; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY dict_values_update_admin ON public.dictionary_values FOR UPDATE TO authenticated USING ((public.auth_user_role() = 'admin'::public.system_role_enum));


--
-- Name: dictionaries; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.dictionaries ENABLE ROW LEVEL SECURITY;

--
-- Name: dictionaries dictionaries_delete_admin; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY dictionaries_delete_admin ON public.dictionaries FOR DELETE TO authenticated USING (((public.auth_user_role() = 'admin'::public.system_role_enum) AND (NOT is_system)));


--
-- Name: dictionaries dictionaries_insert_admin; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY dictionaries_insert_admin ON public.dictionaries FOR INSERT TO authenticated WITH CHECK ((public.auth_user_role() = 'admin'::public.system_role_enum));


--
-- Name: dictionaries dictionaries_select_authenticated; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY dictionaries_select_authenticated ON public.dictionaries FOR SELECT TO authenticated USING (true);


--
-- Name: dictionaries dictionaries_update_admin; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY dictionaries_update_admin ON public.dictionaries FOR UPDATE TO authenticated USING ((public.auth_user_role() = 'admin'::public.system_role_enum));


--
-- Name: dictionary_values; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.dictionary_values ENABLE ROW LEVEL SECURITY;

--
-- Name: events; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.events ENABLE ROW LEVEL SECURITY;

--
-- Name: events events_insert_authenticated; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY events_insert_authenticated ON public.events FOR INSERT TO authenticated WITH CHECK (true);


--
-- Name: events events_select_admin_approver; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY events_select_admin_approver ON public.events FOR SELECT TO authenticated USING ((public.auth_user_role() = ANY (ARRAY['admin'::public.system_role_enum, 'approver'::public.system_role_enum])));


--
-- Name: kpi_card_lines; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.kpi_card_lines ENABLE ROW LEVEL SECURITY;

--
-- Name: kpi_card_lines_l2; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.kpi_card_lines_l2 ENABLE ROW LEVEL SECURITY;

--
-- Name: kpi_card_lines_l2 kpi_card_lines_l2_select_admin; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY kpi_card_lines_l2_select_admin ON public.kpi_card_lines_l2 FOR SELECT TO authenticated USING ((public.auth_user_role() = 'admin'::public.system_role_enum));


--
-- Name: kpi_card_lines_l2 kpi_card_lines_l2_select_approver; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY kpi_card_lines_l2_select_approver ON public.kpi_card_lines_l2 FOR SELECT TO authenticated USING (((public.auth_user_role() = 'approver'::public.system_role_enum) AND (EXISTS ( SELECT 1
   FROM ((public.kpi_card_lines l
     JOIN public.kpi_cards kc ON ((kc.id = l.card_id)))
     JOIN public.users u ON ((u.id = kc.user_id)))
  WHERE ((l.id = kpi_card_lines_l2.parent_line_id) AND ((kc.user_id = public.auth_user_id()) OR (u.approver_id = public.auth_user_id())))))));


--
-- Name: kpi_card_lines_l2 kpi_card_lines_l2_select_participant; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY kpi_card_lines_l2_select_participant ON public.kpi_card_lines_l2 FOR SELECT TO authenticated USING (((public.auth_user_role() = 'participant'::public.system_role_enum) AND (EXISTS ( SELECT 1
   FROM (public.kpi_card_lines l
     JOIN public.kpi_cards kc ON ((kc.id = l.card_id)))
  WHERE ((l.id = kpi_card_lines_l2.parent_line_id) AND (kc.user_id = public.auth_user_id()))))));


--
-- Name: kpi_card_lines_l2 kpi_card_lines_l2_update_approver; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY kpi_card_lines_l2_update_approver ON public.kpi_card_lines_l2 FOR UPDATE TO authenticated USING (((public.auth_user_role() = 'approver'::public.system_role_enum) AND (EXISTS ( SELECT 1
   FROM ((public.kpi_card_lines l
     JOIN public.kpi_cards kc ON ((kc.id = l.card_id)))
     JOIN public.users u ON ((u.id = kc.user_id)))
  WHERE ((l.id = kpi_card_lines_l2.parent_line_id) AND (u.approver_id = public.auth_user_id()))))));


--
-- Name: kpi_card_lines_l2 kpi_card_lines_l2_update_participant; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY kpi_card_lines_l2_update_participant ON public.kpi_card_lines_l2 FOR UPDATE TO authenticated USING (((public.auth_user_role() = 'participant'::public.system_role_enum) AND (NOT is_approved) AND (EXISTS ( SELECT 1
   FROM (public.kpi_card_lines l
     JOIN public.kpi_cards kc ON ((kc.id = l.card_id)))
  WHERE ((l.id = kpi_card_lines_l2.parent_line_id) AND (kc.user_id = public.auth_user_id()) AND (kc.status <> 'approved'::public.kpi_card_status_enum))))));


--
-- Name: kpi_card_lines_l2 kpi_card_lines_l2_write_admin; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY kpi_card_lines_l2_write_admin ON public.kpi_card_lines_l2 TO authenticated USING ((public.auth_user_role() = 'admin'::public.system_role_enum)) WITH CHECK ((public.auth_user_role() = 'admin'::public.system_role_enum));


--
-- Name: kpi_card_lines kpi_card_lines_select_admin; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY kpi_card_lines_select_admin ON public.kpi_card_lines FOR SELECT TO authenticated USING ((public.auth_user_role() = 'admin'::public.system_role_enum));


--
-- Name: kpi_card_lines kpi_card_lines_select_approver; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY kpi_card_lines_select_approver ON public.kpi_card_lines FOR SELECT TO authenticated USING (((public.auth_user_role() = 'approver'::public.system_role_enum) AND (EXISTS ( SELECT 1
   FROM (public.kpi_cards kc
     JOIN public.users u ON ((u.id = kc.user_id)))
  WHERE ((kc.id = kpi_card_lines.card_id) AND ((kc.user_id = public.auth_user_id()) OR (u.approver_id = public.auth_user_id())))))));


--
-- Name: kpi_card_lines kpi_card_lines_select_participant; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY kpi_card_lines_select_participant ON public.kpi_card_lines FOR SELECT TO authenticated USING (((public.auth_user_role() = 'participant'::public.system_role_enum) AND (EXISTS ( SELECT 1
   FROM public.kpi_cards kc
  WHERE ((kc.id = kpi_card_lines.card_id) AND (kc.user_id = public.auth_user_id()))))));


--
-- Name: kpi_card_lines kpi_card_lines_update_approver; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY kpi_card_lines_update_approver ON public.kpi_card_lines FOR UPDATE TO authenticated USING (((public.auth_user_role() = 'approver'::public.system_role_enum) AND (EXISTS ( SELECT 1
   FROM (public.kpi_cards kc
     JOIN public.users u ON ((u.id = kc.user_id)))
  WHERE ((kc.id = kpi_card_lines.card_id) AND (u.approver_id = public.auth_user_id()))))));


--
-- Name: kpi_card_lines kpi_card_lines_update_participant; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY kpi_card_lines_update_participant ON public.kpi_card_lines FOR UPDATE TO authenticated USING (((public.auth_user_role() = 'participant'::public.system_role_enum) AND (NOT is_approved) AND (EXISTS ( SELECT 1
   FROM public.kpi_cards kc
  WHERE ((kc.id = kpi_card_lines.card_id) AND (kc.user_id = public.auth_user_id()) AND (kc.status <> 'approved'::public.kpi_card_status_enum))))));


--
-- Name: kpi_card_lines kpi_card_lines_write_admin; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY kpi_card_lines_write_admin ON public.kpi_card_lines TO authenticated USING ((public.auth_user_role() = 'admin'::public.system_role_enum)) WITH CHECK ((public.auth_user_role() = 'admin'::public.system_role_enum));


--
-- Name: kpi_cards; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.kpi_cards ENABLE ROW LEVEL SECURITY;

--
-- Name: kpi_cards kpi_cards_delete_admin; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY kpi_cards_delete_admin ON public.kpi_cards FOR DELETE TO authenticated USING ((public.auth_user_role() = 'admin'::public.system_role_enum));


--
-- Name: kpi_cards kpi_cards_insert_admin; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY kpi_cards_insert_admin ON public.kpi_cards FOR INSERT TO authenticated WITH CHECK ((public.auth_user_role() = 'admin'::public.system_role_enum));


--
-- Name: kpi_cards kpi_cards_select_admin; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY kpi_cards_select_admin ON public.kpi_cards FOR SELECT TO authenticated USING ((public.auth_user_role() = 'admin'::public.system_role_enum));


--
-- Name: kpi_cards kpi_cards_select_approver; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY kpi_cards_select_approver ON public.kpi_cards FOR SELECT TO authenticated USING (((public.auth_user_role() = 'approver'::public.system_role_enum) AND ((user_id = public.auth_user_id()) OR (EXISTS ( SELECT 1
   FROM public.users u
  WHERE ((u.id = kpi_cards.user_id) AND (u.approver_id = public.auth_user_id())))))));


--
-- Name: kpi_cards kpi_cards_select_participant; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY kpi_cards_select_participant ON public.kpi_cards FOR SELECT TO authenticated USING (((public.auth_user_role() = 'participant'::public.system_role_enum) AND (user_id = public.auth_user_id())));


--
-- Name: kpi_cards kpi_cards_update_admin; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY kpi_cards_update_admin ON public.kpi_cards FOR UPDATE TO authenticated USING ((public.auth_user_role() = 'admin'::public.system_role_enum));


--
-- Name: kpi_cards kpi_cards_update_approver; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY kpi_cards_update_approver ON public.kpi_cards FOR UPDATE TO authenticated USING (((public.auth_user_role() = 'approver'::public.system_role_enum) AND (EXISTS ( SELECT 1
   FROM public.users u
  WHERE ((u.id = kpi_cards.user_id) AND (u.approver_id = public.auth_user_id()))))));


--
-- Name: kpi_cards kpi_cards_update_participant; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY kpi_cards_update_participant ON public.kpi_cards FOR UPDATE TO authenticated USING (((public.auth_user_role() = 'participant'::public.system_role_enum) AND (user_id = public.auth_user_id())));


--
-- Name: kpi_discrete_points; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.kpi_discrete_points ENABLE ROW LEVEL SECURITY;

--
-- Name: kpi_discrete_points kpi_discrete_points_select; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY kpi_discrete_points_select ON public.kpi_discrete_points FOR SELECT TO authenticated USING (true);


--
-- Name: kpi_discrete_points kpi_discrete_points_write_admin; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY kpi_discrete_points_write_admin ON public.kpi_discrete_points TO authenticated USING ((public.auth_user_role() = 'admin'::public.system_role_enum)) WITH CHECK ((public.auth_user_role() = 'admin'::public.system_role_enum));


--
-- Name: kpi_library_properties kpi_lib_props_select; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY kpi_lib_props_select ON public.kpi_library_properties FOR SELECT TO authenticated USING (true);


--
-- Name: kpi_library_properties kpi_lib_props_write_admin; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY kpi_lib_props_write_admin ON public.kpi_library_properties TO authenticated USING ((public.auth_user_role() = 'admin'::public.system_role_enum)) WITH CHECK ((public.auth_user_role() = 'admin'::public.system_role_enum));


--
-- Name: kpi_library; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.kpi_library ENABLE ROW LEVEL SECURITY;

--
-- Name: kpi_library kpi_library_delete_admin; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY kpi_library_delete_admin ON public.kpi_library FOR DELETE TO authenticated USING ((public.auth_user_role() = 'admin'::public.system_role_enum));


--
-- Name: kpi_library kpi_library_insert_admin; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY kpi_library_insert_admin ON public.kpi_library FOR INSERT TO authenticated WITH CHECK ((public.auth_user_role() = 'admin'::public.system_role_enum));


--
-- Name: kpi_library_properties; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.kpi_library_properties ENABLE ROW LEVEL SECURITY;

--
-- Name: kpi_library kpi_library_select; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY kpi_library_select ON public.kpi_library FOR SELECT TO authenticated USING (true);


--
-- Name: kpi_library kpi_library_update_admin; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY kpi_library_update_admin ON public.kpi_library FOR UPDATE TO authenticated USING ((public.auth_user_role() = 'admin'::public.system_role_enum));


--
-- Name: kpi_scale_ranges; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.kpi_scale_ranges ENABLE ROW LEVEL SECURITY;

--
-- Name: kpi_scale_ranges kpi_scale_ranges_select; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY kpi_scale_ranges_select ON public.kpi_scale_ranges FOR SELECT TO authenticated USING (true);


--
-- Name: kpi_scale_ranges kpi_scale_ranges_write_admin; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY kpi_scale_ranges_write_admin ON public.kpi_scale_ranges TO authenticated USING ((public.auth_user_role() = 'admin'::public.system_role_enum)) WITH CHECK ((public.auth_user_role() = 'admin'::public.system_role_enum));


--
-- Name: trigger_goal_lines; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.trigger_goal_lines ENABLE ROW LEVEL SECURITY;

--
-- Name: trigger_goal_lines trigger_goal_lines_select; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY trigger_goal_lines_select ON public.trigger_goal_lines FOR SELECT TO authenticated USING (true);


--
-- Name: trigger_goal_lines trigger_goal_lines_write_admin; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY trigger_goal_lines_write_admin ON public.trigger_goal_lines TO authenticated USING ((public.auth_user_role() = 'admin'::public.system_role_enum)) WITH CHECK ((public.auth_user_role() = 'admin'::public.system_role_enum));


--
-- Name: trigger_goals; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.trigger_goals ENABLE ROW LEVEL SECURITY;

--
-- Name: trigger_goals trigger_goals_select; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY trigger_goals_select ON public.trigger_goals FOR SELECT TO authenticated USING (true);


--
-- Name: trigger_goals trigger_goals_write_admin; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY trigger_goals_write_admin ON public.trigger_goals TO authenticated USING ((public.auth_user_role() = 'admin'::public.system_role_enum)) WITH CHECK ((public.auth_user_role() = 'admin'::public.system_role_enum));


--
-- Name: user_trigger_goal_data user_tgd_select_admin; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY user_tgd_select_admin ON public.user_trigger_goal_data FOR SELECT TO authenticated USING ((public.auth_user_role() = 'admin'::public.system_role_enum));


--
-- Name: user_trigger_goal_data user_tgd_select_approver; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY user_tgd_select_approver ON public.user_trigger_goal_data FOR SELECT TO authenticated USING (((public.auth_user_role() = 'approver'::public.system_role_enum) AND (EXISTS ( SELECT 1
   FROM (public.kpi_cards kc
     JOIN public.users u ON ((u.id = kc.user_id)))
  WHERE ((kc.id = user_trigger_goal_data.card_id) AND (u.approver_id = public.auth_user_id()))))));


--
-- Name: user_trigger_goal_data user_tgd_select_own; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY user_tgd_select_own ON public.user_trigger_goal_data FOR SELECT TO authenticated USING ((EXISTS ( SELECT 1
   FROM public.kpi_cards kc
  WHERE ((kc.id = user_trigger_goal_data.card_id) AND (kc.user_id = public.auth_user_id())))));


--
-- Name: user_trigger_goal_data user_tgd_write_admin; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY user_tgd_write_admin ON public.user_trigger_goal_data TO authenticated USING ((public.auth_user_role() = 'admin'::public.system_role_enum)) WITH CHECK ((public.auth_user_role() = 'admin'::public.system_role_enum));


--
-- Name: user_trigger_goal_data user_tgd_write_own; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY user_tgd_write_own ON public.user_trigger_goal_data TO authenticated USING ((EXISTS ( SELECT 1
   FROM public.kpi_cards kc
  WHERE ((kc.id = user_trigger_goal_data.card_id) AND (kc.user_id = public.auth_user_id()))))) WITH CHECK ((EXISTS ( SELECT 1
   FROM public.kpi_cards kc
  WHERE ((kc.id = user_trigger_goal_data.card_id) AND (kc.user_id = public.auth_user_id())))));


--
-- Name: user_trigger_goal_data; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.user_trigger_goal_data ENABLE ROW LEVEL SECURITY;

--
-- Name: users; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

--
-- Name: users users_delete_admin; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY users_delete_admin ON public.users FOR DELETE TO authenticated USING ((public.auth_user_role() = 'admin'::public.system_role_enum));


--
-- Name: users users_insert_admin; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY users_insert_admin ON public.users FOR INSERT TO authenticated WITH CHECK ((public.auth_user_role() = 'admin'::public.system_role_enum));


--
-- Name: users users_select_admin; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY users_select_admin ON public.users FOR SELECT TO authenticated USING ((public.auth_user_role() = 'admin'::public.system_role_enum));


--
-- Name: users users_select_approver; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY users_select_approver ON public.users FOR SELECT TO authenticated USING (((public.auth_user_role() = 'approver'::public.system_role_enum) AND ((id = public.auth_user_id()) OR (approver_id = public.auth_user_id()))));


--
-- Name: users users_select_self; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY users_select_self ON public.users FOR SELECT TO authenticated USING ((id = public.auth_user_id()));


--
-- Name: users users_update_admin; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY users_update_admin ON public.users FOR UPDATE TO authenticated USING ((public.auth_user_role() = 'admin'::public.system_role_enum));


--
-- Name: users users_update_self; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY users_update_self ON public.users FOR UPDATE TO authenticated USING (((id = public.auth_user_id()) AND (public.auth_user_role() <> 'admin'::public.system_role_enum)));


--
-- PostgreSQL database dump complete
--

