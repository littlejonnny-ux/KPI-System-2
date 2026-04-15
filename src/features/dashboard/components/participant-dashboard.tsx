"use client";

import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { MetricCard } from "./metric-card";
import { StatusBadge } from "./status-badge";
import { formatPeriod } from "./period-utils";
import { useKpiCards } from "@/features/kpi-cards/hooks/use-kpi-cards";
import type { UserProfile } from "@/types/kpi";

interface ParticipantDashboardProps {
  profile: UserProfile;
}

function progressColor(pct: number): string {
  if (pct >= 100) return "[&>div]:bg-green-500";
  if (pct >= 80) return "[&>div]:bg-yellow-500";
  return "[&>div]:bg-red-500";
}

export function ParticipantDashboard({ profile }: ParticipantDashboardProps) {
  const router = useRouter();
  const { data: cards = [], isLoading } = useKpiCards({ userId: profile.id });

  const activeCards = cards.filter(
    (c) => c.status === "active" || c.status === "pending_approval",
  );

  const cardsWithPct = cards.filter((c) => c.totalExecutionPct !== null);
  const avgExecution =
    cardsWithPct.length > 0
      ? Math.round(
          cardsWithPct.reduce((s, c) => s + (c.totalExecutionPct ?? 0), 0) /
            cardsWithPct.length,
        )
      : null;

  const totalReward = cards.reduce((s, c) => s + (c.totalReward ?? 0), 0);

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-3 gap-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="h-24 rounded-lg bg-muted/50 animate-pulse" />
          ))}
        </div>
        <div className="h-64 rounded-lg bg-muted/50 animate-pulse" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <h1 className="text-xl font-semibold">
        Добро пожаловать, {profile.firstName}
      </h1>

      {/* Metrics */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <MetricCard label="Активных карт" value={activeCards.length} />
        <MetricCard
          label="Среднее исполнение"
          value={avgExecution !== null ? `${avgExecution}%` : "—"}
        />
        <MetricCard
          label="Ожидаемое вознаграждение"
          value={
            totalReward > 0
              ? `${totalReward.toLocaleString("ru-RU")} руб.`
              : "—"
          }
        />
      </div>

      {/* Cards list */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground uppercase tracking-widest">
            Мои карты KPI
          </CardTitle>
        </CardHeader>
        <CardContent>
          {cards.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-14 gap-3">
              <p className="text-sm font-medium text-muted-foreground">
                У вас нет карт KPI
              </p>
              <p className="text-xs text-muted-foreground">
                Карты создаются администратором
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              {cards.map((card) => {
                const pct = card.totalExecutionPct ?? 0;
                return (
                  <div
                    key={card.id}
                    className="flex items-center justify-between rounded-lg border border-border bg-muted/30 px-4 py-3 cursor-pointer hover:bg-muted/50 transition-colors"
                    onClick={() => router.push(`/kpi-cards/${card.id}`)}
                  >
                    <div className="flex flex-col gap-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium">
                          {formatPeriod(card.periodType, card.periodYear, card.periodSub)}
                        </span>
                        <StatusBadge status={card.status} />
                      </div>
                      {card.totalExecutionPct !== null && (
                        <div className="flex items-center gap-2">
                          <Progress
                            value={Math.min(pct, 100)}
                            className={`h-1.5 w-32 ${progressColor(pct)}`}
                          />
                          <span className="font-mono text-xs text-muted-foreground">
                            {pct}%
                          </span>
                        </div>
                      )}
                    </div>
                    <div className="flex flex-col items-end gap-1 ml-4 shrink-0">
                      {card.totalReward !== null && card.totalReward > 0 ? (
                        <span className="font-mono text-sm font-semibold text-green-400">
                          {card.totalReward.toLocaleString("ru-RU")} руб.
                        </span>
                      ) : (
                        <span className="text-xs text-muted-foreground">—</span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
