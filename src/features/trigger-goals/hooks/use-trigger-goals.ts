import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { createClient } from "@/lib/supabase/client";
import { queryKeys } from "@/features/shared/hooks/query-keys";
import type { Tables, TablesUpdate } from "@/types/database";
import type {
  TriggerGoal,
  TriggerGoalLine,
  UserTriggerGoalData,
  CardPeriodType,
} from "@/types/kpi";

// ---------------------------------------------------------------------------
// Input types
// ---------------------------------------------------------------------------

export interface TriggerGoalsFilters {
  isActive?: boolean;
  periodYear?: number;
  periodType?: CardPeriodType;
}

export interface CreateTriggerGoalInput {
  name: string;
  description?: string | null;
  periodYear: number;
  periodType: CardPeriodType;
  periodSub?: string | null;
  applicableLevels?: string[] | null;
  createdBy?: string | null;
  lines?: CreateTriggerGoalLineInput[];
}

export interface CreateTriggerGoalLineInput {
  kpiId?: string | null;
  weight: number;
  targetValue?: number | null;
  sortOrder?: number;
}

export interface UpdateTriggerGoalInput {
  id: string;
  name?: string;
  description?: string | null;
  periodYear?: number;
  periodType?: CardPeriodType;
  periodSub?: string | null;
  applicableLevels?: string[] | null;
  isActive?: boolean;
  officialExecutionPct?: number | null;
}

export interface UpdateTriggerGoalLineInput {
  id: string;
  triggerGoalId: string;
  officialFactValue?: number | null;
  officialExecutionPct?: number | null;
  targetValue?: number | null;
  weight?: number;
}

export interface UpsertUserTriggerGoalDataInput {
  cardId: string;
  triggerGoalLineId: string;
  useOfficial: boolean;
  userFactValue?: number | null;
}

// ---------------------------------------------------------------------------
// Mappers
// ---------------------------------------------------------------------------

function mapTriggerGoalLine(row: Tables<"trigger_goal_lines">): TriggerGoalLine {
  return {
    id: row.id,
    triggerGoalId: row.trigger_goal_id,
    kpiId: row.kpi_id,
    weight: row.weight,
    targetValue: row.target_value,
    officialFactValue: row.official_fact_value,
    officialExecutionPct: row.official_execution_pct,
    sortOrder: row.sort_order,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function mapTriggerGoal(row: {
  id: string;
  name: string;
  description: string | null;
  period_year: number;
  period_type: Tables<"trigger_goals">["period_type"];
  period_sub: string | null;
  official_execution_pct: number | null;
  applicable_levels: string[] | null;
  is_active: boolean;
  created_by: string | null;
  created_at: string;
  updated_at: string;
  trigger_goal_lines: Array<Tables<"trigger_goal_lines">>;
}): TriggerGoal {
  return {
    id: row.id,
    name: row.name,
    description: row.description,
    periodYear: row.period_year,
    periodType: row.period_type,
    periodSub: row.period_sub,
    officialExecutionPct: row.official_execution_pct,
    applicableLevels: row.applicable_levels,
    isActive: row.is_active,
    createdBy: row.created_by,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    lines: row.trigger_goal_lines.map(mapTriggerGoalLine),
  };
}

function mapUserTriggerGoalData(
  row: Tables<"user_trigger_goal_data">,
): UserTriggerGoalData {
  return {
    id: row.id,
    cardId: row.card_id,
    triggerGoalLineId: row.trigger_goal_line_id,
    useOfficial: row.use_official,
    userFactValue: row.user_fact_value,
    updatedAt: row.updated_at,
  };
}

// ---------------------------------------------------------------------------
// Fetch helpers
// ---------------------------------------------------------------------------

const TRIGGER_GOAL_SELECT = `
  *,
  trigger_goal_lines(*)
` as const;

async function fetchTriggerGoals(filters: TriggerGoalsFilters): Promise<TriggerGoal[]> {
  const supabase = createClient();
  let query = supabase
    .from("trigger_goals")
    .select(TRIGGER_GOAL_SELECT)
    .order("name", { ascending: true });

  if (filters.isActive !== undefined) {
    query = query.eq("is_active", filters.isActive);
  }
  if (filters.periodYear) {
    query = query.eq("period_year", filters.periodYear);
  }
  if (filters.periodType) {
    query = query.eq("period_type", filters.periodType);
  }

  const { data, error } = await query;
  if (error) throw new Error(error.message);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return (data ?? []).map((row) => mapTriggerGoal(row as any));
}

async function fetchUserTriggerGoalData(cardId: string): Promise<UserTriggerGoalData[]> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("user_trigger_goal_data")
    .select("*")
    .eq("card_id", cardId);

  if (error) throw new Error(error.message);
  return (data ?? []).map(mapUserTriggerGoalData);
}

// ---------------------------------------------------------------------------
// Mutation helpers
// ---------------------------------------------------------------------------

async function createTriggerGoal(input: CreateTriggerGoalInput): Promise<{ id: string }> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("trigger_goals")
    .insert({
      name: input.name,
      description: input.description ?? null,
      period_year: input.periodYear,
      period_type: input.periodType,
      period_sub: input.periodSub ?? null,
      applicable_levels: input.applicableLevels ?? null,
      created_by: input.createdBy ?? null,
    })
    .select("id")
    .single();

  if (error) throw new Error(error.message);

  const goalId = data.id;

  if (input.lines?.length) {
    const { error: linesError } = await supabase
      .from("trigger_goal_lines")
      .insert(
        input.lines.map((l, i) => ({
          trigger_goal_id: goalId,
          kpi_id: l.kpiId ?? null,
          weight: l.weight,
          target_value: l.targetValue ?? null,
          sort_order: l.sortOrder ?? i,
        })),
      );
    if (linesError) throw new Error(linesError.message);
  }

  return { id: goalId };
}

