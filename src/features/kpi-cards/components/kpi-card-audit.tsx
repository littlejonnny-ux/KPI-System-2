"use client";

import { useAuditLog } from "@/features/shared/hooks/use-audit-log";
import { Separator } from "@/components/ui/separator";

const ACTION_LABELS: Record<string, string> = {
  created: "Создана",
  updated: "Обновлена",
  status_changed: "Статус изменён",
  submitted: "Отправлена на согласование",
  approved: "Утверждена",
  returned: "Возвращена",
  fact_updated: "Факт обновлён",
  line_approved: "Строка утверждена",
  line_returned: "Строка возвращена",
};

function formatDate(iso: string): string {
  return new Date(iso).toLocaleString("ru-RU", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

interface KpiCardAuditProps {
  cardId: string;
}

export function KpiCardAudit({ cardId }: KpiCardAuditProps) {
  const { data: entries, isLoading } = useAuditLog("kpi_card", cardId);

  if (isLoading) {
    return <p className="text-sm text-muted-foreground">Загрузка журнала…</p>;
  }

  if (!entries || entries.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">Журнал изменений пуст.</p>
    );
  }

  return (
    <div className="space-y-2" data-testid="kpi-card-audit">
      {entries.map((entry, idx) => (
        <div key={entry.id}>
          {idx > 0 && <Separator className="my-2" />}
          <div className="flex items-start justify-between gap-4 text-sm">
            <div className="space-y-0.5">
              <p className="font-medium">
                {ACTION_LABELS[entry.action] ?? entry.action}
              </p>
              {entry.comment && (
                <p className="text-muted-foreground">{entry.comment}</p>
              )}
              {entry.performedBy && (
                <p className="text-xs text-muted-foreground">
                  {entry.performedBy}
                </p>
              )}
            </div>
            <time className="shrink-0 text-xs text-muted-foreground">
              {formatDate(entry.performedAt)}
            </time>
          </div>
        </div>
      ))}
    </div>
  );
}
