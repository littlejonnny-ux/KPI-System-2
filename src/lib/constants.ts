/**
 * Application-wide constants.
 * Sections 7–9 of KPI_System_Technical_Specification.md.
 */

export const APP_NAME = "KPI System";
export const APP_DESCRIPTION = "Система управления KPI-картами";

// ---------------------------------------------------------------------------
// Evaluation methods  (ТЗ раздел 3)
// ---------------------------------------------------------------------------

export const METHOD_LABELS: Record<string, string> = {
  scale: "По шкале",
  binary: "Бинарный",
  discrete: "Дискретный",
  manual: "Ручной",
} as const;

// ---------------------------------------------------------------------------
// Unit options  (ТЗ раздел 9.1)
// ---------------------------------------------------------------------------

export const UNIT_OPTIONS = [
  { value: "руб.", label: "руб." },
  { value: "тыс. р.", label: "тыс. р." },
  { value: "млн. р.", label: "млн. р." },
  { value: "млрд. р.", label: "млрд. р." },
  { value: "%", label: "%" },
  { value: "шт.", label: "шт." },
  { value: "да / нет", label: "да / нет" },
] as const;

export type UnitValue = (typeof UNIT_OPTIONS)[number]["value"];

// ---------------------------------------------------------------------------
// Card status labels  (ТЗ раздел 7.1)
// ---------------------------------------------------------------------------

export const STATUS_LABELS: Record<string, string> = {
  draft: "Черновик",
  active: "Активна",
  pending_approval: "На согласовании",
  approved: "Утверждена",
  returned: "Возвращена",
} as const;

// ---------------------------------------------------------------------------
// Card status badge colors  (Design Showcase section 8.6)
// ---------------------------------------------------------------------------

export const STATUS_COLORS: Record<string, string> = {
  draft: "bg-muted text-muted-foreground",
  active: "bg-blue-500/20 text-blue-400",
  pending_approval: "bg-yellow-500/20 text-yellow-400",
  approved: "bg-green-500/20 text-green-400",
  returned: "bg-red-500/20 text-red-400",
} as const;

// ---------------------------------------------------------------------------
// System roles  (ТЗ раздел 2)
// ---------------------------------------------------------------------------

export const ROLE_LABELS: Record<string, string> = {
  admin: "Администратор",
  approver: "Согласующий",
  participant: "Участник",
} as const;

export const ROLE_COLORS: Record<string, string> = {
  admin: "bg-blue-500/20 text-blue-400",
  approver: "bg-teal-500/20 text-teal-400",
  participant: "bg-muted text-muted-foreground",
} as const;

// ---------------------------------------------------------------------------
// Pagination defaults
// ---------------------------------------------------------------------------

export const PAGE_SIZE = 20;

// ---------------------------------------------------------------------------
// KPI weight constraints  (ТЗ раздел 5.3)
// ---------------------------------------------------------------------------

export const KPI_WEIGHT_MIN = 5;
export const KPI_WEIGHT_MAX = 100;
export const KPI_WEIGHTS_SUM = 100;

// ---------------------------------------------------------------------------
// Composite types  (ТЗ раздел 4)
// ---------------------------------------------------------------------------

export const COMPOSITE_TYPE_LABELS: Record<string, string> = {
  weighted: "Средневзвешенная",
  additive: "Суммарная",
} as const;

// ---------------------------------------------------------------------------
// Period presets  (ТЗ раздел 9.3)
// ---------------------------------------------------------------------------

export const PERIOD_PRESET_LABELS: Record<string, string> = {
  Q1: "Q1 (янв — март)",
  Q2: "Q2 (апр — июнь)",
  Q3: "Q3 (июль — сент)",
  Q4: "Q4 (окт — дек)",
  H1: "H1 (1-е полугодие)",
  H2: "H2 (2-е полугодие)",
  year: "Год",
  custom: "Произвольно",
} as const;
