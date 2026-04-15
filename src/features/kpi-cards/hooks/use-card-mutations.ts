import { useMutation, useQueryClient } from "@tanstack/react-query";
import { createClient } from "@/lib/supabase/client";
import { queryKeys } from "@/features/shared/hooks/query-keys";
import type { Tables } from "@/types/database";
import type { KpiCardStatus } from "@/types/kpi";

// ---------------------------------------------------------------------------
// Input types
// ---------------------------------------------------------------------------

export interface CreateCardInput {
  userId: string;
  periodYear: number;
  periodType: Tables<"kpi_cards">["period_type"];
  periodSub?: string | null;
  triggerGoalId?: string | null;
  createdBy?: string | null;
}

export interface UpdateFactInput {
  lineId: string;
  cardId: string;
  factValue: number | null;
  executionPct?: number | null;
  participantComment?: string | null;
}

export interface UpdateFactL2Input {
  l2Id: string;
  cardId: string;
  factValue: number | null;
  executionPct?: number | null;
  participantComment?: string | null;
}

export interface ApproveLineInput {
  lineId: string;
  cardId: string;
  approvedBy: string;
  comment?: string | null;
}

export interface ReturnLineInput {
  lineId: string;
  cardId: string;
  comment: string;
}

export interface UnapproveLineInput {
  lineId: string;
  cardId: string;
}

export interface ReturnCardInput {
  cardId: string;
  comment: string;
}

export interface DeleteLineInput {
  lineId: string;
  cardId: string;
}

// ---------------------------------------------------------------------------
// Mutation helpers
// ---------------------------------------------------------------------------

async function createCard(input: CreateCardInput): Promise<{ id: string }> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("kpi_cards")
    .insert({
      user_id: input.userId,
      period_year: input.periodYear,
      period_type: input.periodType,
      period_sub: input.periodSub ?? null,
      trigger_goal_id: input.triggerGoalId ?? null,
      created_by: input.createdBy ?? null,
    })
    .select("id")
    .single();

  if (error) throw new Error(error.message);
  return { id: data.id };
}

async function updateFact(input: UpdateFactInput): Promise<void> {
  const supabase = createClient();
  const { error } = await supabase
    .from("kpi_card_lines")
    .update({
      fact_value: input.factValue,
      execution_pct: input.executionPct ?? null,
      participant_comment: input.participantComment ?? null,
      updated_at: new Date().toISOString(),
    })
    .eq("id", input.lineId);

  if (error) throw new Error(error.message);
}

async function updateFactL2(input: UpdateFactL2Input): Promise<void> {
  const supabase = createClient();
  const { error } = await supabase
    .from("kpi_card_lines_l2")
    .update({
      fact_value: input.factValue,
      execution_pct: input.executionPct ?? null,
      participant_comment: input.participantComment ?? null,
      updated_at: new Date().toISOString(),
    })
    .eq("id", input.l2Id);

  if (error) throw new Error(error.message);
}

async function submitForApproval(cardId: string): Promise<void> {
  const supabase = createClient();
  const { error } = await supabase
    .from("kpi_cards")
    .update({
      status: "pending_approval" as KpiCardStatus,
      updated_at: new Date().toISOString(),
    })
    .eq("id", cardId);

  if (error) throw new Error(error.message);
}

async function approveLine(input: ApproveLineInput): Promise<void> {
  const supabase = createClient();
  const { error } = await supabase.rpc("approve_card_line", {
    p_line_id: input.lineId,
    p_approver_id: input.approvedBy,
    p_comment: input.comment ?? null,
  });

  if (error) throw new Error(error.message);
}

async function returnLine(input: ReturnLineInput): Promise<void> {
  const supabase = createClient();
  const { error } = await supabase
    .from("kpi_card_lines")
    .update({
      approver_comment: input.comment,
      updated_at: new Date().toISOString(),
    })
    .eq("id", input.lineId);

  if (error) throw new Error(error.message);
}

async function unapproveLine(input: UnapproveLineInput): Promise<void> {
  const supabase = createClient();
  const { error } = await supabase.rpc("unapprove_card_line", {
    p_line_id: input.lineId,
  });

  if (error) throw new Error(error.message);
}

async function returnCard(input: ReturnCardInput): Promise<void> {
  const supabase = createClient();
  const { error } = await supabase
    .from("kpi_cards")
    .update({
      status: "returned" as KpiCardStatus,
      approver_comment: input.comment,
      updated_at: new Date().toISOString(),
    })
    .eq("id", input.cardId);

  if (error) throw new Error(error.message);
}

async function deleteLine(input: DeleteLineInput): Promise<void> {
  const supabase = createClient();
  const { error } = await supabase
    .from("kpi_card_lines")
    .delete()
    .eq("id", input.lineId);

  if (error) throw new Error(error.message);
}

// ---------------------------------------------------------------------------
// Hooks
// ---------------------------------------------------------------------------

export function useCreateCard() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: createCard,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.kpiCards.all });
    },
  });
}

export function useUpdateFact() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: updateFact,
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.kpiCards.detail(variables.cardId),
      });
    },
  });
}

export function useUpdateFactL2() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: updateFactL2,
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.kpiCards.detail(variables.cardId),
      });
    },
  });
}

export function useSubmitForApproval() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: submitForApproval,
    onSuccess: (_data, cardId) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.kpiCards.all });
      queryClient.invalidateQueries({
        queryKey: queryKeys.kpiCards.detail(cardId),
      });
    },
  });
}

export function useApproveLine() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: approveLine,
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.kpiCards.detail(variables.cardId),
      });
    },
  });
}

export function useReturnLine() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: returnLine,
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.kpiCards.detail(variables.cardId),
      });
    },
  });
}

export function useUnapproveLine() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: unapproveLine,
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.kpiCards.detail(variables.cardId),
      });
    },
  });
}

export function useReturnCard() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: returnCard,
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.kpiCards.all });
      queryClient.invalidateQueries({
        queryKey: queryKeys.kpiCards.detail(variables.cardId),
      });
    },
  });
}

export function useDeleteLine() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: deleteLine,
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.kpiCards.detail(variables.cardId),
      });
    },
  });
}
