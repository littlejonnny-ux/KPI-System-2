"use client";

/**
 * KpiModal — create / edit dialog for KPI Library items.
 * RHF + Zod validation, auto-linkage, duplicate detection.
 * (ТЗ 9.1–9.7, UI_PATTERNS: Dialog max-w-3xl, scrollable body)
 */

import { useEffect } from "react";
import { useForm, type Resolver } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Form,
  FormField,
  FormItem,
  FormLabel,
  FormControl,
  FormMessage,
} from "@/components/ui/form";
import { Separator } from "@/components/ui/separator";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { UNIT_OPTIONS, METHOD_LABELS } from "@/lib/constants";
import { useCreateKpi, useUpdateKpi } from "@/features/kpi-library/hooks/use-kpi-library";
import type { KpiLibraryItem } from "@/types/kpi";
import { KpiPeriodPicker } from "./kpi-period-picker";
import { ScaleRangesEditor } from "./scale-ranges-editor";
import { DiscretePointsEditor } from "./discrete-points-editor";
import { DiscreteTargetField } from "./discrete-target-field";
import { KpiPropertiesEditor } from "./kpi-properties-editor";
import {
  kpiFormSchema,
  defaultKpiFormValues,
  type KpiFormValues,
} from "./kpi-modal-schema";

// ---------------------------------------------------------------------------
// Duplicate detection  (ТЗ 9.6)
// ---------------------------------------------------------------------------

function isDuplicate(
  values: KpiFormValues,
  items: KpiLibraryItem[],
  editId?: string,
): boolean {
  return items.some((item) => {
    if (editId && item.id === editId) return false;
    if (!item.isActive) return false;
    return (
      item.name.trim().toLowerCase() === values.name.trim().toLowerCase() &&
      item.evaluationMethod === values.evaluationMethod &&
      item.unit === values.unit &&
      item.periodYear === values.periodYear &&
      item.periodNature === values.periodNature &&
      (item.periodPreset ?? null) === (values.periodPreset ?? null)
    );
  });
}

// ---------------------------------------------------------------------------
// ViewModel → FormValues mapper
// ---------------------------------------------------------------------------

function itemToFormValues(item: KpiLibraryItem): KpiFormValues {
  return {
    name: item.name,
    description: item.description,
    unit: item.unit,
    evaluationMethod: item.evaluationMethod,
    periodYear: item.periodYear,
    periodNature: item.periodNature,
    periodPreset: item.periodPreset,
    periodDateFrom: item.periodDateFrom,
    periodDateTo: item.periodDateTo,
    periodSingleDate: item.periodSingleDate,
    targetValue: item.targetValue,
    scaleRanges: item.scaleRanges.map((r) => ({
      id: r.id,
      rangeFrom: r.rangeFrom,
      rangeTo: r.rangeTo,
      rangeType: r.rangeType,
      fixedPct: r.fixedPct,
      sortOrder: r.sortOrder,
    })),
    discretePoints: item.discretePoints.map((p) => ({
      id: p.id,
      factValue: p.factValue,
      executionPct: p.executionPct,
      sortOrder: p.sortOrder,
    })),
    properties: item.properties.map((p) => ({
      id: p.id,
      dictionaryId: p.dictionaryId,
      valueId: p.valueId,
    })),
  };
}

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

