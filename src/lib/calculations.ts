/**
 * KPI Calculation Engine.
 *
 * ALL formula logic lives here — no calculations in components or hooks.
 * Source of truth: KPI_System_Technical_Specification.md, sections 3–6.
 *
 * Immutable: every function returns a new value, never mutates inputs.
 */

// ---------------------------------------------------------------------------
// Input shapes (minimal — compatible with ViewModel types in @/types/kpi)
// ---------------------------------------------------------------------------

export type EvaluationMethodStr = "scale" | "binary" | "discrete" | "manual";
export type ScaleRangeTypeStr = "fixed" | "proportional";
export type KpiCardStatusStr = "draft" | "active" | "pending_approval" | "approved" | "returned";
export type PeriodNatureStr = "for_period" | "on_date";
export type PeriodPresetStr = "Q1" | "Q2" | "Q3" | "Q4" | "H1" | "H2" | "year" | "custom";

export interface ScaleRangeData {
  rangeFrom: number;
  rangeTo: number | null;
  rangeType: ScaleRangeTypeStr;
  fixedPct: number | null;
  sortOrder: number;
}

export interface DiscretePointData {
  factValue: number;
  executionPct: number;
}

/** Minimal shape required by getLineExecution */
export interface LineForExecution {
  evaluationMethod: EvaluationMethodStr;
  factValue: number | null;
  targetValue: number | null;
  scaleRanges: ScaleRangeData[];
  discretePoints: DiscretePointData[];
}

/** L2 sub-line shape for composite calculations */
export interface L2LineForExecution extends LineForExecution {
  weight: number;
}

/** Shape for calcCardTotal — uses pre-computed executionPct from DB */
export interface CardLineForTotal {
  weight: number;
  executionPct: number | null | "not_found";
}

export interface CardTotalResult {
  /** Weighted sum of execution percentages across all filled lines */
  result: number;
  /** True when every line has a valid (non-null, non-'not_found') executionPct */
  isComplete: boolean;
  /** Sum of weights across all lines */
  totalWeight: number;
  /** True when at least one line lacks a valid executionPct */
  hasUnfilled: boolean;
}

export interface RangeBoundsInUnits {
  fromUnits: number;
  toUnits: number | null;
}

export interface PeriodColumnParams {
  nature: PeriodNatureStr;
  year: number;
  preset: PeriodPresetStr | null;
  dateFrom?: string | null;
  dateTo?: string | null;
  singleDate?: string | null;
}

// ---------------------------------------------------------------------------
// 3.1  Scale execution  (ТЗ раздел 3.1)
// ---------------------------------------------------------------------------

/**
 * Computes execution % for the "scale" evaluation method.
 *
 * - Ranges are sorted by sort_order
 * - Non-last ranges use [from, to) (exclusive upper bound)
 * - Last range uses [from, to] (inclusive upper bound)
 * - range_to = null → treated as +∞
 * - "fixed" type → returns fixedPct
 * - "proportional" type → returns fact/target*100, capped at rangeTo (if set)
 * - No matching range → 0
 */
export function calcScaleExecution(
  factValue: number,
  targetValue: number,
  ranges: ScaleRangeData[]
): number {
  if (ranges.length === 0) return 0;

  const sorted = [...ranges].sort((a, b) => a.sortOrder - b.sortOrder);
  // Round to 6 decimal places to avoid floating-point precision issues
  // e.g. 110/100*100 = 110.00000000000001 should equal 110 for range comparisons
  const rawPct = (factValue / targetValue) * 100;
  const pct = Math.round(rawPct * 1e6) / 1e6;

  for (let i = 0; i < sorted.length; i++) {
    const range = sorted[i];
    const isLast = i === sorted.length - 1;
    const { rangeFrom, rangeTo, rangeType, fixedPct } = range;

    const inRange = isLast
      ? pct >= rangeFrom && (rangeTo === null || pct <= rangeTo)
      : pct >= rangeFrom && (rangeTo === null || pct < rangeTo);

    if (!inRange) continue;

    if (rangeType === "fixed") {
      return fixedPct ?? 0;
    }

    // proportional: return fact/target*100, capped at upper bound
    return rangeTo !== null ? Math.min(pct, rangeTo) : pct;
  }

  return 0;
}

// ---------------------------------------------------------------------------
// 3.2  Binary execution  (ТЗ раздел 3.2)
// ---------------------------------------------------------------------------

