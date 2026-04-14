/**
 * Unit tests for src/lib/calculations.ts
 * TDD approach: tests written before implementation.
 * ≥30 tests covering all formulas from sections 3–6 of the Technical Specification.
 */

import { describe, it, expect } from "vitest";
import {
  calcScaleExecution,
  calcBinaryExecution,
  calcDiscreteExecution,
  calcManualExecution,
  getLineExecution,
  calcCompositeWeighted,
  calcCompositeAdditive,
  calcCardTotal,
  calcReward,
  calcRangeBoundsInUnits,
  formatPeriodColumn,
  cardStatusLabel,
  cardStatusColor,
  type ScaleRangeData,
  type DiscretePointData,
  type LineForExecution,
  type L2LineForExecution,
  type CardLineForTotal,
} from "@/lib/calculations";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function makeFixedRange(
  from: number,
  to: number | null,
  fixedPct: number,
  sortOrder = 1
): ScaleRangeData {
  return { rangeFrom: from, rangeTo: to, rangeType: "fixed", fixedPct, sortOrder };
}

function makeProportionalRange(
  from: number,
  to: number | null,
  sortOrder = 1
): ScaleRangeData {
  return { rangeFrom: from, rangeTo: to, rangeType: "proportional", fixedPct: null, sortOrder };
}

function makeDiscretePoint(factValue: number, executionPct: number): DiscretePointData {
  return { factValue, executionPct };
}

// ---------------------------------------------------------------------------
// 3.1 calcScaleExecution
// ---------------------------------------------------------------------------

describe("calcScaleExecution", () => {
  it("returns fixedPct when fact falls in a fixed range", () => {
    const ranges = [makeFixedRange(0, 80, 0), makeFixedRange(80, 100, 80), makeFixedRange(100, null, 100)];
    // fact/target = 90/100 = 90% → in range [80, 100) → fixed 80
    expect(calcScaleExecution(90, 100, ranges)).toBe(80);
  });

  it("returns 0 when fact is below all ranges", () => {
    const ranges = [makeFixedRange(50, 80, 50), makeFixedRange(80, null, 100)];
    // 30/100 = 30% → below range 50 → 0
    expect(calcScaleExecution(30, 100, ranges)).toBe(0);
  });

  it("proportional range returns fact/target*100 when within range", () => {
    const ranges = [makeFixedRange(0, 80, 0, 1), makeProportionalRange(80, 100, 2), makeFixedRange(100, null, 100, 3)];
    // 85/100 = 85% → proportional [80,100) → returns 85
    expect(calcScaleExecution(85, 100, ranges)).toBe(85);
  });

  it("proportional range caps result at rangeTo", () => {
    const ranges = [makeProportionalRange(80, 100, 1)];
    // Fact perfectly at 100%, should be 100
    expect(calcScaleExecution(100, 100, ranges)).toBe(100);
  });

  it("proportional range with null rangeTo (infinity) is uncapped", () => {
    const ranges = [makeProportionalRange(100, null, 1)];
    // 120/100 = 120% → proportional, uncapped → 120
    expect(calcScaleExecution(120, 100, ranges)).toBe(120);
  });

  it("last range is inclusive at upper bound", () => {
    const ranges = [makeFixedRange(80, 100, 80, 1), makeFixedRange(100, 110, 100, 2)];
    // 110/100 = 110% → last range [100, 110] inclusive → 100
    expect(calcScaleExecution(110, 100, ranges)).toBe(100);
  });

  it("non-last range is exclusive at upper bound (to)", () => {
    const ranges = [makeFixedRange(80, 100, 80, 1), makeFixedRange(100, 110, 100, 2)];
    // 100/100 = 100% → NOT in [80,100) since 100 is excluded → falls in [100,110] → 100
    expect(calcScaleExecution(100, 100, ranges)).toBe(100);
  });

  it("picks correct range from multiple ranges", () => {
    const ranges = [
      makeFixedRange(0, 50, 0, 1),
      makeFixedRange(50, 80, 50, 2),
      makeFixedRange(80, 100, 80, 3),
      makeFixedRange(100, null, 100, 4),
    ];
    // 60% → in [50, 80) → 50
    expect(calcScaleExecution(60, 100, ranges)).toBe(50);
  });

  it("returns 0 for empty ranges", () => {
    expect(calcScaleExecution(100, 100, [])).toBe(0);
  });

  it("fact exactly at rangeFrom (inclusive lower bound)", () => {
    const ranges = [makeFixedRange(80, 100, 80, 1), makeFixedRange(100, null, 100, 2)];
    // 80% exactly → in [80, 100) → 80
    expect(calcScaleExecution(80, 100, ranges)).toBe(80);
  });
});

