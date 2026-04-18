import { useQuery } from "@tanstack/react-query";
import { createClient } from "@/lib/supabase/client";
import { queryKeys } from "@/features/shared/hooks/query-keys";
import type {
  KpiCard,
  KpiCardSummary,
  KpiCardLine,
  KpiCardLineL2,
  CardLineScaleRange,
  CardLineDiscretePoint,
  UserTriggerGoalData,
} from "@/types/kpi";

export interface KpiCardsFilters {
  userId?: string;
  status?: string;
  periodYear?: number;
}

// ---------------------------------------------------------------------------
// Mappers
// ---------------------------------------------------------------------------

function mapScaleRange(r: {
  id: string;
  range_from: number;
  range_to: number | null;
  range_type: CardLineScaleRange["rangeType"];
  fixed_pct: number | null;
  sort_order: number;
}): CardLineScaleRange {
  return {
    id: r.id,
    rangeFrom: r.range_from,
    rangeTo: r.range_to,
    rangeType: r.range_type,
    fixedPct: r.fixed_pct,
    sortOrder: r.sort_order,
  };
}

function mapDiscretePoint(p: {
  id: string;
  fact_value: number;
  execution_pct: number;
  sort_order: number;
}): CardLineDiscretePoint {
  return {
    id: p.id,
    factValue: p.fact_value,
    executionPct: p.execution_pct,
    sortOrder: p.sort_order,
  };
}

function mapL2Line(l2: {
  id: string;
  parent_line_id: string;
  kpi_id: string | null;
  name: string;
  unit: string;
  evaluation_method: KpiCardLineL2["evaluationMethod"];
  weight: number;
  target_value: number | null;
  fact_value: number | null;
  execution_pct: number | null;
  is_approved: boolean;
  participant_comment: string | null;
  sort_order: number;
  created_at: string;
  updated_at: string;
  card_line_l2_scale_ranges: Array<{
    id: string;
    range_from: number;
    range_to: number | null;
    range_type: CardLineScaleRange["rangeType"];
    fixed_pct: number | null;
    sort_order: number;
  }>;
}): KpiCardLineL2 {
  return {
    id: l2.id,
    parentLineId: l2.parent_line_id,
    kpiId: l2.kpi_id,
    name: l2.name,
    unit: l2.unit,
    evaluationMethod: l2.evaluation_method,
    weight: l2.weight,
    targetValue: l2.target_value,
    factValue: l2.fact_value,
    executionPct: l2.execution_pct,
    isApproved: l2.is_approved,
    participantComment: l2.participant_comment,
    sortOrder: l2.sort_order,
    createdAt: l2.created_at,
    updatedAt: l2.updated_at,
    scaleRanges: l2.card_line_l2_scale_ranges.map(mapScaleRange),
  };
}

function mapCardLine(line: {
  id: string;
  card_id: string;
  kpi_id: string | null;
  name: string;
  unit: string;
  evaluation_method: KpiCardLine["evaluationMethod"];
  weight: number;
  target_value: number | null;
  fact_value: number | null;
  execution_pct: number | null;
  is_composite: boolean;
  composite_type: KpiCardLine["compositeType"];
  is_approved: boolean;
  approved_by: string | null;
  approved_at: string | null;
  approver_comment: string | null;
  participant_comment: string | null;
  sort_order: number;
  created_at: string;
  updated_at: string;
  card_line_scale_ranges: Array<{
    id: string;
    range_from: number;
    range_to: number | null;
    range_type: CardLineScaleRange["rangeType"];
    fixed_pct: number | null;
    sort_order: number;
  }>;
  card_line_discrete_points: Array<{
    id: string;
    fact_value: number;
    execution_pct: number;
    sort_order: number;
  }>;
  kpi_card_lines_l2: Array<{
    id: string;
    parent_line_id: string;
    kpi_id: string | null;
    name: string;
    unit: string;
    evaluation_method: KpiCardLineL2["evaluationMethod"];
    weight: number;
    target_value: number | null;
    fact_value: number | null;
    execution_pct: number | null;
    is_approved: boolean;
    participant_comment: string | null;
    sort_order: number;
    created_at: string;
    updated_at: string;
    card_line_l2_scale_ranges: Array<{
      id: string;
      range_from: number;
      range_to: number | null;
      range_type: CardLineScaleRange["rangeType"];
      fixed_pct: number | null;
      sort_order: number;
    }>;
  }>;
}): KpiCardLine {
  return {
    id: line.id,
    cardId: line.card_id,
    kpiId: line.kpi_id,
    name: line.name,
    unit: line.unit,
    evaluationMethod: line.evaluation_method,
    weight: line.weight,
    targetValue: line.target_value,
    factValue: line.fact_value,
    executionPct: line.execution_pct,
    isComposite: line.is_composite,
    compositeType: line.composite_type,
    isApproved: line.is_approved,
    approvedBy: line.approved_by,
    approvedAt: line.approved_at,
    approverComment: line.approver_comment,
    participantComment: line.participant_comment,
    sortOrder: line.sort_order,
    createdAt: line.created_at,
    updatedAt: line.updated_at,
    scaleRanges: line.card_line_scale_ranges.map(mapScaleRange),
    discretePoints: line.card_line_discrete_points.map(mapDiscretePoint),
    subLines: line.kpi_card_lines_l2.map(mapL2Line),
  };
}

