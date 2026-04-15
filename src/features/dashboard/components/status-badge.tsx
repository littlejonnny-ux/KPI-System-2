import { cn } from "@/lib/utils";
import { STATUS_LABELS } from "@/lib/constants";
import type { KpiCardStatus } from "@/types/kpi";

const STATUS_CLASSES: Record<KpiCardStatus, string> = {
  draft: "bg-muted text-muted-foreground",
  active: "bg-blue-500/20 text-blue-400",
  pending_approval: "bg-yellow-500/20 text-yellow-400",
  approved: "bg-green-500/20 text-green-400",
  returned: "bg-red-500/20 text-red-400",
};

interface StatusBadgeProps {
  status: KpiCardStatus;
  className?: string;
}

export function StatusBadge({ status, className }: StatusBadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium",
        STATUS_CLASSES[status],
        className,
      )}
    >
      {STATUS_LABELS[status] ?? status}
    </span>
  );
}
