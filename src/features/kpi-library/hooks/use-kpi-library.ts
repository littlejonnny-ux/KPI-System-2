import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { createClient } from "@/lib/supabase/client";
import { queryKeys } from "@/features/shared/hooks/query-keys";
import type { Tables, TablesUpdate } from "@/types/database";
import type {
  KpiLibraryItem,
  ScaleRange,
  DiscretePoint,
  KpiLibraryProperty,
  EvaluationMethod,
  PeriodNature,
  PeriodPreset,
} from "@/types/kpi";

// ---------------------------------------------------------------------------
// Input types
// ---------------------------------------------------------------------------

export interface KpiLibraryFilters {
  isActive?: boolean;
  evaluationMethod?: EvaluationMethod;
  periodYear?: number;
  search?: string;
}

export interface CreateKpiInput {
  name: string;
  description?: string | null;
  unit: string;
  evaluationMethod: EvaluationMethod;
  periodYear: number;
  periodNature: PeriodNature;
  periodPreset?: PeriodPreset | null;
  periodDateFrom?: string | null;
  periodDateTo?: string | null;
  periodSingleDate?: string | null;
  targetValue?: number | null;
  createdBy?: string | null;
  scaleRanges?: Omit<ScaleRange, "id">[];
  discretePoints?: Omit<DiscretePoint, "id">[];
  properties?: Omit<KpiLibraryProperty, "id" | "kpiId">[];
}

export type UpdateKpiInput = Partial<CreateKpiInput> & { id: string };

// ---------------------------------------------------------------------------
// Mappers
// ---------------------------------------------------------------------------

function mapKpiItem(row: {
  id: string;
  name: string;
  description: string | null;
  unit: string;
  evaluation_method: Tables<"kpi_library">["evaluation_method"];
  period_year: number;
  period_nature: Tables<"kpi_library">["period_nature"];
  period_preset: Tables<"kpi_library">["period_preset"];
  period_date_from: string | null;
  period_date_to: string | null;
  period_single_date: string | null;
  target_value: number | null;
  is_active: boolean;
  created_by: string | null;
  created_at: string;
  updated_at: string;
  kpi_scale_ranges: Array<{
    id: string;
    range_from: number;
    range_to: number | null;
    range_type: ScaleRange["rangeType"];
    fixed_pct: number | null;
    sort_order: number;
  }>;
  kpi_discrete_points: Array<{
    id: string;
    fact_value: number;
    execution_pct: number;
    sort_order: number;
  }>;
  kpi_library_properties: Array<{
    id: string;
    kpi_id: string;
    dictionary_id: string;
    value_id: string;
  }>;
}): KpiLibraryItem {
  return {
    id: row.id,
    name: row.name,
    description: row.description,
    unit: row.unit,
    evaluationMethod: row.evaluation_method,
    periodYear: row.period_year,
    periodNature: row.period_nature,
    periodPreset: row.period_preset,
    periodDateFrom: row.period_date_from,
    periodDateTo: row.period_date_to,
    periodSingleDate: row.period_single_date,
    targetValue: row.target_value,
    isActive: row.is_active,
    createdBy: row.created_by,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    scaleRanges: row.kpi_scale_ranges.map((r) => ({
      id: r.id,
      rangeFrom: r.range_from,
      rangeTo: r.range_to,
      rangeType: r.range_type,
      fixedPct: r.fixed_pct,
      sortOrder: r.sort_order,
    })),
    discretePoints: row.kpi_discrete_points.map((p) => ({
      id: p.id,
      factValue: p.fact_value,
      executionPct: p.execution_pct,
      sortOrder: p.sort_order,
    })),
    properties: row.kpi_library_properties.map((p) => ({
      id: p.id,
      kpiId: p.kpi_id,
      dictionaryId: p.dictionary_id,
      valueId: p.value_id,
    })),
  };
}

// ---------------------------------------------------------------------------
// Fetch helpers
// ---------------------------------------------------------------------------

const KPI_DETAIL_SELECT = `
  *,
  kpi_scale_ranges(*),
  kpi_discrete_points(*),
  kpi_library_properties(*)
` as const;

async function fetchKpiLibrary(filters: KpiLibraryFilters): Promise<KpiLibraryItem[]> {
  const supabase = createClient();
  let query = supabase
    .from("kpi_library")
    .select(KPI_DETAIL_SELECT)
    .order("name", { ascending: true });

  if (filters.isActive !== undefined) {
    query = query.eq("is_active", filters.isActive);
  }
  if (filters.evaluationMethod) {
    query = query.eq("evaluation_method", filters.evaluationMethod);
  }
  if (filters.periodYear) {
    query = query.eq("period_year", filters.periodYear);
  }
  if (filters.search) {
    query = query.ilike("name", `%${filters.search}%`);
  }

  const { data, error } = await query;
  if (error) throw new Error(error.message);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return (data ?? []).map((row) => mapKpiItem(row as any));
}

// ---------------------------------------------------------------------------
// Mutation helpers
// ---------------------------------------------------------------------------

