"use client";

/**
 * KpiFilters — two-row filter panel for the KPI library.
 * Row 1: search + method + unit + period year.
 * Row 2: dynamic selects for each show_in_filters dictionary.
 * (ТЗ 9.5)
 */

import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Search, X } from "lucide-react";
import { UNIT_OPTIONS, METHOD_LABELS } from "@/lib/constants";
import { useDictionaries } from "@/features/shared/hooks/use-dictionaries";

const ALL_VALUE = "__all__";

export interface KpiFilterState {
  search: string;
  evaluationMethod: string;
  unit: string;
  periodYear: string;
  /** dictionary_id → value_id or "" */
  properties: Record<string, string>;
}

export const defaultKpiFilterState: KpiFilterState = {
  search: "",
  evaluationMethod: "",
  unit: "",
  periodYear: "",
  properties: {},
};

interface KpiFiltersProps {
  filters: KpiFilterState;
  onChange: (filters: KpiFilterState) => void;
}

export function KpiFilters({ filters, onChange }: KpiFiltersProps) {
  const { data: dictionaries = [] } = useDictionaries();
  const filterDicts = dictionaries.filter((d) => d.showInFilters);

  const hasActiveFilters =
    filters.search !== "" ||
    filters.evaluationMethod !== "" ||
    filters.unit !== "" ||
    filters.periodYear !== "" ||
    Object.values(filters.properties).some((v) => v !== "");

  function update(patch: Partial<KpiFilterState>) {
    onChange({ ...filters, ...patch });
  }

  function reset() {
    onChange(defaultKpiFilterState);
  }

  function updateProperty(dictId: string, valueId: string) {
    onChange({
      ...filters,
      properties: {
        ...filters.properties,
        [dictId]: valueId === ALL_VALUE ? "" : valueId,
      },
    });
  }

  const currentYear = new Date().getFullYear();
  const yearOptions = Array.from({ length: 6 }, (_, i) => currentYear - 1 + i);

  return (
    <div className="space-y-2">
      {/* Row 1: main filters */}
      <div className="flex flex-wrap gap-2 items-center">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 size-3.5 text-muted-foreground" />
          <Input
            placeholder="Поиск по названию..."
            value={filters.search}
            onChange={(e) => update({ search: e.target.value })}
            className="pl-8"
          />
        </div>

        <Select
          value={filters.evaluationMethod || ALL_VALUE}
          onValueChange={(v) =>
            update({ evaluationMethod: (v ?? ALL_VALUE) === ALL_VALUE ? "" : (v ?? "") })
          }
        >
          <SelectTrigger className="w-[160px]">
            <SelectValue placeholder="Метод" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={ALL_VALUE}>Все методы</SelectItem>
            {Object.entries(METHOD_LABELS).map(([k, label]) => (
              <SelectItem key={k} value={k}>
                {label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select
          value={filters.unit || ALL_VALUE}
          onValueChange={(v) => update({ unit: (v ?? ALL_VALUE) === ALL_VALUE ? "" : (v ?? "") })}
        >
          <SelectTrigger className="w-[140px]">
            <SelectValue placeholder="Ед. изм." />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={ALL_VALUE}>Все ед. изм.</SelectItem>
            {UNIT_OPTIONS.map((u) => (
              <SelectItem key={u.value} value={u.value}>
                {u.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select
          value={filters.periodYear || ALL_VALUE}
          onValueChange={(v) =>
            update({ periodYear: (v ?? ALL_VALUE) === ALL_VALUE ? "" : (v ?? "") })
          }
        >
          <SelectTrigger className="w-[110px]">
            <SelectValue placeholder="Год" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={ALL_VALUE}>Все годы</SelectItem>
            {yearOptions.map((y) => (
              <SelectItem key={y} value={String(y)}>
                {y}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {hasActiveFilters && (
          <Button type="button" variant="ghost" size="sm" onClick={reset}>
            <X className="size-3.5 mr-1" /> Сбросить
          </Button>
        )}
      </div>

      {/* Row 2: dynamic dictionary filters */}
      {filterDicts.length > 0 && (
        <div className="flex flex-wrap gap-2 items-center">
          {filterDicts.map((dict) => (
            <Select
              key={dict.id}
              value={filters.properties[dict.id] || ALL_VALUE}
              onValueChange={(v) => updateProperty(dict.id, v ?? "")}
            >
              <SelectTrigger className="w-[160px]">
                <SelectValue placeholder={dict.name} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={ALL_VALUE}>Все: {dict.name}</SelectItem>
                {dict.values.map((val) => (
                  <SelectItem key={val.id} value={val.id}>
                    {val.value}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          ))}
        </div>
      )}
    </div>
  );
}