interface KpiModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Editing: existing item. Creating: undefined. */
  editItem?: KpiLibraryItem;
  /** All active items for duplicate check. */
  allItems: KpiLibraryItem[];
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function KpiModal({ open, onOpenChange, editItem, allItems }: KpiModalProps) {
  const createKpi = useCreateKpi();
  const updateKpi = useUpdateKpi();

  const form = useForm<KpiFormValues>({
    resolver: zodResolver(kpiFormSchema) as unknown as Resolver<KpiFormValues>,
    defaultValues: editItem ? itemToFormValues(editItem) : defaultKpiFormValues,
  });

  // Reset form when modal opens/closes or editItem changes
  useEffect(() => {
    if (open) {
      form.reset(editItem ? itemToFormValues(editItem) : defaultKpiFormValues);
    }
  }, [open, editItem, form]);

  // ---------------------------------------------------------------------------
  // Auto-linkage watchers  (ТЗ 9.2)
  // ---------------------------------------------------------------------------

  const unit = form.watch("unit");
  const method = form.watch("evaluationMethod");

  // unit = "да / нет" → method = "binary"
  useEffect(() => {
    if (unit === "да / нет" && method !== "binary") {
      form.setValue("evaluationMethod", "binary", { shouldValidate: true });
    }
  }, [unit, method, form]);

  // method = "binary" → unit = "да / нет"
  useEffect(() => {
    if (method === "binary" && unit !== "да / нет") {
      form.setValue("unit", "да / нет", { shouldValidate: true });
    }
    // method = "discrete" → target = 1, unit = "шт."
    if (method === "discrete") {
      if (unit !== "шт.") form.setValue("unit", "шт.", { shouldValidate: true });
      const currentTarget = form.getValues("targetValue");
      if (!currentTarget) form.setValue("targetValue", 1, { shouldValidate: true });
    }
  }, [method, unit, form]);

  // ---------------------------------------------------------------------------
  // Submit
  // ---------------------------------------------------------------------------

  async function onSubmit(values: KpiFormValues) {
    if (isDuplicate(values, allItems, editItem?.id)) {
      form.setError("name", {
        message: "KPI с таким названием, методом, единицей и периодом уже существует",
      });
      return;
    }

    // Strip form-only `id` fields and normalize undefined → null for nullable API fields
    const payload = {
      ...values,
      scaleRanges: values.scaleRanges.map(({ id: _id, rangeTo, fixedPct, ...rest }) => ({
        ...rest,
        rangeTo: rangeTo ?? null,
        fixedPct: fixedPct ?? null,
      })),
      discretePoints: values.discretePoints.map(({ id: _id, ...rest }) => rest),
      properties: values.properties.map(({ id: _id, ...rest }) => rest),
    };

    if (editItem) {
      await updateKpi.mutateAsync({ id: editItem.id, ...payload });
    } else {
      await createKpi.mutateAsync(payload);
    }

    onOpenChange(false);
  }

  const isPending = createKpi.isPending || updateKpi.isPending;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {editItem ? "Редактировать KPI" : "Новый KPI"}
          </DialogTitle>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
            {/* Name */}
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>
                    Название <span className="text-destructive">*</span>
                  </FormLabel>
                  <FormControl>
                    <Input placeholder="Введите название KPI" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Description */}
            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Описание</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Необязательное описание"
                      rows={2}
                      {...field}
                      value={field.value ?? ""}
                      onChange={(e) => field.onChange(e.target.value || null)}
                    />
                  </FormControl>
                </FormItem>
              )}
            />

            {/* Unit + Method */}
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="unit"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>
                      Единица измерения <span className="text-destructive">*</span>
                    </FormLabel>
                    <FormControl>
                      <Select value={field.value} onValueChange={field.onChange}>
                        <SelectTrigger>
                          <SelectValue placeholder="Выберите единицу" />
                        </SelectTrigger>
                        <SelectContent>
                          {UNIT_OPTIONS.map((u) => (
                            <SelectItem key={u.value} value={u.value}>
                              {u.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="evaluationMethod"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>
                      Метод оценки <span className="text-destructive">*</span>
                    </FormLabel>
                    <FormControl>
                      <ToggleGroup
                        value={field.value ? [field.value as string] : []}
                        onValueChange={(values) => {
                          const v = values[values.length - 1];
                          if (v) field.onChange(v);
                        }}
                        className="flex flex-wrap gap-1 justify-start"
                      >
                        {Object.entries(METHOD_LABELS).map(([k, label]) => (
                          <ToggleGroupItem key={k} value={k} variant="outline" className="text-xs px-2 h-8">
                            {label}
                          </ToggleGroupItem>
                        ))}
                      </ToggleGroup>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <Separator />

            {/* Period */}
            <KpiPeriodPicker />

            <Separator />

            {/* Method-specific sections */}
            {method === "scale" && (
              <>
                <FormField
                  control={form.control}
                  name="targetValue"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Целевое значение</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          placeholder="0"
                          value={field.value ?? ""}
                          onChange={(e) =>
                            field.onChange(
                              e.target.value === "" ? null : Number(e.target.value),
                            )
                          }
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <ScaleRangesEditor />
              </>
            )}

            {method === "discrete" && (
              <>
                <DiscreteTargetField />
                <DiscretePointsEditor />
              </>
            )}

            {method === "manual" && (
              <FormField
                control={form.control}
                name="targetValue"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Целевое значение</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        placeholder="0"
                        value={field.value ?? ""}
                        onChange={(e) =>
                          field.onChange(
                            e.target.value === "" ? null : Number(e.target.value),
                          )
                        }
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}

            {method === "binary" && (
              <p className="text-xs text-muted-foreground bg-muted/30 rounded-md px-3 py-2">
                Бинарный метод: KPI оценивается как «выполнено / не выполнено».
                Единица измерения автоматически установлена «да / нет».
              </p>
            )}

            <Separator />

            {/* Properties */}
            <div className="space-y-2">
              <span className="text-sm font-medium">Свойства</span>
              <KpiPropertiesEditor />
            </div>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
              >
                Отмена
              </Button>
              <Button type="submit" disabled={isPending}>
                {isPending
                  ? editItem
                    ? "Сохранение..."
                    : "Создание..."
                  : editItem
                    ? "Сохранить"
                    : "Создать"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
