"use client";

import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { CommentModal } from "./comment-modal";
import {
  useSubmitForApproval,
  useReturnCard,
} from "@/features/kpi-cards/hooks/use-card-mutations";
import { STATUS_LABELS, STATUS_COLORS } from "@/lib/constants";
import type { KpiCard, SystemRole } from "@/types/kpi";

interface KpiCardHeaderProps {
  card: KpiCard;
  participantName: string | null;
  role: SystemRole;
}

function formatPeriod(card: KpiCard): string {
  return card.periodSub
    ? `${card.periodSub} ${card.periodYear}`
    : String(card.periodYear);
}

export function KpiCardHeader({
  card,
  participantName,
  role,
}: KpiCardHeaderProps) {
  const [returnModalOpen, setReturnModalOpen] = useState(false);

  const submitMutation = useSubmitForApproval();
  const returnMutation = useReturnCard();

  const canSubmit =
    (role === "participant" || role === "admin") &&
    (card.status === "active" || card.status === "returned");

  const canReturn =
    (role === "approver" || role === "admin") &&
    card.status === "pending_approval";

  function handleSubmit() {
    submitMutation.mutate(card.id);
  }

  function handleReturn(comment: string) {
    returnMutation.mutate(
      { cardId: card.id, comment },
      { onSuccess: () => setReturnModalOpen(false) }
    );
  }

  return (
    <div className="flex flex-wrap items-start justify-between gap-4" data-testid="kpi-card-header">
      <div className="space-y-1">
        <div className="flex items-center gap-2">
          <h1 className="text-xl font-semibold">
            {participantName ?? "Участник"}
          </h1>
          <Badge className={STATUS_COLORS[card.status]}>
            {STATUS_LABELS[card.status]}
          </Badge>
        </div>
        <p className="text-sm text-muted-foreground">
          Период: {formatPeriod(card)}
        </p>
        {card.approverComment && (
          <p className="text-sm text-destructive">
            Комментарий согласующего: {card.approverComment}
          </p>
        )}
      </div>

      <div className="flex gap-2">
        {canSubmit && (
          <Button
            size="sm"
            onClick={handleSubmit}
            disabled={submitMutation.isPending}
            data-testid="submit-for-approval"
          >
            На согласование
          </Button>
        )}
        {canReturn && (
          <Button
            size="sm"
            variant="destructive"
            onClick={() => setReturnModalOpen(true)}
            data-testid="return-card"
          >
            Вернуть
          </Button>
        )}
      </div>

      <CommentModal
        open={returnModalOpen}
        onClose={() => setReturnModalOpen(false)}
        onSubmit={handleReturn}
        title="Вернуть карту"
        required
        isPending={returnMutation.isPending}
      />
    </div>
  );
}