function mapTriggerGoalData(d: {
  id: string;
  card_id: string;
  trigger_goal_line_id: string;
  use_official: boolean;
  user_fact_value: number | null;
  updated_at: string;
}): UserTriggerGoalData {
  return {
    id: d.id,
    cardId: d.card_id,
    triggerGoalLineId: d.trigger_goal_line_id,
    useOfficial: d.use_official,
    userFactValue: d.user_fact_value,
    updatedAt: d.updated_at,
  };
}

function mapCard(row: {
  id: string;
  user_id: string;
  trigger_goal_id: string | null;
  period_year: number;
  period_type: KpiCard["periodType"];
  period_sub: string | null;
  status: KpiCard["status"];
  is_complete: boolean;
  total_execution_pct: number | null;
  total_reward: number | null;
  approved_by: string | null;
  approved_at: string | null;
  approver_comment: string | null;
  created_by: string | null;
  created_at: string;
  updated_at: string;
  kpi_card_lines: Parameters<typeof mapCardLine>[0][];
  user_trigger_goal_data: Array<Parameters<typeof mapTriggerGoalData>[0]>;
}): KpiCard {
  return {
    id: row.id,
    userId: row.user_id,
    triggerGoalId: row.trigger_goal_id,
    periodYear: row.period_year,
    periodType: row.period_type,
    periodSub: row.period_sub,
    status: row.status,
    isComplete: row.is_complete,
    totalExecutionPct: row.total_execution_pct,
    totalReward: row.total_reward,
    approvedBy: row.approved_by,
    approvedAt: row.approved_at,
    approverComment: row.approver_comment,
    createdBy: row.created_by,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    lines: row.kpi_card_lines.map(mapCardLine),
    triggerGoalData: row.user_trigger_goal_data.map(mapTriggerGoalData),
  };
}

// ---------------------------------------------------------------------------
// Fetch helpers
// ---------------------------------------------------------------------------

const CARD_DETAIL_SELECT = `
  *,
  kpi_card_lines(
    *,
    card_line_scale_ranges(*),
    card_line_discrete_points(*),
    kpi_card_lines_l2(
      *,
      card_line_l2_scale_ranges(*)
    )
  ),
  user_trigger_goal_data(*)
` as const;

async function fetchKpiCards(filters: KpiCardsFilters): Promise<KpiCardSummary[]> {
  const supabase = createClient();
  let query = supabase
    .from("kpi_cards")
    .select("id, user_id, period_year, period_type, period_sub, status, total_execution_pct, total_reward, created_at, updated_at, users(full_name, first_name, last_name)")
    .order("created_at", { ascending: false });

  if (filters.userId) query = query.eq("user_id", filters.userId);
  if (filters.status) query = query.eq("status", filters.status);
  if (filters.periodYear) query = query.eq("period_year", filters.periodYear);

  const { data, error } = await query;
  if (error) throw new Error(error.message);

  return (data ?? []).map((row) => {
    const user = (row.users as unknown) as { full_name: string | null; first_name: string; last_name: string } | null;
    const participantName = user?.full_name ?? (user ? `${user.first_name} ${user.last_name}`.trim() : null);
    return {
      id: row.id,
      userId: row.user_id,
      participantName,
      periodYear: row.period_year,
      periodType: row.period_type,
      periodSub: row.period_sub,
      status: row.status,
      totalExecutionPct: row.total_execution_pct,
      totalReward: row.total_reward,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    };
  });
}

async function fetchKpiCard(id: string): Promise<KpiCard> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("kpi_cards")
    .select(CARD_DETAIL_SELECT)
    .eq("id", id)
    .single();

  if (error) throw new Error(error.message);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return mapCard(data as any);
}

// ---------------------------------------------------------------------------
// Hooks
// ---------------------------------------------------------------------------

export function useKpiCards(filters: KpiCardsFilters = {}) {
  return useQuery({
    queryKey: queryKeys.kpiCards.list(filters),
    queryFn: () => fetchKpiCards(filters),
  });
}

export function useKpiCard(id: string | undefined) {
  return useQuery({
    queryKey: queryKeys.kpiCards.detail(id ?? ""),
    queryFn: () => fetchKpiCard(id!),
    enabled: Boolean(id),
  });
}