// ---------------------------------------------------------------------------
// 3.2 calcBinaryExecution
// ---------------------------------------------------------------------------

describe("calcBinaryExecution", () => {
  it("returns 100 for fact = 1 (Да)", () => {
    expect(calcBinaryExecution(1)).toBe(100);
  });

  it("returns 0 for fact = 0 (Нет)", () => {
    expect(calcBinaryExecution(0)).toBe(0);
  });
});

// ---------------------------------------------------------------------------
// 3.3 calcDiscreteExecution
// ---------------------------------------------------------------------------

describe("calcDiscreteExecution", () => {
  const points = [
    makeDiscretePoint(1, 50),
    makeDiscretePoint(2, 75),
    makeDiscretePoint(3, 100),
  ];

  it("returns executionPct for exact integer match", () => {
    expect(calcDiscreteExecution(2, points)).toBe(75);
  });

  it("returns 'not_found' when fact has no matching point", () => {
    expect(calcDiscreteExecution(5, points)).toBe("not_found");
  });

  it("parses float to int before lookup (3.7 → 3)", () => {
    expect(calcDiscreteExecution(3.7, points)).toBe(100);
  });

  it("returns 'not_found' for empty points array", () => {
    expect(calcDiscreteExecution(1, [])).toBe("not_found");
  });
});

// ---------------------------------------------------------------------------
// 3.4 calcManualExecution
// ---------------------------------------------------------------------------

describe("calcManualExecution", () => {
  it("returns the fact value directly as execution %", () => {
    expect(calcManualExecution(87.5)).toBe(87.5);
  });

  it("returns 0 for fact = 0", () => {
    expect(calcManualExecution(0)).toBe(0);
  });
});

// ---------------------------------------------------------------------------
// getLineExecution — dispatch by evaluation method
// ---------------------------------------------------------------------------

describe("getLineExecution", () => {
  const scaleRanges: ScaleRangeData[] = [
    makeFixedRange(0, 80, 0, 1),
    makeFixedRange(80, null, 100, 2),
  ];

  const discretePoints: DiscretePointData[] = [makeDiscretePoint(1, 100)];

  const baseLine = (
    method: LineForExecution["evaluationMethod"],
    factValue: number | null,
    targetValue: number | null,
    extra: Partial<LineForExecution> = {}
  ): LineForExecution => ({
    evaluationMethod: method,
    factValue,
    targetValue,
    scaleRanges: [],
    discretePoints: [],
    ...extra,
  });

  it("dispatches to calcScaleExecution for scale method", () => {
    const line = baseLine("scale", 90, 100, { scaleRanges });
    // 90/100=90% → in [80, ∞) → 100
    expect(getLineExecution(line)).toBe(100);
  });

  it("dispatches to calcBinaryExecution for binary method", () => {
    const line = baseLine("binary", 1, null);
    expect(getLineExecution(line)).toBe(100);
  });

  it("dispatches to calcDiscreteExecution for discrete method", () => {
    const line = baseLine("discrete", 1, null, { discretePoints });
    expect(getLineExecution(line)).toBe(100);
  });

  it("dispatches to calcManualExecution for manual method", () => {
    const line = baseLine("manual", 73, null);
    expect(getLineExecution(line)).toBe(73);
  });

  it("returns null when factValue is null", () => {
    const line = baseLine("scale", null, 100, { scaleRanges });
    expect(getLineExecution(line)).toBeNull();
  });

  it("returns null when targetValue is null for scale method", () => {
    const line = baseLine("scale", 90, null, { scaleRanges });
    expect(getLineExecution(line)).toBeNull();
  });
});

// ---------------------------------------------------------------------------
// 4.1 calcCompositeWeighted
// ---------------------------------------------------------------------------

