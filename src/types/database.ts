export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      audit_log: {
        Row: {
          action: Database["public"]["Enums"]["audit_action_enum"]
          comment: string | null
          entity_id: string
          entity_type: string
          id: string
          new_value: Json | null
          performed_at: string
          performed_by: string | null
        }
        Insert: {
          action: Database["public"]["Enums"]["audit_action_enum"]
          comment?: string | null
          entity_id: string
          entity_type: string
          id?: string
          new_value?: Json | null
          performed_at?: string
          performed_by?: string | null
        }
        Update: {
          action?: Database["public"]["Enums"]["audit_action_enum"]
          comment?: string | null
          entity_id?: string
          entity_type?: string
          id?: string
          new_value?: Json | null
          performed_at?: string
          performed_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "audit_log_performed_by_fkey"
            columns: ["performed_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      card_line_discrete_points: {
        Row: {
          card_line_id: string
          created_at: string
          execution_pct: number
          fact_value: number
          id: string
          sort_order: number
        }
        Insert: {
          card_line_id: string
          created_at?: string
          execution_pct: number
          fact_value: number
          id?: string
          sort_order?: number
        }
        Update: {
          card_line_id?: string
          created_at?: string
          execution_pct?: number
          fact_value?: number
          id?: string
          sort_order?: number
        }
        Relationships: [
          {
            foreignKeyName: "card_line_discrete_points_card_line_id_fkey"
            columns: ["card_line_id"]
            isOneToOne: false
            referencedRelation: "kpi_card_lines"
            referencedColumns: ["id"]
          },
        ]
      }
      card_line_l2_scale_ranges: {
        Row: {
          card_line_l2_id: string
          created_at: string
          fixed_pct: number | null
          id: string
          range_from: number
          range_to: number | null
          range_type: Database["public"]["Enums"]["scale_range_type_enum"]
          sort_order: number
        }
        Insert: {
          card_line_l2_id: string
          created_at?: string
          fixed_pct?: number | null
          id?: string
          range_from: number
          range_to?: number | null
          range_type?: Database["public"]["Enums"]["scale_range_type_enum"]
          sort_order?: number
        }
        Update: {
          card_line_l2_id?: string
          created_at?: string
          fixed_pct?: number | null
          id?: string
          range_from?: number
          range_to?: number | null
          range_type?: Database["public"]["Enums"]["scale_range_type_enum"]
          sort_order?: number
        }
        Relationships: [
          {
            foreignKeyName: "card_line_l2_scale_ranges_card_line_l2_id_fkey"
            columns: ["card_line_l2_id"]
            isOneToOne: false
            referencedRelation: "kpi_card_lines_l2"
            referencedColumns: ["id"]
          },
        ]
      }
      card_line_scale_ranges: {
        Row: {
          card_line_id: string
          created_at: string
          fixed_pct: number | null
          id: string
          range_from: number
          range_to: number | null
          range_type: Database["public"]["Enums"]["scale_range_type_enum"]
          sort_order: number
        }
        Insert: {
          card_line_id: string
          created_at?: string
          fixed_pct?: number | null
          id?: string
          range_from: number
          range_to?: number | null
          range_type?: Database["public"]["Enums"]["scale_range_type_enum"]
          sort_order?: number
        }
        Update: {
          card_line_id?: string
          created_at?: string
          fixed_pct?: number | null
          id?: string
          range_from?: number
          range_to?: number | null
          range_type?: Database["public"]["Enums"]["scale_range_type_enum"]
          sort_order?: number
        }
        Relationships: [
          {
            foreignKeyName: "card_line_scale_ranges_card_line_id_fkey"
            columns: ["card_line_id"]
            isOneToOne: false
            referencedRelation: "kpi_card_lines"
            referencedColumns: ["id"]
          },
        ]
      }
      dictionaries: {
        Row: {
          created_at: string
          id: string
          is_system: boolean
          name: string
          show_in_filters: boolean
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          is_system?: boolean
          name: string
          show_in_filters?: boolean
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          is_system?: boolean
          name?: string
          show_in_filters?: boolean
          updated_at?: string
        }
        Relationships: []
      }
      dictionary_values: {
        Row: {
          created_at: string
          dictionary_id: string
          id: string
          sort_order: number
          updated_at: string
          value: string
        }
        Insert: {
          created_at?: string
          dictionary_id: string
          id?: string
          sort_order?: number
          updated_at?: string
          value: string
        }
        Update: {
          created_at?: string
          dictionary_id?: string
          id?: string
          sort_order?: number
          updated_at?: string
          value?: string
        }
        Relationships: [
          {
            foreignKeyName: "dictionary_values_dictionary_id_fkey"
            columns: ["dictionary_id"]
            isOneToOne: false
            referencedRelation: "dictionaries"
            referencedColumns: ["id"]
          },
        ]
      }
      events: {
        Row: {
          created_at: string
          created_by: string | null
          description: string | null
          event_type: Database["public"]["Enums"]["event_type_enum"]
          id: string
          related_card_id: string | null
          title: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          description?: string | null
          event_type: Database["public"]["Enums"]["event_type_enum"]
          id?: string
          related_card_id?: string | null
          title: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          description?: string | null
          event_type?: Database["public"]["Enums"]["event_type_enum"]
          id?: string
          related_card_id?: string | null
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "events_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "events_related_card_id_fkey"
            columns: ["related_card_id"]
            isOneToOne: false
            referencedRelation: "kpi_cards"
            referencedColumns: ["id"]
          },
        ]
      }
      kpi_card_lines: {
        Row: {
          approved_at: string | null
          approved_by: string | null
          approver_comment: string | null
          card_id: string
          composite_type:
            | Database["public"]["Enums"]["composite_type_enum"]
            | null
          created_at: string
          evaluation_method: Database["public"]["Enums"]["evaluation_method_enum"]
          execution_pct: number | null
          fact_value: number | null
          id: string
          is_approved: boolean
          is_composite: boolean
          kpi_id: string | null
          name: string
          participant_comment: string | null
          sort_order: number
          target_value: number | null
          unit: string
          updated_at: string
          weight: number
        }
        Insert: {
          approved_at?: string | null
          approved_by?: string | null
          approver_comment?: string | null
          card_id: string
          composite_type?:
            | Database["public"]["Enums"]["composite_type_enum"]
            | null
          created_at?: string
          evaluation_method: Database["public"]["Enums"]["evaluation_method_enum"]
          execution_pct?: number | null
          fact_value?: number | null
          id?: string
          is_approved?: boolean
          is_composite?: boolean
          kpi_id?: string | null
          name: string
          participant_comment?: string | null
          sort_order?: number
          target_value?: number | null
          unit?: string
          updated_at?: string
          weight?: number
        }
        Update: {
          approved_at?: string | null
          approved_by?: string | null
          approver_comment?: string | null
          card_id?: string
          composite_type?:
            | Database["public"]["Enums"]["composite_type_enum"]
            | null
          created_at?: string
          evaluation_method?: Database["public"]["Enums"]["evaluation_method_enum"]
          execution_pct?: number | null
          fact_value?: number | null
          id?: string
          is_approved?: boolean
          is_composite?: boolean
          kpi_id?: string | null
          name?: string
          participant_comment?: string | null
          sort_order?: number
          target_value?: number | null
          unit?: string
          updated_at?: string
          weight?: number
        }
        Relationships: [
          {
            foreignKeyName: "kpi_card_lines_approved_by_fkey"
            columns: ["approved_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "kpi_card_lines_card_id_fkey"
            columns: ["card_id"]
            isOneToOne: false
            referencedRelation: "kpi_cards"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "kpi_card_lines_kpi_id_fkey"
            columns: ["kpi_id"]
            isOneToOne: false
            referencedRelation: "kpi_library"
            referencedColumns: ["id"]
          },
        ]
      }
      kpi_card_lines_l2: {
        Row: {
          created_at: string
          evaluation_method: Database["public"]["Enums"]["evaluation_method_enum"]
          execution_pct: number | null
          fact_value: number | null
          id: string
          is_approved: boolean
          kpi_id: string | null
          name: string
          parent_line_id: string
          participant_comment: string | null
          sort_order: number
          target_value: number | null
          unit: string
          updated_at: string
          weight: number
        }
        Insert: {
          created_at?: string
          evaluation_method: Database["public"]["Enums"]["evaluation_method_enum"]
          execution_pct?: number | null
          fact_value?: number | null
          id?: string
          is_approved?: boolean
          kpi_id?: string | null
          name: string
          parent_line_id: string
          participant_comment?: string | null
          sort_order?: number
          target_value?: number | null
          unit?: string
          updated_at?: string
          weight?: number
        }
        Update: {
          created_at?: string
          evaluation_method?: Database["public"]["Enums"]["evaluation_method_enum"]
          execution_pct?: number | null
          fact_value?: number | null
          id?: string
          is_approved?: boolean
          kpi_id?: string | null
          name?: string
          parent_line_id?: string
          participant_comment?: string | null
          sort_order?: number
          target_value?: number | null
          unit?: string
          updated_at?: string
          weight?: number
        }
        Relationships: [
          {
            foreignKeyName: "kpi_card_lines_l2_kpi_id_fkey"
            columns: ["kpi_id"]
            isOneToOne: false
            referencedRelation: "kpi_library"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "kpi_card_lines_l2_parent_line_id_fkey"
            columns: ["parent_line_id"]
            isOneToOne: false
            referencedRelation: "kpi_card_lines"
            referencedColumns: ["id"]
          },
        ]
      }
      kpi_cards: {
        Row: {
          approved_at: string | null
          approved_by: string | null
          approver_comment: string | null
          created_at: string
          created_by: string | null
          id: string
          is_complete: boolean
          period_sub: string | null
          period_type: Database["public"]["Enums"]["card_period_type_enum"]
          period_year: number
          status: Database["public"]["Enums"]["kpi_card_status_enum"]
          total_execution_pct: number | null
          total_reward: number | null
          trigger_goal_id: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          approved_at?: string | null
          approved_by?: string | null
          approver_comment?: string | null
          created_at?: string
          created_by?: string | null
          id?: string
          is_complete?: boolean
          period_sub?: string | null
          period_type: Database["public"]["Enums"]["card_period_type_enum"]
          period_year: number
          status?: Database["public"]["Enums"]["kpi_card_status_enum"]
          total_execution_pct?: number | null
          total_reward?: number | null
          trigger_goal_id?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          approved_at?: string | null
          approved_by?: string | null
          approver_comment?: string | null
          created_at?: string
          created_by?: string | null
          id?: string
          is_complete?: boolean
          period_sub?: string | null
          period_type?: Database["public"]["Enums"]["card_period_type_enum"]
          period_year?: number
          status?: Database["public"]["Enums"]["kpi_card_status_enum"]
          total_execution_pct?: number | null
          total_reward?: number | null
          trigger_goal_id?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "kpi_cards_approved_by_fkey"
            columns: ["approved_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "kpi_cards_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "kpi_cards_trigger_goal_id_fkey"
            columns: ["trigger_goal_id"]
            isOneToOne: false
            referencedRelation: "trigger_goals"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "kpi_cards_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      kpi_discrete_points: {
        Row: {
          created_at: string
          execution_pct: number
          fact_value: number
          id: string
          kpi_id: string
          sort_order: number
        }
        Insert: {
          created_at?: string
          execution_pct: number
          fact_value: number
          id?: string
          kpi_id: string
          sort_order?: number
        }
        Update: {
          created_at?: string
          execution_pct?: number
          fact_value?: number
          id?: string
          kpi_id?: string
          sort_order?: number
        }
        Relationships: [
          {
            foreignKeyName: "kpi_discrete_points_kpi_id_fkey"
            columns: ["kpi_id"]
            isOneToOne: false
            referencedRelation: "kpi_library"
            referencedColumns: ["id"]
          },
        ]
      }
      kpi_library: {
        Row: {
          created_at: string
          created_by: string | null
          description: string | null
          evaluation_method: Database["public"]["Enums"]["evaluation_method_enum"]
          id: string
          is_active: boolean
          name: string
          period_date_from: string | null
          period_date_to: string | null
          period_nature: Database["public"]["Enums"]["period_nature_enum"]
          period_preset:
            | Database["public"]["Enums"]["period_preset_enum"]
            | null
          period_single_date: string | null
          period_year: number
          target_value: number | null
          unit: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          description?: string | null
          evaluation_method: Database["public"]["Enums"]["evaluation_method_enum"]
          id?: string
          is_active?: boolean
          name: string
          period_date_from?: string | null
          period_date_to?: string | null
          period_nature?: Database["public"]["Enums"]["period_nature_enum"]
          period_preset?:
            | Database["public"]["Enums"]["period_preset_enum"]
            | null
          period_single_date?: string | null
          period_year: number
          target_value?: number | null
          unit?: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          description?: string | null
          evaluation_method?: Database["public"]["Enums"]["evaluation_method_enum"]
          id?: string
          is_active?: boolean
          name?: string
          period_date_from?: string | null
          period_date_to?: string | null
          period_nature?: Database["public"]["Enums"]["period_nature_enum"]
          period_preset?:
            | Database["public"]["Enums"]["period_preset_enum"]
            | null
          period_single_date?: string | null
          period_year?: number
          target_value?: number | null
          unit?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "kpi_library_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      kpi_library_properties: {
        Row: {
          created_at: string
          dictionary_id: string
          id: string
          kpi_id: string
          value_id: string
        }
        Insert: {
          created_at?: string
          dictionary_id: string
          id?: string
          kpi_id: string
          value_id: string
        }
        Update: {
          created_at?: string
          dictionary_id?: string
          id?: string
          kpi_id?: string
          value_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "kpi_library_properties_dictionary_id_fkey"
            columns: ["dictionary_id"]
            isOneToOne: false
            referencedRelation: "dictionaries"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "kpi_library_properties_kpi_id_fkey"
            columns: ["kpi_id"]
            isOneToOne: false
            referencedRelation: "kpi_library"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "kpi_library_properties_value_id_fkey"
            columns: ["value_id"]
            isOneToOne: false
            referencedRelation: "dictionary_values"
            referencedColumns: ["id"]
          },
        ]
      }
      kpi_scale_ranges: {
        Row: {
          created_at: string
          fixed_pct: number | null
          id: string
          kpi_id: string
          range_from: number
          range_to: number | null
          range_type: Database["public"]["Enums"]["scale_range_type_enum"]
          sort_order: number
        }
        Insert: {
          created_at?: string
          fixed_pct?: number | null
          id?: string
          kpi_id: string
          range_from: number
          range_to?: number | null
          range_type?: Database["public"]["Enums"]["scale_range_type_enum"]
          sort_order?: number
        }
        Update: {
          created_at?: string
          fixed_pct?: number | null
          id?: string
          kpi_id?: string
          range_from?: number
          range_to?: number | null
          range_type?: Database["public"]["Enums"]["scale_range_type_enum"]
          sort_order?: number
        }
        Relationships: [
          {
            foreignKeyName: "kpi_scale_ranges_kpi_id_fkey"
            columns: ["kpi_id"]
            isOneToOne: false
            referencedRelation: "kpi_library"
            referencedColumns: ["id"]
          },
        ]
      }
      trigger_goal_lines: {
        Row: {
          created_at: string
          id: string
          kpi_id: string | null
          official_execution_pct: number | null
          official_fact_value: number | null
          sort_order: number
          target_value: number | null
          trigger_goal_id: string
          updated_at: string
          weight: number
        }
        Insert: {
          created_at?: string
          id?: string
          kpi_id?: string | null
          official_execution_pct?: number | null
          official_fact_value?: number | null
          sort_order?: number
          target_value?: number | null
          trigger_goal_id: string
          updated_at?: string
          weight?: number
        }
        Update: {
          created_at?: string
          id?: string
          kpi_id?: string | null
          official_execution_pct?: number | null
          official_fact_value?: number | null
          sort_order?: number
          target_value?: number | null
          trigger_goal_id?: string
          updated_at?: string
          weight?: number
        }
        Relationships: [
          {
            foreignKeyName: "trigger_goal_lines_kpi_id_fkey"
            columns: ["kpi_id"]
            isOneToOne: false
            referencedRelation: "kpi_library"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "trigger_goal_lines_trigger_goal_id_fkey"
            columns: ["trigger_goal_id"]
            isOneToOne: false
            referencedRelation: "trigger_goals"
            referencedColumns: ["id"]
          },
        ]
      }
      trigger_goals: {
        Row: {
          applicable_levels: string[] | null
          created_at: string
          created_by: string | null
          description: string | null
          id: string
          is_active: boolean
          name: string
          official_execution_pct: number | null
          period_sub: string | null
          period_type: Database["public"]["Enums"]["card_period_type_enum"]
          period_year: number
          updated_at: string
        }
        Insert: {
          applicable_levels?: string[] | null
          created_at?: string
          created_by?: string | null
          description?: string | null
          id?: string
          is_active?: boolean
          name: string
          official_execution_pct?: number | null
          period_sub?: string | null
          period_type: Database["public"]["Enums"]["card_period_type_enum"]
          period_year: number
          updated_at?: string
        }
        Update: {
          applicable_levels?: string[] | null
          created_at?: string
          created_by?: string | null
          description?: string | null
          id?: string
          is_active?: boolean
          name?: string
          official_execution_pct?: number | null
          period_sub?: string | null
          period_type?: Database["public"]["Enums"]["card_period_type_enum"]
          period_year?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "trigger_goals_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      user_trigger_goal_data: {
        Row: {
          card_id: string
          id: string
          trigger_goal_line_id: string
          updated_at: string
          use_official: boolean
          user_fact_value: number | null
        }
        Insert: {
          card_id: string
          id?: string
          trigger_goal_line_id: string
          updated_at?: string
          use_official?: boolean
          user_fact_value?: number | null
        }
        Update: {
          card_id?: string
          id?: string
          trigger_goal_line_id?: string
          updated_at?: string
          use_official?: boolean
          user_fact_value?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "user_trigger_goal_data_card_id_fkey"
            columns: ["card_id"]
            isOneToOne: false
            referencedRelation: "kpi_cards"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_trigger_goal_data_trigger_goal_line_id_fkey"
            columns: ["trigger_goal_line_id"]
            isOneToOne: false
            referencedRelation: "trigger_goal_lines"
            referencedColumns: ["id"]
          },
        ]
      }
      users: {
        Row: {
          approver_id: string | null
          auth_id: string | null
          base_salary: number | null
          company_role_id: string | null
          created_at: string
          first_name: string
          full_name: string | null
          id: string
          is_active: boolean
          last_name: string
          level_value_id: string | null
          middle_name: string | null
          salary_multiplier: number | null
          system_role: Database["public"]["Enums"]["system_role_enum"]
          updated_at: string
          work_email: string
        }
        Insert: {
          approver_id?: string | null
          auth_id?: string | null
          base_salary?: number | null
          company_role_id?: string | null
          created_at?: string
          first_name: string
          full_name?: string | null
          id?: string
          is_active?: boolean
          last_name: string
          level_value_id?: string | null
          middle_name?: string | null
          salary_multiplier?: number | null
          system_role?: Database["public"]["Enums"]["system_role_enum"]
          updated_at?: string
          work_email: string
        }
        Update: {
          approver_id?: string | null
          auth_id?: string | null
          base_salary?: number | null
          company_role_id?: string | null
          created_at?: string
          first_name?: string
          full_name?: string | null
          id?: string
          is_active?: boolean
          last_name?: string
          level_value_id?: string | null
          middle_name?: string | null
          salary_multiplier?: number | null
          system_role?: Database["public"]["Enums"]["system_role_enum"]
          updated_at?: string
          work_email?: string
        }
        Relationships: [
          {
            foreignKeyName: "users_approver_id_fkey"
            columns: ["approver_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "users_company_role_id_fkey"
            columns: ["company_role_id"]
            isOneToOne: false
            referencedRelation: "dictionary_values"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "users_level_value_id_fkey"
            columns: ["level_value_id"]
            isOneToOne: false
            referencedRelation: "dictionary_values"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      approve_card_line: {
        Args: { p_line_id: string; p_user_id: string }
        Returns: Database["public"]["Enums"]["kpi_card_status_enum"]
      }
      auth_user_id: { Args: never; Returns: string }
      auth_user_profile: {
        Args: never
        Returns: {
          approver_id: string | null
          auth_id: string | null
          base_salary: number | null
          company_role_id: string | null
          created_at: string
          first_name: string
          full_name: string | null
          id: string
          is_active: boolean
          last_name: string
          level_value_id: string | null
          middle_name: string | null
          salary_multiplier: number | null
          system_role: Database["public"]["Enums"]["system_role_enum"]
          updated_at: string
          work_email: string
        }
      }
      auth_user_role: {
        Args: never
        Returns: Database["public"]["Enums"]["system_role_enum"]
      }
      calculate_card_reward: { Args: { p_card_id: string }; Returns: number }
      unapprove_card_line: {
        Args: { p_line_id: string; p_user_id: string }
        Returns: Database["public"]["Enums"]["kpi_card_status_enum"]
      }
    }
    Enums: {
      audit_action_enum:
        | "fact_entered"
        | "submitted"
        | "line_approved"
        | "line_unapproved"
        | "card_approved"
        | "card_unapproved"
        | "returned"
        | "line_added"
        | "line_deleted"
        | "card_created"
        | "card_status_changed"
      card_period_type_enum:
        | "Q1"
        | "Q2"
        | "Q3"
        | "Q4"
        | "H1"
        | "H2"
        | "year"
        | "custom"
      composite_type_enum: "weighted" | "additive"
      evaluation_method_enum: "scale" | "binary" | "discrete" | "manual"
      event_type_enum:
        | "card_submitted"
        | "card_approved"
        | "card_returned"
        | "fact_entered"
        | "line_approved"
        | "line_returned"
      kpi_card_status_enum:
        | "draft"
        | "active"
        | "pending_approval"
        | "approved"
        | "returned"
      period_nature_enum: "for_period" | "on_date"
      period_preset_enum:
        | "Q1"
        | "Q2"
        | "Q3"
        | "Q4"
        | "H1"
        | "H2"
        | "year"
        | "custom"
      scale_range_type_enum: "fixed" | "proportional"
      system_role_enum: "admin" | "approver" | "participant"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      audit_action_enum: [
        "fact_entered",
        "submitted",
        "line_approved",
        "line_unapproved",
        "card_approved",
        "card_unapproved",
        "returned",
        "line_added",
        "line_deleted",
        "card_created",
        "card_status_changed",
      ],
      card_period_type_enum: [
        "Q1",
        "Q2",
        "Q3",
        "Q4",
        "H1",
        "H2",
        "year",
        "custom",
      ],
      composite_type_enum: ["weighted", "additive"],
      evaluation_method_enum: ["scale", "binary", "discrete", "manual"],
      event_type_enum: [
        "card_submitted",
        "card_approved",
        "card_returned",
        "fact_entered",
        "line_approved",
        "line_returned",
      ],
      kpi_card_status_enum: [
        "draft",
        "active",
        "pending_approval",
        "approved",
        "returned",
      ],
      period_nature_enum: ["for_period", "on_date"],
      period_preset_enum: [
        "Q1",
        "Q2",
        "Q3",
        "Q4",
        "H1",
        "H2",
        "year",
        "custom",
      ],
      scale_range_type_enum: ["fixed", "proportional"],
      system_role_enum: ["admin", "approver", "participant"],
    },
  },
} as const
