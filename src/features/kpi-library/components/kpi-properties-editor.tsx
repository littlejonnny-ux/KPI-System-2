"use client";

/**
 * KpiPropertiesEditor — assigns dictionary property values to a KPI.
 * One row per non-system dictionary; Select picks a value or "none".
 * (ТЗ 9.5: dynamic filters by dictionary properties)
 */

import { useFormContext, useFieldArray } from "react-hook-form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useDictionaries } from "@/features/shared/hooks/use-dictionaries";
import type { KpiFormValues } from "./kpi-modal-schema";

const NONE_VALUE = "__none__";

export function KpiPropertiesEditor() {
  const form = useFormContext<KpiFormValues>();
  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "properties",
  });

  const { data: dictionaries = [] } = useDictionaries();

  // Only show non-system dictionaries (system ones like "Уровни" are auto-assigned)
  const editableDicts = dictionaries.filter((d) => !d.isSystem);

  if (editableDicts.length === 0) {
    return (
      <p className="text-xs text-muted-foreground py-1">
        Нет доступных словарей.
      </p>
    );
  }

  function getSelectedValueId(dictionaryId: string): string {
    const prop = fields.find((f) => f.dictionaryId === dictionaryId);
    return prop?.valueId ?? NONE_VALUE;
  }

  function handleChange(dictionaryId: string, valueId: string) {
    const existingIndex = fields.findIndex((f) => f.dictionaryId === dictionaryId);

    if (valueId === NONE_VALUE) {
      if (existingIndex >= 0) remove(existingIndex);
      return;
    }

    if (existingIndex >= 0) {
      form.setValue(`properties.${existingIndex}.valueId`, valueId);
    } else {
      append({ dictionaryId, valueId });
    }
  }

  return (
    <div className="space-y-2">
      {editableDicts.map((dict) => (
        <div key={dict.id} className="grid grid-cols-[140px_1fr] gap-3 items-center">
          <span className="text-sm text-muted-foreground truncate" title={dict.name}>
            {dict.name}
          </span>
          <Select
            value={getSelectedValueId(dict.id)}
            onValueChange={(v) => handleChange(dict.id, v ?? NONE_VALUE)}
          >
            <SelectTrigger>
              <SelectValue placeholder="Не задано" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={NONE_VALUE}>— Не задано —</SelectItem>
              {dict.values.map((val) => (
                <SelectItem key={val.id} value={val.id}>
                  {val.value}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      ))}
    </div>
  );
}
