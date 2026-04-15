"use client";

/**
 * DiscretePointsEditor — inline editor for discrete evaluation points.
 * Each row: Факт (integer) / % исполнения / delete.
 * (ТЗ 9.7, UI_PATTERNS: inline table rows)
 */

import { useFieldArray, useFormContext } from "react-hook-form";
import { Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { FormField, FormItem, FormControl, FormMessage } from "@/components/ui/form";
import type { KpiFormValues } from "./kpi-modal-schema";

export function DiscretePointsEditor() {
  const form = useFormContext<KpiFormValues>();
  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "discretePoints",
  });

  function addPoint() {
    const lastSort = fields.length > 0 ? fields[fields.length - 1].sortOrder : -1;
    append({
      factValue: 0,
      executionPct: 0,
      sortOrder: lastSort + 1,
    });
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium">Дискретные точки</span>
        <Button type="button" variant="outline" size="sm" onClick={addPoint}>
          <Plus className="size-3.5 mr-1" /> Добавить
        </Button>
      </div>

      {fields.length === 0 && (
        <p className="text-xs text-muted-foreground py-2">
          Нет точек. Нажмите «Добавить» для создания первой.
        </p>
      )}

      {fields.length > 0 && (
        <div className="space-y-1">
          {/* Header */}
          <div className="grid grid-cols-[1fr_1fr_auto] gap-2 px-3">
            <span className="text-xs text-muted-foreground">Факт (целое)</span>
            <span className="text-xs text-muted-foreground">% исполнения</span>
            <span className="size-8" />
          </div>

          {/* Rows */}
          {fields.map((field, index) => (
            <div
              key={field.id}
              className="grid grid-cols-[1fr_1fr_auto] gap-2 items-start rounded-md border bg-muted/20 p-2"
            >
              {/* Fact value */}
              <FormField
                control={form.control}
                name={`discretePoints.${index}.factValue`}
                render={({ field: f }) => (
                  <FormItem>
                    <FormControl>
                      <Input
                        type="number"
                        placeholder="0"
                        {...f}
                        onChange={(e) => f.onChange(Number(e.target.value))}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Execution % */}
              <FormField
                control={form.control}
                name={`discretePoints.${index}.executionPct`}
                render={({ field: f }) => (
                  <FormItem>
                    <FormControl>
                      <Input
                        type="number"
                        placeholder="0"
                        {...f}
                        onChange={(e) => f.onChange(Number(e.target.value))}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Delete */}
              <Button
                type="button"
                variant="ghost"
                size="icon"
                onClick={() => remove(index)}
                className="text-destructive hover:text-destructive mt-0.5"
              >
                <Trash2 className="size-4" />
              </Button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
