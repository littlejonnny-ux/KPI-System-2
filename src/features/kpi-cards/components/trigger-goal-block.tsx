"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import type { UserTriggerGoalData } from "@/types/kpi";

interface TriggerGoalBlockProps {
  triggerGoalId: string | null;
  triggerGoalData: UserTriggerGoalData[];
}

export function TriggerGoalBlock({
  triggerGoalId,
  triggerGoalData,
}: TriggerGoalBlockProps) {
  if (!triggerGoalId) {
    return null;
  }

  return (
    <Card data-testid="trigger-goal-block">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">
          Запускающая цель
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        {triggerGoalData.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            Данные запускающей цели не заполнены.
          </p>
        ) : (
          <div className="space-y-2">
            {triggerGoalData.map((entry) => (
              <div
                key={entry.id}
                className="flex items-center justify-between text-sm"
              >
                <span className="text-muted-foreground font-mono text-xs">
                  {entry.triggerGoalLineId.slice(0, 8)}…
                </span>
                <div className="flex items-center gap-2">
                  {entry.useOfficial ? (
                    <Badge variant="outline" className="text-xs">
                      Официальный
                    </Badge>
                  ) : (
                    <Badge variant="outline" className="text-xs">
                      Свой
                    </Badge>
                  )}
                  <span className="tabular-nums">
                    {entry.userFactValue !== null
                      ? entry.userFactValue.toFixed(2)
                      : "—"}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
