"use client";

import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { createClient } from "@/lib/supabase/client";
import { calcCardTotal, calcReward } from "@/lib/calculations";
import type { KpiCard } from "@/types/kpi";

interface KpiCardRewardProps {
  card: KpiCard;
}

function formatCurrency(value: number): string {
  return new Intl.NumberFormat("ru-RU", {
    style: "currency",
    currency: "RUB",
    maximumFractionDigits: 0,
  }).format(value);
}

async function fetchParticipantSalary(
  userId: string
): Promise<{ baseSalary: number | null; salaryMultiplier: number | null }> {
  const supabase = createClient();
  const { data } = await supabase
    .from("users")
    .select("base_salary, salary_multiplier")
    .eq("id", userId)
    .single();
  return {
    baseSalary: (data as { base_salary?: number | null } | null)?.base_salary ?? null,
    salaryMultiplier: (data as { salary_multiplier?: number | null } | null)?.salary_multiplier ?? null,
  };
}

export function KpiCardReward({ card }: KpiCardRewardProps) {
  const { data: salaryData } = useQuery({
    queryKey: ["participant-salary", card.userId],
    queryFn: () => fetchParticipantSalary(card.userId),
  });

  const { data: triggerGoal } = useQuery({
    queryKey: ["trigger-goal", card.triggerGoalId],
    queryFn: async () => {
      const supabase = createClient();
      const { data } = await supabase
        .from("trigger_goals")
        .select("official_execution_pct")
        .eq("id", card.triggerGoalId!)
        .single();
      return data as { official_execution_pct: number | null } | null;
    },
    enabled: Boolean(card.triggerGoalId),
  });

  const cardTotals = useMemo(
    () =>
      calcCardTotal(
        card.lines.map((l) => ({ weight: l.weight, executionPct: l.executionPct }))
      ),
    [card.lines]
  );

  const liveExecPct = cardTotals.totalWeight > 0 ? cardTotals.result : card.totalExecutionPct;

  const liveReward = useMemo(() => {
    const { baseSalary, salaryMultiplier } = salaryData ?? {};
    if (!baseSalary || !salaryMultiplier) return card.totalReward;
    const triggerGoalPct = triggerGoal?.official_execution_pct ?? 100;
    const kpiPct = liveExecPct ?? 0;
    return calcReward(baseSalary, salaryMultiplier, triggerGoalPct, kpiPct);
  }, [salaryData, triggerGoal, liveExecPct, card.totalReward]);

  const execPct = liveExecPct;
  const reward = liveReward;

  return (
    <Card data-testid="kpi-card-reward">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">
          Итог
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-1">
          <div className="flex items-center justify-between text-sm">
            <span>Выполнение KPI</span>
            <span className="font-semibold tabular-nums">
              {execPct !== null ? `${execPct.toFixed(1)} %` : "—"}
            </span>
          </div>
          {execPct !== null && (
            <Progress value={Math.min(execPct, 100)} className="h-2" />
          )}
        </div>

        <div className="flex items-center justify-between text-sm">
          <span>Вознаграждение</span>
          <span className="font-semibold tabular-nums">
            {reward !== null ? formatCurrency(reward) : "—"}
          </span>
        </div>
      </CardContent>
    </Card>
  );
}
