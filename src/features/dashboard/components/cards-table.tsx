"use client";

import { useRouter } from "next/navigation";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Progress } from "@/components/ui/progress";
import { StatusBadge } from "./status-badge";
import { formatPeriod } from "./period-utils";
import type { KpiCardSummary, UserProfile } from "@/types/kpi";

interface CardsTableProps {
  cards: KpiCardSummary[];
  participants: UserProfile[];
}

function progressColor(pct: number): string {
  if (pct >= 100) return "[&>div]:bg-green-500";
  if (pct >= 80) return "[&>div]:bg-yellow-500";
  return "[&>div]:bg-red-500";
}

export function CardsTable({ cards, participants }: CardsTableProps) {
  const router = useRouter();
  const profileMap = new Map(participants.map((p) => [p.id, p]));

  if (cards.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 gap-2">
        <p className="text-sm font-medium text-muted-foreground">Карты KPI отсутствуют</p>
      </div>
    );
  }

  return (
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
            <TableHead className="uppercase text-xs tracking-widest text-muted-foreground bg-muted/50">
              Статус
            </TableHead>
            <TableHead className="uppercase text-xs tracking-widest text-muted-foreground bg-muted/50 w-40">
              % исполнения
            </TableHead>
            <TableHead className="uppercase text-xs tracking-widest text-muted-foreground bg-muted/50 text-right">
              Вознаграждение
            </TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {cards.map((card) => {
            const profile = profileMap.get(card.userId);
            const name = profile
              ? `${profile.lastName} ${profile.firstName}`
              : "—";
            const pct = card.totalExecutionPct ?? 0;
            return (
              <TableRow
                key={card.id}
                className="cursor-pointer hover:bg-muted/20 transition-colors"
                onClick={() => router.push(`/kpi-cards/${card.id}`)}
              >
                <TableCell className="text-sm py-2.5 px-3.5 font-medium">
                  {name}
                </TableCell>
                <TableCell className="text-sm py-2.5 px-3.5 text-muted-foreground">
                  {formatPeriod(card.periodType, card.periodYear, card.periodSub)}
                </TableCell>
                <TableCell className="text-sm py-2.5 px-3.5">
                  <StatusBadge status={card.status} />
                </TableCell>
                <TableCell className="py-2.5 px-3.5">
                  {card.totalExecutionPct !== null ? (
                    <div className="flex items-center gap-2">
                      <Progress
                        value={Math.min(pct, 100)}
                        className={`h-1.5 w-24 ${progressColor(pct)}`}
                      />
                      <span className="font-mono text-xs text-muted-foreground">
                        {pct}%
                      </span>
                    </div>
                  ) : (
                    <span className="text-xs text-muted-foreground">—</span>
                  )}
                </TableCell>
                <TableCell className="text-sm py-2.5 px-3.5 text-right font-mono">
                  {card.totalReward !== null
                    ? `${card.totalReward.toLocaleString("ru-RU")} руб.`
                    : "—"}
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
}
