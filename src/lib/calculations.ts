/**
 * KPI calculation engine.
 * ALL formula logic lives here — no calculation in components or hooks.
 *
 * Stage 1 stub — formulas will be implemented in Stage 3 per the technical specification.
 */

export type KpiWeight = number; // 0–100, sum across card must equal 100
export type KpiActual = number;
export type KpiTarget = number;

export interface KpiLineInput {
  weight: KpiWeight;
  target: KpiTarget;
  actual: KpiActual;
  /** Minimum threshold (% of target) below which score = 0 */
  thresholdPct: number;
  /** % of target at which score = 100% */
  maxPct: number;
}

export interface KpiLineResult {
  achievementPct: number; // actual / target * 100
  scorePct: number; // clamped, interpolated
  weightedScore: number; // scorePct * weight / 100
}

/**
 * Placeholder — будет реализовано в Stage 3.
 */
export function calculateKpiLine(_input: KpiLineInput): KpiLineResult {
  return { achievementPct: 0, scorePct: 0, weightedScore: 0 };
}

/**
 * Placeholder — суммарный балл карты (0–100).
 */
export function calculateCardScore(_lines: KpiLineResult[]): number {
  return 0;
}

/**
 * Placeholder — расчёт вознаграждения.
 */
export function calculateReward(_cardScore: number, _baseSalary: number): number {
  return 0;
}
