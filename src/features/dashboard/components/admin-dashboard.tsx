"use client";

import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { MetricCard } from "./metric-card";
import { ExecutionByUserChart } from "./execution-by-user-chart";
import { StatusDistributionChart } from "./status-distribution-chart";
import { CardsTable } from "./cards-table";
import { RewardsSummaryTable } from "./rewards-summary-table";
import { useKpiCards } from "@/features/kpi-cards/hooks/use-kpi-cards";
import { useParticipants } from "@/features/participants/hooks/use-participants";
function DashboardSkeleton() {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="h-24 rounded-lg bg-muted/50 animate-pulse" />
        ))}
      </div>
      <div className="h-64 rounded-lg bg-muted/50 animate-pulse" />
    </div>
  );
}

export function AdminDashboard() {
  const router = useRouter();
  const { data: cards = [], isLoading: cardsLoading } = useKpiCards();
  const { data: participants = [], isLoading: participantsLoading } = useParticipants();

  if (cardsLoading || participantsLoading) {
    return <DashboardSkeleton />;
  }

  const totalParticipants = participants.filter((p) => p.isActive).length;
  const totalCards = cards.length;
  const approvedCards = cards.filter((c) => c.status === "approved").length;
  const pendingCards = cards.filter((c) => c.status === "pending_approval").length;

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold">Панель администратора</h1>
        <Button
          variant="outline"
          size="sm"
          onClick={() => router.push("/kpi-cards")}
        >
          Управление картами
        </Button>
      </div>

      {/* Metrics */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <MetricCard label="Участников" value={totalParticipants} />
        <MetricCard label="Карт KPI" value={totalCards} />
        <MetricCard
          label="Утверждено"
          value={approvedCards}
          description={totalCards > 0 ? `${Math.round((approvedCards / totalCards) * 100)}% от всех` : undefined}
        />
        <MetricCard label="На согласовании" value={pendingCards} />
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground uppercase tracking-widest">
              Исполнение по участникам
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ExecutionByUserChart cards={cards} participants={participants} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground uppercase tracking-widest">
              Распределение по статусам
            </CardTitle>
          </CardHeader>
          <CardContent>
            <StatusDistributionChart cards={cards} />
          </CardContent>
        </Card>
      </div>

      {/* Cards table */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground uppercase tracking-widest">
            Карты KPI — все участники
          </CardTitle>
        </CardHeader>
        <CardContent>
          <CardsTable cards={cards} participants={participants} />
        </CardContent>
      </Card>

      {/* Rewards summary */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground uppercase tracking-widest">
            Сводная таблица вознаграждений
          </CardTitle>
        </CardHeader>
        <CardContent>
          <RewardsSummaryTable cards={cards} participants={participants} />
        </CardContent>
      </Card>
    </div>
  );
}
