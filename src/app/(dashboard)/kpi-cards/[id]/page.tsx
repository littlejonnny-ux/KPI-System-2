"use client";

import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Plus, ArrowLeft } from "lucide-react";
import {
  Table,
  TableBody,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useKpiCard } from "@/features/kpi-cards/hooks/use-kpi-cards";
import { KpiCardHeader } from "@/features/kpi-cards/components/kpi-card-header";
import { KpiCardReward } from "@/features/kpi-cards/components/kpi-card-reward";
import { KpiCardAudit } from "@/features/kpi-cards/components/kpi-card-audit";
import { KpiLineRow } from "@/features/kpi-cards/components/kpi-line-row";
import { TriggerGoalBlock } from "@/features/kpi-cards/components/trigger-goal-block";
import { AddLineModal } from "@/features/kpi-cards/components/add-line-modal";
import { useAuth } from "@/features/auth/auth-provider";
import { createClient } from "@/lib/supabase/client";
import { useQuery } from "@tanstack/react-query";
import type { SystemRole } from "@/types/kpi";

export default function KpiCardPage() {
  const params = useParams<{ id: string }>();
  const id = params.id;
  const router = useRouter();

  const { profile } = useAuth();
  const role: SystemRole = profile?.systemRole ?? "participant";

  const { data: card, isLoading, error } = useKpiCard(id);

  const { data: participantName = null } = useQuery({
    queryKey: ["user-name", card?.userId],
    queryFn: async () => {
      const supabase = createClient();
      const { data } = await supabase
        .from("users")
        .select("full_name, first_name, last_name")
        .eq("id", card!.userId)
        .single();
      if (!data) return null;
      return data.full_name ?? `${data.first_name} ${data.last_name}`.trim();
    },
    enabled: Boolean(card?.userId),
  });

  const [addLineOpen, setAddLineOpen] = useState(false);

  const canAddLine =
    card &&
    (role === "participant" || role === "admin") &&
    (card.status === "active" || card.status === "returned");

  if (isLoading) {
    return (
      <div className="py-20 text-center text-muted-foreground">Загрузка...</div>
    );
  }

  if (error || !card) {
    return (
      <div className="py-20 text-center text-destructive">
        Не удалось загрузить карту
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Button
        variant="ghost"
        size="sm"
        className="-ml-2"
        onClick={() => router.back()}
      >
        <ArrowLeft className="size-4 mr-1.5" /> Назад
      </Button>

      <KpiCardHeader card={card} participantName={participantName} role={role} />

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_280px] gap-6 items-start">
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-medium text-muted-foreground uppercase tracking-wide">
              Показатели
            </h2>
            {canAddLine && (
              <Button
                size="sm"
                variant="outline"
                onClick={() => setAddLineOpen(true)}
                data-testid="add-line-btn"
              >
                <Plus className="size-4 mr-1.5" /> Добавить
              </Button>
            )}
          </div>

          <div className="rounded-md border overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="min-w-[200px]">Показатель</TableHead>
                  <TableHead>Метод</TableHead>
                  <TableHead className="text-right">Вес</TableHead>
                  <TableHead className="text-right">План</TableHead>
                  <TableHead>Факт</TableHead>
                  <TableHead className="text-right">Исполнение</TableHead>
                  <TableHead>Статус</TableHead>
                  <TableHead />
                </TableRow>
              </TableHeader>
              <TableBody>
                {card.lines.length === 0 && (
                  <TableRow>
                    <td
                      colSpan={8}
                      className="py-10 text-center text-muted-foreground text-sm"
                    >
                      Показатели не добавлены
                    </td>
                  </TableRow>
                )}
                {card.lines.map((line) => (
                  <KpiLineRow
                    key={line.id}
                    line={line}
                    cardId={card.id}
                    role={role}
                    cardStatus={card.status}
                  />
                ))}
              </TableBody>
            </Table>
          </div>
        </div>

        <div className="space-y-4">
          <KpiCardReward card={card} />
          <TriggerGoalBlock
            triggerGoalId={card.triggerGoalId}
            triggerGoalData={card.triggerGoalData}
          />
        </div>
      </div>

      <KpiCardAudit cardId={card.id} />

      <AddLineModal
        open={addLineOpen}
        onClose={() => setAddLineOpen(false)}
        cardId={card.id}
      />
    </div>
  );
}
