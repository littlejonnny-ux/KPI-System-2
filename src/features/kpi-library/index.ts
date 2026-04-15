// Библиотека KPI-шаблонов — публичный API модуля

export { KpiModal } from "./components/kpi-modal";
export { KpiFilters, defaultKpiFilterState } from "./components/kpi-filters";
export { KpiTable } from "./components/kpi-table";
export { KpiPeriodPicker } from "./components/kpi-period-picker";
export { ScaleRangesEditor } from "./components/scale-ranges-editor";
export { DiscretePointsEditor } from "./components/discrete-points-editor";
export { DiscreteTargetField } from "./components/discrete-target-field";
export { KpiPropertiesEditor } from "./components/kpi-properties-editor";
export {
  kpiFormSchema,
  defaultKpiFormValues,
  type KpiFormValues,
} from "./components/kpi-modal-schema";
export type { KpiFilterState } from "./components/kpi-filters";
