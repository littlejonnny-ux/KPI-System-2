"use client";

/**
 * ScaleRangesEditor — inline editor for scale method ranges.
 * Each row: От% / До% / Тип / % исполнения + converted bounds line.
 * (ТЗ 9.7, UI_PATTERNS: shadcn Table, inline inputs)
 */

import { useFieldArray, useFormContext } from "react-hook-form";
import { Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { FormField, FormItem, FormControl, FormMessage } from "@/components/ui/form";
import { calcRangeBoundsInUnits } from "@/lib/calculations";
import type { KpiFormValues } from "./kpi-modal-schema";

export function ScaleRangesEditor() {
  const form = useFormContext<KpiFormValues>();
  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "scaleRanges",
  });

  const targetValue = form.watch("targetValue") ?? 0;

  function addRange() {
    const lastSort = fields.length > 0 ? fields[fields.length - 1].sortOrder : -1;
    append({
      rangeFrom: 0,
      rangeTo: null,
      rangeType: "fixed",
      fixedPct: null,
      sortOrder: lastSort + 1,
    });
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium">Диапазоны шкалы</span>
        <Button type="button" variant="outline" size="sm" onClick={addRange}>
          <Plus className="size-3.5 mr-1" /> Добавить
        </Button>
      </div>

      {fields.length === 0 && (
        <p className="text-xs text-muted-foreground py-2">
          Нет диапазонов. Нажмите «Добавить» для создания первого.
        </p>
      )}

      <div className="space-y-2">
        {fields.map((field, index) => {
          const rangeFrom = form.watch(`scaleRanges.${index}.rangeFrom`) ?? 0;
          const rangeTo = form.watch(`scaleRanges.${index}.rangeTo`) ?? null;
          const rangeType = form.watch(`scaleRanges.${index}.rangeType`);
          const isProportional = rangeType === "proportional";

          let unitsLabel = "";
          if (targetValue > 0) {
            const bounds = calcRangeBoundsInUnits(rangeFrom, rangeTo, targetValue);
            const toStr =
              bounds.toUnits === null ? "∞" : bounds.toUnits.toLocaleString("ru");
            unitsLabel = `${bounds.fromUnits.toLocaleString("ru")} — ${toStr}`;
          }

          return (
            <div key={field.id} className="rounded-md border bg-muted/20 p-3 space-y-2">
              {/* Main row: from / to / type / pct / delete */}
              <div className="grid grid-cols-[1fr_1fr_140px_1fr_auto] gap-2 items-start">
                {/* From % */}
                <FormField
                  control={form.control}
                  name={`scaleRanges.${index}.rangeFrom`}
                  render={({ field: f }) => (
                    <FormItem>
                      <span className="text-xs text-muted-foreground">От%</span>
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

                {/* To % */}
                <FormField
                  control={form.control}
                  name={`scaleRanges.${index}.rangeTo`}
                  render={({ field: f }) => (
                    <FormItem>
                      <span className="text-xs text-muted-foreground">До% (∞ если пусто)</span>
                      <FormControl>
                        <Input
                          type="number"
                          placeholder="∞"
                          value={f.value ?? ""}
                          onChange={(e) =>
                            f.onChange(
                              e.target.value === "" ? null : Number(e.target.value),
                            )
                          }
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Type */}
                <FormField
                  control={form.control}
                  name={`scaleRanges.${index}.rangeType`}
                  render={({ field: f }) => (
                    <FormItem>
                      <span className="text-xs text-muted-foreground">Тип</span>
                      <FormControl>
                        <Select value={f.value} onValueChange={f.onChange}>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="fixed">Фиксированный</SelectItem>
                            <SelectItem value="proportional">Пропорционально</SelectItem>
                          </SelectContent>
                        </Select>
                      </FormControl>
                    </FormItem>
                  )}
                />

                {/* Fixed pct */}
                <FormField
                  control={form.control}
                  name={`scaleRanges.${index}.fixedPct`}
                  render={({ field: f }) => (
                    <FormItem>
                      <span className="text-xs text-muted-foreground">% исполнения</span>
                      <FormControl>
                        <Input
                          type="number"
                          placeholder={isProportional ? "авто" : "0"}
                          disabled={isProportional}
                          value={isProportional ? "" : (f.value ?? "")}
                          onChange={(e) =>
                            f.onChange(
                              e.target.value === "" ? null : Number(e.target.value),
                            )
                          }
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Delete */}
                <div className="pt-5">
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={() => remove(index)}
                    className="text-destructive hover:text-destructive"
                  >
                    <Trash2 className="size-4" />
                  </Button>
                </div>
              </div>

              {/* Units conversion hint */}
              {unitsLabel && (
                <p className="text-xs text-muted-foreground pl-1">
                  В ед. изм.: {unitsLabel}
                </p>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