describe("calcCompositeWeighted", () => {
  it("calculates weighted average of L2 line executions", () => {
    const subLines: L2LineForExecution[] = [
      {
        weight: 60,
        evaluationMethod: "manual",
        factValue: 100,
        targetValue: null,
        scaleRanges: [],
        discretePoints: [],
      },
      {
        weight: 40,
        evaluationMethod: "manual",
        factValue: 50,
        targetValue: null,
        scaleRanges: [],
        discretePoints: [],
      },
    ];
    // 0.6 * 100 + 0.4 * 50 = 60 + 20 = 80
    expect(calcCompositeWeighted(subLines)).toBe(80);
  });

  it("returns 0 for empty subLines", () => {
    expect(calcCompositeWeighted([])).toBe(0);
  });

  it("skips sublines with null factValue (treats as 0 contribution)", () => {
    const subLines: L2LineForExecution[] = [
      {
        weight: 50,
        evaluationMethod: "manual",
        factValue: 100,
        targetValue: null,
        scaleRanges: [],
        discretePoints: [],
      },
      {
        weight: 50,
        evaluationMethod: "scale",
        factValue: null,
        targetValue: 100,
        scaleRanges: [],
        discretePoints: [],
      },
    ];
    // second line execution = null → treated as 0
    // 0.5 * 100 + 0.5 * 0 = 50
    expect(calcCompositeWeighted(subLines)).toBe(50);
  });
});

// ---------------------------------------------------------------------------
// 4.2 calcCompositeAdditive
// ---------------------------------------------------------------------------

describe("calcCompositeAdditive", () => {
  it("aggregates L2 facts and targets then applies scale method to L1", () => {
    const subLines: L2LineForExecution[] = [
      {
        weight: 50,
        evaluationMethod: "manual",
        factValue: 40,
        targetValue: 50,
        scaleRanges: [],
        discretePoints: [],
      },
      {
        weight: 50,
        evaluationMethod: "manual",
        factValue: 50,
        targetValue: 50,
        scaleRanges: [],
        discretePoints: [],
      },
    ];
    // aggregated: fact=90, target=100 → 90%
    // L1 method: manual → returns 90
    const l1Ranges: ScaleRangeData[] = [];
    expect(calcCompositeAdditive(subLines, "manual", l1Ranges)).toBe(90);
  });

  it("returns null when all L2 targetValues are null", () => {
    const subLines: L2LineForExecution[] = [
      {
        weight: 100,
        evaluationMethod: "manual",
        factValue: null,
        targetValue: null,
        scaleRanges: [],
        discretePoints: [],
      },
    ];
    expect(calcCompositeAdditive(subLines, "manual", [])).toBeNull();
  });
});

// ---------------------------------------------------------------------------
// 5.3 calcCardTotal
// ---------------------------------------------------------------------------

describe("calcCardTotal", () => {
  const makeLine = (
    weight: number,
    executionPct: number | null | "not_found"
  ): CardLineForTotal => ({ weight, executionPct });

  it("computes correct weighted sum for fully-filled card", () => {
    const lines = [makeLine(60, 100), makeLine(40, 50)];
    // 0.6*100 + 0.4*50 = 60 + 20 = 80
    const result = calcCardTotal(lines);
    expect(result.result).toBe(80);
    expect(result.isComplete).toBe(true);
    expect(result.hasUnfilled).toBe(false);
  });

  it("marks isComplete=false when any line has null executionPct", () => {
    const lines = [makeLine(60, 100), makeLine(40, null)];
    const result = calcCardTotal(lines);
    expect(result.isComplete).toBe(false);
    expect(result.hasUnfilled).toBe(true);
  });

  it("marks isComplete=false when any line has 'not_found' executionPct", () => {
    const lines = [makeLine(60, 100), makeLine(40, "not_found")];
    const result = calcCardTotal(lines);
    expect(result.isComplete).toBe(false);
    expect(result.hasUnfilled).toBe(true);
  });

  it("returns result=0 and isComplete=true for empty lines", () => {
    const result = calcCardTotal([]);
    expect(result.result).toBe(0);
    expect(result.isComplete).toBe(true);
    expect(result.totalWeight).toBe(0);
  });

  it("sums totalWeight correctly", () => {
    const lines = [makeLine(60, 80), makeLine(40, 90)];
    const result = calcCardTotal(lines);
    expect(result.totalWeight).toBe(100);
  });

  it("excludes unfilled lines from result computation but includes their weight in totalWeight", () => {
    const lines = [makeLine(60, 80), makeLine(40, null)];
    // Only line 1 contributes: 0.6*80 = 48
    const result = calcCardTotal(lines);
    expect(result.result).toBe(48);
    expect(result.totalWeight).toBe(100);
  });
});

