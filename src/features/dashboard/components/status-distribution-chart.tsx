"use client";

import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer } from "recharts";
import { STATUS_LABELS } from "@/lib/constants";
import type { KpiCardSummary, KpiCardStatus } from "@/types/kpi";

const STATUS_CHART_COLORS: Record<KpiCardStatus, string> = {
  draft: "#64748b",
  active: "#3b7dd8",
  pending_approval: "#f59e0b",
  approved: "#10b981",
  returned: "#ef4444",
};

interface ChartEntry {
  name: string;
  value: number;
  color: string;
}

function buildChartData(cards: KpiCardSummary[]): ChartEntry[] {
  const counts: Partial<Record<KpiCardStatus, number>> = {};
  for (const card of cards) {
    counts[card.status] = (counts[card.status] ?? 0) + 1;
  }
  return Object.entries(counts)
    .filter(([, v]) => (v ?? 0) > 0)
    .map(([status, value]) => ({
      name: STATUS_LABELS[status] ?? status,
      value: value ?? 0,
      color: STATUS_CHART_COLORS[status as KpiCardStatus] ?? "#64748b",
    }));
}

interface CustomTooltipProps {
  active?: boolean;
  payload?: Array<{ name: string; value: number }>;
}

function CustomTooltip({ active, payload }: CustomTooltipProps) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-md border border-border bg-card px-3 py-2 text-sm shadow-md">
      <p className="font-medium text-foreground">{payload[0].name}</p>
      <p className="text-muted-foreground">
        Карт:{" "}
        <span className="font-mono font-bold text-foreground">{payload[0].value}</span>
      </p>
    </div>
  );
}

interface StatusDistributionChartProps {
  cards: KpiCardSummary[];
}

export function StatusDistributionChart({ cards }: StatusDistributionChartProps) {
  const data = buildChartData(cards);

  if (data.length === 0) {
    return (
      <div className="flex h-48 items-center justify-center text-sm text-muted-foreground">
        Нет данных для отображения
      </div>
    );
  }

  return (
    <ResponsiveContainer width="100%" height={220}>
      <PieChart>
        <Pie
          data={data}
          cx="50%"
          cy="45%"
          innerRadius={55}
          outerRadius={80}
          paddingAngle={3}
          dataKey="value"
        >
          {data.map((entry, index) => (
            <Cell key={index} fill={entry.color} />
          ))}
        </Pie>
        <Tooltip content={<CustomTooltip />} />
        <Legend
          formatter={(value: string) => (
            <span style={{ color: "#94a3b8", fontSize: 12 }}>{value}</span>
          )}
        />
      </PieChart>
    </ResponsiveContainer>
  );
}
