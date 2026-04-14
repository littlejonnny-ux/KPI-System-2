/**
 * KPI ViewModel types — used by UI components and application logic.
 * Components receive these types, never raw DB rows.
 * Derived from Database types in src/types/database.ts.
 */

import type { Tables, Enums } from "@/types/database";

// ---------------------------------------------------------------------------
// Re-exported DB enum types (use these in application code, not raw strings)
// ---------------------------------------------------------------------------

export type SystemRole = Enums<"system_role_enum">;
export type KpiCardStatus = Enums<"kpi_card_status_enum">;
export type EvaluationMethod = Enums<"evaluation_method_enum">;
export type CardPeriodType = Enums<"card_period_type_enum">;
export type PeriodNature = Enums<"period_nature_enum">;
export type PeriodPreset = Enums<"period_preset_enum">;
export type ScaleRangeType = Enums<"scale_range_type_enum">;
export type CompositeType = Enums<"composite_type_enum">;
export type AuditAction = Enums<"audit_action_enum">;
export type EventType = Enums<"event_type_enum">;

// ---------------------------------------------------------------------------
// Raw DB row aliases (use these when passing data directly from Supabase)
// ---------------------------------------------------------------------------

export type UserRow = Tables<"users">;
export type KpiLibraryRow = Tables<"kpi_library">;
export type KpiScaleRangeRow = Tables<"kpi_scale_ranges">;
export type KpiDiscretePointRow = Tables<"kpi_discrete_points">;
export type KpiLibraryPropertyRow = Tables<"kpi_library_properties">;
export type TriggerGoalRow = Tables<"trigger_goals">;
export type TriggerGoalLineRow = Tables<"trigger_goal_lines">;
export type KpiCardRow = Tables<"kpi_cards">;
export type KpiCardLineRow = Tables<"kpi_card_lines">;
export type KpiCardLineL2Row = Tables<"kpi_card_lines_l2">;
export type CardLineScaleRangeRow = Tables<"card_line_scale_ranges">;
export type CardLineL2ScaleRangeRow = Tables<"card_line_l2_scale_ranges">;
export type CardLineDiscretePointRow = Tables<"card_line_discrete_points">;
export type UserTriggerGoalDataRow = Tables<"user_trigger_goal_data">;
export type DictionaryRow = Tables<"dictionaries">;
export type DictionaryValueRow = Tables<"dictionary_values">;
export type AuditLogRow = Tables<"audit_log">;
export type EventRow = Tables<"events">;

// ---------------------------------------------------------------------------
// ViewModel types — shaped for UI consumption
// ---------------------------------------------------------------------------

