"use client";

/**
 * LibraryPage — KPI Library orchestrator page.
 * Hosts filters, table, and create/edit modal.
 * Stage 8 implementation.
 */

import { useState, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { useKpiLibrary } from "@/features/kpi-library/hooks/use-kpi-library";
import { KpiFilters, defaultKpiFilterState } from "@/features/kpi-library/components/kpi-filters";
import { KpiTable } from "@/features/kpi-library/components/kpi-table";
import { KpiModal } from "@/features/kpi-library/components/kpi-modal";
import type { KpiFilterState } from "@/features/kpi-library/components/kpi-filters";
import type { KpiLibraryItem } from "@/types/kpi";

export default function LibraryPage() {
  const [filters, setFilters] = useState<KpiFilterState>(defaultKpiFilterState);
  const [modalOpen, setModalOpen] = useState(false);
  const [editItem, setEditItem] = useState<KpiLibraryItem | undefined>(undefined);

  // Fetch with server-side filters (search, method, year)
  const { data: allItems = [], isLoading } = useKpiLibrary({
    isActive: true,
    search: filters.search || undefined,
    evaluationMethod: (filters.evaluationMethod as KpiLibraryItem["evaluationMethod"]) || undefined,
    periodYear: filters.periodYear ? Number(filters.periodYear) : undefined,
  });

  // Client-side filter: unit + dynamic property filters
  const displayItems = useMemo(() => {
    return allItems.filter((item) => {
      if (filters.unit && item.unit !== filters.unit) return false;

      // Property filters: each active dict filter must match a KPI property
      for (const [dictId, valueId] of Object.entries(filters.properties)) {
        if (!valueId) continue;
        const hasProp = item.properties.some(
          (p) => p.dictionaryId === dictId && p.valueId === valueId,
        );
        if (!hasProp) return false;
      }

      return true;
    });
  }, [allItems, filters.unit, filters.properties]);

  function openCreate() {
    setEditItem(undefined);
    setModalOpen(true);
  }

  function openEdit(item: KpiLibraryItem) {
    setEditItem(item);
    setModalOpen(true);
  }

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Библиотека KPI</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            {isLoading ? "Загрузка..." : `${displayItems.length} KPI`}
          </p>
        </div>
        <Button onClick={openCreate}>
          <Plus className="size-4 mr-1.5" /> Новый KPI
        </Button>
      </div>

      {/* Filters */}
      <KpiFilters filters={filters} onChange={setFilters} />

      {/* Table */}
      <KpiTable items={displayItems} isLoading={isLoading} onEdit={openEdit} />

      {/* Modal */}
      <KpiModal
        open={modalOpen}
        onOpenChange={setModalOpen}
        editItem={editItem}
        allItems={allItems}
      />
    </div>
  );
}
