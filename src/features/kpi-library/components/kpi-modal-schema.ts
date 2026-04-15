/**
 * Zod schema + inferred types for the KPI library modal form.
 * Used by KpiModal and all sub-editor components.
 * Source of truth: KPI_System_Technical_Specification.md section 9.
 */

import { z } from "zod";

// ---------------------------------------------------------------------------
// Scale range row
// ---------------------------------------------------------------------------

export const scaleRangeRowSchema = z.object({
  id: z.string().optional(),
  rangeFrom: z.number({ message: "Введите число" }),
  rangeTo: z.number().nullable().optional(),
  rangeType: z.enum(["fixed", "proportional"]),
  fixedPct: z.number().nullable().optional(),
  sortOrder: z.number().default(0),
});

// ---------------------------------------------------------------------------
// Discrete point row
// ---------------------------------------------------------------------------

export const discretePointRowSchema = z.object({
  id: z.string().optional(),
  factValue: z.number({ message: "Введите целое число" }).int(),
  executionPct: z.number({ message: "Введите процент" }),
  sortOrder: z.number().default(0),
});

// ---------------------------------------------------------------------------
// Property row
// ---------------------------------------------------------------------------

export const propertyRowSchema = z.object({
  id: z.string().optional(),
  dictionaryId: z.string().min(1),
  valueId: z.string().min(1),
});

// ---------------------------------------------------------------------------
// Main KPI form schema
// ---------------------------------------------------------------------------

export const kpiFormSchema = z.object({
  name: z.string().min(1, "Введите название KPI"),
  description: z.string().nullable().optional(),
  unit: z.string().min(1, "Выберите единицу измерения"),
  evaluationMethod: z.enum(["scale", "binary", "discrete", "manual"]),
  periodYear: z
    .number({ message: "Введите год" })
    .int()
    .min(2020, "Год не ранее 2020")
    .max(2099, "Год не позднее 2099"),
  periodNature: z.enum(["for_period", "on_date"]),
  periodPreset: z
    .enum(["Q1", "Q2", "Q3", "Q4", "H1", "H2", "year", "custom"])
    .nullable()
    .optional(),
  periodDateFrom: z.string().nullable().optional(),
  periodDateTo: z.string().nullable().optional(),
  periodSingleDate: z.string().nullable().optional(),
  targetValue: z.number().nullable().optional(),
  scaleRanges: z.array(scaleRangeRowSchema).default([]),
  discretePoints: z.array(discretePointRowSchema).default([]),
  properties: z.array(propertyRowSchema).default([]),
});

export type KpiFormValues = z.infer<typeof kpiFormSchema>;

// ---------------------------------------------------------------------------
// Default values for a new KPI form
// ---------------------------------------------------------------------------

export const defaultKpiFormValues: KpiFormValues = {
  name: "",
  description: null,
  unit: "",
  evaluationMethod: "scale",
  periodYear: new Date().getFullYear(),
  periodNature: "for_period",
  periodPreset: null,
  periodDateFrom: null,
  periodDateTo: null,
  periodSingleDate: null,
  targetValue: null,
  scaleRanges: [],
  discretePoints: [],
  properties: [],
};
