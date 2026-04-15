"use client";

/**
 * DiscreteTargetField — target value input with quick-select popover [1, 2, 3].
 * (ТЗ 9.2: discrete method → target=1, unit="шт.", UI_PATTERNS: Popover quick-select)
 */

import { useState } from "react";
import { useFormContext } from "react-hook-form";
import { ChevronDown } from "lucide-react";
import { Input } from "@/components/ui/input";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { FormField, FormItem, FormLabel, FormControl, FormMessage } from "@/components/ui/form";
import type { KpiFormValues } from "./kpi-modal-schema";

const QUICK_VALUES = [1, 2, 3] as const;

export function DiscreteTargetField() {
  const form = useFormContext<KpiFormValues>();
  const [open, setOpen] = useState(false);

  return (
    <FormField
      control={form.control}
      name="targetValue"
      render={({ field }) => (
        <FormItem>
          <FormLabel>
            Целевое значение <span className="text-destructive">*</span>
          </FormLabel>
          <FormControl>
            <div className="flex gap-2">
              <Input
                type="number"
                min={1}
                placeholder="1"
                value={field.value ?? ""}
                onChange={(e) =>
                  field.onChange(
                    e.target.value === "" ? null : Number(e.target.value),
                  )
                }
                className="flex-1"
              />
              <Popover open={open} onOpenChange={setOpen}>
                <PopoverTrigger
                  type="button"
                  className="inline-flex h-9 w-9 items-center justify-center rounded-md border border-input bg-background text-sm hover:bg-accent hover:text-accent-foreground"
                >
                  <ChevronDown className="size-4" />
                </PopoverTrigger>
                <PopoverContent className="w-32 p-1" align="end">
                  {QUICK_VALUES.map((v) => (
                    <button
                      key={v}
                      type="button"
                      className="w-full rounded px-3 py-1.5 text-sm text-left hover:bg-accent transition-colors"
                      onClick={() => {
                        field.onChange(v);
                        setOpen(false);
                      }}
                    >
                      {v}
                    </button>
                  ))}
                </PopoverContent>
              </Popover>
            </div>
          </FormControl>
          <FormMessage />
        </FormItem>
      )}
    />
  );
}