/**
 * Returns 100 for fact=1 (Да) and 0 for fact=0 (Нет).
 */
export function calcBinaryExecution(factValue: number): number {
  return factValue === 1 ? 100 : 0;
}

// ---------------------------------------------------------------------------
// 3.3  Discrete execution  (ТЗ раздел 3.3)
// ---------------------------------------------------------------------------

/**
 * Looks up execution % in a discrete points table.
 * Fact is parsed to integer before lookup.
 * Returns 'not_found' if no matching point exists.
 */
export function calcDiscreteExecution(
  factValue: number,
  points: DiscretePointData[]
): number | "not_found" {
  const intFact = Math.trunc(factValue);
  const point = points.find((p) => Math.trunc(p.factValue) === intFact);
  return point ? point.executionPct : "not_found";
}

// ---------------------------------------------------------------------------
// 3.4  Manual execution  (ТЗ раздел 3.4)
// ---------------------------------------------------------------------------

/**
 * For manual method, the fact value IS the execution %.
 * Approver or admin enters the % directly.
 */
export function calcManualExecution(factValue: number): number {
  return factValue;
}

// ---------------------------------------------------------------------------
// Line execution dispatch  (ТЗ раздел 3)
// ---------------------------------------------------------------------------

/**
 * Computes execution % for a single KPI line by dispatching to the
 * appropriate method function.
 *
 * Returns:
 * - number       → valid execution %
 * - null         → factValue is missing (not yet entered) or targetValue
 *                  is missing for methods that require it
 * - 'not_found'  → discrete method, fact not in points table
 */
export function getLineExecution(line: LineForExecution): number | null | "not_found" {
  const { evaluationMethod, factValue, targetValue, scaleRanges, discretePoints } = line;

  if (factValue === null) return null;

  switch (evaluationMethod) {
    case "scale":
      if (targetValue === null) return null;
      return calcScaleExecution(factValue, targetValue, scaleRanges);

    case "binary":
      return calcBinaryExecution(factValue);

    case "discrete":
      return calcDiscreteExecution(factValue, discretePoints);

    case "manual":
      return calcManualExecution(factValue);
  }
}

// ---------------------------------------------------------------------------
// 4.1  Composite — weighted average  (ТЗ раздел 4.1)
// ---------------------------------------------------------------------------

/**
 * Computes L1 execution for weighted composite KPI.
 * % KPI-L1 = Σ (weight_j / 100 × % KPI-L2_j)
 * Sub-lines with null execution contribute 0 to the sum.
 */
export function calcCompositeWeighted(subLines: L2LineForExecution[]): number {
  if (subLines.length === 0) return 0;

  return subLines.reduce((sum, line) => {
    const execution = getLineExecution(line);
    const numericExecution = typeof execution === "number" ? execution : 0;
    return sum + (line.weight / 100) * numericExecution;
  }, 0);
}

// ---------------------------------------------------------------------------
// 4.2  Composite — additive  (ТЗ раздел 4.2)
// ---------------------------------------------------------------------------

/**
 * Computes L1 execution for additive composite KPI.
 * Aggregates: fact_L1 = Σ facts_L2, target_L1 = Σ targets_L2.
 * Then applies the L1's own scale method to the aggregated values.
 * Returns null if all sub-line targets are null.
 */
export function calcCompositeAdditive(
  subLines: L2LineForExecution[],
  l1Method: EvaluationMethodStr,
  l1Ranges: ScaleRangeData[]
): number | null | "not_found" {
  const totalTarget = subLines.reduce((s, l) => s + (l.targetValue ?? 0), 0);
  const totalFact = subLines.reduce((s, l) => s + (l.factValue ?? 0), 0);

  if (totalTarget === 0 && subLines.every((l) => l.targetValue === null)) return null;

  const aggregatedLine: LineForExecution = {
    evaluationMethod: l1Method,
    factValue: totalFact,
    targetValue: totalTarget > 0 ? totalTarget : null,
    scaleRanges: l1Ranges,
    discretePoints: [],
  };

  return getLineExecution(aggregatedLine);
}

// ---------------------------------------------------------------------------
// 5.3  Card total  (ТЗ раздел 5.3)
// ---------------------------------------------------------------------------

