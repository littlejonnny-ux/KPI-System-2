"use client";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Cell,
  ReferenceLine,
} from "recharts";
import type { KpiCardSummary } from "@/types/kpi";
import type { UserProfile } from "@/types/kpi";

interface ChartEntry {
  name: string;
  execution: number;
}

interface ExecutionByUserChartProps {
  cards: KpiCardSummary[];
  participants: UserProfile[];
}

function buildChartData(
  cards: KpiCardSummary[],
  participants: UserProfile[],
): ChartEntry[] {
  const profileMap = new Map(participants.map((p) => [p.id, p]));

  const byUser = new Map<string, number[]>();
  for (const card of cards) {
    if (card.totalExecutionPct === null) continue;
    const existing = byUser.get(card.userId) ?? [];
    byUser.set(card.userId, [...existing, card.totalExecutionPct]);
  }

  return Array.from(byUser.entries())
    .map(([userId, values]) => {
      const profile = profileMap.get(userId);
      const avg = values.reduce((a, b) => a + b, 0) / values.length;
      const name = profile
        ? `${profile.lastName} ${profile.firstName.charAt(0)}.`
        : userId.slice(0, 8);
      return { name, execution: Math.round(avg) };
    })
    .sort((a, b) => b.execution - a.execution)
    .slice(0, 15);
}

function barColor(value: number): string {
  if (value >= 100) return "#10b981";
  if (value >= 80) return "#f59e0b";
  return "#ef4444";
}

interface CustomTooltipProps {
  active?: boolean;
  payload?: Array<{ value: number }>;
  label?: string;
}

function CustomTooltip({ active, payload, label }: CustomTooltipProps) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-md border border-border bg-card px-3 py-2 text-sm shadow-md">
      <p className="font-medium text-foreground">{label}</p>
      <p className="text-muted-foreground">
        Исполнение:{" "}
        <span className="font-mono font-bold text-foreground">
          {payload[0].value}%
        </span>
      </p>
    </div>
  );
}

export function ExecutionByUserChart({
  cards,
  participants,
}: ExecutionByUserChartProps) {
  const data = buildChartData(cards, participants);

  if (data.length === 0) {
    return (
      <div className="flex h-48 items-center justify-center text-sm text-muted-foreground">
        Нет данных для отображения
      </div>
    );
  }

  return (
    <ResponsiveContainer width="100%" height={Math.max(200, data.length * 36)}>
      <BarChart
        data={data}
        layout="vertical"
        margin={{ top: 4, right: 48, bottom: 4, left: 8 }}
      >
        <XAxis
          type="number"
          domain={[0, Math.max(120, ...data.map((d) => d.execution))]}
          tickFormatter={(v: number) => `${v}%`}
          tick={{ fontSize: 11, fill: "#94a3b8" }}
          axisLine={false}
          tickLine={false}
        />
        <YAxis
          type="category"
          dataKey="name"
          width={110}
          tick={{ fontSize: 12, fill: "#e2e8f0" }}
          axisLine={false}
          tickLine={false}
        />
        <Tooltip content={<CustomTooltip />} cursor={{ fill: "rgba(255,255,255,0.04)" }} />
        <ReferenceLine x={100} stroke="#94a3b8" strokeDasharray="4 2" />
        <Bar dataKey="execution" radius={[0, 4, 4, 0]}>
          {data.map((entry, index) => (
            <Cell key={index} fill={barColor(entry.execution)} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}