async function createKpi(input: CreateKpiInput): Promise<{ id: string }> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("kpi_library")
    .insert({
      name: input.name,
      description: input.description ?? null,
      unit: input.unit,
      evaluation_method: input.evaluationMethod,
      period_year: input.periodYear,
      period_nature: input.periodNature,
      period_preset: input.periodPreset ?? null,
      period_date_from: input.periodDateFrom ?? null,
      period_date_to: input.periodDateTo ?? null,
      period_single_date: input.periodSingleDate ?? null,
      target_value: input.targetValue ?? null,
      created_by: input.createdBy ?? null,
    })
    .select("id")
    .single();

  if (error) throw new Error(error.message);

  const kpiId = data.id;

  if (input.scaleRanges?.length) {
    const { error: rangesError } = await supabase
      .from("kpi_scale_ranges")
      .insert(
        input.scaleRanges.map((r) => ({
          kpi_id: kpiId,
          range_from: r.rangeFrom,
          range_to: r.rangeTo,
          range_type: r.rangeType,
          fixed_pct: r.fixedPct,
          sort_order: r.sortOrder,
        })),
      );
    if (rangesError) throw new Error(rangesError.message);
  }

  if (input.discretePoints?.length) {
    const { error: pointsError } = await supabase
      .from("kpi_discrete_points")
      .insert(
        input.discretePoints.map((p) => ({
          kpi_id: kpiId,
          fact_value: p.factValue,
          execution_pct: p.executionPct,
          sort_order: p.sortOrder,
        })),
      );
    if (pointsError) throw new Error(pointsError.message);
  }

  if (input.properties?.length) {
    const { error: propsError } = await supabase
      .from("kpi_library_properties")
      .insert(
        input.properties.map((p) => ({
          kpi_id: kpiId,
          dictionary_id: p.dictionaryId,
          value_id: p.valueId,
        })),
      );
    if (propsError) throw new Error(propsError.message);
  }

  return { id: kpiId };
}

async function updateKpi(input: UpdateKpiInput): Promise<void> {
  const supabase = createClient();
  const updateData: Partial<TablesUpdate<"kpi_library">> = {};

  if (input.name !== undefined) updateData.name = input.name;
  if (input.description !== undefined) updateData.description = input.description;
  if (input.unit !== undefined) updateData.unit = input.unit;
  if (input.evaluationMethod !== undefined)
    updateData.evaluation_method = input.evaluationMethod;
  if (input.periodYear !== undefined) updateData.period_year = input.periodYear;
  if (input.periodNature !== undefined)
    updateData.period_nature = input.periodNature;
  if (input.periodPreset !== undefined)
    updateData.period_preset = input.periodPreset ?? null;
  if (input.periodDateFrom !== undefined)
    updateData.period_date_from = input.periodDateFrom ?? null;
  if (input.periodDateTo !== undefined)
    updateData.period_date_to = input.periodDateTo ?? null;
  if (input.periodSingleDate !== undefined)
    updateData.period_single_date = input.periodSingleDate ?? null;
  if (input.targetValue !== undefined)
    updateData.target_value = input.targetValue ?? null;

  updateData.updated_at = new Date().toISOString();

  const { error } = await supabase
    .from("kpi_library")
    .update(updateData)
    .eq("id", input.id);

  if (error) throw new Error(error.message);
}

async function deleteKpi(id: string): Promise<void> {
  const supabase = createClient();
  const { error } = await supabase
    .from("kpi_library")
    .update({ is_active: false, updated_at: new Date().toISOString() })
    .eq("id", id);

  if (error) throw new Error(error.message);
}

async function duplicateKpi(id: string): Promise<{ id: string }> {
  const supabase = createClient();

  const { data: source, error: fetchError } = await supabase
    .from("kpi_library")
    .select(KPI_DETAIL_SELECT)
    .eq("id", id)
    .single();

  if (fetchError) throw new Error(fetchError.message);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const src = mapKpiItem(source as any);

  return createKpi({
    name: `${src.name} (копия)`,
    description: src.description,
    unit: src.unit,
    evaluationMethod: src.evaluationMethod,
    periodYear: src.periodYear,
    periodNature: src.periodNature,
    periodPreset: src.periodPreset,
    periodDateFrom: src.periodDateFrom,
    periodDateTo: src.periodDateTo,
    periodSingleDate: src.periodSingleDate,
    targetValue: src.targetValue,
    scaleRanges: src.scaleRanges.map(({ id: _id, ...rest }) => rest),
    discretePoints: src.discretePoints.map(({ id: _id, ...rest }) => rest),
    properties: src.properties.map(({ id: _id, kpiId: _kpiId, ...rest }) => rest),
  });
}

// ---------------------------------------------------------------------------
// Hooks
// ---------------------------------------------------------------------------

export function useKpiLibrary(filters: KpiLibraryFilters = {}) {
  return useQuery({
    queryKey: queryKeys.kpiLibrary.list(filters),
    queryFn: () => fetchKpiLibrary(filters),
  });
}

export function useCreateKpi() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: createKpi,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.kpiLibrary.all });
    },
  });
}

export function useUpdateKpi() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: updateKpi,
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.kpiLibrary.all });
      queryClient.invalidateQueries({
        queryKey: queryKeys.kpiLibrary.detail(variables.id),
      });
    },
  });
}

export function useDeleteKpi() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: deleteKpi,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.kpiLibrary.all });
    },
  });
}

export function useDuplicateKpi() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: duplicateKpi,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.kpiLibrary.all });
    },
  });
}
