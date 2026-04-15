"use client";

/**
 * KpiPeriodPicker — step-by-step period selection.
 * Steps: Year → Nature (for_period / on_date) → Preset or date.
 * UI pattern: ToggleGroup for nature + preset grid (ТЗ 9.3, UI_PATTERNS toggle-segment + preset-grid).
 */

import { useEffect } from "react";
import { useFormContext } from "react-hook-form";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import {
  FormField,
  FormItem,
  FormLabel,
  FormControl,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { PERIOD_PRESET_LABELS } from "@/lib/constants";
import type { KpiFormValues } from "./kpi-modal-schema";

const PERIOD_PRESETS = Object.keys(PERIOD_PRESET_LABELS) as Array<
  keyof typeof PERIOD_PRESET_LABELS
>;

/** Compute date range for known presets */
function presetToDates(
  preset: string,
  year: number,
): { from: string; to: string } | null {
  const pad = (n: number) => String(n).padStart(2, "0");
  const d = (m: number, day: number) => `${year}-${pad(m)}-${pad(day)}`;
  switch (preset) {
    case "Q1": return { from: d(1, 1), to: d(3, 31) };
    case "Q2": return { from: d(4, 1), to: d(6, 30) };
    case "Q3": return { from: d(7, 1), to: d(9, 30) };
    case "Q4": return { from: d(10, 1), to: d(12, 31) };
    case "H1": return { from: d(1, 1), to: d(6, 30) };
    case "H2": return { from: d(7, 1), to: d(12, 31) };
    case "year": return { from: d(1, 1), to: d(12, 31) };
    default: return null;
  }
}

export function KpiPeriodPicker() {
  const form = useFormContext<KpiFormValues>();
  const nature = form.watch("periodNature");
  const preset = form.watch("periodPreset");
  const year = form.watch("periodYear");

  // Auto-compute dates when preset/year changes
  useEffect(() => {
    if (!preset || preset === "custom" || !year) return;
    const dates = presetToDates(preset, year);
    if (dates) {
      form.setValue("periodDateFrom", dates.from);
      form.setValue("periodDateTo", dates.to);
    }
  }, [preset, year, form]);

  return (
    <div className="space-y-4">
      {/* Step 1: Year */}
      <FormField
        control={form.control}
        name="periodYear"
        render={({ field }) => (
          <FormItem>
            <FormLabel>
              Отчётный год <span className="text-destructive">*</span>
            </FormLabel>
            <FormControl>
              <Input
                type="number"
                min={2020}
                max={2099}
                placeholder="2026"
                {...field}
                onChange={(e) => field.onChange(Number(e.target.value))}
              />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />

      {/* Step 2: Nature */}
      <FormField
        control={form.control}
        name="periodNature"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Природа показателя</FormLabel>
            <FormControl>
              <ToggleGroup
                value={field.value ? [field.value as string] : []}
                onValueChange={(values) => {
                  const v = values[values.length - 1];
                  if (v) {
                    field.onChange(v);
                    form.setValue("periodPreset", null);
                    form.setValue("periodDateFrom", null);
                    form.setValue("periodDateTo", null);
                    form.setValue("periodSingleDate", null);
                  }
                }}
                className="justify-start"
              >
                <ToggleGroupItem value="for_period" variant="outline">
                  За период
                </ToggleGroupItem>
                <ToggleGroupItem value="on_date" variant="outline">
                  На дату
                </ToggleGroupItem>
              </ToggleGroup>
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />

      {/* Step 3: Preset grid or date field */}
      {nature === "for_period" && (
        <FormField
          control={form.control}
          name="periodPreset"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Период</FormLabel>
              <FormControl>
                <ToggleGroup
                  value={field.value ? [field.value as string] : []}
                  onValueChange={(values) => {
                    const v = values[values.length - 1];
                    if (v) field.onChange(v);
                  }}
                  className="grid grid-cols-4 gap-1.5"
                >
                  {PERIOD_PRESETS.map((p) => (
                    <ToggleGroupItem
                      key={p}
                      value={p}
                      variant="outline"
                      className="text-xs px-2 py-1.5 h-auto"
                    >
                      {p === "year" ? "Год" : p === "custom" ? "Произвольно" : p}
                    </ToggleGroupItem>
                  ))}
                </ToggleGroup>
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      )}

      {/* Custom date range */}
      {nature === "for_period" && preset === "custom" && (
        <div className="grid grid-cols-2 gap-3">
          <FormField
            control={form.control}
            name="periodDateFrom"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Начало</FormLabel>
                <FormControl>
                  <Input
                    type="date"
                    {...field}
                    value={field.value ?? ""}
                    onChange={(e) => field.onChange(e.target.value || null)}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="periodDateTo"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Конец</FormLabel>
                <FormControl>
                  <Input
                    type="date"
                    {...field}
                    value={field.value ?? ""}
                    onChange={(e) => field.onChange(e.target.value || null)}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
      )}

      {/* On-date: single date field */}
      {nature === "on_date" && (
        <FormField
          control={form.control}
          name="periodSingleDate"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Дата</FormLabel>
              <FormControl>
                <Input
                  type="date"
                  {...field}
                  value={field.value ?? `${year}-12-31`}
                  onChange={(e) => field.onChange(e.target.value || null)}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      )}
    </div>
  );
}
