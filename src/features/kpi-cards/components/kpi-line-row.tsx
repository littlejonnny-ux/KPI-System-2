"use client";

import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { FactInput } from "./fact-input";
import { L2LineRow } from "./l2-line-row";
import { CommentModal } from "./comment-modal";
import {
  useUpdateFact,
  useApproveLine,
  useReturnLine,
  useUnapproveLine,
  useDeleteLine,
} from "@/features/kpi-cards/hooks/use-card-mutations";
import { useAuth } from "@/features/auth/auth-provider";
import { METHOD_LABELS } from "@/lib/constants";
import type { KpiCardLine, SystemRole, KpiCardStatus } from "@/types/kpi";

interface KpiLineRowProps {
  line: KpiCardLine;
  cardId: string;
  role: SystemRole;
  cardStatus: KpiCardStatus;
}

const EDITABLE_STATUSES: KpiCardStatus[] = ["active", "returned"];

export function KpiLineRow({ line, cardId, role, cardStatus }: KpiLineRowProps) {
  const { profile } = useAuth();
  const [commentOpen, setCommentOpen] = useState(false);
  const [returnOpen, setReturnOpen] = useState(false);

  const updateMutation = useUpdateFact();
  const approveMutation = useApproveLine();
  const returnMutation = useReturnLine();
  const unapproveMutation = useUnapproveLine();
  const deleteMutation = useDeleteLine();

  const canEdit =
    EDITABLE_STATUSES.includes(cardStatus) &&
    (role === "participant" || role === "admin");

  const canApprove =
    (role === "approver" || role === "admin") &&
    cardStatus === "pending_approval" &&
    !line.isApproved;

  const canReturn =
    (role === "approver" || role === "admin") &&
    cardStatus === "pending_approval" &&
    !line.isApproved;

  const canUnapprove =
    (role === "approver" || role === "admin") &&
    cardStatus === "pending_approval" &&
    line.isApproved;

  const canDelete =
    role === "admin" && (cardStatus === "draft" || cardStatus === "active");

  function handleFactChange(value: number | null) {
    updateMutation.mutate({ lineId: line.id, cardId, factValue: value });
  }

  function handleApprove() {
    if (!profile?.id) return;
    approveMutation.mutate({ lineId: line.id, cardId, approvedBy: profile.id });
  }

  function handleReturn(comment: string) {
    returnMutation.mutate(
      { lineId: line.id, cardId, comment },
      { onSuccess: () => setReturnOpen(false) }
    );
  }

  function handleUnapprove() {
    unapproveMutation.mutate({ lineId: line.id, cardId });
  }

  function handleDelete() {
    deleteMutation.mutate({ lineId: line.id, cardId });
  }

  return (
    <>
      <tr
        className="border-b border-border text-sm"
        data-testid={`kpi-line-row-${line.id}`}
      >
        <td className="py-3 pl-4 pr-3 font-medium">
          <div className="flex flex-col gap-0.5">
            <span>{line.name}</span>
            {line.participantComment && (
              <span className="text-xs text-muted-foreground">
                {line.participantComment}
              </span>
            )}
            {line.approverComment && (
              <span className="text-xs text-destructive">
                {line.approverComment}
              </span>
            )}
          </div>
        </td>
        <td className="px-3 py-3">
          <Badge variant="outline" className="text-xs">
            {METHOD_LABELS[line.evaluationMethod]}
          </Badge>
          {line.isComposite && (
            <Badge
              variant="outline"
              className="ml-1 text-xs text-muted-foreground"
            >
              Составной
            </Badge>
          )}
        </td>
        <td className="px-3 py-3 tabular-nums text-right text-muted-foreground text-xs">
          {line.weight} %
        </td>
        <td className="px-3 py-3 tabular-nums text-right">
          {line.targetValue !== null ? line.targetValue : "—"}
          {line.unit && (
            <span className="ml-1 text-xs text-muted-foreground">
              {line.unit}
            </span>
          )}
        </td>
        <td className="px-3 py-3">
          {canEdit && !line.isComposite ? (
            <FactInput
              method={line.evaluationMethod}
              value={line.factValue}
              onChange={handleFactChange}
              disabled={updateMutation.isPending}
              discretePoints={line.discretePoints}
            />
          ) : (
            <span className="tabular-nums">
              {line.factValue !== null ? line.factValue : "—"}
            </span>
          )}
        </td>
        <td className="px-3 py-3 tabular-nums text-right">
          {line.executionPct !== null
            ? `${line.executionPct.toFixed(1)} %`
            : "—"}
        </td>
        <td className="px-3 py-3">
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
        <td className="px-3 py-3">
          <div className="flex gap-1">
            {canApprove && (
              <Button
                size="sm"
                variant="outline"
                onClick={handleApprove}
                disabled={approveMutation.isPending}
                className="h-7 px-2 text-xs text-green-400 border-green-500/30"
                data-testid={`approve-line-${line.id}`}
              >
                ✓
              </Button>
            )}
            {canUnapprove && (
              <Button
                size="sm"
                variant="outline"
                onClick={handleUnapprove}
                disabled={unapproveMutation.isPending}
                className="h-7 px-2 text-xs text-yellow-400 border-yellow-500/30"
                data-testid={`unapprove-line-${line.id}`}
              >
                ↩
              </Button>
            )}
            {canReturn && (
              <Button
                size="sm"
                variant="outline"
                onClick={() => setReturnOpen(true)}
                disabled={returnMutation.isPending}
                className="h-7 px-2 text-xs text-destructive border-destructive/30"
                data-testid={`return-line-${line.id}`}
              >
                ✗
              </Button>
            )}
            {canEdit && (
              <Button
                size="sm"
                variant="ghost"
                onClick={() => setCommentOpen(true)}
                className="h-7 px-2 text-xs"
                data-testid={`comment-line-${line.id}`}
              >
                💬
              </Button>
            )}
            {canDelete && (
              <Button
                size="sm"
                variant="ghost"
                onClick={handleDelete}
                disabled={deleteMutation.isPending}
                className="h-7 px-2 text-xs text-destructive"
                data-testid={`delete-line-${line.id}`}
              >
                ✕
              </Button>
            )}
          </div>
        </td>
      </tr>

      {line.isComposite &&
        line.subLines
          .sort((a, b) => a.sortOrder - b.sortOrder)
          .map((sub) => (
            <L2LineRow
              key={sub.id}
              line={sub}
              cardId={cardId}
              role={role}
              cardStatus={cardStatus}
            />
          ))}

      <CommentModal
        open={commentOpen}
        onClose={() => setCommentOpen(false)}
        onSubmit={(comment) => {
          updateMutation.mutate(
            { lineId: line.id, cardId, factValue: line.factValue, participantComment: comment },
            { onSuccess: () => setCommentOpen(false) }
          );
        }}
        title="Комментарий участника"
        initialValue={line.participantComment ?? ""}
      />

      <CommentModal
        open={returnOpen}
        onClose={() => setReturnOpen(false)}
        onSubmit={handleReturn}
        title="Вернуть строку"
        required
        isPending={returnMutation.isPending}
      />
    </>
  );
}