export interface UserProfile {
  id: string;
  workEmail: string;
  firstName: string;
  lastName: string;
  middleName: string | null;
  fullName: string | null;
  systemRole: SystemRole;
  isActive: boolean;
  approverId: string | null;
  baseSalary: number | null;
  salaryMultiplier: number | null;
  levelValueId: string | null;
  companyRoleId: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface Dictionary {
  id: string;
  name: string;
  isSystem: boolean;
  showInFilters: boolean;
  createdAt: string;
  updatedAt: string;
  values: DictionaryValue[];
}

export interface DictionaryValue {
  id: string;
  dictionaryId: string;
  value: string;
  sortOrder: number;
  createdAt: string;
  updatedAt: string;
}

export interface ScaleRange {
  id: string;
  rangeFrom: number;
  rangeTo: number | null;
  rangeType: ScaleRangeType;
  fixedPct: number | null;
  sortOrder: number;
}

export interface DiscretePoint {
  id: string;
  factValue: number;
  executionPct: number;
  sortOrder: number;
}

export interface KpiLibraryItem {
  id: string;
  name: string;
  description: string | null;
  unit: string;
  evaluationMethod: EvaluationMethod;
  periodYear: number;
  periodNature: PeriodNature;
  periodPreset: PeriodPreset | null;
  periodDateFrom: string | null;
  periodDateTo: string | null;
  periodSingleDate: string | null;
  targetValue: number | null;
  isActive: boolean;
  createdBy: string | null;
  createdAt: string;
  updatedAt: string;
  scaleRanges: ScaleRange[];
  discretePoints: DiscretePoint[];
  properties: KpiLibraryProperty[];
}

export interface KpiLibraryProperty {
  id: string;
  kpiId: string;
  dictionaryId: string;
  valueId: string;
}

export interface TriggerGoalLine {
  id: string;
  triggerGoalId: string;
  kpiId: string | null;
  weight: number;
  targetValue: number | null;
  officialFactValue: number | null;
  officialExecutionPct: number | null;
  sortOrder: number;
  createdAt: string;
  updatedAt: string;
}

export interface TriggerGoal {
  id: string;
  name: string;
  description: string | null;
  periodYear: number;
  periodType: CardPeriodType;
  periodSub: string | null;
  officialExecutionPct: number | null;
  applicableLevels: string[] | null;
  isActive: boolean;
  createdBy: string | null;
  createdAt: string;
  updatedAt: string;
  lines: TriggerGoalLine[];
}

export interface UserTriggerGoalData {
  id: string;
  cardId: string;
  triggerGoalLineId: string;
  useOfficial: boolean;
  userFactValue: number | null;
  updatedAt: string;
}

export interface CardLineScaleRange {
  id: string;
  rangeFrom: number;
  rangeTo: number | null;
  rangeType: ScaleRangeType;
  fixedPct: number | null;
  sortOrder: number;
}

export interface CardLineDiscretePoint {
  id: string;
  factValue: number;
  executionPct: number;
  sortOrder: number;
}

export interface KpiCardLineL2 {
  id: string;
  parentLineId: string;
  kpiId: string | null;
  name: string;
  unit: string;
  evaluationMethod: EvaluationMethod;
  weight: number;
  targetValue: number | null;
  factValue: number | null;
  executionPct: number | null;
  isApproved: boolean;
  participantComment: string | null;
  sortOrder: number;
  createdAt: string;
  updatedAt: string;
  scaleRanges: CardLineScaleRange[];
}

export interface KpiCardLine {
  id: string;
  cardId: string;
  kpiId: string | null;
  name: string;
  unit: string;
  evaluationMethod: EvaluationMethod;
  weight: number;
  targetValue: number | null;
  factValue: number | null;
  executionPct: number | null;
  isComposite: boolean;
  compositeType: CompositeType | null;
  isApproved: boolean;
  approvedBy: string | null;
  approvedAt: string | null;
  approverComment: string | null;
  participantComment: string | null;
  sortOrder: number;
  createdAt: string;
  updatedAt: string;
  scaleRanges: CardLineScaleRange[];
  discretePoints: CardLineDiscretePoint[];
  subLines: KpiCardLineL2[];
}

export interface KpiCard {
  id: string;
  userId: string;
  triggerGoalId: string | null;
  periodYear: number;
  periodType: CardPeriodType;
  periodSub: string | null;
  status: KpiCardStatus;
  isComplete: boolean;
  totalExecutionPct: number | null;
  totalReward: number | null;
  approvedBy: string | null;
  approvedAt: string | null;
  approverComment: string | null;
  createdBy: string | null;
  createdAt: string;
  updatedAt: string;
  lines: KpiCardLine[];
  triggerGoalData: UserTriggerGoalData[];
}

export interface AuditLogEntry {
  id: string;
  entityType: string;
  entityId: string;
  action: AuditAction;
  newValue: unknown | null;
  comment: string | null;
  performedBy: string | null;
  performedAt: string;
}

export interface KpiEvent {
  id: string;
  eventType: EventType;
  title: string;
  description: string | null;
  relatedCardId: string | null;
  createdBy: string | null;
  createdAt: string;
}

// ---------------------------------------------------------------------------
// Utility types for common UI patterns
// ---------------------------------------------------------------------------

export interface KpiCardSummary {
  id: string;
  userId: string;
  participantName: string | null;
  periodYear: number;
  periodType: CardPeriodType;
  periodSub: string | null;
  status: KpiCardStatus;
  totalExecutionPct: number | null;
  totalReward: number | null;
  createdAt: string;
  updatedAt: string;
}

export interface PeriodLabel {
  type: CardPeriodType;
  year: number;
  sub: string | null;
  label: string;
}
