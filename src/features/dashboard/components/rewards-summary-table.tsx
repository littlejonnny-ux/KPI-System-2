"use client";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { StatusBadge } from "./status-badge";
import { formatPeriod } from "./period-utils";
import type { KpiCardSummary, UserProfile } from "@/types/kpi";

interface RewardsSummaryTableProps {
  cards: KpiCardSummary[];
  participants: UserProfile[];
}

export function RewardsSummaryTable({ cards, participants }: RewardsSummaryTableProps) {
  const profileMap = new Map(participants.map((p) => [p.id, p]));

  const rewardCards = cards
    .filter((c) => c.totalReward !== null && c.totalReward > 0)
    .sort((a, b) => (b.totalReward ?? 0) - (a.totalReward ?? 0));

  const totalReward = rewardCards.reduce((sum, c) => sum + (c.totalReward ?? 0), 0);

  if (rewardCards.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-10 gap-2">
        <p className="text-sm font-medium text-muted-foreground">
          Нет карт с рассчитанным вознаграждением
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <div className="rounded-lg border overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="uppercase text-xs tracking-widest text-muted-foreground bg-muted/50">
                Участник
              </TableHead>
              <TableHead className="uppercase text-xs tracking-widest text-muted-foreground bg-muted/50">
                Период
              </TableHead>
              <TableHead className="uppercase text-xs tracking-widest text-muted-foreground bg-muted/50 text-right">
                % KPI
              </TableHead>
              <TableHead className="uppercase text-xs tracking-widest text-muted-foreground bg-muted/50">
                Статус
              </TableHead>
              <TableHead className="uppercase text-xs tracking-widest text-muted-foreground bg-muted/50 text-right">
                Вознаграждение
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rewardCards.map((card) => {
              const profile = profileMap.get(card.userId);
              const name = profile
                ? `${profile.lastName} ${profile.firstName}`
                : "—";
              return (
                <TableRow key={card.id} className="hover:bg-muted/20 transition-colors">
                  <TableCell className="text-sm py-2.5 px-3.5 font-medium">
                    {name}
                  </TableCell>
                  <TableCell className="text-sm py-2.5 px-3.5 text-muted-foreground">
                    {formatPeriod(card.periodType, card.periodYear, card.periodSub)}
                  </TableCell>
                  <TableCell className="text-sm py-2.5 px-3.5 text-right font-mono text-muted-foreground">
                    {card.totalExecutionPct !== null ? `${card.totalExecutionPct}%` : "—"}
                  </TableCell>
                  <TableCell className="text-sm py-2.5 px-3.5">
                    <StatusBadge status={card.status} />
                  </TableCell>
                  <TableCell className="text-sm py-2.5 px-3.5 text-right font-mono font-semibold text-green-400">
                    {(card.totalReward ?? 0).toLocaleString("ru-RU")} руб.
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>
      <div className="flex justify-end pr-4">
        <span className="text-xs text-muted-foreground mr-2">Итого:</span>
        <span className="font-mono text-sm font-bold text-green-400">
          {totalReward.toLocaleString("ru-RU")} руб.
        </span>
      </div>
    </div>
  );
}