// ---------------------------------------------------------------------------
// 6.4 calcReward
// ---------------------------------------------------------------------------

describe("calcReward", () => {
  it("computes reward correctly: baseSalary × multiplier × triggerPct/100 × kpiPct/100", () => {
    // 100_000 × 3 × 0.9 × 0.85 = 229_500
    expect(calcReward(100_000, 3, 90, 85)).toBeCloseTo(229_500);
  });

  it("returns 0 when triggerGoalPct is 0", () => {
    expect(calcReward(100_000, 3, 0, 100)).toBe(0);
  });

  it("returns 0 when individualKpiPct is 0", () => {
    expect(calcReward(100_000, 3, 100, 0)).toBe(0);
  });

  it("returns 0 when baseSalary is 0", () => {
    expect(calcReward(0, 3, 100, 100)).toBe(0);
  });
});

// ---------------------------------------------------------------------------
// calcRangeBoundsInUnits
// ---------------------------------------------------------------------------

describe("calcRangeBoundsInUnits", () => {
  it("converts % bounds to unit values based on targetValue", () => {
    // target=1_000_000, range [80%, 100%] → [800_000, 1_000_000]
    const result = calcRangeBoundsInUnits(80, 100, 1_000_000);
    expect(result.fromUnits).toBe(800_000);
    expect(result.toUnits).toBe(1_000_000);
  });

  it("returns null toUnits when rangeTo is null (∞)", () => {
    const result = calcRangeBoundsInUnits(100, null, 500_000);
    expect(result.fromUnits).toBe(500_000);
    expect(result.toUnits).toBeNull();
  });
});

// ---------------------------------------------------------------------------
// formatPeriodColumn
// ---------------------------------------------------------------------------

describe("formatPeriodColumn", () => {
  it("formats on_date as DD.MM.YYYY", () => {
    expect(
      formatPeriodColumn({ nature: "on_date", year: 2026, preset: null, singleDate: "2026-12-31" })
    ).toBe("31.12.2026");
  });

  it("formats for_period + year preset as year only", () => {
    expect(
      formatPeriodColumn({ nature: "for_period", year: 2026, preset: "year" })
    ).toBe("2026");
  });

  it("formats for_period + Q preset as 'Q1 2026'", () => {
    expect(
      formatPeriodColumn({ nature: "for_period", year: 2026, preset: "Q1" })
    ).toBe("Q1 2026");
  });

  it("formats for_period + H preset as 'H2 2026'", () => {
    expect(
      formatPeriodColumn({ nature: "for_period", year: 2026, preset: "H2" })
    ).toBe("H2 2026");
  });

  it("formats custom period as 'DD.MM.YYYY — DD.MM.YYYY'", () => {
    expect(
      formatPeriodColumn({
        nature: "for_period",
        year: 2026,
        preset: "custom",
        dateFrom: "2026-01-01",
        dateTo: "2026-03-31",
      })
    ).toBe("01.01.2026 — 31.03.2026");
  });
});

// ---------------------------------------------------------------------------
// cardStatusLabel / cardStatusColor
// ---------------------------------------------------------------------------

describe("cardStatusLabel", () => {
  it("returns correct Russian label for each status", () => {
    expect(cardStatusLabel("draft")).toBe("Черновик");
    expect(cardStatusLabel("active")).toBe("Активна");
    expect(cardStatusLabel("pending_approval")).toBe("На согласовании");
    expect(cardStatusLabel("approved")).toBe("Утверждена");
    expect(cardStatusLabel("returned")).toBe("Возвращена");
  });
});

describe("cardStatusColor", () => {
  it("returns a non-empty CSS class string for each status", () => {
    const statuses = ["draft", "active", "pending_approval", "approved", "returned"] as const;
    for (const status of statuses) {
      expect(cardStatusColor(status).length).toBeGreaterThan(0);
    }
  });
});