/**
 * Computes the overall card execution % from pre-computed line execution values.
 * % карты = Σ (weight_i / 100 × executionPct_i)
 *
 * Lines with executionPct = null or 'not_found' are skipped in the sum
 * but counted in totalWeight. isComplete = false if any unfilled lines exist.
 */
export function calcCardTotal(lines: CardLineForTotal[]): CardTotalResult {
  let result = 0;
  let hasUnfilled = false;
  let totalWeight = 0;

  for (const line of lines) {
    totalWeight += line.weight;

    if (line.executionPct === null || line.executionPct === "not_found") {
      hasUnfilled = true;
      continue;
    }

    result += (line.weight / 100) * line.executionPct;
  }

  return {
    result,
    isComplete: !hasUnfilled,
    totalWeight,
    hasUnfilled,
  };
}

// ---------------------------------------------------------------------------
// 6.4  Reward calculation  (ТЗ раздел 6.4)
// ---------------------------------------------------------------------------

/**
 * Вознаграждение = Оклад × Кол-во окладов × % запускающей цели / 100 × % инд. KPI / 100
 */
export function calcReward(
  baseSalary: number,
  salaryMultiplier: number,
  triggerGoalPct: number,
  individualKpiPct: number
): number {
  return baseSalary * salaryMultiplier * (triggerGoalPct / 100) * (individualKpiPct / 100);
}

// ---------------------------------------------------------------------------
// 9.7  Range bounds in units  (ТЗ раздел 9.7)
// ---------------------------------------------------------------------------

/**
 * Converts scale range bounds from % to actual measurement units.
 * Used in the KPI form to show "[fromUnits — toUnits]" under each range row.
 */
export function calcRangeBoundsInUnits(
  rangeFrom: number,
  rangeTo: number | null,
  targetValue: number
): RangeBoundsInUnits {
  return {
    fromUnits: (targetValue * rangeFrom) / 100,
    toUnits: rangeTo !== null ? (targetValue * rangeTo) / 100 : null,
  };
}

// ---------------------------------------------------------------------------
// 9.4  Period column formatting  (ТЗ раздел 9.4)
// ---------------------------------------------------------------------------

function isoToDisplayDate(iso: string): string {
  // "YYYY-MM-DD" → "DD.MM.YYYY"
  const [year, month, day] = iso.split("-");
  return `${day}.${month}.${year}`;
}

/**
 * Formats a KPI period for display in a table column.
 * - on_date                       → "DD.MM.YYYY"
 * - for_period + year preset      → "2026"
 * - for_period + Q/H preset       → "Q1 2026" / "H2 2026"
 * - for_period + custom           → "DD.MM.YYYY — DD.MM.YYYY"
 */
export function formatPeriodColumn(params: PeriodColumnParams): string {
  const { nature, year, preset, dateFrom, dateTo, singleDate } = params;

  if (nature === "on_date") {
    return singleDate ? isoToDisplayDate(singleDate) : String(year);
  }

  // for_period
  if (preset === "year" || preset === null) {
    return String(year);
  }

  if (preset === "custom") {
    const from = dateFrom ? isoToDisplayDate(dateFrom) : "?";
    const to = dateTo ? isoToDisplayDate(dateTo) : "?";
    return `${from} — ${to}`;
  }

  // Q1–Q4, H1–H2
  return `${preset} ${year}`;
}

// ---------------------------------------------------------------------------
// 7.3  Card status helpers  (ТЗ раздел 7.3)
// ---------------------------------------------------------------------------

/** Returns the Russian display label for a card status. */
export function cardStatusLabel(status: KpiCardStatusStr): string {
  const labels: Record<KpiCardStatusStr, string> = {
    draft: "Черновик",
    active: "Активна",
    pending_approval: "На согласовании",
    approved: "Утверждена",
    returned: "Возвращена",
  };
  return labels[status];
}

/**
 * Returns a Tailwind CSS class string for the status badge color.
 * Colors match the Design Showcase specification (section 8.6 of MASTER_PLAN_V2).
 */
export function cardStatusColor(status: KpiCardStatusStr): string {
  const colors: Record<KpiCardStatusStr, string> = {
    draft: "bg-muted text-muted-foreground",
    active: "bg-blue-500/20 text-blue-400",
    pending_approval: "bg-yellow-500/20 text-yellow-400",
    approved: "bg-green-500/20 text-green-400",
    returned: "bg-red-500/20 text-red-400",
  };
  return colors[status];
}