async function updateTriggerGoal(input: UpdateTriggerGoalInput): Promise<void> {
  const supabase = createClient();
  const updateData: Partial<TablesUpdate<"trigger_goals">> = {};

  if (input.name !== undefined) updateData.name = input.name;
  if (input.description !== undefined) updateData.description = input.description;
  if (input.periodYear !== undefined) updateData.period_year = input.periodYear;
  if (input.periodType !== undefined) updateData.period_type = input.periodType;
  if (input.periodSub !== undefined) updateData.period_sub = input.periodSub ?? null;
  if (input.applicableLevels !== undefined)
    updateData.applicable_levels = input.applicableLevels ?? null;
  if (input.isActive !== undefined) updateData.is_active = input.isActive;
  if (input.officialExecutionPct !== undefined)
    updateData.official_execution_pct = input.officialExecutionPct ?? null;

  updateData.updated_at = new Date().toISOString();

  const { error } = await supabase
    .from("trigger_goals")
    .update(updateData)
    .eq("id", input.id);

  if (error) throw new Error(error.message);
}

async function updateTriggerGoalLine(input: UpdateTriggerGoalLineInput): Promise<void> {
  const supabase = createClient();
  const updateData: Partial<TablesUpdate<"trigger_goal_lines">> = {};

  if (input.officialFactValue !== undefined)
    updateData.official_fact_value = input.officialFactValue ?? null;
  if (input.officialExecutionPct !== undefined)
    updateData.official_execution_pct = input.officialExecutionPct ?? null;
  if (input.targetValue !== undefined)
    updateData.target_value = input.targetValue ?? null;
  if (input.weight !== undefined) updateData.weight = input.weight;

  updateData.updated_at = new Date().toISOString();

  const { error } = await supabase
    .from("trigger_goal_lines")
    .update(updateData)
    .eq("id", input.id);

  if (error) throw new Error(error.message);
}

async function deleteTriggerGoal(id: string): Promise<void> {
  const supabase = createClient();
  const { error } = await supabase
    .from("trigger_goals")
    .update({ is_active: false, updated_at: new Date().toISOString() })
    .eq("id", id);

  if (error) throw new Error(error.message);
}

async function upsertUserTriggerGoalData(
  input: UpsertUserTriggerGoalDataInput,
): Promise<void> {
  const supabase = createClient();
  const { error } = await supabase
    .from("user_trigger_goal_data")
    .upsert(
      {
        card_id: input.cardId,
        trigger_goal_line_id: input.triggerGoalLineId,
        use_official: input.useOfficial,
        user_fact_value: input.userFactValue ?? null,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "card_id,trigger_goal_line_id" },
    );

  if (error) throw new Error(error.message);
}

// ---------------------------------------------------------------------------
// Hooks
// ---------------------------------------------------------------------------

export function useTriggerGoals(filters: TriggerGoalsFilters = {}) {
  return useQuery({
    queryKey: queryKeys.triggerGoals.list(filters),
    queryFn: () => fetchTriggerGoals(filters),
  });
}

export function useUserTriggerGoalData(cardId: string | undefined) {
  return useQuery({
    queryKey: queryKeys.triggerGoals.userData(cardId ?? ""),
    queryFn: () => fetchUserTriggerGoalData(cardId!),
    enabled: Boolean(cardId),
  });
}

export function useCreateTriggerGoal() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: createTriggerGoal,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.triggerGoals.all });
    },
  });
}

export function useUpdateTriggerGoal() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: updateTriggerGoal,
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.triggerGoals.all });
      queryClient.invalidateQueries({
        queryKey: queryKeys.triggerGoals.detail(variables.id),
      });
    },
  });
}

export function useUpdateTriggerGoalLine() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: updateTriggerGoalLine,
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.triggerGoals.all });
      queryClient.invalidateQueries({
        queryKey: queryKeys.triggerGoals.detail(variables.triggerGoalId),
      });
    },
  });
}

export function useDeleteTriggerGoal() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: deleteTriggerGoal,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.triggerGoals.all });
    },
  });
}

export function useUpsertUserTriggerGoalData() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: upsertUserTriggerGoalData,
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.triggerGoals.userData(variables.cardId),
      });
      queryClient.invalidateQueries({
        queryKey: queryKeys.kpiCards.detail(variables.cardId),
      });
    },
  });
}

