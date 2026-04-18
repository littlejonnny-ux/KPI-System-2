"use client";

import { Badge } from "@/components/ui/badge";
import { FactInput } from "./fact-input";
import { useUpdateFactL2 } from "@/features/kpi-cards/hooks/use-card-mutations";
import { METHOD_LABELS } from "@/lib/constants";
import type { KpiCardLineL2, SystemRole, KpiCardStatus } from "@/types/kpi";

interface L2LineRowProps {
  line: KpiCardLineL2;
  cardId: string;
  role: SystemRole;
  cardStatus: KpiCardStatus;
}

const EDITABLE_STATUSES: KpiCardStatus[] = ["active", "returned"];

export function L2LineRow({ line, cardId, role, cardStatus }: L2LineRowProps) {
  const mutation = useUpdateFactL2();

  const canEdit =
    EDITABLE_STATUSES.includes(cardStatus) &&
    (role === "participant" || role === "admin");

  function handleFactChange(value: number | null) {
    mutation.mutate({
      l2Id: line.id,
      cardId,
      factValue: value,
    });
  }

  return (
    <tr className="border-b border-border/50 text-sm" data-testid={`l2-line-row-${line.id}`}>
      <td className="py-2 pl-10 pr-3">
        <span className="text-muted-foreground">{line.name}</span>
      </td>
      <td className="px-3 py-2">
        <Badge variant="outline" className="text-xs">
          {METHOD_LABELS[line.evaluationMethod]}
        </Badge>
      </td>
      <td className="px-3 py-2 tabular-nums text-right text-muted-foreground text-xs">
        {line.weight} %
      </td>
      <td className="px-3 py-2 tabular-nums text-right">
        {line.targetValue !== null ? line.targetValue : "—"}
      </td>
      <td className="px-3 py-2">
        {canEdit ? (
          <FactInput
            method={line.evaluationMethod}
            value={line.factValue}
            onChange={handleFactChange}
            disabled={mutation.isPending}
          />
        ) : (
          <span className="tabular-nums">
            {line.factValue !== null ? line.factValue : "—"}
          </span>
        )}
      </td>
      <td className="px-3 py-2 tabular-nums text-right">
        {line.executionPct !== null
          ? `${line.executionPct.toFixed(1)} %`
          : "—"}
      </td>
      <td className="px-3 py-2">
        {line.isApproved ? (
          <Badge className="bg-green-500/20 text-green-400 text-xs">
            Утверждено
          </Badge>
        ) : (
          <Badge variant="outline" className="text-xs text-muted-foreground">
            —
          </Badge>
        )}
      </td>
    </tr>
  );
}
