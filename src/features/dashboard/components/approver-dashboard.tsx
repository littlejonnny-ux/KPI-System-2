"use client";

import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { MetricCard } from "./metric-card";
import { StatusBadge } from "./status-badge";
import { formatPeriod } from "./period-utils";
import { useKpiCards } from "@/features/kpi-cards/hooks/use-kpi-cards";
import { useParticipants } from "@/features/participants/hooks/use-participants";
import type { UserProfile } from "@/types/kpi";
import type { KpiCardSummary } from "@/types/kpi";

interface ApproverDashboardProps {
  profile: UserProfile;
}

interface PendingCardRowProps {
  card: KpiCardSummary;
  participantName: string;
  onNavigate: (id: string) => void;
}

function PendingCardRow({ card, participantName, onNavigate }: PendingCardRowProps) {
  return (
    <TableRow
      className="cursor-pointer hover:bg-muted/20 transition-colors"
      onClick={() => onNavigate(card.id)}
    >
      <TableCell className="text-sm py-2.5 px-3.5 font-medium">{participantName}</TableCell>
      <TableCell className="text-sm py-2.5 px-3.5 text-muted-foreground">
        {formatPeriod(card.periodType, card.periodYear, card.periodSub)}
      </TableCell>
      <TableCell className="text-sm py-2.5 px-3.5">
        <StatusBadge status={card.status} />
      </TableCell>
      <TableCell className="py-2.5 px-3.5 text-right">
        <Button
          variant="outline"
          size="sm"
          onClick={(e) => {
            e.stopPropagation();
            onNavigate(card.id);
          }}
        >
          Рассмотреть
        </Button>
      </TableCell>
    </TableRow>
  );
}

interface OwnCardRowProps {
  card: KpiCardSummary;
  onNavigate: (id: string) => void;
}

function OwnCardRow({ card, onNavigate }: OwnCardRowProps) {
  return (
    <TableRow
      className="cursor-pointer hover:bg-muted/20 transition-colors"
      onClick={() => onNavigate(card.id)}
    >
      <TableCell className="text-sm py-2.5 px-3.5 text-muted-foreground">
        {formatPeriod(card.periodType, card.periodYear, card.periodSub)}
      </TableCell>
      <TableCell className="text-sm py-2.5 px-3.5">
        <StatusBadge status={card.status} />
      </TableCell>
      <TableCell className="text-sm py-2.5 px-3.5 text-right font-mono text-muted-foreground">
        {card.totalExecutionPct !== null ? `${card.totalExecutionPct}%` : "—"}
      </TableCell>
    </TableRow>
  );
}

export function ApproverDashboard({ profile }: ApproverDashboardProps) {
  const router = useRouter();

  // Load all cards visible to the approver (RLS-filtered)
  const { data: allCards = [], isLoading: cardsLoading } = useKpiCards();
  // Load subordinates
  const { data: subordinates = [], isLoading: subLoading } = useParticipants({
    approverId: profile.id,
  });

  const subordinateIds = new Set(subordinates.map((s) => s.id));
  const participantMap = new Map(subordinates.map((s) => [s.id, s]));

  const ownCards = allCards.filter((c) => c.userId === profile.id);
  const pendingCards = allCards.filter(
    (c) => c.status === "pending_approval" && subordinateIds.has(c.userId),
  );

  const isLoading = cardsLoading || subLoading;

  const navigateToCard = (id: string) => router.push(`/kpi-cards/${id}`);

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-2 gap-4">
          {Array.from({ length: 2 }).map((_, i) => (
            <div key={i} className="h-24 rounded-lg bg-muted/50 animate-pulse" />
          ))}
        </div>
        <div className="h-48 rounded-lg bg-muted/50 animate-pulse" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold">
          Добро пожаловать, {profile.firstName}
        </h1>
        <Button variant="outline" size="sm" onClick={() => router.push("/approvals")}>
          Все согласования
        </Button>
      </div>

      {/* Metrics */}
      <div className="grid grid-cols-2 gap-4">
        <MetricCard label="Мои карты" value={ownCards.length} />
        <MetricCard
          label="Ожидают согласования"
          value={pendingCards.length}
          description={pendingCards.length > 0 ? "Требуют вашего рассмотрения" : undefined}
        />
      </div>

      {/* Pending cards */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground uppercase tracking-widest">
            Карты на согласовании
          </CardTitle>
        </CardHeader>
        <CardContent>
          {pendingCards.length === 0 ? (
            <p className="py-8 text-center text-sm text-muted-foreground">
              Нет карт, ожидающих согласования
            </p>
          ) : (
            <div className="rounded-lg border overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="uppercase text-xs tracking-widest text-muted-foreground bg-muted/50">Участник</TableHead>
                    <TableHead className="uppercase text-xs tracking-widest text-muted-foreground bg-muted/50">Период</TableHead>
                    <TableHead className="uppercase text-xs tracking-widest text-muted-foreground bg-muted/50">Статус</TableHead>
                    <TableHead className="bg-muted/50" />
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {pendingCards.map((card) => {
                    const p = participantMap.get(card.userId);
                    const name = p ? `${p.lastName} ${p.firstName}` : "—";
                    return (
                      <PendingCardRow
                        key={card.id}
                        card={card}
                        participantName={name}
                        onNavigate={navigateToCard}
                      />
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Own cards */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground uppercase tracking-widest">
            Мои карты KPI
          </CardTitle>
        </CardHeader>
        <CardContent>
          {ownCards.length === 0 ? (
            <p className="py-8 text-center text-sm text-muted-foreground">
              У вас нет карт KPI
            </p>
          ) : (
            <div className="rounded-lg border overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="uppercase text-xs tracking-widest text-muted-foreground bg-muted/50">Период</TableHead>
                    <TableHead className="uppercase text-xs tracking-widest text-muted-foreground bg-muted/50">Статус</TableHead>
                    <TableHead className="uppercase text-xs tracking-widest text-muted-foreground bg-muted/50 text-right">% исполнения</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {ownCards.map((card) => (
                    <OwnCardRow key={card.id} card={card} onNavigate={navigateToCard} />
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
