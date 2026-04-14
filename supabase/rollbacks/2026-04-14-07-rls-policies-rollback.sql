-- Rollback for: 07_rls_policies
-- Date: 2026-04-14
-- Forward migration: 07_rls_policies
-- WARNING: Execute only if forward migration needs to be reversed.
-- Data impact: Removes all RLS policies. Tables remain but become inaccessible
--              (RLS enabled but no policies = deny all).
-- NOTE: After rollback, either re-apply policies or disable RLS on affected tables.

-- dictionaries
DROP POLICY IF EXISTS "dictionaries_select_authenticated" ON dictionaries;
DROP POLICY IF EXISTS "dictionaries_insert_admin" ON dictionaries;
DROP POLICY IF EXISTS "dictionaries_update_admin" ON dictionaries;
DROP POLICY IF EXISTS "dictionaries_delete_admin" ON dictionaries;
DROP POLICY IF EXISTS "dict_values_select_authenticated" ON dictionary_values;
DROP POLICY IF EXISTS "dict_values_insert_admin" ON dictionary_values;
DROP POLICY IF EXISTS "dict_values_update_admin" ON dictionary_values;
DROP POLICY IF EXISTS "dict_values_delete_admin" ON dictionary_values;

-- users
DROP POLICY IF EXISTS "users_select_admin" ON users;
DROP POLICY IF EXISTS "users_select_approver" ON users;
DROP POLICY IF EXISTS "users_select_self" ON users;
DROP POLICY IF EXISTS "users_insert_admin" ON users;
DROP POLICY IF EXISTS "users_update_admin" ON users;
DROP POLICY IF EXISTS "users_update_self" ON users;
DROP POLICY IF EXISTS "users_delete_admin" ON users;

-- kpi_library
DROP POLICY IF EXISTS "kpi_library_select" ON kpi_library;
DROP POLICY IF EXISTS "kpi_library_insert_admin" ON kpi_library;
DROP POLICY IF EXISTS "kpi_library_update_admin" ON kpi_library;
DROP POLICY IF EXISTS "kpi_library_delete_admin" ON kpi_library;
DROP POLICY IF EXISTS "kpi_scale_ranges_select" ON kpi_scale_ranges;
DROP POLICY IF EXISTS "kpi_scale_ranges_write_admin" ON kpi_scale_ranges;
DROP POLICY IF EXISTS "kpi_discrete_points_select" ON kpi_discrete_points;
DROP POLICY IF EXISTS "kpi_discrete_points_write_admin" ON kpi_discrete_points;
DROP POLICY IF EXISTS "kpi_lib_props_select" ON kpi_library_properties;
DROP POLICY IF EXISTS "kpi_lib_props_write_admin" ON kpi_library_properties;

-- trigger_goals
DROP POLICY IF EXISTS "trigger_goals_select" ON trigger_goals;
DROP POLICY IF EXISTS "trigger_goals_write_admin" ON trigger_goals;
DROP POLICY IF EXISTS "trigger_goal_lines_select" ON trigger_goal_lines;
DROP POLICY IF EXISTS "trigger_goal_lines_write_admin" ON trigger_goal_lines;

-- kpi_cards
DROP POLICY IF EXISTS "kpi_cards_select_admin" ON kpi_cards;
DROP POLICY IF EXISTS "kpi_cards_select_approver" ON kpi_cards;
DROP POLICY IF EXISTS "kpi_cards_select_participant" ON kpi_cards;
DROP POLICY IF EXISTS "kpi_cards_insert_admin" ON kpi_cards;
DROP POLICY IF EXISTS "kpi_cards_update_admin" ON kpi_cards;
DROP POLICY IF EXISTS "kpi_cards_update_approver" ON kpi_cards;
DROP POLICY IF EXISTS "kpi_cards_update_participant" ON kpi_cards;
DROP POLICY IF EXISTS "kpi_cards_delete_admin" ON kpi_cards;

-- kpi_card_lines
DROP POLICY IF EXISTS "kpi_card_lines_select_admin" ON kpi_card_lines;
DROP POLICY IF EXISTS "kpi_card_lines_select_approver" ON kpi_card_lines;
DROP POLICY IF EXISTS "kpi_card_lines_select_participant" ON kpi_card_lines;
DROP POLICY IF EXISTS "kpi_card_lines_write_admin" ON kpi_card_lines;
DROP POLICY IF EXISTS "kpi_card_lines_update_approver" ON kpi_card_lines;
DROP POLICY IF EXISTS "kpi_card_lines_update_participant" ON kpi_card_lines;

-- kpi_card_lines_l2
DROP POLICY IF EXISTS "kpi_card_lines_l2_select_admin" ON kpi_card_lines_l2;
DROP POLICY IF EXISTS "kpi_card_lines_l2_select_approver" ON kpi_card_lines_l2;
DROP POLICY IF EXISTS "kpi_card_lines_l2_select_participant" ON kpi_card_lines_l2;
DROP POLICY IF EXISTS "kpi_card_lines_l2_write_admin" ON kpi_card_lines_l2;
DROP POLICY IF EXISTS "kpi_card_lines_l2_update_approver" ON kpi_card_lines_l2;
DROP POLICY IF EXISTS "kpi_card_lines_l2_update_participant" ON kpi_card_lines_l2;

-- card line ranges / discrete points
DROP POLICY IF EXISTS "card_line_scale_ranges_select_admin" ON card_line_scale_ranges;
DROP POLICY IF EXISTS "card_line_scale_ranges_select_other" ON card_line_scale_ranges;
DROP POLICY IF EXISTS "card_line_scale_ranges_write_admin" ON card_line_scale_ranges;
DROP POLICY IF EXISTS "card_line_l2_scale_ranges_select_admin" ON card_line_l2_scale_ranges;
DROP POLICY IF EXISTS "card_line_l2_scale_ranges_select_other" ON card_line_l2_scale_ranges;
DROP POLICY IF EXISTS "card_line_l2_scale_ranges_write_admin" ON card_line_l2_scale_ranges;
DROP POLICY IF EXISTS "card_line_discrete_points_select_admin" ON card_line_discrete_points;
DROP POLICY IF EXISTS "card_line_discrete_points_select_other" ON card_line_discrete_points;
DROP POLICY IF EXISTS "card_line_discrete_points_write_admin" ON card_line_discrete_points;

-- user_trigger_goal_data
DROP POLICY IF EXISTS "user_tgd_select_admin" ON user_trigger_goal_data;
DROP POLICY IF EXISTS "user_tgd_select_own" ON user_trigger_goal_data;
DROP POLICY IF EXISTS "user_tgd_select_approver" ON user_trigger_goal_data;
DROP POLICY IF EXISTS "user_tgd_write_own" ON user_trigger_goal_data;
DROP POLICY IF EXISTS "user_tgd_write_admin" ON user_trigger_goal_data;

-- audit_log
DROP POLICY IF EXISTS "audit_log_select_admin" ON audit_log;
DROP POLICY IF EXISTS "audit_log_select_card_access" ON audit_log;
DROP POLICY IF EXISTS "audit_log_insert_authenticated" ON audit_log;

-- events
DROP POLICY IF EXISTS "events_select_admin_approver" ON events;
DROP POLICY IF EXISTS "events_insert_authenticated" ON events;

-- helper functions
DROP FUNCTION IF EXISTS auth_user_profile() CASCADE;
DROP FUNCTION IF EXISTS auth_user_role() CASCADE;
DROP FUNCTION IF EXISTS auth_user_id() CASCADE;
