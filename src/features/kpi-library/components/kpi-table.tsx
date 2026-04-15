"use client";

/**
 * KpiTable — data table for the KPI Library.
 * Columns: Название / Метод / Ед. изм. / Период / Статус / Действия.
 * Actions: Edit, Copy (duplicate), Delete (soft).
 * (ТЗ 9.4, UI_PATTERNS: shadcn Table)
 */

import { useState } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Edit2, Copy, Trash2 } from "lucide-react";
import { METHOD_LABELS } from "@/lib/constants";
import { useDeleteKpi, useDuplicateKpi } from "@/features/kpi-library/hooks/use-kpi-library";
import type { KpiLibraryItem } from "@/types/kpi";

// ---------------------------------------------------------------------------
// Period display helper
// ---------------------------------------------------------------------------

function periodLabel(item: KpiLibraryItem): string {
  if (item.periodNature === "on_date") {
    return item.periodSingleDate
      ? `На дату ${item.periodSingleDate}`
      : String(item.periodYear);
  }
  if (item.periodPreset && item.periodPreset !== "custom") {
    return `${item.periodPreset} ${item.periodYear}`;
  }
  if (item.periodDateFrom && item.periodDateTo) {
    return `${item.periodDateFrom} — ${item.periodDateTo}`;
  }
  return String(item.periodYear);
}

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

interface KpiTableProps {
  items: KpiLibraryItem[];
  isLoading: boolean;
  onEdit: (item: KpiLibraryItem) => void;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function KpiTable({ items, isLoading, onEdit }: KpiTableProps) {
  const deleteKpi = useDeleteKpi();
  const duplicateKpi = useDuplicateKpi();
  const [deleteTarget, setDeleteTarget] = useState<KpiLibraryItem | null>(null);

  if (isLoading) {
    return (
      <div className="text-center py-12 text-muted-foreground text-sm">
        Загрузка...
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="text-center py-12 text-muted-foreground text-sm">
        KPI не найдены. Измените фильтры или создайте новый.
      </div>
    );
  }

  return (
    <>
      <div className="rounded-md border overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[280px]">Название</TableHead>
              <TableHead>Метод</TableHead>
              <TableHead>Ед. изм.</TableHead>
              <TableHead>Период</TableHead>
              <TableHead>Статус</TableHead>
              <TableHead className="w-[120px] text-right">Действия</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {items.map((item) => (
              <TableRow key={item.id}>
                <TableCell className="font-medium">
                  <div className="flex flex-col gap-0.5">
                    <span>{item.name}</span>
                    {item.description && (
                      <span className="text-xs text-muted-foreground truncate max-w-[260px]">
                        {item.description}
                      </span>
                    )}
                  </div>
                </TableCell>
                <TableCell>
                  <span className="text-sm">
                    {METHOD_LABELS[item.evaluationMethod] ?? item.evaluationMethod}
                  </span>
                </TableCell>
                <TableCell>
                  <span className="text-sm">{item.unit}</span>
                </TableCell>
                <TableCell>
                  <span className="text-sm text-muted-foreground">
                    {periodLabel(item)}
                  </span>
                </TableCell>
                <TableCell>
                  <Badge
                    variant={item.isActive ? "default" : "secondary"}
                    className="text-xs"
                  >
                    {item.isActive ? "Активен" : "Архив"}
                  </Badge>
                </TableCell>
                <TableCell>
                  <div className="flex gap-1 justify-end">
                    <Button
                      variant="ghost"
                      size="icon"
                      title="Редактировать"
                      onClick={() => onEdit(item)}
                    >
                      <Edit2 className="size-3.5" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      title="Дублировать"
                      disabled={duplicateKpi.isPending}
                      onClick={() => duplicateKpi.mutate(item.id)}
                    >
                      <Copy className="size-3.5" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      title="Удалить"
                      className="text-destructive hover:text-destructive"
                      onClick={() => setDeleteTarget(item)}
                    >
                      <Trash2 className="size-3.5" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {/* Delete confirmation */}
      <Dialog
        open={Boolean(deleteTarget)}
        onOpenChange={(open) => { if (!open) setDeleteTarget(null); }}
      >
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Удалить KPI?</DialogTitle>
            <DialogDescription>
              KPI «{deleteTarget?.name}» будет перемещён в архив. Это действие
              можно отменить позже.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteTarget(null)}>
              Отмена
            </Button>
            <Button
              variant="destructive"
              disabled={deleteKpi.isPending}
              onClick={() => {
                if (deleteTarget) {
                  deleteKpi.mutate(deleteTarget.id);
                  setDeleteTarget(null);
                }
              }}
            >
              Удалить
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
