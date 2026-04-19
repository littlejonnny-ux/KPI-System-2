"use client";

import { useState } from "react";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useKpiCards } from "@/features/kpi-cards/hooks/use-kpi-cards";
import { STATUS_LABELS, STATUS_COLORS } from "@/lib/constants";
import type { KpiCardStatus } from "@/types/kpi";

const CURRENT_YEAR = new Date().getFullYear();
const YEAR_OPTIONS = [CURRENT_YEAR - 1, CURRENT_YEAR, CURRENT_YEAR + 1];

const STATUS_OPTIONS: { value: KpiCardStatus; label: string }[] = [
  { value: "draft", label: STATUS_LABELS.draft },
  { value: "active", label: STATUS_LABELS.active },
  { value: "pending_approval", label: STATUS_LABELS.pending_approval },
  { value: "approved", label: STATUS_LABELS.approved },
  { value: "returned", label: STATUS_LABELS.returned },
];

export default function KpiCardsPage() {
  const [status, setStatus] = useState<string>("");
  const [periodYear, setPeriodYear] = useState<string>("");

  const { data: cards = [], isLoading } = useKpiCards({
    status: status || undefined,
    periodYear: periodYear ? Number(periodYear) : undefined,
  });

  function clearFilters() {
    setStatus("");
    setPeriodYear("");
  }

  const hasFilters = Boolean(status || periodYear);

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">KPI-карты</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            {isLoading ? "Загрузка..." : `${cards.length} карт`}
          </p>
        </div>
      </div>

      <div className="flex flex-wrap gap-3 items-center">
        <Select value={status} onValueChange={(v) => setStatus(v ?? "")}>
          <SelectTrigger className="w-48" data-testid="filter-status">
            <SelectValue placeholder="Все статусы" />
          </SelectTrigger>
          <SelectContent>
            {STATUS_OPTIONS.map((s) => (
              <SelectItem key={s.value} value={s.value}>
                {s.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={periodYear} onValueChange={(v) => setPeriodYear(v ?? "")}>
          <SelectTrigger className="w-36" data-testid="filter-year">
            <SelectValue placeholder="Все годы" />
          </SelectTrigger>
          <SelectContent>
            {YEAR_OPTIONS.map((y) => (
              <SelectItem key={y} value={String(y)}>
                {y}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {hasFilters && (
          <Button variant="ghost" size="sm" onClick={clearFilters}>
            Сбросить
          </Button>
        )}
      </div>

      <Table data-testid="kpi-cards-list">
        <TableHeader>
          <TableRow>
            <TableHead>Участник</TableHead>
            <TableHead>Период</TableHead>
            <TableHead>Статус</TableHead>
            <TableHead className="text-right">Исполнение</TableHead>
            <TableHead className="text-right">Вознаграждение</TableHead>
            <TableHead />
          </TableRow>
        </TableHeader>
        <TableBody>
          {isLoading && (
            <TableRow>
              <TableCell colSpan={6} className="text-center py-10 text-muted-foreground">
                Загрузка...
              </TableCell>
            </TableRow>
          )}
          {!isLoading && cards.length === 0 && (
            <TableRow>
              <TableCell colSpan={6} className="text-center py-10 text-muted-foreground">
                Карты не найдены
              </TableCell>
            </TableRow>
          )}
          {cards.map((card) => (
            <TableRow key={card.id} data-testid={`card-row-${card.id}`}>
              <TableCell className="font-medium">
                {card.participantName ?? "—"}
              </TableCell>
              <TableCell className="tabular-nums">
                {card.periodSub
                  ? `${card.periodSub} ${card.periodYear}`
                  : card.periodYear}
              </TableCell>
              <TableCell>
                <Badge className={STATUS_COLORS[card.status]}>
                  {STATUS_LABELS[card.status]}
                </Badge>
              </TableCell>
              <TableCell className="text-right tabular-nums">
                {card.totalExecutionPct !== null
                  ? `${card.totalExecutionPct.toFixed(1)} %`
                  : "—"}
              </TableCell>
              <TableCell className="text-right tabular-nums">
                {card.totalReward !== null
                  ? card.totalReward.toLocaleString("ru-RU")
                  : "—"}
              </TableCell>
              <TableCell className="text-right">
                <Link
                  href={`/kpi-cards/${card.id}`}
                  className="text-sm text-primary underline-offset-4 hover:underline"
                >
                  Открыть
                </Link>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
